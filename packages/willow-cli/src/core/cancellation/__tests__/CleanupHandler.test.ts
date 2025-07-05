/**
 * Tests for CleanupHandler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  CleanupRegistry,
  ScopedCleanup,
  Cleanup
} from '../CleanupHandler.js';
import { CancellationToken } from '../CancellationToken.js';

describe('CleanupHandler', () => {
  let registry: CleanupRegistry;
  
  beforeEach(() => {
    // Get a fresh instance by clearing the singleton
    (CleanupRegistry as any).instance = undefined;
    registry = CleanupRegistry.getInstance();
    registry.clear();
  });
  
  afterEach(() => {
    registry.clear();
    vi.clearAllMocks();
  });
  
  describe('CleanupRegistry', () => {
    it('should register and execute cleanup handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      registry.register(handler1, { name: 'Handler 1' });
      registry.register(handler2, { name: 'Handler 2' });
      
      expect(registry.size).toBe(2);
      
      await registry.cleanup();
      
      expect(handler1).toHaveBeenCalledWith(expect.any(CancellationToken));
      expect(handler2).toHaveBeenCalledWith(expect.any(CancellationToken));
    });
    
    it('should execute handlers in priority order', async () => {
      const order: string[] = [];
      
      registry.register(() => { order.push('low'); }, { priority: 0 });
      registry.register(() => { order.push('high'); }, { priority: 100 });
      registry.register(() => { order.push('medium'); }, { priority: 50 });
      
      await registry.cleanup();
      
      expect(order).toEqual(['high', 'medium', 'low']);
    });
    
    it('should handle async cleanup handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      
      registry.register(handler, { name: 'Async handler' });
      
      await registry.cleanup();
      
      expect(handler).toHaveBeenCalled();
    });
    
    it('should continue on error by default', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const successHandler = vi.fn();
      
      registry.register(errorHandler, { name: 'Error handler' });
      registry.register(successHandler, { name: 'Success handler' });
      
      await registry.cleanup();
      
      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
    
    it('should respect timeout for handlers', async () => {
      vi.useFakeTimers();
      
      const slowHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
      });
      
      registry.register(slowHandler, { 
        name: 'Slow handler',
        timeout: 100,
      });
      
      const cleanupPromise = registry.cleanup();
      
      // Advance timers past timeout
      await vi.advanceTimersByTimeAsync(100);
      
      await cleanupPromise;
      
      expect(slowHandler).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
    
    it('should prevent multiple concurrent cleanups', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      registry.register(handler);
      
      const cleanup1 = registry.cleanup();
      const cleanup2 = registry.cleanup();
      
      await Promise.all([cleanup1, cleanup2]);
      
      // Handler should only be called once
      expect(handler).toHaveBeenCalledTimes(1);
    });
    
    it('should support unregistering handlers', () => {
      const handler = vi.fn();
      const id = registry.register(handler);
      
      expect(registry.size).toBe(1);
      
      const removed = registry.unregister(id);
      expect(removed).toBe(true);
      expect(registry.size).toBe(0);
      
      const removedAgain = registry.unregister(id);
      expect(removedAgain).toBe(false);
    });
    
    it('should handle cancellation during cleanup', async () => {
      const token = new CancellationToken();
      const handler = vi.fn(async (t: CancellationToken) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        t.throwIfCancelled();
      });
      
      registry.register(handler);
      
      setTimeout(() => token.cancel('Cleanup cancelled'), 50);
      
      await registry.cleanup(token);
      
      expect(handler).toHaveBeenCalled();
    });
  });
  
  describe('ScopedCleanup', () => {
    it('should execute handlers in LIFO order', async () => {
      const cleanup = new ScopedCleanup();
      const order: number[] = [];
      
      cleanup.add(() => { order.push(1); });
      cleanup.add(() => { order.push(2); });
      cleanup.add(() => { order.push(3); });
      
      await cleanup.cleanup();
      
      expect(order).toEqual([3, 2, 1]);
    });
    
    it('should handle async handlers', async () => {
      const cleanup = new ScopedCleanup();
      const handler = vi.fn().mockResolvedValue(undefined);
      
      cleanup.add(handler);
      
      await cleanup.cleanup();
      
      expect(handler).toHaveBeenCalled();
    });
    
    it('should continue on handler errors', async () => {
      const cleanup = new ScopedCleanup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      cleanup.add(() => { throw new Error('Handler 1 error'); });
      cleanup.add(() => { /* success */ });
      
      await cleanup.cleanup();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in scoped cleanup handler:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should prevent adding handlers after disposal', async () => {
      const cleanup = new ScopedCleanup();
      
      await cleanup.cleanup();
      
      expect(() => {
        cleanup.add(() => {});
      }).toThrow('Cannot add handler to disposed ScopedCleanup');
    });
    
    it('should support use pattern with automatic cleanup', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      let scopedCleanup: ScopedCleanup | null = null;
      
      const result = await ScopedCleanup.use(async (cleanup) => {
        scopedCleanup = cleanup;
        cleanup.add(handler1);
        cleanup.add(handler2);
        return 'test-result';
      });
      
      expect(result).toBe('test-result');
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
    
    it('should cleanup on error in use pattern', async () => {
      const handler = vi.fn();
      
      await expect(
        ScopedCleanup.use(async (cleanup) => {
          cleanup.add(handler);
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
      
      expect(handler).toHaveBeenCalled();
    });
  });
  
  describe('Cleanup decorator', () => {
    it('should register method as cleanup handler', async () => {
      class TestClass {
        cleaned = false;
        
        @Cleanup({ name: 'TestClass cleanup' })
        async cleanup() {
          this.cleaned = true;
        }
        
        doSomething() {
          // Trigger registration
          this.cleanup();
        }
      }
      
      const instance = new TestClass();
      
      // Handler not registered until first call
      expect(registry.size).toBe(0);
      
      instance.doSomething();
      
      // Now it should be registered
      expect(registry.size).toBe(1);
      
      await registry.cleanup();
      
      expect(instance.cleaned).toBe(true);
    });
  });
});