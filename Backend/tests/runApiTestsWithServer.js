"use strict";

require("dotenv").config();

const {
  spawn,
} = require("child_process");

const {
  once,
} = require("events");

const http = require("http");

const {
  PrismaClient,
} = require("@prisma/client");

const TEST_PORT =
  process.env.TEST_PORT ||
  "5001";

const TEST_BASE_URL =
  `http://127.0.0.1:${TEST_PORT}`;

const TEST_JWT_SECRET =
  "deployment-integration-test-secret-not-for-production";

let serverProcess = null;

function wait(milliseconds) {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

async function verifyDatabaseConnection() {
  const prisma =
    new PrismaClient();

  try {
    await prisma.$queryRaw`
      SELECT 1
    `;

    console.log(
      "Database connection check passed"
    );
  } catch (error) {
    throw new Error(
      `Database connection check failed: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

function checkHealth() {
  return new Promise(
    (resolve) => {
      const request =
        http.get(
          `${TEST_BASE_URL}/health`,

          (response) => {
            let body = "";

            response.on(
              "data",
              (chunk) => {
                body += chunk;
              }
            );

            response.on(
              "end",
              () => {
                resolve(
                  response.statusCode ===
                    200 &&
                    body.includes(
                      "ok"
                    )
                );
              }
            );
          }
        );

      request.on(
        "error",
        () => {
          resolve(false);
        }
      );

      request.setTimeout(
        1000,
        () => {
          request.destroy();
          resolve(false);
        }
      );
    }
  );
}

async function waitForServer() {
  const maxAttempts = 30;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt += 1
  ) {
    const ready =
      await checkHealth();

    if (ready) {
      console.log(
        `Temporary backend is ready on ${TEST_BASE_URL}`
      );

      return;
    }

    console.log(
      `Waiting for temporary backend: ${attempt}/${maxAttempts}`
    );

    await wait(1000);
  }

  throw new Error(
    "Temporary backend did not become ready"
  );
}

function runApiSmokeTests() {
  return new Promise(
    (resolve, reject) => {
      const testProcess =
        spawn(
          "node",
          [
            "tests/apiSmokeTest.js",
          ],
          {
            stdio: "inherit",

            env: {
              ...process.env,

              NODE_ENV:
                "integration-test",

              TEST_BASE_URL,

              JWT_SECRET:
                TEST_JWT_SECRET,
            },
          }
        );

      testProcess.on(
        "error",
        reject
      );

      testProcess.on(
        "close",
        (exitCode) => {
          if (exitCode === 0) {
            resolve();
            return;
          }

          reject(
            new Error(
              `API integration tests exited with code ${exitCode}`
            )
          );
        }
      );
    }
  );
}

async function stopServer() {
  if (
    !serverProcess ||
    serverProcess.killed
  ) {
    return;
  }

  serverProcess.kill(
    "SIGTERM"
  );

  const closed =
    once(
      serverProcess,
      "close"
    );

  await Promise.race([
    closed,
    wait(3000),
  ]);

  if (
    serverProcess.exitCode ===
      null &&
    !serverProcess.killed
  ) {
    serverProcess.kill(
      "SIGKILL"
    );
  }
}

async function main() {
  console.log(
    "Starting deployment integration tests"
  );

  console.log(
    `Temporary port: ${TEST_PORT}`
  );

  console.log(
    `Temporary URL: ${TEST_BASE_URL}`
  );

  /*
   * לפני הפעלת השרת הזמני מוודאים
   * שמסד הנתונים של סביבת הפריסה זמין.
   */
  await verifyDatabaseConnection();

  serverProcess =
    spawn(
      "node",
      ["index.js"],
      {
        stdio: "inherit",

        env: {
          ...process.env,

          PORT: TEST_PORT,

          NODE_ENV:
            "integration-test",

          JWT_SECRET:
            TEST_JWT_SECRET,
        },
      }
    );

  serverProcess.on(
    "error",
    (error) => {
      console.error(
        "Temporary backend process error:",
        error.message
      );
    }
  );

  const terminate =
    async () => {
      await stopServer();
      process.exit(1);
    };

  process.once(
    "SIGINT",
    terminate
  );

  process.once(
    "SIGTERM",
    terminate
  );

  try {
    await waitForServer();

    await runApiSmokeTests();

    console.log(
      "All deployment integration tests passed"
    );

    await stopServer();

    process.exit(0);
  } catch (error) {
    console.error(
      "Deployment integration tests failed"
    );

    console.error(
      error.message
    );

    await stopServer();

    process.exit(1);
  }
}

main().catch(
  async (error) => {
    console.error(
      "Unexpected test runner error:"
    );

    console.error(
      error.message
    );

    await stopServer();

    process.exit(1);
  }
);