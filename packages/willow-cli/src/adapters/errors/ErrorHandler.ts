import { AdapterError } from './AdapterError.js';

/**
 * Error handling strategy
 */
export type ErrorHandlingStrategy = 'throw' | 'log' | 'ignore' | 'retry' | 'fallback';

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  strategy: ErrorHandlingStrategy;
  maxRetries?: number;
  retryDelay?: number;
  retryBackoff?: 'linear' | 'exponential';
  fallbackValue?: any;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  shouldRetry?: (error: AdapterError, attempt: number) => boolean;
  onError?: (error: AdapterError, context: ErrorContext) => void;
  onRetry?: (error: AdapterError, attempt: number, context: ErrorContext) => void;
  onFallback?: (error: AdapterError, fallbackValue: any, context: ErrorContext) => void;
}

/**
 * Error context information
 */
export interface ErrorContext {
  operation: string;
  adapterName?: string;
  startTime: number;
  attempt: number;
  metadata: Record<string, any>;
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult<T = any> {
  success: boolean;
  result?: T;
  error?: AdapterError;
  attempts: number;
  duration: number;
  usedFallback: boolean;
}

/**
 * Centralized error handler for adapter operations
 */
export class ErrorHandler {
  private readonly config: Required<ErrorHandlerConfig>;
  private readonly errorCounts: Map<string, number> = new Map();
  private readonly errorHistory: AdapterError[] = [];
  private readonly maxHistorySize = 100;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      strategy: 'throw',
      maxRetries: 3,
      retryDelay: 1000,
      retryBackoff: 'exponential',
      fallbackValue: null,
      logLevel: 'error',
      shouldRetry: this.defaultShouldRetry.bind(this),
      onError: this.defaultOnError.bind(this),
      onRetry: this.defaultOnRetry.bind(this),
      onFallback: this.defaultOnFallback.bind(this),
      ...config,
    };
  }

  /**
   * Handle an error with the configured strategy
   */
  async handle<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorHandlingResult<T>> {
    const fullContext: ErrorContext = {
      operation: 'unknown',
      startTime: Date.now(),
      attempt: 0,
      metadata: {},
      ...context,
    };

    const result: ErrorHandlingResult<T> = {
      success: false,
      attempts: 0,
      duration: 0,
      usedFallback: false,
    };

    let lastError: AdapterError | null = null;

    // Retry loop
    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      fullContext.attempt = attempt;
      result.attempts = attempt;

      try {
        const operationResult = await operation();
        result.success = true;
        result.result = operationResult;
        result.duration = Date.now() - fullContext.startTime;
        return result;
      } catch (error) {
        lastError = this.normalizeError(error);
        this.recordError(lastError);

        // Call error callback (safely)
        try {
          this.config.onError(lastError, fullContext);
        } catch (callbackError) {
          // Ignore errors in callbacks to prevent infinite loops
          console.error('Error in onError callback:', callbackError);
        }

        // Check if we should retry (only for retry strategy)
        if (
          this.config.strategy === 'retry' &&
          attempt <= this.config.maxRetries &&
          this.config.shouldRetry(lastError, attempt)
        ) {
          try {
            this.config.onRetry(lastError, attempt, fullContext);
          } catch (callbackError) {
            console.error('Error in onRetry callback:', callbackError);
          }
          await this.delay(attempt);
          continue;
        }

        // No more retries, apply strategy
        break;
      }
    }

    result.duration = Date.now() - fullContext.startTime;
    result.error = lastError!;

    // Apply error handling strategy
    return await this.applyStrategy(lastError!, fullContext, result);
  }

  /**
   * Handle synchronous operations
   */
  handleSync<T>(
    operation: () => T,
    context: Partial<ErrorContext> = {}
  ): ErrorHandlingResult<T> {
    const fullContext: ErrorContext = {
      operation: 'unknown',
      startTime: Date.now(),
      attempt: 1,
      metadata: {},
      ...context,
    };

    const result: ErrorHandlingResult<T> = {
      success: false,
      attempts: 1,
      duration: 0,
      usedFallback: false,
    };

    try {
      const operationResult = operation();
      result.success = true;
      result.result = operationResult;
      result.duration = Date.now() - fullContext.startTime;
      return result;
    } catch (error) {
      const adapterError = this.normalizeError(error);
      this.recordError(adapterError);
      this.config.onError(adapterError, fullContext);

      result.duration = Date.now() - fullContext.startTime;
      result.error = adapterError;

      return this.applyStrategySync(adapterError, fullContext, result);
    }
  }

  /**
   * Apply the configured error handling strategy (sync version)
   */
  private applyStrategySync<T>(
    error: AdapterError,
    context: ErrorContext,
    result: ErrorHandlingResult<T>
  ): ErrorHandlingResult<T> {
    switch (this.config.strategy) {
      case 'throw':
        throw error;

      case 'log':
        this.logError(error, context);
        return result;

      case 'ignore':
        return result;

      case 'fallback':
        try {
          this.config.onFallback(error, this.config.fallbackValue, context);
        } catch (callbackError) {
          console.error('Error in onFallback callback:', callbackError);
        }
        result.success = true;
        result.result = this.config.fallbackValue;
        result.usedFallback = true;
        return result;

      case 'retry':
        // Retry strategy not supported in sync mode
        return result;

      default:
        throw error;
    }
  }

  /**
   * Apply the configured error handling strategy
   */
  private async applyStrategy<T>(
    error: AdapterError,
    context: ErrorContext,
    result: ErrorHandlingResult<T>
  ): Promise<ErrorHandlingResult<T>> {
    switch (this.config.strategy) {
      case 'throw':
        throw error;

      case 'log':
        this.logError(error, context);
        return result;

      case 'ignore':
        return result;

      case 'fallback':
        try {
          this.config.onFallback(error, this.config.fallbackValue, context);
        } catch (callbackError) {
          console.error('Error in onFallback callback:', callbackError);
        }
        result.success = true;
        result.result = this.config.fallbackValue;
        result.usedFallback = true;
        return result;

      case 'retry':
        // Retry strategy already handled in main loop
        return result;

      default:
        throw error;
    }
  }

  /**
   * Default retry logic
   */
  private defaultShouldRetry(error: AdapterError, attempt: number): boolean {
    // Don't retry non-recoverable errors
    if (!error.recoverable) {
      return false;
    }

    // Don't retry configuration errors
    if (error.code.includes('CONFIGURATION')) {
      return false;
    }

    // Don't retry validation errors
    if (error.code.includes('VALIDATION')) {
      return false;
    }

    // Retry network/dependency errors
    if (error.code.includes('DEPENDENCY') || error.code.includes('NETWORK')) {
      return true;
    }

    // Retry initialization errors
    if (error.code.includes('INITIALIZATION')) {
      return true;
    }

    // Default to retrying recoverable errors
    return error.recoverable;
  }

  /**
   * Default error callback
   */
  private defaultOnError(error: AdapterError, context: ErrorContext): void {
    this.logError(error, context);
  }

  /**
   * Default retry callback
   */
  private defaultOnRetry(
    error: AdapterError,
    attempt: number,
    context: ErrorContext
  ): void {
    console.warn(
      `Retrying ${context.operation} (attempt ${attempt}/${this.config.maxRetries + 1}): ${error.message}`
    );
  }

  /**
   * Default fallback callback
   */
  private defaultOnFallback(
    error: AdapterError,
    fallbackValue: any,
    context: ErrorContext
  ): void {
    console.warn(
      `Using fallback value for ${context.operation}: ${error.message}`
    );
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: AdapterError, context: ErrorContext): void {
    const logMessage = `[${context.operation}] ${error.message}`;
    const logData = {
      error: error.toJSON(),
      context,
    };

    switch (this.config.logLevel) {
      case 'debug':
        console.debug(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'error':
        console.error(logMessage, logData);
        break;
    }
  }

  /**
   * Calculate retry delay with backoff
   */
  private async delay(attempt: number): Promise<void> {
    let delay = this.config.retryDelay;

    if (this.config.retryBackoff === 'exponential') {
      delay = this.config.retryDelay * Math.pow(2, attempt - 1);
    } else if (this.config.retryBackoff === 'linear') {
      delay = this.config.retryDelay * attempt;
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    delay += jitter;

    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Normalize any error to AdapterError
   */
  private normalizeError(error: unknown): AdapterError {
    if (error instanceof AdapterError) {
      return error;
    }

    if (error instanceof Error) {
      return new AdapterError(
        error.message,
        'WRAPPED_ERROR',
        {
          context: { originalErrorName: error.name },
          cause: error,
        }
      );
    }

    return new AdapterError(
      String(error),
      'UNKNOWN_ERROR',
      { context: { originalError: error } }
    );
  }

  /**
   * Record error for statistics and monitoring
   */
  private recordError(error: AdapterError): void {
    // Update error count
    const count = this.errorCounts.get(error.code) || 0;
    this.errorCounts.set(error.code, count + 1);

    // Add to history
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    totalErrors: number;
    errorCounts: Record<string, number>;
    recentErrors: AdapterError[];
  } {
    return {
      totalErrors: this.errorHistory.length,
      errorCounts: Object.fromEntries(this.errorCounts.entries()),
      recentErrors: this.errorHistory.slice(-10),
    };
  }

  /**
   * Clear error history and statistics
   */
  clearStatistics(): void {
    this.errorCounts.clear();
    this.errorHistory.length = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Create a specialized error handler for specific operations
   */
  createSpecializedHandler(
    operationConfig: Partial<ErrorHandlerConfig>
  ): ErrorHandler {
    return new ErrorHandler({
      ...this.config,
      ...operationConfig,
    });
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * Convenience function for handling async operations
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  config?: Partial<ErrorHandlerConfig>
): Promise<ErrorHandlingResult<T>> {
  const handler = config ? new ErrorHandler(config) : globalErrorHandler;
  return handler.handle(operation);
}

/**
 * Convenience function for handling sync operations
 */
export function handleSync<T>(
  operation: () => T,
  config?: Partial<ErrorHandlerConfig>
): ErrorHandlingResult<T> {
  const handler = config ? new ErrorHandler(config) : globalErrorHandler;
  return handler.handleSync(operation);
}

/**
 * Decorator for automatic error handling
 */
export function withErrorHandling(config?: Partial<ErrorHandlerConfig>) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const handler = config ? new ErrorHandler(config) : globalErrorHandler;
      
      const result = await handler.handle(
        () => originalMethod.apply(this, args),
        {
          operation: `${target.constructor.name}.${propertyKey}`,
          metadata: { args },
        }
      );

      if (result.success) {
        return result.result;
      } else {
        throw result.error;
      }
    } as T;

    return descriptor;
  };
}