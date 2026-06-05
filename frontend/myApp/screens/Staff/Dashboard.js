import React, { useState, useCallback, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Animated,
  ScrollView
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { updateStaffDutyStatus } from "../../services/authService";

export default function Dashboard({ navigation }) { 
  const { colors } = useTheme(); 
  const { user, refreshUser } = useAuth(); 
  const [loading, setLoading] = useState(false); 
  const [scaleValue] = useState(new Animated.Value(1)); 
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnDuty || false);

  // Load initial duty status from user object
  useEffect(() => {
    setIsOnDuty(user?.isOnDuty || false);
  }, [user?.isOnDuty]);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        if (refreshUser) {
          await refreshUser();
        }
        setIsOnDuty(user?.isOnDuty || false);
      };
      loadUserData();
    }, [user?.isOnDuty, refreshUser])
  );

  const animatePress = () => { 
    Animated.sequence([ 
      Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }), 
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }), 
    ]).start(); 
  }; 

  const toggleDutyStatus = async () => { 
    animatePress(); 
    setLoading(true); 
    
    const nextDutyState = !isOnDuty; 
    const result = await updateStaffDutyStatus(user.uid, nextDutyState); 

    if (result.success) { 
      // Update local state immediately
      setIsOnDuty(nextDutyState);
      
      // Update user object in context
      user.isOnDuty = nextDutyState;
      
      // Refresh user data from server to ensure consistency
      if (refreshUser) {
        await refreshUser();
      }
      
      Alert.alert("Status Updated", result.message); 
    } else { 
      Alert.alert("Error", result.error); 
    } 
    setLoading(false); 
  }; 

  // Quick Actions
  const quickActions = [
    {
      id: "pending_cases",
      title: "Pending Cases",
      icon: "alert-circle",
      color: "#f59e0b",
      bgColor: "#f59e0b20",
      onPress: () => navigation.navigate("Emergency", { screen: "EmergencyCases" }),
      disabled: !isOnDuty,
    },
    {
      id: "my_cases",
      title: "My Cases",
      icon: "medkit",
      color: "#3b82f6",
      bgColor: "#3b82f620",
      onPress: () => navigation.navigate("Emergency", { screen: "EmergencyCases" }),
      disabled: false,
    },
    {
      id: "appointments",
      title: "Appointments",
      icon: "calendar",
      color: "#8b5cf6",
      bgColor: "#8b5cf620",
      onPress: () => navigation.navigate("Appointments"),
      disabled: !isOnDuty, // Only show appointments when on duty
    },
    {
      id: "profile",
      title: "My Profile",
      icon: "person",
      color: "#10b981",
      bgColor: "#10b98120",
      onPress: () => navigation.navigate("Profile"),
      disabled: false,
    },
  ];

  // Get rating display (1 decimal place)
  const ratingDisplay = user?.rating ? user.rating.toFixed(1) : "0.0";
  
  // Get star icon based on rating
  const getStarIcon = () => {
    const rating = user?.rating || 0;
    if (rating >= 4.5) return "star";
    if (rating >= 3.5) return "star-half";
    return "star-outline";
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return ( 
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    > 
      {/* Header Row */}
      <View style={styles.headerRow}> 
        <View style={styles.headerTextContainer}> 
          <Text style={[styles.greetingPrefix, { color: colors.text + "70" }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.greeting, { color: colors.text }]}> 
            {user?.name?.split(" ")[0] || "Staff"} 
          </Text> 
          <Text style={[styles.subtitle, { color: colors.text + "60" }]}> 
            {user?.category} • {user?.clinicName} 
          </Text> 
        </View> 

        {/* Duty Toggle Pill */}
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <TouchableOpacity 
            style={[styles.togglePill, { backgroundColor: isOnDuty ? "#10b981" : "#ef4444" }]} 
            onPress={toggleDutyStatus}
            disabled={loading}
            activeOpacity={0.8}
          > 
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons 
                  name={isOnDuty ? "power" : "power-outline"} 
                  size={14} 
                  color="#fff" 
                />
                <Text style={styles.toggleText}>{isOnDuty ? "ON DUTY" : "OFF DUTY"}</Text> 
              </>
            )}
          </TouchableOpacity> 
        </Animated.View>
      </View> 

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.statusHint}> 
          <Ionicons 
            name={isOnDuty ? "checkmark-circle" : "close-circle"} 
            size={22} 
            color={isOnDuty ? "#10b981" : "#ef4444"} 
          /> 
          <Text style={[styles.hintText, { color: colors.text }]}> 
            {isOnDuty 
              ? "✓ You are available for emergency alerts" 
              : "✗ You are offline. Tap the button above to receive alerts"} 
          </Text> 
        </View> 
      </View> 

      {/* Statistics Cards */}
      <View style={styles.statsContainer}> 
        <View style={[styles.statCard, { backgroundColor: colors.card }]}> 
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-done-circle" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{user?.casesCompleted || 0}</Text> 
          <Text style={[styles.statLabel, { color: colors.text + "50" }]}>Cases Completed</Text> 
        </View> 
        
        <View style={[styles.statCard, { backgroundColor: colors.card }]}> 
          <View style={styles.statIconContainer}>
            <Ionicons name={getStarIcon()} size={24} color="#f59e0b" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{ratingDisplay}</Text> 
          <Text style={[styles.statLabel, { color: colors.text + "50" }]}>Rating</Text> 
        </View> 
      </View> 

      {/* Quick Actions Section */}
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickActionCard, 
                { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border,
                  opacity: action.disabled ? 0.5 : 1 
                }
              ]}
              onPress={action.onPress}
              disabled={action.disabled}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>{action.title}</Text>
              {action.disabled && (
                <Text style={[styles.quickActionHint, { color: colors.text + "40" }]}>
                  {action.id === "pending_cases" || action.id === "appointments" 
                    ? "Go on duty first" 
                    : "Not available"}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duty Status Info */}
      {!isOnDuty && (
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text + "70" }]}>
            When you go on duty, you will start receiving emergency alerts and can view clinic appointments.
          </Text>
        </View>
      )}

      {/* Recent Activity / Tips Section */}
      <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Pro Tips</Text>
        </View>
        <Text style={[styles.tipsText, { color: colors.text + "60" }]}>
          • Stay on duty to receive emergency alerts in real-time
        </Text>
        <Text style={[styles.tipsText, { color: colors.text + "60" }]}>
          • Update your status when you arrive at the patient's location
        </Text>
        <Text style={[styles.tipsText, { color: colors.text + "60" }]}>
          • Complete cases promptly to improve your rating
        </Text>
      </View>
    </ScrollView>
  ); 
} 

