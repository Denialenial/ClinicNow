import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { getClinics } from "../../services/clinicServices";

import { 
    createClinicAdmin, 
    getClinicAdmins, 
    deleteClinicAdmin 
} from "../../services/adminService";

import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

function Admin() {
  const { colors } = useTheme();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAdmins(admins);
    } else {
      const filtered = admins.filter(
        (admin) =>
          admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (admin.clinicName && admin.clinicName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredAdmins(filtered);
    }
  }, [searchQuery, admins]);

  useFocusEffect(
    useCallback(() => {
      loadAdmins();
      loadClinics();
    }, [])
  );

  const loadAdmins = async () => {
    setLoading(true);
    const result = await getClinicAdmins();
    if (result.success) {
      setAdmins(result.admins || []);
      setFilteredAdmins(result.admins || []);
    }
    setLoading(false);
  };

  const loadClinics = async () => {
    const result = await getClinics();
    if (result.success) {
      setClinics(result.clinics || []);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSelectedClinicId("");
  };

  const handleCreateAdmin = async () => {
    if (!name || !email || !password || !selectedClinicId) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const result = await createClinicAdmin({
      name,
      email,
      phone,
      password,
      clinicId: selectedClinicId,
    });

    if (result.success) {
      Alert.alert("Success", `Clinic Admin created for ${result.clinicName}`);
      resetForm();
      setModalVisible(false);
      loadAdmins();
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  const handleDeleteAdmin = (admin) => {
    Alert.alert("Confirm Delete", `Delete admin "${admin.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const result = await deleteClinicAdmin(admin.id);
          if (result.success) {
            Alert.alert("Success", "Admin deleted successfully");
            loadAdmins();
          } else {
            Alert.alert("Error", result.error);
          }
          setLoading(false);
        },
      },
    ]);
  };

  const getClinicName = (clinicId) => {
    const clinic = clinics.find(c => c.id === clinicId);
    return clinic ? clinic.name : "Unknown Clinic";
  };

  const renderAdminCard = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.adminName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.adminEmail, { color: colors.text + "60" }]}>{item.email}</Text>
          <View style={styles.clinicBadge}>
            <Ionicons name="business-outline" size={12} color={colors.primary} />
            <Text style={[styles.clinicName, { color: colors.primary }]}>{item.clinicName}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteAdmin(item)}
          style={styles.deleteIcon}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      {item.phone && (
        <Text style={[styles.phone, { color: colors.text + "50" }]}>📞 {item.phone}</Text>
      )}
    </View>
  );

  if (loading && admins.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Clinic Admins</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Admin</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search by name, email, or clinic..."
      />

      <FlatList
        data={filteredAdmins}
        keyExtractor={(item) => item.id}
        renderItem={renderAdminCard}
        onRefresh={loadAdmins}
        refreshing={loading && admins.length > 0}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchQuery ? "No Results Found" : "No Admins"}
            message={searchQuery ? "Try a different search term" : "Tap Add to create a clinic admin"}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Clinic Admin</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Full Name *</Text>
              <TextInput
                placeholder="Enter admin full name"
                placeholderTextColor={colors.text + "60"}
                value={name}
                onChangeText={setName}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Email Address *</Text>
              <TextInput
                placeholder="admin@clinic.com"
                placeholderTextColor={colors.text + "60"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Phone Number</Text>
              <TextInput
                placeholder="Enter phone number"
                placeholderTextColor={colors.text + "60"}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Enter password (min 6 characters)"
                  placeholderTextColor={colors.text + "60"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.text + "60"} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Assign to Clinic *</Text>
              <View style={[styles.pickerWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Picker
                  selectedValue={selectedClinicId}
                  onValueChange={setSelectedClinicId}
                  dropdownIconColor={colors.text}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label="Select a clinic" value="" />
                  {clinics.map((clinic) => (
                    <Picker.Item key={clinic.id} label={clinic.name} value={clinic.id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={handleCreateAdmin}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>{loading ? "Creating..." : "Create Admin"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: "bold" },
  addButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  card: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#e8e8e8", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "bold" },
  cardInfo: { flex: 1 },
  adminName: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  adminEmail: { fontSize: 13, marginBottom: 4 },
  clinicBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  clinicName: { fontSize: 12, fontWeight: "500" },
  phone: { fontSize: 12, marginTop: 8, marginLeft: 60 },
  deleteIcon: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  inputLabel: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  passwordContainer: { flexDirection: "row", alignItems: "center", position: "relative" },
  passwordInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  eyeIcon: { position: "absolute", right: 14 },
  pickerWrapper: { borderWidth: 1, borderRadius: 10, overflow: "hidden", height: 50, justifyContent: "center" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelButtonText: { fontWeight: "600" },
  submitButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  submitButtonText: { color: "#fff", fontWeight: "bold" },
});

export default Admin;