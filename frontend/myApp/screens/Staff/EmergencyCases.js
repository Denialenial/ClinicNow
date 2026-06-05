import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getPendingCases, getMyCases, acceptCase, updateCaseStatus } from "../../services/emergencyService";

export default function EmergencyCases() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [pendingCases, setPendingCases] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [activeTab, setActiveTab] = useState("mycases"); // Default to mycases
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const isOnDuty = user?.isOnDuty === true;

  const loadData = async () => {
    try {
      // Always load staff's own cases (history and active)
      const my = await getMyCases(user.uid);
      if (my.success) setMyCases(my.cases);
      
      // Only load pending cases if ON DUTY
      if (isOnDuty) {
        const pending = await getPendingCases(user.clinicId);
        if (pending.success) setPendingCases(pending.cases);
      } else {
        // If off duty, clear pending cases
        setPendingCases([]);
      }
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnDuty, user?.clinicId, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.clinicId, user?.uid, isOnDuty])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAccept = async (caseItem) => {
    Alert.alert("Accept Case", `Accept this emergency case for ${caseItem.patientName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          const result = await acceptCase(caseItem.id, user.uid, user.name);
          if (result.success) {
            Alert.alert("Success", "Case accepted successfully");
            loadData();
          } else {
            Alert.alert("Error", result.error);
          }
        },
      },
    ]);
  };

  const handleStatusUpdate = async (caseId, newStatus, actionName) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark as ${actionName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const result = await updateCaseStatus(caseId, newStatus);
            if (result.success) {
              Alert.alert("Success", `Case marked as ${actionName}`);
              loadData();
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "assigned": return "#3b82f6";
      case "enRoute": return "#8b5cf6";
      case "arrived": return "#10b981";
      case "completed": return "#10b981";
      default: return "#6b7280";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    if (timestamp.toDate) {
      return new Date(timestamp.toDate()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    // Handle Firestore timestamp with _seconds
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return "Just now";
  };

  const renderCaseCard = ({ item }) => {
    const hasPhoto = item.photoUri && item.photoUri !== null;
    const isActiveCase = item.status !== "completed" && item.status !== "cancelled";
    
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: item.isEmergency ? "#ef444420" : "#10b98120" }]}>
            <Ionicons 
              name={item.isEmergency ? "alert-circle" : "medkit"} 
              size={10} 
              color={item.isEmergency ? "#ef4444" : "#10b981"} 
            />
            <Text style={[styles.priorityText, { color: item.isEmergency ? "#ef4444" : "#10b981" }]}>
              {item.isEmergency ? "EMERGENCY" : "ROUTINE"}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.text + "50" }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        
        <Text style={[styles.patientName, { color: colors.text }]}>{item.patientName}</Text>
        <Text style={[styles.symptoms, { color: colors.text + "70" }]} numberOfLines={2}>
          {item.symptoms}
        </Text>
        
        <View style={styles.serviceContainer}>
          <Ionicons name="medkit-outline" size={14} color={colors.primary} />
          <Text style={[styles.serviceText, { color: colors.primary }]}>{item.matchedServiceName}</Text>
        </View>

        {/* Photo Indicator */}
        {hasPhoto && (
          <TouchableOpacity 
            style={[styles.photoContainer, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setSelectedCase(item);
              setShowImageModal(true);
            }}
          >
            <Ionicons name="image-outline" size={18} color={colors.primary} />
            <Text style={[styles.photoText, { color: colors.primary }]}>View Patient Photo</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text + "40"} />
          </TouchableOpacity>
        )}

        {/* Accept Button - Only for pending cases when on duty */}
        {activeTab === "pending" && isOnDuty && item.status === "pending" && (
          <TouchableOpacity 
            style={[styles.acceptButton, { backgroundColor: colors.primary }]} 
            onPress={() => handleAccept(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.acceptButtonText}>Accept Case</Text>
          </TouchableOpacity>
        )}

        {/* Status Update Buttons - For active assigned cases */}
        {activeTab === "mycases" && isActiveCase && item.status !== "pending" && (
          <View style={styles.statusButtons}>
            {item.status === "assigned" && (
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: "#8b5cf6" }]} 
                onPress={() => handleStatusUpdate(item.id, "enRoute", "En Route")}
              >
                <Ionicons name="car-outline" size={14} color="#fff" />
                <Text style={styles.statusButtonText}>Start Journey</Text>
              </TouchableOpacity>
            )}
            {item.status === "enRoute" && (
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: "#10b981" }]} 
                onPress={() => handleStatusUpdate(item.id, "arrived", "Arrived")}
              >
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={styles.statusButtonText}>Arrived</Text>
              </TouchableOpacity>
            )}
            {item.status === "arrived" && (
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: "#10b981" }]} 
                onPress={() => handleStatusUpdate(item.id, "completed", "Completed")}
              >
                <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
                <Text style={styles.statusButtonText}>Complete Case</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.statusFooter}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine what to show
  const showPendingTab = isOnDuty;
  const displayData = activeTab === "pending" ? pendingCases : myCases;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Bar - Only show pending tab if ON DUTY */}
      <View style={styles.tabContainer}>
        {showPendingTab && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === "pending" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
            onPress={() => setActiveTab("pending")}
          >
            <Text style={[styles.tabText, { color: activeTab === "pending" ? colors.primary : colors.text + "60" }]}>
              Pending ({pendingCases.length})
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.tab, activeTab === "mycases" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab("mycases")}
        >
          <Text style={[styles.tabText, { color: activeTab === "mycases" ? colors.primary : colors.text + "60" }]}>
            My Cases ({myCases.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Off Duty Banner */}
      {!isOnDuty && (
        <View style={[styles.offDutyBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="moon-outline" size={20} color={colors.primary} />
          <Text style={[styles.offDutyText, { color: colors.text + "70" }]}>
            You are OFF DUTY. Only showing your completed cases.
          </Text>
        </View>
      )}

      {/* Case List */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={renderCaseCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="medkit-outline" size={48} color={colors.text + "40"} />
            <Text style={[styles.emptyText, { color: colors.text + "60" }]}>
              {activeTab === "pending" 
                ? "No pending cases at the moment" 
                : "No cases assigned to you"}
            </Text>
            {!isOnDuty && activeTab === "mycases" && (
              <Text style={[styles.hintText, { color: colors.text + "40" }]}>
                Go on duty to receive new cases
              </Text>
            )}
            {activeTab === "pending" && !isOnDuty && (
              <Text style={[styles.hintText, { color: colors.text + "40" }]}>
                Go on duty to see pending cases
              </Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={[styles.imageModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.imageModalHeader}>
              <Text style={[styles.imageModalTitle, { color: colors.text }]}>
                Patient Photo
              </Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedCase && selectedCase.photoUri && (
              <ScrollView 
                contentContainerStyle={styles.imageScrollContainer}
                showsVerticalScrollIndicator={false}
              >
                <Image 
                  source={{ uri: selectedCase.photoUri }} 
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                <View style={styles.imageInfoContainer}>
                  <Text style={[styles.imagePatientName, { color: colors.text }]}>
                    Patient: {selectedCase.patientName}
                  </Text>
                  <Text style={[styles.imageSymptoms, { color: colors.text + "60" }]}>
                    Symptoms: {selectedCase.symptoms}
                  </Text>
                  <Text style={[styles.imageService, { color: colors.primary }]}>
                    Service: {selectedCase.matchedServiceName}
                  </Text>
                </View>
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
  
  // Tab Styles
  tabContainer: { flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e5e5" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  
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
  
  // List Content
  listContent: { padding: 16, paddingBottom: 30 },
  
  // Card Styles
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: "bold" },
  time: { fontSize: 11 },
  patientName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  symptoms: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  serviceContainer: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  serviceText: { fontSize: 12, fontWeight: "500" },
  
  // Photo Container
  photoContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 1,
    marginBottom: 12,
  },
  photoText: { fontSize: 13, fontWeight: "500", flex: 1 },
  
  // Button Styles
  acceptButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, marginBottom: 12 },
  acceptButtonText: { color: "#fff", fontWeight: "600" },
  statusButtons: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statusButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8 },
  statusButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  
  // Status Footer
  statusFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  
  // Empty State
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12, textAlign: "center" },
  hintText: { fontSize: 12, marginTop: 8, textAlign: "center" },
  
  // Image Modal Styles
  imageModalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.9)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  imageModalContent: { 
    width: "95%", 
    maxHeight: "90%", 
    borderRadius: 16, 
    overflow: "hidden" 
  },
  imageModalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e5e5e5" 
  },
  imageModalTitle: { fontSize: 18, fontWeight: "bold" },
  imageScrollContainer: { alignItems: "center", padding: 16 },
  fullImage: { 
    width: "100%", 
    height: 400, 
    borderRadius: 12,
    backgroundColor: "#000",
  },
  imageInfoContainer: { 
    width: "100%", 
    padding: 12, 
    marginTop: 12,
    gap: 6,
  },
  imagePatientName: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  imageSymptoms: { fontSize: 14, textAlign: "center" },
  imageService: { fontSize: 14, fontWeight: "500", textAlign: "center" },
});