const express = require("express");

const {
  getConsultationFormOptions,
  searchLeads,
  createLead,
  updateLead,
  createConsultation,
  getLeadConsultations,
  updateConsultation,
  deleteConsultation,
} = require("../controllers/consultationController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

const OPERATIONAL_ROLES = [
  "Manager",
  "Management Employee",
];

router.get(
  "/form/options",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  getConsultationFormOptions
);

router.get(
  "/leads/search",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  searchLeads
);

router.post(
  "/leads",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  createLead
);

router.put(
  "/leads/:id",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  updateLead
);

router.post(
  "/consultations",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  createConsultation
);

router.get(
  "/consultations/lead/:leadId",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  getLeadConsultations
);

router.put(
  "/consultations/:id",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  updateConsultation
);

router.delete(
  "/consultations/:id",
  authenticateToken,
  authorizeRoles(...OPERATIONAL_ROLES),
  deleteConsultation
);

module.exports = router;