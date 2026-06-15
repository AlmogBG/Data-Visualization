const express = require("express");

const {
  getSecurityOverview,
} = require("../controllers/securityController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * כל נתיבי SIEM Lite דורשים:
 * 1. JWT תקין.
 * 2. תפקיד Manager.
 */
router.use(
  authenticateToken,
  authorizeRoles("Manager")
);

router.get(
  "/overview",
  getSecurityOverview
);

module.exports = router;