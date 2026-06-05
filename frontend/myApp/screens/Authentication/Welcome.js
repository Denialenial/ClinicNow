import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

function Welcome({ navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.graphicContainer}>
        <LinearGradient
          colors={[colors.primary + "20", colors.primary + "05", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glowBackground}
        />
        <View style={[styles.logoWrapper, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
          <Image 
            source={require("../../assets/logo.png")} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>
      </View>

      <View style={styles.contentCard}>
        <View style={styles.textGroup}>
          <Text style={[styles.title, { color: colors.text }]}>
            ClinicNow
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "70" }]}>
            {t('welcome.subtitle')}
          </Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.buttonWrapper}
          onPress={() => navigation.navigate("Login")}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + "DD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{t('welcome.getStarted')}</Text>
            <View style={[styles.iconCircle, { backgroundColor: "#fff" }]}>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  graphicContainer: {
    flex: 5,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  glowBackground: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    top: "10%",
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  contentCard: {
    flex: 4,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    paddingBottom: height * 0.08,
  },
  textGroup: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  buttonWrapper: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingLeft: 28,
    paddingRight: 14,
    borderRadius: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Welcome;