import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  RetryPolicy, 
  DefaultRetryPolicies, 
  RetryContext,
  NetworkStatusDetector 
} from '../RetryPolicy.js';
import { NetworkError, TimeoutError, HTTPError } from '../NetworkError.js';
import { BaseError } from '../../../errors/BaseError.js';
import { ErrorCode } from '../../../types/errors.js';

describe('RetryPolicy', () => {
  describe('Preset Policies', () => {
    it('should create conservative policy with correct settings', () => {
      const policy = RetryPolicy.fromPreset('conservative');
      const config = policy.getConfig();
      
      expect(config.maxAttempts).toBe(3);
      expect(config.initialDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(10000);
      expect(config.backoffStrategy).toBe('exponential');
      expect(config.backoffMultiplier).toBe(2);
      expect(config.jitterFactor).toBe(0.1);
      expect(config.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
    });

    it('should create aggressive policy with correct settings', () => {
      const policy = RetryPolicy.fromPreset('aggressive');
      const config = policy.getConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.initialDelayMs).toBe(100);
      expect(config.maxDelayMs).toBe(30000);
      expect(config.backoffStrategy).toBe('exponential');
      expect(config.backoffMultiplier).toBe(3);
      expect(config.jitterFactor).toBe(0.2);
    });

    it('should create fast policy with correct settings', () => {
      const policy = RetryPolicy.fromPreset('fast');
      const config = policy.getConfig();
      
      expect(config.maxAttempts).toBe(3);
      expect(config.initialDelayMs).toBe(50);
      expect(config.maxDelayMs).toBe(1000);
      expect(config.backoffStrategy).toBe('linear');
      expect(config.attemptTimeout).toBe(5000);
      expect(config.totalTimeout).toBe(10000);
    });

    it('should create none policy that disables retries', () => {
      const policy = RetryPolicy.fromPreset('none');
      const config = policy.getConfig();
      
      expect(config.maxAttempts).toBe(1);
      expect(config.initialDelayMs).toBe(0);
      expect(config.maxDelayMs).toBe(0);
    });
  });

  describe('Backoff Strategies', () => {
    describe('Linear Backoff', () => {
      it('should calculate linear delays', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'linear',
          initialDelayMs: 100,
          jitterFactor: 0
        });
        
        expect(policy.calculateDelay(1)).toBe(100);
        expect(policy.calculateDelay(2)).toBe(200);
        expect(policy.calculateDelay(3)).toBe(300);
      });

      it('should respect max delay', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'linear',
          initialDelayMs: 100,
          maxDelayMs: 250,
          jitterFactor: 0
        });
        
        expect(policy.calculateDelay(1)).toBe(100);
        expect(policy.calculateDelay(2)).toBe(200);
        expect(policy.calculateDelay(3)).toBe(250); // capped
      });
    });

    describe('Exponential Backoff', () => {
      it('should calculate exponential delays', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'exponential',
          initialDelayMs: 100,
          backoffMultiplier: 2,
          jitterFactor: 0
        });
        
        expect(policy.calculateDelay(1)).toBe(100);
        expect(policy.calculateDelay(2)).toBe(200);
        expect(policy.calculateDelay(3)).toBe(400);
        expect(policy.calculateDelay(4)).toBe(800);
      });

      it('should respect max delay', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'exponential',
          initialDelayMs: 100,
          backoffMultiplier: 2,
          maxDelayMs: 500,
          jitterFactor: 0
        });
        
        expect(policy.calculateDelay(1)).toBe(100);
        expect(policy.calculateDelay(2)).toBe(200);
        expect(policy.calculateDelay(3)).toBe(400);
        expect(policy.calculateDelay(4)).toBe(500); // capped
      });

      it('should use custom multiplier', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'exponential',
          initialDelayMs: 100,
          backoffMultiplier: 3,
          jitterFactor: 0
        });
        
        expect(policy.calculateDelay(1)).toBe(100);
        expect(policy.calculateDelay(2)).toBe(300);
        expect(policy.calculateDelay(3)).toBe(900);
      });
    });

    describe('Fibonacci Backoff', () => {
      it('should calculate fibonacci delays', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'fibonacci',
          initialDelayMs: 100,
          jitterFactor: 0
        });
        
        expect(policy.calculateDelay(1)).toBe(100);  // 1 * 100
        expect(policy.calculateDelay(2)).toBe(100);  // 1 * 100
        expect(policy.calculateDelay(3)).toBe(200);  // 2 * 100
        expect(policy.calculateDelay(4)).toBe(300);  // 3 * 100
        expect(policy.calculateDelay(5)).toBe(500);  // 5 * 100
      });
    });

    describe('Custom Backoff', () => {
      it('should use custom backoff function', () => {
        const customBackoff = vi.fn((attempt: number) => attempt * 50);
        const policy = new RetryPolicy({
          backoffStrategy: 'custom',
          customBackoff,
          jitterFactor: 0
        });
        
        expect(policy.calculateDelay(1)).toBe(50);
        expect(policy.calculateDelay(2)).toBe(100);
        expect(customBackoff).toHaveBeenCalledTimes(2);
      });

      it('should throw error if custom function not provided', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'custom',
          jitterFactor: 0
        });
        
        expect(() => policy.calculateDelay(1)).toThrow('Custom backoff function not provided');
      });
    });

    describe('Jitter', () => {
      it('should add jitter to delays', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'linear',
          initialDelayMs: 1000,
          jitterFactor: 0.2
        });
        
        const delay = policy.calculateDelay(1);
        expect(delay).toBeGreaterThanOrEqual(800);  // 1000 - 20%
        expect(delay).toBeLessThanOrEqual(1200);    // 1000 + 20%
      });

      it('should ensure non-negative delays with jitter', () => {
        const policy = new RetryPolicy({
          backoffStrategy: 'linear',
          initialDelayMs: 10,
          jitterFactor: 2 // extreme jitter
        });
        
        // Run multiple times to test randomness
        for (let i = 0; i < 10; i++) {
          const delay = policy.calculateDelay(1);
          expect(delay).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Retry Decision Logic', () => {
    it('should not retry after max attempts', () => {
      const policy = new RetryPolicy({ maxAttempts: 3 });
      const error = new NetworkError('Test error');
      
      const decision = policy.shouldRetry(error, 3);
      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toBe('Max attempts reached');
    });

    it('should retry on retryable HTTP status codes', () => {
      const policy = new RetryPolicy({
        retryableStatusCodes: [503, 429],
        retryableErrorCodes: [] // Clear to test HTTP status logic
      });
      
      const error503 = new HTTPError(503, 'Service Unavailable', {});
      const decision = policy.shouldRetry(error503, 1);
      expect(decision.shouldRetry).toBe(true);
      expect(decision.reason).toContain('HTTP status 503');
    });

    it('should not retry on non-retryable HTTP status codes', () => {
      const policy = new RetryPolicy({
        retryableStatusCodes: [503],
        retryableErrorCodes: [] // Clear to test HTTP status logic
      });
      
      const error404 = new HTTPError(404, 'Not Found', {});
      const decision = policy.shouldRetry(error404, 1);
      expect(decision.shouldRetry).toBe(false);
    });

    it('should retry on retryable error codes', () => {
      const policy = new RetryPolicy({
        retryableErrorCodes: [ErrorCode.RESOURCE_EXHAUSTED, ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT]
      });
      
      class CustomError extends BaseError {
        constructor() {
          super('Resource exhausted', ErrorCode.RESOURCE_EXHAUSTED);
        }
        toUserMessage() { return 'Resource exhausted'; }
        isRetryable() { return true; } // Ensure it's retryable
      }
      
      const error = new CustomError();
      expect(error.code).toBe(ErrorCode.RESOURCE_EXHAUSTED); // Verify error code is set
      const decision = policy.shouldRetry(error, 1);
      expect(decision.shouldRetry).toBe(true);
      expect(decision.reason).toContain('Error code E7002');
    });

    it('should retry on timeout errors', () => {
      const policy = new RetryPolicy();
      const error = new TimeoutError('Request timed out');
      
      const decision = policy.shouldRetry(error, 1);
      expect(decision.shouldRetry).toBe(true);
      // Timeout has error code E3001, which is in default retryable codes
      expect(decision.reason).toContain('Error code E3001');
    });

    it('should not retry non-retryable base errors', () => {
      const policy = new RetryPolicy();
      
      class NonRetryableError extends BaseError {
        isRetryable() { return false; }
        toUserMessage() { return 'Test error'; }
      }
      
      const error = new NonRetryableError('Test error', ErrorCode.VALIDATION_ERROR);
      
      const decision = policy.shouldRetry(error, 1);
      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toBe('Error marked as non-retryable');
    });

    it('should use custom retry condition', () => {
      const retryCondition = vi.fn(() => true);
      const policy = new RetryPolicy({ retryCondition });
      const error = new NetworkError('Test error');
      
      const decision = policy.shouldRetry(error, 1);
      expect(decision.shouldRetry).toBe(true);
      expect(decision.reason).toBe('Custom condition met');
      expect(retryCondition).toHaveBeenCalledWith(error, 1);
    });

    it('should not retry unknown error types by default', () => {
      const policy = new RetryPolicy();
      const error = new Error('Unknown error');
      
      const decision = policy.shouldRetry(error, 1);
      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toBe('Unknown error type');
    });
  });

  describe('Configuration', () => {
    it('should return readonly configuration', () => {
      const policy = new RetryPolicy({
        maxAttempts: 5,
        initialDelayMs: 200
      });
      
      const config = policy.getConfig();
      expect(config.maxAttempts).toBe(5);
      expect(config.initialDelayMs).toBe(200);
      
      // Verify it's a copy
      (config as any).maxAttempts = 10;
      expect(policy.getConfig().maxAttempts).toBe(5);
    });

    it('should use default values for missing config', () => {
      const policy = new RetryPolicy();
      const config = policy.getConfig();
      
      expect(config.maxAttempts).toBe(3);
      expect(config.initialDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(10000);
      expect(config.backoffStrategy).toBe('exponential');
      expect(config.backoffMultiplier).toBe(2);
      expect(config.jitterFactor).toBe(0.1);
    });
  });

  describe('RetryContext', () => {
    let policy: RetryPolicy;
    let context: RetryContext;

    beforeEach(() => {
      policy = new RetryPolicy({ maxAttempts: 3 });
      context = new RetryContext(policy, 'Test operation');
    });

    it('should track attempts', () => {
      expect(context.getAttempt()).toBe(0);
      
      context.recordAttempt();
      expect(context.getAttempt()).toBe(1);
      
      context.recordAttempt(new Error('Test'));
      expect(context.getAttempt()).toBe(2);
    });

    it('should track errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      context.recordAttempt(error1);
      context.recordAttempt(error2);
      
      const stats = context.getStats();
      expect(stats.attempts).toBe(2);
      expect(stats.errors).toHaveLength(2);
      expect(stats.errors[0].error).toBe(error1);
      expect(stats.errors[1].error).toBe(error2);
    });

    it('should delegate retry decisions to policy', () => {
      const error = new NetworkError('Test');
      context.recordAttempt(error);
      
      const decision = context.shouldRetry(error);
      expect(decision.shouldRetry).toBe(true);
      
      // Max out attempts
      context.recordAttempt(error);
      context.recordAttempt(error);
      
      const finalDecision = context.shouldRetry(error);
      expect(finalDecision.shouldRetry).toBe(false);
    });

    it('should enforce total timeout', () => {
      const policyWithTimeout = new RetryPolicy({
        maxAttempts: 10,
        totalTimeout: 100
      });
      const contextWithTimeout = new RetryContext(policyWithTimeout, 'Test');
      
      // Simulate time passing
      vi.useFakeTimers();
      vi.advanceTimersByTime(200);
      
      const decision = contextWithTimeout.shouldRetry(new NetworkError('Test'));
      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toBe('Total timeout exceeded');
      
      vi.useRealTimers();
    });

    it('should provide statistics', () => {
      vi.useFakeTimers();
      const startTime = Date.now();
      
      const error = new Error('Test error');
      context.recordAttempt(error);
      
      vi.advanceTimersByTime(1000);
      
      const stats = context.getStats();
      expect(stats.attempts).toBe(1);
      expect(stats.errors).toHaveLength(1);
      expect(stats.duration).toBeGreaterThanOrEqual(1000);
      expect(stats.duration).toBeLessThanOrEqual(1001); // Allow for small timing variance
      expect(stats.operation).toBe('Test operation');
      
      vi.useRealTimers();
    });
  });

  describe('NetworkStatusDetector', () => {
    let detector: NetworkStatusDetector;

    beforeEach(() => {
      vi.clearAllMocks();
      detector = new NetworkStatusDetector();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should check network availability', async () => {
      // Mock successful DNS resolution
      const mockResolve4 = vi.fn().mockResolvedValue(['8.8.8.8']);
      vi.doMock('dns', () => ({
        promises: { resolve4: mockResolve4 }
      }));
      
      const status = await detector.isNetworkAvailable();
      expect(status).toBe(true);
    });

    it('should detect offline state', async () => {
      // Mock DNS failure
      const mockResolve4 = vi.fn().mockRejectedValue(new Error('DNS failure'));
      vi.doMock('dns', () => ({
        promises: { resolve4: mockResolve4 }
      }));
      
      const status = await detector.isNetworkAvailable();
      expect(status).toBe(false);
    });

    it('should rate limit network checks', async () => {
      vi.useFakeTimers();
      
      // Mock DNS module
      const mockResolve4 = vi.fn().mockResolvedValue(['8.8.8.8']);
      vi.doMock('dns', () => ({
        promises: { resolve4: mockResolve4 }
      }));
      
      // First check
      await detector.isNetworkAvailable();
      expect(mockResolve4).toHaveBeenCalledTimes(1);
      
      // Second check (should use cache)
      await detector.isNetworkAvailable();
      expect(mockResolve4).toHaveBeenCalledTimes(1);
      
      // Advance time past cache interval (5 seconds)
      vi.advanceTimersByTime(6000);
      
      // Third check (should make new request)
      await detector.isNetworkAvailable();
      expect(mockResolve4).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('should allow manual status updates', () => {
      detector.setOnline(false);
      expect(detector.isNetworkAvailable()).resolves.toBe(false);
      
      detector.setOnline(true);
      expect(detector.isNetworkAvailable()).resolves.toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should work with all preset policies', () => {
      const presets = ['conservative', 'aggressive', 'fast', 'none'] as const;
      
      for (const preset of presets) {
        const policy = RetryPolicy.fromPreset(preset);
        expect(policy).toBeInstanceOf(RetryPolicy);
        expect(policy.getConfig()).toBeDefined();
      }
    });

    it('should handle complex retry scenarios', () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        retryableStatusCodes: [503],
        retryableErrorCodes: [ErrorCode.TIMEOUT],
        retryCondition: (error) => {
          // Custom logic: don't retry if message contains "fatal"
          if (error instanceof Error && error.message.includes('fatal')) {
            return false;
          }
          return true;
        }
      });
      
      // Should retry on 503
      const error503 = new HTTPError(503, 'Service Unavailable');
      expect(policy.shouldRetry(error503, 1).shouldRetry).toBe(true);
      
      // Should not retry on "fatal" errors
      const fatalError = new NetworkError('fatal network error');
      expect(policy.shouldRetry(fatalError, 1).shouldRetry).toBe(false);
      
      // Should retry on timeout
      const timeoutError = new TimeoutError('Request timed out');
      expect(policy.shouldRetry(timeoutError, 1).shouldRetry).toBe(true);
    });
  });
});