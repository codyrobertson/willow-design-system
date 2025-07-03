/**
 * Circuit Breaker Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CircuitBreaker, CircuitBreakerFactory, CircuitState, CircuitBreakerError } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.clearAllMocks();
    
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      resetTimeout: 50, // Shorter timeout for tests
      rollingWindow: 100, // Shorter window for tests
      name: 'test-breaker'
    });
  });

  afterEach(() => {
    // Clean up
  });

  describe('Initial State', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.isOpen()).toBe(false);
    });

    it('should have correct initial stats', () => {
      const stats = breaker.getStats();
      
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.rejectedRequests).toBe(0);
    });
  });

  describe('Success Handling', () => {
    it('should execute successful functions', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await breaker.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should track successful executions', async () => {
      await breaker.execute(() => Promise.resolve());
      
      const stats = breaker.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successes).toBe(0); // Only tracked in half-open state
      expect(stats.lastSuccessTime).toBeDefined();
    });

    it('should emit success event', async () => {
      const successHandler = vi.fn();
      breaker.on('success', successHandler);
      
      await breaker.execute(() => Promise.resolve());
      
      expect(successHandler).toHaveBeenCalledWith(expect.objectContaining({
        state: CircuitState.CLOSED
      }));
    });
  });

  describe('Failure Handling', () => {
    it('should track failures', async () => {
      const error = new Error('Test error');
      
      await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow(error);
      
      const stats = breaker.getStats();
      expect(stats.failures).toBe(1);
      expect(stats.lastFailureTime).toBeDefined();
    });

    it('should open circuit after threshold', async () => {
      const error = new Error('Test error');
      const fn = () => Promise.reject(error);
      
      // Fail 3 times to reach threshold
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow(error);
      }
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.isOpen()).toBe(true);
    });

    it('should emit state change events', async () => {
      const stateChangeHandler = vi.fn();
      const openHandler = vi.fn();
      
      breaker.on('stateChange', stateChangeHandler);
      breaker.on('open', openHandler);
      
      const error = new Error('Test error');
      const fn = () => Promise.reject(error);
      
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }
      
      expect(stateChangeHandler).toHaveBeenCalledWith({
        from: CircuitState.CLOSED,
        to: CircuitState.OPEN,
        stats: expect.any(Object)
      });
      expect(openHandler).toHaveBeenCalled();
    });

    it('should use custom failure predicate', async () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 2,
        successThreshold: 1,
        resetTimeout: 100,
        isFailure: (error) => {
          if (error instanceof Error) {
            return error.message.includes('critical');
          }
          return true;
        }
      });
      
      // Non-critical error - should not count as failure
      await expect(customBreaker.execute(() => 
        Promise.reject(new Error('Non-critical error'))
      )).rejects.toThrow();
      
      expect(customBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Critical errors - should count as failures
      for (let i = 0; i < 2; i++) {
        await expect(customBreaker.execute(() => 
          Promise.reject(new Error('critical system error'))
        )).rejects.toThrow();
      }
      
      expect(customBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Open State', () => {
    beforeEach(async () => {
      // Open the circuit
      const error = new Error('Test error');
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow();
      }
    });

    it('should reject requests when open', async () => {
      await expect(breaker.execute(() => Promise.resolve()))
        .rejects.toThrow(CircuitBreakerError);
    });

    it('should track rejected requests', async () => {
      await expect(breaker.execute(() => Promise.resolve())).rejects.toThrow();
      
      const stats = breaker.getStats();
      expect(stats.rejectedRequests).toBe(1);
    });

    it('should emit rejected event', async () => {
      const rejectedHandler = vi.fn();
      breaker.on('rejected', rejectedHandler);
      
      await expect(breaker.execute(() => Promise.resolve())).rejects.toThrow();
      
      expect(rejectedHandler).toHaveBeenCalledWith(expect.objectContaining({
        state: CircuitState.OPEN
      }));
    });

    it('should transition to half-open after timeout', async () => {
      const halfOpenHandler = vi.fn();
      breaker.on('halfOpen', halfOpenHandler);
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(halfOpenHandler).toHaveBeenCalled();
    }, 1000);
  });

  describe('Half-Open State', () => {
    beforeEach(async () => {
      // Open the circuit
      const error = new Error('Test error');
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow();
      }
      
      // Transition to half-open
      await new Promise(resolve => setTimeout(resolve, 60));
    });

    it('should allow test requests', async () => {
      const result = await breaker.execute(() => Promise.resolve('test'));
      expect(result).toBe('test');
    });

    it('should close after success threshold', async () => {
      const closeHandler = vi.fn();
      breaker.on('close', closeHandler);
      
      // Need 2 successes to close
      await breaker.execute(() => Promise.resolve());
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      await breaker.execute(() => Promise.resolve());
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(closeHandler).toHaveBeenCalled();
    });

    it('should reopen on failure', async () => {
      const error = new Error('Test error');
      
      await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow();
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Rolling Window', () => {
    it('should remove old failures from window', async () => {
      const error = new Error('Test error');
      
      // Add 2 failures
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow();
      }
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      
      // Wait past rolling window
      await new Promise(resolve => setTimeout(resolve, 110));
      
      // Add one more failure - should not open (old failures expired)
      await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow();
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Manual Controls', () => {
    it('should allow manual trip', () => {
      breaker.trip();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should allow manual reset', async () => {
      // Open the circuit
      const error = new Error('Test error');
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(() => Promise.reject(error))).rejects.toThrow();
      }
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      
      breaker.reset();
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getStats().failures).toBe(0);
      expect(breaker.getStats().successes).toBe(0);
    });
  });

  describe('protect method', () => {
    it('should work with synchronous functions', async () => {
      const result = await breaker.protect(() => 'sync result');
      expect(result).toBe('sync result');
    });

    it('should work with async functions', async () => {
      const result = await breaker.protect(async () => 'async result');
      expect(result).toBe('async result');
    });
  });
});

describe('CircuitBreakerError', () => {
  it('should create proper error', () => {
    const error = new CircuitBreakerError('my-circuit', CircuitState.OPEN);
    
    expect(error.message).toContain('my-circuit');
    expect(error.message).toContain('OPEN');
    expect(error.isRetryable()).toBe(true);
    expect(error.toUserMessage()).toContain('temporarily unavailable');
  });
});

describe('CircuitBreakerFactory', () => {
  beforeEach(() => {
    // Clear all instances
    CircuitBreakerFactory.getAllInstances().forEach((_, name) => {
      CircuitBreakerFactory.removeInstance(name);
    });
  });

  it('should create and retrieve instances', () => {
    const options = {
      failureThreshold: 5,
      successThreshold: 2,
      resetTimeout: 1000
    };
    
    const instance1 = CircuitBreakerFactory.getInstance('test', options);
    const instance2 = CircuitBreakerFactory.getInstance('test');
    
    expect(instance1).toBe(instance2);
  });

  it('should throw when instance not found without options', () => {
    expect(() => CircuitBreakerFactory.getInstance('unknown'))
      .toThrow('not found');
  });

  it('should remove instances', () => {
    const instance = CircuitBreakerFactory.getInstance('test', {
      failureThreshold: 5,
      successThreshold: 2,
      resetTimeout: 1000
    });
    
    CircuitBreakerFactory.removeInstance('test');
    
    expect(() => CircuitBreakerFactory.getInstance('test'))
      .toThrow();
  });

  it('should get all instances', () => {
    CircuitBreakerFactory.getInstance('breaker1', {
      failureThreshold: 5,
      successThreshold: 2,
      resetTimeout: 1000
    });
    
    CircuitBreakerFactory.getInstance('breaker2', {
      failureThreshold: 3,
      successThreshold: 1,
      resetTimeout: 50
    });
    
    const instances = CircuitBreakerFactory.getAllInstances();
    expect(instances.size).toBe(2);
    expect(instances.has('breaker1')).toBe(true);
    expect(instances.has('breaker2')).toBe(true);
  });

  it('should reset all breakers', () => {
    const breaker1 = CircuitBreakerFactory.getInstance('breaker1', {
      failureThreshold: 1,
      successThreshold: 1,
      resetTimeout: 100
    });
    
    const breaker2 = CircuitBreakerFactory.getInstance('breaker2', {
      failureThreshold: 1,
      successThreshold: 1,
      resetTimeout: 100
    });
    
    breaker1.trip();
    breaker2.trip();
    
    expect(breaker1.isOpen()).toBe(true);
    expect(breaker2.isOpen()).toBe(true);
    
    CircuitBreakerFactory.resetAll();
    
    expect(breaker1.isOpen()).toBe(false);
    expect(breaker2.isOpen()).toBe(false);
  });
});