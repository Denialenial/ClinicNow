const { firestore, auth } = require("../config/firebase");

const timestamp = () => new Date();

// CREATE CLINIC ADMIN
exports.createClinicAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, clinicId } = req.body;

    if (!name || !email || !password || !clinicId) {
      return res.status(400).json({
        success: false,
        error: "Name, email, password and clinic are required",
      });
    }

    const clinicDoc = await firestore.collection("clinics").doc(clinicId).get();
    if (!clinicDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Clinic not found",
      });
    }

    const clinicData = clinicDoc.data();

    const existingUser = await auth.getUserByEmail(email).catch(() => null);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    const userData = {
      uid: userRecord.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      role: "clinicAdmin",
      clinicId,
      clinicName: clinicData.name,
      isVerified: true,
      isBanned: false,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    await firestore.collection("users").doc(userRecord.uid).set(userData);

    return res.status(201).json({
      success: true,
      message: "Clinic admin created successfully",
      clinicName: clinicData.name,
      admin: {
        id: userRecord.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        clinicId,
        clinicName: clinicData.name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET ALL CLINIC ADMINS
exports.getClinicAdmins = async (req, res) => {
  try {
    const snapshot = await firestore
      .collection("users")
      .where("role", "==", "clinicAdmin")
      .get();

    const admins = [];
    for (const doc of snapshot.docs) {
      const adminData = doc.data();
      let clinicName = "Unknown Clinic";
      
      if (adminData.clinicId) {
        const clinicDoc = await firestore
          .collection("clinics")
          .doc(adminData.clinicId)
          .get();
        if (clinicDoc.exists) {
          clinicName = clinicDoc.data().name;
        }
      }

      admins.push({
        id: doc.id,
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone || "",
        clinicId: adminData.clinicId,
        clinicName,
        isBanned: adminData.isBanned || false,
        createdAt: adminData.createdAt,
      });
    }

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET SINGLE CLINIC ADMIN
exports.getClinicAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const adminDoc = await firestore.collection("users").doc(adminId).get();

    if (!adminDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    const adminData = adminDoc.data();

    if (adminData.role !== "clinicAdmin") {
      return res.status(400).json({
        success: false,
        error: "User is not a clinic admin",
      });
    }

    let clinicName = "Unknown Clinic";
    if (adminData.clinicId) {
      const clinicDoc = await firestore
        .collection("clinics")
        .doc(adminData.clinicId)
        .get();
      if (clinicDoc.exists) {
        clinicName = clinicDoc.data().name;
      }
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: adminId,
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone || "",
        clinicId: adminData.clinicId,
        clinicName,
        isBanned: adminData.isBanned || false,
        createdAt: adminData.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// UPDATE CLINIC ADMIN
exports.updateClinicAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, phone, clinicId } = req.body;

    const adminDoc = await firestore.collection("users").doc(adminId).get();

    if (!adminDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    const adminData = adminDoc.data();

    if (adminData.role !== "clinicAdmin") {
      return res.status(400).json({
        success: false,
        error: "User is not a clinic admin",
      });
    }

    const updates = {
      updatedAt: timestamp(),
    };

    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    
    if (clinicId && clinicId !== adminData.clinicId) {
      const clinicDoc = await firestore.collection("clinics").doc(clinicId).get();
      if (!clinicDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Clinic not found",
        });
      }
      updates.clinicId = clinicId;
      updates.clinicName = clinicDoc.data().name;
    }

    await firestore.collection("users").doc(adminId).update(updates);

    return res.status(200).json({
      success: true,
      message: "Clinic admin updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE CLINIC ADMIN
exports.deleteClinicAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const adminDoc = await firestore.collection("users").doc(adminId).get();

    if (!adminDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    const adminData = adminDoc.data();

    if (adminData.role !== "clinicAdmin") {
      return res.status(400).json({
        success: false,
        error: "User is not a clinic admin",
      });
    }

    await auth.deleteUser(adminId);
    await firestore.collection("users").doc(adminId).delete();

    return res.status(200).json({
      success: true,
      message: "Clinic admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET SYSTEM STATS (SuperAdmin Dashboard)
exports.getSystemStats = async (req, res) => {
  try {
    const clinicsSnapshot = await firestore.collection("clinics").get();
    const totalClinics = clinicsSnapshot.size;

    const adminsSnapshot = await firestore
      .collection("users")
      .where("role", "==", "clinicAdmin")
      .get();
    const totalAdmins = adminsSnapshot.size;

    const servicesSnapshot = await firestore.collection("services").get();
    const totalServices = servicesSnapshot.size;

    res.json({
      success: true,
      stats: {
        totalClinics,
        totalAdmins,
        totalServices,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};