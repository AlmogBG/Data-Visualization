const { spawn } = require("child_process");
const http = require("http");

const TEST_PORT = process.env.TEST_PORT || "5001";
const TEST_BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(`${TEST_BASE_URL}/health`, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        resolve(res.statusCode === 200 && body.includes("ok"));
      });
    });

    req.on("error", () => {
      resolve(false);
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer() {
  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ready = await checkHealth();

    if (ready) {
      console.log(`Test server is ready on ${TEST_BASE_URL}`);
      return;
    }

    console.log(`Waiting for test server... attempt ${attempt}/${maxAttempts}`);
    await wait(1000);
  }

  throw new Error("Test server did not start in time");
}

function runApiSmokeTests() {
  return new Promise((resolve, reject) => {
    const testProcess = spawn("node", ["tests/apiSmokeTest.js"], {
      stdio: "inherit",
      env: {
        ...process.env,
        TEST_BASE_URL,
      },
    });

    testProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`API smoke tests failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  console.log("Starting temporary backend test server...");
  console.log(`PORT=${TEST_PORT}`);
  console.log(`TEST_BASE_URL=${TEST_BASE_URL}`);

  const serverProcess = spawn("node", ["index.js"], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: TEST_PORT,
      NODE_ENV: "test",
    },
  });

  function stopServer() {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");
    }
  }

  process.on("SIGINT", () => {
    stopServer();
    process.exit(1);
  });

  process.on("SIGTERM", () => {
    stopServer();
    process.exit(1);
  });

  try {
    await waitForServer();
    await runApiSmokeTests();

    console.log("All API tests passed successfully.");
    stopServer();
    process.exit(0);
  } catch (error) {
    console.error("Test run failed:");
    console.error(error.message);

    stopServer();
    process.exit(1);
  }
}

main();