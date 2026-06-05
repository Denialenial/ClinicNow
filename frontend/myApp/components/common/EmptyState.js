import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

const EmptyState = ({ icon = "business-outline", title = "No Data", message = "No items found" }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.text + "40"} />
      <Text style={[styles.title, { color: colors.text + "80" }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.text + "60" }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
  message: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
});

export default EmptyState;