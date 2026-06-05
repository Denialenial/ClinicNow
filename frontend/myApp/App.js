import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from 'react-i18next';
import i18n from './services/i18n';
import AppNavigator from "./navigations/AppNavigator";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

import 'react-native-gesture-handler';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}