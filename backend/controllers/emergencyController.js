const { firestore } = require("../config/firebase");

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// CREATE CASE
exports.createCase = async (req, res) => {
  try {
    const { patientId, patientName, patientPhone, symptoms, latitude, longitude, photoUri } = req.body;

    if (!patientId || !symptoms || !latitude || !longitude) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const lowerSymptoms = symptoms.toLowerCase();

    const servicesSnapshot = await firestore.collection("services").get();
    let matchedService = null;
    let isEmergency = false;

    for (const doc of servicesSnapshot.docs) {
      const service = doc.data();
      const keywords = service.keywords || [];
      if (keywords.some(kw => lowerSymptoms.includes(kw.toLowerCase()))) {
        matchedService = { id: doc.id, ...service };
        isEmergency = service.category === "emergency";
        break;
      }
    }

    if (!matchedService) {
      const emergencyServices = servicesSnapshot.docs.filter(doc => doc.data().category === "emergency");
      if (emergencyServices.length > 0) {
        matchedService = { id: emergencyServices[0].id, ...emergencyServices[0].data() };
        isEmergency = true;
      }
    }

    const activeCasesSnapshot = await firestore
      .collection("cases")
      .where("patientId", "==", patientId)
      .where("status", "in", ["pending", "assigned", "enRoute", "arrived"])
      .get();

    const activeEmergency = activeCasesSnapshot.docs.find(doc => doc.data().isEmergency === true);

    if (isEmergency && activeEmergency) {
      const emergencyData = activeEmergency.data();
      if (emergencyData.status === "pending") {
        await activeEmergency.ref.delete();
      } else {
        return res.status(400).json({
          success: false,
          error: "You already have an active emergency being handled. Please wait for it to complete.",
          activeCaseId: activeEmergency.id,
        });
      }
    }

    let nearbyClinics = [];
    let clinicId = null;

    if (matchedService) {
      const offeredSnapshot = await firestore.collectionGroup("offeredServices").get();
      for (const doc of offeredSnapshot.docs) {
        if (doc.id === matchedService.id) {
          const clinicIdTemp = doc.ref.parent.parent.id;
          const clinicDoc = await firestore.collection("clinics").doc(clinicIdTemp).get();
          if (clinicDoc.exists) {
            const clinicData = clinicDoc.data();
            if (clinicData.latitude && clinicData.longitude) {
              const distance = calculateDistance(latitude, longitude, clinicData.latitude, clinicData.longitude);
              nearbyClinics.push({
                id: clinicIdTemp,
                name: clinicData.name,
                address: clinicData.address,
                phone: clinicData.phone || "",
                email: clinicData.email || "",
                latitude: clinicData.latitude,
                longitude: clinicData.longitude,
                distance: distance
              });
            }
          }
        }
      }
      nearbyClinics.sort((a, b) => a.distance - b.distance);
      if (nearbyClinics.length > 0 && isEmergency) {
        clinicId = nearbyClinics[0].id;
      }
    }

    const caseData = {
      patientId,
      patientName,
      patientPhone: patientPhone || "",
      symptoms,
      location: { latitude, longitude },
      photoUri: photoUri || null,
      isEmergency,
      matchedServiceId: matchedService?.id || null,
      matchedServiceName: matchedService?.name || null,
      nearbyClinics,
      expandedClinics: [],
      expansionLevel: 0,
      lastExpansionAt: null,
      status: "pending",
      priority: isEmergency ? "high" : "low",
      assignedStaffId: null,
      assignedStaffName: null,
      clinicId,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null
    };

    const caseRef = await firestore.collection("cases").add(caseData);

    res.status(201).json({
      success: true,
      case: { id: caseRef.id, ...caseData },
      isEmergency,
      nearbyClinics,
      message: isEmergency ? "Emergency response activated" : "Routine case created"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ACTIVE CASES (Emergency + Routines)
exports.getActiveCases = async (req, res) => {
  try {
    const { patientId } = req.params;

    const snapshot = await firestore
      .collection("cases")
      .where("patientId", "==", patientId)
      .where("status", "in", ["pending", "assigned", "enRoute", "arrived"])
      .orderBy("createdAt", "desc")
      .get();

    const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const emergency = cases.find(c => c.isEmergency === true);
    const routines = cases.filter(c => c.isEmergency === false);

    res.json({ success: true, emergency, routines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ACTIVE EMERGENCY CASE
exports.getActiveCase = async (req, res) => {
  try {
    const { patientId } = req.params;

    const snapshot = await firestore
      .collection("cases")
      .where("patientId", "==", patientId)
      .where("status", "in", ["pending", "assigned", "enRoute", "arrived"])
      .where("isEmergency", "==", true)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, case: null });
    }

    const caseDoc = snapshot.docs[0];
    res.json({ success: true, case: { id: caseDoc.id, ...caseDoc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET PATIENT CASE HISTORY
exports.getPatientCases = async (req, res) => {
  try {
    const { patientId } = req.params;

    const snapshot = await firestore
      .collection("cases")
      .where("patientId", "==", patientId)
      .orderBy("createdAt", "desc")
      .get();

    const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET SINGLE CASE BY ID
exports.getCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseDoc = await firestore.collection("cases").doc(caseId).get();

    if (!caseDoc.exists) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }

    res.json({ success: true, case: { id: caseDoc.id, ...caseDoc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET PENDING CASES FOR CLINIC
exports.getPendingCases = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const snapshot = await firestore
      .collection("cases")
      .where("clinicId", "==", clinicId)
      .where("status", "==", "pending")
      .where("isEmergency", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET STAFF'S ASSIGNED CASES
exports.getMyCases = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staffDoc = await firestore.collection("users").doc(staffId).get();
    const staffData = staffDoc.data();
    const isOnDuty = staffData?.isOnDuty || false;

    let snapshot;

    if (isOnDuty) {
      snapshot = await firestore
        .collection("cases")
        .where("assignedStaffId", "==", staffId)
        .orderBy("createdAt", "desc")
        .get();
    } else {
      snapshot = await firestore
        .collection("cases")
        .where("assignedStaffId", "==", staffId)
        .where("status", "in", ["completed", "cancelled"])
        .orderBy("createdAt", "desc")
        .get();
    }

    const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// STAFF ACCEPTS A CASE
exports.acceptCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { staffId, staffName } = req.body;

    const staffDoc = await firestore.collection("users").doc(staffId).get();
    const staffData = staffDoc.data();

    if (!staffData?.isOnDuty) {
      return res.status(403).json({
        success: false,
        error: "You must be on duty to accept cases"
      });
    }

    const caseRef = firestore.collection("cases").doc(caseId);
    const caseDoc = await caseRef.get();

    if (!caseDoc.exists) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }

    const caseData = caseDoc.data();

    if (caseData.status !== "pending") {
      return res.status(400).json({ success: false, error: "Case already assigned" });
    }

    await caseRef.update({
      assignedStaffId: staffId,
      assignedStaffName: staffName,
      status: "assigned",
      updatedAt: new Date()
    });

    res.json({ success: true, message: "Case accepted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE CASE STATUS
exports.updateCaseStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;

    const validStatuses = ["assigned", "enRoute", "arrived", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const caseRef = firestore.collection("cases").doc(caseId);
    const updateData = { status, updatedAt: new Date() };

    if (status === "completed" || status === "cancelled") {
      updateData.resolvedAt = new Date();
    }

    await caseRef.update(updateData);

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// EXPAND PENDING CASES (Runs every 30 seconds)
exports.expandPendingCases = async () => {
  try {
    const now = new Date();

    const snapshot = await firestore
      .collection("cases")
      .where("status", "==", "pending")
      .where("isEmergency", "==", true)
      .get();

    if (snapshot.size === 0) return;

    let expandedCount = 0;

    for (const doc of snapshot.docs) {
      const caseData = doc.data();

      if (caseData.expansionLevel === undefined) continue;

      const createdAt = caseData.createdAt.toDate();
      const minutesSinceCreation = (now - createdAt) / 1000 / 60;
      const targetExpansionLevel = Math.floor(minutesSinceCreation / 2);

      if (targetExpansionLevel > caseData.expansionLevel) {
        const clinicsOffering = caseData.nearbyClinics || [];
        const currentExpanded = caseData.expandedClinics || [];
        let newClinicsAdded = false;

        for (let i = caseData.expansionLevel; i < targetExpansionLevel && i < clinicsOffering.length; i++) {
          const nextClinic = clinicsOffering[i];
          if (nextClinic && !currentExpanded.includes(nextClinic.id) && nextClinic.id !== caseData.clinicId) {
            currentExpanded.push(nextClinic.id);
            newClinicsAdded = true;
          }
        }

        if (newClinicsAdded) {
          await doc.ref.update({
            expandedClinics: currentExpanded,
            expansionLevel: targetExpansionLevel,
            lastExpansionAt: new Date()
          });
          expandedCount++;
        }
      }
    }
  } catch (error) {
    // Silent fail for background process
  }
};

// MARK CASE AS RESOLVED (Self-Visit)
exports.markCaseResolved = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { clinicId, clinicName } = req.body;
    
    const caseRef = firestore.collection("cases").doc(caseId);
    const caseDoc = await caseRef.get();
    
    if (!caseDoc.exists) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }
    
    const caseData = caseDoc.data();
    
    if (caseData.isEmergency) {
      return res.status(400).json({ success: false, error: "Emergency cases cannot be self-resolved" });
    }
    
    if (caseData.status !== "pending") {
      return res.status(400).json({ success: false, error: "Case is already resolved or cancelled" });
    }
    
    await caseRef.update({
      status: "completed",
      resolvedAt: new Date(),
      updatedAt: new Date(),
      resolvedVia: "self-visit",
      visitedClinicId: clinicId || null,
      visitedClinicName: clinicName || null
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Case marked as resolved. You visited ${clinicName || "the clinic"}.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE SINGLE CASE
exports.deleteCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const caseRef = firestore.collection("cases").doc(caseId);
    const caseDoc = await caseRef.get();
    
    if (!caseDoc.exists) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }
    
    await caseRef.delete();
    
    res.json({ success: true, message: "Case deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE ALL CASES FOR PATIENT
exports.deleteAllCases = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const snapshot = await firestore
      .collection("cases")
      .where("patientId", "==", patientId)
      .get();
    
    if (snapshot.empty) {
      return res.json({ success: true, deletedCount: 0, message: "No cases to delete" });
    }
    
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({ success: true, deletedCount: snapshot.size, message: `${snapshot.size} cases deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};