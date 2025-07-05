/**
 * Operation Manager
 * Tracks and manages multiple cancellable operations
 */

import { EventEmitter } from 'events';
import { CancellationToken, CancellationTokenSource } from './CancellationToken.js';
import { CancellableOperation } from './CancellableOperation.js';
import { cleanupRegistry } from './CleanupHandler.js';
import { Logger } from '../../ui/Logger.js';

export interface OperationInfo {
  /** Unique operation ID */
  id: string;
  /** Operation name */
  name: string;
  /** Operation status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Start time */
  startTime?: Date;
  /** End time */
  endTime?: Date;
  /** Error if failed */
  error?: Error;
  /** Result if completed */
  result?: any;
  /** Cancellation token source */
  tokenSource: CancellationTokenSource;
  /** Parent operation ID */
  parentId?: string;
}

export interface OperationManagerOptions {
  /** Maximum concurrent operations */
  maxConcurrent?: number;
  /** Default operation timeout */
  defaultTimeout?: number;
  /** Enable operation history */
  enableHistory?: boolean;
  /** Maximum history size */
  maxHistorySize?: number;
}

/**
 * Manager for tracking and controlling operations
 */
export class OperationManager extends EventEmitter {
  private operations = new Map<string, OperationInfo>();
  private operationHistory: OperationInfo[] = [];
  private runningCount = 0;
  private pendingQueue: Array<() => void> = [];
  private logger: Logger;
  private nextId = 1;
  private options: Required<OperationManagerOptions>;
  private globalTokenSource: CancellationTokenSource;

  constructor(options: OperationManagerOptions = {}) {
    super();
    
    this.options = {
      maxConcurrent: options.maxConcurrent ?? Infinity,
      defaultTimeout: options.defaultTimeout ?? 0,
      enableHistory: options.enableHistory ?? true,
      maxHistorySize: options.maxHistorySize ?? 100,
    };
    
    this.logger = new Logger({ prefix: '[Operations]' });
    this.globalTokenSource = new CancellationTokenSource();
    
    // Register cleanup handler
    cleanupRegistry.register(
      () => this.cancelAll('System shutdown'),
      {
        name: 'OperationManager',
        priority: 100,
      }
    );
  }

  /**
   * Execute an operation with tracking
   */
  async execute<T>(
    name: string,
    operation: (token: CancellationToken) => Promise<T>,
    options: {
      timeout?: number;
      parentId?: string;
      id?: string;
    } = {}
  ): Promise<T> {
    const id = options.id || `op-${this.nextId++}`;
    
    // Create token source linked to global token
    const tokenSource = new CancellationTokenSource({
      parent: this.globalTokenSource.token,
      timeout: options.timeout || this.options.defaultTimeout,
    });
    
    // Create operation info
    const info: OperationInfo = {
      id,
      name,
      status: 'pending',
      tokenSource,
      parentId: options.parentId,
    };
    
    this.operations.set(id, info);
    this.emit('operation:created', info);
    
    // Wait for available slot if needed
    if (this.runningCount >= this.options.maxConcurrent) {
      await this.waitForSlot();
    }
    
    // Start operation
    info.status = 'running';
    info.startTime = new Date();
    this.runningCount++;
    this.emit('operation:started', info);
    
    try {
      // Execute the operation
      const result = await operation(tokenSource.token);
      
      // Mark as completed
      info.status = 'completed';
      info.result = result;
      info.endTime = new Date();
      this.emit('operation:completed', info);
      
      return result;
      
    } catch (error) {
      // Mark as failed or cancelled
      info.error = error as Error;
      info.endTime = new Date();
      
      if (tokenSource.token.isCancelled) {
        info.status = 'cancelled';
        this.emit('operation:cancelled', info);
      } else {
        info.status = 'failed';
        this.emit('operation:failed', info);
      }
      
      throw error;
      
    } finally {
      // Cleanup
      this.runningCount--;
      this.operations.delete(id);
      tokenSource.dispose();
      
      // Add to history if enabled
      if (this.options.enableHistory) {
        this.addToHistory(info);
      }
      
      // Process pending queue
      this.processPendingQueue();
    }
  }

  /**
   * Execute a cancellable operation
   */
  async executeCancellable<T>(
    operation: CancellableOperation<T>,
    options: {
      timeout?: number;
      parentId?: string;
      id?: string;
    } = {}
  ): Promise<T> {
    return this.execute(
      operation.getOperationName(),
      () => operation.execute(),
      options
    );
  }

  /**
   * Cancel a specific operation
   */
  cancel(id: string, reason?: string): boolean {
    const info = this.operations.get(id);
    if (!info || info.status !== 'running') {
      return false;
    }
    
    info.tokenSource.cancel(reason || 'Operation cancelled by user');
    return true;
  }

