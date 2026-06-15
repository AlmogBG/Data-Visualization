"use strict";

const jwt = require("jsonwebtoken");

const BASE_URL =
  process.env.TEST_BASE_URL ||
  "http://127.0.0.1:5001";

const JWT_SECRET =
  process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "JWT_SECRET is required for integration tests"
  );

  process.exit(1);
}

function createToken({
  username,
  idNumber,
  role,
}) {
  return jwt.sign(
    {
      username,
      idNumber,
      role,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "10m",
    }
  );
}

const managerToken =
  createToken({
    username:
      "deployment-test-manager",

    idNumber:
      "deployment-manager-001",

    role: "Manager",
  });

const employeeToken =
  createToken({
    username:
      "deployment-test-employee",

    idNumber:
      "deployment-employee-001",

    role:
      "Management Employee",
  });

function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validateError(
  data,
  label
) {
  assert(
    isObject(data),
    `${label} must be an object`
  );

  const hasMessage =
    typeof data.message === "string" ||
    typeof data.error === "string";

  assert(
    hasMessage,
    `${label} must include an error message`
  );
}

async function requestJson({
  path,
  method = "GET",
  token,
  expectedStatus = 200,
  body,
}) {
  const url = new URL(
    path,
    `${BASE_URL}/`
  );

  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response =
    await fetch(url, {
      method,
      headers,

      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    });

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  const responseText =
    await response.text();

  let data = null;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    try {
      data =
        responseText.length > 0
          ? JSON.parse(responseText)
          : {};
    } catch {
      throw new Error(
        `Response from ${path} is not valid JSON`
      );
    }
  } else {
    throw new Error(
      `Expected JSON from ${path}, received ${
        contentType || "empty content-type"
      }. Body: ${responseText}`
    );
  }

  assert(
    response.status ===
      expectedStatus,

    `Expected ${expectedStatus} from ${path}, received ${
      response.status
    }. Response: ${JSON.stringify(
      data
    )}`
  );

  return data;
}

