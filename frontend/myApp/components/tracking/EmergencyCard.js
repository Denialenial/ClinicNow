import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const getStatusColor = (status) => {
  const colors = {
    pending: "#f59e0b",
    assigned: "#3b82f6",
    enRoute: "#8b5cf6",
    arrived: "#10b981",
    completed: "#10b981",
    cancelled: "#ef4444",
  };
  return colors[status] || "#6b7280";
};

export default function EmergencyCard({ item, colors, t, onPress }) {
  const getMessage = () => {
    if (!item.isEmergency) return t('emergency.routineRequest');
    const messages = {
      pending: t('emergency.searchingStaff'),
      assigned: `${item.assignedStaffName || t('emergency.staff')} ${t('emergency.staffAssigned')}`,
      enRoute: `${item.assignedStaffName || t('emergency.staff')} ${t('emergency.staffOnWay')}`,
      arrived: t('emergency.staffArrived'),
      completed: t('emergency.caseCompleted'),
      cancelled: t('emergency.caseCancelled'),
    };
    return messages[item.status] || t('common.processing');
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="alert-circle" size={14} color="#ef4444" />
          <Text style={[styles.badgeText, { color: "#ef4444" }]}>{t('emergency.emergency')}</Text>
        </View>
        <View style={[styles.dot, { backgroundColor: getStatusColor(item.status) }]} />
      </View>

      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{getMessage()}</Text>
      <Text style={[styles.service, { color: colors.text + "70" }]}>{item.matchedServiceName}</Text>
      <Text style={[styles.symptoms, { color: colors.text + "50" }]} numberOfLines={2}>{item.symptoms}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#ef444420",
  },
  badgeText: { fontSize: 11, fontWeight: "bold" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  status: { fontSize: 15, fontWeight: "500" },
  service: { fontSize: 14 },
  symptoms: { fontSize: 13, lineHeight: 18, marginTop: 4 },
});