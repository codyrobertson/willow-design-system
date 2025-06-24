import { useEffect, useState } from "react";
import { Theme, getTheme, setTheme as setThemeUtil, initializeTheme } from "../utils";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  
  useEffect(() => {
    initializeTheme();
  }, []);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setThemeUtil(newTheme);
  };
  
  return { theme, setTheme };
}