const express = require("express");
const router = express.Router();

const {
  bookAppointment,
  getPatientAppointments,
  getClinicAppointments,
  acceptAppointment,
  rejectAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  deleteAppointment,
  deleteAllAppointments
} = require("../controllers/appointmentController");

// Patient routes
router.post("/book", bookAppointment);
router.get("/patient/:patientId", getPatientAppointments);
router.put("/:appointmentId/cancel", cancelAppointment);
router.put("/:appointmentId/reschedule", rescheduleAppointment);
router.delete("/:appointmentId", deleteAppointment);
router.delete("/patient/:patientId/appointments", deleteAllAppointments);

// Clinic Admin/Staff routes
router.get("/clinic/:clinicId", getClinicAppointments);
router.put("/:appointmentId/accept", acceptAppointment);
router.put("/:appointmentId/reject", rejectAppointment);
router.put("/:appointmentId/complete", completeAppointment);

module.exports = router;