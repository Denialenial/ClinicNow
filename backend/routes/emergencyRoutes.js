const express = require("express");
const router = express.Router();

const {
  createCase,
  getActiveCase,
  getPatientCases,
  getCase,
  getPendingCases,
  getMyCases,
  acceptCase,
  updateCaseStatus,
  getActiveCases,
  markCaseResolved,
  deleteCase,
  deleteAllCases
} = require("../controllers/emergencyController");

// Patient routes
router.post("/cases", createCase);
router.get("/patient/:patientId/active", getActiveCase);
router.get("/patient/:patientId/active-cases", getActiveCases);
router.get("/patient/:patientId/cases", getPatientCases);
router.get("/cases/:caseId", getCase);
router.put("/cases/:caseId/resolve", markCaseResolved);
router.delete("/cases/:caseId", deleteCase);
router.delete("/patient/:patientId/cases", deleteAllCases);

// Staff routes
router.get("/clinic/:clinicId/pending", getPendingCases);
router.get("/staff/:staffId/mycases", getMyCases);
router.put("/cases/:caseId/accept", acceptCase);
router.put("/cases/:caseId/status", updateCaseStatus);

module.exports = router;