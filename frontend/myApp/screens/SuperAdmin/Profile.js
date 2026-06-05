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
  });
  const [originalProfile, setOriginalProfile] = useState({});

  const loadUserData = async () => {
    setRefreshing(true);
    const result = await getUser(user.uid);
    if (result.success && result.user) {
      setProfile({
        name: result.user.name || user?.name || "",
        phone: result.user.phone || user?.phone || "",
        email: result.user.email || user?.email || "",
      });
      setOriginalProfile({
        name: result.user.name || user?.name || "",
        phone: result.user.phone || user?.phone || "",
        email: result.user.email || user?.email || "",
      });
    } else {
      setProfile({
        name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
      });
    }
    setRefreshing(false);
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
        <Avatar name={profile.name} size={100} />
        <Text style={[styles.userName, { color: colors.text }]}>{profile.name || "Super Admin"}</Text>
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
          value={profile.email || "Not available"}
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
  header: { alignItems: "center", marginBottom: 24 },
  userName: { fontSize: 22, fontWeight: "bold", marginBottom: 6, marginTop: 12 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: "600" },
  section: { borderRadius: 16, padding: 16, marginBottom: 16 },
  editButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelButtonText: { fontWeight: "600" },
  saveButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
});