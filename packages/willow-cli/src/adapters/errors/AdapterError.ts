/**
 * Base adapter error class with enhanced error information
 */
export class AdapterError extends Error {
  public readonly code: string;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly recoverable: boolean;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    options: {
      context?: Record<string, any>;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      recoverable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    
    this.name = 'AdapterError';
    this.code = code;
    this.context = options.context || {};
    this.timestamp = new Date();
    this.severity = options.severity || 'medium';
    this.recoverable = options.recoverable ?? true;
    this.cause = options.cause;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AdapterError);
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      severity: this.severity,
      recoverable: this.recoverable,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack,
      } : undefined,
    };
  }

  /**
   * Get error details for debugging
   */
  getDetails(): string {
    const details = [
      `Code: ${this.code}`,
      `Severity: ${this.severity}`,
      `Recoverable: ${this.recoverable}`,
      `Timestamp: ${this.timestamp.toISOString()}`,
    ];

    if (Object.keys(this.context).length > 0) {
      details.push(`Context: ${JSON.stringify(this.context, null, 2)}`);
    }

    if (this.cause) {
      details.push(`Caused by: ${this.cause.name}: ${this.cause.message}`);
    }

    return details.join('\n');
  }
}

/**
 * Initialization-related adapter errors
 */
export class AdapterInitializationError extends AdapterError {
  constructor(
    message: string,
    options: {
      adapterName?: string;
      version?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_INITIALIZATION_ERROR', {
      context: {
        adapterName: options.adapterName,
        version: options.version,
        ...options.context,
      },
      severity: 'high',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterInitializationError';
  }
}

/**
 * Configuration-related adapter errors
 */
export class AdapterConfigurationError extends AdapterError {
  constructor(
    message: string,
    options: {
      configPath?: string;
      expectedType?: string;
      actualValue?: any;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_CONFIGURATION_ERROR', {
      context: {
        configPath: options.configPath,
        expectedType: options.expectedType,
        actualValue: options.actualValue,
        ...options.context,
      },
      severity: 'medium',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterConfigurationError';
  }
}

/**
 * Validation-related adapter errors
 */
export class AdapterValidationError extends AdapterError {
  public readonly validationErrors: Array<{
    path: string;
    message: string;
    code: string;
    value?: any;
  }>;

  constructor(
    message: string,
    validationErrors: Array<{
      path: string;
      message: string;
      code: string;
      value?: any;
    }>,
    options: {
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_VALIDATION_ERROR', {
      context: {
        errorCount: validationErrors.length,
        ...options.context,
      },
      severity: 'medium',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterValidationError';
    this.validationErrors = validationErrors;
  }

  /**
   * Get formatted validation error messages
   */
  getValidationMessages(): string[] {
    return this.validationErrors.map(error => {
      const path = error.path ? `[${error.path}] ` : '';
      return `${path}${error.message}`;
    });
  }

  /**
   * Override toJSON to include validation errors
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Component mapping-related adapter errors
 */
export class AdapterMappingError extends AdapterError {
  constructor(
    message: string,
    options: {
      componentName?: string;
      componentType?: string;
      props?: Record<string, any>;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_MAPPING_ERROR', {
      context: {
        componentName: options.componentName,
        componentType: options.componentType,
        props: options.props,
        ...options.context,
      },
      severity: 'medium',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterMappingError';
  }
}

/**
 * Style translation-related adapter errors
 */
export class AdapterStyleError extends AdapterError {
  constructor(
    message: string,
    options: {
      styleName?: string;
      styleValue?: any;
      expectedFormat?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_STYLE_ERROR', {
      context: {
        styleName: options.styleName,
        styleValue: options.styleValue,
        expectedFormat: options.expectedFormat,
        ...options.context,
      },
      severity: 'low',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterStyleError';
  }
}

/**
 * Token conversion-related adapter errors
 */
export class AdapterTokenError extends AdapterError {
  constructor(
    message: string,
    options: {
      tokenPath?: string;
      tokenValue?: any;
      conversionType?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_TOKEN_ERROR', {
      context: {
        tokenPath: options.tokenPath,
        tokenValue: options.tokenValue,
        conversionType: options.conversionType,
        ...options.context,
      },
      severity: 'medium',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterTokenError';
  }
}

/**
 * Registry-related adapter errors
 */
export class AdapterRegistryError extends AdapterError {
  constructor(
    message: string,
    options: {
      operation?: 'register' | 'unregister' | 'create' | 'get';
      adapterName?: string;
      version?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_REGISTRY_ERROR', {
      context: {
        operation: options.operation,
        adapterName: options.adapterName,
        version: options.version,
        ...options.context,
      },
      severity: 'high',
      recoverable: false,
      cause: options.cause,
    });
    
    this.name = 'AdapterRegistryError';
  }
}

/**
 * Lifecycle-related adapter errors
 */
export class AdapterLifecycleError extends AdapterError {
  constructor(
    message: string,
    options: {
      phase?: string;
      adapterName?: string;
      hookName?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_LIFECYCLE_ERROR', {
      context: {
        phase: options.phase,
        adapterName: options.adapterName,
        hookName: options.hookName,
        ...options.context,
      },
      severity: 'high',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterLifecycleError';
  }
}

/**
 * Network/dependency-related adapter errors
 */
export class AdapterDependencyError extends AdapterError {
  constructor(
    message: string,
    options: {
      dependencyName?: string;
      requiredVersion?: string;
      actualVersion?: string;
      operation?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_DEPENDENCY_ERROR', {
      context: {
        dependencyName: options.dependencyName,
        requiredVersion: options.requiredVersion,
        actualVersion: options.actualVersion,
        operation: options.operation,
        ...options.context,
      },
      severity: 'critical',
      recoverable: false,
      cause: options.cause,
    });
    
    this.name = 'AdapterDependencyError';
  }
}

/**
 * Performance/timeout-related adapter errors
 */
export class AdapterPerformanceError extends AdapterError {
  constructor(
    message: string,
    options: {
      operation?: string;
      duration?: number;
      threshold?: number;
      memoryUsage?: number;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'ADAPTER_PERFORMANCE_ERROR', {
      context: {
        operation: options.operation,
        duration: options.duration,
        threshold: options.threshold,
        memoryUsage: options.memoryUsage,
        ...options.context,
      },
      severity: 'medium',
      recoverable: true,
      cause: options.cause,
    });
    
    this.name = 'AdapterPerformanceError';
  }
}

/**
 * Type guard to check if error is an AdapterError
 */
export function isAdapterError(error: unknown): error is AdapterError {
  return error instanceof AdapterError;
}

/**
 * Type guard to check if error is a specific adapter error type
 */
export function isAdapterErrorType<T extends AdapterError>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T
): error is T {
  return error instanceof ErrorClass;
}

/**
 * Extract error code from any error
 */
export function getErrorCode(error: unknown): string {
  if (isAdapterError(error)) {
    return error.code;
  }
  
  if (error instanceof Error) {
    return 'UNKNOWN_ERROR';
  }
  
  return 'INVALID_ERROR';
}

/**
 * Convert any error to AdapterError
 */
export function toAdapterError(
  error: unknown,
  context: Record<string, any> = {}
): AdapterError {
  if (isAdapterError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AdapterError(
      error.message,
      'WRAPPED_ERROR',
      {
        context: {
          originalErrorName: error.name,
          ...context,
        },
        cause: error,
      }
    );
  }
  
  return new AdapterError(
    String(error),
    'UNKNOWN_ERROR',
    { context }
  );
}