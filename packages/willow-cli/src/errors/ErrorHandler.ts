/**
 * Error Handler
 * Central error handling and recovery system
 */

import { BaseError } from './BaseError.js';
import { ErrorReport, ErrorRecoveryStrategy, ErrorCode } from '../types/errors.js';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';

export interface ErrorLogger {
  error(message: string, data?: any): void;
}

export interface ErrorHandlerOptions {
  logger?: ErrorLogger;
  exitOnError?: boolean;
  showStackTrace?: boolean;
  enableRecovery?: boolean;
}

export class ErrorHandler {
  private readonly options: Required<ErrorHandlerOptions>;
  private readonly recoveryStrategies = new Map<ErrorCode, ErrorRecoveryStrategy>();
  private readonly errorListeners: Array<(error: BaseError) => void> = [];

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      logger: options.logger || console,
      exitOnError: options.exitOnError ?? true,
      showStackTrace: options.showStackTrace ?? (process.env.NODE_ENV === 'development'),
      enableRecovery: options.enableRecovery ?? true
    };

    this.setupDefaultRecoveryStrategies();
  }

  /**
   * Handle an error with appropriate formatting and recovery
   */
  async handle(error: unknown, context?: Record<string, any>): Promise<void> {
    const baseError = this.normalizeError(error, context);
    
    // Notify listeners
    this.errorListeners.forEach(listener => listener(baseError));

    // Log error details
    this.logError(baseError);

    // Display user-friendly message
    this.displayError(baseError);

    // Attempt recovery if enabled
    if (this.options.enableRecovery && baseError.isOperational) {
      const recovered = await this.attemptRecovery(baseError);
      if (recovered) {
        return;
      }
    }

    // Exit if configured
    if (this.options.exitOnError && !baseError.isOperational) {
      process.exit(1);
    }
  }

  /**
   * Normalize any error to BaseError
   */
  private normalizeError(error: unknown, context?: Record<string, any>): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    // Handle Node.js errors
    if (error instanceof Error) {
      if ((error as any).code === 'ENOENT') {
        const { FileSystemError } = require('./FileSystemError.js');
        return FileSystemError.fromNodeError(error as NodeJS.ErrnoException);
      }

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        const { ValidationError } = require('./ValidationError.js');
        return ValidationError.fromZodError(error, context);
      }
    }

    // Create generic error
    const message = error instanceof Error ? error.message : String(error);
    return new (class extends BaseError {
      toUserMessage(): string {
        return `An unexpected error occurred: ${this.message}`;
      }
    })(message, ErrorCode.UNKNOWN_ERROR, {
      cause: error instanceof Error ? error : undefined,
      context
    });
  }

  /**
   * Log error details
   */
  private logError(error: BaseError): void {
    const logData = error.toLogFormat();
    
    // Log to file or external service
    this.options.logger.error('Error occurred', logData);

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', JSON.stringify(logData, null, 2));
    }
  }

  /**
   * Display error to user
   */
  private displayError(error: BaseError): void {
    console.error('\n' + error.toUserMessage());

    if (this.options.showStackTrace && error.stack) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }

    if (error.cause && this.options.showStackTrace) {
      console.error(chalk.gray('\nCaused by:'));
      console.error(chalk.gray(error.cause.stack || error.cause.toString()));
    }
  }

  /**
   * Attempt to recover from error
   */
  private async attemptRecovery(error: BaseError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.code);
    if (!strategy) {
      return false;
    }

    try {
      // Show notification if configured
      if (strategy.notification) {
        const icon = strategy.notification.level === 'error' ? '✖' :
                    strategy.notification.level === 'warn' ? '⚠' : 'ℹ';
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(`\n${icon} ${strategy.notification.message}`));
      }

      // Attempt retry if configured
      if (strategy.retry && error.isRetryable()) {
        // eslint-disable-next-line no-console
        console.log(chalk.cyan('\n🔄 Attempting to retry...'));
        // Retry logic would be implemented by the command
        return false; // Let command handle retry
      }

      // Execute fallback if available
      if (strategy.fallback) {
        // eslint-disable-next-line no-console
        console.log(chalk.cyan('\n📌 Executing fallback strategy...'));
        await strategy.fallback();
        return true;
      }

      // Cleanup if needed
      if (strategy.cleanup) {
        await strategy.cleanup();
      }

      return false;
    } catch (recoveryError) {
      console.error(chalk.red('\n✖ Recovery failed:'), recoveryError);
      return false;
    }
  }

  /**
   * Register a recovery strategy for an error code
   */
  registerRecoveryStrategy(code: ErrorCode, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(code, strategy);
  }

  /**
   * Add error listener
   */
  onError(listener: (error: BaseError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Create error report
   */
  createReport(error: BaseError): ErrorReport {
    return {
      error: {
        code: error.code,
        message: error.message,
        userMessage: error.toUserMessage(),
        timestamp: error.timestamp.toISOString()
      },
      context: error.context,
      metadata: error.metadata,
      suggestions: error.getSuggestedActions(),
      isRetryable: error.isRetryable()
    };
  }

  /**
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // Network errors - retry with exponential backoff
    this.registerRecoveryStrategy(ErrorCode.NETWORK_ERROR, {
      retry: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000
      },
      notification: {
        level: 'warn',
        message: 'Network error detected. Retrying...'
      }
    });

    // Timeout errors - retry with longer timeout
    this.registerRecoveryStrategy(ErrorCode.TIMEOUT, {
      retry: {
        maxAttempts: 2,
        backoff: 'linear',
        initialDelay: 2000
      },
      notification: {
        level: 'warn',
        message: 'Request timed out. Retrying with longer timeout...'
      }
    });

    // Registry unavailable - use cached data
    this.registerRecoveryStrategy(ErrorCode.REGISTRY_UNAVAILABLE, {
      fallback: async () => {
        // eslint-disable-next-line no-console
        console.log('Using cached component data...');
        // Implementation would use cached registry data
      },
      notification: {
        level: 'info',
        message: 'Registry is unavailable. Using cached data.'
      }
    });

    // Missing config - create default
    this.registerRecoveryStrategy(ErrorCode.MISSING_CONFIG, {
      fallback: async () => {
        // eslint-disable-next-line no-console
        console.log('Creating default configuration...');
        // Implementation would create default config
      },
      notification: {
        level: 'info',
        message: 'No configuration found. Creating defaults.'
      }
    });
  }

  /**
   * Create a scoped error handler with context
   */
  scoped(context: Record<string, any>): ScopedErrorHandler {
    return new ScopedErrorHandler(this, context);
  }
}

/**
 * Scoped error handler with pre-set context
 */
export class ScopedErrorHandler {
  constructor(
    private readonly handler: ErrorHandler,
    private readonly context: Record<string, any>
  ) {}

  async handle(error: unknown): Promise<void> {
    return this.handler.handle(error, this.context);
  }

  wrap<T>(fn: () => T | Promise<T>): Promise<T> {
    return Promise.resolve()
      .then(() => fn())
      .catch(error => {
        this.handle(error);
        throw error;
      });
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();