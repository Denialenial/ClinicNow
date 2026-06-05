import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RoutineCard({ 
  item, colors, t, onPress, hasActiveBooking, bookedClinicName 
}) {
  const clinicsList = item.nearbyClinics || [];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>{t('emergency.routine')}</Text>
        </View>
        {hasActiveBooking && (
          <View style={styles.bookedIndicator}>
            <Ionicons name="checkmark-circle" size={12} color="#10b981" />
            <Text style={[styles.bookedIndicatorText, { color: "#10b981" }]}>{t('appointments.booked')}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.service, { color: colors.text }]}>{item.matchedServiceName}</Text>
      <Text style={[styles.symptoms, { color: colors.text + "50" }]} numberOfLines={2}>{item.symptoms}</Text>

      {hasActiveBooking && bookedClinicName ? (
        <View style={styles.bookedPreview}>
          <Ionicons name="business-outline" size={14} color={colors.primary} />
          <Text style={[styles.bookedPreviewText, { color: colors.text + "70" }]}>
            {t('appointments.bookedAt')}: {bookedClinicName}
          </Text>
        </View>
      ) : (
        clinicsList.length > 0 && (
          <View style={styles.clinicsList}>
            <Text style={[styles.clinicsListTitle, { color: colors.text + "70" }]}>{t('patient.nearbyClinics')}:</Text>
            {clinicsList.slice(0, 2).map((clinic, idx) => (
              <View key={idx} style={styles.miniClinicCard}>
                <Text style={[styles.miniClinicName, { color: colors.text }]}>{clinic.name}</Text>
                <Text style={[styles.miniClinicDistance, { color: colors.primary }]}>
                  {clinic.distance?.toFixed(1)} {t('common.kmAway')}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.viewButton, { borderColor: colors.border }]} onPress={onPress}>
              <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                {hasActiveBooking ? t('patient.viewBookingDetails') : t('patient.viewAllClinics')}
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#3b82f620",
  },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  bookedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10b98120",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bookedIndicatorText: { fontSize: 10, fontWeight: "bold" },
  service: { fontSize: 14 },
  symptoms: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  bookedPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  bookedPreviewText: { fontSize: 12, fontWeight: "500" },
  clinicsList: { marginTop: 12, gap: 8 },
  clinicsListTitle: { fontSize: 12, marginBottom: 4 },
  miniClinicCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  miniClinicName: { fontSize: 13, flex: 1 },
  miniClinicDistance: { fontSize: 11, fontWeight: "500" },
  viewButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 8,
  },
  viewButtonText: { fontSize: 13, fontWeight: "500" },
});