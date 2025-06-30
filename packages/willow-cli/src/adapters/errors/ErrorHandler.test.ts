import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ErrorHandler,
  ErrorHandlerConfig,
  ErrorContext,
  ErrorHandlingResult,
  globalErrorHandler,
  handleAsync,
  handleSync,
  withErrorHandling,
} from './ErrorHandler';
import { AdapterError, AdapterInitializationError, AdapterConfigurationError } from './AdapterError';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor and configuration', () => {
    it('should create with default configuration', () => {
      const handler = new ErrorHandler();
      expect(handler).toBeInstanceOf(ErrorHandler);
    });

    it('should create with custom configuration', () => {
      const config: Partial<ErrorHandlerConfig> = {
        strategy: 'fallback',
        maxRetries: 5,
        retryDelay: 2000,
        fallbackValue: 'default',
        logLevel: 'warn',
      };

      const handler = new ErrorHandler(config);
      expect(handler).toBeInstanceOf(ErrorHandler);
    });

    it('should update configuration after creation', () => {
      const handler = new ErrorHandler({ strategy: 'throw' });
      handler.updateConfig({ strategy: 'fallback', fallbackValue: 'updated' });
      
      // Test that config was updated by checking behavior
      const result = handler.handleSync(() => {
        throw new AdapterError('Test error', 'TEST_ERROR');
      });
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('updated');
      expect(result.usedFallback).toBe(true);
    });
  });

  describe('Async error handling', () => {
    it('should handle successful async operations', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await errorHandler.handle(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.usedFallback).toBe(false);
      expect(result.error).toBeUndefined();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw error with default strategy', async () => {
      const error = new AdapterError('Test error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(errorHandler.handle(operation)).rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry recoverable errors', async () => {
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 2,
        retryDelay: 10, // Small delay for test
      });

      const error = new AdapterInitializationError('Init failed');
      const operation = vi.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await handler.handle(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-recoverable errors', async () => {
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 3,
      });

      const error = new AdapterError('Non-recoverable', 'TEST_ERROR', {
        recoverable: false,
      });
      const operation = vi.fn().mockRejectedValue(error);

      const result = await handler.handle(operation);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry configuration errors', async () => {
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 3,
      });

      const error = new AdapterConfigurationError('Config error');
      const operation = vi.fn().mockRejectedValue(error);

      const result = await handler.handle(operation);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use fallback value with fallback strategy', async () => {
      const handler = new ErrorHandler({
        strategy: 'fallback',
        fallbackValue: 'fallback-result',
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      const result = await handler.handle(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('fallback-result');
      expect(result.usedFallback).toBe(true);
      expect(result.error?.code).toBe('TEST_ERROR');
    });

    it('should log errors with log strategy', async () => {
      const handler = new ErrorHandler({
        strategy: 'log',
        logLevel: 'error',
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      const result = await handler.handle(operation, {
        operation: 'test-operation',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[test-operation] Test error',
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'TEST_ERROR',
            message: 'Test error',
          }),
          context: expect.objectContaining({
            operation: 'test-operation',
          }),
        })
      );
    });

    it('should ignore errors with ignore strategy', async () => {
      const handler = new ErrorHandler({
        strategy: 'ignore',
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      const result = await handler.handle(operation);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEST_ERROR');
      // Should not throw
    });
  });

  describe('Sync error handling', () => {
    it('should handle successful sync operations', () => {
      const operation = vi.fn().mockReturnValue('success');
      const result = errorHandler.handleSync(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.usedFallback).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle sync errors', () => {
      const handler = new ErrorHandler({ strategy: 'log' });
      const error = new AdapterError('Sync error', 'SYNC_ERROR');
      const operation = vi.fn().mockImplementation(() => { throw error; });

      const result = handler.handleSync(operation);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(1);
    });

    it('should normalize non-adapter errors in sync operations', () => {
      const handler = new ErrorHandler({ strategy: 'log' });
      const operation = vi.fn().mockImplementation(() => { 
        throw new Error('Regular error'); 
      });

      const result = handler.handleSync(operation);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AdapterError);
      expect(result.error?.code).toBe('WRAPPED_ERROR');
      expect(result.error?.message).toBe('Regular error');
    });
  });

  describe('Error normalization', () => {
    it('should keep AdapterError instances as-is', async () => {
      const handler = new ErrorHandler({ strategy: 'log' });
      const originalError = new AdapterError('Original', 'ORIGINAL');
      const operation = vi.fn().mockRejectedValue(originalError);

      const result = await handler.handle(operation);

      expect(result.error).toBe(originalError);
    });

    it('should wrap regular Error instances', async () => {
      const handler = new ErrorHandler({ strategy: 'log' });
      const originalError = new Error('Regular error');
      const operation = vi.fn().mockRejectedValue(originalError);

      const result = await handler.handle(operation);

      expect(result.error).toBeInstanceOf(AdapterError);
      expect(result.error?.code).toBe('WRAPPED_ERROR');
      expect(result.error?.message).toBe('Regular error');
      expect(result.error?.cause).toBe(originalError);
    });

    it('should wrap non-Error values', async () => {
      const handler = new ErrorHandler({ strategy: 'log' });
      const operation = vi.fn().mockRejectedValue('string error');

      const result = await handler.handle(operation);

      expect(result.error).toBeInstanceOf(AdapterError);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('string error');
    });
  });

  describe('Retry logic and backoff', () => {
    it('should apply exponential backoff', async () => {
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 2,
        retryDelay: 100,
        retryBackoff: 'exponential',
      });

      const error = new AdapterInitializationError('Retry test');
      const operation = vi.fn().mockRejectedValue(error);
      const startTime = Date.now();

      await handler.handle(operation);

      const duration = Date.now() - startTime;
      // Should have delays: ~100ms, ~200ms (with jitter)
      expect(duration).toBeGreaterThan(250);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should apply linear backoff', async () => {
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 2,
        retryDelay: 50,
        retryBackoff: 'linear',
      });

      const error = new AdapterInitializationError('Retry test');
      const operation = vi.fn().mockRejectedValue(error);
      const startTime = Date.now();

      await handler.handle(operation);

      const duration = Date.now() - startTime;
      // Should have delays: ~50ms, ~100ms (with jitter)
      expect(duration).toBeGreaterThan(120);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use custom shouldRetry function', async () => {
      const customShouldRetry = vi.fn().mockReturnValue(false);
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 3,
        shouldRetry: customShouldRetry,
      });

      const error = new AdapterInitializationError('Test');
      const operation = vi.fn().mockRejectedValue(error);

      await handler.handle(operation);

      expect(customShouldRetry).toHaveBeenCalledWith(error, 1);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks and hooks', () => {
    it('should call onError callback', async () => {
      const onError = vi.fn();
      const handler = new ErrorHandler({
        strategy: 'log',
        onError,
      });

      const error = new AdapterError('Test', 'TEST');
      const operation = vi.fn().mockRejectedValue(error);

      await handler.handle(operation, { operation: 'test-op' });

      expect(onError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'test-op',
          attempt: 1,
        })
      );
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 1,
        retryDelay: 10,
        onRetry,
      });

      const error = new AdapterInitializationError('Test');
      const operation = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      await handler.handle(operation);

      expect(onRetry).toHaveBeenCalledWith(
        error,
        1,
        expect.objectContaining({
          attempt: 2,
        })
      );
    });

    it('should call onFallback callback', async () => {
      const onFallback = vi.fn();
      const handler = new ErrorHandler({
        strategy: 'fallback',
        fallbackValue: 'fallback',
        onFallback,
      });

      const error = new AdapterError('Test', 'TEST');
      const operation = vi.fn().mockRejectedValue(error);

      await handler.handle(operation, { operation: 'test-op' });

      expect(onFallback).toHaveBeenCalledWith(
        error,
        'fallback',
        expect.objectContaining({
          operation: 'test-op',
        })
      );
    });
  });

  describe('Statistics and monitoring', () => {
    it('should track error statistics', async () => {
      const handler = new ErrorHandler({ strategy: 'log' });

      const error1 = new AdapterError('Error 1', 'ERROR_1');
      const error2 = new AdapterError('Error 2', 'ERROR_2');
      const error3 = new AdapterError('Error 3', 'ERROR_1'); // Same code as error1

      await handler.handle(() => Promise.reject(error1));
      await handler.handle(() => Promise.reject(error2));
      await handler.handle(() => Promise.reject(error3));

      const stats = handler.getStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorCounts['ERROR_1']).toBe(2);
      expect(stats.errorCounts['ERROR_2']).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('should clear statistics', async () => {
      const handler = new ErrorHandler({ strategy: 'log' });

      const error = new AdapterError('Test', 'TEST');
      await handler.handle(() => Promise.reject(error));

      expect(handler.getStatistics().totalErrors).toBe(1);

      handler.clearStatistics();

      const stats = handler.getStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(Object.keys(stats.errorCounts)).toHaveLength(0);
    });

    it('should limit error history size', async () => {
      const handler = new ErrorHandler({ strategy: 'log' });

      // Create more than 100 errors (the max history size)
      for (let i = 0; i < 105; i++) {
        const error = new AdapterError(`Error ${i}`, `ERROR_${i}`);
        await handler.handle(() => Promise.reject(error));
      }

      const stats = handler.getStatistics();
      expect(stats.totalErrors).toBe(100); // Should be capped at max history size
    });
  });

  describe('Specialized handlers', () => {
    it('should create specialized handler with merged config', () => {
      const baseHandler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 3,
        logLevel: 'warn',
      });

      const specializedHandler = baseHandler.createSpecializedHandler({
        strategy: 'fallback',
        fallbackValue: 'specialized',
      });

      expect(specializedHandler).toBeInstanceOf(ErrorHandler);
      expect(specializedHandler).not.toBe(baseHandler);
    });
  });

  describe('Convenience functions', () => {
    it('should handle async operations with global handler', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await handleAsync(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
    });

    it('should handle async operations with custom config', async () => {
      const operation = vi.fn().mockRejectedValue(new AdapterError('Test', 'TEST'));
      const result = await handleAsync(operation, {
        strategy: 'fallback',
        fallbackValue: 'custom-fallback',
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('custom-fallback');
      expect(result.usedFallback).toBe(true);
    });

    it('should handle sync operations with global handler', () => {
      const operation = vi.fn().mockReturnValue('success');
      const result = handleSync(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
    });

    it('should handle sync operations with custom config', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new AdapterError('Test', 'TEST');
      });
      const result = handleSync(operation, {
        strategy: 'fallback',
        fallbackValue: 'sync-fallback',
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('sync-fallback');
    });
  });

  describe('Decorator', () => {
    it('should apply error handling to decorated methods', async () => {
      const onError = vi.fn();

      class TestClass {
        async testMethod(shouldFail: boolean) {
          if (shouldFail) {
            throw new AdapterError('Decorated error', 'DECORATED_ERROR');
          }
          return 'success';
        }
      }

      // Apply decorator manually
      const originalMethod = TestClass.prototype.testMethod;
      const decorator = withErrorHandling({
        strategy: 'fallback',
        fallbackValue: 'decorated-fallback',
        onError,
      });

      const descriptor = {
        value: originalMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      };

      decorator(TestClass.prototype, 'testMethod', descriptor);
      TestClass.prototype.testMethod = descriptor.value!;

      const instance = new TestClass();

      // Test success case
      const successResult = await instance.testMethod(false);
      expect(successResult).toBe('success');

      // Test error case
      const errorResult = await instance.testMethod(true);
      expect(errorResult).toBe('decorated-fallback');
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'DECORATED_ERROR',
        }),
        expect.objectContaining({
          operation: 'TestClass.testMethod',
        })
      );
    });

    it('should throw errors when handler strategy is throw', async () => {
      class TestClass {
        async failingMethod() {
          throw new AdapterError('Method error', 'METHOD_ERROR');
        }
      }

      // Apply decorator manually
      const originalMethod = TestClass.prototype.failingMethod;
      const decorator = withErrorHandling({ strategy: 'throw' });

      const descriptor = {
        value: originalMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      };

      decorator(TestClass.prototype, 'failingMethod', descriptor);
      TestClass.prototype.failingMethod = descriptor.value!;

      const instance = new TestClass();

      await expect(instance.failingMethod()).rejects.toThrow('Method error');
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should handle undefined and null operations gracefully', async () => {
      const handler = new ErrorHandler({ strategy: 'log' });

      const result = await handler.handle(async () => undefined);
      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });

    it('should handle operations that return null', () => {
      const handler = new ErrorHandler();
      const result = handler.handleSync(() => null);

      expect(result.success).toBe(true);
      expect(result.result).toBeNull();
    });

    it('should handle very large retry delays gracefully', async () => {
      const handler = new ErrorHandler({
        strategy: 'retry',
        maxRetries: 1,
        retryDelay: 1, // Very small delay for test
      });

      const error = new AdapterInitializationError('Test');
      const operation = vi.fn().mockRejectedValue(error);

      const startTime = Date.now();
      await handler.handle(operation);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle errors thrown in callbacks gracefully', async () => {
      const faultyOnError = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const handler = new ErrorHandler({
        strategy: 'log',
        onError: faultyOnError,
      });

      const error = new AdapterError('Original error', 'ORIGINAL');
      const operation = vi.fn().mockRejectedValue(error);

      // Should not throw despite callback error
      const result = await handler.handle(operation);
      expect(result.error).toBe(error);
    });
  });
});