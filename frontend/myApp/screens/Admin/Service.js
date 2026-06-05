import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getAvailableGlobalServices, enableClinicService, disableClinicService, getClinicServices } from "../../services/clinicServices";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

function Service() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [])
  );

  const loadServices = async () => {
    setLoading(true);
    const result = await getAvailableGlobalServices(user.clinicId);
    if (result.success) {
      setServices(result.services || []);
      setFilteredServices(result.services || []);
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const handleToggleService = async (service) => {
    setTogglingId(service.id);
    
    if (service.isOffered) {
      const result = await disableClinicService(user.clinicId, service.id);
      if (result.success) {
        setServices(prev => prev.map(s => 
          s.id === service.id ? { ...s, isOffered: false } : s
        ));
      } else {
        Alert.alert("Error", result.error);
      }
    } else {
      const result = await enableClinicService(user.clinicId, service.id);
      if (result.success) {
        setServices(prev => prev.map(s => 
          s.id === service.id ? { ...s, isOffered: true } : s
        ));
      } else {
        Alert.alert("Error", result.error);
      }
    }
    
    setTogglingId(null);
  };

  const getCategoryIcon = (category) => {
    if (category === "emergency") return "warning-outline";
    return "medkit-outline";
  };

  const getCategoryColor = (category) => {
    if (category === "emergency") return "#ef4444";
    return "#10b981";
  };

  const renderServiceCard = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(item.category) + "15" }]}>
          <Ionicons name={getCategoryIcon(item.category)} size={24} color={getCategoryColor(item.category)} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.serviceName, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
              {item.category || "general"}
            </Text>
          </View>
          {item.description && (
            <Text style={[styles.description, { color: colors.text + "60" }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.toggleButton,
          {
            backgroundColor: item.isOffered ? colors.primary : colors.background,
            borderColor: item.isOffered ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleToggleService(item)}
        disabled={togglingId === item.id}
      >
        {togglingId === item.id ? (
          <ActivityIndicator size="small" color={item.isOffered ? "#fff" : colors.primary} />
        ) : (
          <>
            <Ionicons
              name={item.isOffered ? "checkmark-circle" : "add-circle-outline"}
              size={18}
              color={item.isOffered ? "#fff" : colors.primary}
            />
            <Text
              style={[
                styles.toggleText,
                { color: item.isOffered ? "#fff" : colors.primary },
              ]}
            >
              {item.isOffered ? "Enabled" : "Enable Service"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const enabledCount = services.filter(s => s.isOffered).length;

  if (loading && services.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Clinic Services</Text>
          <Text style={[styles.subtitle, { color: colors.text + "60" }]}>
            {enabledCount} of {services.length} services enabled
          </Text>
        </View>
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search services by name or category..."
      />

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="medkit-outline"
            title={searchQuery ? "No Results Found" : "No Services Available"}
            message={searchQuery ? "Try a different search term" : "No global services have been added yet"}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: 20 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Service;