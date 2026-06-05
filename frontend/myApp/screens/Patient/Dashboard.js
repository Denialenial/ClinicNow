import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { getActiveCases, getPatientCases } from "../../services/emergencyService";
import { getPatientAppointments } from "../../services/appointmentService";

export default function Dashboard({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [emergencyCase, setEmergencyCase] = useState(null);
  const [routineCases, setRoutineCases] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    completedCases: 0,
    upcomingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      
      // Get active cases (emergency + routines)
      const activeResult = await getActiveCases(user.uid);
      if (activeResult.success) {
        setEmergencyCase(activeResult.emergency || null);
        setRoutineCases(activeResult.routines || []);
      }
      
      // Get all cases for stats
      const historyResult = await getPatientCases(user.uid);
      if (historyResult.success && historyResult.cases) {
        const allCases = historyResult.cases;
        
        const completed = allCases.filter(c => c.status === "completed").length;
        
        setStats(prev => ({
          ...prev,
          totalCases: allCases.length,
          completedCases: completed,
        }));
        
        const recent = allCases
          .filter(c => c.status === "completed" || c.status === "cancelled")
          .slice(0, 3);
        setRecentCases(recent);
      }
      
      // Get upcoming appointments (future dates only)
      const appointmentsResult = await getPatientAppointments(user.uid);
      if (appointmentsResult.success) {
        const now = new Date();
        const upcoming = appointmentsResult.appointments.filter(a => {
          const appointmentDate = new Date(a.appointmentDate);
          return (a.status === "pending" || a.status === "accepted") && appointmentDate >= now;
        }).length;
        
        setStats(prev => ({
          ...prev,
          upcomingAppointments: upcoming,
        }));
      }
    } catch (err) {
      console.error("Load dashboard error:", err);
      setError(t('errors.somethingWrong'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToTracking = (caseId) => {
    navigation.navigate("Patient", {
      screen: "CaseTracking",
      params: { caseId },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "assigned": return "#3b82f6";
      case "enRoute": return "#8b5cf6";
      case "arrived": return "#10b981";
      case "completed": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "enRoute": return t('emergency.enRoute');
      default: return t(`emergency.${status}`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return t('common.recent');
    const date = timestamp.toDate();
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('common.today');
    if (diffDays === 1) return t('common.yesterday');
    if (diffDays < 7) return `${diffDays} ${t('common.daysAgo')}`;
    return date.toLocaleDateString();
  };

  const renderEmergencyCard = () => (
    <TouchableOpacity
      style={[styles.emergencyCard, { backgroundColor: colors.card }]}
      onPress={() => navigateToTracking(emergencyCase.id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.emergencyBadge}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={[styles.emergencyBadgeText, { color: "#ef4444" }]}>{t('emergency.emergency')}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(emergencyCase.status) }]} />
      </View>
      
      <Text style={[styles.cardStatus, { color: getStatusColor(emergencyCase.status) }]}>
        {getStatusText(emergencyCase.status)}
      </Text>
      
      <Text style={[styles.cardService, { color: colors.text + "70" }]}>
        {emergencyCase.matchedServiceName}
      </Text>
      
      <Text style={[styles.cardSymptoms, { color: colors.text + "50" }]} numberOfLines={2}>
        {emergencyCase.symptoms}
      </Text>
      
      <View style={[styles.trackButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.trackButtonText}>{t('patient.trackProgress')} →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRoutineCard = (routine) => (
    <TouchableOpacity
      key={routine.id}
      style={[styles.routineCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigateToTracking(routine.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.routineBadge}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.routineBadgeText, { color: colors.primary }]}>{t('emergency.routine')}</Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.text + "50" }]}>
          {formatDate(routine.createdAt)}
        </Text>
      </View>
      
      <Text style={[styles.cardService, { color: colors.text }]}>
        {routine.matchedServiceName}
      </Text>
      
      <Text style={[styles.cardSymptoms, { color: colors.text + "50" }]} numberOfLines={1}>
        {routine.symptoms}
      </Text>
      
      <View style={styles.routineActions}>
        <TouchableOpacity 
          style={[styles.miniButton, { backgroundColor: colors.primary }]}
          onPress={() => navigateToTracking(routine.id)}
        >
          <Text style={[styles.miniButtonText, { color: "#fff" }]}>{t('patient.viewDetails')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStatCard = (icon, label, value, color, onPress) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text + "60" }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderRecentCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigateToTracking(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.recentHeader}>
        <View style={[styles.recentBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[styles.recentBadgeText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={[styles.recentDate, { color: colors.text + "50" }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.recentService, { color: colors.text + "70" }]}>
        {item.matchedServiceName}
      </Text>
      <Text style={[styles.recentSymptoms, { color: colors.text + "50" }]} numberOfLines={1}>
        {item.symptoms}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.text + "40"} />
        <Text style={[styles.errorText, { color: colors.text + "60" }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadData}
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasActiveCases = emergencyCase || routineCases.length > 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          {t('common.hello')}, {user?.name?.split(" ")[0] || t('common.patient')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text + "60" }]}>
          {t('patient.emergencyMedicalServices')}
        </Text>
      </View>

      {/* Statistics Cards - Quick Actions */}
      <View style={styles.statsContainer}>
        {renderStatCard(
          "medical-outline",
          t('patient.totalCases'),
          stats.totalCases,
          "#3b82f6",
          () => navigation.navigate("Patient", { screen: "CaseTracking" })
        )}
        {renderStatCard(
          "checkmark-circle-outline",
          t('patient.completedCases'),
          stats.completedCases,
          "#10b981",
          () => navigation.navigate("Patient", { screen: "CaseTracking" })
        )}
        {renderStatCard(
          "calendar-outline",
          t('patient.upcomingAppointments'),
          stats.upcomingAppointments,
          "#f59e0b",
          () => navigation.navigate("Appointments")
        )}
      </View>

      {/* Active Cases Section */}
      {hasActiveCases ? (
        <View style={styles.activeSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('patient.activeCases')}</Text>
          
          {emergencyCase && renderEmergencyCard()}
          
          {routineCases.length > 0 && (
            <View style={styles.routineSection}>
              <Text style={[styles.routineSectionTitle, { color: colors.text + "70" }]}>
                {t('patient.routineRequests')} ({routineCases.length})
              </Text>
              {routineCases.map(renderRoutineCard)}
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.requestButton, { backgroundColor: "#dc2626" }]}
          onPress={() => navigation.navigate("EmergencyRequest")}
          activeOpacity={0.8}
        >
          <Ionicons name="medical" size={28} color="#fff" />
          <Text style={styles.requestButtonText}>{t('patient.requestEmergencyHelp')}</Text>
        </TouchableOpacity>
      )}

      {/* Recent Cases Section */}
      {recentCases.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('patient.recentCases')}</Text>
          {recentCases.map(renderRecentCard)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  activeSection: {
    marginBottom: 20,
  },
  routineSection: {
    marginTop: 8,
  },
  routineSectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  emergencyCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  routineCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#ef444420",
  },
  emergencyBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  routineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#3b82f620",
  },
  routineBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardStatus: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardService: {
    fontSize: 14,
  },
  cardSymptoms: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
  },
  trackButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  trackButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  routineActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  miniButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  miniButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
  },
  requestButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  recentSection: {
    marginBottom: 20,
  },
  recentCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recentBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  recentDate: {
    fontSize: 11,
  },
  recentService: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  recentSymptoms: {
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});