/**
 * Error Middleware
 * Command middleware for consistent error handling
 */

import { Command } from 'commander';
import { BaseError } from './BaseError.js';
import { errorHandler } from './ErrorHandler.js';
import { errorReporter } from './ErrorReporter.js';
import { CommandContext } from '../core/CommandRegistry.js';

export interface ErrorMiddlewareOptions {
  exitOnError?: boolean;
  showStackTrace?: boolean;
  reportErrors?: boolean;
}

/**
 * Error handling middleware for commands
 */
export function errorMiddleware(options: ErrorMiddlewareOptions = {}) {
  return function(command: Command) {
    // Override action to wrap with error handling
    const originalAction = command.action.bind(command);
    
    command.action(async function(...args: any[]) {
      try {
        // Execute original action
        const result = await originalAction(...args);
        
        // Ensure error reporter flushes on success
        if (options.reportErrors) {
          await errorReporter.flush();
        }
        
        return result;
      } catch (error) {
        // Get command context if available
        const context: CommandContext | undefined = args.find(
          arg => arg && typeof arg === 'object' && 'logger' in arg
        );

        // Handle the error
        await errorHandler.handle(error, {
          command: command.name(),
          args: args.slice(0, -1), // Remove options object
          ...context
        });

        // Report error if enabled
        if (options.reportErrors && error instanceof BaseError) {
          await errorReporter.report(error);
          await errorReporter.flush();
        }

        // Exit if configured
        if (options.exitOnError !== false) {
          process.exit(1);
        }
      }
    });

    // Add error event listener
    command.on('error', async (error: Error) => {
      await errorHandler.handle(error, {
        command: command.name(),
        phase: 'parsing'
      });

      if (options.reportErrors && error instanceof BaseError) {
        await errorReporter.report(error);
      }
    });

    // Handle uncaught errors
    if (!process.listenerCount('uncaughtException')) {
      process.on('uncaughtException', async (error: Error) => {
        console.error('\n💥 Uncaught Exception:');
        
        await errorHandler.handle(error, {
          phase: 'uncaught',
          fatal: true
        });

        if (options.reportErrors) {
          const baseError = error instanceof BaseError ? error :
            new (class extends BaseError {
              toUserMessage(): string {
                return 'A fatal error occurred. Please report this issue.';
              }
            })(error.message, 'E9001', {
              cause: error,
              isOperational: false
            });
          
          await errorReporter.report(baseError);
          await errorReporter.flush();
        }

        process.exit(1);
      });
    }

    // Handle unhandled rejections
    if (!process.listenerCount('unhandledRejection')) {
      process.on('unhandledRejection', async (reason: unknown, promise: Promise<any>) => {
        console.error('\n💥 Unhandled Promise Rejection:');
        
        await errorHandler.handle(reason, {
          phase: 'unhandled-rejection',
          fatal: true
        });

        if (options.reportErrors) {
          const error = reason instanceof Error ? reason : new Error(String(reason));
          const baseError = error instanceof BaseError ? error :
            new (class extends BaseError {
              toUserMessage(): string {
                return 'An unhandled error occurred. Please report this issue.';
              }
            })(error.message, 'E9001', {
              cause: error,
              isOperational: false
            });
          
          await errorReporter.report(baseError);
          await errorReporter.flush();
        }

        process.exit(1);
      });
    }

    return command;
  };
}

/**
 * Create error-aware command wrapper
 */
export function createErrorAwareCommand(
  name: string,
  description: string,
  options?: ErrorMiddlewareOptions
): Command {
  const command = new Command(name)
    .description(description);

  // Apply error middleware
  errorMiddleware(options)(command);

  return command;
}

/**
 * Wrap command action with error boundary
 */
export function withErrorBoundary<T extends (...args: any[]) => any>(
  action: T,
  options?: {
    fallback?: () => any;
    onError?: (error: BaseError) => void;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await action(...args);
    } catch (error) {
      const baseError = error instanceof BaseError ? error :
        new (class extends BaseError {
          toUserMessage(): string {
            return this.message;
          }
        })(
          error instanceof Error ? error.message : String(error),
          'E9000',
          { cause: error instanceof Error ? error : undefined }
        );

      // Call error callback if provided
      if (options?.onError) {
        options.onError(baseError);
      }

      // Use fallback if provided
      if (options?.fallback) {
        return options.fallback();
      }

      // Re-throw
      throw baseError;
    }
  }) as T;
}