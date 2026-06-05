import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getPendingStaff, approveStaff, rejectStaff, getApprovedStaff } from "../../services/staffService";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

function Staff() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingStaff, setPendingStaff] = useState([]);
  const [approvedStaff, setApprovedStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStaff(activeTab === "pending" ? pendingStaff : approvedStaff);
    } else {
      const filtered = (activeTab === "pending" ? pendingStaff : approvedStaff).filter(
        (staff) =>
          staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStaff(filtered);
    }
  }, [searchQuery, activeTab, pendingStaff, approvedStaff]);

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [])
  );

  const loadStaff = async () => {
    setLoading(true);
    await Promise.all([loadPendingStaff(), loadApprovedStaff()]);
    setLoading(false);
  };

  const loadPendingStaff = async () => {
    const result = await getPendingStaff(user.clinicId);
    if (result.success) {
      setPendingStaff(result.staff || []);
      if (activeTab === "pending") {
        setFilteredStaff(result.staff || []);
      }
    }
  };

  const loadApprovedStaff = async () => {
    const result = await getApprovedStaff(user.clinicId);
    if (result.success) {
      setApprovedStaff(result.staff || []);
      if (activeTab === "approved") {
        setFilteredStaff(result.staff || []);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  };

  const handleApprove = async (staffMember) => {
    Alert.alert(
      "Approve Staff",
      `Approve ${staffMember.name} as ${staffMember.category}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setLoading(true);
            const result = await approveStaff(staffMember.id);
            if (result.success) {
              Alert.alert("Success", `${staffMember.name} has been approved`);
              loadStaff();
            } else {
              Alert.alert("Error", result.error);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleReject = async (staffMember) => {
    Alert.alert(
      "Reject Staff",
      `Reject ${staffMember.name}'s application?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await rejectStaff(staffMember.id);
            if (result.success) {
              Alert.alert("Success", `${staffMember.name} has been rejected`);
              loadStaff();
            } else {
              Alert.alert("Error", result.error);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const viewDetails = (staff) => {
    setSelectedStaff(staff);
    setDetailsModalVisible(true);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "Doctor":
        return "#3b82f6";
      case "Nurse":
        return "#10b981";
      case "Ambulance Driver":
        return "#ef4444";
      case "Pharmacist":
        return "#8b5cf6";
      case "Lab Technician":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Doctor":
        return "medkit-outline";
      case "Nurse":
        return "heart-outline";
      case "Ambulance Driver":
        return "car-outline";
      case "Pharmacist":
        return "medkit-outline";
      case "Lab Technician":
        return "microscope-outline";
      default:
        return "person-outline";
    }
  };

  const renderStaffCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => viewDetails(item)}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
          <Ionicons name={getCategoryIcon(item.category)} size={24} color={getCategoryColor(item.category)} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.staffName, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
              {item.category}
            </Text>
          </View>
          <Text style={[styles.email, { color: colors.text + "60" }]}>{item.email}</Text>
        </View>
        {activeTab === "pending" ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item)}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.approvedBadge, { backgroundColor: "#10b981" + "20" }]}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={[styles.approvedText, { color: "#10b981" }]}>Approved</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && pendingStaff.length === 0 && approvedStaff.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Staff Management</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, { color: activeTab === "pending" ? colors.primary : colors.text + "60" }]}>
            Pending ({pendingStaff.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "approved" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("approved")}
        >
          <Text style={[styles.tabText, { color: activeTab === "approved" ? colors.primary : colors.text + "60" }]}>
            Approved ({approvedStaff.length})
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search by name, email, or category..."
      />

      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        renderItem={renderStaffCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchQuery ? "No Results Found" : `No ${activeTab} Staff`}
            message={searchQuery ? "Try a different search term" : activeTab === "pending" ? "No pending staff applications" : "No approved staff members"}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={detailsModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Staff Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedStaff && (
              <View>
                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Full Name</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedStaff.name}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedStaff.email}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Phone</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedStaff.phone || "Not provided"}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Category</Text>
                  <View style={[styles.categoryBadgeLarge, { backgroundColor: getCategoryColor(selectedStaff.category) + "20" }]}>
                    <Text style={[styles.categoryTextLarge, { color: getCategoryColor(selectedStaff.category) }]}>
                      {selectedStaff.category}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.text + "60" }]}>Services</Text>
                  <View style={styles.servicesList}>
                    {selectedStaff.serviceNames && selectedStaff.serviceNames.map((service, index) => (
                      <View key={index} style={[styles.serviceChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.serviceText, { color: colors.text + "80" }]}>{service}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {activeTab === "pending" && (
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.rejectModalButton, { borderColor: "#ef4444" }]}
                      onPress={() => {
                        setDetailsModalVisible(false);
                        handleReject(selectedStaff);
                      }}
                    >
                      <Text style={[styles.rejectModalButtonText, { color: "#ef4444" }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveModalButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        setDetailsModalVisible(false);
                        handleApprove(selectedStaff);
                      }}
                    >
                      <Text style={styles.approveModalButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: { paddingBottom: 20 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
  },
  email: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  categoryBadgeLarge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryTextLarge: {
    fontSize: 14,
    fontWeight: "600",
  },
  servicesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  serviceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
  },
  serviceText: {
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  rejectModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  rejectModalButtonText: {
    fontWeight: "600",
  },
  approveModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  approveModalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Staff;