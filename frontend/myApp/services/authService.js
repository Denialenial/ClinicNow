import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/auth`;

const sanitizeUserData = (user) => {
  if (!user) return null;

  return {
    ...user,
    uid: user.uid || user.id,

    rating:
      typeof user.rating === "string"
        ? parseFloat(user.rating)
        : user.rating || 0,

    totalRatings:
      typeof user.totalRatings === "string"
        ? parseInt(user.totalRatings, 10)
        : user.totalRatings || 0,

    // Ensure serviceIds is always an array
    serviceIds: user.serviceIds || [],
    serviceNames: user.serviceNames || [],
  };
};

export const registerUser = async (userData) => {
  try {
    const firebaseResult = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const uid = firebaseResult.user.uid;

    const payload = {
      uid,
      name: userData.name?.trim(),
      email: userData.email?.trim().toLowerCase(),
      phone: userData.phone?.trim() || "",
      role: userData.role,
    };

    if (userData.role === "patient") {
      if (userData.dateOfBirth) {
        payload.dateOfBirth = userData.dateOfBirth;
      }
      if (userData.location) {
        payload.location = userData.location;
      }
    }

    if (userData.role === "staff") {
      if (!userData.clinicId) {
        return {
          success: false,
          error: "Clinic selection is required",
        };
      }
      if (!userData.category) {
        return {
          success: false,
          error: "Staff category is required",
        };
      }
      if (!userData.serviceIds || userData.serviceIds.length === 0) {
        return {
          success: false,
          error: "At least one service selection is required",
        };
      }

      payload.clinicId = userData.clinicId;
      payload.category = userData.category;
      payload.serviceIds = userData.serviceIds;
    }

    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Registration failed",
      };
    }

    return {
      success: true,
      user: sanitizeUserData(data.user),
      message: data.message,
    };
  } catch (error) {
    let userMessage = "Registration failed. Please try again.";
    
    if (error.code === "auth/email-already-in-use") {
      userMessage = "This email is already registered. Please use a different email or try logging in.";
    } else if (error.code === "auth/invalid-email") {
      userMessage = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      userMessage = "Password should be at least 6 characters.";
    } else if (error.code === "auth/network-request-failed") {
      userMessage = "Network error. Please check your internet connection.";
    }
    
    return {
      success: false,
      error: userMessage,
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const firebaseResult = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = firebaseResult.user.uid;

    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Login failed",
      };
    }

    return {
      success: true,
      user: sanitizeUserData(data.user),
    };
  } catch (error) {
    if (__DEV__) {
      console.log("Login failed:", error.code);
    }
    
    let userMessage = "Invalid email or password. Please try again.";
    
    if (error.code === "auth/invalid-email") {
      userMessage = "Please enter a valid email address.";
    } else if (error.code === "auth/user-disabled") {
      userMessage = "This account has been disabled.";
    } else if (error.code === "auth/too-many-requests") {
      userMessage = "Too many failed attempts. Please try again later.";
    }
    
    return {
      success: false,
      error: userMessage,
    };
  }
};

// GET USER
export const getUser = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}`);

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to load user",
      };
    }

    return {
      success: true,
      user: sanitizeUserData(data.user),
    };
  } catch (error) {
    console.error("Get user error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

// UPDATE USER
export const updateUser = async (userId, updates) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to update user",
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Update user error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

// STAFF DUTY STATUS
export const updateStaffDutyStatus = async (userId, isOnDuty) => {
  try {
    const response = await fetch(`${BASE_URL}/staff/${userId}/duty`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isOnDuty }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// STAFF VERIFICATION (Clinic Admin)
export const verifyStaff = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/staff/${userId}/approve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to verify staff",
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Verify staff error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

// BAN USER (SuperAdmin)
export const banUser = async (userId, isBanned) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}/ban`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isBanned }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to update user ban status",
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Ban user error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};