/**
 * Progress Reporting System for CLI Operations
 */

import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { ProgressEvent, ProgressEventType } from '../types/cli.js';

export interface ProgressReporterOptions {
  verbose?: boolean;
  quiet?: boolean;
  noColor?: boolean;
  json?: boolean;
}

export class ProgressReporter {
  private spinner: Ora | null = null;
  private options: ProgressReporterOptions;
  private startTime: number = 0;
  private events: ProgressEvent[] = [];
  
  constructor(options: ProgressReporterOptions = {}) {
    this.options = options;
    
    if (options.noColor) {
      chalk.level = 0;
    }
  }

  /**
   * Start a new operation
   */
  start(message: string): void {
    this.startTime = Date.now();
    this.events = [];
    
    if (this.options.json) {
      this.logJSON({ type: 'start', message });
      return;
    }
    
    if (this.options.quiet) return;
    
    this.spinner = ora({
      text: message,
      spinner: 'dots',
      color: 'cyan',
    }).start();
  }

  /**
   * Update progress
   */
  progress(message: string, current?: number, total?: number): void {
    const event: ProgressEvent = {
      type: 'progress',
      message,
      progress: current,
      total,
    };
    
    this.events.push(event);
    
    if (this.options.json) {
      this.logJSON(event);
      return;
    }
    
    if (this.options.quiet) return;
    
    let text = message;
    if (current !== undefined && total !== undefined) {
      const percentage = Math.round((current / total) * 100);
      text = `${message} ${chalk.cyan(`[${current}/${total}]`)} ${chalk.gray(`${percentage}%`)}`;
    }
    
    if (this.spinner) {
      this.spinner.text = text;
    } else {
      // eslint-disable-next-line no-console
      console.log(chalk.cyan('↻'), text);
    }
  }

  /**
   * Complete the operation successfully
   */
  succeed(message?: string): void {
    const duration = Date.now() - this.startTime;
    const finalMessage = message || 'Complete';
    
    const event: ProgressEvent = {
      type: 'complete',
      message: finalMessage,
      metadata: { duration },
    };
    
    this.events.push(event);
    
    if (this.options.json) {
      this.logJSON(event);
      return;
    }
    
    if (this.options.quiet) return;
    
    if (this.spinner) {
      this.spinner.succeed(finalMessage);
      this.spinner = null;
    } else {
      // eslint-disable-next-line no-console
      console.log(chalk.green('✓'), finalMessage);
    }
    
    if (this.options.verbose && duration > 0) {
      // eslint-disable-next-line no-console
      console.log(chalk.gray(`  Duration: ${this.formatDuration(duration)}`));
    }
  }

  /**
   * Fail the operation
   */
  fail(message: string, error?: Error): void {
    const duration = Date.now() - this.startTime;
    
    const event: ProgressEvent = {
      type: 'error',
      message,
      metadata: { 
        duration,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      },
    };
    
    this.events.push(event);
    
    if (this.options.json) {
      this.logJSON(event);
      return;
    }
    
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    } else {
      // eslint-disable-next-line no-console
      console.error(chalk.red('✗'), message);
    }
    
    if (error && this.options.verbose) {
      // eslint-disable-next-line no-console
      console.error(chalk.gray(`  ${error.message}`));
      if (error.stack) {
        // eslint-disable-next-line no-console
        console.error(chalk.gray(error.stack.split('\n').map(line => `  ${line}`).join('\n')));
      }
    }
  }

  /**
   * Show a warning
   */
  warn(message: string): void {
    const event: ProgressEvent = {
      type: 'warning',
      message,
    };
    
    this.events.push(event);
    
    if (this.options.json) {
      this.logJSON(event);
      return;
    }
    
    if (this.options.quiet) return;
    
    if (this.spinner) {
      this.spinner.clear();
      // eslint-disable-next-line no-console
      console.warn(chalk.yellow('⚠'), chalk.yellow(message));
      this.spinner.render();
    } else {
      // eslint-disable-next-line no-console
      console.warn(chalk.yellow('⚠'), chalk.yellow(message));
    }
  }

  /**
   * Show info message
   */
  info(message: string): void {
    const event: ProgressEvent = {
      type: 'info',
      message,
    };
    
    this.events.push(event);
    
    if (this.options.json) {
      this.logJSON(event);
      return;
    }
    
    if (this.options.quiet) return;
    
    if (this.spinner) {
      this.spinner.clear();
      // eslint-disable-next-line no-console
      console.log(chalk.blue('ℹ'), message);
      this.spinner.render();
    } else {
      // eslint-disable-next-line no-console
      console.log(chalk.blue('ℹ'), message);
    }
  }

  /**
   * Stop the spinner without success/fail
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Clear the current line
   */
  clear(): void {
    if (this.spinner) {
      this.spinner.clear();
    }
  }

  /**
   * Log a step in a multi-step process
   */
  step(current: number, total: number, message: string): void {
    const prefix = chalk.gray(`[${current}/${total}]`);
    
    if (this.options.json) {
      this.logJSON({
        type: 'progress',
        message,
        progress: current,
        total,
      });
      return;
    }
    
    if (this.options.quiet) return;
    
    // eslint-disable-next-line no-console
    console.log(`${prefix} ${message}`);
  }

  /**
   * Create a tree-like output
   */
  tree(items: Array<{ name: string; children?: string[] }>): void {
    if (this.options.json) {
      this.logJSON({
        type: 'info',
        message: 'tree',
        metadata: { items },
      });
      return;
    }
    
    if (this.options.quiet) return;
    
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const prefix = isLast ? '└── ' : '├── ';
      
      // eslint-disable-next-line no-console
      console.log(chalk.gray(prefix) + item.name);
      
      if (item.children) {
        item.children.forEach((child, childIndex) => {
          const childIsLast = childIndex === item.children!.length - 1;
          const childPrefix = isLast ? '    ' : '│   ';
          const childBranch = childIsLast ? '└── ' : '├── ';
          
          // eslint-disable-next-line no-console
          console.log(chalk.gray(childPrefix + childBranch) + child);
        });
      }
    });
  }

  /**
   * Show a list with checkmarks
   */
  list(items: Array<{ name: string; status: 'done' | 'pending' | 'failed' }>): void {
    if (this.options.json) {
      this.logJSON({
        type: 'info',
        message: 'list',
        metadata: { items },
      });
      return;
    }
    
    if (this.options.quiet) return;
    
    items.forEach(item => {
      let icon: string;
      let color: typeof chalk;
      
      switch (item.status) {
        case 'done':
          icon = '✓';
          color = chalk.green;
          break;
        case 'failed':
          icon = '✗';
          color = chalk.red;
          break;
        default:
          icon = '◯';
          color = chalk.gray;
      }
      
      // eslint-disable-next-line no-console
      console.log(`  ${color(icon)} ${item.name}`);
    });
  }

  /**
   * Get all events (for testing/debugging)
   */
  getEvents(): ProgressEvent[] {
    return [...this.events];
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    return `${seconds}s`;
  }

  /**
   * Log JSON output
   */
  private logJSON(event: ProgressEvent): void {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    }));
  }
}

// Singleton instance for global use
let globalReporter: ProgressReporter | null = null;

export function getGlobalReporter(options?: ProgressReporterOptions): ProgressReporter {
  if (!globalReporter) {
    globalReporter = new ProgressReporter(options || {});
  }
  return globalReporter;
}

export function setGlobalReporterOptions(options: ProgressReporterOptions): void {
  globalReporter = new ProgressReporter(options);
}