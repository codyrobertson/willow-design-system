/**
 * Error Utilities
 * Helper functions for error handling
 */

import { BaseError } from './BaseError.js';
import { ValidationError } from './ValidationError.js';
import { NetworkError } from './NetworkError.js';
import { FileSystemError } from './FileSystemError.js';
import { ComponentError } from './ComponentError.js';
import { ConfigurationError } from './ConfigurationError.js';
import { ErrorCode } from '../types/errors.js';

/**
 * Type guard for BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Check if error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (isBaseError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Create appropriate error instance from error code
 */
export function createErrorFromCode(
  code: ErrorCode,
  message: string,
  details?: any
): BaseError {
  // Validation errors
  if (code >= ErrorCode.VALIDATION_ERROR && code <= ErrorCode.OUT_OF_RANGE) {
    return new ValidationError(message, details);
  }

  // File system errors
  if (code >= ErrorCode.FILE_NOT_FOUND && code <= ErrorCode.DISK_FULL) {
    return new FileSystemError(message, details);
  }

  // Network errors
  if (code >= ErrorCode.NETWORK_ERROR && code <= ErrorCode.REGISTRY_UNAVAILABLE) {
    return new NetworkError(message, details);
  }

  // Component errors
  if (code >= ErrorCode.COMPONENT_NOT_FOUND && code <= ErrorCode.COMPONENT_ALREADY_EXISTS) {
    return new ComponentError(message, code, details);
  }

  // Configuration errors
  if (code >= ErrorCode.CONFIG_ERROR && code <= ErrorCode.CONFIG_PARSE_ERROR) {
    return new ConfigurationError(message, code, details);
  }

  // Default to base error
  return new (class extends BaseError {
    toUserMessage(): string {
      return this.message;
    }
  })(message, code);
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (isBaseError(error)) {
    return error.toUserMessage();
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Extract error code safely
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (isBaseError(error)) {
    return error.code;
  }
  
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isBaseError(error)) {
    return error.isRetryable();
  }
  
  // Check for common retryable Node.js errors
  if (error instanceof Error) {
    const code = (error as any).code;
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
    return retryableCodes.includes(code);
  }
  
  return false;
}

/**
 * Aggregate multiple errors
 */
export class AggregateError extends BaseError {
  constructor(
    public readonly errors: BaseError[],
    message?: string
  ) {
    const errorCount = errors.length;
    const defaultMessage = `${errorCount} error${errorCount > 1 ? 's' : ''} occurred`;
    
    super(
      message || defaultMessage,
      ErrorCode.UNKNOWN_ERROR,
      {
        metadata: {
          errorCount,
          errorCodes: errors.map(e => e.code)
        }
      }
    );
  }

  toUserMessage(): string {
    const parts = [
      `Multiple errors occurred (${this.errors.length}):`
    ];

    this.errors.forEach((error, index) => {
      parts.push(`\n${index + 1}. ${error.toUserMessage()}`);
    });

    return parts.join('\n');
  }

  isRetryable(): boolean {
    // Retryable if any error is retryable
    return this.errors.some(e => e.isRetryable());
  }

  getSuggestedActions(): string[] {
    // Collect unique suggestions
    const suggestions = new Set<string>();
    
    this.errors.forEach(error => {
      error.getSuggestedActions().forEach(s => suggestions.add(s));
    });
    
    return Array.from(suggestions);
  }
}

/**
 * Wrap async function with error handling
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorTransformer?: (error: unknown) => BaseError
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorTransformer) {
        throw errorTransformer(error);
      }
      
      if (isBaseError(error)) {
        throw error;
      }
      
      throw new (class extends BaseError {
        toUserMessage(): string {
          return `An unexpected error occurred: ${this.message}`;
        }
      })(
        error instanceof Error ? error.message : String(error),
        ErrorCode.UNKNOWN_ERROR,
        { cause: error instanceof Error ? error : undefined }
      );
    }
  }) as T;
}