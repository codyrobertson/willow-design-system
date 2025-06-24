import chalk from 'chalk';
import path from 'path';
import type { ProjectType } from '../types/index.js';
import { createDirectory, writeFileContent } from './fileSystem.js';
import { loadTemplate } from './templateLoader.js';

/**
 * Creates all the essential design system files including tokens, theme utilities, and hooks
 */
export async function createDesignSystemFiles(
  libDir: string, 
  projectType: ProjectType
): Promise<void> {
  console.log(chalk.blue('🎨 Creating design system files...'));
  
  try {
    // Create tokens file
    await createTokensFile(libDir, projectType);
    
    // Create theme-colors file
    await createThemeColorsFile(libDir, projectType);
    
    // Create theme-utils file
    await createThemeUtilsFile(libDir, projectType);
    
    // Create hooks directory
    const hooksDir = path.join(libDir, 'hooks');
    await createDirectory(hooksDir);
    console.log(chalk.green(`✅ Created directory: ${hooksDir}`));
    
    console.log(chalk.green('✅ All design system files created successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to create design system files:'), error);
    throw error;
  }
}

/**
 * Creates tokens file from template
 */
export async function createTokensFile(libDir: string, projectType: ProjectType): Promise<void> {
  const extension = projectType.isOnlineIDE ? '.js' : '.ts';
  const tokensPath = path.join(libDir, `tokens${extension}`);
  
  console.log(chalk.blue('🎨 Creating tokens file...'));
  console.log(chalk.gray(`   Extension: ${extension}`));
  console.log(chalk.gray(`   Creating tokens file: ${tokensPath}`));
  
  let content: string;
  try {
    content = await loadTemplate('lib/tokens.ts', {
      projectType,
      isOnlineIDE: projectType.isOnlineIDE
    });
    console.log(chalk.green('   ✅ Loaded tokens from template'));
  } catch (error) {
    console.log(chalk.yellow('   ⚠️  Template not found, using built-in tokens'));
    content = `/**
 * Willow Design System Tokens
 * 
 * This file contains all design tokens for the Willow Design System.
 * These tokens should be the single source of truth for all design values.
 */

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  // Brand Colors - Willow Primary
  willow: {
    50: '#F4F3FF',
    100: '#E8E6FF',
    200: '#D1CCFF',
    300: '#BBB3FF',
    400: '#A499FF',
    500: '#8D80FF',
    600: '#7666FF',
    700: '#5F4DFF',
    800: '#4833FF',
    900: '#311AFF',
    950: '#230E67',
  },
  
  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#F3F7F8',
    100: '#E0E9ED',
    200: '#CDD9DE',
    300: '#B9C9D0',
    400: '#A6B9C2',
    500: '#93A9B4',
    600: '#7F99A6',
    700: '#6C8998',
    800: '#587989',
    900: '#45697B',
    950: '#31596D',
  },
  
  // Info Blue
  info: {
    50: '#F1F8FE',
    100: '#E1EFFD',
    200: '#BDDFFA',
    300: '#62B6F4',
    400: '#41A8EF',
    500: '#188DDF',
    600: '#0B6FBE',
    700: '#0A589A',
    800: '#0D4B7F',
    900: '#10406A',
    950: '#0B2846',
  },
  
  // Success Green
  success: {
    50: '#E0FAEC',
    100: '#C8F5DD',
    200: '#91EBBA',
    300: '#5AE198',
    400: '#23D775',
    500: '#1FC16B',
    600: '#199B55',
    700: '#147540',
    800: '#0E4F2A',
    900: '#082A15',
  },
  
  // Warning Orange
  warning: {
    50: '#FFF1EB',
    100: '#FFE3D6',
    200: '#FFC7AD',
    300: '#FFAB85',
    400: '#FF8F5C',
    500: '#FF8447',
    600: '#E66A2E',
    700: '#B35124',
    800: '#803919',
    900: '#4D210F',
  },
  
  // Error/Danger Red
  error: {
    50: '#FFEBEC',
    100: '#FFD6D9',
    200: '#FFADB3',
    300: '#FF858C',
    400: '#FF5C66',
    500: '#FB3748',
    600: '#E01E2F',
    700: '#AB1723',
    800: '#751018',
    900: '#400A0C',
  },
};

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const typography = {
  fontFamily: {
    sans: ['Codec Pro', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1.125rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.875rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// ============================================
// SPACING TOKENS
// ============================================

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  button: {
    primary: {
      DEFAULT: '0px 1px 3px 0px rgba(37,62,167,0.2)',
      hover: '0px 2px 5px 0px rgba(37,62,167,0.3)',
      active: 'inset 0px 1px 3px 0px rgba(37,62,167,0.4)',
    },
    secondary: {
      DEFAULT: '0px 1px 2px 0px rgba(10,13,20,0.03)',
      hover: '0px 1px 3px 0px rgba(10,13,20,0.05)',
      active: 'inset 0px 1px 2px 0px rgba(10,13,20,0.05)',
    },
  },
};

// ============================================
// BORDER RADIUS TOKENS  
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// ============================================
// COLLECTED TOKENS
// ============================================

export const tokens = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
};

export default tokens;`;
  }
  
  await writeFileContent(tokensPath, content);
  console.log(chalk.green(`   ✅ Created: ${tokensPath}`));
}

