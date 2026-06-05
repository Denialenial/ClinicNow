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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const { height } = Dimensions.get("window");

function Login({ navigation }) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      const savedRemember = await AsyncStorage.getItem("rememberMe");

      if (savedRemember === "true" && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.log("Failed to load saved email", error);
    }
  };

  const handleRememberMe = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem("savedEmail", email);
        await AsyncStorage.setItem("rememberMe", "true");
      } else {
        await AsyncStorage.removeItem("savedEmail");
        await AsyncStorage.setItem("rememberMe", "false");
      }
    } catch (error) {
      console.log("Failed to save email", error);
    }
  };

  const handleLogin = async () => {
    if (loading) return;

    if (!email || !password) {
      Alert.alert(t('errors.missingFields'), t('errors.fillAllFields'));
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser(
        email.trim().toLowerCase(),
        password
      );

      if (!result.success) {
        Alert.alert(t('errors.loginFailed'), result.error || t('errors.invalidCredentials'));
        return;
      }

      // Check if account is banned (applies to all roles)
      if (result.user.isBanned) {
        Alert.alert(
          t('auth.accountBanned'),
          t('auth.accountBannedMessage')
        );
        return;
      }

      // Staff-specific: Check if verified/approved by Clinic Admin
      if (result.user.role === "staff" && !result.user.isVerified) {
        Alert.alert(
          t('auth.pendingApproval'),
          t('auth.registrationSuccessMessage')
        );
        return;
      }

      // Staff-specific: Check if they have a clinic assigned
      if (result.user.role === "staff" && !result.user.clinicId) {
        Alert.alert(
          t('auth.configurationError'),
          t('auth.noClinicAssigned')
        );
        return;
      }

      // Save remember me preference
      await handleRememberMe();
      
      // Login successful - AuthContext will handle role-based routing
      login(result.user);
      
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
        autoCorrect={false}
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.appName, { color: colors.text }]}>ClinicNow</Text>
            <Text style={[styles.subtitle, { color: colors.text + "70" }]}>
              {t('auth.welcome')}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderInput({
              icon: "mail-outline",
              placeholder: t('auth.email'),
              value: email,
              onChangeText: setEmail,
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}

            {renderInput({
              icon: "lock-closed-outline",
              placeholder: t('auth.password'),
              value: password,
              onChangeText: setPassword,
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

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.primary,
                      backgroundColor: rememberMe
                        ? colors.primary + "20"
                        : "transparent",
                    },
                  ]}
                >
                  {rememberMe && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                </View>

                <Text style={{ color: colors.text + "70" }}>
                  {t('common.save')} {t('auth.email')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={{ color: colors.primary }}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: colors.text + "70" }}>
                {t('auth.noAccount')}
              </Text>

              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={[styles.link, { color: colors.primary }]}> {t('auth.signUp')}</Text>
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
    paddingTop: height * 0.1,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    borderRadius: 22,
    padding: 22,
    gap: 18,
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
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

export default Login;