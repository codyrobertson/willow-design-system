/**
 * Base Error Class
 * Foundation for all custom errors in the Willow CLI
 */

import { ErrorContext, ErrorMetadata, ErrorCode } from '../types/errors.js';

export abstract class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly timestamp: Date;
  public readonly context?: ErrorContext;
  public readonly metadata?: ErrorMetadata;
  public readonly isOperational: boolean;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      cause?: Error;
      context?: ErrorContext;
      metadata?: ErrorMetadata;
      isOperational?: boolean;
    }
  ) {
    super(message);
    
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.cause = options?.cause;
    this.context = options?.context;
    this.metadata = options?.metadata;
    this.isOperational = options?.isOperational ?? true;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a user-friendly message
   */
  abstract toUserMessage(): string;

  /**
   * Convert error to a log-friendly format
   */
  toLogFormat(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
      context: this.context,
      metadata: this.metadata,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  /**
   * Convert error to JSON format
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      metadata: this.metadata
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return false; // Override in subclasses
  }

  /**
   * Get suggested actions for recovery
   */
  getSuggestedActions(): string[] {
    return []; // Override in subclasses
  }

  /**
   * Create a wrapped error with additional context
   */
  static wrap(
    error: unknown,
    code: ErrorCode,
    message?: string,
    context?: ErrorContext
  ): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    const errorMessage = message || (error instanceof Error ? error.message : String(error));
    const cause = error instanceof Error ? error : undefined;

    // This will be overridden by specific error classes
    return new (this as any)(errorMessage, code, { cause, context });
  }
}