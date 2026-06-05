import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { 
  getClinicAppointments, 
  acceptAppointment, 
  completeAppointment 
} from "../../services/appointmentService";

export default function Appointments({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const isOnDuty = user?.isOnDuty === true;

  const loadAppointments = useCallback(async () => {
    try {
      // Only load appointments if ON DUTY
      if (!isOnDuty) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      
      const result = await getClinicAppointments(user.clinicId);
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
  }, [user?.clinicId, isOnDuty]);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 60000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleAccept = async (appointment) => {
    Alert.alert(
      "Accept Appointment",
      `Accept appointment for ${appointment.patientName} on ${formatDate(appointment.appointmentDate)} at ${formatTime(appointment.appointmentDate)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            const result = await acceptAppointment(appointment.id);
            if (result.success) {
              Alert.alert("Success", "Appointment accepted");
              loadAppointments();
              setShowDetailsModal(false);
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (appointment) => {
    Alert.alert(
      "Complete Appointment",
      `Mark appointment for ${appointment.patientName} as completed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            const result = await completeAppointment(appointment.id);
            if (result.success) {
              Alert.alert("Success", "Appointment marked as completed");
              loadAppointments();
              setShowDetailsModal(false);
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status, isPast) => {
    if (isPast && status === "pending") return "#6b7280";
    switch (status) {
      case "pending": return "#f59e0b";
      case "accepted": return "#3b82f6";
      case "completed": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusText = (status, isPast) => {
    if (isPast && status === "pending") return "EXPIRED";
    switch (status) {
      case "pending": return "PENDING";
      case "accepted": return "ACCEPTED";
      case "completed": return "COMPLETED";
      case "cancelled": return "CANCELLED";
      default: return status.toUpperCase();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Time not set";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    
    if (activeTab === "upcoming") {
      return appointments.filter(a => 
        a.status === "pending" && new Date(a.appointmentDate) >= now
      );
    } else if (activeTab === "accepted") {
      return appointments.filter(a => a.status === "accepted");
    } else if (activeTab === "history") {
      return appointments.filter(a => 
        a.status === "completed" || 
        a.status === "cancelled" ||
        (a.status === "pending" && new Date(a.appointmentDate) < now)
      );
    }
    return [];
  };

  const filteredAppointments = getFilteredAppointments();
  
  const upcomingCount = appointments.filter(a => 
    a.status === "pending" && new Date(a.appointmentDate) >= new Date()
  ).length;
  const acceptedCount = appointments.filter(a => a.status === "accepted").length;
  const historyCount = appointments.filter(a => 
    a.status === "completed" || 
    a.status === "cancelled" ||
    (a.status === "pending" && new Date(a.appointmentDate) < new Date())
  ).length;

  const renderAppointmentCard = ({ item }) => {
    const isPast = item.isPast && item.status === "pending";
    const canAccept = item.status === "pending" && !isPast;
    const canComplete = item.status === "accepted";
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: isPast ? 0.6 : 1 }]}
        onPress={() => {
          setSelectedAppointment(item);
          setShowDetailsModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, isPast) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status, isPast) }]}>
              {getStatusText(item.status, isPast)}
            </Text>
          </View>
          <Text style={[styles.date, { color: colors.text + "50" }]}>
            {new Date(item.appointmentDate).toLocaleDateString()}
          </Text>
        </View>

        <Text style={[styles.patientName, { color: colors.text }]}>{item.patientName}</Text>
        <Text style={[styles.serviceName, { color: colors.text + "70" }]}>{item.serviceName}</Text>
        
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text style={[styles.time, { color: colors.primary }]}>
            {formatTime(item.appointmentDate)}
          </Text>
          {item.isToday && !isPast && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Today</Text>
            </View>
          )}
          {isPast && (
            <Text style={[styles.expiredText, { color: "#ef4444" }]}>Expired</Text>
          )}
        </View>

        {item.symptoms && (
          <Text style={[styles.symptoms, { color: colors.text + "50" }]} numberOfLines={2}>
            {item.symptoms}
          </Text>
        )}

        {/* Quick action buttons on card */}
        {canAccept && (
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAccept(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        )}
        
        {canComplete && (
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: "#10b981" }]}
            onPress={() => handleComplete(item)}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Appointments</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={[styles.statNumber, { color: "#f59e0b" }]}>{upcomingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text + "60" }]}>Upcoming</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.statNumber, { color: "#3b82f6" }]}>{acceptedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text + "60" }]}>Accepted</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.statNumber, { color: "#10b981" }]}>{historyCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text + "60" }]}>History</Text>
          </View>
        </View>
      </View>

      {/* Off Duty Banner */}
      {!isOnDuty && (
        <View style={[styles.offDutyBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="moon-outline" size={20} color={colors.primary} />
          <Text style={[styles.offDutyText, { color: colors.text + "70" }]}>
            You are OFF DUTY. Go on duty to view and manage clinic appointments.
          </Text>
        </View>
      )}

      {/* Tabs - Only show if ON DUTY */}
      {isOnDuty && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "upcoming" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text style={[styles.tabText, { color: activeTab === "upcoming" ? colors.primary : colors.text + "60" }]}>
              Upcoming ({upcomingCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "accepted" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("accepted")}
          >
            <Text style={[styles.tabText, { color: activeTab === "accepted" ? colors.primary : colors.text + "60" }]}>
              Accepted ({acceptedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("history")}
          >
            <Text style={[styles.tabText, { color: activeTab === "history" ? colors.primary : colors.text + "60" }]}>
              History ({historyCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List - Only show if ON DUTY */}
      {isOnDuty ? (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.text + "40"} />
              <Text style={[styles.emptyText, { color: colors.text + "60" }]}>
                No {activeTab} appointments
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.offDutyContainer}>
          <Ionicons name="moon-outline" size={64} color={colors.text + "30"} />
          <Text style={[styles.offDutyTitle, { color: colors.text }]}>Off Duty Mode</Text>
          <Text style={[styles.offDutyDescription, { color: colors.text + "60" }]}>
            You are currently off duty. Toggle your status to ON DUTY from the dashboard to view and manage clinic appointments.
          </Text>
        </View>
      )}

      {/* Appointment Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
                  <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedAppointment.status, selectedAppointment.isPast) + "20" }]}>
                    <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedAppointment.status, selectedAppointment.isPast) }]}>
                      {getStatusText(selectedAppointment.status, selectedAppointment.isPast)}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Patient</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAppointment.patientName}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Phone</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAppointment.patientPhone || "N/A"}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Service</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAppointment.serviceName}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedAppointment.appointmentDate)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Time</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatTime(selectedAppointment.appointmentDate)}</Text>
                </View>

                {selectedAppointment.symptoms && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Symptoms</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAppointment.symptoms}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                {selectedAppointment.status === "pending" && !selectedAppointment.isPast && (
                  <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAccept(selectedAppointment)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.modalButtonText}>Accept Appointment</Text>
                  </TouchableOpacity>
                )}

                {selectedAppointment.status === "accepted" && (
                  <TouchableOpacity
                    style={[styles.completeButton, { backgroundColor: "#10b981" }]}
                    onPress={() => handleComplete(selectedAppointment)}
                  >
                    <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                    <Text style={styles.modalButtonText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}

                {selectedAppointment.isPast && selectedAppointment.status === "pending" && (
                  <View style={styles.expiredContainer}>
                    <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
                    <Text style={[styles.expiredMessage, { color: "#ef4444" }]}>
                      This appointment has expired. The patient needs to book a new appointment.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  
  // Off Duty Banner
  offDutyBanner: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10, 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 8,
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1 
  },
  offDutyText: { fontSize: 13, flex: 1 },
  
  // Off Duty Container
  offDutyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  offDutyTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  offDutyDescription: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  
  tabContainer: { flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e5e5" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  listContent: { padding: 16, paddingBottom: 30 },
  
  // Card Styles
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "bold" },
  date: { fontSize: 11 },
  patientName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  serviceName: { fontSize: 13, marginBottom: 6 },
  timeContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  time: { fontSize: 13, fontWeight: "500" },
  todayBadge: { backgroundColor: "#10b98120", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  todayText: { fontSize: 10, color: "#10b981", fontWeight: "bold" },
  expiredText: { fontSize: 11, fontWeight: "500" },
  symptoms: { fontSize: 12, lineHeight: 16, marginTop: 4 },
  
  // Button Styles
  acceptButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  completeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "90%", maxHeight: "80%", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  modalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  
  // Detail Modal Styles
  detailCard: { borderRadius: 12, padding: 16, marginBottom: 16, alignItems: "center" },
  statusBadgeLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusTextLarge: { fontSize: 12, fontWeight: "bold" },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 12, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: "500" },
  
  // Expired Container
  expiredContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 20, marginTop: 10, gap: 8 },
  expiredMessage: { textAlign: "center", fontSize: 14 },
  
  // Empty State
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
});