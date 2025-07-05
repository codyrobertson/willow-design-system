/**
 * Adapter context providers and hooks
 */

// Main adapter context
export {
  AdapterProvider,
  useAdapter,
  useAdapterSafe,
  withAdapter,
  type AdapterContextState,
  type AdapterContextValue,
  type AdapterProviderProps,
} from './AdapterContext.js';

// Component context
export {
  ComponentProvider,
  useComponent,
  useComponentSafe,
  useComponentMapping,
  withComponent,
  type ComponentContextState,
  type ComponentContextValue,
  type ComponentProviderProps,
  type ComponentMapping,
} from './ComponentContext.js';

// Theme context
export {
  ThemeProvider,
  useTheme,
  useThemeSafe,
  withTheme,
  type ThemeContextState,
  type ThemeContextValue,
  type ThemeProviderProps,
  type ThemeMode,
} from './ThemeContext.js';

// Combined provider component
export { CombinedProvider, type CombinedProviderProps } from './CombinedProvider.js';

// Context utilities
export { useAdapterContext, useComponentContext, useThemeContext } from './hooks.js';