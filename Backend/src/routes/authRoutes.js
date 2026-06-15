const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  login,
  requestEmailChange,
  verifyEmailChange,
} = require("../controllers/authController");

const {
  logSecurityEvent,
} = require("../utils/securityLogger");

const router = express.Router();

/*
 * עד חמישה ניסיונות התחברות כושלים
 * בדקה לכל כתובת IP.
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,

  standardHeaders: true,
  legacyHeaders: false,

  /*
   * התחברות מוצלחת אינה נספרת
   * כניסיון כושל.
   */
  skipSuccessfulRequests: true,

  /*
   * הפונקציה מופעלת כאשר כתובת IP
   * עוברת את מגבלת הניסיונות.
   */
  handler: async (
    req,
    res,
    next,
    options
  ) => {
    const statusCode =
      options?.statusCode || 429;

    await logSecurityEvent({
      req,
      eventType:
        "LOGIN_RATE_LIMITED",

      reason:
        "Login request blocked because the rate limit was exceeded",

      username:
        req.body?.username,

      statusCode,

      blocked: true,

      details: {
        windowMs: 60 * 1000,
        limit: 5,
      },
    });

    return res.status(statusCode).json({
      success: false,

      message:
        "בוצעו יותר מדי ניסיונות התחברות. אנא נסה שוב בעוד דקה.",
    });
  },
});

router.post(
  "/login",
  loginLimiter,
  login
);

/*
 * נתיבי שינוי האימייל יאובטחו
 * בשלב נפרד.
 */
router.post(
  "/profile/request-email-change",
  requestEmailChange
);

router.post(
  "/profile/verify-email-change",
  verifyEmailChange
);

module.exports = router;