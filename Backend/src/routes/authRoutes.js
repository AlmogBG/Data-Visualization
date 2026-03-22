const express = require("express");
const router = express.Router();

const {
  login,
  requestEmailChange,
  verifyEmailChange,
} = require("../controllers/authController");

router.post("/login", login);
router.post("/profile/request-email-change", requestEmailChange);
router.post("/profile/verify-email-change", verifyEmailChange);

module.exports = router;