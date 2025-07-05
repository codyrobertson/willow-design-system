/**
 * Context Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextManager, AsyncContextManager, PerformanceTracker } from '../context.js';
import { LogContext } from '../types.js';

describe('ContextManager', () => {
  let contextManager: ContextManager;
  
  beforeEach(() => {
    contextManager = new ContextManager();
  });
  
  describe('Context Creation', () => {
    it('should create context with unique ID', () => {
      const context1 = contextManager.createContext('operation1');
      const context2 = contextManager.createContext('operation2');
      
      expect(context1.id).toBeTruthy();
      expect(context2.id).toBeTruthy();
      expect(context1.id).not.toBe(context2.id);
    });
    
    it('should set parent ID from active context', () => {
      const parent = contextManager.createContext('parent-op');
      contextManager.startContext(parent);
      
      const child = contextManager.createContext('child-op');
      
      expect(child.parentId).toBe(parent.id);
    });
    
    it('should allow explicit parent ID', () => {
      const parent = contextManager.createContext('parent-op');
      const child = contextManager.createContext('child-op', parent.id);
      
      expect(child.parentId).toBe(parent.id);
    });
    
    it('should include metadata', () => {
      const metadata = { userId: '123', requestId: 'req-456' };
      const context = contextManager.createContext('operation', undefined, metadata);
      
      expect(context.metadata).toEqual(metadata);
    });
  });
  
  describe('Context Stack Management', () => {
    it('should manage context stack', () => {
      const ctx1 = contextManager.createContext('op1');
      const ctx2 = contextManager.createContext('op2');
      
      contextManager.startContext(ctx1);
      expect(contextManager.getCurrentContext()).toEqual(ctx1);
      
      contextManager.startContext(ctx2);
      expect(contextManager.getCurrentContext()).toEqual(ctx2);
      
      contextManager.endContext();
      expect(contextManager.getCurrentContext()).toEqual(ctx1);
      
      contextManager.endContext();
      expect(contextManager.getCurrentContext()).toBeUndefined();
    });
    
    it('should end specific context by ID', () => {
      const ctx1 = contextManager.createContext('op1');
      const ctx2 = contextManager.createContext('op2');
      const ctx3 = contextManager.createContext('op3');
      
      contextManager.startContext(ctx1);
      contextManager.startContext(ctx2);
      contextManager.startContext(ctx3);
      
      // Remove middle context
      contextManager.endContext(ctx2.id);
      
      const activeContexts = contextManager.getActiveContexts();
      expect(activeContexts).toHaveLength(2);
      expect(activeContexts[0]).toEqual(ctx1);
      expect(activeContexts[1]).toEqual(ctx3);
    });
  });
  
  describe('Context Queries', () => {
    it('should get context by ID', () => {
      const context = contextManager.createContext('operation');
      const retrieved = contextManager.getContext(context.id);
      
      expect(retrieved).toEqual(context);
    });
    
    it('should return undefined for unknown context', () => {
      const retrieved = contextManager.getContext('unknown-id');
      expect(retrieved).toBeUndefined();
    });
    
    it('should get all active contexts', () => {
      const ctx1 = contextManager.createContext('op1');
      const ctx2 = contextManager.createContext('op2');
      
      contextManager.startContext(ctx1);
      contextManager.startContext(ctx2);
      
      const active = contextManager.getActiveContexts();
      expect(active).toHaveLength(2);
      expect(active[0]).toEqual(ctx1);
      expect(active[1]).toEqual(ctx2);
    });
  });
  
  describe('Context Hierarchy', () => {
    it('should build context hierarchy', () => {
      const root = contextManager.createContext('root');
      const child1 = contextManager.createContext('child1', root.id);
      const child2 = contextManager.createContext('child2', child1.id);
      
      const hierarchy = contextManager.getContextHierarchy(child2.id);
      
      expect(hierarchy).toHaveLength(3);
      expect(hierarchy[0]).toEqual(root);
      expect(hierarchy[1]).toEqual(child1);
      expect(hierarchy[2]).toEqual(child2);
    });
    
    it('should handle broken hierarchy', () => {
      const orphan = contextManager.createContext('orphan', 'non-existent-id');
      const hierarchy = contextManager.getContextHierarchy(orphan.id);
      
      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0]).toEqual(orphan);
    });
  });
  
  describe('Context Updates', () => {
    it('should update context metadata', () => {
      const context = contextManager.createContext('operation', undefined, { initial: 'value' });
      
      contextManager.updateContext(context.id, { additional: 'data', count: 42 });
      
      const updated = contextManager.getContext(context.id);
      expect(updated?.metadata).toEqual({
        initial: 'value',
        additional: 'data',
        count: 42,
      });
    });
    
    it('should handle update of non-existent context', () => {
      // Should not throw
      expect(() => {
        contextManager.updateContext('non-existent', { data: 'value' });
      }).not.toThrow();
    });
  });
  
  describe('Cleanup', () => {
    it('should clean up old contexts', () => {
      const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const recentDate = new Date();
      
      // Create old context
      const oldContext = contextManager.createContext('old-op');
      oldContext.startTime = oldDate;
      
      // Create recent context
      const recentContext = contextManager.createContext('recent-op');
      recentContext.startTime = recentDate;
      
      contextManager.cleanup(60 * 60 * 1000); // 1 hour max age
      
      expect(contextManager.getContext(oldContext.id)).toBeUndefined();
      expect(contextManager.getContext(recentContext.id)).toEqual(recentContext);
    });
    
    it('should remove cleaned contexts from active stack', () => {
      const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const oldContext = contextManager.createContext('old-op');
      oldContext.startTime = oldDate;
      contextManager.startContext(oldContext);
      
      const recentContext = contextManager.createContext('recent-op');
      contextManager.startContext(recentContext);
      
      contextManager.cleanup(60 * 60 * 1000);
      
      const active = contextManager.getActiveContexts();
      expect(active).toHaveLength(1);
      expect(active[0]).toEqual(recentContext);
    });
    
    it('should clear all contexts', () => {
      contextManager.createContext('op1');
      contextManager.createContext('op2');
      contextManager.createContext('op3');
      
      contextManager.clear();
      
      expect(contextManager.getStats().total).toBe(0);
      expect(contextManager.getActiveContexts()).toHaveLength(0);
    });
  });
  
  describe('Statistics', () => {
    it('should provide context statistics', () => {
      const ctx1 = contextManager.createContext('import');
      const ctx2 = contextManager.createContext('import');
      const ctx3 = contextManager.createContext('export');
      
      contextManager.startContext(ctx1);
      contextManager.startContext(ctx2);
      
      const stats = contextManager.getStats();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.operations).toEqual({
        import: 2,
        export: 1,
      });
    });
  });
});

describe('AsyncContextManager', () => {
  let asyncContextManager: AsyncContextManager;
  
  beforeEach(() => {
    asyncContextManager = new AsyncContextManager();
  });
  
  it('should run function with context', async () => {
    let capturedContext: LogContext | undefined;
    
    await asyncContextManager.runWithContext(
      'async-operation',
      { requestId: 'req-123' },
      async () => {
        capturedContext = asyncContextManager.getCurrentContext();
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    );
    
    expect(capturedContext).toBeDefined();
    expect(capturedContext?.operation).toBe('async-operation');
    expect(capturedContext?.metadata?.requestId).toBe('req-123');
  });
  
  it('should maintain context across async boundaries', async () => {
    const contexts: (LogContext | undefined)[] = [];
    
    await asyncContextManager.runWithContext(
      'parent-op',
      {},
      async () => {
        contexts.push(asyncContextManager.getCurrentContext());
        
        await Promise.all([
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            contexts.push(asyncContextManager.getCurrentContext());
          })(),
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
            contexts.push(asyncContextManager.getCurrentContext());
          })(),
        ]);
      }
    );
    
    // All contexts should be the same
    expect(contexts).toHaveLength(3);
    expect(contexts[0]?.id).toBe(contexts[1]?.id);
    expect(contexts[0]?.id).toBe(contexts[2]?.id);
  });
  
  it('should nest contexts correctly', async () => {
    let parentContext: LogContext | undefined;
    let childContext: LogContext | undefined;
    
    await asyncContextManager.runWithContext(
      'parent',
      {},
      async () => {
        parentContext = asyncContextManager.getCurrentContext();
        
        await asyncContextManager.runWithContext(
          'child',
          {},
          async () => {
            childContext = asyncContextManager.getCurrentContext();
          }
        );
      }
    );
    
    expect(parentContext).toBeDefined();
    expect(childContext).toBeDefined();
    expect(childContext?.parentId).toBe(parentContext?.id);
  });
  
  it('should access global context manager', () => {
    const globalManager = asyncContextManager.getGlobalManager();
    expect(globalManager).toBeInstanceOf(ContextManager);
  });
});

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;
  
  beforeEach(() => {
    tracker = new PerformanceTracker();
    // Mock performance.now for consistent tests
    let time = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      return time++;
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should track timer duration', () => {
    tracker.start('operation');
    
    // Simulate time passing
    for (let i = 0; i < 100; i++) {
      performance.now(); // Increment mock time
    }
    
    const result = tracker.end('operation');
    
    expect(result).toBeDefined();
    expect(result?.duration).toBeCloseTo(100, -1);
  });
  
  it('should track marks within timer', () => {
    tracker.start('operation');
    
    for (let i = 0; i < 50; i++) {
      performance.now();
    }
    tracker.mark('operation', 'halfway');
    
    for (let i = 0; i < 50; i++) {
      performance.now();
    }
    tracker.mark('operation', 'almost-done');
    
    const result = tracker.end('operation');
    
    expect(result?.marks).toHaveLength(2);
    expect(result?.marks[0]).toEqual({ label: 'halfway', time: expect.any(Number) });
    expect(result?.marks[1]).toEqual({ label: 'almost-done', time: expect.any(Number) });
  });
  
  it('should get duration without ending timer', () => {
    tracker.start('long-operation');
    
    for (let i = 0; i < 75; i++) {
      performance.now();
    }
    
    const duration = tracker.getDuration('long-operation');
    expect(duration).toBeCloseTo(75, -1);
    
    // Timer should still be active
    expect(tracker.has('long-operation')).toBe(true);
  });
  
  it('should return undefined for non-existent timers', () => {
    expect(tracker.end('non-existent')).toBeUndefined();
    expect(tracker.getDuration('non-existent')).toBeUndefined();
  });
  
  it('should check if timer exists', () => {
    expect(tracker.has('timer')).toBe(false);
    
    tracker.start('timer');
    expect(tracker.has('timer')).toBe(true);
    
    tracker.end('timer');
    expect(tracker.has('timer')).toBe(false);
  });
  
  it('should clear all timers', () => {
    tracker.start('timer1');
    tracker.start('timer2');
    tracker.start('timer3');
    
    tracker.clear();
    
    expect(tracker.has('timer1')).toBe(false);
    expect(tracker.has('timer2')).toBe(false);
    expect(tracker.has('timer3')).toBe(false);
  });
});