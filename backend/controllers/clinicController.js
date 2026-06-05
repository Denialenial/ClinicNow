const { firestore } = require("../config/firebase");

// CLINIC CRUD
exports.getClinics = async (req, res) => {
  try {
    const snapshot = await firestore.collection("clinics").get();
    const clinics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, clinics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createClinic = async (req, res) => {
  try {
    const { name, address, phone, email, latitude, longitude } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, error: "Name and address are required" });
    }

    const clinicData = {
      name,
      address,
      phone: phone || "",
      email: email || "",
      latitude: latitude || null,
      longitude: longitude || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await firestore.collection("clinics").add(clinicData);

    res.status(201).json({
      success: true,
      message: "Clinic created successfully",
      clinic: { id: docRef.id, ...clinicData },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    await firestore.collection("clinics").doc(clinicId).update(updates);
    res.json({ success: true, message: "Clinic updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const usersSnapshot = await firestore
      .collection("users")
      .where("clinicId", "==", clinicId)
      .get();

    if (!usersSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete clinic with assigned staff or admins. Reassign them first.",
      });
    }

    await firestore.collection("clinics").doc(clinicId).delete();
    res.json({ success: true, message: "Clinic deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GLOBAL SERVICES (SuperAdmin)
exports.getGlobalServices = async (req, res) => {
  try {
    const snapshot = await firestore.collection("services").get();
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addGlobalService = async (req, res) => {
  try {
    const { name, category, keywords, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: "Name and category are required" 
      });
    }

    const serviceData = {
      name,
      category,
      keywords: keywords || [],
      description: description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await firestore.collection("services").add(serviceData);

    res.status(201).json({
      success: true,
      message: "Service added successfully",
      service: { id: docRef.id, ...serviceData },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateGlobalService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    await firestore.collection("services").doc(serviceId).update(updates);
    res.json({ success: true, message: "Service updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteGlobalService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const clinicsSnapshot = await firestore.collectionGroup("offeredServices").get();
    const isUsed = clinicsSnapshot.docs.some(doc => doc.id === serviceId);

    if (isUsed) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete service that is currently offered by one or more clinics",
      });
    }

    await firestore.collection("services").doc(serviceId).delete();
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// CLINIC SERVICES (Clinic Admin)
exports.getClinicServices = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const offeredSnapshot = await firestore
      .collection("clinics")
      .doc(clinicId)
      .collection("offeredServices")
      .get();

    const offeredServiceIds = offeredSnapshot.docs.map(doc => doc.id);

    if (offeredServiceIds.length === 0) {
      return res.json({ success: true, services: [] });
    }

    const services = [];
    for (const serviceId of offeredServiceIds) {
      const serviceDoc = await firestore.collection("services").doc(serviceId).get();
      if (serviceDoc.exists) {
        services.push({
          id: serviceId,
          ...serviceDoc.data(),
          enabledAt: offeredSnapshot.docs.find(doc => doc.id === serviceId).data().enabledAt,
        });
      }
    }

    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAvailableGlobalServices = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const globalSnapshot = await firestore.collection("services").get();
    const allServices = globalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const offeredSnapshot = await firestore
      .collection("clinics")
      .doc(clinicId)
      .collection("offeredServices")
      .get();

    const offeredServiceIds = new Set(offeredSnapshot.docs.map(doc => doc.id));

    const servicesWithStatus = allServices.map(service => ({
      ...service,
      isOffered: offeredServiceIds.has(service.id),
    }));

    res.json({ success: true, services: servicesWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.enableClinicService = async (req, res) => {
  try {
    const { clinicId, serviceId } = req.params;

    const clinicDoc = await firestore.collection("clinics").doc(clinicId).get();
    if (!clinicDoc.exists) {
      return res.status(404).json({ success: false, error: "Clinic not found" });
    }

    const serviceDoc = await firestore.collection("services").doc(serviceId).get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ success: false, error: "Service not found" });
    }

    await firestore
      .collection("clinics")
      .doc(clinicId)
      .collection("offeredServices")
      .doc(serviceId)
      .set({
        enabled: true,
        enabledAt: new Date(),
      });

    res.json({ success: true, message: "Service enabled for clinic" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.disableClinicService = async (req, res) => {
  try {
    const { clinicId, serviceId } = req.params;

    const staffSnapshot = await firestore
      .collection("users")
      .where("clinicId", "==", clinicId)
      .where("serviceIds", "array-contains", serviceId)
      .get();

    if (!staffSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: `Cannot disable service. ${staffSnapshot.size} staff member(s) are currently qualified for this service. Reassign them first.`,
      });
    }

    await firestore
      .collection("clinics")
      .doc(clinicId)
      .collection("offeredServices")
      .doc(serviceId)
      .delete();

    res.json({ success: true, message: "Service disabled for clinic" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// CLINIC STATISTICS (Clinic Admin Dashboard)
exports.getClinicStats = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const staffSnapshot = await firestore
      .collection("users")
      .where("clinicId", "==", clinicId)
      .where("role", "==", "staff")
      .get();

    const totalStaff = staffSnapshot.size;
    const pendingStaff = staffSnapshot.docs.filter(doc => !doc.data().isVerified).length;
    const approvedStaff = totalStaff - pendingStaff;

    const servicesSnapshot = await firestore
      .collection("clinics")
      .doc(clinicId)
      .collection("offeredServices")
      .get();
    const totalServices = servicesSnapshot.size;

    const appointmentsSnapshot = await firestore
      .collection("appointments")
      .where("clinicId", "==", clinicId)
      .get();

    const totalAppointments = appointmentsSnapshot.size;
    const pendingAppointments = appointmentsSnapshot.docs.filter(doc => doc.data().status === "pending").length;
    const completedAppointments = appointmentsSnapshot.docs.filter(doc => doc.data().status === "completed").length;

    res.json({
      success: true,
      stats: {
        totalStaff,
        pendingStaff,
        approvedStaff,
        totalServices,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};