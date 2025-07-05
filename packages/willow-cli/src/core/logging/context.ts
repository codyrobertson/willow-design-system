/**
 * Log Context Management for Operation Tracking
 */

import { randomUUID } from 'crypto';
import { LogContext } from './types.js';

/**
 * Context manager for tracking nested operations
 */
export class ContextManager {
  private contexts = new Map<string, LogContext>();
  private activeContextStack: string[] = [];
  
  /**
   * Create a new context
   */
  createContext(operation: string, parentId?: string, metadata?: Record<string, unknown>): LogContext {
    const context: LogContext = {
      id: randomUUID(),
      operation,
      parentId: parentId || this.getCurrentContextId(),
      startTime: new Date(),
      metadata: metadata || {},
    };
    
    this.contexts.set(context.id, context);
    return context;
  }
  
  /**
   * Start a new operation context
   */
  startContext(context: LogContext): void {
    this.activeContextStack.push(context.id);
  }
  
  /**
   * End the current operation context
   */
  endContext(contextId?: string): LogContext | undefined {
    if (contextId) {
      // Remove specific context from stack
      const index = this.activeContextStack.indexOf(contextId);
      if (index !== -1) {
        this.activeContextStack.splice(index, 1);
      }
      return this.contexts.get(contextId);
    }
    
    // Pop the most recent context
    const id = this.activeContextStack.pop();
    if (id) {
      return this.contexts.get(id);
    }
    
    return undefined;
  }
  
  /**
   * Get the current active context
   */
  getCurrentContext(): LogContext | undefined {
    const id = this.getCurrentContextId();
    return id ? this.contexts.get(id) : undefined;
  }
  
  /**
   * Get the current context ID
   */
  getCurrentContextId(): string | undefined {
    return this.activeContextStack[this.activeContextStack.length - 1];
  }
  
  /**
   * Get a specific context by ID
   */
  getContext(id: string): LogContext | undefined {
    return this.contexts.get(id);
  }
  
  /**
   * Update context metadata
   */
  updateContext(id: string, metadata: Record<string, unknown>): void {
    const context = this.contexts.get(id);
    if (context) {
      Object.assign(context.metadata || {}, metadata);
    }
  }
  
  /**
   * Get all active contexts (current stack)
   */
  getActiveContexts(): LogContext[] {
    return this.activeContextStack
      .map(id => this.contexts.get(id))
      .filter((ctx): ctx is LogContext => ctx !== undefined);
  }
  
  /**
   * Get context hierarchy for a given context
   */
  getContextHierarchy(contextId: string): LogContext[] {
    const hierarchy: LogContext[] = [];
    let currentId: string | undefined = contextId;
    
    while (currentId) {
      const context = this.contexts.get(currentId);
      if (!context) break;
      
      hierarchy.unshift(context);
      currentId = context.parentId;
    }
    
    return hierarchy;
  }
  
  /**
   * Clean up old contexts
   */
  cleanup(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    const idsToRemove: string[] = [];
    
    for (const [id, context] of this.contexts) {
      if (now - context.startTime.getTime() > maxAge) {
        idsToRemove.push(id);
      }
    }
    
    for (const id of idsToRemove) {
      this.contexts.delete(id);
      const index = this.activeContextStack.indexOf(id);
      if (index !== -1) {
        this.activeContextStack.splice(index, 1);
      }
    }
  }
  
  /**
   * Clear all contexts
   */
  clear(): void {
    this.contexts.clear();
    this.activeContextStack = [];
  }
  
  /**
   * Get statistics about contexts
   */
  getStats(): {
    total: number;
    active: number;
    operations: Record<string, number>;
  } {
    const operations: Record<string, number> = {};
    
    for (const context of this.contexts.values()) {
      operations[context.operation] = (operations[context.operation] || 0) + 1;
    }
    
    return {
      total: this.contexts.size,
      active: this.activeContextStack.length,
      operations,
    };
  }
}

/**
 * Thread-safe context manager using AsyncLocalStorage
 */
export class AsyncContextManager {
  private asyncLocalStorage: any;
  private globalContextManager = new ContextManager();
  
  constructor() {
    // Check if AsyncLocalStorage is available
    try {
      const { AsyncLocalStorage } = require('async_hooks');
      this.asyncLocalStorage = new AsyncLocalStorage();
    } catch {
      // Fallback to global context manager if AsyncLocalStorage not available
      console.warn('AsyncLocalStorage not available, using global context manager');
    }
  }
  
  /**
   * Run a function with a specific context
   */
  async runWithContext<T>(
    operation: string,
    metadata: Record<string, unknown>,
    fn: () => T | Promise<T>
  ): Promise<T> {
    if (!this.asyncLocalStorage) {
      // Fallback to global context
      const context = this.globalContextManager.createContext(operation, undefined, metadata);
      this.globalContextManager.startContext(context);
      
      try {
        return await fn();
      } finally {
        this.globalContextManager.endContext(context.id);
      }
    }
    
    // Use AsyncLocalStorage for thread-safe context
    const parentContext = this.asyncLocalStorage.getStore();
    const context = this.globalContextManager.createContext(
      operation,
      parentContext?.id,
      metadata
    );
    
    return this.asyncLocalStorage.run(context, fn);
  }
  
  /**
   * Get the current context
   */
  getCurrentContext(): LogContext | undefined {
    if (!this.asyncLocalStorage) {
      return this.globalContextManager.getCurrentContext();
    }
    
    return this.asyncLocalStorage.getStore() || this.globalContextManager.getCurrentContext();
  }
  
  /**
   * Get the global context manager
   */
  getGlobalManager(): ContextManager {
    return this.globalContextManager;
  }
}

/**
 * Performance tracker for timing operations
 */
export class PerformanceTracker {
  private timers = new Map<string, { start: number; marks: Array<{ label: string; time: number }> }>();
  
  /**
   * Start timing an operation
   */
  start(label: string): void {
    this.timers.set(label, {
      start: performance.now(),
      marks: [],
    });
  }
  
  /**
   * Add a time mark
   */
  mark(label: string, markLabel: string): void {
    const timer = this.timers.get(label);
    if (timer) {
      timer.marks.push({
        label: markLabel,
        time: performance.now() - timer.start,
      });
    }
  }
  
  /**
   * End timing and get duration
   */
  end(label: string): { duration: number; marks: Array<{ label: string; time: number }> } | undefined {
    const timer = this.timers.get(label);
    if (!timer) return undefined;
    
    const duration = performance.now() - timer.start;
    this.timers.delete(label);
    
    return {
      duration,
      marks: timer.marks,
    };
  }
  
  /**
   * Get current duration without ending
   */
  getDuration(label: string): number | undefined {
    const timer = this.timers.get(label);
    if (!timer) return undefined;
    
    return performance.now() - timer.start;
  }
  
  /**
   * Check if a timer exists
   */
  has(label: string): boolean {
    return this.timers.has(label);
  }
  
  /**
   * Clear all timers
   */
  clear(): void {
    this.timers.clear();
  }
}

/**
 * Global instances
 */
export const globalContextManager = new AsyncContextManager();
export const performanceTracker = new PerformanceTracker();