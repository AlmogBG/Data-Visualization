const prisma = require("../config/db");

/*
 * מחזיר את כתובת ה-IP של הבקשה.
 */
function getClientIp(req) {
  const forwardedFor =
    req?.headers?.["x-forwarded-for"];

  if (
    typeof forwardedFor === "string" &&
    forwardedFor.trim()
  ) {
    return forwardedFor
      .split(",")[0]
      .trim()
      .substring(0, 64);
  }

  const rawIp =
    req?.ip ||
    req?.socket?.remoteAddress ||
    req?.connection?.remoteAddress ||
    "unknown";

  if (rawIp.startsWith("::ffff:")) {
    return rawIp
      .substring(7)
      .substring(0, 64);
  }

  return String(rawIp).substring(0, 64);
}

function normalizeOptionalText(
  value,
  maximumLength
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  if (!normalized) {
    return null;
  }

  return normalized.substring(
    0,
    maximumLength
  );
}

/*
 * שומר אירוע אבטחה במסד הנתונים.
 *
 * כשל ברישום האירוע אינו מפיל את הבקשה
 * המקורית של המשתמש.
 */
async function logSecurityEvent({
  req,
  eventType,
  reason,
  username = null,
  statusCode = null,
  blocked = false,
  details = null,
}) {
  try {
    const resolvedUsername =
      normalizeOptionalText(
        username ||
          req?.user?.username ||
          req?.body?.username,
        100
      );

    const eventData = {
      eventType:
        normalizeOptionalText(
          eventType,
          50
        ) || "UNKNOWN",

      ipAddress: getClientIp(req),

      username: resolvedUsername,

      reason:
        normalizeOptionalText(
          reason,
          2000
        ) || "Security event",

      route: normalizeOptionalText(
        req?.originalUrl || req?.path,
        255
      ),

      method: normalizeOptionalText(
        req?.method,
        10
      ),

      statusCode:
        Number.isInteger(statusCode)
          ? statusCode
          : null,

      blocked: Boolean(blocked),
    };

    if (
      details !== null &&
      details !== undefined
    ) {
      eventData.details = details;
    }

    await prisma.securityLog.create({
      data: eventData,
    });
  } catch (error) {
    console.error(
      "Security log write failed:",
      error.message
    );
  }
}

module.exports = {
  getClientIp,
  logSecurityEvent,
};