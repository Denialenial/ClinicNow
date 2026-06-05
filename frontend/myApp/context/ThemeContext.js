import React, { createContext, useState, useMemo, useContext } from "react";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    setDark(prev => !prev);
  };

  const theme = useMemo(() => {
    return dark ? DarkTheme : DefaultTheme;
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
};