/**
 * Tests for CancellationToken
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  CancellationToken, 
  CancellationTokenSource, 
  CancellationError 
} from '../CancellationToken.js';

describe('CancellationToken', () => {
  let token: CancellationToken;
  
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  describe('Basic functionality', () => {
    it('should create a non-cancelled token', () => {
      token = new CancellationToken();
      expect(token.isCancelled).toBe(false);
      expect(token.reason).toBeUndefined();
    });
    
    it('should cancel with string reason', () => {
      token = new CancellationToken();
      token.cancel('Test cancellation');
      
      expect(token.isCancelled).toBe(true);
      expect(token.reason?.message).toBe('Test cancellation');
      expect(token.reason?.source).toBe('user');
    });
    
    it('should cancel with object reason', () => {
      token = new CancellationToken();
      token.cancel({
        message: 'Custom cancellation',
        code: 'TEST_CODE',
        source: 'timeout',
      });
      
      expect(token.isCancelled).toBe(true);
      expect(token.reason?.message).toBe('Custom cancellation');
      expect(token.reason?.code).toBe('TEST_CODE');
      expect(token.reason?.source).toBe('timeout');
    });
    
    it('should not cancel multiple times', () => {
      token = new CancellationToken();
      token.cancel('First cancel');
      token.cancel('Second cancel');
      
      expect(token.reason?.message).toBe('First cancel');
    });
  });
  
  describe('Callbacks', () => {
    it('should call registered callbacks on cancellation', () => {
      token = new CancellationToken();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      token.onCancelled(callback1);
      token.onCancelled(callback2);
      
      token.cancel('Test');
      
      expect(callback1).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test',
          source: 'user',
        })
      );
      expect(callback2).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test',
          source: 'user',
        })
      );
    });
    
    it('should call callback immediately if already cancelled', () => {
      token = new CancellationToken();
      token.cancel('Already cancelled');
      
      const callback = vi.fn();
      token.onCancelled(callback);
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Already cancelled',
        })
      );
    });
    
    it('should support unsubscribing from callbacks', () => {
      token = new CancellationToken();
      const callback = vi.fn();
      
      const unsubscribe = token.onCancelled(callback);
      unsubscribe();
      
      token.cancel('Test');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
  
  describe('Parent-child relationships', () => {
    it('should cancel child when parent is cancelled', () => {
      const parent = new CancellationToken();
      const child = new CancellationToken({ parent });
      
      expect(child.isCancelled).toBe(false);
      
      parent.cancel('Parent cancelled');
      
      expect(child.isCancelled).toBe(true);
      expect(child.reason?.message).toContain('Parent cancelled');
      expect(child.reason?.source).toBe('parent');
    });
    
    it('should cancel immediately if parent is already cancelled', () => {
      const parent = new CancellationToken();
      parent.cancel('Already cancelled');
      
      const child = new CancellationToken({ parent });
      
      expect(child.isCancelled).toBe(true);
      expect(child.reason?.source).toBe('parent');
    });
    
    it('should not cancel parent when child is cancelled', () => {
      const parent = new CancellationToken();
      const child = new CancellationToken({ parent });
      
      child.cancel('Child cancelled');
      
      expect(parent.isCancelled).toBe(false);
      expect(child.isCancelled).toBe(true);
    });
  });
  
  describe('Timeout functionality', () => {
    it('should auto-cancel after timeout', () => {
      token = new CancellationToken({ timeout: 1000 });
      
      expect(token.isCancelled).toBe(false);
      
      vi.advanceTimersByTime(1000);
      
      expect(token.isCancelled).toBe(true);
      expect(token.reason?.message).toContain('timed out');
      expect(token.reason?.source).toBe('timeout');
      expect(token.reason?.code).toBe('TIMEOUT');
    });
    
    it('should clear timeout on manual cancellation', () => {
      token = new CancellationToken({ timeout: 1000 });
      
      token.cancel('Manual cancel');
      vi.advanceTimersByTime(2000);
      
      expect(token.reason?.message).toBe('Manual cancel');
      expect(token.reason?.source).toBe('user');
    });
  });
  
  describe('AbortController integration', () => {
    it('should provide an abort controller', () => {
      token = new CancellationToken();
      const controller = token.abortController;
      
      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal.aborted).toBe(false);
    });
    
    it('should abort controller when token is cancelled', () => {
      token = new CancellationToken();
      const signal = token.abortSignal;
      
      expect(signal.aborted).toBe(false);
      
      token.cancel('Test abort');
      
      expect(signal.aborted).toBe(true);
    });
    
    it('should return aborted controller if already cancelled', () => {
      token = new CancellationToken();
      token.cancel('Already cancelled');
      
      const signal = token.abortSignal;
      expect(signal.aborted).toBe(true);
    });
  });
  
  describe('Error handling', () => {
    it('should throw CancellationError when cancelled', () => {
      token = new CancellationToken();
      token.cancel('Cancelled');
      
      expect(() => token.throwIfCancelled()).toThrow(CancellationError);
      expect(() => token.throwIfCancelled()).toThrow('Cancelled');
    });
    
    it('should not throw when not cancelled', () => {
      token = new CancellationToken();
      
      expect(() => token.throwIfCancelled()).not.toThrow();
    });
  });
  
  describe('Static methods', () => {
    it('should create a pre-cancelled token', () => {
      const token = CancellationToken.cancelled('Pre-cancelled');
      
      expect(token.isCancelled).toBe(true);
      expect(token.reason?.message).toBe('Pre-cancelled');
    });
    
    it('should create linked tokens', () => {
      const token1 = new CancellationToken();
      const token2 = new CancellationToken();
      const linked = CancellationToken.link(token1, token2);
      
      expect(linked.isCancelled).toBe(false);
      
      token1.cancel('Token 1 cancelled');
      
      expect(linked.isCancelled).toBe(true);
      expect(linked.reason?.message).toContain('Token 1 cancelled');
    });
    
    it('should handle pre-cancelled linked tokens', () => {
      const token1 = new CancellationToken();
      token1.cancel('Already cancelled');
      const token2 = new CancellationToken();
      
      const linked = CancellationToken.link(token1, token2);
      
      expect(linked.isCancelled).toBe(true);
    });
  });
  
  describe('Async operations', () => {
    it('should wait for cancellation', async () => {
      token = new CancellationToken();
      
      const promise = token.waitForCancellation();
      
      setTimeout(() => token.cancel('Async cancel'), 100);
      vi.advanceTimersByTime(100);
      
      const reason = await promise;
      
      expect(reason.message).toBe('Async cancel');
    });
    
    it('should race promise against cancellation', async () => {
      token = new CancellationToken();
      
      const successPromise = new Promise(resolve => 
        setTimeout(() => resolve('success'), 200)
      );
      
      setTimeout(() => token.cancel('Cancelled'), 100);
      
      const promise = token.race(successPromise);
      vi.advanceTimersByTime(100);
      
      await expect(promise).rejects.toThrow(CancellationError);
    });
    
    it('should complete race if not cancelled', async () => {
      token = new CancellationToken();
      
      const successPromise = Promise.resolve('success');
      const result = await token.race(successPromise);
      
      expect(result).toBe('success');
    });
  });
  
  describe('CancellationTokenSource', () => {
    it('should create and manage a token', () => {
      const source = new CancellationTokenSource();
      
      expect(source.token.isCancelled).toBe(false);
      
      source.cancel('Source cancel');
      
      expect(source.token.isCancelled).toBe(true);
      expect(source.token.reason?.message).toBe('Source cancel');
    });
    
    it('should support timeout in source', () => {
      const source = new CancellationTokenSource({ timeout: 500 });
      
      vi.advanceTimersByTime(500);
      
      expect(source.token.isCancelled).toBe(true);
      expect(source.token.reason?.source).toBe('timeout');
    });
  });
  
  describe('CancellationError', () => {
    it('should create error with message and code', () => {
      const error = new CancellationError('Test error', 'TEST_CODE');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('CancellationError');
    });
    
    it('should identify cancellation errors', () => {
      const cancellationError = new CancellationError('Test');
      const regularError = new Error('Test');
      
      expect(CancellationError.is(cancellationError)).toBe(true);
      expect(CancellationError.is(regularError)).toBe(false);
    });
  });
});