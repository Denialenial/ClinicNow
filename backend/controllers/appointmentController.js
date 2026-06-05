const { firestore } = require("../config/firebase");

// Book an appointment (Patient)
exports.bookAppointment = async (req, res) => {
  try {
    const { 
      patientId, 
      patientName, 
      patientPhone, 
      clinicId, 
      clinicName, 
      serviceId, 
      serviceName, 
      symptoms,
      appointmentDate,
      caseId
    } = req.body;

    if (!patientId || !clinicId || !serviceId || !appointmentDate) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    const appointmentData = {
      patientId,
      patientName,
      patientPhone: patientPhone || "",
      clinicId,
      clinicName,
      serviceId,
      serviceName,
      symptoms: symptoms || "",
      appointmentDate: new Date(appointmentDate),
      caseId: caseId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      acceptedAt: null,
      rejectedAt: null,
      cancelledAt: null,
      completedAt: null,
      notes: "",
      rejectionReason: ""
    };

    const docRef = await firestore.collection("appointments").add(appointmentData);

    res.status(201).json({
      success: true,
      message: "Appointment requested successfully. Waiting for clinic confirmation.",
      appointment: { id: docRef.id, ...appointmentData }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get patient's appointments
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const snapshot = await firestore
      .collection("appointments")
      .where("patientId", "==", patientId)
      .orderBy("appointmentDate", "desc")
      .get();

    const appointments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      appointmentDate: doc.data().appointmentDate?.toDate?.() || doc.data().appointmentDate
    }));

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get clinic's appointments (for Clinic Admin/Staff)
exports.getClinicAppointments = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const snapshot = await firestore
      .collection("appointments")
      .where("clinicId", "==", clinicId)
      .orderBy("appointmentDate", "asc")
      .get();

    const appointments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      appointmentDate: doc.data().appointmentDate?.toDate?.() || doc.data().appointmentDate
    }));

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Accept appointment (Clinic Admin/Staff)
exports.acceptAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    await firestore.collection("appointments").doc(appointmentId).update({
      status: "accepted",
      acceptedAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, message: "Appointment accepted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject appointment (Clinic Admin/Staff)
exports.rejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { rejectionReason } = req.body;

    await firestore.collection("appointments").doc(appointmentId).update({
      status: "rejected",
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || "No reason provided",
      updatedAt: new Date()
    });

    res.json({ success: true, message: "Appointment rejected" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel appointment (Patient)
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    await firestore.collection("appointments").doc(appointmentId).update({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Complete appointment (Clinic Admin/Staff)
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointmentDoc = await firestore.collection("appointments").doc(appointmentId).get();
    const appointmentData = appointmentDoc.data();
    const caseId = appointmentData.caseId;

    await firestore.collection("appointments").doc(appointmentId).update({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date()
    });

    if (caseId) {
      const caseRef = firestore.collection("cases").doc(caseId);
      const caseDoc = await caseRef.get();
      
      if (caseDoc.exists) {
        const caseData = caseDoc.data();
        if (!caseData.isEmergency) {
          await caseRef.update({
            status: "completed",
            resolvedAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    res.json({ success: true, message: "Appointment marked as completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reschedule appointment (Patient)
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { appointmentDate } = req.body;

    if (!appointmentDate) {
      return res.status(400).json({ success: false, error: "New date required" });
    }

    const newDate = new Date(appointmentDate);
    if (newDate < new Date()) {
      return res.status(400).json({ success: false, error: "Cannot reschedule to past date" });
    }

    const appointmentRef = firestore.collection("appointments").doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();

    if (!appointmentDoc.exists) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }

    await appointmentRef.update({
      appointmentDate: newDate,
      status: "pending",
      updatedAt: new Date(),
    });

    res.json({ success: true, message: "Appointment rescheduled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete single appointment (Patient)
exports.deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointmentRef = firestore.collection("appointments").doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }
    
    await appointmentRef.delete();
    
    res.json({ success: true, message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete all appointments for a patient
exports.deleteAllAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const snapshot = await firestore
      .collection("appointments")
      .where("patientId", "==", patientId)
      .get();
    
    if (snapshot.empty) {
      return res.json({ success: true, deletedCount: 0, message: "No appointments to delete" });
    }
    
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({ success: true, deletedCount: snapshot.size, message: `${snapshot.size} appointments deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};