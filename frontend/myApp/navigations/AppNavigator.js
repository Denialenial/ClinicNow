import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Image, TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useThemeMode } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

import Welcome from "../screens/Authentication/Welcome";
import Login from "../screens/Authentication/Login";
import Register from "../screens/Authentication/Register";

import PatientTabs from "./PatientTabs";
import StaffTabs from "./StaffTabs";
import ClinicAdminTabs from "./ClinicAdminTabs";  
import SuperAdminTabs from "./SuperAdminTabs";

const Stack = createStackNavigator();

function AppNavigator() {
  const { theme, dark, toggleTheme } = useThemeMode();
  const { user, logout } = useAuth();
  
  const showLanguageSwitcher = !user || user?.role === "patient";

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        key={user ? user.uid : "guest"}
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
          headerRight: () => (
            <View style={{ flexDirection: "row", marginRight: 10, alignItems: "center" }}>
              {showLanguageSwitcher && <LanguageSwitcher />}
              <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
                <Ionicons name={dark ? "moon" : "sunny"} size={22} color={theme.colors.text} />
              </TouchableOpacity>
              {user && (
                <TouchableOpacity onPress={logout}>
                  <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>
          ),
        })}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="Welcome"
              component={Welcome}
              options={{ headerShown: true }}
            />
            <Stack.Screen
              name="Login"
              component={Login}
              options={{
                headerTitle: () => (
                  <View style={{ alignItems: "center" }}>
                    <Image
                      source={require("../assets/logo.png")}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                    />
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: theme.colors.text, marginTop: 2 }}>
                      ClinicNow
                    </Text>
                  </View>
                ),
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={Register} 
              options={{ headerTitle: "Create Account" }}
            />
          </>
        ) : (
          <>
            {user.role === "patient" && (
              <Stack.Screen 
                name="Patient" 
                component={PatientTabs} 
                options={{ headerShown: true, headerTitle: "Patient" }}
              />
            )}
            {user.role === "staff" && (
              <Stack.Screen 
                name="Staff" 
                component={StaffTabs} 
                options={{ headerShown: true, headerTitle: "Staff" }}
              />
            )}
            {user.role === "clinicAdmin" && (
              <Stack.Screen 
                name="ClinicAdmin" 
                component={ClinicAdminTabs} 
                options={{ headerShown: true, headerTitle: "Clinic Admin" }}
              />
            )}
            {user.role === "superAdmin" && (
              <Stack.Screen 
                name="SuperAdmin" 
                component={SuperAdminTabs} 
                options={{ headerShown: true, headerTitle: "Super Admin" }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;