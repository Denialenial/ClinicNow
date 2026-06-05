import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

const LoadingSpinner = ({ size = "large", fullScreen = false }) => {
  const { colors } = useTheme();

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={size} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LoadingSpinner;