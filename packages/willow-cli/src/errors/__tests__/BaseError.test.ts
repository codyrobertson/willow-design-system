/**
 * BaseError Tests
 */

import { describe, it, expect } from 'vitest';
import { BaseError } from '../BaseError.js';
import { ErrorCode } from '../../types/errors.js';

// Create concrete implementation for testing
class TestError extends BaseError {
  toUserMessage(): string {
    return `Test Error: ${this.message}`;
  }
  
  isRetryable(): boolean {
    return this.code === ErrorCode.NETWORK_ERROR;
  }
  
  getSuggestedActions(): string[] {
    return ['Try again', 'Check your connection'];
  }
}

describe('BaseError', () => {
  it('should create error with required properties', () => {
    const error = new TestError('Test message', ErrorCode.VALIDATION_ERROR);
    
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.name).toBe('TestError');
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.isOperational).toBe(true);
  });

  it('should accept optional properties', () => {
    const cause = new Error('Original error');
    const context = { command: 'test', path: '/test' };
    const metadata = { attempts: 3, duration: 1000 };
    
    const error = new TestError('Test message', ErrorCode.NETWORK_ERROR, {
      cause,
      context,
      metadata,
      isOperational: false
    });
    
    expect(error.cause).toBe(cause);
    expect(error.context).toEqual(context);
    expect(error.metadata).toEqual(metadata);
    expect(error.isOperational).toBe(false);
  });

  it('should capture stack trace', () => {
    const error = new TestError('Test message', ErrorCode.UNKNOWN_ERROR);
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('TestError');
    expect(error.stack).toContain('Test message');
  });

  it('should convert to log format', () => {
    const cause = new Error('Original error');
    const error = new TestError('Test message', ErrorCode.VALIDATION_ERROR, {
      cause,
      context: { command: 'test' },
      metadata: { field: 'name' }
    });
    
    const logFormat = error.toLogFormat();
    
    expect(logFormat).toMatchObject({
      name: 'TestError',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Test message',
      isOperational: true,
      context: { command: 'test' },
      metadata: { field: 'name' }
    });
    
    expect(logFormat.timestamp).toBeDefined();
    expect(logFormat.stack).toBeDefined();
    expect(logFormat.cause).toMatchObject({
      name: 'Error',
      message: 'Original error'
    });
  });

  it('should convert to JSON format', () => {
    const error = new TestError('Test message', ErrorCode.COMPONENT_NOT_FOUND, {
      context: { component: 'button' }
    });
    
    const json = error.toJSON();
    
    expect(json).toMatchObject({
      name: 'TestError',
      code: ErrorCode.COMPONENT_NOT_FOUND,
      message: 'Test message',
      context: { component: 'button' }
    });
    
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeUndefined(); // Stack not included in JSON
  });

  it('should implement abstract methods', () => {
    const error = new TestError('Test message', ErrorCode.NETWORK_ERROR);
    
    expect(error.toUserMessage()).toBe('Test Error: Test message');
    expect(error.isRetryable()).toBe(true);
    expect(error.getSuggestedActions()).toEqual(['Try again', 'Check your connection']);
  });

  it('should wrap errors', () => {
    const originalError = new Error('Original error');
    const wrapped = TestError.wrap(
      originalError,
      ErrorCode.UNKNOWN_ERROR,
      'Wrapped error message',
      { operation: 'test' }
    );
    
    expect(wrapped).toBeInstanceOf(TestError);
    expect(wrapped.message).toBe('Wrapped error message');
    expect(wrapped.cause).toBe(originalError);
    expect(wrapped.context).toEqual({ operation: 'test' });
  });

  it('should not double-wrap BaseError instances', () => {
    const error = new TestError('Test message', ErrorCode.VALIDATION_ERROR);
    const wrapped = TestError.wrap(error, ErrorCode.UNKNOWN_ERROR);
    
    expect(wrapped).toBe(error); // Same instance
  });
});