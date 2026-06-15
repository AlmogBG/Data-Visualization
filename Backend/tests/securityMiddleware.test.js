"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const TEST_JWT_SECRET =
  "local-security-test-secret-do-not-use-in-production";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = TEST_JWT_SECRET;

/*
 * מנטרלים רק בזמן בדיקות היחידה את כתיבת לוג האבטחה למסד.
 * כך npm test לא צריך חיבור ל-PostgreSQL.
 */
const securityLoggerPath = require.resolve(
  "../src/utils/securityLogger"
);

const securityLoggerStub = new Proxy(
  {
    logSecurityEvent: async () => {},
    getClientIp: () => "127.0.0.1",
    getRequestIp: () => "127.0.0.1",
  },
  {
    get(target, property) {
      if (property in target) {
        return target[property];
      }

      return async () => {};
    },
  }
);

require.cache[securityLoggerPath] = {
  id: securityLoggerPath,
  filename: securityLoggerPath,
  loaded: true,
  exports: securityLoggerStub,
};

const {
  authenticateToken,
  authorizeRoles,
} = require("../src/middleware/authMiddleware");

function createRequest({
  authorization,
  user,
} = {}) {
  const headers = {};

  if (authorization) {
    headers.authorization = authorization;
  }

  return {
    headers,
    user,
    method: "GET",
    originalUrl: "/api/test",
    path: "/api/test",
    ip: "127.0.0.1",
    socket: {
      remoteAddress: "127.0.0.1",
    },

    get(headerName) {
      return this.headers[
        String(headerName).toLowerCase()
      ];
    },
  };
}

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      return this;
    },

    send(data) {
      this.body = data;
      return this;
    },

    set(name, value) {
      this.headers[name] = value;
      return this;
    },
  };
}

function createToken({
  role = "Manager",
  username = "security-test-user",
  idNumber = "security-test-001",
  expiresIn = "5m",
  secret = TEST_JWT_SECRET,
} = {}) {
  return jwt.sign(
    {
      username,
      idNumber,
      role,
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn,
    }
  );
}

async function executeMiddleware(
  middleware,
  request,
  response
) {
  let nextCalled = false;
  let nextError = null;

  const next = (error) => {
    nextCalled = true;
    nextError = error || null;
  };

  await middleware(
    request,
    response,
    next
  );

  return {
    nextCalled,
    nextError,
  };
}

test(
  "authenticateToken returns 401 when Authorization header is missing",
  async () => {
    const request = createRequest();
    const response = createResponse();

    const result =
      await executeMiddleware(
        authenticateToken,
        request,
        response
      );

    assert.equal(
      response.statusCode,
      401
    );

    assert.equal(
      result.nextCalled,
      false
    );

    assert.equal(
      typeof response.body,
      "object"
    );
  }
);

test(
  "authenticateToken returns 401 for malformed JWT",
  async () => {
    const request = createRequest({
      authorization:
        "Bearer this-is-not-a-valid-token",
    });

    const response = createResponse();

    const result =
      await executeMiddleware(
        authenticateToken,
        request,
        response
      );

    assert.equal(
      response.statusCode,
      401
    );

    assert.equal(
      result.nextCalled,
      false
    );
  }
);

test(
  "authenticateToken returns 401 for JWT signed with another secret",
  async () => {
    const invalidToken = createToken({
      secret:
        "different-test-secret",
    });

    const request = createRequest({
      authorization:
        `Bearer ${invalidToken}`,
    });

    const response = createResponse();

    const result =
      await executeMiddleware(
        authenticateToken,
        request,
        response
      );

    assert.equal(
      response.statusCode,
      401
    );

    assert.equal(
      result.nextCalled,
      false
    );
  }
);

test(
  "authenticateToken returns 401 for expired JWT",
  async () => {
    const expiredToken = createToken({
      expiresIn: -1,
    });

    const request = createRequest({
      authorization:
        `Bearer ${expiredToken}`,
    });

    const response = createResponse();

    const result =
      await executeMiddleware(
        authenticateToken,
        request,
        response
      );

    assert.equal(
      response.statusCode,
      401
    );

    assert.equal(
      result.nextCalled,
      false
    );
  }
);

test(
  "authenticateToken accepts a valid Manager JWT",
  async () => {
    const token = createToken({
      role: "Manager",
    });

    const request = createRequest({
      authorization:
        `Bearer ${token}`,
    });

    const response = createResponse();

    const result =
      await executeMiddleware(
        authenticateToken,
        request,
        response
      );

    assert.equal(
      result.nextCalled,
      true
    );

    assert.equal(
      result.nextError,
      null
    );

    assert.equal(
      request.user.username,
      "security-test-user"
    );

    assert.equal(
      request.user.idNumber,
      "security-test-001"
    );

    assert.equal(
      request.user.role,
      "Manager"
    );
  }
);

test(
  "authorizeRoles allows Manager to access Manager-only route",
  async () => {
    const request = createRequest({
      user: {
        username: "manager-test",
        idNumber: "manager-001",
        role: "Manager",
      },
    });

    const response = createResponse();

    const middleware =
      authorizeRoles("Manager");

    const result =
      await executeMiddleware(
        middleware,
        request,
        response
      );

    assert.equal(
      result.nextCalled,
      true
    );

    assert.equal(
      response.statusCode,
      200
    );
  }
);

test(
  "authorizeRoles rejects Management Employee from Manager-only route",
  async () => {
    const request = createRequest({
      user: {
        username: "employee-test",
        idNumber: "employee-001",
        role: "Management Employee",
      },
    });

    const response = createResponse();

    const middleware =
      authorizeRoles("Manager");

    const result =
      await executeMiddleware(
        middleware,
        request,
        response
      );

    assert.equal(
      result.nextCalled,
      false
    );

    assert.equal(
      response.statusCode,
      403
    );
  }
);

test(
  "authorizeRoles allows Management Employee on shared route",
  async () => {
    const request = createRequest({
      user: {
        username: "employee-test",
        idNumber: "employee-001",
        role: "Management Employee",
      },
    });

    const response = createResponse();

    const middleware =
      authorizeRoles(
        "Manager",
        "Management Employee"
      );

    const result =
      await executeMiddleware(
        middleware,
        request,
        response
      );

    assert.equal(
      result.nextCalled,
      true
    );

    assert.equal(
      response.statusCode,
      200
    );
  }
);