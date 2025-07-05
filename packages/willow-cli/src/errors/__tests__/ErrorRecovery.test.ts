/**
 * ErrorRecovery Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorRecovery } from '../ErrorRecovery.js';
import { BaseError } from '../BaseError.js';
import { ErrorCode } from '../../types/errors.js';

// Test error class
class TestError extends BaseError {
  constructor(message: string, retryable: boolean = true) {
    super(message, ErrorCode.NETWORK_ERROR, { isOperational: true });
    this._retryable = retryable;
  }
  
  private _retryable: boolean;
  
  toUserMessage(): string {
    return this.message;
  }
  
  isRetryable(): boolean {
    return this._retryable;
  }
}

describe('ErrorRecovery', () => {
  beforeEach(() => {
    // Mock the delay method to make tests instant
    vi.spyOn(ErrorRecovery as any, 'delay').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('withRetry', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new TestError(`Attempt ${attempts} failed`);
        }
        return 'success';
      });

      const result = await ErrorRecovery.withRetry(fn, {
        maxAttempts: 3,
        backoff: 'linear',
        initialDelay: 100
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn(async () => {
        throw new TestError('Non-retryable error', false);
      });

      await expect(
        ErrorRecovery.withRetry(fn, {
          maxAttempts: 3,
          backoff: 'linear',
          initialDelay: 100
        })
      ).rejects.toThrow('Non-retryable error');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 4) {
          throw new TestError(`Attempt ${attempts} failed`);
        }
        return 'success';
      });

      const result = await ErrorRecovery.withRetry(fn, {
        maxAttempts: 4,
        backoff: 'exponential',
        initialDelay: 100,
        maxDelay: 1000
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(4);
      
      // Verify the delay method was called with retries
      const delaySpy = vi.mocked(ErrorRecovery as any).delay;
      expect(delaySpy).toHaveBeenCalledTimes(3); // 3 retries = 3 delays
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attempts = 0;
      
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new TestError(`Attempt ${attempts} failed`);
        }
        return 'success';
      });

      await ErrorRecovery.withRetry(fn, {
        maxAttempts: 3,
        backoff: 'linear',
        initialDelay: 10,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(TestError));
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(TestError));
    });

    it('should respect shouldRetry predicate', async () => {
      const shouldRetry = vi.fn((error: BaseError) => error.message !== 'stop');
      const fn = vi.fn()
        .mockRejectedValueOnce(new TestError('retry'))
        .mockRejectedValueOnce(new TestError('stop'))
        .mockResolvedValueOnce('success');

      await expect(
        ErrorRecovery.withRetry(fn, {
          maxAttempts: 3,
          backoff: 'linear',
          initialDelay: 10,
          shouldRetry
        })
      ).rejects.toThrow('stop');

      expect(fn).toHaveBeenCalledTimes(2);
      expect(shouldRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    it('should complete within timeout', async () => {
      const fn = vi.fn(async () => {
        return 'success';
      });

      const result = await ErrorRecovery.withTimeout(fn, 100);
      expect(result).toBe('success');
    });

    it('should timeout if operation takes too long', async () => {
      // Use real timers for this timeout test
      vi.useRealTimers();
      
      const fn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'success';
      });

      await expect(
        ErrorRecovery.withTimeout(fn, 10)
      ).rejects.toThrow('Operation timed out after 10ms');
    });

    it('should use custom timeout error', async () => {
      // Use real timers for this timeout test
      vi.useRealTimers();
      
      const fn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'success';
      });

      const customError = new TestError('Custom timeout');
      
      await expect(
        ErrorRecovery.withTimeout(fn, 10, customError)
      ).rejects.toThrow(customError);
    });
  });

  describe('withFallback', () => {
    it('should use fallback on error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback = vi.fn().mockResolvedValue('fallback result');

      const result = await ErrorRecovery.withFallback(fn, fallback);

      expect(result).toBe('fallback result');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('should not use fallback on success', async () => {
      const fn = vi.fn().mockResolvedValue('primary result');
      const fallback = vi.fn().mockResolvedValue('fallback result');

      const result = await ErrorRecovery.withFallback(fn, fallback);

      expect(result).toBe('primary result');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should respect shouldFallback predicate', async () => {
      const fn = vi.fn().mockRejectedValue(new TestError('Error', false));
      const fallback = vi.fn().mockResolvedValue('fallback');
      const shouldFallback = (error: BaseError) => error.isRetryable();

      await expect(
        ErrorRecovery.withFallback(fn, fallback, shouldFallback)
      ).rejects.toThrow('Error');

      expect(fallback).not.toHaveBeenCalled();
    });
  });

  describe('createCircuitBreaker', () => {
    it('should allow calls when circuit is closed', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const breaker = ErrorRecovery.createCircuitBreaker(fn, {
        failureThreshold: 3,
        resetTimeout: 1000
      });

      const result = await breaker();
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after threshold failures', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'));
      const onOpen = vi.fn();
      
      const breaker = ErrorRecovery.createCircuitBreaker(fn, {
        failureThreshold: 3,
        resetTimeout: 1000,
        onOpen
      });

      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker()).rejects.toThrow('Failed');
      }

      expect(onOpen).toHaveBeenCalledTimes(1);

      // Circuit should be open now
      await expect(breaker()).rejects.toThrow('Circuit breaker is open');
      expect(fn).toHaveBeenCalledTimes(3); // No additional calls
    });

    it('should reset circuit after timeout', async () => {
      // Mock Date.now before creating the circuit breaker
      const originalDateNow = Date.now;
      let currentTime = originalDateNow();
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue('success');
      
      const onClose = vi.fn();
      
      const breaker = ErrorRecovery.createCircuitBreaker(fn, {
        failureThreshold: 3,
        resetTimeout: 1000,
        onClose
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker()).rejects.toThrow('Failed');
      }

      // Circuit is open
      await expect(breaker()).rejects.toThrow('Circuit breaker is open');

      // Move time forward past reset timeout
      currentTime += 1001;

      // Circuit should be closed now
      const result = await breaker();
      expect(result).toBe('success');
      expect(onClose).toHaveBeenCalledTimes(1);
      
      // Restore Date.now
      vi.mocked(Date.now).mockRestore();
    });
  });

  describe('batchWithRecovery', () => {
    it('should process all items successfully', async () => {
      const items = [1, 2, 3, 4, 5];
      const operation = vi.fn(async (n: number) => n * 2);

      const { results, errors } = await ErrorRecovery.batchWithRecovery(
        items,
        operation,
        { batchSize: 2 }
      );

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(errors).toEqual([]);
      expect(operation).toHaveBeenCalledTimes(5);
    });

    it('should continue on errors by default', async () => {
      const items = [1, 2, 3, 4, 5];
      const operation = vi.fn(async (n: number) => {
        if (n === 3) throw new Error(`Error for ${n}`);
        return n * 2;
      });

      const { results, errors } = await ErrorRecovery.batchWithRecovery(
        items,
        operation,
        { batchSize: 2 }
      );

      expect(results).toEqual([2, 4, 8, 10]);
      expect(errors).toHaveLength(1);
      expect(errors[0].item).toBe(3);
      expect(errors[0].error.message).toBe('Error for 3');
    });

    it('should stop on error when configured', async () => {
      const items = [1, 2, 3, 4, 5];
      const operation = vi.fn(async (n: number) => {
        if (n === 3) throw new Error(`Error for ${n}`);
        return n * 2;
      });

      const { results, errors } = await ErrorRecovery.batchWithRecovery(
        items,
        operation,
        { batchSize: 2, stopOnError: true }
      );

      expect(results).toEqual([2, 4]); // Only first batch
      expect(errors).toHaveLength(1);
      expect(operation).toHaveBeenCalledTimes(4); // All items in first two batches
    });

    it('should call onError callback', async () => {
      const items = [1, 2, 3];
      const operation = vi.fn(async (n: number) => {
        if (n === 2) throw new Error(`Error for ${n}`);
        return n * 2;
      });
      const onError = vi.fn();

      await ErrorRecovery.batchWithRecovery(
        items,
        operation,
        { batchSize: 1, onError }
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(2, expect.any(BaseError));
    });
  });
});