/**
 * Cancellable Operation Wrapper
 * Provides utilities for making operations cancellable
 */

import { CancellationToken, CancellationError } from './CancellationToken.js';
import { ScopedCleanup } from './CleanupHandler.js';
import { ProgressReporter } from '../../ui/ProgressReporter.js';

export interface CancellableOptions {
  /** Cancellation token */
  token?: CancellationToken;
  /** Progress reporter for tracking */
  progress?: ProgressReporter;
  /** Checkpoint interval in milliseconds */
  checkpointInterval?: number;
  /** Enable automatic rollback on cancellation */
  enableRollback?: boolean;
}

export interface Checkpoint {
  /** Unique ID for this checkpoint */
  id: string;
  /** Description of the checkpoint */
  description: string;
  /** Data associated with this checkpoint */
  data?: any;
  /** Timestamp when checkpoint was created */
  timestamp: Date;
}

export interface RollbackHandler {
  /** Checkpoint ID this handler is for */
  checkpointId: string;
  /** Rollback function */
  handler: () => void | Promise<void>;
}

/**
 * Base class for cancellable operations
 */
export abstract class CancellableOperation<T> {
  protected token: CancellationToken;
  protected progress?: ProgressReporter;
  protected checkpoints: Checkpoint[] = [];
  protected rollbackHandlers: RollbackHandler[] = [];
  protected cleanup: ScopedCleanup;
  private checkpointInterval: number;
  private lastCheckTime: number = Date.now();
  private _isCompleted = false;
  private _result?: T;
  private _error?: Error;

  constructor(options: CancellableOptions = {}) {
    this.token = options.token || CancellationToken.none;
    this.progress = options.progress;
    this.checkpointInterval = options.checkpointInterval || 100;
    this.cleanup = new ScopedCleanup();
    
    // Register cleanup for rollback if enabled
    if (options.enableRollback) {
      this.cleanup.add(() => this.rollback());
    }
  }

  /**
   * Execute the operation
   */
  async execute(): Promise<T> {
    try {
      // Check if already cancelled
      this.token.throwIfCancelled();
      
      // Start progress if available
      if (this.progress) {
        this.progress.start(this.getOperationName());
      }
      
      // Execute the operation
      const result = await this.token.race(this.performOperation());
      
      this._isCompleted = true;
      this._result = result;
      
      // Stop progress on success
      if (this.progress) {
        this.progress.succeed(this.getSuccessMessage());
      }
      
      return result;
      
    } catch (error) {
      this._error = error as Error;
      
      // Handle cancellation
      if (CancellationError.is(error)) {
        if (this.progress) {
          this.progress.warn('Operation cancelled');
        }
        
        // Perform rollback if needed
        if (this.rollbackHandlers.length > 0) {
          await this.rollback();
        }
      } else {
        // Handle other errors
        if (this.progress) {
          this.progress.fail(this.getErrorMessage(error as Error));
        }
      }
      
      throw error;
      
    } finally {
      // Always cleanup
      await this.cleanup.cleanup();
    }
  }

  /**
   * Perform the actual operation (to be implemented by subclasses)
   */
  protected abstract performOperation(): Promise<T>;

  /**
   * Get operation name for progress reporting
   */
  protected abstract getOperationName(): string;

  /**
   * Get success message
   */
  protected getSuccessMessage(): string {
    return `${this.getOperationName()} completed successfully`;
  }

  /**
   * Get error message
   */
  protected getErrorMessage(error: Error): string {
    return `${this.getOperationName()} failed: ${error.message}`;
  }

  /**
   * Check for cancellation (should be called periodically)
   */
  protected checkCancellation(): void {
    this.token.throwIfCancelled();
    
    // Update progress if enough time has passed
    const now = Date.now();
    if (this.progress && now - this.lastCheckTime > this.checkpointInterval) {
      this.lastCheckTime = now;
      const checkpoint = this.checkpoints[this.checkpoints.length - 1];
      if (checkpoint) {
        this.progress.update(checkpoint.description);
      }
    }
  }

  /**
   * Create a checkpoint
   */
  protected createCheckpoint(id: string, description: string, data?: any): void {
    const checkpoint: Checkpoint = {
      id,
      description,
      data,
      timestamp: new Date(),
    };
    
    this.checkpoints.push(checkpoint);
    
    // Check for cancellation at each checkpoint
    this.checkCancellation();
  }

  /**
   * Register a rollback handler for a checkpoint
   */
  protected registerRollback(
    checkpointId: string,
    handler: () => void | Promise<void>
  ): void {
    this.rollbackHandlers.push({
      checkpointId,
      handler,
    });
  }

