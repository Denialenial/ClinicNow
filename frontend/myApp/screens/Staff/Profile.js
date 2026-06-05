import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUser, updateUser } from "../../services/authService";
import { getClinics } from "../../services/clinicServices";
import { ProfileField } from "../../components/common/ProfileField";
import { SectionHeader } from "../../components/common/SectionHeader";
import { Avatar } from "../../components/common/Avatar";

export default function Profile() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    category: user?.category || "",
    clinicName: user?.clinicName || "",
    clinicId: user?.clinicId || "",
    serviceNames: user?.serviceNames || [],
  });
  const [originalProfile, setOriginalProfile] = useState({});

  const loadUserData = async () => {
    setRefreshing(true);
    try {
      const result = await getUser(user.uid);
      if (result.success && result.user) {
        let clinicName = result.user.clinicName || "";
        
        // If clinicName is missing but clinicId exists, fetch it
        if (!clinicName && result.user.clinicId) {
          const clinicsResult = await getClinics();
          if (clinicsResult.success) {
            const clinic = clinicsResult.clinics.find(c => c.id === result.user.clinicId);
            clinicName = clinic?.name || "Unknown Clinic";
          }
        }
        
        setProfile({
          name: result.user.name || "",
          phone: result.user.phone || "",
          email: result.user.email || "",
          category: result.user.category || "",
          clinicName: clinicName,
          clinicId: result.user.clinicId || "",
          serviceNames: result.user.serviceNames || [],
        });
        setOriginalProfile({
          name: result.user.name || "",
          phone: result.user.phone || "",
          email: result.user.email || "",
          category: result.user.category || "",
          clinicName: clinicName,
          clinicId: result.user.clinicId || "",
          serviceNames: result.user.serviceNames || [],
        });
      }
    } catch (error) {
      console.error("Load user error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleEdit = () => {
    setOriginalProfile(profile);
    setEditing(true);
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    const result = await updateUser(user.uid, {
      name: profile.name.trim(),
      phone: profile.phone.trim(),
    });
    
    if (result.success) {
      Alert.alert("Success", "Profile updated successfully");
      user.name = profile.name;
      user.phone = profile.phone;
      setEditing(false);
      loadUserData();
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header with Avatar */}
      <View style={styles.header}>
        <Avatar
          name={profile.name}
          size={100}
        />
        <Text style={[styles.userName, { color: colors.text }]}>{profile.name || "Staff"}</Text>
      </View>

      {/* Personal Information Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <SectionHeader title="Personal Information" onEdit={handleEdit} editing={editing} />
        
        <ProfileField
          icon="person-outline"
          label="Full Name"
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
          editable={editing}
        />
        <ProfileField
          icon="mail-outline"
          label="Email Address"
          value={profile.email}
          editable={false}
        />
        <ProfileField
          icon="call-outline"
          label="Phone Number"
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          editable={editing}
          keyboardType="phone-pad"
        />
      </View>

      {/* Professional Information Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <SectionHeader title="Professional Information" />
        
        <ProfileField
          icon="business-outline"
          label="Clinic"
          value={profile.clinicName || "Not assigned"}
          editable={false}
        />
        <ProfileField
          icon="medkit-outline"
          label="Category"
          value={profile.category || "Not specified"}
          editable={false}
        />
        
        <View style={styles.servicesContainer}>
          <Text style={[styles.servicesLabel, { color: colors.text + "60" }]}>Services Qualified For:</Text>
          <View style={styles.servicesList}>
            {profile.serviceNames.length > 0 ? (
              profile.serviceNames.map((service, index) => (
                <View key={index} style={[styles.serviceChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.serviceChipText, { color: colors.text + "80" }]}>{service}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noServicesText, { color: colors.text + "40" }]}>No services assigned</Text>
            )}
          </View>
        </View>
      </View>

      {/* Edit/Save Buttons */}
      {editing && (
        <View style={styles.editButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  
  // Header Styles
  header: { alignItems: "center", marginBottom: 24 },
  userName: { fontSize: 22, fontWeight: "bold", marginBottom: 6, marginTop: 12 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: "600" },
  
  // Sections
  section: { borderRadius: 16, padding: 16, marginBottom: 16 },
  
  // Services
  servicesContainer: { marginTop: 8 },
  servicesLabel: { fontSize: 12, marginBottom: 8 },
  servicesList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1 },
  serviceChipText: { fontSize: 12 },
  noServicesText: { fontSize: 12, textAlign: "center", paddingVertical: 10 },
  
  // Edit Buttons
  editButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelButtonText: { fontWeight: "600" },
  saveButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
});