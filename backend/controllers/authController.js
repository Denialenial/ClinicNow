const { firestore, auth } = require("../config/firebase");

const timestamp = () => new Date();

const sanitizeUserData = (userData) => {
  const sanitized = { ...userData };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

const validPublicRoles = ["patient", "staff"];
const validStaffCategories = ["Doctor", "Nurse", "Ambulance Driver", "Pharmacist", "Lab Technician"];

const roleAllowedServices = {
  "Doctor": [
    "Emergency Care", "Maternity", "Injury Care",
    "General Consultation", "Dental Care", "Eye Care",
    "Child Health", "Counselling", "Skin Care",
    "Diagnostic Testing", "Rehabilitation", "Chronic Disease Management"
  ],
  "Nurse": [
    "Emergency Care", "Maternity", "Injury Care",
    "General Consultation", "Child Health", "Chronic Disease Management"
  ],
  "Ambulance Driver": [
    "Emergency Care", "Injury Care"
  ],
  "Pharmacist": [
    "Pharmacy"
  ],
  "Lab Technician": [
    "Diagnostic Testing"
  ]
};

exports.registerUser = async (req, res) => {
  try {
    const { uid, name, email, phone, role, clinicId, category, serviceIds } = req.body;

    if (!uid || !name || !email || !role) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (!validPublicRoles.includes(role)) {
      return res.status(403).json({ success: false, error: "Invalid role selection" });
    }

    const existingUser = await firestore.collection("users").doc(uid).get();
    if (existingUser.exists) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    const userData = {
      uid, name: name.trim(), email: email.trim().toLowerCase(),
      phone: phone?.trim() || "", role, isBanned: false,
      createdAt: timestamp(), updatedAt: timestamp(),
    };

    if (role === "staff") {
      if (!clinicId) return res.status(400).json({ success: false, error: "Clinic selection is required" });
      if (!category) return res.status(400).json({ success: false, error: "Staff category is required" });
      if (!validStaffCategories.includes(category)) {
        return res.status(400).json({ success: false, error: "Invalid staff category" });
      }
      if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({ success: false, error: "At least one service is required" });
      }

      const clinicDoc = await firestore.collection("clinics").doc(clinicId).get();
      if (!clinicDoc.exists) {
        return res.status(404).json({ success: false, error: "Selected clinic does not exist" });
      }

      const invalidServices = [], roleMismatchServices = [], validServiceIds = [], validServiceNames = [];

      for (const serviceId of serviceIds) {
        const serviceDoc = await firestore.collection("services").doc(serviceId).get();
        if (!serviceDoc.exists) {
          invalidServices.push(serviceId);
          continue;
        }
        const serviceName = serviceDoc.data().name;
        if (!roleAllowedServices[category].includes(serviceName)) {
          roleMismatchServices.push(serviceName);
          continue;
        }
        const offeredServiceDoc = await firestore
          .collection("clinics").doc(clinicId).collection("offeredServices").doc(serviceId).get();
        if (!offeredServiceDoc.exists) {
          invalidServices.push(serviceName);
          continue;
        }
        validServiceIds.push(serviceId);
        validServiceNames.push(serviceName);
      }

      if (invalidServices.length > 0) {
        return res.status(400).json({ success: false, error: `Services not offered: ${invalidServices.join(", ")}` });
      }
      if (roleMismatchServices.length > 0) {
        return res.status(400).json({ success: false, error: `${category} cannot be assigned to: ${roleMismatchServices.join(", ")}` });
      }

      userData.clinicId = clinicId;
      userData.category = category;
      userData.serviceIds = validServiceIds;
      userData.serviceNames = validServiceNames;
      userData.isVerified = false;
      userData.isAvailable = false;
      userData.isOnDuty = false;
      userData.rating = 0;
      userData.totalRatings = 0;
      userData.casesCompleted = 0;
      userData.approvedAt = null;
      userData.lastActiveAt = null;
    }

    if (role === "patient") {
      userData.totalRequests = 0;
      userData.dateOfBirth = req.body.dateOfBirth || null;
      userData.homeLocation = req.body.location || null;
    }

    await firestore.collection("users").doc(uid).set(userData);

    return res.status(201).json({
      success: true,
      message: role === "staff" ? "Registration successful. Awaiting clinic administrator approval." : "Registration successful.",
      user: sanitizeUserData({ id: uid, ...userData }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: "UID is required" });

    const userDoc = await firestore.collection("users").doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: "User not found" });

    const userData = userDoc.data();
    if (userData.isBanned) return res.status(403).json({ success: false, error: "Your account has been banned" });
    if (userData.role === "staff" && !userData.isVerified) {
      return res.status(403).json({ success: false, error: "Your account is awaiting clinic administrator approval" });
    }

    await firestore.collection("users").doc(uid).update({ lastLoginAt: timestamp() });

    return res.status(200).json({ success: true, user: sanitizeUserData({ id: uid, ...userData }) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: "User not found" });
    return res.status(200).json({ success: true, user: sanitizeUserData({ id: userId, ...userDoc.data() }) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const allowedUpdates = ["name", "phone", "isAvailable", "isOnDuty", "location"];
    const filteredUpdates = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
    });
    filteredUpdates.updatedAt = timestamp();
    await firestore.collection("users").doc(userId).update(filteredUpdates);
    return res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: "User not found" });
    const userData = userDoc.data();
    if (userData.role !== "staff") return res.status(400).json({ success: false, error: "Only staff accounts can be verified" });
    await firestore.collection("users").doc(userId).update({
      isVerified: true, isAvailable: true, isOnDuty: false, approvedAt: timestamp(), updatedAt: timestamp(),
    });
    return res.status(200).json({ success: true, message: "Staff approved successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStaffDutyStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnDuty } = req.body;

    if (typeof isOnDuty !== "boolean") {
      return res.status(400).json({ success: false, error: "isOnDuty must be true or false" });
    }

    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: "User not found" });

    const userData = userDoc.data();
    if (userData.role !== "staff") return res.status(400).json({ success: false, error: "Only staff can update duty status" });
    if (!userData.isVerified) return res.status(403).json({ success: false, error: "Account not verified yet." });

    if (isOnDuty === false) {
      const activeCases = await firestore
        .collection("cases")
        .where("assignedStaffId", "==", userId)
        .where("status", "in", ["assigned", "enRoute", "arrived"])
        .get();
      if (!activeCases.empty) {
        return res.status(400).json({
          success: false,
          error: `Cannot go off duty. You have ${activeCases.size} active case(s) to complete first.`,
        });
      }
    }

    await firestore.collection("users").doc(userId).update({
      isOnDuty, lastStatusChangeAt: timestamp(), updatedAt: timestamp(),
    });

    return res.status(200).json({
      success: true,
      message: isOnDuty ? "You are now on duty" : "You are now off duty",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned } = req.body;
    if (typeof isBanned !== "boolean") {
      return res.status(400).json({ success: false, error: "isBanned must be true or false" });
    }
    await firestore.collection("users").doc(userId).update({
      isBanned, bannedAt: isBanned ? timestamp() : null, updatedAt: timestamp(),
    });
    await auth.updateUser(userId, { disabled: isBanned });
    return res.status(200).json({
      success: true,
      message: isBanned ? "User banned successfully" : "User unbanned successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};