const tests = [
  {
    name:
      "Public health endpoint returns 200",

    path: "/health",

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Health response must be an object"
      );

      assert(
        data.status === "ok",
        "Health status must be ok"
      );
    },
  },

  {
    name:
      "Protected report rejects missing JWT",

    path:
      "/api/report1/comparison",

    expectedStatus: 401,

    validate(data) {
      validateError(
        data,
        "Missing JWT response"
      );
    },
  },

  {
    name:
      "Protected report rejects invalid JWT",

    path:
      "/api/report1/comparison",

    token:
      "invalid.jwt.token",

    expectedStatus: 401,

    validate(data) {
      validateError(
        data,
        "Invalid JWT response"
      );
    },
  },

  {
    name:
      "Management Employee cannot access Report 1",

    path:
      "/api/report1/comparison",

    token: employeeToken,

    expectedStatus: 403,

    validate(data) {
      validateError(
        data,
        "Report 1 authorization response"
      );
    },
  },

  {
    name:
      "Management Employee cannot access SIEM",

    path:
      "/api/security/overview",

    token: employeeToken,

    expectedStatus: 403,

    validate(data) {
      validateError(
        data,
        "SIEM authorization response"
      );
    },
  },

  {
    name:
      "Manager can read home summary",

    path:
      "/api/home/summary",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Home summary must be an object"
      );

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

      for (
        const field of numericFields
      ) {
        assert(
          typeof data[field] ===
            "number",

          `Home field ${field} must be a number`
        );
      }
    },
  },

  {
    name:
      "Management Employee can read home summary",

    path:
      "/api/home/summary",

    token: employeeToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Home summary must be an object"
      );
    },
  },

  {
    name:
      "Management Employee can read consultation options",

    path:
      "/api/form/options",

    token: employeeToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Form options must be an object"
      );

      assert(
        Array.isArray(
          data.departments
        ),
        "Departments must be an array"
      );

      assert(
        Array.isArray(
          data.cities
        ),
        "Cities must be an array"
      );
    },
  },

  {
    name:
      "Manager can read city statistics",

    path:
      "/api/stats/cities",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        Array.isArray(data),
        "City statistics must be an array"
      );
    },
  },

  {
    name:
      "Management Employee cannot read city statistics",

    path:
      "/api/stats/cities",

    token: employeeToken,

    expectedStatus: 403,

    validate(data) {
      validateError(
        data,
        "City authorization response"
      );
    },
  },

  {
    name:
      "Management Employee can read anomalies",

    path:
      "/api/stats/anomalies",

    token: employeeToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Anomalies response must be an object"
      );

      assert(
        Array.isArray(
          data.anomalies
        ),
        "Anomalies must be an array"
      );
    },
  },

  {
    name:
      "Manager can read Report 1",

    path:
      "/api/report1/comparison",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Report 1 must be an object"
      );

      assert(
        Array.isArray(data.rows),
        "Report 1 rows must be an array"
      );
    },
  },

  {
    name:
      "Report 1 validates invalid year after JWT authentication",

    path:
      "/api/report1/comparison?yearA=INVALID&yearB=תשפ״ה",

    token: managerToken,

    expectedStatus: 400,

    validate(data) {
      validateError(
        data,
        "Report 1 validation response"
      );
    },
  },

  {
    name:
      "Manager can read Report 2",

    path:
      "/api/report2/comparison",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Report 2 must be an object"
      );

      assert(
        Array.isArray(data.rows),
        "Report 2 rows must be an array"
      );
    },
  },

  {
    name:
      "Report 2 validates invalid year after JWT authentication",

    path:
      "/api/report2/comparison?yearA=INVALID&yearB=תשפ״ה",

    token: managerToken,

    expectedStatus: 400,

    validate(data) {
      validateError(
        data,
        "Report 2 validation response"
      );
    },
  },

  {
    name:
      "Manager can read Report 4 monthly data",

    path:
      "/api/report4/monthly",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        Array.isArray(data),
        "Report 4 monthly response must be an array"
      );
    },
  },

  {
    name:
      "Manager can read Report 4 outcomes",

    path:
      "/api/report4/outcomes",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Report 4 outcomes must be an object"
      );

      assert(
        isObject(data.ASHDOD),
        "Report 4 must include ASHDOD"
      );

      assert(
        isObject(
          data.BEER_SHEVA
        ),
        "Report 4 must include BEER_SHEVA"
      );
    },
  },

  {
    name:
      "Manager can read Report 5",

    path:
      "/api/report5/media",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        Array.isArray(data),
        "Report 5 response must be an array"
      );
    },
  },

  {
    name:
      "Report 5 validates invalid year after JWT authentication",

    path:
      "/api/report5/media?year=INVALID",

    token: managerToken,

    expectedStatus: 400,

    validate(data) {
      validateError(
        data,
        "Report 5 validation response"
      );
    },
  },

  {
    name:
      "Manager can access SIEM overview",

    path:
      "/api/security/overview",

    token: managerToken,

    expectedStatus: 200,

    validate(data) {
      assert(
        isObject(data),
        "Security overview must be an object"
      );

      assert(
        isObject(data.summary),
        "Security summary must be an object"
      );

      assert(
        Array.isArray(
          data.hourlyActivity
        ),
        "Hourly security activity must be an array"
      );

      assert(
        Array.isArray(
          data.recentBlockedEvents
        ),
        "Blocked security events must be an array"
      );

      assert(
        Array.isArray(
          data.recentEvents
        ),
        "Recent security events must be an array"
      );
    },
  },
];

async function runTests() {
  console.log(
    "Starting secured API integration tests"
  );

  console.log(
    `Base URL: ${BASE_URL}`
  );

  console.log(
    "-----------------------------------"
  );

  let passed = 0;
  let failed = 0;

  for (const currentTest of tests) {
    try {
      const data =
        await requestJson({
          path:
            currentTest.path,

          method:
            currentTest.method ||
            "GET",

          token:
            currentTest.token,

          expectedStatus:
            currentTest.expectedStatus,

          body:
            currentTest.body,
        });

      currentTest.validate(data);

      passed += 1;

      console.log(
        `PASSED: ${currentTest.name}`
      );
    } catch (error) {
      failed += 1;

      console.error(
        `FAILED: ${currentTest.name}`
      );

      console.error(
        error.message
      );
    }

    console.log(
      "-----------------------------------"
    );
  }

  console.log(
    "Integration tests completed"
  );

  console.log(
    `Passed: ${passed}`
  );

  console.log(
    `Failed: ${failed}`
  );

  if (failed > 0) {
    process.exit(1);
  }

  process.exit(0);
}

runTests();