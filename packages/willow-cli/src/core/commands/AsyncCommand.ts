/**
 * Base class for async commands with cancellation support
 */

import { Command } from 'commander';
import { BaseCommand, CommandMetadata } from './BaseCommand.js';
import { IAsyncCommand, ICommandProgress } from './CommandInterface.js';
import { CommandContext } from './CommandRegistry.js';
import { CommandResult } from '../../types/cli.js';

/**
 * Async command base class with cancellation and progress tracking
 */
export abstract class AsyncCommand<TOptions = any> 
  extends BaseCommand<TOptions> 
  implements IAsyncCommand<TOptions> {
  
  private abortController: AbortController | null = null;
  private progressData: ICommandProgress = {
    current: 0,
    total: 0,
    message: 'Initializing...'
  };
  private cancellationHandlers: Array<() => Promise<void>> = [];
  protected signal: AbortSignal | null = null;

  constructor(metadata: CommandMetadata) {
    super(metadata);
    this.setupSignalHandlers();
  }

  /**
   * Setup process signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const handleSignal = async (signal: string) => {
      console.log(`\nReceived ${signal}, cancelling operation...`);
      await this.cancel();
      process.exit(0);
    };

    process.once('SIGINT', () => handleSignal('SIGINT'));
    process.once('SIGTERM', () => handleSignal('SIGTERM'));
  }

  /**
   * Check if the command supports cancellation
   */
  isCancellable(): boolean {
    return true;
  }

  /**
   * Cancel the command execution
   */
  async cancel(): Promise<void> {
    if (this.abortController && !this.abortController.signal.aborted) {
      // Run cancellation handlers
      for (const handler of this.cancellationHandlers) {
        try {
          await handler();
        } catch (error) {
          console.error('Error in cancellation handler:', error);
        }
      }

      // Abort the operation
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Get execution progress
   */
  getProgress(): ICommandProgress {
    return { ...this.progressData };
  }

  /**
   * Update progress
   */
  protected updateProgress(progress: Partial<ICommandProgress>): void {
    this.progressData = {
      ...this.progressData,
      ...progress
    };
  }

  /**
   * Register a cancellation handler
   */
  protected onCancel(handler: () => Promise<void>): void {
    this.cancellationHandlers.push(handler);
  }

  /**
   * Check if operation is cancelled
   */
  protected isCancelled(): boolean {
    return this.signal?.aborted || false;
  }

  /**
   * Throw if cancelled
   */
  protected throwIfCancelled(): void {
    if (this.isCancelled()) {
      throw new Error('Operation cancelled');
    }
  }

  /**
   * Execute with cancellation support
   */
  async execute(context: CommandContext, options: TOptions, ...args: any[]): Promise<CommandResult> {
    // Create new abort controller for this execution
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    this.cancellationHandlers = [];
    this.progressData = {
      current: 0,
      total: 0,
      message: 'Starting...'
    };

    try {
      // Add abort signal listener
      this.signal.addEventListener('abort', () => {
        context.logger.warn('Operation cancelled by user');
      });

      // Execute the async operation
      return await this.executeAsync(context, options, ...args);

    } finally {
      // Cleanup
      this.abortController = null;
      this.signal = null;
      this.cancellationHandlers = [];
    }
  }

  /**
   * Execute the async command - to be implemented by subclasses
   */
  protected abstract executeAsync(
    context: CommandContext, 
    options: TOptions, 
    ...args: any[]
  ): Promise<CommandResult>;

  /**
   * Helper method for interruptible operations
   */
  protected async runInterruptible<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    cleanup?: () => Promise<void>
  ): Promise<T> {
    if (!this.signal) {
      throw new Error('No abort signal available');
    }

    if (cleanup) {
      this.onCancel(cleanup);
    }

    try {
      return await operation(this.signal);
    } catch (error) {
      if (this.isCancelled()) {
        throw new Error('Operation cancelled');
      }
      throw error;
    }
  }

  /**
   * Helper method for progress-tracked operations
   */
  protected async withProgress<T>(
    total: number,
    operation: (updateProgress: (current: number, message?: string) => void) => Promise<T>
  ): Promise<T> {
    this.updateProgress({ total, current: 0 });

    const updateProgressFn = (current: number, message?: string) => {
      this.throwIfCancelled();
      this.updateProgress({ current, message });
    };

    return await operation(updateProgressFn);
  }

  /**
   * Helper for chunked operations with progress
   */
  protected async processInChunks<T, R>(
    items: T[],
    chunkSize: number,
    processor: (chunk: T[], chunkIndex: number) => Promise<R[]>,
    progressMessage?: (processed: number, total: number) => string
  ): Promise<R[]> {
    const results: R[] = [];
    const totalChunks = Math.ceil(items.length / chunkSize);

    await this.withProgress(items.length, async (updateProgress) => {
      for (let i = 0; i < totalChunks; i++) {
        this.throwIfCancelled();

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, items.length);
        const chunk = items.slice(start, end);

        const chunkResults = await processor(chunk, i);
        results.push(...chunkResults);

        const processed = end;
        const message = progressMessage 
          ? progressMessage(processed, items.length)
          : `Processing... ${processed}/${items.length}`;
        
        updateProgress(processed, message);
      }
    });

    return results;
  }

  /**
   * Helper for retryable operations
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      backoff?: number;
      shouldRetry?: (error: Error) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 2,
      shouldRetry = () => true
    } = options;

    let lastError: Error;
    let currentDelay = delay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      this.throwIfCancelled();

      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries || !shouldRetry(lastError)) {
          throw lastError;
        }

        // Wait before retry
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, currentDelay);
          this.onCancel(async () => {
            clearTimeout(timeout);
            resolve(undefined);
          });
        });

        currentDelay *= backoff;
      }
    }

    throw lastError!;
  }
}