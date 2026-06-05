import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/clinics`;

// CLINIC CRUD
export const getClinics = async () => {
  try {
    const response = await fetch(BASE_URL);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to load clinics" };
    }
    return { success: true, clinics: data.clinics || [] };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
};

export const createClinic = async (clinicData) => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clinicData),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, clinic: data.clinic };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateClinic = async (clinicId, clinicData) => {
  try {
    const response = await fetch(`${BASE_URL}/${clinicId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clinicData),
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

export const deleteClinic = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/${clinicId}`, {
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

// GLOBAL SERVICES (SuperAdmin)
// Get all global services
export const getGlobalServices = async () => {
  try {
    const response = await fetch(`${BASE_URL}/services/global`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to load services" };
    }
    return { success: true, services: data.services || [] };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
};

// Add a new global service (SuperAdmin only)
export const addGlobalService = async (serviceData) => {
  try {
    const response = await fetch(`${BASE_URL}/services/global`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serviceData),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, service: data.service };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update a global service (SuperAdmin only)
export const updateGlobalService = async (serviceId, serviceData) => {
  try {
    const response = await fetch(`${BASE_URL}/services/global/${serviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serviceData),
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

// Delete a global service (SuperAdmin only)
export const deleteGlobalService = async (serviceId) => {
  try {
    const response = await fetch(`${BASE_URL}/services/global/${serviceId}`, {
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

// CLINIC SERVICES (Clinic Admin)
// Get services offered by a specific clinic
export const getClinicServices = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/${clinicId}/services`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to load clinic services" };
    }
    return { success: true, services: data.services || [] };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
};

// Get all available global services with status (for clinic admin to manage)
export const getAvailableGlobalServices = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/${clinicId}/services/available`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to load available services" };
    }
    return { success: true, services: data.services || [] };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
};

// Enable a service for a clinic (Clinic Admin)
export const enableClinicService = async (clinicId, serviceId) => {
  try {
    const response = await fetch(`${BASE_URL}/${clinicId}/services/${serviceId}/enable`, {
      method: "POST",
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

// Disable a service for a clinic (Clinic Admin)
export const disableClinicService = async (clinicId, serviceId) => {
  try {
    const response = await fetch(`${BASE_URL}/${clinicId}/services/${serviceId}/disable`, {
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

// Get clinic statistics for Clinic Admin dashboard
export const getClinicStats = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/${clinicId}/stats`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, stats: data.stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
};