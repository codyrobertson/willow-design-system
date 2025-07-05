/**
 * Simple Logger for Willow CLI
 * Handles console output with color and formatting
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level?: LogLevel;
  color?: boolean;
  prefix?: string;
}

export class Logger {
  private level: LogLevel;
  private useColor: boolean;
  private prefix: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.useColor = options.color !== false;
    this.prefix = options.prefix || '[willow]';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private format(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 
      ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`
      : message;

    if (!this.useColor) {
      return `${timestamp} ${this.prefix} ${level.toUpperCase()} ${formattedMessage}`;
    }

    const coloredLevel = {
      debug: chalk.gray(level.toUpperCase()),
      info: chalk.blue(level.toUpperCase()),
      warn: chalk.yellow(level.toUpperCase()),
      error: chalk.red(level.toUpperCase())
    }[level];

    const coloredPrefix = chalk.gray(this.prefix);
    const coloredTime = chalk.gray(timestamp);

    return `${coloredTime} ${coloredPrefix} ${coloredLevel} ${formattedMessage}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.log(this.format('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.log(this.format('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(this.format('warn', message, ...args));
    }
  }

  error(message: string | Error, ...args: any[]): void {
    if (this.shouldLog('error')) {
      if (message instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(this.format('error', message.message, ...args));
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.error(message.stack);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(this.format('error', message, ...args));
      }
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const formatted = args.length > 0 
        ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`
        : message;
      // eslint-disable-next-line no-console
      console.log(this.useColor ? chalk.green(`✓ ${formatted}`) : `✓ ${formatted}`);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Create default logger instance
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}