const express = require("express");
const router = express.Router();

const {
  createClinicAdmin,
  getClinicAdmins,
  getClinicAdmin,
  updateClinicAdmin,
  deleteClinicAdmin,
  getSystemStats, 
} = require("../controllers/adminController");

router.post("/clinic-admin", createClinicAdmin);
router.get("/clinic-admins", getClinicAdmins);
router.get("/clinic-admin/:adminId", getClinicAdmin);
router.put("/clinic-admin/:adminId", updateClinicAdmin);
router.delete("/clinic-admin/:adminId", deleteClinicAdmin);
router.get("/system-stats", getSystemStats); 

module.exports = router;