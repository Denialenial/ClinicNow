const express = require("express");
const router = express.Router();

const {
  getPendingStaff,
  getApprovedStaff,
  approveStaff,
  rejectStaff,
  getStaffById,
  updateDutyStatus,
} = require("../controllers/staffController");

router.get("/pending/:clinicId", getPendingStaff);
router.get("/approved/:clinicId", getApprovedStaff);
router.get("/:staffId", getStaffById);
router.put("/:staffId/approve", approveStaff);
router.delete("/:staffId/reject", rejectStaff);
router.put("/:staffId/duty", updateDutyStatus);

module.exports = router;