  /**
   * Cancel all operations
   */
  async cancelAll(reason?: string): Promise<void> {
    this.logger.info(`Cancelling all operations: ${reason || 'User requested'}`);
    
    // Cancel all running operations
    const runningOps = Array.from(this.operations.values()).filter(
      op => op.status === 'running'
    );
    
    runningOps.forEach(op => {
      op.tokenSource.cancel(reason || 'All operations cancelled');
    });
    
    // Wait for all to complete
    await this.waitForAll();
  }

  /**
   * Wait for all operations to complete
   */
  async waitForAll(): Promise<void> {
    while (this.operations.size > 0) {
      await new Promise(resolve => {
        this.once('operation:completed', resolve);
        this.once('operation:failed', resolve);
        this.once('operation:cancelled', resolve);
      });
    }
  }

  /**
   * Get operation info
   */
  getOperation(id: string): OperationInfo | undefined {
    return this.operations.get(id) || 
           this.operationHistory.find(op => op.id === id);
  }

  /**
   * Get all running operations
   */
  getRunningOperations(): OperationInfo[] {
    return Array.from(this.operations.values()).filter(
      op => op.status === 'running'
    );
  }

  /**
   * Get operation history
   */
  getHistory(): ReadonlyArray<OperationInfo> {
    return [...this.operationHistory];
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.operationHistory = [];
  }

  /**
   * Create a child operation
   */
  createChildOperation<T>(
    parentId: string,
    name: string,
    operation: (token: CancellationToken) => Promise<T>,
    options: {
      timeout?: number;
      id?: string;
    } = {}
  ): Promise<T> {
    const parent = this.operations.get(parentId);
    if (!parent) {
      throw new Error(`Parent operation ${parentId} not found`);
    }
    
    return this.execute(name, operation, {
      ...options,
      parentId,
    });
  }

  /**
   * Wait for an available operation slot
   */
  private waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      this.pendingQueue.push(resolve);
    });
  }

  /**
   * Process pending operations queue
   */
  private processPendingQueue(): void {
    while (this.pendingQueue.length > 0 && this.runningCount < this.options.maxConcurrent) {
      const resolve = this.pendingQueue.shift();
      if (resolve) {
        resolve();
      }
    }
  }

  /**
   * Add operation to history
   */
  private addToHistory(info: OperationInfo): void {
    this.operationHistory.unshift(info);
    
    // Trim history if needed
    if (this.operationHistory.length > this.options.maxHistorySize) {
      this.operationHistory = this.operationHistory.slice(0, this.options.maxHistorySize);
    }
  }

  /**
   * Get operation statistics
   */
  getStats(): {
    running: number;
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgDuration: number;
  } {
    const running = this.getRunningOperations().length;
    const pending = this.pendingQueue.length;
    
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let totalDuration = 0;
    let durationCount = 0;
    
    this.operationHistory.forEach(op => {
      switch (op.status) {
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'cancelled':
          cancelled++;
          break;
      }
      
      if (op.startTime && op.endTime) {
        totalDuration += op.endTime.getTime() - op.startTime.getTime();
        durationCount++;
      }
    });
    
    return {
      running,
      pending,
      completed,
      failed,
      cancelled,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
    };
  }

  /**
   * Create a scoped operation manager
   */
  createScope(name: string): ScopedOperationManager {
    return new ScopedOperationManager(this, name);
  }
}

/**
 * Scoped operation manager for grouping related operations
 */
export class ScopedOperationManager {
  private operationIds = new Set<string>();
  private scopeId: string;

  constructor(
    private manager: OperationManager,
    private name: string
  ) {
    this.scopeId = `scope-${Date.now()}`;
  }

  /**
   * Execute an operation in this scope
   */
  async execute<T>(
    name: string,
    operation: (token: CancellationToken) => Promise<T>,
    options: {
      timeout?: number;
      id?: string;
    } = {}
  ): Promise<T> {
    const id = options.id || `${this.scopeId}-${this.operationIds.size + 1}`;
    this.operationIds.add(id);
    
    return this.manager.execute(
      `${this.name}:${name}`,
      operation,
      { ...options, id }
    );
  }

  /**
   * Cancel all operations in this scope
   */
  async cancelAll(reason?: string): Promise<void> {
    const promises = Array.from(this.operationIds).map(id => 
      this.manager.cancel(id, reason)
    );
    
    await Promise.all(promises);
  }

  /**
   * Wait for all operations in this scope
   */
  async waitForAll(): Promise<void> {
    const checkCompletion = () => {
      for (const id of this.operationIds) {
        const op = this.manager.getOperation(id);
        if (op && op.status === 'running') {
          return false;
        }
      }
      return true;
    };
    
    while (!checkCompletion()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Global operation manager instance
 */
export const globalOperationManager = new OperationManager({
  maxConcurrent: 10,
  defaultTimeout: 30000,
  enableHistory: true,
});