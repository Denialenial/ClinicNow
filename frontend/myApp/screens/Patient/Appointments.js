import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import {
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  deleteAppointment,
  deleteAllAppointments
} from "../../services/appointmentService";

// Components
import AppointmentCard from "../../components/appointments/AppointmentCard";
import AppointmentDetailsModal from "../../components/appointments/AppointmentDetailsModal";
import RescheduleModal from "../../components/appointments/RescheduleModal";

export default function Appointments({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Reschedule State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [rescheduling, setRescheduling] = useState(false);

  // Load Data
  const loadAppointments = async () => {
    try {
      const result = await getPatientAppointments(user.uid);
      if (result.success) {
        const now = new Date();
        const processed = (result.appointments || []).map(apt => ({
          ...apt,
          appointmentDateObj: new Date(apt.appointmentDate),
          isPast: new Date(apt.appointmentDate) < now,
          isToday: new Date(apt.appointmentDate).toDateString() === now.toDateString(),
        }));
        setAppointments(processed);
      }
    } catch (error) {
      console.error("Load appointments error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadAppointments(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Helper Functions
  const getDirections = (clinic) => {
    if (clinic?.latitude && clinic?.longitude) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`);
    } else if (clinic?.name) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}`);
    }
  };

  // Appointment Actions
  const handleCancel = (appointment) => {
    Alert.alert(
      t('appointments.cancelAppointment'),
      t('appointments.cancelConfirmationDetails', {
        clinicName: appointment.clinicName,
        date: new Date(appointment.appointmentDate).toLocaleDateString(),
        time: new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }),
      [
        { text: t('common.no'), style: "cancel" },
        {
          text: t('common.yes'),
          style: "destructive",
          onPress: async () => {
            const result = await cancelAppointment(appointment.id);
            if (result.success) {
              Alert.alert(t('common.success'), t('appointments.cancelledSuccess'));
              loadAppointments();
              setShowDetailsModal(false);
            } else {
              Alert.alert(t('common.error'), result.error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAppointment = async (appointment) => {
    Alert.alert(
      t('appointments.deleteAppointment'),
      t('appointments.deleteConfirmation'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            const result = await deleteAppointment(appointment.id);
            if (result.success) {
              Alert.alert(t('common.success'), t('appointments.deleted'));
              loadAppointments();
              setShowDetailsModal(false);
            } else {
              Alert.alert(t('common.error'), result.error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAllAppointments = async () => {
    const historyAppointments = appointments.filter(a =>
      a.status === "completed" || a.status === "cancelled" || a.status === "rejected" || (a.status === "pending" && a.isPast)
    );
    if (historyAppointments.length === 0) {
      Alert.alert(t('common.noData'), t('appointments.noHistoryToDelete'));
      return;
    }
    Alert.alert(
      t('appointments.deleteAllAppointments'),
      t('appointments.deleteAllConfirmation', { count: historyAppointments.length }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.deleteAll'),
          style: "destructive",
          onPress: async () => {
            const result = await deleteAllAppointments(user.uid);
            if (result.success) {
              Alert.alert(t('common.success'), t('appointments.deleteAllSuccess', { count: result.deletedCount }));
              loadAppointments();
            } else {
              Alert.alert(t('common.error'), result.error);
            }
          }
        }
      ]
    );
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleAppointment(appointment);
    setSelectedDate(new Date(appointment.appointmentDate));
    setSelectedTime(formatTimeForPicker(appointment.appointmentDate));
    setShowRescheduleModal(true);
    setShowDetailsModal(false);
  };

  const handleReschedule = async () => {
    if (!rescheduleAppointment) return;
    const dateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":");
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    if (dateTime < new Date()) {
      Alert.alert(t('common.invalidTime'), t('common.cannotBookPast'));
      return;
    }
    setRescheduling(true);
    const result = await rescheduleAppointment(rescheduleAppointment.id, dateTime.toISOString());
    if (result.success) {
      Alert.alert(t('common.success'), t('appointments.rescheduleSuccess'));
      setShowRescheduleModal(false);
      loadAppointments();
    } else {
      Alert.alert(t('common.error'), result.error);
    }
    setRescheduling(false);
  };

  const formatTimeForPicker = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Filters
  const getFilteredAppointments = () => {
    const now = new Date();
    if (activeTab === "upcoming") {
      return appointments.filter(a => (a.status === "pending" || a.status === "accepted") && new Date(a.appointmentDate) >= now);
    } else {
      return appointments.filter(a =>
        a.status === "completed" || a.status === "cancelled" || a.status === "rejected" || (a.status === "pending" && new Date(a.appointmentDate) < now)
      );
    }
  };

  const filteredAppointments = getFilteredAppointments();
  const upcomingCount = appointments.filter(a => (a.status === "pending" || a.status === "accepted") && new Date(a.appointmentDate) >= new Date()).length;
  const historyCount = appointments.filter(a =>
    a.status === "completed" || a.status === "cancelled" || a.status === "rejected" || (a.status === "pending" && new Date(a.appointmentDate) < new Date())
  ).length;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('appointments.myAppointments')}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={[styles.statNumber, { color: "#f59e0b" }]}>{upcomingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text + "60" }]}>{t('appointments.upcoming')}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.statNumber, { color: colors.text + "60" }]}>{historyCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text + "60" }]}>{t('appointments.history')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, { color: activeTab === "upcoming" ? colors.primary : colors.text + "60" }]}>
            {t('appointments.upcoming')} ({upcomingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, { color: activeTab === "history" ? colors.primary : colors.text + "60" }]}>
            {t('appointments.history')} ({historyCount})
          </Text>
        </TouchableOpacity>
        {activeTab === "history" && historyCount > 0 && (
          <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAllAppointments}>
            <Ionicons name="trash-bin-outline" size={18} color="#ef4444" />
            <Text style={[styles.deleteAllText, { color: "#ef4444" }]}>{t('common.all')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            colors={colors}
            t={t}
            onPress={() => {
              setSelectedAppointment(item);
              setShowDetailsModal(true);
            }}
            onDelete={() => handleDeleteAppointment(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.text + "40"} />
            <Text style={[styles.emptyText, { color: colors.text + "60" }]}>
              {activeTab === "upcoming" ? t('appointments.noUpcomingAppointments') : t('appointments.noHistoryAppointments')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <AppointmentDetailsModal
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
        colors={colors}
        t={t}
        onReschedule={() => openRescheduleModal(selectedAppointment)}
        onCancel={() => handleCancel(selectedAppointment)}
        onDirections={() => getDirections(selectedAppointment)}
        onDelete={() => handleDeleteAppointment(selectedAppointment)}
      />

      <RescheduleModal
        visible={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        appointment={rescheduleAppointment}
        colors={colors}
        t={t}
        onConfirm={handleReschedule}
        loading={rescheduling}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        availableTimes={availableTimes}
        setAvailableTimes={setAvailableTimes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  statsContainer: { flexDirection: "row", gap: 16, marginTop: 4 },
  statBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  statNumber: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 13 },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    alignItems: "center",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#ef444420",
    marginLeft: 8,
  },
  deleteAllText: { fontSize: 12, fontWeight: "600" },
  listContent: { padding: 16, paddingBottom: 30 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12, marginBottom: 20 },
});