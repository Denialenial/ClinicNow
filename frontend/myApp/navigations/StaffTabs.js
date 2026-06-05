import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useThemeMode } from "../context/ThemeContext";

import Dashboard from "../screens/Staff/Dashboard";
import Profile from "../screens/Staff/Profile";
import EmergencyCases from "../screens/Staff/EmergencyCases";
import Appointments from "../screens/Staff/Appointments.js";

const Tab = createBottomTabNavigator();

function StaffTabs() {
  const { theme } = useThemeMode();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: theme.colors.card,
        },

        tabBarActiveTintColor: "#1e90ff",
        tabBarInactiveTintColor: "#888",

        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = "home";
              break;

            case "Profile":
              iconName = "person";
              break;

            case "Emergency":
              iconName = "alert";
              break;

            case "Appointments":
              iconName = "calendar";
              break;

            default:
              iconName = "ellipse";
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={Dashboard}/>
      <Tab.Screen name="Emergency" component={EmergencyCases}/>
      <Tab.Screen name="Appointments" component={Appointments}/>
      <Tab.Screen name="Profile" component={Profile}/>
    </Tab.Navigator>
  );
}

export default StaffTabs;