import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useAdapter } from './AdapterContext';
import { TokenConfig, ColorTokens, TypographyTokens, SpacingTokens } from '../types/AdapterTypes';

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Theme context state
 */
export interface ThemeContextState {
  // Current theme mode
  mode: ThemeMode;
  
  // Current tokens
  tokens: TokenConfig;
  
  // Resolved tokens (after adapter processing)
  resolvedTokens: Record<string, any>;
  
  // Theme variants
  variants: Map<string, TokenConfig>;
  
  // System theme detection
  systemTheme: 'light' | 'dark';
  
  // Loading states
  isLoading: boolean;
  
  // Configuration
  enableSystemTheme: boolean;
  enableTransitions: boolean;
  enablePersistence: boolean;
  persistenceKey: string;
}

/**
 * Theme context actions
 */
export type ThemeContextAction =
  | { type: 'SET_MODE'; payload: ThemeMode }
  | { type: 'SET_TOKENS'; payload: TokenConfig }
  | { type: 'SET_RESOLVED_TOKENS'; payload: Record<string, any> }
  | { type: 'SET_SYSTEM_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_VARIANT'; payload: { name: string; tokens: TokenConfig } }
  | { type: 'REMOVE_VARIANT'; payload: string }
  | { type: 'RESET_THEME' };

/**
 * Initial theme state
 */
const initialState: ThemeContextState = {
  mode: 'auto',
  tokens: {},
  resolvedTokens: {},
  variants: new Map(),
  systemTheme: 'light',
  isLoading: false,
  enableSystemTheme: true,
  enableTransitions: true,
  enablePersistence: true,
  persistenceKey: 'willow-theme-mode',
};

/**
 * Theme reducer
 */
function themeReducer(state: ThemeContextState, action: ThemeContextAction): ThemeContextState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };
    
    case 'SET_RESOLVED_TOKENS':
      return { ...state, resolvedTokens: action.payload };
    
    case 'SET_SYSTEM_THEME':
      return { ...state, systemTheme: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'ADD_VARIANT':
      const newVariants = new Map(state.variants);
      newVariants.set(action.payload.name, action.payload.tokens);
      return { ...state, variants: newVariants };
    
    case 'REMOVE_VARIANT':
      const updatedVariants = new Map(state.variants);
      updatedVariants.delete(action.payload);
      return { ...state, variants: updatedVariants };
    
    case 'RESET_THEME':
      return { ...initialState };
    
    default:
      return state;
  }
}

/**
 * Theme context value
 */
export interface ThemeContextValue extends ThemeContextState {
  // Theme mode management
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  
  // Token management
  updateTokens: (tokens: Partial<TokenConfig>) => Promise<void>;
  getToken: (path: string) => any;
  setToken: (path: string, value: any) => void;
  
  // Variant management
  addVariant: (name: string, tokens: TokenConfig) => void;
  removeVariant: (name: string) => void;
  applyVariant: (name: string) => void;
  getVariant: (name: string) => TokenConfig | null;
  
  // Utilities
  getEffectiveMode: () => 'light' | 'dark';
  getColorValue: (colorPath: string) => string | null;
  getSpacingValue: (spacingKey: string) => string | null;
  getTypographyValue: (typographyPath: string) => string | number | null;
  
  // CSS variables
  getCSSVariables: () => Record<string, string>;
  applyCSSVariables: (element?: HTMLElement) => void;
  
  // Theme persistence
  loadPersistedTheme: () => void;
  persistTheme: () => void;
  clearPersistedTheme: () => void;
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  defaultTokens?: TokenConfig;
  enableSystemTheme?: boolean;
  enableTransitions?: boolean;
  enablePersistence?: boolean;
  persistenceKey?: string;
  onModeChange?: (mode: ThemeMode) => void;
  onTokensChange?: (tokens: TokenConfig) => void;
}

/**
 * Create the theme context
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme context provider
 */
