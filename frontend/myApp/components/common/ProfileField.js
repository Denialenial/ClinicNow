import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

export const ProfileField = ({
  icon,
  label,
  value,
  onChangeText,
  editable = false,
  keyboardType = "default",
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
}) => {
  const { colors } = useTheme();
  const [showValue, setShowValue] = useState(!secureTextEntry);

  return (
    <View style={[styles.fieldContainer, { borderBottomColor: colors.border }]}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={[styles.fieldLabel, { color: colors.text + "60" }]}>{label}</Text>
        {editable ? (
          <View style={styles.fieldInputRow}>
            <TextInput
              style={[styles.fieldValue, { color: colors.text }]}
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              secureTextEntry={!showValue && secureTextEntry}
              multiline={multiline}
              numberOfLines={numberOfLines}
              placeholderTextColor={colors.text + "40"}
            />
            {secureTextEntry && (
              <TouchableOpacity onPress={() => setShowValue(!showValue)}>
                <Ionicons
                  name={showValue ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.text + "50"}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[styles.fieldValue, { color: colors.text }]}>{value || "Not provided"}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  fieldIcon: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  fieldInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    padding: 0,
  },
});