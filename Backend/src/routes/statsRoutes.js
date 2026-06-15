const express = require("express");

const {
  getLeadsByCity,
  getAnomalies,
} = require("../controllers/statsController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "Stats routes working",
  });
});

/*
 * משמש את דוח 3 — רק Manager.
 */
router.get(
  "/cities",
  authenticateToken,
  authorizeRoles("Manager"),
  getLeadsByCity
);

/*
 * משמש את דף הבית — שני התפקידים.
 */
router.get(
  "/anomalies",
  authenticateToken,
  authorizeRoles(
    "Manager",
    "Management Employee"
  ),
  getAnomalies
);

module.exports = router;