const styles = StyleSheet.create({ 
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  
  // Header Styles
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  headerTextContainer: { flex: 1 },
  greetingPrefix: { fontSize: 14, marginBottom: 2 },
  greeting: { fontSize: 26, fontWeight: "bold", marginBottom: 4 }, 
  subtitle: { fontSize: 13 }, 
  
  // Toggle Pill Styles
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    gap: 6,
    minWidth: 110,
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Status Card
  statusCard: { borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1 }, 
  statusHint: { flexDirection: "row", alignItems: "center", gap: 12 }, 
  hintText: { fontSize: 13, fontWeight: "500", flex: 1, lineHeight: 18 }, 
  
  // Statistics
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 28 }, 
  statCard: { flex: 1, alignItems: "center", padding: 16, borderRadius: 16, gap: 8 }, 
  statIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.05)" },
  statValue: { fontSize: 26, fontWeight: "bold" }, 
  statLabel: { fontSize: 11, textAlign: "center" }, 
  
  // Quick Actions
  quickActionsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 14 },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickActionCard: { 
    width: "48%", 
    borderRadius: 14, 
    padding: 16, 
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  quickActionIcon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  quickActionTitle: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  quickActionHint: { fontSize: 10, textAlign: "center", marginTop: 2 },
  
  // Info Card
  infoCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    marginBottom: 20 
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  
  // Tips Section
  tipsCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 8 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  tipsTitle: { fontSize: 15, fontWeight: "600" },
  tipsText: { fontSize: 12, lineHeight: 20, marginBottom: 6 },
});