/**
 * Cleanup Handler Registry
 * Manages cleanup operations for graceful shutdown
 */

import { CancellationToken } from './CancellationToken.js';
import { Logger } from '../../ui/Logger.js';

export interface CleanupOptions {
  /** Priority for cleanup execution (higher = earlier) */
  priority?: number;
  /** Timeout for cleanup operation */
  timeout?: number;
  /** Name for logging purposes */
  name?: string;
  /** Whether to continue on error */
  continueOnError?: boolean;
}

export interface CleanupHandler {
  /** The cleanup function */
  handler: (token: CancellationToken) => void | Promise<void>;
  /** Options for this handler */
  options: Required<CleanupOptions>;
  /** Unique ID for this handler */
  id: string;
}

/**
 * Registry for managing cleanup handlers
 */
export class CleanupRegistry {
  private static instance: CleanupRegistry;
  private handlers = new Map<string, CleanupHandler>();
  private isCleaningUp = false;
  private cleanupPromise?: Promise<void>;
  private logger: Logger;
  private nextId = 1;

  private constructor() {
    this.logger = new Logger({ prefix: '[Cleanup]' });
    this.setupSignalHandlers();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): CleanupRegistry {
    if (!CleanupRegistry.instance) {
      CleanupRegistry.instance = new CleanupRegistry();
    }
    return CleanupRegistry.instance;
  }

  /**
   * Register a cleanup handler
   */
  register(
    handler: (token: CancellationToken) => void | Promise<void>,
    options: CleanupOptions = {}
  ): string {
    const id = `cleanup-${this.nextId++}`;
    
    const cleanupHandler: CleanupHandler = {
      handler,
      options: {
        priority: options.priority ?? 0,
        timeout: options.timeout ?? 5000,
        name: options.name ?? id,
        continueOnError: options.continueOnError ?? true,
      },
      id,
    };
    
    this.handlers.set(id, cleanupHandler);
    this.logger.debug(`Registered cleanup handler: ${cleanupHandler.options.name}`);
    
    return id;
  }

  /**
   * Unregister a cleanup handler
   */
  unregister(id: string): boolean {
    const handler = this.handlers.get(id);
    if (handler) {
      this.handlers.delete(id);
      this.logger.debug(`Unregistered cleanup handler: ${handler.options.name}`);
      return true;
    }
    return false;
  }

  /**
   * Execute all cleanup handlers
   */
  async cleanup(token?: CancellationToken): Promise<void> {
    // Prevent multiple cleanup runs
    if (this.isCleaningUp) {
      return this.cleanupPromise;
    }
    
    this.isCleaningUp = true;
    const cancellationToken = token || new CancellationToken();
    
    this.cleanupPromise = this.executeCleanup(cancellationToken);
    
    try {
      await this.cleanupPromise;
    } finally {
      this.isCleaningUp = false;
      this.cleanupPromise = undefined;
    }
  }

  /**
   * Execute cleanup handlers in priority order
   */
  private async executeCleanup(token: CancellationToken): Promise<void> {
    this.logger.info('Starting cleanup process...');
    
    // Sort handlers by priority (descending)
    const sortedHandlers = Array.from(this.handlers.values()).sort(
      (a, b) => b.options.priority - a.options.priority
    );
    
    const results = await Promise.allSettled(
      sortedHandlers.map(handler => this.executeHandler(handler, token))
    );
    
    // Log results
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      const handler = sortedHandlers[index];
      if (result.status === 'fulfilled') {
        successCount++;
        this.logger.debug(`✓ ${handler.options.name} completed`);
      } else {
        errorCount++;
        this.logger.error(`✗ ${handler.options.name} failed:`, result.reason);
      }
    });
    
    this.logger.info(
      `Cleanup completed: ${successCount} succeeded, ${errorCount} failed`
    );
  }

  /**
   * Execute a single cleanup handler
   */
  private async executeHandler(
    handler: CleanupHandler,
    token: CancellationToken
  ): Promise<void> {
    const handlerToken = token.createChild({
      timeout: handler.options.timeout,
    });
    
    try {
      await Promise.race([
        handler.handler(handlerToken),
        handlerToken.waitForCancellation().then(() => {
          throw new Error(`Cleanup handler '${handler.options.name}' timed out`);
        }),
      ]);
    } catch (error) {
      if (!handler.options.continueOnError) {
        throw error;
      }
      // Error already logged in executeCleanup
    } finally {
      handlerToken.dispose();
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, initiating graceful shutdown...`);
        
        // Create a token with 10 second timeout for cleanup
        const token = new CancellationToken({ timeout: 10000 });
        
        try {
          await this.cleanup(token);
          process.exit(0);
        } catch (error) {
          this.logger.error('Cleanup failed:', error);
          process.exit(1);
        }
      });
    });
    
    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught exception:', error);
      
      const token = new CancellationToken({ timeout: 5000 });
      
      try {
        await this.cleanup(token);
      } catch (cleanupError) {
        this.logger.error('Cleanup after uncaught exception failed:', cleanupError);
      }
      
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      
      const token = new CancellationToken({ timeout: 5000 });
      
      try {
        await this.cleanup(token);
      } catch (cleanupError) {
        this.logger.error('Cleanup after unhandled rejection failed:', cleanupError);
      }
      
      process.exit(1);
    });
  }

  /**
   * Clear all handlers (mainly for testing)
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of registered handlers
   */
  get size(): number {
    return this.handlers.size;
  }
}

/**
 * Global cleanup registry instance
 */
export const cleanupRegistry = CleanupRegistry.getInstance();

/**
 * Decorator for registering a method as a cleanup handler
 */
export function Cleanup(options?: CleanupOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor?: PropertyDescriptor
  ) {
    // Handle different decorator scenarios
    if (!descriptor) {
      // This might be a property decorator or legacy decorator
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }
    
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new Error('Cleanup decorator can only be applied to methods');
    }
    
    const originalMethod = descriptor.value;
    
    // Register cleanup on first call
    let registered = false;
    let handlerId: string;
    
    descriptor.value = function (...args: any[]) {
      if (!registered) {
        registered = true;
        handlerId = cleanupRegistry.register(
          originalMethod.bind(this),
          {
            ...options,
            name: options?.name || `${target.constructor.name}.${propertyKey}`,
          }
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Scoped cleanup handler for temporary resources
 */
export class ScopedCleanup {
  private handlers: Array<() => void | Promise<void>> = [];
  private disposed = false;

  /**
   * Add a cleanup handler
   */
  add(handler: () => void | Promise<void>): void {
    if (this.disposed) {
      throw new Error('Cannot add handler to disposed ScopedCleanup');
    }
    this.handlers.push(handler);
  }

  /**
   * Execute all cleanup handlers
   */
  async cleanup(): Promise<void> {
    if (this.disposed) {
      return;
    }
    
    this.disposed = true;
    
    // Execute in reverse order (LIFO)
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      try {
        await this.handlers[i]();
      } catch (error) {
        console.error('Error in scoped cleanup handler:', error);
      }
    }
    
    this.handlers = [];
  }

  /**
   * Use with async/await and automatic cleanup
   */
  static async use<T>(
    fn: (cleanup: ScopedCleanup) => Promise<T>
  ): Promise<T> {
    const cleanup = new ScopedCleanup();
    try {
      return await fn(cleanup);
    } finally {
      await cleanup.cleanup();
    }
  }
}