import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getClinicStats } from "../../services/clinicServices";

export default function AdminDashboard({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 0,
    pendingStaff: 0,
    approvedStaff: 0,
    totalServices: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
  });

  const loadStats = async () => {
    setRefreshing(true);
    const result = await getClinicStats(user.clinicId);
    if (result.success) {
      setStats(result.stats);
    }
    setRefreshing(false);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const quickActions = [
    {
      id: "staff",
      title: "Staff Management",
      icon: "people-outline",
      color: "#3b82f6",
      bgColor: "#3b82f620",
      onPress: () => navigation.navigate("Staff"),
      badge: stats.pendingStaff > 0 ? `${stats.pendingStaff} pending` : null,
    },
    {
      id: "services",
      title: "Service Management",
      icon: "medkit-outline",
      color: "#10b981",
      bgColor: "#10b98120",
      onPress: () => navigation.navigate("Service"),
      badge: null,
    },
    {
      id: "appointments",
      title: "Appointments",
      icon: "calendar-outline",
      color: "#8b5cf6",
      bgColor: "#8b5cf620",
      onPress: () => navigation.navigate("Appointments"),
      badge: stats.pendingAppointments > 0 ? `${stats.pendingAppointments} pending` : null,
    },
    {
      id: "profile",
      title: "My Profile",
      icon: "person-outline",
      color: "#f59e0b",
      bgColor: "#f59e0b20",
      onPress: () => navigation.navigate("Profile"),
      badge: null,
    },
  ];

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text + "60" }]}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStats} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Hello, {user?.name?.split(" ")[0] || "Admin"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text + "60" }]}>
          {user?.clinicName}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="people-outline" label="Total Staff" value={stats.totalStaff} color="#3b82f6" />
        <StatCard icon="people-outline" label="Pending Approval" value={stats.pendingStaff} color="#f59e0b" />
        <StatCard icon="medkit-outline" label="Services" value={stats.totalServices} color="#10b981" />
        <StatCard icon="calendar-outline" label="Appointments" value={stats.totalAppointments} color="#8b5cf6" />
        <StatCard icon="time-outline" label="Pending Appointments" value={stats.pendingAppointments} color="#f59e0b" />
        <StatCard icon="checkmark-done-outline" label="Completed" value={stats.completedAppointments} color="#10b981" />
      </View>

      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
              {action.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // Header
  header: { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  
  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  statCard: {
    width: "31%",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 10, textAlign: "center" },
  
  // Quick Actions
  quickActionsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 14 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: "48%",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  actionIcon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  badge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});