import { useAdapter, AdapterContextValue } from './AdapterContext.js';
import { useComponent, ComponentContextValue } from './ComponentContext.js';
import { useTheme, ThemeContextValue } from './ThemeContext.js';

/**
 * Combined context hook that returns all context values
 */
export function useAdapterContext(): {
  adapter: AdapterContextValue;
  component: ComponentContextValue;
  theme: ThemeContextValue;
} {
  const adapter = useAdapter();
  const component = useComponent();
  const theme = useTheme();

  return {
    adapter,
    component,
    theme,
  };
}

/**
 * Hook that returns only the adapter context
 */
export function useAdapterOnly(): AdapterContextValue {
  return useAdapter();
}

/**
 * Hook that returns only the component context
 */
export function useComponentContext(): ComponentContextValue {
  return useComponent();
}

/**
 * Hook that returns only the theme context
 */
export function useThemeContext(): ThemeContextValue {
  return useTheme();
}

/**
 * Hook for checking if all contexts are available
 */
export function useContextAvailability(): {
  hasAdapter: boolean;
  hasComponent: boolean;
  hasTheme: boolean;
  allAvailable: boolean;
} {
  const adapter = useAdapter();
  const component = useComponent();
  const theme = useTheme();

  const hasAdapter = !!adapter;
  const hasComponent = !!component;
  const hasTheme = !!theme;
  const allAvailable = hasAdapter && hasComponent && hasTheme;

  return {
    hasAdapter,
    hasComponent,
    hasTheme,
    allAvailable,
  };
}