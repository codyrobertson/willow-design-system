/**
 * Logger Implementation
 */

import { Logger } from './index';

/**
 * Log levels
 */
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
  constructor(private level: LogLevel = LogLevel.INFO) {}

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Silent logger that doesn't output anything
 */
export class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Memory logger that stores messages in memory
 */
export class MemoryLogger implements Logger {
  private messages: Array<{ level: string; message: string; args: any[]; timestamp: Date }> = [];

  debug(message: string, ...args: any[]): void {
    this.messages.push({ level: 'DEBUG', message, args, timestamp: new Date() });
  }

  info(message: string, ...args: any[]): void {
    this.messages.push({ level: 'INFO', message, args, timestamp: new Date() });
  }

  warn(message: string, ...args: any[]): void {
    this.messages.push({ level: 'WARN', message, args, timestamp: new Date() });
  }

  error(message: string, ...args: any[]): void {
    this.messages.push({ level: 'ERROR', message, args, timestamp: new Date() });
  }

  /**
   * Get all logged messages
   */
  getMessages(): Array<{ level: string; message: string; args: any[]; timestamp: Date }> {
    return [...this.messages];
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Get messages by level
   */
  getMessagesByLevel(level: string): Array<{ level: string; message: string; args: any[]; timestamp: Date }> {
    return this.messages.filter(m => m.level === level);
  }
}