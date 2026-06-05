import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { changeLanguage, getCurrentLanguage } from '../../services/i18n';

export default function LanguageSwitcher() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'st', name: 'Sesotho', nativeName: 'Sesotho' },
  ];

  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
    setModalVisible(false);
  };

  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? lang.nativeName : 'English';
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.languageButton} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="language-outline" size={22} color={colors.primary} />
        <Text style={[styles.languageText, { color: colors.text }]}>
          {getCurrentLanguageName()}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Language / Kgetha Puo
            </Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={[styles.languageOptionName, { color: colors.text }]}>
                  {lang.nativeName}
                </Text>
                <Text style={[styles.languageOptionCode, { color: colors.text + '60' }]}>
                  {lang.name}
                </Text>
                {currentLanguage === lang.code && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  languageOptionName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  languageOptionCode: {
    fontSize: 12,
    marginRight: 8,
  },
});