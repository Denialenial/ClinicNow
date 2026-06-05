import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/appointments`;

// Book an appointment (Patient)
export const bookAppointment = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, appointment: result.appointment, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get patient's appointments
export const getPatientAppointments = async (patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/${patientId}`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, appointments: result.appointments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get clinic's appointments (Staff/Clinic Admin)
export const getClinicAppointments = async (clinicId) => {
  try {
    const response = await fetch(`${BASE_URL}/clinic/${clinicId}`);
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, appointments: result.appointments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Accept appointment (Staff/Clinic Admin)
export const acceptAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${BASE_URL}/${appointmentId}/accept`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Cancel appointment (Patient)
export const cancelAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${BASE_URL}/${appointmentId}/cancel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Complete appointment (Staff/Clinic Admin)
export const completeAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${BASE_URL}/${appointmentId}/complete`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Reschedule appointment (Patient)
export const rescheduleAppointment = async (appointmentId, newDateTime) => {
  try {
    const response = await fetch(`${BASE_URL}/${appointmentId}/reschedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentDate: newDateTime }),
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete single appointment (Patient)
export const deleteAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${BASE_URL}/${appointmentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, message: result.message };
  } catch (error) {
    console.error("Delete appointment error:", error);
    return { success: false, error: error.message };
  }
};

// Delete all appointments for a patient
export const deleteAllAppointments = async (patientId) => {
  try {
    const response = await fetch(`${BASE_URL}/patient/${patientId}/appointments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error };
    return { success: true, deletedCount: result.deletedCount, message: result.message };
  } catch (error) {
    console.error("Delete all appointments error:", error);
    return { success: false, error: error.message };
  }
};