  /**
   * Perform rollback to a specific checkpoint (or all if not specified)
   */
  protected async rollback(toCheckpointId?: string): Promise<void> {
    if (this.progress) {
      this.progress.start('Rolling back operation...');
    }
    
    try {
      // Find the checkpoint index to rollback to
      let rollbackToIndex = 0;
      if (toCheckpointId) {
        const index = this.checkpoints.findIndex(cp => cp.id === toCheckpointId);
        if (index >= 0) {
          rollbackToIndex = index;
        }
      }
      
      // Get handlers to execute (in reverse order)
      const handlersToExecute = this.rollbackHandlers
        .filter(handler => {
          const checkpointIndex = this.checkpoints.findIndex(
            cp => cp.id === handler.checkpointId
          );
          return checkpointIndex > rollbackToIndex;
        })
        .reverse();
      
      // Execute rollback handlers
      for (const handler of handlersToExecute) {
        try {
          await handler.handler();
        } catch (error) {
          console.error(`Rollback handler failed for checkpoint ${handler.checkpointId}:`, error);
        }
      }
      
      // Remove rolled back checkpoints and handlers
      this.checkpoints = this.checkpoints.slice(0, rollbackToIndex + 1);
      this.rollbackHandlers = this.rollbackHandlers.filter(handler => {
        const checkpointIndex = this.checkpoints.findIndex(
          cp => cp.id === handler.checkpointId
        );
        return checkpointIndex >= 0;
      });
      
      if (this.progress) {
        this.progress.succeed('Rollback completed');
      }
      
    } catch (error) {
      if (this.progress) {
        this.progress.fail('Rollback failed');
      }
      throw error;
    }
  }

  /**
   * Get current checkpoints
   */
  get currentCheckpoints(): ReadonlyArray<Checkpoint> {
    return [...this.checkpoints];
  }

  /**
   * Check if operation is completed
   */
  get isCompleted(): boolean {
    return this._isCompleted;
  }

  /**
   * Get operation result (if completed)
   */
  get result(): T | undefined {
    return this._result;
  }

  /**
   * Get operation error (if failed)
   */
  get error(): Error | undefined {
    return this._error;
  }
}

/**
 * Utility function to make any async function cancellable
 */
export async function cancellable<T>(
  fn: (token: CancellationToken) => Promise<T>,
  token?: CancellationToken
): Promise<T> {
  const cancellationToken = token || CancellationToken.none;
  return cancellationToken.race(fn(cancellationToken));
}

/**
 * Utility function to create a cancellable delay
 */
export function delay(ms: number, token?: CancellationToken): Promise<void> {
  const cancellationToken = token || CancellationToken.none;
  
  return new Promise<void>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    
    // Set up cancellation
    const unsubscribe = cancellationToken.onCancelled((reason) => {
      clearTimeout(timeoutId);
      reject(new CancellationError(reason.message, reason.code));
    });
    
    // Set up timeout
    timeoutId = setTimeout(() => {
      unsubscribe();
      resolve();
    }, ms);
  });
}

/**
 * Utility function to make fetch requests cancellable
 */
export async function cancellableFetch(
  url: string,
  options: RequestInit & { token?: CancellationToken } = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options;
  const cancellationToken = token || CancellationToken.none;
  
  // Use the token's abort signal
  const response = await fetch(url, {
    ...fetchOptions,
    signal: cancellationToken.abortSignal,
  });
  
  return response;
}

/**
 * Example implementation of a cancellable file download operation
 */
export class CancellableDownload extends CancellableOperation<Buffer> {
  constructor(
    private url: string,
    options: CancellableOptions = {}
  ) {
    super({ enableRollback: true, ...options });
  }

  protected getOperationName(): string {
    return `Downloading ${this.url}`;
  }

  protected async performOperation(): Promise<Buffer> {
    this.createCheckpoint('start', 'Starting download');
    
    // Make cancellable fetch request
    const response = await cancellableFetch(this.url, {
      token: this.token,
    });
    
    this.createCheckpoint('response', 'Received response');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Read response body with cancellation checks
    const chunks: Uint8Array[] = [];
    const reader = response.body!.getReader();
    let totalBytes = 0;
    
    try {
      while (true) {
        this.checkCancellation();
        
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        totalBytes += value.length;
        
        this.createCheckpoint(
          `chunk-${chunks.length}`,
          `Downloaded ${totalBytes} bytes`
        );
      }
    } finally {
      reader.releaseLock();
    }
    
    // Combine chunks into buffer
    const buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    
    this.createCheckpoint('complete', 'Download complete');
    
    return buffer;
  }
}