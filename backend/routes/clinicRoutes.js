const express = require("express");
const router = express.Router();

const {
  getClinics,
  createClinic,
  updateClinic,
  deleteClinic,
  getGlobalServices,
  addGlobalService,
  updateGlobalService,
  deleteGlobalService,
  getClinicServices,
  getAvailableGlobalServices,
  enableClinicService,
  disableClinicService,
  getClinicStats
} = require("../controllers/clinicController");

// Clinic CRUD
router.get("/", getClinics);
router.post("/", createClinic);
router.put("/:clinicId", updateClinic);
router.delete("/:clinicId", deleteClinic);

// Global Services (SuperAdmin)
router.get("/services/global", getGlobalServices);
router.post("/services/global", addGlobalService);
router.put("/services/global/:serviceId", updateGlobalService);
router.delete("/services/global/:serviceId", deleteGlobalService);

// Clinic Services (Clinic Admin)
router.get("/:clinicId/services", getClinicServices);
router.get("/:clinicId/services/available", getAvailableGlobalServices);
router.post("/:clinicId/services/:serviceId/enable", enableClinicService);
router.delete("/:clinicId/services/:serviceId/disable", disableClinicService);
router.get("/:clinicId/stats", getClinicStats);

module.exports = router;