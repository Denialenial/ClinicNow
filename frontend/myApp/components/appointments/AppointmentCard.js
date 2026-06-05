import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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

const formatTime = (dateString, t) => {
  if (!dateString) return t('common.timeNotSet');
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function AppointmentCard({ item, colors, t, onPress, onDelete }) {
  const upcoming = (item.status === "pending" || item.status === "accepted") && !item.isPast;
  const isPast = item.isPast && item.status === "pending";
  const isHistory = item.status === "completed" || item.status === "cancelled" || item.status === "rejected" || isPast;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: isPast ? 0.6 : 1 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, isPast) + "20" }]}>
          <Ionicons name={getStatusIcon(item.status)} size={12} color={getStatusColor(item.status, isPast)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status, isPast) }]}>
            {getStatusText(item.status, isPast, t)}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.date, { color: colors.text + "50" }]}>
            {new Date(item.appointmentDate).toLocaleDateString()}
          </Text>
          {isHistory && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteIcon}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.clinicName, { color: colors.text }]} numberOfLines={1}>{item.clinicName}</Text>
      <Text style={[styles.serviceName, { color: colors.text + "70" }]} numberOfLines={1}>{item.serviceName}</Text>

      <View style={styles.timeContainer}>
        <Ionicons name="time-outline" size={14} color={colors.primary} />
        <Text style={[styles.time, { color: colors.primary }]}>
          {formatTime(item.appointmentDate, t)}
        </Text>
        {item.isToday && upcoming && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>{t('appointments.today')}</Text>
          </View>
        )}
        {isPast && (
          <Text style={[styles.expiredText, { color: "#ef4444" }]}>{t('appointments.expired')}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteIcon: { padding: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 10, fontWeight: "bold" },
  date: { fontSize: 11 },
  clinicName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  serviceName: { fontSize: 13, marginBottom: 6 },
  timeContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  time: { fontSize: 13, fontWeight: "500" },
  todayBadge: {
    backgroundColor: "#10b98120",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayText: { fontSize: 10, color: "#10b981", fontWeight: "bold" },
  expiredText: { fontSize: 11, fontWeight: "500" },
});