import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

export const StatCard = ({ icon, label, value, color, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text + "60" }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
});