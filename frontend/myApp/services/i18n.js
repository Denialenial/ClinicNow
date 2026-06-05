import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import st from '../locales/st.json';

const resources = {
  en: { translation: en },
  st: { translation: st },
};

// Get saved language from storage
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('appLanguage');
    if (savedLanguage) return savedLanguage;
    // Default to device language or English
    const deviceLanguage = Localization.locale?.split('-')[0] || 'en';
    return deviceLanguage === 'st' ? 'st' : 'en';
  } catch {
    return 'en';
  }
};

// Initialize i18n
const initI18n = async () => {
  const language = await getSavedLanguage();
  
  i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

// Function to change language
export const changeLanguage = async (language) => {
  await AsyncStorage.setItem('appLanguage', language);
  await i18n.changeLanguage(language);
};

// Get current language
export const getCurrentLanguage = () => i18n.language;

export default i18n;