const { firestore, auth } = require("../config/firebase");

const timestamp = () => new Date();

// GET PENDING STAFF FOR CLINIC
exports.getPendingStaff = async (req, res) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId) {
      return res.status(400).json({
        success: false,
        error: "Clinic ID is required",
      });
    }

    const snapshot = await firestore
      .collection("users")
      .where("role", "==", "staff")
      .where("clinicId", "==", clinicId)
      .where("isVerified", "==", false)
      .get();

    const staff = [];
    for (const doc of snapshot.docs) {
      const staffData = doc.data();
      staff.push({
        id: doc.id,
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone || "",
        category: staffData.category,
        serviceIds: staffData.serviceIds || [],
        serviceNames: staffData.serviceNames || [],
        createdAt: staffData.createdAt,
      });
    }

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET APPROVED STAFF FOR CLINIC
exports.getApprovedStaff = async (req, res) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId) {
      return res.status(400).json({
        success: false,
        error: "Clinic ID is required",
      });
    }

    const snapshot = await firestore
      .collection("users")
      .where("role", "==", "staff")
      .where("clinicId", "==", clinicId)
      .where("isVerified", "==", true)
      .get();

    const staff = [];
    for (const doc of snapshot.docs) {
      const staffData = doc.data();
      staff.push({
        id: doc.id,
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone || "",
        category: staffData.category,
        serviceIds: staffData.serviceIds || [],
        serviceNames: staffData.serviceNames || [],
        isOnDuty: staffData.isOnDuty || false,
        rating: staffData.rating || 0,
        casesCompleted: staffData.casesCompleted || 0,
        approvedAt: staffData.approvedAt,
      });
    }

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// APPROVE STAFF
exports.approveStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const userDoc = await firestore.collection("users").doc(staffId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const userData = userDoc.data();

    if (userData.role !== "staff") {
      return res.status(400).json({
        success: false,
        error: "User is not a staff member",
      });
    }

    if (userData.isVerified) {
      return res.status(400).json({
        success: false,
        error: "Staff member is already approved",
      });
    }

    await firestore.collection("users").doc(staffId).update({
      isVerified: true,
      isAvailable: true,
      isOnDuty: false,
      approvedAt: timestamp(),
      updatedAt: timestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Staff approved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// REJECT STAFF (DELETE)
exports.rejectStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const userDoc = await firestore.collection("users").doc(staffId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const userData = userDoc.data();

    if (userData.role !== "staff") {
      return res.status(400).json({
        success: false,
        error: "User is not a staff member",
      });
    }

    const name = userData.name;

    await firestore.collection("users").doc(staffId).delete();

    try {
      await auth.deleteUser(staffId);
    } catch (authError) {
      // Auth user may not exist, continue with deletion
    }

    return res.status(200).json({
      success: true,
      message: `${name} has been rejected and removed`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET STAFF BY ID
exports.getStaffById = async (req, res) => {
  try {
    const { staffId } = req.params;

    const userDoc = await firestore.collection("users").doc(staffId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const staffData = userDoc.data();

    if (staffData.role !== "staff") {
      return res.status(400).json({
        success: false,
        error: "User is not a staff member",
      });
    }

    return res.status(200).json({
      success: true,
      staff: {
        id: staffId,
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone || "",
        category: staffData.category,
        clinicId: staffData.clinicId,
        serviceIds: staffData.serviceIds || [],
        serviceNames: staffData.serviceNames || [],
        isVerified: staffData.isVerified,
        isOnDuty: staffData.isOnDuty || false,
        rating: staffData.rating || 0,
        totalRatings: staffData.totalRatings || 0,
        casesCompleted: staffData.casesCompleted || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// UPDATE STAFF DUTY STATUS
exports.updateDutyStatus = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { isOnDuty } = req.body;

    if (typeof isOnDuty !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "isOnDuty must be true or false",
      });
    }

    const userDoc = await firestore.collection("users").doc(staffId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const userData = userDoc.data();

    if (userData.role !== "staff") {
      return res.status(400).json({
        success: false,
        error: "User is not a staff member",
      });
    }

    if (!userData.isVerified) {
      return res.status(403).json({
        success: false,
        error: "Cannot update duty status. Staff not verified yet.",
      });
    }

    await firestore.collection("users").doc(staffId).update({
      isOnDuty,
      lastStatusChangeAt: timestamp(),
      updatedAt: timestamp(),
    });

    return res.status(200).json({
      success: true,
      message: isOnDuty ? "You are now on duty" : "You are now off duty",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};