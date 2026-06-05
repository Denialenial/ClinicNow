import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../context/ThemeContext";

import Dashboard from "../screens/SuperAdmin/Dashboard";
import Admin from "../screens/SuperAdmin/Admin";
import Clinic from "../screens/SuperAdmin/Clinic";
import GlobalServices from "../screens/SuperAdmin/GlobalServices";
import Profile from "../screens/SuperAdmin/Profile";

const Tab = createBottomTabNavigator();

function SuperAdminTabs() {
  const { theme } = useThemeMode();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.card },
        tabBarActiveTintColor: "#1e90ff",
        tabBarInactiveTintColor: "#888",
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") iconName = "home";
          else if (route.name === "Profile") iconName = "person";
          else if (route.name === "Admin") iconName = "people";
          else if (route.name === "Clinic") iconName = "location";
          else if (route.name === "GlobalServices") iconName = "settings";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Admin" component={Admin} />
      <Tab.Screen name="Clinic" component={Clinic} />
      <Tab.Screen name="GlobalServices" component={GlobalServices} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

export default SuperAdminTabs;