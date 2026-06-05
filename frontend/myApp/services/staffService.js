import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/staff`;

export const getPendingStaff = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/pending/${clinicId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, staff: data.staff || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getApprovedStaff = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/approved/${clinicId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, staff: data.staff || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const approveStaff = async (staffId) => {
  try {
    const response = await fetch(`${BASE_URL}/${staffId}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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

export const rejectStaff = async (staffId) => {
  try {
    const response = await fetch(`${BASE_URL}/${staffId}/reject`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
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