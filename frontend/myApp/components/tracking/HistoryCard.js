import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const getStatusColor = (status) => {
  const colors = {
    pending: "#f59e0b", assigned: "#3b82f6", enRoute: "#8b5cf6",
    arrived: "#10b981", completed: "#10b981", cancelled: "#ef4444"
  };
  return colors[status] || "#6b7280";
};

const formatTime = (timestamp, t) => {
  if (!timestamp) return t('common.timeNotSet');
  try {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    if (isNaN(date.getTime())) return t('common.timeNotSet');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return t('common.timeNotSet'); }
};

export default function HistoryCard({ item, colors, t, appointment, onPress, onDelete }) {
  const isEmergency = item.isEmergency;
  const isSelfVisit = item.resolvedVia === "self-visit";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {isEmergency ? (
        <>
          <Text style={[styles.service, { color: colors.text + "70" }]}>{item.matchedServiceName}</Text>
          <Text style={[styles.symptoms, { color: colors.text + "50" }]} numberOfLines={2}>{item.symptoms}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.symptomsMedical, { color: colors.text + "80" }]} numberOfLines={2}>{item.symptoms}</Text>
          <Text style={[styles.serviceSmall, { color: colors.text + "50" }]}>{t('emergency.service')}: {item.matchedServiceName}</Text>

          {appointment && (
            <View style={styles.clinicInfo}>
              <Ionicons name="business-outline" size={12} color={colors.text + "40"} />
              <Text style={[styles.clinicName, { color: colors.text + "40" }]}>
                {appointment.status === "completed" ? t('patient.visitedClinic') : t('patient.bookedAt')}: {appointment.clinicName}
              </Text>
              <Text style={[styles.time, { color: colors.text + "40" }]}>
                {t('common.at')} {formatTime(appointment.appointmentDate, t)}
              </Text>
            </View>
          )}

          {!appointment && isSelfVisit && item.visitedClinicName && (
            <View style={styles.clinicInfo}>
              <Ionicons name="walk-outline" size={12} color="#10b981" />
              <Text style={[styles.clinicName, { color: "#10b981" }]}>
                {t('patient.walkInVisit')}: {item.visitedClinicName}
              </Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  service: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  symptoms: { fontSize: 12 },
  symptomsMedical: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  serviceSmall: { fontSize: 12, marginBottom: 2 },
  clinicInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  clinicName: { fontSize: 11, flex: 1 },
  time: { fontSize: 10, marginLeft: 4 },
});