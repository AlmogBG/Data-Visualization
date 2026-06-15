const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  sendVerificationCode,
} = require("../utils/mailer");

const {
  logSecurityEvent,
} = require("../utils/securityLogger");

const pendingEmailUpdates = new Map();

function generateVerificationCode() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

async function login(req, res) {
  const rawUsername =
    req.body?.username;

  const rawPassword =
    req.body?.password;

  const username =
    typeof rawUsername === "string"
      ? rawUsername.trim()
      : "";

  const password =
    typeof rawPassword === "string"
      ? rawPassword
      : "";

  try {
    if (!username || !password) {
      await logSecurityEvent({
        req,
        eventType: "LOGIN_FAILED",

        reason:
          "Login request was missing a username or password",

        username,

        statusCode: 400,

        blocked: false,
      });

      return res.status(400).json({
        message:
          "חובה להזין שם משתמש וסיסמה",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          username,
        },
      });

    if (!user) {
      await logSecurityEvent({
        req,
        eventType: "LOGIN_FAILED",

        reason:
          "Invalid username or password",

        username,

        statusCode: 401,

        blocked: false,
      });

      return res.status(401).json({
        message:
          "שם משתמש או סיסמה שגויים",
      });
    }

    const passwordRow =
      await prisma.password.findUnique({
        where: {
          idNumber: user.idNumber,
        },
      });

    if (!passwordRow) {
      await logSecurityEvent({
        req,
        eventType: "LOGIN_FAILED",

        reason:
          "Password record was not found",

        username,

        statusCode: 401,

        blocked: false,
      });

      return res.status(401).json({
        message:
          "שם משתמש או סיסמה שגויים",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        passwordRow.passwordHash
      );

    if (!isMatch) {
      await logSecurityEvent({
        req,
        eventType: "LOGIN_FAILED",

        reason:
          "Invalid username or password",

        username,

        statusCode: 401,

        blocked: false,
      });

      return res.status(401).json({
        message:
          "שם משתמש או סיסמה שגויים",
      });
    }

    const jwtSecret =
      process.env.JWT_SECRET;

    /*
     * אין ליצור JWT עם מפתח ברירת מחדל.
     */
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

        username,

        statusCode: 500,

        blocked: true,
      });

      return res.status(500).json({
        message:
          "שגיאת שרת בהתחברות",
      });
    }

    const token = jwt.sign(
      {
        username: user.username,
        idNumber: user.idNumber,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: "8h",
        algorithm: "HS256",
      }
    );

    await logSecurityEvent({
      req,

      eventType: "LOGIN_SUCCESS",

      reason:
        "User logged in successfully",

      username: user.username,

      statusCode: 200,

      blocked: false,

      details: {
        role: user.role,
      },
    });

    return res.status(200).json({
      ok: true,
      token,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });
  } catch (error) {
    console.error(
      "Login controller error:",
      error.message
    );

    await logSecurityEvent({
      req,

      eventType:
        "SERVER_SECURITY_ERROR",

      reason:
        "Unexpected error occurred during login",

      username,

      statusCode: 500,

      blocked: false,

      details: {
        errorName:
          error?.name ||
          "UnknownError",
      },
    });

    return res.status(500).json({
      message:
        "שגיאת שרת בהתחברות",
    });
  }
}

async function requestEmailChange(
  req,
  res
) {
  try {
    const {
      username,
      email,
    } = req.body || {};

    if (!username || !email) {
      return res.status(400).json({
        message:
          "חובה לשלוח שם משתמש ואימייל",
      });
    }

    const trimmedEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(trimmedEmail)
    ) {
      return res.status(400).json({
        message:
          "כתובת האימייל אינה תקינה",
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          username,
        },
      });

    if (!existingUser) {
      return res.status(404).json({
        message:
          "המשתמש לא נמצא",
      });
    }

    if (
      (
        existingUser.email || ""
      ).toLowerCase() === trimmedEmail
    ) {
      return res.status(400).json({
        message:
          "זהו כבר האימייל הנוכחי שלך",
      });
    }

    const emailOwner =
      await prisma.user.findUnique({
        where: {
          email: trimmedEmail,
        },
      });

    if (
      emailOwner &&
      emailOwner.username !== username
    ) {
      return res.status(409).json({
        message:
          "כתובת האימייל כבר קיימת במערכת",
      });
    }

    const code =
      generateVerificationCode();

    const expiresAt =
      Date.now() +
      10 * 60 * 1000;

    pendingEmailUpdates.set(
      username,
      {
        oldEmail:
          existingUser.email,

        newEmail:
          trimmedEmail,

        code,
        expiresAt,

        fullName:
          existingUser.fullName,

        role:
          existingUser.role,
      }
    );

    await sendVerificationCode(
      trimmedEmail,
      code
    );

    return res.status(200).json({
      ok: true,

      message:
        "קוד אימות נשלח לכתובת האימייל החדשה",
    });
  } catch (error) {
    console.error(
      "Request email change error:",
      error.message
    );

    return res.status(500).json({
      message:
        "שגיאה בעת שליחת קוד האימות",
    });
  }
}

async function verifyEmailChange(
  req,
  res
) {
  try {
    const {
      username,
      code,
    } = req.body || {};

    if (!username || !code) {
      return res.status(400).json({
        message:
          "חובה לשלוח שם משתמש וקוד אימות",
      });
    }

    const pending =
      pendingEmailUpdates.get(
        username
      );

    if (!pending) {
      return res.status(400).json({
        message:
          "לא נמצאה בקשת אימות פעילה",
      });
    }

    if (
      Date.now() >
      pending.expiresAt
    ) {
      pendingEmailUpdates.delete(
        username
      );

      return res.status(400).json({
        message:
          "קוד האימות פג תוקף. נא לבקש קוד חדש",
      });
    }

    if (
      pending.code !==
      String(code).trim()
    ) {
      return res.status(400).json({
        message:
          "קוד האימות שגוי",
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          username,
        },

        data: {
          email:
            pending.newEmail,
        },
      });

    pendingEmailUpdates.delete(
      username
    );

    return res.status(200).json({
      ok: true,

      message:
        "האימייל עודכן בהצלחה",

      user: {
        username:
          updatedUser.username,

        email:
          updatedUser.email,

        role:
          updatedUser.role,

        fullName:
          updatedUser.fullName,
      },
    });
  } catch (error) {
    console.error(
      "Verify email change error:",
      error.message
    );

    return res.status(500).json({
      message:
        "שגיאת שרת באימות הקוד",
    });
  }
}

module.exports = {
  login,
  requestEmailChange,
  verifyEmailChange,
};