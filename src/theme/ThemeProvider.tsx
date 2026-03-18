import React, { createContext, useContext, useMemo, useState } from "react";
import {
  getThemeColors,
  type ThemeColors,
  type ThemeMode,
} from "@/src/theme/designSystem";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (nextMode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  const value = useMemo<ThemeContextValue>(() => {
    const colors = getThemeColors(mode);
    return {
      mode,
      colors,
      isDark: mode === "dark",
      toggleTheme: () =>
        setMode((previousMode) => (previousMode === "light" ? "dark" : "light")),
      setMode,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }
  return context;
}
