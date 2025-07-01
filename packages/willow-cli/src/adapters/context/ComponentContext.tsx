import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useAdapter } from './AdapterContext';
import { ComponentConfig, ComponentType, ComponentVariant } from '../types/AdapterTypes';
import { StyleConfig } from '../types/AdapterTypes';

/**
 * Component mapping result
 */
export interface ComponentMapping {
  component: React.ComponentType<any>;
  props: Record<string, any>;
  styles: Record<string, any>;
  variants: ComponentVariant[];
  displayName: string;
}

/**
 * Component context state
 */
export interface ComponentContextState {
  // Component mappings cache
  mappings: Map<string, ComponentMapping>;
  
  // Component registry
  components: Map<ComponentType, ComponentConfig>;
  
  // Performance tracking
  mappingTime: number;
  cacheHits: number;
  cacheMisses: number;
  
  // Configuration
  enableCaching: boolean;
  enablePerformanceTracking: boolean;
  maxCacheSize: number;
}

/**
 * Component context value
 */
export interface ComponentContextValue extends ComponentContextState {
  // Component mapping
  mapComponent: (componentName: string, props?: Record<string, any>) => ComponentMapping | null;
  getComponent: (type: ComponentType) => ComponentConfig | null;
  
  // Variant handling
  getVariant: (componentName: string, variantName: string) => ComponentVariant | null;
  applyVariant: (mapping: ComponentMapping, variantName: string) => ComponentMapping;
  
  // Style management
  getStyles: (componentName: string, variant?: string) => Record<string, any>;
  mergeStyles: (baseStyles: Record<string, any>, additionalStyles: Record<string, any>) => Record<string, any>;
  
  // Cache management
  clearCache: () => void;
  getCacheStats: () => { hits: number; misses: number; size: number };
  
  // Component registration
  registerComponent: (type: ComponentType, config: ComponentConfig) => void;
  unregisterComponent: (type: ComponentType) => void;
  
  // Utilities
  isComponentSupported: (componentName: string) => boolean;
  getAvailableComponents: () => ComponentType[];
  getSupportedVariants: (componentName: string) => string[];
}

/**
 * Component context provider props
 */
export interface ComponentProviderProps {
  children: ReactNode;
  enableCaching?: boolean;
  enablePerformanceTracking?: boolean;
  maxCacheSize?: number;
  defaultComponents?: Array<{ type: ComponentType; config: ComponentConfig }>;
}

/**
 * Create the component context
 */
const ComponentContext = createContext<ComponentContextValue | null>(null);

/**
 * Component context provider
 */
