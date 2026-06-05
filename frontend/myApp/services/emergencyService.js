import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/emergency`;

// PATIENT ROUTES - CASES
// Patient creates a case
export const createCase = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get patient's active emergency case
export const getActiveCase = async (patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/${patientId}/active`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, case: result.case };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all active cases (emergency + routines) for patient
export const getActiveCases = async (patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/${patientId}/active-cases`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, emergency: result.emergency, routines: result.routines };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all patient cases (history)
export const getPatientCases = async (patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/${patientId}/cases`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, cases: result.cases };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get single case by ID
export const getCase = async (caseId) => {
  try {
    const response = await fetch(`${BASE_URL}/cases/${caseId}`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, case: result.case };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// STAFF ROUTES
// Staff: Get pending cases for clinic
export const getPendingCases = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinic/${clinicId}/pending`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, cases: result.cases };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Staff: Get my assigned cases
export const getMyCases = async (staffId) => {
  try {
    const response = await fetch(`${BASE_URL}/staff/${staffId}/mycases`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, cases: result.cases };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Staff: Accept a case
export const acceptCase = async (caseId, staffId, staffName) => {
  try {
    const response = await fetch(`${BASE_URL}/cases/${caseId}/accept`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, staffName }),
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Staff: Update case status
export const updateCaseStatus = async (caseId, status) => {
  try {
    const response = await fetch(`${BASE_URL}/cases/${caseId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// PATIENT SELF-VISIT & DELETE
// Mark routine case as resolved (patient visited clinic on their own)
export const markCaseResolved = async (caseId, clinicId, clinicName) => {
  try {
    const response = await fetch(`${BASE_URL}/cases/${caseId}/resolve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId, clinicName }),
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    console.error("Mark case resolved error:", error);
    return { success: false, error: error.message };
  }
};

// Delete a single case
export const deleteCase = async (caseId) => {
  try {
    const response = await fetch(`${BASE_URL}/cases/${caseId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete all cases for a patient
export const deleteAllCases = async (patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/${patientId}/cases`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, deletedCount: result.deletedCount, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};