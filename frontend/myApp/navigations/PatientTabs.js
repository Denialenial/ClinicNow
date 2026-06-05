import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useThemeMode } from "../context/ThemeContext";

import Dashboard from "../screens/Patient/Dashboard";
import EmergencyRequest from "../screens/Patient/EmergencyRequest";
import CaseTracking from "../screens/Patient/CaseTracking";
import Appointments from "../screens/Patient/Appointments";
import Profile from "../screens/Patient/Profile";

const Tab = createBottomTabNavigator();

function PatientTabs() {
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

            case "EmergencyRequest":
              iconName = "alert";
              break;
         
            case "CaseTracking":
              iconName = "navigate";
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
      <Tab.Screen name="EmergencyRequest" component={EmergencyRequest}/>
      <Tab.Screen name="CaseTracking" component={CaseTracking}/>
      <Tab.Screen name="Appointments" component={Appointments}/>
      <Tab.Screen name="Profile" component={Profile}/>
    </Tab.Navigator>
  );
}

export default PatientTabs;