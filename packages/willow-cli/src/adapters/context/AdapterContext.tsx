import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { UIKitAdapter, AdapterConfig } from '../base/UIKitAdapter';
import { AdapterRegistry } from '../base/AdapterRegistry';
import { AdapterLifecycle, AdapterLifecyclePhase } from '../base/AdapterLifecycle';
import { ValidationUtils } from '../utils/ValidationUtils';
import { ValidationResult } from '../base/AdapterValidator';

/**
 * Adapter context state
 */
export interface AdapterContextState {
  // Current adapter instance
  currentAdapter: UIKitAdapter | null;
  
  // Registry for managing adapters
  registry: AdapterRegistry;
  
  // Lifecycle manager
  lifecycle: AdapterLifecycle;
  
  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  
  // Error states
  error: Error | null;
  validationErrors: ValidationResult | null;
  
  // Configuration
  config: AdapterConfig | null;
  
  // Available adapters
  availableAdapters: string[];
  
  // Performance metrics
  metrics: {
    initializationTime: number;
    lastValidationTime: number;
    componentMappingTime: number;
  };
}

/**
 * Adapter context actions
 */
export type AdapterContextAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationResult | null }
  | { type: 'SET_CURRENT_ADAPTER'; payload: UIKitAdapter | null }
  | { type: 'SET_CONFIG'; payload: AdapterConfig | null }
  | { type: 'SET_AVAILABLE_ADAPTERS'; payload: string[] }
  | { type: 'UPDATE_METRICS'; payload: Partial<AdapterContextState['metrics']> }
  | { type: 'RESET_STATE' };

/**
 * Initial state
 */
const initialState: AdapterContextState = {
  currentAdapter: null,
  registry: AdapterRegistry.getInstance(),
  lifecycle: new AdapterLifecycle(),
  isLoading: false,
  isInitializing: false,
  error: null,
  validationErrors: null,
  config: null,
  availableAdapters: [],
  metrics: {
    initializationTime: 0,
    lastValidationTime: 0,
    componentMappingTime: 0,
  },
};

/**
 * State reducer
 */
function adapterReducer(state: AdapterContextState, action: AdapterContextAction): AdapterContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    
    case 'SET_CURRENT_ADAPTER':
      return { ...state, currentAdapter: action.payload };
    
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    
    case 'SET_AVAILABLE_ADAPTERS':
      return { ...state, availableAdapters: action.payload };
    
    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload },
      };
    
    case 'RESET_STATE':
      return { ...initialState };
    
    default:
      return state;
  }
}

/**
 * Adapter context interface
 */
export interface AdapterContextValue extends AdapterContextState {
  // Actions
  initializeAdapter: (adapterName: string, config: AdapterConfig) => Promise<void>;
  switchAdapter: (adapterName: string, config?: AdapterConfig) => Promise<void>;
  updateConfig: (config: Partial<AdapterConfig>) => Promise<void>;
  validateConfig: (config: AdapterConfig) => Promise<ValidationResult>;
  clearError: () => void;
  resetContext: () => void;
  
  // Utilities
  getAvailableAdapters: () => string[];
  isAdapterAvailable: (name: string) => boolean;
  getCurrentAdapterInfo: () => { name: string; version: string } | null;
  
  // Performance
  getMetrics: () => AdapterContextState['metrics'];
  measureOperation: <T>(operation: () => Promise<T>, metricKey: keyof AdapterContextState['metrics']) => Promise<T>;
}

/**
 * Create the adapter context
 */
const AdapterContext = createContext<AdapterContextValue | null>(null);

/**
 * Adapter context provider props
 */
export interface AdapterProviderProps {
  children: ReactNode;
  defaultAdapter?: string;
  defaultConfig?: AdapterConfig;
  enableDevTools?: boolean;
  onError?: (error: Error) => void;
  onAdapterChange?: (adapter: UIKitAdapter | null) => void;
}

/**
 * Adapter context provider component
 */