export function ComponentProvider({
  children,
  enableCaching = true,
  enablePerformanceTracking = false,
  maxCacheSize = 1000,
  defaultComponents = [],
}: ComponentProviderProps) {
  const adapter = useAdapter();

  // Initialize state
  const [state] = React.useState<ComponentContextState>(() => {
    const components = new Map<ComponentType, ComponentConfig>();
    
    // Register default components
    defaultComponents.forEach(({ type, config }) => {
      components.set(type, config);
    });

    return {
      mappings: new Map(),
      components,
      mappingTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      enableCaching,
      enablePerformanceTracking,
      maxCacheSize,
    };
  });

  /**
   * Measure operation performance if tracking is enabled
   */
  const measureOperation = useCallback(
    function <T>(operation: () => T): T {
      if (!state.enablePerformanceTracking) {
        return operation();
      }

      const startTime = performance.now();
      const result = operation();
      const duration = performance.now() - startTime;
      state.mappingTime += duration;
      return result;
    },
    [state.enablePerformanceTracking]
  );

  /**
   * Map a component using the current adapter
   */
  const mapComponent = useCallback(
    (componentName: string, props: Record<string, any> = {}): ComponentMapping | null => {
      // Check cache first if enabled
      if (state.enableCaching) {
        const cacheKey = `${componentName}:${JSON.stringify(props)}`;
        const cached = state.mappings.get(cacheKey);
        if (cached) {
          state.cacheHits++;
          return cached;
        }
        state.cacheMisses++;
      }

      if (!adapter.currentAdapter) {
        console.warn('No adapter available for component mapping');
        return null;
      }

      return measureOperation(() => {
        try {
          // Get component mapping from adapter
          const mapping = adapter.currentAdapter!.mapComponent(componentName, props);
          
          // Cache the result if caching is enabled
          if (state.enableCaching && mapping) {
            const cacheKey = `${componentName}:${JSON.stringify(props)}`;
            
            // Ensure cache doesn't exceed max size
            if (state.mappings.size >= state.maxCacheSize) {
              // Remove oldest entry (first entry in Map)
              const firstKey = state.mappings.keys().next().value;
              if (firstKey) {
                state.mappings.delete(firstKey);
              }
            }
            
            state.mappings.set(cacheKey, mapping);
          }
          
          return mapping;
        } catch (error) {
          console.error(`Failed to map component ${componentName}:`, error);
          return null;
        }
      });
    },
    [adapter.currentAdapter, state, measureOperation]
  );

  /**
   * Get component configuration by type
   */
  const getComponent = useCallback(
    (type: ComponentType): ComponentConfig | null => {
      return state.components.get(type) || null;
    },
    [state.components]
  );

  /**
   * Get component variant by name
   */
  const getVariant = useCallback(
    (componentName: string, variantName: string): ComponentVariant | null => {
      const componentType = Object.values(ComponentType).find(type => type === componentName);
      if (!componentType) return null;

      const config = state.components.get(componentType);
      if (!config || !config.variants) return null;

      return config.variants.find(variant => variant.name === variantName) || null;
    },
    [state.components]
  );

  /**
   * Apply variant to component mapping
   */
  const applyVariant = useCallback(
    (mapping: ComponentMapping, variantName: string): ComponentMapping => {
      const variant = mapping.variants.find(v => v.name === variantName);
      if (!variant) {
        console.warn(`Variant '${variantName}' not found for component`);
        return mapping;
      }

      return {
        ...mapping,
        props: { ...mapping.props, ...variant.props },
      };
    },
    []
  );

  /**
   * Get styles for component
   */
  const getStyles = useCallback(
    (componentName: string, variant?: string): Record<string, any> => {
      if (!adapter.currentAdapter) {
        return {};
      }

      try {
        const styles: StyleConfig = {
          base: {},
          variants: variant ? { [variant]: {} } : {},
        };

        const translatedStyles = adapter.currentAdapter.translateStyles(styles);
        return translatedStyles;
      } catch (error) {
        console.error(`Failed to get styles for ${componentName}:`, error);
        return {};
      }
    },
    [adapter.currentAdapter]
  );

  /**
   * Merge multiple style objects
   */
  const mergeStyles = useCallback(
    (baseStyles: Record<string, any>, additionalStyles: Record<string, any>): Record<string, any> => {
      return { ...baseStyles, ...additionalStyles };
    },
    []
  );

  /**
   * Clear component mappings cache
   */
  const clearCache = useCallback(() => {
    state.mappings.clear();
    state.cacheHits = 0;
    state.cacheMisses = 0;
  }, [state]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return {
      hits: state.cacheHits,
      misses: state.cacheMisses,
      size: state.mappings.size,
    };
  }, [state]);

  /**
   * Register a component
   */
  const registerComponent = useCallback(
    (type: ComponentType, config: ComponentConfig) => {
      state.components.set(type, config);
      // Clear cache to ensure fresh mappings
      if (state.enableCaching) {
        clearCache();
      }
    },
    [state, clearCache]
  );

  /**
   * Unregister a component
   */
  const unregisterComponent = useCallback(
    (type: ComponentType) => {
      state.components.delete(type);
      // Clear cache to ensure fresh mappings
      if (state.enableCaching) {
        clearCache();
      }
    },
    [state, clearCache]
  );

  /**
   * Check if component is supported
   */
  const isComponentSupported = useCallback(
    (componentName: string): boolean => {
      const componentType = Object.values(ComponentType).find(type => type === componentName);
      return componentType ? state.components.has(componentType) : false;
    },
    [state.components]
  );

  /**
   * Get all available components
   */
  const getAvailableComponents = useCallback((): ComponentType[] => {
    return Array.from(state.components.keys());
  }, [state.components]);

  /**
   * Get supported variants for a component
   */
  const getSupportedVariants = useCallback(
    (componentName: string): string[] => {
      const componentType = Object.values(ComponentType).find(type => type === componentName);
      if (!componentType) return [];

      const config = state.components.get(componentType);
      if (!config || !config.variants) return [];

      return config.variants.map(variant => variant.name);
    },
    [state.components]
  );

  // Create context value
  const contextValue: ComponentContextValue = useMemo(
    () => ({
      ...state,
      mapComponent,
      getComponent,
      getVariant,
      applyVariant,
      getStyles,
      mergeStyles,
      clearCache,
      getCacheStats,
      registerComponent,
      unregisterComponent,
      isComponentSupported,
      getAvailableComponents,
      getSupportedVariants,
    }),
    [
      state,
      mapComponent,
      getComponent,
      getVariant,
      applyVariant,
      getStyles,
      mergeStyles,
      clearCache,
      getCacheStats,
      registerComponent,
      unregisterComponent,
      isComponentSupported,
      getAvailableComponents,
      getSupportedVariants,
    ]
  );

  return (
    <ComponentContext.Provider value={contextValue}>
      {children}
    </ComponentContext.Provider>
  );
}

/**
 * Hook to use component context
 */
export function useComponent(): ComponentContextValue {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('useComponent must be used within a ComponentProvider');
  }
  return context;
}

/**
 * Hook to use component context safely (returns null if not available)
 */
export function useComponentSafe(): ComponentContextValue | null {
  return useContext(ComponentContext);
}

/**
 * Hook to map a specific component
 */
export function useComponentMapping(
  componentName: string,
  props: Record<string, any> = {},
  variant?: string
): ComponentMapping | null {
  const { mapComponent, applyVariant } = useComponent();

  return useMemo(() => {
    let mapping = mapComponent(componentName, props);
    
    if (mapping && variant) {
      mapping = applyVariant(mapping, variant);
    }
    
    return mapping;
  }, [mapComponent, applyVariant, componentName, props, variant]);
}

/**
 * Higher-order component to inject component context
 */
export function withComponent<P extends object>(
  Component: React.ComponentType<P & { component: ComponentContextValue }>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    const component = useComponent();
    return <Component {...props} component={component} />;
  };
}