import React from "react";
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const getStatusColor = (status, isPast) => {
  if (isPast && status === "pending") return "#6b7280";
  const colors = {
    pending: "#f59e0b",
    accepted: "#3b82f6",
    completed: "#10b981",
    cancelled: "#ef4444",
    rejected: "#6b7280",
  };
  return colors[status] || "#6b7280";
};

const getStatusText = (status, isPast, t) => {
  if (isPast && status === "pending") return t('appointments.expired');
  const texts = {
    pending: t('appointments.pending'),
    accepted: t('appointments.accepted'),
    completed: t('appointments.completed'),
    cancelled: t('appointments.cancelled'),
    rejected: t('appointments.rejected'),
  };
  return texts[status] || status.toUpperCase();
};

const getStatusIcon = (status) => {
  const icons = {
    pending: "time-outline",
    accepted: "checkmark-circle-outline",
    completed: "checkmark-done-circle-outline",
    cancelled: "close-circle-outline",
    rejected: "close-circle-outline",
  };
  return icons[status] || "calendar-outline";
};

const formatDate = (dateString, t) => {
  if (!dateString) return t('common.dateNotSet');
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const formatTime = (dateString, t) => {
  if (!dateString) return t('common.timeNotSet');
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function AppointmentDetailsModal({
  visible, onClose, appointment, colors, t,
  onReschedule, onCancel, onDirections, onDelete
}) {
  if (!appointment) return null;

  const isActive = (appointment.status === "pending" || appointment.status === "accepted") && !appointment.isPast;
  const isCompleted = appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "rejected";
  const isExpired = appointment.isPast && appointment.status === "pending";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('appointments.appointmentDetails')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View style={[styles.statusCard, { backgroundColor: colors.background }]}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status, appointment.isPast) + "20" }]}>
                <Ionicons name={getStatusIcon(appointment.status)} size={16} color={getStatusColor(appointment.status, appointment.isPast)} />
                <Text style={[styles.statusText, { color: getStatusColor(appointment.status, appointment.isPast) }]}>
                  {getStatusText(appointment.status, appointment.isPast, t)}
                </Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.clinic')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{appointment.clinicName}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.service')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{appointment.serviceName}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.date')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formatDate(appointment.appointmentDate, t)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.time')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formatTime(appointment.appointmentDate, t)}</Text>
            </View>

            {appointment.symptoms && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.symptoms')}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{appointment.symptoms}</Text>
              </View>
            )}

            {appointment.rejectionReason && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.rejectionReason')}</Text>
                <Text style={[styles.value, { color: "#ef4444" }]}>{appointment.rejectionReason}</Text>
              </View>
            )}

            {/* Action Buttons - Active Appointments */}
            {isActive && (
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={[styles.rescheduleButton, { borderColor: colors.primary }]} onPress={onReschedule}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={[styles.rescheduleButtonText, { color: colors.primary }]}>{t('appointments.reschedule')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: "#ef4444" }]} onPress={onCancel}>
                  <Text style={[styles.cancelButtonText, { color: "#ef4444" }]}>{t('appointments.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.directionsButton, { backgroundColor: colors.primary }]} onPress={onDirections}>
                  <Text style={styles.directionsButtonText}>{t('appointments.directions')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons - Completed/Cancelled/Rejected Appointments */}
            {isCompleted && (
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={[styles.directionsButton, { backgroundColor: colors.primary, flex: 2 }]} onPress={onDirections}>
                  <Text style={styles.directionsButtonText}>{t('appointments.getDirections')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteButton, { borderColor: "#ef4444", flex: 1 }]} onPress={onDelete}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.deleteButtonText, { color: "#ef4444" }]}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Expired Message */}
            {isExpired && (
              <View style={styles.expiredContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
                <Text style={[styles.expiredText, { color: "#ef4444" }]}>{t('appointments.expiredMessage')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "bold" },
  section: { marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: "500" },
  buttonGroup: { flexDirection: "row", gap: 12, marginTop: 10, marginBottom: 10 },
  rescheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  rescheduleButtonText: { fontWeight: "600" },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: { fontWeight: "600" },
  directionsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  directionsButtonText: { color: "#fff", fontWeight: "bold" },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteButtonText: { fontWeight: "600" },
  expiredContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginTop: 10,
    gap: 8,
  },
  expiredText: { fontSize: 14, textAlign: "center" },
});