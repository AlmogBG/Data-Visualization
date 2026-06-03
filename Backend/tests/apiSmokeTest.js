const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:5001";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson({ method = "GET", path, expectedStatus = 200 }) {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";

  assert(
    response.status === expectedStatus,
    `Expected status ${expectedStatus}, received ${response.status}`
  );

  assert(
    contentType.includes("application/json"),
    `Expected JSON response, received content-type: ${contentType || "empty"}`
  );

  return response.json();
}

const tests = [
  {
    name: "Health check returns server status",
    path: "/health",
    expectedStatus: 200,
    validate: (data) => {
      assert(isObject(data), "Health response must be an object");
      assert(data.status === "ok", "Health status must be ok");
      assert(typeof data.message === "string", "Health message must be string");
    },
  },
  {
    name: "Home summary returns dashboard KPI fields",
    path: "/api/home/summary",
    expectedStatus: 200,
    validate: (data) => {
      assert(isObject(data), "Home summary must be an object");

      const numericFields = [
        "totalLeads",
        "newLeads",
        "leadsInProgress",
        "closedLeads",
        "totalSales",
        "newSales",
        "refunds",
        "conversionRate",
        "totalMeetings",
        "todayMeetings",
        "futureMeetings",
        "canceledMeetings",
      ];

      for (const field of numericFields) {
        assert(
          typeof data[field] === "number",
          `Home summary field ${field} must be a number`
        );
      }

      assert(isObject(data.trends), "Home summary trends must be an object");
    },
  },
  {
    name: "Consultation form options returns departments and cities",
    path: "/api/form/options",
    expectedStatus: 200,
    validate: (data) => {
      assert(isObject(data), "Form options response must be an object");
      assert(data.ok === true, "Form options ok must be true");
      assert(Array.isArray(data.departments), "Departments must be an array");
      assert(Array.isArray(data.cities), "Cities must be an array");
    },
  },
  {
    name: "Cities statistics returns city rows array",
    path: "/api/stats/cities",
    expectedStatus: 200,
    validate: (data) => {
      assert(Array.isArray(data), "Cities statistics must be an array");

      for (const row of data) {
        assert(typeof row.town === "string", "City row town must be string");
        assert(typeof row.count === "number", "City row count must be number");
        assert(typeof row.region === "string", "City row region must be string");
      }
    },
  },
  {
    name: "Anomalies API returns anomalies array",
    path: "/api/stats/anomalies",
    expectedStatus: 200,
    validate: (data) => {
      assert(isObject(data), "Anomalies response must be an object");
      assert(Array.isArray(data.anomalies), "Anomalies must be an array");
    },
  },
  {
    name: "Report 1 comparison returns comparison rows",
    path: "/api/report1/comparison",
    expectedStatus: 200,
    validate: (data) => {
      assert(isObject(data), "Report 1 response must be an object");
      assert(typeof data.yearA === "string", "Report 1 yearA must be string");
      assert(typeof data.yearB === "string", "Report 1 yearB must be string");
      assert(Array.isArray(data.months), "Report 1 months must be an array");
      assert(Array.isArray(data.rows), "Report 1 rows must be an array");
    },
  },
  {
    name: "Report 1 invalid year returns 400",
    path: "/api/report1/comparison?yearA=INVALID&yearB=תשפ״ה",
    expectedStatus: 400,
    validate: (data) => {
      assert(isObject(data), "Report 1 error response must be an object");
      assert(typeof data.message === "string", "Report 1 error message must be string");
    },
  },
  {
    name: "Report 2 comparison returns department rows",
    path: "/api/report2/comparison",
    expectedStatus: 200,
    validate: (data) => {
      assert(isObject(data), "Report 2 response must be an object");
      assert(Array.isArray(data.rows), "Report 2 rows must be an array");

      for (const row of data.rows) {
        assert(typeof row.department === "string", "Report 2 department must be string");
        assert(typeof row.yearA === "number", "Report 2 yearA must be number");
        assert(typeof row.yearB === "number", "Report 2 yearB must be number");
      }
    },
  },
  {
    name: "Report 2 invalid year returns 400",
    path: "/api/report2/comparison?yearA=INVALID&yearB=תשפ״ה",
    expectedStatus: 400,
    validate: (data) => {
      assert(isObject(data), "Report 2 error response must be an object");
      assert(typeof data.message === "string", "Report 2 error message must be string");
    },
  },
  {
    name: "Report 4 monthly returns monthly consultation rows",
    path: "/api/report4/monthly",
    expectedStatus: 200,
    validate: (data) => {
      assert(Array.isArray(data), "Report 4 monthly must be an array");

      for (const row of data) {
        assert(typeof row.month === "string", "Report 4 monthly month must be string");
        assert(typeof row.label === "string", "Report 4 monthly label must be string");
        assert(typeof row.invitedAshdod === "number", "invitedAshdod must be number");
        assert(typeof row.invitedBeer === "number", "invitedBeer must be number");
        assert(typeof row.attendedAshdod === "number", "attendedAshdod must be number");
        assert(typeof row.attendedBeer === "number", "attendedBeer must be number");
      }
    },
  },
  {
    name: "Report 4 outcomes returns outcomes by campus",
    path: "/api/report4/outcomes",
    expectedStatus: 200,
    validate: (data) => {
      assert(isObject(data), "Report 4 outcomes must be an object");
      assert(isObject(data.ASHDOD), "Report 4 outcomes must include ASHDOD");
      assert(isObject(data.BEER_SHEVA), "Report 4 outcomes must include BEER_SHEVA");
      assert(Array.isArray(data.ASHDOD.items), "ASHDOD items must be an array");
      assert(Array.isArray(data.BEER_SHEVA.items), "BEER_SHEVA items must be an array");
    },
  },
  {
    name: "Report 5 media returns media sources array",
    path: "/api/report5/media",
    expectedStatus: 200,
    validate: (data) => {
      assert(Array.isArray(data), "Report 5 media must be an array");

      for (const row of data) {
        assert(typeof row.name === "string", "Report 5 media name must be string");
        assert(typeof row.gross === "number", "Report 5 gross must be number");
        assert(typeof row.qualified === "number", "Report 5 qualified must be number");
        assert(typeof row.color === "string", "Report 5 color must be string");
      }
    },
  },
  {
    name: "Report 5 invalid year returns 400",
    path: "/api/report5/media?year=INVALID",
    expectedStatus: 400,
    validate: (data) => {
      assert(isObject(data), "Report 5 error response must be an object");
      assert(typeof data.message === "string", "Report 5 error message must be string");
    },
  },
];

async function runSmokeTests() {
  console.log("Starting professional API smoke tests...");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("-----------------------------------");

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const data = await requestJson({
        method: test.method || "GET",
        path: test.path,
        expectedStatus: test.expectedStatus || 200,
      });

      test.validate(data);

      passed++;
      console.log(`PASSED: ${test.name}`);
      console.log(`Path: ${test.path}`);
      console.log("-----------------------------------");
    } catch (error) {
      failed++;
      console.log(`FAILED: ${test.name}`);
      console.log(`Path: ${test.path}`);
      console.log(`Error: ${error.message}`);
      console.log("-----------------------------------");
    }
  }

  console.log("API smoke tests completed");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }

  process.exit(0);
}

runSmokeTests();