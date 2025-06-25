/**
 * Logger implementation for transformers
 */

import { Logger } from './index';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(level: LogLevel = LogLevel.INFO, prefix: string = '') {
    this.level = level;
    this.prefix = prefix;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `${timestamp} [${level}] ${prefix}${message}`;
  }
}

/**
 * Null logger that discards all messages
 */
export class NullLogger implements Logger {
  debug(message: string, ...args: any[]): void {
    // No-op
  }

  info(message: string, ...args: any[]): void {
    // No-op
  }

  warn(message: string, ...args: any[]): void {
    // No-op
  }

  error(message: string, ...args: any[]): void {
    // No-op
  }
}

/**
 * Logger that writes to multiple loggers
 */
export class MultiLogger implements Logger {
  private loggers: Logger[];

  constructor(loggers: Logger[]) {
    this.loggers = loggers;
  }

  debug(message: string, ...args: any[]): void {
    this.loggers.forEach((logger) => logger.debug(message, ...args));
  }

  info(message: string, ...args: any[]): void {
    this.loggers.forEach((logger) => logger.info(message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    this.loggers.forEach((logger) => logger.warn(message, ...args));
  }

  error(message: string, ...args: any[]): void {
    this.loggers.forEach((logger) => logger.error(message, ...args));
  }
}

/**
 * Logger factory
 */
export class LoggerFactory {
  private static defaultLevel = LogLevel.INFO;

  static createLogger(type: 'console' | 'null' = 'console', options?: any): Logger {
    switch (type) {
      case 'console':
        return new ConsoleLogger(
          options?.level ?? this.defaultLevel,
          options?.prefix ?? ''
        );
      case 'null':
        return new NullLogger();
      default:
        throw new Error(`Unknown logger type: ${type}`);
    }
  }

  static setDefaultLevel(level: LogLevel): void {
    this.defaultLevel = level;
  }
}