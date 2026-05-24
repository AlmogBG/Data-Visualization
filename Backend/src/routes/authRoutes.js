const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const prisma = require("../config/db");

const {
  login,
  requestEmailChange,
  verifyEmailChange,
} = require("../controllers/authController");

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // חלון זמן של דקה אחת
  max: 5, // מקסימום 5 ניסיונות התחברות בדקה לכל כתובת IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res, next, options) => {
    try {
      // 1. שמירת תיעוד (Log) של הבקשה החסומה במסד הנתונים
      await prisma.securityLog.create({
        data: {
          ipAddress: req.ip || req.connection.remoteAddress || "Unknown IP",
          reason: "Brute force login attempt blocked", // סיבת החסימה
        },
      });
      console.warn(`[Security Log] Blocked login attempt from IP: ${req.ip}`);
    } catch (error) {
      console.error("Failed to save security log:", error);
    }

    res.status(429).json({
      success: false,
      message: "בוצעו יותר מדי ניסיונות התחברות. אנא נסה שוב בעוד דקה.",
    });
  },
});

router.post("/login", login);
router.post("/profile/request-email-change", requestEmailChange);
router.post("/profile/verify-email-change", verifyEmailChange);

module.exports = router;