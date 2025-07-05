/**
 * Terminal Manager for handling cleanup and signals
 */

import { ProgressReporter } from './ProgressReporter.js';
import { InteractivePrompts } from './InteractivePrompts.js';
import { cleanupRegistry, CancellationToken } from '../core/cancellation/index.js';

export class TerminalManager {
  private static instance: TerminalManager;
  private cleanupHandlers: Array<() => void | Promise<void>> = [];
  private isCleaningUp = false;

  private constructor() {
    this.setupSignalHandlers();
    this.registerWithCleanupRegistry();
  }

  static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  /**
   * Register a cleanup handler (legacy method - use cleanupRegistry instead)
   */
  registerCleanupHandler(handler: () => void | Promise<void>): void {
    this.cleanupHandlers.push(handler);
    
    // Also register with the new cleanup registry
    cleanupRegistry.register(() => handler(), {
      name: 'Legacy terminal handler',
      priority: 50,
    });
  }
  
  /**
   * Register terminal cleanup with the global registry
   */
  private registerWithCleanupRegistry(): void {
    cleanupRegistry.register(
      async (token: CancellationToken) => {
        await this.cleanup(token);
      },
      {
        name: 'TerminalManager',
        priority: 200, // High priority to ensure terminal cleanup happens early
        timeout: 5000,
      }
    );
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    // The cleanup registry already handles signal handlers,
    // but we keep these for backward compatibility and immediate response
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'] as const;
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        // Create a cancellation token with timeout
        const token = new CancellationToken({ timeout: 10000 });
        
        try {
          // Use the cleanup registry for coordinated cleanup
          await cleanupRegistry.cleanup(token);
          process.exit(signal === 'SIGINT' ? 130 : 1);
        } catch (error) {
          console.error('\nCleanup failed:', error);
          process.exit(1);
        }
      });
    });

    // Handle process exit
    process.on('exit', () => {
      // Synchronous cleanup only
      this.cleanupSync();
    });
  }

  /**
   * Perform cleanup operations
   */
  private async cleanup(token?: CancellationToken): Promise<void> {
    if (this.isCleaningUp) {
      return;
    }

    this.isCleaningUp = true;
    const cancellationToken = token || new CancellationToken({ timeout: 5000 });

    // Clean up progress reporter
    try {
      const progress = ProgressReporter.getInstance();
      progress.stop();
    } catch {}

    // Clean up prompts
    try {
      const prompts = InteractivePrompts.getInstance();
      // Any prompt cleanup if needed
    } catch {}

    // Run legacy cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        // Check for cancellation
        cancellationToken.throwIfCancelled();
        
        await cancellationToken.race(
          Promise.resolve(handler())
        );
      } catch (error) {
        if (cancellationToken.isCancelled) {
          break; // Stop processing handlers if cancelled
        }
        console.error('Cleanup handler error:', error);
      }
    }

    // Clear terminal formatting
    process.stdout.write('\x1b[0m\n');
  }

  /**
   * Synchronous cleanup for exit handler
   */
  private cleanupSync(): void {
    if (this.isCleaningUp) {
      return;
    }

    // Clear any terminal formatting
    process.stdout.write('\x1b[0m');
  }

  /**
   * Check if terminal supports colors
   */
  static supportsColor(): boolean {
    if (process.env.NO_COLOR) {
      return false;
    }

    if (process.env.FORCE_COLOR) {
      return true;
    }

    if (process.platform === 'win32') {
      return true; // Windows 10+ supports colors
    }

    return Boolean(process.stdout?.isTTY && process.env.TERM !== 'dumb');
  }

  /**
   * Check if terminal is interactive
   */
  static isInteractive(): boolean {
    return Boolean(process.stdout?.isTTY && process.stdin?.isTTY);
  }

  /**
   * Get terminal width
   */
  static getTerminalWidth(): number {
    return process.stdout?.columns || 80;
  }

  /**
   * Get terminal height
   */
  static getTerminalHeight(): number {
    return process.stdout?.rows || 24;
  }

  /**
   * Clear the terminal screen
   */
  static clear(): void {
    if (!this.isInteractive()) {
      return;
    }

    process.stdout.write('\x1bc');
  }

  /**
   * Move cursor to position
   */
  static moveCursor(x: number, y: number): void {
    if (!this.isInteractive()) {
      return;
    }

    process.stdout.write(`\x1b[${y};${x}H`);
  }

  /**
   * Hide cursor
   */
  static hideCursor(): void {
    if (!this.isInteractive()) {
      return;
    }

    process.stdout.write('\x1b[?25l');
  }

  /**
   * Show cursor
   */
  static showCursor(): void {
    if (!this.isInteractive()) {
      return;
    }

    process.stdout.write('\x1b[?25h');
  }
}

// Export singleton instance
export const terminalManager = TerminalManager.getInstance();