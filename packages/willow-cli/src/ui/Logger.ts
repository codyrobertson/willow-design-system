/**
 * Enhanced Logger for CLI Output
 */

import chalk from 'chalk';
import { CLIErrorCode } from '../types/cli.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
  json?: boolean;
}

export class Logger {
  private options: Required<LoggerOptions>;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level || 'info',
      prefix: options.prefix || '',
      timestamp: options.timestamp || false,
      colors: options.colors !== false,
      json: options.json || false,
    };

    if (!this.options.colors) {
      chalk.level = 0;
    }
  }

  /**
   * Debug level logging
   */
  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      if (this.options.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
          level: 'debug',
          message: args.join(' '),
          timestamp: new Date().toISOString(),
        }));
      } else {
        const message = this.formatMessage('debug', args);
        // eslint-disable-next-line no-console
        console.log(chalk.gray(message));
      }
    }
  }

  /**
   * Info level logging
   */
  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      if (this.options.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
          level: 'info',
          message: args.join(' '),
          timestamp: new Date().toISOString(),
        }));
      } else {
        const message = this.formatMessage('info', args);
        // eslint-disable-next-line no-console
        console.log(message);
      }
    }
  }

  /**
   * Warning level logging
   */
  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      if (this.options.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
          level: 'warn',
          message: args.join(' '),
          timestamp: new Date().toISOString(),
        }));
      } else {
        const message = this.formatMessage('warn', args);
        // eslint-disable-next-line no-console
        console.warn(chalk.yellow(message));
      }
    }
  }

  /**
   * Error level logging
   */
  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      if (this.options.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
          level: 'error',
          message: args.join(' '),
          timestamp: new Date().toISOString(),
        }));
      } else {
        const message = this.formatMessage('error', args);
        // eslint-disable-next-line no-console
        console.error(chalk.red(message));
      }
    }
  }

  /**
   * Success message
   */
  success(message: string): void {
    // eslint-disable-next-line no-console
    console.log(chalk.green('✓'), message);
  }

  /**
   * Failure message
   */
  fail(message: string): void {
    // eslint-disable-next-line no-console
    console.error(chalk.red('✗'), message);
  }

  /**
   * Log with custom styling
   */
  log(style: string, ...args: any[]): void {
    const message = args.join(' ');
    // eslint-disable-next-line no-console
    console.log(chalk.keyword(style)(message));
  }

  /**
   * Log code snippet
   */
  code(content: string, language?: string): void {
    if (this.options.json) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        type: 'code',
        content,
        language,
        timestamp: new Date().toISOString(),
      }));
    } else {
      // eslint-disable-next-line no-console
      console.log(chalk.gray('```' + (language || '')));
      // eslint-disable-next-line no-console
      console.log(chalk.cyan(content));
      // eslint-disable-next-line no-console
      console.log(chalk.gray('```'));
    }
  }

  /**
   * Create a child logger with additional prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.options,
      prefix: this.options.prefix ? `${this.options.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.options.level = level;
  }

  /**
   * Create a section header
   */
  section(title: string): void {
    // eslint-disable-next-line no-console
    console.log('\n' + chalk.bold.underline(title));
  }

  /**
   * Create a box around text
   */
  box(text: string, color: 'green' | 'yellow' | 'red' | 'blue' = 'blue'): void {
    const lines = text.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const boxColor = chalk[color];
    
    // eslint-disable-next-line no-console
    console.log(boxColor('┌' + '─'.repeat(maxLength + 2) + '┐'));
    lines.forEach(line => {
      // eslint-disable-next-line no-console
      console.log(boxColor('│ ') + line.padEnd(maxLength) + boxColor(' │'));
    });
    // eslint-disable-next-line no-console
    console.log(boxColor('└' + '─'.repeat(maxLength + 2) + '┘'));
  }

  /**
   * Create a table
   */
  table(headers: string[], rows: string[][]): void {
    const columnWidths = headers.map((header, index) => {
      const columnData = [header, ...rows.map(row => row[index] || '')];
      return Math.max(...columnData.map(cell => cell.length));
    });

    // Header
    // eslint-disable-next-line no-console
    console.log(
      headers
        .map((header, index) => chalk.bold(header.padEnd(columnWidths[index])))
        .join('  ')
    );
    
    // Separator
    // eslint-disable-next-line no-console
    console.log(
      columnWidths.map(width => '─'.repeat(width)).join('  ')
    );
    
    // Rows
    rows.forEach(row => {
      // eslint-disable-next-line no-console
      console.log(
        row
          .map((cell, index) => (cell || '').padEnd(columnWidths[index]))
          .join('  ')
      );
    });
  }

  /**
   * Log command usage
   */
  usage(command: string, description: string, examples?: string[]): void {
    // eslint-disable-next-line no-console
    console.log(chalk.bold('Usage:'));
    // eslint-disable-next-line no-console
    console.log(`  ${command}`);
    // eslint-disable-next-line no-console
    console.log();
    // eslint-disable-next-line no-console
    console.log(chalk.bold('Description:'));
    // eslint-disable-next-line no-console
    console.log(`  ${description}`);
    
    if (examples && examples.length > 0) {
      // eslint-disable-next-line no-console
      console.log();
      // eslint-disable-next-line no-console
      console.log(chalk.bold('Examples:'));
      examples.forEach(example => {
        // eslint-disable-next-line no-console
        console.log(`  ${chalk.gray('$')} ${example}`);
      });
    }
  }

  /**
   * Log error with code
   */
  errorWithCode(code: CLIErrorCode, message: string, details?: string): void {
    // eslint-disable-next-line no-console
    console.error(chalk.red(`✗ Error [${code}]: ${message}`));
    
    if (details) {
      // eslint-disable-next-line no-console
      console.error(chalk.gray(`  ${details}`));
    }
    
    // Provide helpful suggestions based on error code
    const suggestion = this.getErrorSuggestion(code);
    if (suggestion) {
      // eslint-disable-next-line no-console
      console.error();
      // eslint-disable-next-line no-console
      console.error(chalk.yellow('💡 Suggestion:'), suggestion);
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.options.level];
  }

  /**
   * Format message with prefix and timestamp
   */
  private formatMessage(level: LogLevel, args: any[]): string {
    const parts: string[] = [];
    
    if (this.options.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (this.options.prefix) {
      parts.push(`[${this.options.prefix}]`);
    }
    
    parts.push(...args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ));
    
    return parts.join(' ');
  }

  /**
   * Get error suggestion based on code
   */
  private getErrorSuggestion(code: CLIErrorCode): string | null {
    const suggestions: Record<CLIErrorCode, string> = {
      [CLIErrorCode.INVALID_ARGUMENTS]: 'Run with --help to see correct usage',
      [CLIErrorCode.COMPONENT_NOT_FOUND]: 'Run "willow list" to see available components',
      [CLIErrorCode.CONFIGURATION_ERROR]: 'Run "willow init" to create a valid configuration',
      [CLIErrorCode.NETWORK_ERROR]: 'Check your internet connection and try again',
      [CLIErrorCode.VALIDATION_ERROR]: 'Run "willow validate" to see what needs fixing',
      [CLIErrorCode.PERMISSION_ERROR]: 'Check file permissions or run with appropriate privileges',
      [CLIErrorCode.UNKNOWN_ERROR]: 'Try running with --verbose for more details',
    };
    
    return suggestions[code] || null;
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function getLogger(options?: LoggerOptions): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(options);
  }
  return globalLogger;
}

export function setLoggerOptions(options: LoggerOptions): void {
  globalLogger = new Logger(options);
}