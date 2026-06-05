import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

const SearchBar = ({
  onSearch,
  placeholder = "Search...",
  initialValue = "",
  autoFocus = false,
  showCancelButton = true,
  debounceDelay = 300,
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef(null);

  const handleSearch = (text) => {
    setQuery(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      onSearch(text);
    }, debounceDelay);
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
  };

  const cancelSearch = () => {
    setQuery("");
    onSearch("");
    setIsFocused(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.card,
            borderColor: isFocused ? colors.primary : colors.border,
            borderWidth: isFocused ? 2 : 1,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.text + "60"}
          style={styles.searchIcon}
        />
        
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text + "50"}
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.text + "60"} />
          </TouchableOpacity>
        )}
      </View>
      
      {showCancelButton && isFocused && (
        <TouchableOpacity onPress={cancelSearch} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SearchBar;