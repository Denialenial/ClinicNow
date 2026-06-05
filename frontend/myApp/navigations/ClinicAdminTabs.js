import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useThemeMode } from "../context/ThemeContext";

import Dashboard from "../screens/Admin/Dashboard";
import Staff from "../screens/Admin/Staff";
import Service from "../screens/Admin/Service";
import Profile from "../screens/Admin/Profile";
import Appointments from "../screens/Admin/Appointments";


const Tab = createBottomTabNavigator();

function ClinicAdminTabs() {
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

            case "Service":
              iconName = "bar-chart";
              break;

            case "Staff":
              iconName = "people";
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
      <Tab.Screen name="Staff" component={Staff}/>
      <Tab.Screen name="Service" component={Service}/>
      <Tab.Screen name="Appointments" component={Appointments}/>
      <Tab.Screen name="Profile" component={Profile}/>

    </Tab.Navigator>
  );
}

export default ClinicAdminTabs;