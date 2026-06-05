import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  ScrollView, FlatList, RefreshControl, Alert, Linking
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { getCase, getPatientCases, getActiveCases, markCaseResolved, deleteCase, deleteAllCases } from "../../services/emergencyService";
import { bookAppointment, cancelAppointment, getPatientAppointments } from "../../services/appointmentService";

// Components
import EmergencyCard from "../../components/tracking/EmergencyCard";
import RoutineCard from "../../components/tracking/RoutineCard";
import HistoryCard from "../../components/tracking/HistoryCard";
import ClinicActionCard from "../../components/tracking/ClinicActionCard";
import DetailsModal from "../../components/tracking/DetailsModal";
import BookingModal from "../../components/tracking/BookingModal";

export default function CaseTracking({ route, navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const caseIdFromParams = route?.params?.caseId;

  // State
  const [emergencyCase, setEmergencyCase] = useState(null);
  const [routineCases, setRoutineCases] = useState([]);
  const [caseHistory, setCaseHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [booking, setBooking] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "live") loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useFocusEffect(useCallback(() => { loadData(); }, [refreshKey]));

  const loadData = async () => {
    setRefreshing(true);
    try {
      if (caseIdFromParams && !emergencyCase && routineCases.length === 0) {
        const result = await getCase(caseIdFromParams);
        if (result.success && result.case) {
          result.case.isEmergency ? setEmergencyCase(result.case) : setRoutineCases([result.case]);
        }
      } else {
        const activeResult = await getActiveCases(user.uid);
        if (activeResult.success) {
          setEmergencyCase(activeResult.emergency || null);
          setRoutineCases((activeResult.routines || []).filter(r => r.status === "pending"));
        }
      }
      const historyResult = await getPatientCases(user.uid);
      if (historyResult.success) {
        setCaseHistory(historyResult.cases?.filter(c => c.status === "completed" || c.status === "cancelled") || []);
      }
      const appointmentsResult = await getPatientAppointments(user.uid);
      if (appointmentsResult.success) {
        setAppointments(appointmentsResult.appointments || []);
      }
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadData();
  };

  const getAppointmentForCase = (caseItem) => {
    if (!caseItem || caseItem.isEmergency) return null;
    return appointments.find(a => a.caseId === caseItem.id) || null;
  };

  const getActiveAppointmentForCase = (caseItem) => {
    if (!caseItem || caseItem.isEmergency) return null;
    return appointments.find(a => a.caseId === caseItem.id && (a.status === "pending" || a.status === "accepted")) || null;
  };

  const handleDeleteCase = async (caseItem) => {
    Alert.alert(t('common.confirmDelete'), t('common.deleteWarning'), [
      { text: t('common.cancel'), style: "cancel" },
      { text: t('common.delete'), style: "destructive", onPress: async () => {
        const result = await deleteCase(caseItem.id);
        if (result.success) {
          Alert.alert(t('common.success'), t('common.deleted'));
          onRefresh();
          setShowDetailsModal(false);
        } else Alert.alert(t('common.error'), result.error);
      }}
    ]);
  };

  const handleDeleteAllCases = async () => {
    if (caseHistory.length === 0) {
      Alert.alert(t('common.noData'), t('common.noCasesToDelete'));
      return;
    }
    Alert.alert(t('common.confirmDeleteAll'), t('common.deleteAllCasesWarning', { count: caseHistory.length }), [
      { text: t('common.cancel'), style: "cancel" },
      { text: t('common.deleteAll'), style: "destructive", onPress: async () => {
        const result = await deleteAllCases(user.uid);
        if (result.success) {
          Alert.alert(t('common.success'), t('common.deletedCount', { count: result.deletedCount }));
          onRefresh();
        } else Alert.alert(t('common.error'), result.error);
      }}
    ]);
  };

  const handleBookAppointment = async (dateTime) => {
    if (!selectedClinic || !selectedCase) return;
    setBooking(true);
    const result = await bookAppointment({
      patientId: user.uid, patientName: user.name, patientPhone: user.phone || "",
      clinicId: selectedClinic.id, clinicName: selectedClinic.name,
      serviceId: selectedCase.matchedServiceId, serviceName: selectedCase.matchedServiceName,
      symptoms: selectedCase.symptoms, appointmentDate: dateTime.toISOString(), caseId: selectedCase.id,
    });
    if (result.success) {
      Alert.alert(t('common.success'), t('appointments.bookedSuccess'));
      setShowBookingModal(false);
      onRefresh();
      navigation.navigate("Appointments");
    } else Alert.alert(t('common.error'), result.error);
    setBooking(false);
  };

  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert(t('appointments.cancelAppointment'), t('appointments.cancelConfirmation'), [
      { text: t('common.no'), style: "cancel" },
      { text: t('common.yes'), style: "destructive", onPress: async () => {
        const result = await cancelAppointment(appointmentId);
        if (result.success) {
          Alert.alert(t('common.success'), t('appointments.cancelledSuccess'));
          onRefresh();
        } else Alert.alert(t('common.error'), result.error);
      }}
    ]);
  };

  const handleMarkAsResolved = async (caseId, clinic) => {
    Alert.alert(t('patient.confirmClinicVisit'), t('patient.receivedTreatment', { name: clinic.name }), [
      { text: t('common.cancel'), style: "cancel" },
      { text: t('common.yes'), onPress: async () => {
        const result = await markCaseResolved(caseId, clinic.id, clinic.name);
        if (result.success) {
          Alert.alert(t('common.success'), t('patient.caseResolved', { name: clinic.name }));
          onRefresh();
          setShowDetailsModal(false);
        } else Alert.alert(t('common.error'), result.error);
      }}
    ]);
  };

  // Helper function to open directions
  const openDirections = (latitude, longitude) => {
    if (latitude && longitude) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
    } else {
      Alert.alert(t('common.error'), "Clinic location not available");
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasActiveCases = emergencyCase || routineCases.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "live" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab("live")}
        >
          <Text style={[styles.tabText, { color: activeTab === "live" ? colors.primary : colors.text + "60" }]}>{t('patient.liveCases')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "history" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, { color: activeTab === "history" ? colors.primary : colors.text + "60" }]}>{t('patient.history')} ({caseHistory.length})</Text>
        </TouchableOpacity>
        {activeTab === "history" && caseHistory.length > 0 && (
          <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAllCases}>
            <Ionicons name="trash-bin-outline" size={18} color="#ef4444" />
            <Text style={[styles.deleteAllText, { color: "#ef4444" }]}>{t('common.all')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === "live" ? (
        <ScrollView 
          contentContainerStyle={styles.content} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {hasActiveCases ? (
            <>
              {emergencyCase && (
                <EmergencyCard 
                  item={emergencyCase} 
                  colors={colors} 
                  t={t} 
                  onPress={() => {
                    setSelectedCase(emergencyCase);
                    setSelectedAppointment(null);
                    setShowDetailsModal(true);
                  }} 
                />
              )}
              {routineCases.length > 0 && (
                <View style={styles.routineSection}>
                  <Text style={[styles.routineSectionTitle, { color: colors.text + "70" }]}>{t('patient.routineRequests')} ({routineCases.length})</Text>
                  {routineCases.map(item => {
                    const activeAppointment = getActiveAppointmentForCase(item);
                    const bookedClinic = activeAppointment ? item.nearbyClinics?.find(c => c.id === activeAppointment.clinicId) : null;
                    return (
                      <RoutineCard
                        key={item.id}
                        item={item}
                        colors={colors}
                        t={t}
                        onPress={() => {
                          setSelectedCase(item);
                          setSelectedAppointment(activeAppointment);
                          setShowDetailsModal(true);
                        }}
                        hasActiveBooking={activeAppointment !== null}
                        bookedClinicName={bookedClinic?.name}
                      />
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit-outline" size={48} color={colors.text + "40"} />
              <Text style={[styles.emptyText, { color: colors.text + "60" }]}>{t('patient.noActiveCases')}</Text>
              <TouchableOpacity 
                style={[styles.requestButton, { backgroundColor: colors.primary }]} 
                onPress={() => navigation.navigate("EmergencyRequest")}
              >
                <Text style={styles.requestButtonText}>{t('patient.requestEmergencyHelp')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={caseHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              colors={colors}
              t={t}
              appointment={getAppointmentForCase(item)}
              onPress={() => {
                setSelectedCase(item);
                setSelectedAppointment(getAppointmentForCase(item));
                setShowDetailsModal(true);
              }}
              onDelete={() => handleDeleteCase(item)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={colors.text + "40"} />
              <Text style={[styles.emptyText, { color: colors.text + "60" }]}>{t('patient.noHistory')}</Text>
            </View>
          }
        />
      )}

      <DetailsModal
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        selectedCase={selectedCase}
        selectedAppointment={selectedAppointment}
        colors={colors}
        t={t}
        onViewAppointments={() => {
          setShowDetailsModal(false);
          navigation.navigate("Appointments");
        }}
        renderClinics={() => (
          <View style={styles.detailSection}>
            <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>{t('patient.nearbyClinics')}</Text>
            <Text style={[styles.detailHint, { color: colors.text + "50" }]}>
              {selectedAppointment && (selectedAppointment.status === "pending" || selectedAppointment.status === "accepted")
                ? t('patient.youHaveBookingAt')
                : t('patient.bookAppointment')}
            </Text>
            
            {selectedAppointment && (selectedAppointment.status === "pending" || selectedAppointment.status === "accepted") ? (
              (() => {
                const bookedClinic = selectedCase?.nearbyClinics?.find(c => c.id === selectedAppointment.clinicId);
                return (
                  <ClinicActionCard
                    clinic={bookedClinic}
                    colors={colors}
                    t={t}
                    onBook={() => navigation.navigate("Appointments")}
                    onDirections={() => {
                      if (bookedClinic?.latitude && bookedClinic?.longitude) {
                        openDirections(bookedClinic.latitude, bookedClinic.longitude);
                      }
                    }}
                    onVisited={() => {}}
                    isBooked={true}
                    appointment={selectedAppointment}
                  />
                );
              })()
            ) : (
              selectedCase?.nearbyClinics?.map(clinic => (
                <ClinicActionCard
                  key={clinic.id}
                  clinic={clinic}
                  colors={colors}
                  t={t}
                  onBook={() => {
                    setSelectedClinic(clinic);
                    setSelectedDate(new Date());
                    setSelectedTime("09:00");
                    setIsRescheduling(false);
                    setShowBookingModal(true);
                    setShowDetailsModal(false);
                  }}
                  onDirections={() => {
                    if (clinic?.latitude && clinic?.longitude) {
                      openDirections(clinic.latitude, clinic.longitude);
                    }
                  }}
                  onVisited={() => handleMarkAsResolved(selectedCase.id, clinic)}
                />
              ))
            )}
          </View>
        )}
      />

      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        clinic={selectedClinic}
        colors={colors}
        t={t}
        onConfirm={handleBookAppointment}
        loading={booking}
        isRescheduling={isRescheduling}
      />
    </View>
  );
}

// Styles
const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabContainer: { 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e5e5e5", 
    alignItems: "center" 
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
    marginLeft: 8 
  },
  deleteAllText: { fontSize: 12, fontWeight: "600" },
  content: { padding: 20, paddingBottom: 40 },
  routineSection: { marginTop: 16 },
  routineSectionTitle: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12, marginBottom: 20 },
  requestButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  requestButtonText: { color: "#fff", fontWeight: "bold" },
  historyList: { padding: 16, paddingBottom: 30 },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 12, marginBottom: 4 },
  detailHint: { fontSize: 12, marginBottom: 12, fontStyle: "italic" },
});