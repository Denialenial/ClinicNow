import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getSystemStats } from "../../services/adminService";

export default function Dashboard({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalClinics: 0,
    totalAdmins: 0,
    totalServices: 0,
  });

  const loadStats = async () => {
    setRefreshing(true);
    const result = await getSystemStats();
    if (result.success) {
      setStats(result.stats);
    }
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const managementActions = [
    {
      id: "clinics",
      title: "Clinics",
      description: "Add, edit, or remove clinics",
      icon: "business-outline",
      color: "#3b82f6",
      bgColor: "#3b82f620",
      onPress: () => navigation.navigate("Clinic"),
    },
    {
      id: "admins",
      title: "Clinic Admins",
      description: "Create and manage clinic administrators",
      icon: "people-outline",
      color: "#8b5cf6",
      bgColor: "#8b5cf620",
      onPress: () => navigation.navigate("Admin"),
    },
    {
      id: "services",
      title: "Global Services",
      description: "Manage medical services offered across all clinics",
      icon: "medkit-outline",
      color: "#10b981",
      bgColor: "#10b98120",
      onPress: () => navigation.navigate("GlobalServices"),
    },
    {
      id: "profile",
      title: "My Profile",
      description: "Update your account information",
      icon: "person-outline",
      color: "#f59e0b",
      bgColor: "#f59e0b20",
      onPress: () => navigation.navigate("Profile"),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStats} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Welcome, {user?.name?.split(" ")[0] || "Super Admin"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text + "60" }]}>
          System Administration
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="business-outline" size={22} color="#3b82f6" />
          <Text style={[styles.statBoxValue, { color: colors.text }]}>{stats.totalClinics}</Text>
          <Text style={[styles.statBoxLabel, { color: colors.text + "60" }]}>Clinics</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={22} color="#8b5cf6" />
          <Text style={[styles.statBoxValue, { color: colors.text }]}>{stats.totalAdmins}</Text>
          <Text style={[styles.statBoxLabel, { color: colors.text + "60" }]}>Admins</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="medkit-outline" size={22} color="#10b981" />
          <Text style={[styles.statBoxValue, { color: colors.text }]}>{stats.totalServices}</Text>
          <Text style={[styles.statBoxLabel, { color: colors.text + "60" }]}>Services</Text>
        </View>
      </View>

      {/* Management Actions Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Management</Text>
        <View style={styles.actionsGrid}>
          {managementActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                <Text style={[styles.actionDescription, { color: colors.text + "50" }]}>
                  {action.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text + "40"} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Tips */}
      <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Quick Tips</Text>
        </View>
        <Text style={[styles.tipsText, { color: colors.text + "60" }]}>
          • Add clinics first before creating clinic admins
        </Text>
        <Text style={[styles.tipsText, { color: colors.text + "60" }]}>
          • Global services are available to all clinics
        </Text>
        <Text style={[styles.tipsText, { color: colors.text + "60" }]}>
          • Clinic admins manage their own staff and services
        </Text>
        <Text style={[styles.tipsText, { color: colors.text + "60" }]}>
          • Only SuperAdmin can delete clinics with active staff
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  
  // Header
  header: { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  
  // Stats Row
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statBoxValue: { fontSize: 22, fontWeight: "bold" },
  statBoxLabel: { fontSize: 11 },
  
  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 14 },
  
  // Actions Grid
  actionsGrid: { gap: 12 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  actionDescription: { fontSize: 12 },
  
  // Tips Card
  tipsCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 8 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  tipsTitle: { fontSize: 15, fontWeight: "600" },
  tipsText: { fontSize: 12, lineHeight: 20, marginBottom: 6 },
});