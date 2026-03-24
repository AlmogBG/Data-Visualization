const express = require("express");
const router = express.Router();

const {
  getConsultationFormOptions,
  searchLeads,
  createLead,
  updateLead,
  createConsultation,
  getLeadConsultations,
  updateConsultation,
} = require("../controllers/consultationController");

router.get("/form/options", getConsultationFormOptions);
router.get("/leads/search", searchLeads);
router.post("/leads", createLead);
router.put("/leads/:id", updateLead);

router.post("/consultations", createConsultation);
router.get("/consultations/lead/:leadId", getLeadConsultations);
router.put("/consultations/:id", updateConsultation);

module.exports = router;