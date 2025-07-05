/**
 * Error Recovery
 * Implements retry logic and recovery strategies
 */

import { BaseError } from './BaseError.js';
import { ErrorRecoveryStrategy, ErrorCode } from '../types/errors.js';

export interface RetryOptions {
  maxAttempts: number;
  backoff: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: BaseError) => void;
  shouldRetry?: (error: BaseError) => boolean;
}

export class ErrorRecovery {
  /**
   * Execute a function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: BaseError | undefined;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof BaseError ? error : 
                   new (class extends BaseError {
                     toUserMessage(): string {
                       return this.message;
                     }
                   })(
                     error instanceof Error ? error.message : String(error),
                     ErrorCode.UNKNOWN_ERROR,
                     { cause: error instanceof Error ? error : undefined }
                   );

        // Check if we should retry
        if (options.shouldRetry && !options.shouldRetry(lastError)) {
          throw lastError;
        }

        // Don't retry if not retryable
        if (!lastError.isRetryable()) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === options.maxAttempts) {
          throw lastError;
        }

        // Calculate delay
        const delay = this.calculateDelay(
          attempt,
          options.initialDelay,
          options.backoff,
          options.maxDelay
        );

        // Notify retry
        if (options.onRetry) {
          options.onRetry(attempt, lastError);
        }

        // Wait before retry
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute with timeout
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutError?: BaseError
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(timeoutError || new (class extends BaseError {
          toUserMessage(): string {
            return `The operation took too long and was cancelled after ${Math.round(timeoutMs / 1000)} seconds`;
          }
        })(
          `Operation timed out after ${timeoutMs}ms`,
          ErrorCode.TIMEOUT
        ));
      }, timeoutMs);
    });

    return Promise.race([fn(), timeoutPromise]);
  }

  /**
   * Execute with fallback
   */
  static async withFallback<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>,
    shouldFallback?: (error: BaseError) => boolean
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const baseError = error instanceof BaseError ? error :
                       new (class extends BaseError {
                         toUserMessage(): string {
                           return this.message;
                         }
                       })(
                         error instanceof Error ? error.message : String(error),
                         ErrorCode.UNKNOWN_ERROR
                       );

      if (shouldFallback && !shouldFallback(baseError)) {
        throw error;
      }

      return fallback();
    }
  }

  /**
   * Execute with circuit breaker pattern
   */
  static createCircuitBreaker<T>(
    fn: () => Promise<T>,
    options: {
      failureThreshold: number;
      resetTimeout: number;
      onOpen?: () => void;
      onClose?: () => void;
    }
  ): () => Promise<T> {
    let failures = 0;
    let lastFailureTime = 0;
    let isOpen = false;

    return async () => {
      // Check if circuit should be reset
      if (isOpen && Date.now() - lastFailureTime > options.resetTimeout) {
        isOpen = false;
        failures = 0;
        if (options.onClose) {
          options.onClose();
        }
      }

      // If circuit is open, fail fast
      if (isOpen) {
        throw new (class extends BaseError {
          toUserMessage(): string {
            return 'Service is temporarily unavailable. Please try again later.';
          }
          
          isRetryable(): boolean {
            return true;
          }
        })(
          'Circuit breaker is open - service temporarily unavailable',
          ErrorCode.RESOURCE_EXHAUSTED
        );
      }

      try {
        const result = await fn();
        
        // Reset on success
        if (failures > 0) {
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        // Open circuit if threshold reached
        if (failures >= options.failureThreshold) {
          isOpen = true;
          if (options.onOpen) {
            options.onOpen();
          }
        }

        throw error;
      }
    };
  }

  /**
   * Batch operations with error handling
   */
  static async batchWithRecovery<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: {
      batchSize: number;
      stopOnError?: boolean;
      onError?: (item: T, error: BaseError) => void;
    }
  ): Promise<{ results: R[], errors: Array<{ item: T, error: BaseError }> }> {
    const results: R[] = [];
    const errors: Array<{ item: T, error: BaseError }> = [];

    for (let i = 0; i < items.length; i += options.batchSize) {
      const batch = items.slice(i, i + options.batchSize);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await operation(item);
          return { success: true as const, result, item };
        } catch (error) {
          const baseError = error instanceof BaseError ? error :
                           new (class extends BaseError {
                             toUserMessage(): string {
                               return this.message;
                             }
                           })(
                             error instanceof Error ? error.message : String(error),
                             ErrorCode.UNKNOWN_ERROR
                           );
          
          return { success: false as const, error: baseError, item };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.success) {
          results.push(result.result);
        } else {
          errors.push({ item: result.item, error: result.error });
          
          if (options.onError) {
            options.onError(result.item, result.error);
          }

          if (options.stopOnError) {
            return { results, errors };
          }
        }
      }
    }

    return { results, errors };
  }

  /**
   * Calculate retry delay
   */
  private static calculateDelay(
    attempt: number,
    initialDelay: number,
    backoff: 'linear' | 'exponential',
    maxDelay?: number
  ): number {
    let delay: number;
    
    if (backoff === 'exponential') {
      delay = initialDelay * Math.pow(2, attempt - 1);
    } else {
      delay = initialDelay * attempt;
    }

    // Add jitter to prevent thundering herd
    delay += Math.random() * 1000;

    // Cap at max delay
    if (maxDelay) {
      delay = Math.min(delay, maxDelay);
    }

    return delay;
  }

  /**
   * Delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}