import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { createCase } from "../../services/emergencyService";

function EmergencyRequest({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [symptoms, setSymptoms] = useState("");
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createdCaseId, setCreatedCaseId] = useState(null);

  const getLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t('errors.permissionRequired'), t('patient.locationPermissionRequired'));
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      const address = await Location.reverseGeocodeAsync(currentLocation.coords);
      if (address.length > 0) {
        const place = address[0];
        const placeString = `${place.district || place.subregion || place.region || ""}, ${place.city || ""}`;
        setPlaceName(
          placeString.trim() ||
            `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`
        );
      } else {
        setPlaceName(
          `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      Alert.alert(t('errors.error'), t('errors.locationFailed'));
    } finally {
      setLoadingLocation(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('errors.permissionRequired'), t('patient.cameraRollPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(t('errors.error'), t('errors.imagePickFailed'));
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('errors.permissionRequired'), t('patient.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(t('errors.error'), t('errors.photoFailed'));
    }
  };

  const showImageOptions = () => {
    Alert.alert(t('patient.addPhoto'), t('common.chooseOption'), [
      { text: t('patient.takePhoto'), onPress: takePhoto },
      { text: t('patient.chooseFromLibrary'), onPress: pickImage },
      { text: t('common.cancel'), style: "cancel" },
    ]);
  };

  const removePhoto = () => {
    setPhoto(null);
  };

  const validateForm = () => {
    if (!symptoms.trim()) {
      Alert.alert(t('errors.missingInformation'), t('patient.symptomsRequired'));
      return false;
    }
    if (!location) {
      Alert.alert(t('errors.locationRequired'), t('patient.locationRequiredFirst'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const result = await createCase({
        patientId: user.uid,
        patientName: user.name,
        patientPhone: user.phone || "",
        symptoms: symptoms.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        photoUri: photo?.uri || null,
      });

      if (result.success) {
        const caseId = result.case?.id;
        if (caseId) {
          setCreatedCaseId(caseId);
          setSuccessMessage(
            result.isEmergency
              ? t('emergency.emergencyResponseActivated')
              : t('emergency.nearbyClinicsFound')
          );
          setShowSuccessModal(true);
        } else {
          Alert.alert(t('errors.error'), t('errors.noCaseId'));
        }
      } else {
        if (result.activeCaseId) {
          Alert.alert(
            t('emergency.activeCaseInProgress'),
            result.error,
            [
              {
                text: t('patient.viewMyCase'),
                onPress: () =>
                  navigation.replace("Patient", {
                    screen: "CaseTracking",
                    params: { caseId: result.activeCaseId },
                  }),
              },
              { text: t('common.ok'), style: "cancel" },
            ]
          );
        } else {
          Alert.alert(t('errors.error'), result.error);
        }
      }
    } catch (error) {
      Alert.alert(t('errors.error'), t('errors.somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    if (createdCaseId) {
      navigation.replace("Patient", {
        screen: "CaseTracking",
        params: { caseId: createdCaseId },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('patient.emergencyRequest')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "70" }]}>
            {t('patient.emergencyRequestDescription')}
          </Text>
        </View>

        {/* Symptoms Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.labelRow}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.label, { color: colors.text }]}>
              {t('patient.symptoms')}
            </Text>
          </View>
          <TextInput
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={5}
            placeholder={t('patient.symptomsPlaceholder')}
            placeholderTextColor={colors.text + "40"}
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
        </View>

        {/* Location Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.labelRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={[styles.label, { color: colors.text }]}>
              {t('patient.yourLocation')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: location ? "#10b981" : colors.primary },
            ]}
            onPress={getLocation}
            disabled={loadingLocation}
            activeOpacity={0.8}
          >
            {loadingLocation ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={location ? "checkmark-circle" : "locate"}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>
                  {location ? t('patient.locationVerified') : t('patient.captureLocation')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {placeName !== "" && (
            <View
              style={[
                styles.placeContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="navigate-circle"
                size={18}
                color={location ? "#10b981" : colors.primary}
              />
              <Text style={[styles.placeText, { color: colors.text }]}>
                {placeName}
              </Text>
            </View>
          )}
        </View>

        {/* Photo Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.labelRow}>
            <Ionicons name="image-outline" size={18} color={colors.primary} />
            <Text style={[styles.label, { color: colors.text }]}>
              {t('patient.attachPhotoOptional')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.imageButton,
              {
                borderColor: colors.primary,
                backgroundColor: colors.background,
              },
            ]}
            onPress={showImageOptions}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={22} color={colors.primary} />
            <Text style={[styles.imageButtonText, { color: colors.primary }]}>
              {photo ? t('patient.changePhoto') : t('patient.addPhoto')}
            </Text>
          </TouchableOpacity>

          {photo && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: photo.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={removePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={26} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: submitting ? "#9ca3af" : "#dc2626" },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitText}>{t('common.processing')}</Text>
            </>
          ) : (
            <>
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.submitText}>{t('patient.requestHelpNow')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessConfirm}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#10b981" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('patient.requestSubmitted')}
            </Text>
            <Text style={[styles.modalMessage, { color: colors.text + "70" }]}>
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleSuccessConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>{t('patient.trackProgress')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  placeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  placeText: {
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
    lineHeight: 18,
  },
  imageButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewContainer: {
    marginTop: 12,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 13,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#dc2626",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default EmergencyRequest;