import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useTheme } from "@react-navigation/native";

export const Avatar = ({ 
  name, 
  size = 100, 
}) => {
  const { colors } = useTheme();

  const getInitials = () => {
    if (!name) return "?";
    const nameParts = name.trim().split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <View
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: colors.card,
          shadowColor: colors.text,
        }
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.primary, fontSize: size / 2.5 }]}>
        {getInitials()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontWeight: "bold",
  },
});