import React from "react";
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const getStatusColor = (status) => {
  const colors = {
    pending: "#f59e0b", assigned: "#3b82f6", enRoute: "#8b5cf6",
    arrived: "#10b981", completed: "#10b981", cancelled: "#ef4444"
  };
  return colors[status] || "#6b7280";
};

const formatDate = (timestamp, t) => {
  if (!timestamp) return t('common.dateNotSet');
  try {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    if (isNaN(date.getTime())) return t('common.dateNotSet');
    return date.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return t('common.dateNotSet'); }
};

const formatTime = (timestamp, t) => {
  if (!timestamp) return t('common.timeNotSet');
  try {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    if (isNaN(date.getTime())) return t('common.timeNotSet');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return t('common.timeNotSet'); }
};

export default function DetailsModal({
  visible, onClose, selectedCase, selectedAppointment, colors, t,
  onViewAppointments, renderClinics
}) {
  if (!selectedCase) return null;

  const isEmergency = selectedCase.isEmergency;
  const isCompleted = selectedCase.status === "completed" || selectedCase.status === "cancelled";
  const hasAppointment = selectedAppointment !== null;
  const isSelfVisit = selectedCase.resolvedVia === "self-visit";
  const isPendingRoutine = !isEmergency && selectedCase.status === "pending";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isEmergency ? t('emergency.emergencyDetails') : t('patient.medicalRecord')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[styles.statusCard, { backgroundColor: colors.background }]}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCase.status) + "20" }]}>
                <Text style={[styles.statusText, { color: getStatusColor(selectedCase.status) }]}>
                  {selectedCase.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.service')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{selectedCase.matchedServiceName}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text + "60" }]}>{t('patient.symptomsReason')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{selectedCase.symptoms}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text + "60" }]}>{t('patient.dateOfRequest')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {selectedCase.createdAt ? formatDate(selectedCase.createdAt, t) : t('common.dateNotSet')}
              </Text>
            </View>

            {selectedCase.resolvedAt && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text + "60" }]}>{t('patient.resolvedOn')}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{formatDate(selectedCase.resolvedAt, t)}</Text>
              </View>
            )}

            {selectedCase.assignedStaffName && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text + "60" }]}>{t('emergency.respondingStaff')}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{selectedCase.assignedStaffName}</Text>
              </View>
            )}

            {isCompleted && !isEmergency && hasAppointment && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.subheader, { color: colors.text + "70" }]}>{t('patient.appointmentDetails')}</Text>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.clinic')}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{selectedAppointment.clinicName}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.date')}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{formatDate(selectedAppointment.appointmentDate, t)}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.time')}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{formatTime(selectedAppointment.appointmentDate, t)}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text + "60" }]}>{t('appointments.status')}</Text>
                  <View style={[styles.apptStatusBadge, { backgroundColor: getStatusColor(selectedAppointment.status) + "20" }]}>
                    <Text style={[styles.apptStatusText, { color: getStatusColor(selectedAppointment.status) }]}>
                      {selectedAppointment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.viewApptButton, { backgroundColor: colors.primary }]} onPress={onViewAppointments}>
                  <Ionicons name="calendar-outline" size={18} color="#fff" />
                  <Text style={styles.viewApptButtonText}>{t('appointments.viewAppointments')}</Text>
                </TouchableOpacity>
              </>
            )}

            {isCompleted && !isEmergency && !hasAppointment && isSelfVisit && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.subheader, { color: colors.text + "70" }]}>{t('patient.visitDetails')}</Text>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text + "60" }]}>{t('patient.clinicVisited')}</Text>
                  <View style={styles.selfVisitInfo}>
                    <Ionicons name="walk-outline" size={18} color="#10b981" />
                    <Text style={[styles.value, { color: "#10b981" }]}>{selectedCase.visitedClinicName}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text + "60" }]}>{t('patient.visitType')}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{t('patient.walkInNoAppointment')}</Text>
                </View>
              </>
            )}

            {isPendingRoutine && selectedCase.nearbyClinics?.length > 0 && renderClinics()}
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "bold" },
  section: { marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#e5e5e5", marginVertical: 16 },
  subheader: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  apptStatusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  apptStatusText: { fontSize: 11, fontWeight: "bold" },
  viewApptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  viewApptButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  selfVisitInfo: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
});