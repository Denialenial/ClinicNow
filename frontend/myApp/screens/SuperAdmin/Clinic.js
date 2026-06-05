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
import * as Location from "expo-location";
import { getClinics, createClinic, updateClinic, deleteClinic } from "../../services/clinicServices";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

function Clinic() {
  const { colors } = useTheme();
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingCoords, setFetchingCoords] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClinics(clinics);
    } else {
      const filtered = clinics.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          clinic.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (clinic.phone && clinic.phone.includes(searchQuery))
      );
      setFilteredClinics(filtered);
    }
  }, [searchQuery, clinics]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(status === "granted");
  };

  useFocusEffect(
    useCallback(() => {
      loadClinics();
    }, [])
  );

  const loadClinics = async () => {
    setLoading(true);
    const result = await getClinics();
    if (result.success) {
      setClinics(result.clinics || []);
      setFilteredClinics(result.clinics || []);
    }
    setLoading(false);
  };

  const geocodeAddress = async (addressText) => {
    if (!addressText.trim() || !hasLocationPermission) return null;
    setFetchingCoords(true);
    try {
      const results = await Location.geocodeAsync(addressText);
      if (results?.length) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      return null;
    } catch {
      return null;
    } finally {
      setFetchingCoords(false);
    }
  };

  const handleAddressBlur = async () => {
    if (address.trim()) {
      const coords = await geocodeAddress(address);
      if (coords) {
        setLatitude(coords.latitude.toString());
        setLongitude(coords.longitude.toString());
      }
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setLatitude("");
    setLongitude("");
  };

  const prepareClinicData = () => ({
    name,
    address,
    phone,
    email,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  });

  const handleAddClinic = async () => {
    if (!name || !address) {
      Alert.alert("Error", "Please fill clinic name and address");
      return;
    }

    let finalLat = latitude;
    let finalLng = longitude;

    if (!finalLat || !finalLng) {
      const coords = await geocodeAddress(address);
      if (coords) {
        finalLat = coords.latitude.toString();
        finalLng = coords.longitude.toString();
        setLatitude(finalLat);
        setLongitude(finalLng);
      }
    }

    setLoading(true);
    const result = await createClinic(prepareClinicData());
    if (result.success) {
      Alert.alert("Success", "Clinic added successfully");
      resetForm();
      setModalVisible(false);
      loadClinics();
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  const handleEditClinic = async () => {
    if (!name || !address) {
      Alert.alert("Error", "Please fill clinic name and address");
      return;
    }

    let finalLat = latitude;
    let finalLng = longitude;

    if (!finalLat || !finalLng) {
      const coords = await geocodeAddress(address);
      if (coords) {
        finalLat = coords.latitude.toString();
        finalLng = coords.longitude.toString();
        setLatitude(finalLat);
        setLongitude(finalLng);
      }
    }

    setLoading(true);
    const result = await updateClinic(selectedClinic.id, prepareClinicData());
    if (result.success) {
      Alert.alert("Success", "Clinic updated successfully");
      resetForm();
      setEditModalVisible(false);
      setSelectedClinic(null);
      loadClinics();
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  const handleDeleteClinic = async () => {
    Alert.alert("Confirm Delete", `Delete "${selectedClinic.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const result = await deleteClinic(selectedClinic.id);
          if (result.success) {
            Alert.alert("Success", "Clinic deleted successfully");
            setEditModalVisible(false);
            setSelectedClinic(null);
            loadClinics();
          } else {
            Alert.alert("Error", result.error);
          }
          setLoading(false);
        },
      },
    ]);
  };

  const openEditModal = (clinic) => {
    setSelectedClinic(clinic);
    setName(clinic.name);
    setAddress(clinic.address);
    setPhone(clinic.phone || "");
    setEmail(clinic.email || "");
    setLatitude(clinic.latitude ? String(clinic.latitude) : "");
    setLongitude(clinic.longitude ? String(clinic.longitude) : "");
    setEditModalVisible(true);
  };

  const renderClinicCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="location-outline" size={20} color={colors.primary} />
        <Text style={[styles.clinicName, { color: colors.text }]}>{item.name}</Text>
      </View>
      <Text style={[styles.address, { color: colors.text + "70" }]}>{item.address}</Text>
      {item.phone && <Text style={[styles.phone, { color: colors.text + "60" }]}>📞 {item.phone}</Text>}
      {item.email && <Text style={[styles.email, { color: colors.text + "60" }]}>✉️ {item.email}</Text>}
    </TouchableOpacity>
  );

  if (loading && clinics.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Clinics</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Clinic</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search by name, address, or phone..."
      />

      <FlatList
        data={filteredClinics}
        keyExtractor={(item) => item.id}
        renderItem={renderClinicCard}
        onRefresh={loadClinics}
        refreshing={loading && clinics.length > 0}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title={searchQuery ? "No Results Found" : "No Clinics"}
            message={searchQuery ? "Try a different search term" : "Tap Add to create your first clinic"}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Clinic</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Clinic Name *</Text>
              <TextInput
                placeholder="Enter clinic name"
                placeholderTextColor={colors.text + "60"}
                value={name}
                onChangeText={setName}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Address *</Text>
              <TextInput
                placeholder="Enter full address"
                placeholderTextColor={colors.text + "60"}
                value={address}
                onChangeText={setAddress}
                onBlur={handleAddressBlur}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              {fetchingCoords && (
                <View style={styles.fetchingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.fetchingText, { color: colors.text + "60" }]}>Fetching coordinates...</Text>
                </View>
              )}

              {latitude && longitude && (
                <View style={styles.coordsContainer}>
                  <Ionicons name="location-sharp" size={16} color="#10b981" />
                  <Text style={[styles.coordsText, { color: colors.text + "60" }]}>
                    📍 {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                  </Text>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Phone</Text>
              <TextInput
                placeholder="Enter phone number"
                placeholderTextColor={colors.text + "60"}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Email</Text>
              <TextInput
                placeholder="Enter email"
                placeholderTextColor={colors.text + "60"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleAddClinic} disabled={loading}>
                  <Text style={styles.submitButtonText}>{loading ? "Adding..." : "Add Clinic"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Clinic</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Clinic Name *</Text>
              <TextInput
                placeholder="Enter clinic name"
                placeholderTextColor={colors.text + "60"}
                value={name}
                onChangeText={setName}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Address *</Text>
              <TextInput
                placeholder="Enter full address"
                placeholderTextColor={colors.text + "60"}
                value={address}
                onChangeText={setAddress}
                onBlur={handleAddressBlur}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              {fetchingCoords && (
                <View style={styles.fetchingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.fetchingText, { color: colors.text + "60" }]}>Fetching coordinates...</Text>
                </View>
              )}

              {latitude && longitude && (
                <View style={styles.coordsContainer}>
                  <Ionicons name="location-sharp" size={16} color="#10b981" />
                  <Text style={[styles.coordsText, { color: colors.text + "60" }]}>
                    📍 {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                  </Text>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Phone</Text>
              <TextInput
                placeholder="Enter phone number"
                placeholderTextColor={colors.text + "60"}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Email</Text>
              <TextInput
                placeholder="Enter email"
                placeholderTextColor={colors.text + "60"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setEditModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { borderColor: "#ef4444" }]}
                  onPress={handleDeleteClinic}
                  disabled={loading}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.deleteButtonText, { color: "#ef4444" }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleEditClinic} disabled={loading}>
                  <Text style={styles.submitButtonText}>{loading ? "Saving..." : "Save Changes"}</Text>
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
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  clinicName: { fontSize: 16, fontWeight: "bold", flex: 1 },
  address: { fontSize: 13, marginBottom: 4 },
  phone: { fontSize: 12, marginBottom: 2 },
  email: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  inputLabel: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  fetchingContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  fetchingText: { fontSize: 12 },
  coordsContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 4 },
  coordsText: { fontSize: 12 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelButtonText: { fontWeight: "600" },
  deleteButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  deleteButtonText: { fontWeight: "bold" },
  submitButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  submitButtonText: { color: "#fff", fontWeight: "bold" },
});

export default Clinic;