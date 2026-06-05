import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const formatDateTime = (date, t) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.toLocaleDateString()} ${t('common.at')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function ClinicActionCard({ 
  clinic, colors, t, onBook, onDirections, onVisited, isBooked, appointment 
}) {
  if (isBooked && appointment) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 2 }]}>
        <View style={styles.bookedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[styles.bookedBadgeText, { color: "#10b981" }]}>{t('appointments.appointmentBooked')}</Text>
        </View>
        
        <Text style={[styles.name, { color: colors.text }]}>{clinic.name}</Text>
        <Text style={[styles.address, { color: colors.text + "70" }]} numberOfLines={2}>{clinic.address}</Text>
        <Text style={[styles.distance, { color: colors.primary }]}>{clinic.distance?.toFixed(1)} {t('common.kmAway')}</Text>

        <View style={styles.appointmentInfo}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.appointmentInfoText, { color: colors.text + "70" }]}>
            {formatDateTime(appointment.appointmentDate, t)}
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.directionsButton, { borderColor: colors.primary }]} onPress={onDirections}>
            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
            <Text style={[styles.directionsButtonText, { color: colors.primary }]}>{t('patient.directions')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.viewButton, { backgroundColor: colors.primary }]} onPress={onBook}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.viewButtonText}>{t('appointments.viewAppointment')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.cancelButton, { borderColor: "#ef4444" }]} onPress={() => onBook?.("cancel")}>
          <Text style={[styles.cancelButtonText, { color: "#ef4444" }]}>{t('appointments.cancelBooking')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.text }]}>{clinic.name}</Text>
      <Text style={[styles.address, { color: colors.text + "70" }]} numberOfLines={2}>{clinic.address}</Text>
      <Text style={[styles.distance, { color: colors.primary }]}>{clinic.distance?.toFixed(1)} {t('common.kmAway')}</Text>
      {clinic.phone && <Text style={[styles.phone, { color: colors.text + "50" }]}>📞 {clinic.phone}</Text>}

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.primary }]} onPress={onBook}>
          <Ionicons name="calendar-outline" size={14} color="#fff" />
          <Text style={styles.bookButtonText}>{t('patient.book')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.directionsButton, { borderColor: colors.primary }]} onPress={onDirections}>
          <Ionicons name="navigate-outline" size={14} color={colors.primary} />
          <Text style={[styles.directionsButtonText, { color: colors.primary }]}>{t('patient.directions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.visitedButton, { borderColor: "#10b981" }]} onPress={onVisited}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
          <Text style={[styles.visitedButtonText, { color: "#10b981" }]}>{t('patient.visited')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  name: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  address: { fontSize: 12, marginBottom: 4, lineHeight: 16 },
  distance: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  phone: { fontSize: 11, marginBottom: 10 },
  buttons: { flexDirection: "row", gap: 8, marginTop: 4 },
  bookButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  directionsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  directionsButtonText: { fontWeight: "600", fontSize: 12 },
  visitedButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  visitedButtonText: { fontWeight: "600", fontSize: 12 },
  bookedBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  bookedBadgeText: { fontSize: 12, fontWeight: "bold" },
  appointmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  appointmentInfoText: { fontSize: 12, fontWeight: "500" },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: { fontWeight: "600", fontSize: 12 },
});