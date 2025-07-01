/**
 * Terminal Manager for handling cleanup and signals
 */

import { ProgressReporter } from './ProgressReporter.js';
import { InteractivePrompts } from './InteractivePrompts.js';

export class TerminalManager {
  private static instance: TerminalManager;
  private cleanupHandlers: Array<() => void | Promise<void>> = [];
  private isCleaningUp = false;

  private constructor() {
    this.setupSignalHandlers();
  }

  static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  /**
   * Register a cleanup handler
   */
  registerCleanupHandler(handler: () => void | Promise<void>): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'] as const;
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        await this.cleanup();
        process.exit(signal === 'SIGINT' ? 130 : 1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('\nUnexpected error:', error.message);
      await this.cleanup();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason) => {
      console.error('\nUnhandled promise rejection:', reason);
      await this.cleanup();
      process.exit(1);
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
  private async cleanup(): Promise<void> {
    if (this.isCleaningUp) {
      return;
    }

    this.isCleaningUp = true;

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

    // Run registered cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (error) {
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