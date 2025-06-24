"use client";

import * as React from "react";
import { useTheme } from "../hooks/use-theme";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  storageKey?: string;
};

type ThemeProviderState = {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
};

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(
  undefined
);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "willow-theme",
  ...props
}: ThemeProviderProps) {
  const { theme, setTheme } = useTheme();
  
  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme]
  );
  
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useThemeContext = () => {
  const context = React.useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useThemeContext must be used within a ThemeProvider");
  
  return context;
};