export function ThemeProvider({
  children,
  defaultMode = 'auto',
  defaultTokens = {},
  enableSystemTheme = true,
  enableTransitions = true,
  enablePersistence = true,
  persistenceKey = 'willow-theme-mode',
  onModeChange,
  onTokensChange,
}: ThemeProviderProps) {
  const adapter = useAdapter();
  const [state, dispatch] = useReducer(themeReducer, {
    ...initialState,
    mode: defaultMode,
    tokens: defaultTokens,
    enableSystemTheme,
    enableTransitions,
    enablePersistence,
    persistenceKey,
  });

  // System theme detection
  useEffect(() => {
    if (!enableSystemTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      dispatch({ type: 'SET_SYSTEM_THEME', payload: e.matches ? 'dark' : 'light' });
    };

    dispatch({ type: 'SET_SYSTEM_THEME', payload: mediaQuery.matches ? 'dark' : 'light' });
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enableSystemTheme]);

  // Load persisted theme on mount
  useEffect(() => {
    if (enablePersistence) {
      loadPersistedTheme();
    }
  }, [enablePersistence]);

  // Resolve tokens when adapter or tokens change
  useEffect(() => {
    if (adapter.currentAdapter && Object.keys(state.tokens).length > 0) {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const resolved = adapter.currentAdapter.convertTokens(state.tokens);
        dispatch({ type: 'SET_RESOLVED_TOKENS', payload: resolved });
      } catch (error) {
        console.error('Failed to resolve tokens:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [adapter.currentAdapter, state.tokens]);

  // Notify mode changes
  useEffect(() => {
    if (onModeChange) {
      onModeChange(state.mode);
    }
  }, [state.mode, onModeChange]);

  // Notify token changes
  useEffect(() => {
    if (onTokensChange) {
      onTokensChange(state.tokens);
    }
  }, [state.tokens, onTokensChange]);

  /**
   * Set theme mode
   */
  const setMode = useCallback((mode: ThemeMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
    if (state.enablePersistence) {
      persistTheme();
    }
  }, [state.enablePersistence]);

  /**
   * Toggle theme mode
   */
  const toggleMode = useCallback(() => {
    const effectiveMode = getEffectiveMode();
    const newMode = effectiveMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  }, [setMode]);

  /**
   * Get effective theme mode (resolving 'auto')
   */
  const getEffectiveMode = useCallback((): 'light' | 'dark' => {
    if (state.mode === 'auto') {
      return state.systemTheme;
    }
    return state.mode as 'light' | 'dark';
  }, [state.mode, state.systemTheme]);

  /**
   * Update tokens
   */
  const updateTokens = useCallback(async (tokenUpdate: Partial<TokenConfig>) => {
    const newTokens = { ...state.tokens, ...tokenUpdate };
    dispatch({ type: 'SET_TOKENS', payload: newTokens });
  }, [state.tokens]);

  /**
   * Get token value by path
   */
  const getToken = useCallback((path: string): any => {
    const keys = path.split('.');
    let current: any = state.resolvedTokens;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  }, [state.resolvedTokens]);

  /**
   * Set token value by path
   */
  const setToken = useCallback((path: string, value: any) => {
    const keys = path.split('.');
    const newTokens = { ...state.tokens };
    let current: any = newTokens;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    dispatch({ type: 'SET_TOKENS', payload: newTokens });
  }, [state.tokens]);

  /**
   * Add theme variant
   */
  const addVariant = useCallback((name: string, tokens: TokenConfig) => {
    dispatch({ type: 'ADD_VARIANT', payload: { name, tokens } });
  }, []);

  /**
   * Remove theme variant
   */
  const removeVariant = useCallback((name: string) => {
    dispatch({ type: 'REMOVE_VARIANT', payload: name });
  }, []);

  /**
   * Apply theme variant
   */
  const applyVariant = useCallback((name: string) => {
    const variant = state.variants.get(name);
    if (variant) {
      dispatch({ type: 'SET_TOKENS', payload: variant });
    }
  }, [state.variants]);

  /**
   * Get theme variant
   */
  const getVariant = useCallback((name: string): TokenConfig | null => {
    return state.variants.get(name) || null;
  }, [state.variants]);

  /**
   * Get color value
   */
  const getColorValue = useCallback((colorPath: string): string | null => {
    return getToken(`colors.${colorPath}`) || null;
  }, [getToken]);

  /**
   * Get spacing value
   */
  const getSpacingValue = useCallback((spacingKey: string): string | null => {
    return getToken(`spacing.${spacingKey}`) || null;
  }, [getToken]);

  /**
   * Get typography value
   */
  const getTypographyValue = useCallback((typographyPath: string): string | number | null => {
    return getToken(`typography.${typographyPath}`) || null;
  }, [getToken]);

  /**
   * Get CSS variables from resolved tokens
   */
  const getCSSVariables = useCallback((): Record<string, string> => {
    const variables: Record<string, string> = {};
    
    function flattenObject(obj: any, prefix = '--willow'): void {
      for (const [key, value] of Object.entries(obj)) {
        const varName = `${prefix}-${key}`;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value, varName);
        } else {
          variables[varName] = String(value);
        }
      }
    }
    
    flattenObject(state.resolvedTokens);
    return variables;
  }, [state.resolvedTokens]);

  /**
   * Apply CSS variables to element
   */
  const applyCSSVariables = useCallback((element: HTMLElement = document.documentElement) => {
    const variables = getCSSVariables();
    
    for (const [name, value] of Object.entries(variables)) {
      element.style.setProperty(name, value);
    }
  }, [getCSSVariables]);

  /**
   * Load persisted theme
   */
  const loadPersistedTheme = useCallback(() => {
    if (!state.enablePersistence) return;
    
    try {
      const saved = localStorage.getItem(state.persistenceKey);
      if (saved) {
        const mode = saved as ThemeMode;
        dispatch({ type: 'SET_MODE', payload: mode });
      }
    } catch (error) {
      console.warn('Failed to load persisted theme:', error);
    }
  }, [state.enablePersistence, state.persistenceKey]);

  /**
   * Persist current theme
   */
  const persistTheme = useCallback(() => {
    if (!state.enablePersistence) return;
    
    try {
      localStorage.setItem(state.persistenceKey, state.mode);
    } catch (error) {
      console.warn('Failed to persist theme:', error);
    }
  }, [state.enablePersistence, state.persistenceKey, state.mode]);

  /**
   * Clear persisted theme
   */
  const clearPersistedTheme = useCallback(() => {
    if (!state.enablePersistence) return;
    
    try {
      localStorage.removeItem(state.persistenceKey);
    } catch (error) {
      console.warn('Failed to clear persisted theme:', error);
    }
  }, [state.enablePersistence, state.persistenceKey]);

  // Apply CSS variables when resolved tokens change
  useEffect(() => {
    if (Object.keys(state.resolvedTokens).length > 0) {
      applyCSSVariables();
    }
  }, [state.resolvedTokens, applyCSSVariables]);

  // Create context value
  const contextValue: ThemeContextValue = useMemo(
    () => ({
      ...state,
      setMode,
      toggleMode,
      updateTokens,
      getToken,
      setToken,
      addVariant,
      removeVariant,
      applyVariant,
      getVariant,
      getEffectiveMode,
      getColorValue,
      getSpacingValue,
      getTypographyValue,
      getCSSVariables,
      applyCSSVariables,
      loadPersistedTheme,
      persistTheme,
      clearPersistedTheme,
    }),
    [
      state,
      setMode,
      toggleMode,
      updateTokens,
      getToken,
      setToken,
      addVariant,
      removeVariant,
      applyVariant,
      getVariant,
      getEffectiveMode,
      getColorValue,
      getSpacingValue,
      getTypographyValue,
      getCSSVariables,
      applyCSSVariables,
      loadPersistedTheme,
      persistTheme,
      clearPersistedTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to use theme context safely
 */
export function useThemeSafe(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

/**
 * Higher-order component to inject theme context
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ThemeContextValue }>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
}