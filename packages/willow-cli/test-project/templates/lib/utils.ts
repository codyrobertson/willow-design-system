import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Core utility for combining class names with Tailwind CSS
 * Handles conditional classes, removes duplicates, and resolves conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Theme = "dark" | "light" | "system";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  
  const stored = localStorage.getItem("willow-theme") as Theme;
  if (stored && ["dark", "light", "system"].includes(stored)) {
    return stored;
  }
  
  return "system";
}

export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("willow-theme", theme);
  
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

export function initializeTheme(): void {
  if (typeof window === "undefined") return;
  
  const theme = getTheme();
  setTheme(theme);
}