/**
 * Creates theme-colors file from template
 */
export async function createThemeColorsFile(libDir: string, projectType: ProjectType): Promise<void> {
  const extension = projectType.isOnlineIDE ? '.js' : '.ts';
  const themeColorsPath = path.join(libDir, `theme-colors${extension}`);
  
  console.log(chalk.gray(`   Creating theme-colors file: ${themeColorsPath}`));
  
  let content: string;
  try {
    content = await loadTemplate('lib/theme-colors.ts', {
      projectType,
      isOnlineIDE: projectType.isOnlineIDE
    });
  } catch (error) {
    content = `/**
 * Willow Design System Theme Colors
 * 
 * Centralized color definitions that map to CSS custom properties
 * for dynamic theming support.
 */

export const themeColors = {
  light: {
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(222.2, 84%, 4.9%)',
    primary: 'hsl(262, 100%, 70%)',
    'primary-foreground': 'hsl(0, 0%, 100%)',
    secondary: 'hsl(210, 40%, 96.1%)',
    'secondary-foreground': 'hsl(222.2, 47.4%, 11.2%)',
    muted: 'hsl(210, 40%, 96.1%)',
    'muted-foreground': 'hsl(215.4, 16.3%, 46.9%)',
    accent: 'hsl(210, 40%, 96.1%)',
    'accent-foreground': 'hsl(222.2, 47.4%, 11.2%)',
    destructive: 'hsl(0, 84.2%, 60.2%)',
    'destructive-foreground': 'hsl(210, 40%, 98%)',
    border: 'hsl(214.3, 31.8%, 91.4%)',
    input: 'hsl(214.3, 31.8%, 91.4%)',
    ring: 'hsl(262, 100%, 70%)',
  },
  dark: {
    background: 'hsl(222.2, 84%, 4.9%)',
    foreground: 'hsl(210, 40%, 98%)',
    primary: 'hsl(262, 83%, 58%)',
    'primary-foreground': 'hsl(222.2, 47.4%, 11.2%)',
    secondary: 'hsl(217.2, 32.6%, 17.5%)',
    'secondary-foreground': 'hsl(210, 40%, 98%)',
    muted: 'hsl(217.2, 32.6%, 17.5%)',
    'muted-foreground': 'hsl(215, 20.2%, 65.1%)',
    accent: 'hsl(217.2, 32.6%, 17.5%)',
    'accent-foreground': 'hsl(210, 40%, 98%)',
    destructive: 'hsl(0, 62.8%, 30.6%)',
    'destructive-foreground': 'hsl(210, 40%, 98%)',
    border: 'hsl(217.2, 32.6%, 17.5%)',
    input: 'hsl(217.2, 32.6%, 17.5%)',
    ring: 'hsl(262, 83%, 58%)',
  },
} as const;

export type ThemeMode = keyof typeof themeColors;
export type ThemeColorKey = keyof typeof themeColors.light;`;
  }
  
  await writeFileContent(themeColorsPath, content);
  console.log(chalk.green(`   ✅ Created: ${themeColorsPath}`));
}

/**
 * Creates theme-utils file from template
 */