export function AdapterProvider({
  children,
  defaultAdapter,
  defaultConfig,
  enableDevTools = false,
  onError,
  onAdapterChange,
}: AdapterProviderProps) {
  const [state, dispatch] = useReducer(adapterReducer, initialState);

  // Initialize available adapters on mount
  useEffect(() => {
    const availableAdapters = state.registry.getRegisteredAdapters();
    dispatch({ type: 'SET_AVAILABLE_ADAPTERS', payload: availableAdapters });
  }, [state.registry]);

  // Initialize default adapter if provided
  useEffect(() => {
    if (defaultAdapter && defaultConfig) {
      initializeAdapter(defaultAdapter, defaultConfig).catch((error) => {
        console.error('Failed to initialize default adapter:', error);
      });
    }
  }, [defaultAdapter, defaultConfig]);

  // Handle adapter changes
  useEffect(() => {
    if (onAdapterChange) {
      onAdapterChange(state.currentAdapter);
    }
  }, [state.currentAdapter, onAdapterChange]);

  // Handle errors
  useEffect(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  /**
   * Measure operation performance
   */
  const measureOperation = useCallback(
    async <T>(operation: () => Promise<T>, metricKey: keyof AdapterContextState['metrics']): Promise<T> => {
      const startTime = performance.now();
      try {
        const result = await operation();
        const duration = performance.now() - startTime;
        dispatch({ type: 'UPDATE_METRICS', payload: { [metricKey]: duration } });
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        dispatch({ type: 'UPDATE_METRICS', payload: { [metricKey]: duration } });
        throw error;
      }
    },
    []
  );

  /**
   * Initialize an adapter
   */
  const initializeAdapter = useCallback(
    async (adapterName: string, config: AdapterConfig): Promise<void> => {
      dispatch({ type: 'SET_INITIALIZING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: null });

      try {
        // Validate configuration
        const validationResult = await measureOperation(
          () => Promise.resolve(ValidationUtils.validateAdapterConfigStrict(config)),
          'lastValidationTime'
        );

        if (!validationResult.valid) {
          dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validationResult });
          throw new Error(`Invalid adapter configuration: ${validationResult.errors?.[0]?.message}`);
        }

        // Initialize adapter with lifecycle tracking
        const adapter = await measureOperation(
          async () => {
            dispatch({ type: 'SET_CONFIG', payload: config });
            
            // Create adapter instance
            const instance = await state.registry.create(adapterName, {
              config,
              lifecycle: state.lifecycle,
            });

            // Initialize with lifecycle hooks
            await state.lifecycle.runPhase(AdapterLifecyclePhase.INITIALIZING, instance, config);
            await instance.initialize();
            await state.lifecycle.runPhase(AdapterLifecyclePhase.INITIALIZED, instance, config);

            return instance;
          },
          'initializationTime'
        );

        dispatch({ type: 'SET_CURRENT_ADAPTER', payload: adapter });

        if (enableDevTools) {
          console.log('Adapter initialized:', {
            name: adapterName,
            config,
            metrics: state.metrics,
          });
        }
      } catch (error) {
        const adapterError = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: 'SET_ERROR', payload: adapterError });
        
        // Run error lifecycle hook
        try {
          await state.lifecycle.runPhase(AdapterLifecyclePhase.ERROR, null, config, adapterError);
        } catch (lifecycleError) {
          console.error('Lifecycle error hook failed:', lifecycleError);
        }
        
        throw adapterError;
      } finally {
        dispatch({ type: 'SET_INITIALIZING', payload: false });
      }
    },
    [state.registry, state.lifecycle, state.metrics, measureOperation, enableDevTools]
  );

  /**
   * Switch to a different adapter
   */
  const switchAdapter = useCallback(
    async (adapterName: string, config?: AdapterConfig): Promise<void> => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // Dispose current adapter if it exists
        if (state.currentAdapter) {
          try {
            await state.lifecycle.runPhase(AdapterLifecyclePhase.DISPOSING, state.currentAdapter, state.config || undefined);
            if (typeof (state.currentAdapter as any).dispose === 'function') {
              await (state.currentAdapter as any).dispose();
            }
          } catch (error) {
            console.warn('Error disposing current adapter:', error);
          }
        }

        // Use provided config or current config
        const adapterConfig = config || state.config;
        if (!adapterConfig) {
          throw new Error('No configuration provided for adapter switch');
        }

        // Initialize new adapter
        await initializeAdapter(adapterName, adapterConfig);
      } catch (error) {
        const switchError = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: 'SET_ERROR', payload: switchError });
        throw switchError;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.currentAdapter, state.config, state.lifecycle, initializeAdapter]
  );

  /**
   * Update adapter configuration
   */
  const updateConfig = useCallback(
    async (configUpdate: Partial<AdapterConfig>): Promise<void> => {
      if (!state.config) {
        throw new Error('No current configuration to update');
      }

      const newConfig = { ...state.config, ...configUpdate };
      
      // Validate new configuration
      const validationResult = ValidationUtils.validateAdapterConfigStrict(newConfig);
      if (!validationResult.valid) {
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validationResult });
        throw new Error(`Invalid configuration update: ${validationResult.errors?.[0]?.message}`);
      }

      dispatch({ type: 'SET_CONFIG', payload: newConfig });

      // If adapter is currently active, reinitialize with new config
      if (state.currentAdapter) {
        const adapterName = state.currentAdapter.constructor.name;
        await switchAdapter(adapterName, newConfig);
      }
    },
    [state.config, state.currentAdapter, switchAdapter]
  );

  /**
   * Validate configuration
   */
  const validateConfig = useCallback(
    async (config: AdapterConfig): Promise<ValidationResult> => {
      return measureOperation(
        () => Promise.resolve(ValidationUtils.validateAdapterConfigStrict(config)),
        'lastValidationTime'
      );
    },
    [measureOperation]
  );

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: null });
  }, []);

  /**
   * Reset context to initial state
   */
  const resetContext = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  /**
   * Get available adapters
   */
  const getAvailableAdapters = useCallback(() => {
    return state.registry.getRegisteredAdapters();
  }, [state.registry]);

  /**
   * Check if adapter is available
   */
  const isAdapterAvailable = useCallback(
    (name: string) => {
      return state.availableAdapters.includes(name);
    },
    [state.availableAdapters]
  );

  /**
   * Get current adapter info
   */
  const getCurrentAdapterInfo = useCallback(() => {
    if (!state.currentAdapter || !state.config) {
      return null;
    }

    return {
      name: state.config.name,
      version: state.config.version,
    };
  }, [state.currentAdapter, state.config]);

  /**
   * Get performance metrics
   */
  const getMetrics = useCallback(() => {
    return { ...state.metrics };
  }, [state.metrics]);

  const contextValue: AdapterContextValue = {
    ...state,
    initializeAdapter,
    switchAdapter,
    updateConfig,
    validateConfig,
    clearError,
    resetContext,
    getAvailableAdapters,
    isAdapterAvailable,
    getCurrentAdapterInfo,
    getMetrics,
    measureOperation,
  };

  return (
    <AdapterContext.Provider value={contextValue}>
      {children}
    </AdapterContext.Provider>
  );
}

/**
 * Hook to use adapter context
 */
export function useAdapter(): AdapterContextValue {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error('useAdapter must be used within an AdapterProvider');
  }
  return context;
}

/**
 * Hook to use adapter with error boundary
 */
export function useAdapterSafe(): AdapterContextValue | null {
  const context = useContext(AdapterContext);
  return context;
}

/**
 * Higher-order component to provide adapter context
 */
export function withAdapter<P extends object>(
  Component: React.ComponentType<P & { adapter: AdapterContextValue }>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    const adapter = useAdapter();
    return <Component {...props} adapter={adapter} />;
  };
}