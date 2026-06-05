import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/admin`;

export const createClinicAdmin = async (adminData) => {
  try {
    const response = await fetch(`${BASE_URL}/clinic-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminData),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, clinicName: data.clinicName, admin: data.admin };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getClinicAdmins = async () => {
  try {
    const response = await fetch(`${BASE_URL}/clinic-admins`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, admins: data.admins || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteClinicAdmin = async (adminId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinic-admin/${adminId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get system statistics for SuperAdmin dashboard
export const getSystemStats = async () => {
  try {
    const response = await fetch(`${BASE_URL}/system-stats`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, stats: data.stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
};