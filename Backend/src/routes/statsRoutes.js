const express = require("express");
const router = express.Router();
const { getLeadsByCity } = require("../controllers/statsController");

router.get("/", (req, res) => {
  return res.json({
    ok: true,
    message: "Stats routes working",
  });
});

router.get("/cities", getLeadsByCity);
router.get("/anomalies", getAnomalies);

module.exports = router;