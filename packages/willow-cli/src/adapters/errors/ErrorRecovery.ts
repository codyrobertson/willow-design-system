import { AdapterError, AdapterInitializationError, AdapterConfigurationError } from './AdapterError';
import { ErrorHandler, ErrorHandlerConfig } from './ErrorHandler';

/**
 * Recovery strategy for specific error types
 */
export interface RecoveryStrategy {
  canRecover: (error: AdapterError) => boolean;
  recover: (error: AdapterError, context: RecoveryContext) => Promise<any>;
  priority: number;
}

/**
 * Recovery context information
 */
export interface RecoveryContext {
  operation: string;
  adapterName?: string;
  originalArgs?: any[];
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, any>;
}

/**
 * Recovery result
 */
export interface RecoveryResult<T = any> {
  success: boolean;
  result?: T;
  strategy?: string;
  error?: AdapterError;
  recoveryAttempts: number;
}

/**
 * Error recovery manager with automatic fallback strategies
 */
export class ErrorRecovery {
  private readonly strategies: Map<string, RecoveryStrategy> = new Map();
  private readonly errorHandler: ErrorHandler;

  constructor(errorHandlerConfig?: Partial<ErrorHandlerConfig>) {
    this.errorHandler = new ErrorHandler(errorHandlerConfig);
    this.registerDefaultStrategies();
  }

