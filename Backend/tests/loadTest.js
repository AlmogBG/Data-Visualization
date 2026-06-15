"use strict";

require("dotenv").config();

const jwt = require("jsonwebtoken");
const { performance } = require("node:perf_hooks");

const BASE_URL =
  process.env.LOAD_TEST_BASE_URL ||
  "http://127.0.0.1:5000";

const REQUEST_TIMEOUT_MS = 5000;

/*
 * מגבלת בטיחות:
 * ברירת המחדל מאפשרת בדיקה רק מול localhost.
 * כך לא ניתן להפעיל בטעות עומס על מערכת חיצונית.
 */
function validateTarget() {
  const target = new URL(BASE_URL);

  const allowedHosts = new Set([
    "127.0.0.1",
    "localhost",
    "::1",
  ]);

  if (!allowedHosts.has(target.hostname)) {
    throw new Error(
      `Load test blocked: ${target.hostname} is not a local target`
    );
  }
}

function createManagerToken() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing from the server environment"
    );
  }

  return jwt.sign(
    {
      username: "load-test-manager",
      idNumber: "load-test-001",
      role: "Manager",
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "10m",
    }
  );
}

function percentile(values, percentage) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort(
    (first, second) => first - second
  );

  const index = Math.min(
    sorted.length - 1,
    Math.ceil(
      (percentage / 100) * sorted.length
    ) - 1
  );

  return sorted[index];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

