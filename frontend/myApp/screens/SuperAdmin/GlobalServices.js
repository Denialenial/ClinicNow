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
import { getGlobalServices, addGlobalService, updateGlobalService, deleteGlobalService } from "../../services/clinicServices";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

function GlobalServices() {
  const { colors } = useTheme();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (service.keywords && service.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase())))
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [])
  );

  const loadServices = async () => {
    setLoading(true);
    const result = await getGlobalServices();
    if (result.success) {
      setServices(result.services || []);
      setFilteredServices(result.services || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setKeywords("");
    setDescription("");
  };

  const prepareServiceData = () => ({
    name,
    category,
    keywords: keywords.split(",").map(kw => kw.trim()).filter(kw => kw),
    description,
  });

  const handleAddService = async () => {
    if (!name || !category) {
      Alert.alert("Error", "Please fill service name and category");
      return;
    }

    setLoading(true);
    const result = await addGlobalService(prepareServiceData());
    if (result.success) {
      Alert.alert("Success", "Service added successfully");
      resetForm();
      setModalVisible(false);
      loadServices();
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  const handleEditService = async () => {
    if (!name || !category) {
      Alert.alert("Error", "Please fill service name and category");
      return;
    }

    setLoading(true);
    const result = await updateGlobalService(selectedService.id, prepareServiceData());
    if (result.success) {
      Alert.alert("Success", "Service updated successfully");
      resetForm();
      setEditModalVisible(false);
      setSelectedService(null);
      loadServices();
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  const handleDeleteService = async () => {
    Alert.alert("Confirm Delete", `Delete "${selectedService.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const result = await deleteGlobalService(selectedService.id);
          if (result.success) {
            Alert.alert("Success", "Service deleted successfully");
            setEditModalVisible(false);
            setSelectedService(null);
            loadServices();
          } else {
            Alert.alert("Error", result.error);
          }
          setLoading(false);
        },
      },
    ]);
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setName(service.name);
    setCategory(service.category || "");
    setKeywords(service.keywords ? service.keywords.join(", ") : "");
    setDescription(service.description || "");
    setEditModalVisible(true);
  };

  const getCategoryColor = (cat) => {
    if (cat === "emergency") return "#ef4444";
    if (cat === "routine") return "#10b981";
    return "#6b7280";
  };

  const renderServiceCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="medkit-outline" size={20} color={colors.primary} />
        <Text style={[styles.serviceName, { color: colors.text }]}>{item.name}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
            {item.category || "general"}
          </Text>
        </View>
      </View>
      {item.description && (
        <Text style={[styles.description, { color: colors.text + "70" }]}>{item.description}</Text>
      )}
      {item.keywords && item.keywords.length > 0 && (
        <View style={styles.keywordsContainer}>
          <Text style={[styles.keywordsLabel, { color: colors.text + "60" }]}>Keywords:</Text>
          <View style={styles.keywordsList}>
            {item.keywords.slice(0, 3).map((kw, idx) => (
              <View key={idx} style={[styles.keywordChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.keywordText, { color: colors.text + "70" }]}>{kw}</Text>
              </View>
            ))}
            {item.keywords.length > 3 && (
              <Text style={[styles.moreText, { color: colors.text + "50" }]}>+{item.keywords.length - 3}</Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && services.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Global Services</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search by name, category, or keywords..."
      />

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceCard}
        onRefresh={loadServices}
        refreshing={loading && services.length > 0}
        ListEmptyComponent={
          <EmptyState
            icon="medkit-outline"
            title={searchQuery ? "No Results Found" : "No Services"}
            message={searchQuery ? "Try a different search term" : "Tap Add to create your first service"}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Service</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Service Name *</Text>
              <TextInput
                placeholder="e.g., Emergency Care, Dental Checkup"
                placeholderTextColor={colors.text + "60"}
                value={name}
                onChangeText={setName}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Category *</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    { borderColor: colors.border, backgroundColor: category === "emergency" ? "#ef4444" : colors.background }
                  ]}
                  onPress={() => setCategory("emergency")}
                >
                  <Text style={[styles.categoryOptionText, { color: category === "emergency" ? "#fff" : colors.text }]}>
                    Emergency
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    { borderColor: colors.border, backgroundColor: category === "routine" ? "#10b981" : colors.background }
                  ]}
                  onPress={() => setCategory("routine")}
                >
                  <Text style={[styles.categoryOptionText, { color: category === "routine" ? "#fff" : colors.text }]}>
                    Routine
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Keywords (comma separated)</Text>
              <TextInput
                placeholder="e.g., chest pain, bleeding, accident"
                placeholderTextColor={colors.text + "60"}
                value={keywords}
                onChangeText={setKeywords}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />
              <Text style={[styles.hint, { color: colors.text + "50" }]}>
                Used for emergency detection. Separate multiple keywords with commas.
              </Text>

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Description (optional)</Text>
              <TextInput
                placeholder="Brief description of the service"
                placeholderTextColor={colors.text + "60"}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleAddService} disabled={loading}>
                  <Text style={styles.submitButtonText}>{loading ? "Adding..." : "Add Service"}</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Service</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Service Name *</Text>
              <TextInput
                placeholder="Enter service name"
                placeholderTextColor={colors.text + "60"}
                value={name}
                onChangeText={setName}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Category *</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    { borderColor: colors.border, backgroundColor: category === "emergency" ? "#ef4444" : colors.background }
                  ]}
                  onPress={() => setCategory("emergency")}
                >
                  <Text style={[styles.categoryOptionText, { color: category === "emergency" ? "#fff" : colors.text }]}>
                    Emergency
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    { borderColor: colors.border, backgroundColor: category === "routine" ? "#10b981" : colors.background }
                  ]}
                  onPress={() => setCategory("routine")}
                >
                  <Text style={[styles.categoryOptionText, { color: category === "routine" ? "#fff" : colors.text }]}>
                    Routine
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Keywords (comma separated)</Text>
              <TextInput
                placeholder="e.g., chest pain, bleeding, accident"
                placeholderTextColor={colors.text + "60"}
                value={keywords}
                onChangeText={setKeywords}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text + "80" }]}>Description</Text>
              <TextInput
                placeholder="Brief description of the service"
                placeholderTextColor={colors.text + "60"}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setEditModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { borderColor: "#ef4444" }]}
                  onPress={handleDeleteService}
                  disabled={loading}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.deleteButtonText, { color: "#ef4444" }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleEditService} disabled={loading}>
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
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  serviceName: { fontSize: 16, fontWeight: "bold", flex: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: "600" },
  description: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  keywordsContainer: { marginTop: 4 },
  keywordsLabel: { fontSize: 11, marginBottom: 4 },
  keywordsList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  keywordChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  keywordText: { fontSize: 11 },
  moreText: { fontSize: 11, alignSelf: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  inputLabel: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  hint: { fontSize: 11, marginTop: 4, marginLeft: 4 },
  categoryContainer: { flexDirection: "row", gap: 12 },
  categoryOption: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  categoryOptionText: { fontWeight: "600" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelButtonText: { fontWeight: "600" },
  deleteButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  deleteButtonText: { fontWeight: "bold" },
  submitButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  submitButtonText: { color: "#fff", fontWeight: "bold" },
});

export default GlobalServices;