  /**
   * Register a recovery strategy
   */
  registerStrategy(name: string, strategy: RecoveryStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Attempt to recover from an error using registered strategies
   */
  async recover<T>(
    error: AdapterError,
    context: Partial<RecoveryContext> = {}
  ): Promise<RecoveryResult<T>> {
    const fullContext: RecoveryContext = {
      operation: 'unknown',
      retryCount: 0,
      maxRetries: 3,
      metadata: {},
      ...context,
    };

    const result: RecoveryResult<T> = {
      success: false,
      recoveryAttempts: 0,
    };

    // Get applicable strategies sorted by priority
    const applicableStrategies = Array.from(this.strategies.entries())
      .filter(([, strategy]) => strategy.canRecover(error))
      .sort(([, a], [, b]) => b.priority - a.priority);

    if (applicableStrategies.length === 0) {
      result.error = error;
      return result;
    }

    // Try each strategy
    for (const [name, strategy] of applicableStrategies) {
      result.recoveryAttempts++;

      try {
        const recoveryResult = await strategy.recover(error, fullContext);
        result.success = true;
        result.result = recoveryResult;
        result.strategy = name;
        return result;
      } catch (recoveryError) {
        console.warn(`Recovery strategy '${name}' failed:`, recoveryError);
        // Continue to next strategy
      }
    }

    // All strategies failed
    result.error = error;
    return result;
  }

  /**
   * Execute operation with automatic error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: Partial<RecoveryContext> = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const adapterError = error instanceof AdapterError ? 
        error : 
        new AdapterError(
          String(error),
          'EXECUTION_ERROR',
          { cause: error instanceof Error ? error : undefined }
        );

      const recoveryResult = await this.recover<T>(adapterError, context);
      
      if (recoveryResult.success) {
        return recoveryResult.result!;
      }
      
      throw recoveryResult.error || adapterError;
    }
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultStrategies(): void {
    // Configuration error recovery
    this.registerStrategy('configurationFallback', {
      canRecover: (error) => error instanceof AdapterConfigurationError,
      recover: async (error, context) => {
        console.warn(`Using default configuration due to error: ${error.message}`);
        return this.getDefaultConfiguration(context.adapterName);
      },
      priority: 5,
    });

    // Initialization error recovery
    this.registerStrategy('initializationRetry', {
      canRecover: (error) => error instanceof AdapterInitializationError && error.recoverable,
      recover: async (error, context) => {
        if (context.retryCount >= context.maxRetries) {
          throw error;
        }
        
        console.warn(`Retrying initialization (${context.retryCount + 1}/${context.maxRetries})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (context.retryCount + 1)));
        
        // Return indication to retry
        return { retry: true };
      },
      priority: 8,
    });

    // Dependency error recovery
    this.registerStrategy('dependencyFallback', {
      canRecover: (error) => error.code === 'ADAPTER_DEPENDENCY_ERROR',
      recover: async (error, context) => {
        console.warn(`Loading fallback adapter due to dependency error: ${error.message}`);
        return this.loadFallbackAdapter(context.adapterName);
      },
      priority: 6,
    });

    // Performance error recovery
    this.registerStrategy('performanceOptimization', {
      canRecover: (error) => error.code === 'ADAPTER_PERFORMANCE_ERROR',
      recover: async (error, context) => {
        console.warn(`Applying performance optimizations due to: ${error.message}`);
        return this.applyPerformanceOptimizations(context);
      },
      priority: 4,
    });

    // Mapping error recovery
    this.registerStrategy('mappingFallback', {
      canRecover: (error) => error.code === 'ADAPTER_MAPPING_ERROR',
      recover: async (error, context) => {
        console.warn(`Using fallback mapping due to error: ${error.message}`);
        return this.getFallbackMapping(error.context.componentName);
      },
      priority: 3,
    });

    // Style error recovery
    this.registerStrategy('styleFallback', {
      canRecover: (error) => error.code === 'ADAPTER_STYLE_ERROR',
      recover: async (error, context) => {
        console.warn(`Using fallback styles due to error: ${error.message}`);
        return this.getFallbackStyles(error.context.styleName);
      },
      priority: 2,
    });

    // Token error recovery
    this.registerStrategy('tokenFallback', {
      canRecover: (error) => error.code === 'ADAPTER_TOKEN_ERROR',
      recover: async (error, context) => {
        console.warn(`Using fallback token due to error: ${error.message}`);
        return this.getFallbackToken(error.context.tokenPath);
      },
      priority: 1,
    });

    // Generic fallback strategy
    this.registerStrategy('genericFallback', {
      canRecover: (error) => error.recoverable,
      recover: async (error, context) => {
        console.warn(`Using generic fallback due to error: ${error.message}`);
        return this.getGenericFallback(context);
      },
      priority: 0,
    });
  }

  /**
   * Get default configuration for an adapter
   */
  private getDefaultConfiguration(adapterName?: string): any {
    return {
      name: adapterName || 'fallback-adapter',
      version: '1.0.0',
      options: {
        theme: 'light',
        rtl: false,
        accessibility: true,
        performanceMode: 'balanced',
        strictMode: false,
        debugMode: false,
        cacheSize: 1000,
        timeout: 10000,
        retryCount: 3,
        locale: 'en-US',
      },
    };
  }

  /**
   * Load a fallback adapter
   */
  private async loadFallbackAdapter(adapterName?: string): Promise<any> {
    // In a real implementation, this would load a basic/default adapter
    console.info(`Loading fallback adapter for: ${adapterName}`);
    return {
      name: 'fallback-adapter',
      initialized: true,
      capabilities: ['basic-mapping', 'simple-styles'],
    };
  }

  /**
   * Apply performance optimizations
   */
  private async applyPerformanceOptimizations(context: RecoveryContext): Promise<any> {
    console.info('Applying performance optimizations');
    return {
      cacheEnabled: true,
      cacheSize: Math.max(500, (context.metadata?.cacheSize || 1000) / 2),
      lazyLoading: true,
      debounceTime: 300,
    };
  }

  /**
   * Get fallback component mapping
   */
  private getFallbackMapping(componentName?: string): any {
    return {
      component: componentName || 'div',
      props: {},
      styles: {
        display: 'block',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        color: 'inherit',
      },
      variants: [],
      displayName: componentName || 'FallbackComponent',
    };
  }

  /**
   * Get fallback styles
   */
  private getFallbackStyles(styleName?: string): any {
    const baseStyles = {
      display: 'block',
      margin: 0,
      padding: 0,
      border: 'none',
      background: 'transparent',
      font: 'inherit',
      color: 'inherit',
    };

    // Add specific fallbacks based on style name
    if (styleName?.includes('button')) {
      return {
        ...baseStyles,
        cursor: 'pointer',
        padding: '8px 16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#f0f0f0',
      };
    }

    if (styleName?.includes('input')) {
      return {
        ...baseStyles,
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
      };
    }

    return baseStyles;
  }

  /**
   * Get fallback token value
   */
  private getFallbackToken(tokenPath?: string): any {
    if (!tokenPath) return null;

    const pathParts = tokenPath.split('.');
    const category = pathParts[0];
    const property = pathParts[1];

    switch (category) {
      case 'colors':
        return this.getFallbackColor(property);
      case 'spacing':
        return this.getFallbackSpacing(property);
      case 'typography':
        return this.getFallbackTypography(property);
      case 'borders':
        return this.getFallbackBorder(property);
      default:
        return null;
    }
  }

  /**
   * Get fallback color value
   */
  private getFallbackColor(property?: string): string {
    const fallbackColors: Record<string, string> = {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
      background: '#ffffff',
      text: '#333333',
    };

    return fallbackColors[property || 'primary'] || '#000000';
  }

  /**
   * Get fallback spacing value
   */
  private getFallbackSpacing(property?: string): string {
    const fallbackSpacing: Record<string, string> = {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    };

    return fallbackSpacing[property || 'md'] || '16px';
  }

  /**
   * Get fallback typography value
   */
  private getFallbackTypography(property?: string): string | number {
    const fallbackTypography: Record<string, string | number> = {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 'normal',
    };

    return fallbackTypography[property || 'fontSize'] || '16px';
  }

  /**
   * Get fallback border value
   */
  private getFallbackBorder(property?: string): string {
    const fallbackBorders: Record<string, string> = {
      width: '1px',
      style: 'solid',
      color: '#ccc',
      radius: '4px',
    };

    return fallbackBorders[property || 'width'] || '1px';
  }

  /**
   * Get generic fallback value
   */
  private getGenericFallback(context: RecoveryContext): any {
    console.warn(`Using generic fallback for operation: ${context.operation}`);
    
    // Return appropriate fallback based on operation type
    if (context.operation.includes('map') || context.operation.includes('component')) {
      return this.getFallbackMapping();
    }
    
    if (context.operation.includes('style')) {
      return this.getFallbackStyles();
    }
    
    if (context.operation.includes('token')) {
      return null;
    }
    
    if (context.operation.includes('config')) {
      return this.getDefaultConfiguration();
    }
    
    return null;
  }

  /**
   * Remove a recovery strategy
   */
  removeStrategy(name: string): boolean {
    return this.strategies.delete(name);
  }

  /**
   * Get all registered strategy names
   */
  getStrategyNames(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Clear all recovery strategies
   */
  clearStrategies(): void {
    this.strategies.clear();
  }

  /**
   * Get recovery statistics
   */
  getStatistics(): {
    strategiesCount: number;
    errorHandlerStats: any;
  } {
    return {
      strategiesCount: this.strategies.size,
      errorHandlerStats: this.errorHandler.getStatistics(),
    };
  }
}

/**
 * Global error recovery instance
 */
export const globalErrorRecovery = new ErrorRecovery();

/**
 * Convenience function for executing with recovery
 */
export async function executeWithRecovery<T>(
  operation: () => Promise<T>,
  context?: Partial<RecoveryContext>
): Promise<T> {
  return globalErrorRecovery.executeWithRecovery(operation, context);
}

/**
 * Decorator for automatic error recovery
 */
export function withErrorRecovery(context?: Partial<RecoveryContext>) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      return globalErrorRecovery.executeWithRecovery(
        () => originalMethod.apply(this, args),
        {
          operation: `${target.constructor.name}.${propertyKey}`,
          originalArgs: args,
          ...context,
        }
      );
    } as T;

    return descriptor;
  };
}