async function sendRequest({
  url,
  expectedStatus,
  token,
}) {
  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const startedAt =
    performance.now();

  try {
    const headers = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    /*
     * קוראים את גוף התגובה כדי שהבקשה
     * תושלם במלואה לפני מדידת הזמן.
     */
    await response.text();

    const latency =
      performance.now() - startedAt;

    return {
      success:
        response.status ===
        expectedStatus,

      status: response.status,
      latency,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,

      latency:
        performance.now() -
        startedAt,

      error:
        error.name === "AbortError"
          ? "Request timeout"
          : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runScenario({
  name,
  path,
  totalRequests,
  concurrency,
  expectedStatus,
  token,
  maximumP95,
}) {
  console.log("");
  console.log("===================================");
  console.log(`Starting: ${name}`);
  console.log(`URL: ${BASE_URL}${path}`);
  console.log(`Requests: ${totalRequests}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log("===================================");

  const results = [];
  let currentRequest = 0;

  const startedAt =
    performance.now();

  async function worker() {
    while (true) {
      const requestNumber =
        currentRequest;

      currentRequest += 1;

      if (
        requestNumber >=
        totalRequests
      ) {
        return;
      }

      const result =
        await sendRequest({
          url: `${BASE_URL}${path}`,
          expectedStatus,
          token,
        });

      results.push(result);
    }
  }

  const workers =
    Array.from(
      { length: concurrency },
      () => worker()
    );

  await Promise.all(workers);

  const totalDuration =
    performance.now() - startedAt;

  const successful =
    results.filter(
      (result) => result.success
    );

  const failed =
    results.filter(
      (result) => !result.success
    );

  const rateLimited =
    results.filter(
      (result) =>
        result.status === 429
    ).length;

  const latencies =
    results.map(
      (result) => result.latency
    );

  const averageLatency =
    latencies.length > 0
      ? latencies.reduce(
          (sum, latency) =>
            sum + latency,
          0
        ) / latencies.length
      : 0;

  const p95Latency =
    percentile(latencies, 95);

  const maximumLatency =
    latencies.length > 0
      ? Math.max(...latencies)
      : 0;

  const requestsPerSecond =
    totalDuration > 0
      ? totalRequests /
        (totalDuration / 1000)
      : 0;

  const successRate =
    totalRequests > 0
      ? (successful.length /
          totalRequests) *
        100
      : 0;

  const passed =
    failed.length === 0 &&
    successRate >= 99 &&
    p95Latency <= maximumP95;

  const statusCounts = {};

  for (const result of results) {
    const statusKey =
      result.status === 0
        ? "NETWORK_ERROR"
        : String(result.status);

    statusCounts[statusKey] =
      (statusCounts[statusKey] || 0) +
      1;
  }

  console.table({
    Scenario: name,
    Requests: totalRequests,
    Concurrency: concurrency,
    Successful: successful.length,
    Failed: failed.length,
    "Success rate": `${round(
      successRate
    )}%`,
    "Average latency": `${round(
      averageLatency
    )} ms`,
    "P95 latency": `${round(
      p95Latency
    )} ms`,
    "Maximum latency": `${round(
      maximumLatency
    )} ms`,
    "Requests/second": round(
      requestsPerSecond
    ),
    "HTTP 429": rateLimited,
    Result: passed
      ? "PASSED"
      : "FAILED",
  });

  console.log(
    "Status distribution:",
    statusCounts
  );

  if (failed.length > 0) {
    const failureExamples =
      failed.slice(0, 5).map(
        (result) => ({
          status: result.status,
          error:
            result.error || "Unexpected status",
          latency: `${round(
            result.latency
          )} ms`,
        })
      );

    console.log(
      "Failure examples:"
    );

    console.table(
      failureExamples
    );
  }

  return {
    name,
    passed,
    successful:
      successful.length,
    failed: failed.length,
    successRate,
    averageLatency,
    p95Latency,
    maximumLatency,
    requestsPerSecond,
    rateLimited,
  };
}

async function verifyServer() {
  console.log(
    `Checking backend availability at ${BASE_URL}/health`
  );

  const result =
    await sendRequest({
      url: `${BASE_URL}/health`,
      expectedStatus: 200,
    });

  if (!result.success) {
    throw new Error(
      `Backend health check failed. Status: ${result.status}. Error: ${
        result.error || "Unexpected response"
      }`
    );
  }

  console.log(
    "Backend health check passed"
  );
}

async function main() {
  validateTarget();
  await verifyServer();

  const managerToken =
    createManagerToken();

  /*
   * בדיקה ראשונה:
   * עומס בסיסי על נתיב ציבורי ללא מסד נתונים.
   */
  const healthResult =
    await runScenario({
      name: "Public health endpoint",
      path: "/health",

      totalRequests: 100,
      concurrency: 10,

      expectedStatus: 200,
      token: null,

      maximumP95: 1000,
    });

  /*
   * בדיקה שנייה:
   * עומס מתון על JWT, RBAC ומסד הנתונים.
   *
   * הנתיב הוא קריאה בלבד ואינו משנה נתונים.
   */
  const securityResult =
    await runScenario({
      name: "Protected SIEM overview",
      path:
        "/api/security/overview",

      totalRequests: 40,
      concurrency: 4,

      expectedStatus: 200,
      token: managerToken,

      maximumP95: 3000,
    });

  const allResults = [
    healthResult,
    securityResult,
  ];

  console.log("");
  console.log("===================================");
  console.log("FINAL LOAD TEST SUMMARY");
  console.log("===================================");

  console.table(
    allResults.map((result) => ({
      Scenario: result.name,

      Success:
        `${round(
          result.successRate
        )}%`,

      "Average ms":
        round(
          result.averageLatency
        ),

      "P95 ms":
        round(
          result.p95Latency
        ),

      "Requests/sec":
        round(
          result.requestsPerSecond
        ),

      Failed:
        result.failed,

      Result:
        result.passed
          ? "PASSED"
          : "FAILED",
    }))
  );

  const failedScenarios =
    allResults.filter(
      (result) =>
        !result.passed
    );

  if (failedScenarios.length > 0) {
    console.error(
      "Load test failed. One or more scenarios did not meet the thresholds."
    );

    process.exit(1);
  }

  console.log(
    "All load-test scenarios passed successfully."
  );

  process.exit(0);
}

main().catch((error) => {
  console.error("Load test failed:");
  console.error(error.message);
  process.exit(1);
});