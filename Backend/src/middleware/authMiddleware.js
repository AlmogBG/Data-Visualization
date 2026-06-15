const jwt = require("jsonwebtoken");

const {
  logSecurityEvent,
} = require("../utils/securityLogger");

async function authenticateToken(
  req,
  res,
  next
) {
  const authorizationHeader =
    req.headers.authorization;

  if (!authorizationHeader) {
    await logSecurityEvent({
      req,

      eventType:
        "AUTHENTICATION_REQUIRED",

      reason:
        "Protected endpoint was accessed without an authorization header",

      statusCode: 401,

      blocked: true,
    });

    return res.status(401).json({
      message:
        "נדרשת התחברות למערכת",
    });
  }

  const [scheme, token] =
    authorizationHeader
      .trim()
      .split(/\s+/);

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    await logSecurityEvent({
      req,

      eventType:
        "TOKEN_INVALID",

      reason:
        "Authorization header did not contain a valid Bearer token",

      statusCode: 401,

      blocked: true,
    });

    return res.status(401).json({
      message:
        "טוקן ההתחברות חסר או אינו תקין",
    });
  }

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error(
      "JWT_SECRET is missing from environment variables"
    );

    await logSecurityEvent({
      req,

      eventType:
        "SERVER_SECURITY_ERROR",

      reason:
        "JWT_SECRET environment variable is missing",

      statusCode: 500,

      blocked: true,
    });

    return res.status(500).json({
      message:
        "שגיאת שרת באימות המשתמש",
    });
  }

  try {
    const decodedToken =
      jwt.verify(
        token,
        jwtSecret,
        {
          algorithms: ["HS256"],
        }
      );

    if (
      !decodedToken.idNumber ||
      !decodedToken.username ||
      !decodedToken.role
    ) {
      await logSecurityEvent({
        req,

        eventType:
          "TOKEN_INVALID",

        reason:
          "JWT did not contain the required user fields",

        username:
          decodedToken.username,

        statusCode: 401,

        blocked: true,
      });

      return res.status(401).json({
        message:
          "טוקן ההתחברות אינו מכיל פרטי משתמש תקינים",
      });
    }

    req.user = {
      idNumber:
        decodedToken.idNumber,

      username:
        decodedToken.username,

      role:
        decodedToken.role,
    };

    return next();
  } catch (error) {
    if (
      error.name ===
      "TokenExpiredError"
    ) {
      await logSecurityEvent({
        req,

        eventType:
          "TOKEN_EXPIRED",

        reason:
          "An expired JWT was used",

        statusCode: 401,

        blocked: true,
      });

      return res.status(401).json({
        message:
          "תוקף ההתחברות פג. יש להתחבר מחדש",
      });
    }

    await logSecurityEvent({
      req,

      eventType:
        "TOKEN_INVALID",

      reason:
        "JWT verification failed",

      statusCode: 401,

      blocked: true,

      details: {
        errorName:
          error?.name ||
          "JsonWebTokenError",
      },
    });

    return res.status(401).json({
      message:
        "טוקן ההתחברות אינו תקין",
    });
  }
}

function authorizeRoles(
  ...allowedRoles
) {
  return async function roleAuthorizationMiddleware(
    req,
    res,
    next
  ) {
    if (!req.user) {
      return res.status(401).json({
        message:
          "נדרשת התחברות למערכת",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      await logSecurityEvent({
        req,

        eventType:
          "AUTHORIZATION_DENIED",

        reason:
          "Authenticated user attempted to access a route without the required role",

        username:
          req.user.username,

        statusCode: 403,

        blocked: true,

        details: {
          userRole:
            req.user.role,

          allowedRoles,
        },
      });

      return res.status(403).json({
        message:
          "אין לך הרשאה לבצע פעולה זו",
      });
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};