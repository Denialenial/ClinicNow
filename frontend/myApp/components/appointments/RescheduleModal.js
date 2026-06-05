import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const generateAvailableTimes = (date) => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const allTimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  if (isToday) {
    const currentHour = now.getHours();
    return allTimes.filter(time => parseInt(time.split(":")[0]) > currentHour);
  }
  return allTimes;
};

export default function RescheduleModal({
  visible, onClose, appointment, colors, t,
  onConfirm, loading, selectedDate, setSelectedDate,
  selectedTime, setSelectedTime, availableTimes, setAvailableTimes
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      const times = generateAvailableTimes(selectedDate);
      setAvailableTimes(times);
    }
  }, [selectedDate, visible]);

  if (!appointment) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('appointments.rescheduleAppointment')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[styles.infoCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.clinicName, { color: colors.text }]}>{appointment.clinicName}</Text>
              <Text style={[styles.serviceName, { color: colors.text + "60" }]}>{appointment.serviceName}</Text>
            </View>

            {/* Date Picker */}
            <TouchableOpacity style={[styles.dateButton, { borderColor: colors.border }]} onPress={() => setShowDatePicker(!showDatePicker)}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>{selectedDate.toLocaleDateString()}</Text>
              <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={18} color={colors.text + "50"} />
            </TouchableOpacity>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                {[0, 1, 2, 3, 4, 5, 6].map((days) => {
                  const date = new Date();
                  date.setDate(date.getDate() + days);
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  const isPast = days === 0 && date < new Date().setHours(0, 0, 0, 0);
                  return (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.dateOption,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: colors.border,
                          opacity: isPast ? 0.5 : 1
                        }
                      ]}
                      onPress={() => { if (!isPast) { setSelectedDate(date); setShowDatePicker(false); } }}
                      disabled={isPast}
                    >
                      <Text style={[styles.dateDay, { color: isSelected ? "#fff" : colors.text }]}>
                        {days === 0 ? t('common.today') : date.toLocaleDateString(undefined, { weekday: "short" })}
                      </Text>
                      <Text style={[styles.dateNum, { color: isSelected ? "#fff" : colors.text }]}>{date.getDate()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Time Picker */}
            <View style={styles.timeContainer}>
              <Text style={[styles.timeLabel, { color: colors.text }]}>{t('appointments.selectTime')}:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableTimes.length > 0 ? (
                  availableTimes.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor: selectedTime === time ? colors.primary : colors.background,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[styles.timeOptionText, { color: selectedTime === time ? "#fff" : colors.text }]}>{time}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.noTimesText, { color: colors.text + "50" }]}>{t('appointments.noAvailableTimes')}</Text>
                )}
              </ScrollView>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={onClose}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: availableTimes.length === 0 ? 0.5 : 1 }]}
                onPress={onConfirm}
                disabled={loading || availableTimes.length === 0}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? t('common.processing') : t('appointments.confirmReschedule')}
                </Text>
              </TouchableOpacity>
            </View>
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
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  clinicName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  serviceName: { fontSize: 13 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: { fontSize: 14, flex: 1 },
  datePickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  dateOption: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 70,
  },
  dateDay: { fontSize: 12, marginBottom: 2 },
  dateNum: { fontSize: 16, fontWeight: "bold" },
  timeContainer: { marginBottom: 20 },
  timeLabel: { fontSize: 14, marginBottom: 10 },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  timeOptionText: { fontSize: 13 },
  noTimesText: { fontSize: 13, textAlign: "center", paddingVertical: 10 },
  buttonGroup: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: { fontWeight: "600" },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: { color: "#fff", fontWeight: "bold" },
});