import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { registerUser } from "../../services/authService";
import { getClinics, getClinicServices } from "../../services/clinicServices";
import { useAuth } from "../../context/AuthContext";

const { height } = Dimensions.get("window");

const STAFF_CATEGORIES = [
  "Doctor",
  "Nurse",
  "Ambulance Driver",
  "Pharmacist",
  "Lab Technician",
];

const roleServiceMapping = {
  "Doctor": [
    "Emergency Care", "Maternity", "Injury Care",
    "General Consultation", "Dental Care", "Eye Care",
    "Child Health", "Counselling", "Skin Care",
    "Diagnostic Testing", "Rehabilitation", "Chronic Disease Management"
  ],
  "Nurse": [
    "Emergency Care", "Maternity", "Injury Care",
    "General Consultation", "Child Health", "Chronic Disease Management"
  ],
  "Ambulance Driver": [
    "Emergency Care", "Injury Care"
  ],
  "Pharmacist": [
    "Pharmacy"
  ],
  "Lab Technician": [
    "Diagnostic Testing"
  ]
};

function Register({ navigation }) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    clinicId: "",
    category: "",
    serviceIds: [],
    password: "",
    confirmPassword: "",
  });

  const [clinics, setClinics] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (form.role === "staff") {
      fetchClinics();
    }
  }, [form.role]);

  useEffect(() => {
    if (form.role === "staff" && form.clinicId) {
      fetchClinicServices(form.clinicId);
      updateField("category", "");
      updateField("serviceIds", []);
    }
  }, [form.clinicId]);

  useEffect(() => {
    if (form.role === "staff" && form.category && availableServices.length > 0) {
      const allowedServiceNames = roleServiceMapping[form.category] || [];
      const filtered = availableServices.filter(service => 
        allowedServiceNames.includes(service.name)
      );
      setFilteredServices(filtered);
      const validServiceIds = form.serviceIds.filter(serviceId => {
        const service = availableServices.find(s => s.id === serviceId);
        return service && allowedServiceNames.includes(service.name);
      });
      if (validServiceIds.length !== form.serviceIds.length) {
        updateField("serviceIds", validServiceIds);
      }
    } else {
      setFilteredServices(availableServices);
    }
  }, [form.category, availableServices]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId) => {
    setForm((prev) => {
      const currentIds = prev.serviceIds;
      if (currentIds.includes(serviceId)) {
        return { ...prev, serviceIds: currentIds.filter(id => id !== serviceId) };
      } else {
        return { ...prev, serviceIds: [...currentIds, serviceId] };
      }
    });
  };

  const fetchClinics = async () => {
    try {
      setLoadingClinics(true);
      const result = await getClinics();
      if (result.success) {
        setClinics(result.clinics || []);
      } else {
        Alert.alert(t('errors.error'), t('errors.somethingWrong'));
      }
    } catch (error) {
      Alert.alert(t('errors.error'), t('errors.somethingWrong'));
    } finally {
      setLoadingClinics(false);
    }
  };

  const fetchClinicServices = async (clinicId) => {
    try {
      setLoadingServices(true);
      const result = await getClinicServices(clinicId);
      if (result.success) {
        setAvailableServices(result.services || []);
      } else {
        setAvailableServices([]);
      }
    } catch (error) {
      setAvailableServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const validateForm = () => {
    const {
      name,
      email,
      role,
      password,
      confirmPassword,
      clinicId,
      category,
      serviceIds,
    } = form;

    if (!name || !email || !role || !password || !confirmPassword) {
      Alert.alert(t('errors.missingFields'), t('errors.fillAllFields'));
      return false;
    }

    if (role === "staff") {
      if (!clinicId) {
        Alert.alert(t('errors.missingInformation'), t('auth.selectClinic'));
        return false;
      }
      if (!category) {
        Alert.alert(t('errors.missingInformation'), t('auth.selectCategory'));
        return false;
      }
      if (serviceIds.length === 0) {
        Alert.alert(t('errors.missingInformation'), t('auth.selectServices'));
        return false;
      }
    }

    if (password.length < 6) {
      Alert.alert(t('errors.weakPassword'), t('errors.passwordTooShort'));
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('errors.passwordError'), t('errors.passwordsDoNotMatch'));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      const registrationData = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        password: form.password,
      };

      if (form.role === "staff") {
        registrationData.clinicId = form.clinicId;
        registrationData.category = form.category;
        registrationData.serviceIds = form.serviceIds;
      }

      const result = await registerUser(registrationData);

      if (!result.success) {
        Alert.alert(t('errors.registrationFailed'), result.error || t('errors.somethingWrong'));
        return;
      }

      if (form.role === "staff") {
        Alert.alert(
          t('auth.registrationSuccess'),
          t('auth.registrationSuccessMessage'),
          [{ text: t('common.ok'), onPress: () => navigation.navigate("Login") }]
        );
      } else {
        login(result.user);
      }
    } catch (error) {
      Alert.alert(t('errors.error'), t('errors.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const renderInput = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    autoCapitalize = "sentences",
    rightIcon,
  }) => (
    <View
      style={[
        styles.inputWrapper,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.text + "80"} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.text + "50"}
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {rightIcon}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.appName, { color: colors.text }]}>ClinicNow</Text>
            <Text style={[styles.subtitle, { color: colors.text + "70" }]}>
              {t('auth.register')}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderInput({
              icon: "person-outline",
              placeholder: t('auth.fullName'),
              value: form.name,
              onChangeText: (value) => updateField("name", value),
            })}

            {renderInput({
              icon: "mail-outline",
              placeholder: t('auth.email'),
              value: form.email,
              onChangeText: (value) => updateField("email", value),
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}

            {renderInput({
              icon: "call-outline",
              placeholder: t('auth.phoneNumber'),
              value: form.phone,
              onChangeText: (value) => updateField("phone", value),
              keyboardType: "phone-pad",
            })}

            <View
              style={[
                styles.pickerWrapper,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Picker
                selectedValue={form.role}
                onValueChange={(value) => updateField("role", value)}
                dropdownIconColor={colors.text}
                style={{ color: colors.text }}
              >
                <Picker.Item label={t('auth.selectRole')} value="" />
                <Picker.Item label={t('auth.patient')} value="patient" />
                <Picker.Item label={t('auth.staff')} value="staff" />
              </Picker>
            </View>

            {form.role === "staff" && (
              <>
                <View
                  style={[
                    styles.pickerWrapper,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Picker
                    selectedValue={form.clinicId}
                    onValueChange={(value) => updateField("clinicId", value)}
                    dropdownIconColor={colors.text}
                    style={{ color: colors.text }}
                    enabled={!loadingClinics}
                  >
                    <Picker.Item label={loadingClinics ? t('common.loading') : t('auth.selectClinic')} value="" />
                    {clinics.map((clinic) => (
                      <Picker.Item key={clinic.id} label={clinic.name} value={clinic.id} />
                    ))}
                  </Picker>
                </View>

                <View
                  style={[
                    styles.pickerWrapper,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Picker
                    selectedValue={form.category}
                    onValueChange={(value) => updateField("category", value)}
                    dropdownIconColor={colors.text}
                    style={{ color: colors.text }}
                  >
                    <Picker.Item label={t('auth.selectCategory')} value="" />
                    {STAFF_CATEGORIES.map((cat) => (
                      <Picker.Item key={cat} label={t(`auth.${cat.toLowerCase().replace(/ /g, '')}`)} value={cat} />
                    ))}
                  </Picker>
                </View>

                {form.clinicId && form.category && (
                  <View style={styles.servicesContainer}>
                    <Text style={[styles.servicesLabel, { color: colors.text }]}>
                      {t('auth.selectServices')}
                    </Text>
                    
                    {loadingServices ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : filteredServices.length === 0 ? (
                      <Text style={[styles.noServicesText, { color: colors.text + "60" }]}>
                        {t('auth.noServicesAvailable')}
                      </Text>
                    ) : (
                      <View style={styles.servicesList}>
                        {filteredServices.map((service) => (
                          <TouchableOpacity
                            key={service.id}
                            style={[
                              styles.serviceChip,
                              {
                                backgroundColor: form.serviceIds.includes(service.id)
                                  ? colors.primary
                                  : colors.background,
                                borderColor: colors.border,
                              },
                            ]}
                            onPress={() => toggleService(service.id)}
                          >
                            <Text
                              style={[
                                styles.serviceChipText,
                                {
                                  color: form.serviceIds.includes(service.id)
                                    ? "#fff"
                                    : colors.text,
                                },
                              ]}
                            >
                              {service.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {form.clinicId && !form.category && (
                  <Text style={[styles.hintText, { color: colors.text + "50" }]}>
                    {t('auth.selectCategoryHint')}
                  </Text>
                )}
              </>
            )}

            {renderInput({
              icon: "lock-closed-outline",
              placeholder: t('auth.password'),
              value: form.password,
              onChangeText: (value) => updateField("password", value),
              //secureTextEntry: !showPassword,
              rightIcon: (
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text + "70"}
                  />
                </TouchableOpacity>
              ),
            })}

            {renderInput({
              icon: "lock-closed-outline",
              placeholder: t('auth.confirmPassword'),
              value: form.confirmPassword,
              onChangeText: (value) => updateField("confirmPassword", value),
              //secureTextEntry: !showConfirmPassword,
              rightIcon: (
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text + "70"}
                  />
                </TouchableOpacity>
              ),
            })}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('auth.signUp')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: colors.text + "70" }}>
                {t('auth.hasAccount')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={[styles.link, { color: colors.primary }]}> {t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
  },
  card: {
    borderRadius: 22,
    padding: 22,
    gap: 16,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    height: 54,
    justifyContent: "center",
  },
  servicesContainer: {
    marginTop: 4,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  servicesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  serviceChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  noServicesText: {
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 14,
  },
  hintText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  link: {
    fontWeight: "700",
  },
});

export default Register;