export async function createThemeUtilsFile(libDir: string, projectType: ProjectType): Promise<void> {
  const extension = projectType.isOnlineIDE ? '.js' : '.ts';
  const themeUtilsPath = path.join(libDir, `theme-utils${extension}`);
  
  console.log(chalk.gray(`   Creating theme-utils file: ${themeUtilsPath}`));
  
  let content: string;
  try {
    content = await loadTemplate('lib/theme-utils.ts', {
      projectType,
      isOnlineIDE: projectType.isOnlineIDE
    });
  } catch (error) {
    content = `/**
 * Willow Design System Theme Utilities
 * 
 * Utilities for managing theme state, applying theme colors,
 * and handling light/dark mode transitions.
 */

import { themeColors, type ThemeMode, type ThemeColorKey } from './theme-colors${projectType.isOnlineIDE ? '.js' : ''}';

export type Theme = "dark" | "light" | "system";

/**
 * Get the current theme from localStorage
 */
export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  
  const stored = localStorage.getItem("willow-theme") as Theme;
  if (stored && ["dark", "light", "system"].includes(stored)) {
    return stored;
  }
  
  return "system";
}

/**
 * Set and apply a theme
 */
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
    applyThemeColors(systemTheme);
  } else {
    root.classList.add(theme);
    applyThemeColors(theme as ThemeMode);
  }
}

/**
 * Apply theme colors to CSS custom properties
 */
function applyThemeColors(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  
  const colors = themeColors[mode];
  const root = window.document.documentElement;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(\`--\${key}\`, value);
  });
}

/**
 * Initialize theme on page load
 */
export function initializeTheme(): void {
  if (typeof window === "undefined") return;
  
  const theme = getTheme();
  setTheme(theme);
  
  // Listen for system theme changes
  if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getTheme() === "system") {
        setTheme("system");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
  }
}

/**
 * Get a theme color value
 */
export function getThemeColor(colorKey: ThemeColorKey, mode?: ThemeMode): string {
  const currentMode = mode || (typeof window !== "undefined" && 
    window.document.documentElement.classList.contains("dark") ? "dark" : "light");
  
  return themeColors[currentMode][colorKey];
}

/**
 * Check if dark mode is currently active
 */
export function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.document.documentElement.classList.contains("dark");
}

/**
 * Toggle between light and dark mode
 */
export function toggleTheme(): void {
  const currentTheme = getTheme();
  if (currentTheme === "system") {
    setTheme(isDarkMode() ? "light" : "dark");
  } else {
    setTheme(currentTheme === "light" ? "dark" : "light");
  }
}`;
  }
  
  await writeFileContent(themeUtilsPath, content);
  console.log(chalk.green(`   ✅ Created: ${themeUtilsPath}`));
}

/**
 * Creates a modular utility function for writing core lib files
 */
export async function createCoreLibFiles(
  libDir: string, 
  projectType: ProjectType
): Promise<void> {
  const extension = projectType.isOnlineIDE ? '.js' : '.ts';
  
  console.log(chalk.blue('📚 Creating core lib files...'));
  
  // Create utils.ts from template or fallback
  const utilsPath = `${libDir}/utils${extension}`;
  let utilsContent: string;
  
  try {
    utilsContent = await loadTemplate('lib/utils.ts', {
      projectType,
      isOnlineIDE: projectType.isOnlineIDE
    });
  } catch (error) {
    // Use JavaScript-compatible syntax for online IDEs
    if (projectType.isOnlineIDE) {
      utilsContent = `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Core utility for combining class names with Tailwind CSS
 * Handles conditional classes, removes duplicates, and resolves conflicts
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}`;
    } else {
      utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Core utility for combining class names with Tailwind CSS
 * Handles conditional classes, removes duplicates, and resolves conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
    }
  }

  await writeFileContent(utilsPath, utilsContent);
  console.log(chalk.green(`✅ Created: ${utilsPath}`));
}

/**
 * Creates version tracking file for willow installations
 */
export async function createVersionFile(version: string = '0.6.4'): Promise<void> {
  const versionData = {
    version,
    installed: new Date().toISOString().split('T')[0],
    components: [],
    lastUpdated: new Date().toISOString(),
  };
  
  await writeFileContent('.willow-version.json', JSON.stringify(versionData, null, 2));
  console.log(chalk.green('✅ Created: .willow-version.json'));
}