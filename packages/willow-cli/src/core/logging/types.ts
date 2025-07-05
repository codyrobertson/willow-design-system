/**
 * Logging Framework Type Definitions
 */

import { CLIErrorCode } from '../../types/cli.js';

/**
 * Log levels in ascending order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log format types
 */
export enum LogFormat {
  PLAIN = 'plain',
  JSON = 'json',
  PRETTY = 'pretty',
}

/**
 * Log output destinations
 */
export enum LogDestination {
  CONSOLE = 'console',
  FILE = 'file',
  SYSLOG = 'syslog',
  MEMORY = 'memory', // For testing
}

/**
 * Log entry metadata
 */
export interface LogMetadata {
  timestamp: Date;
  level: LogLevel;
  context?: LogContext;
  error?: Error;
  code?: CLIErrorCode;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Log context for tracking operations
 */
export interface LogContext {
  id: string;
  operation: string;
  parentId?: string;
  startTime: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  metadata: LogMetadata;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  destinations: LogDestination[];
  enableColors?: boolean;
  enableTimestamps?: boolean;
  contextTracking?: boolean;
  performanceTracking?: boolean;
  maxFileSize?: number;
  maxFiles?: number;
  syslogHost?: string;
  syslogPort?: number;
  syslogProtocol?: 'tcp' | 'udp';
  customFormatters?: Record<string, LogFormatter>;
  customTransports?: Record<string, LogTransport>;
}

/**
 * Log formatter interface
 */
export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * Log transport interface for different destinations
 */
export interface LogTransport {
  write(entry: LogEntry): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Logger interface
 */
export interface ILogger {
  // Basic logging methods
  debug(message: string, metadata?: Partial<LogMetadata>): void;
  info(message: string, metadata?: Partial<LogMetadata>): void;
  warn(message: string, metadata?: Partial<LogMetadata>): void;
  error(message: string | Error, metadata?: Partial<LogMetadata>): void;

  // Context management
  withContext(context: Partial<LogContext>): ILogger;
  startOperation(operation: string, metadata?: Record<string, unknown>): string;
  endOperation(operationId: string, metadata?: Record<string, unknown>): void;

  // Performance tracking
  time(label: string): void;
  timeEnd(label: string, metadata?: Record<string, unknown>): void;
  timeLog(label: string, message?: string): void;

  // Child loggers
  child(metadata: Partial<LogMetadata>): ILogger;

  // Configuration
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;

  // Utilities
  flush(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Log filter for querying logs
 */
export interface LogFilter {
  levels?: LogLevel[];
  startTime?: Date;
  endTime?: Date;
  contextId?: string;
  operation?: string;
  tags?: string[];
  search?: string;
}

/**
 * Log query result
 */
export interface LogQueryResult {
  entries: LogEntry[];
  total: number;
  hasMore: boolean;
}