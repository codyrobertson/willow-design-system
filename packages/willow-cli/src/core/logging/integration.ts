/**
 * Integration layer between new logging framework and existing Logger
 */

import { Logger as UILogger, LoggerOptions } from '../../ui/Logger.js';
import { Logger as CoreLogger, getGlobalLogger } from './Logger.js';
import { LogLevel, LogFormat, LogDestination, LoggerConfig } from './types.js';
import { CLIErrorCode } from '../../types/cli.js';

/**
 * Enhanced UI Logger that integrates with the core logging framework
 */
export class EnhancedUILogger extends UILogger {
  private coreLogger: CoreLogger;
  
  constructor(options: LoggerOptions & Partial<Pick<LoggerConfig, 'customTransports' | 'destinations'>> = {}) {
    super(options);
    
    // Create core logger with matching configuration
    const coreConfig: Partial<LoggerConfig> = {
      level: this.mapLogLevel(options.level || 'info'),
      format: options.json ? LogFormat.JSON : LogFormat.PRETTY,
      destinations: options.destinations || this.determineDestinations(options),
      enableColors: options.colors !== false,
      enableTimestamps: options.timestamp || false,
      customTransports: options.customTransports,
    };
    
    this.coreLogger = getGlobalLogger(coreConfig);
  }
  
  /**
   * Override debug method to use core logger
   */
  debug(...args: any[]): void {
    const message = this.formatArgs(args);
    this.coreLogger.debug(message);
    super.debug(...args); // Maintain UI output
  }
  
  /**
   * Override info method to use core logger
   */
  info(...args: any[]): void {
    const message = this.formatArgs(args);
    this.coreLogger.info(message);
    super.info(...args);
  }
  
  /**
   * Override warn method to use core logger
   */
  warn(...args: any[]): void {
    const message = this.formatArgs(args);
    this.coreLogger.warn(message);
    super.warn(...args);
  }
  
  /**
   * Override error method to use core logger
   */
  error(...args: any[]): void {
    const message = this.formatArgs(args);
    this.coreLogger.error(message);
    super.error(...args);
  }
  
  /**
   * Log with performance tracking
   */
  timedInfo(message: string, operation: () => void | Promise<void>): void | Promise<void> {
    const timerId = `operation-${Date.now()}`;
    this.coreLogger.time(timerId);
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        this.coreLogger.timeEnd(timerId, { message });
        this.info(message);
      });
    } else {
      this.coreLogger.timeEnd(timerId, { message });
      this.info(message);
    }
  }
  
  /**
   * Start an operation with context tracking
   */
  startOperation(operation: string): string {
    return this.coreLogger.startOperation(operation);
  }
  
  /**
   * End an operation
   */
  endOperation(operationId: string): void {
    this.coreLogger.endOperation(operationId);
  }
  
  /**
   * Create a child logger with context
   */
  child(prefix: string): EnhancedUILogger {
    const childUILogger = super.child(prefix);
    const childLogger = new EnhancedUILogger(childUILogger['options']);
    childLogger.coreLogger = this.coreLogger.child({ prefix });
    return childLogger;
  }
  
  /**
   * Log error with code and structured data
   */
  errorWithCode(code: CLIErrorCode, message: string, details?: string): void {
    this.coreLogger.error(message, {
      code,
      details,
      tags: ['cli-error'],
    });
    super.errorWithCode(code, message, details);
  }
  
  /**
   * Get the core logger instance
   */
  getCoreLogger(): CoreLogger {
    return this.coreLogger;
  }
  
  /**
   * Format arguments into a single message
   */
  private formatArgs(args: any[]): string {
    return args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
  }
  
  /**
   * Map UI logger level to core logger level
   */
  private mapLogLevel(level: string): LogLevel {
    const levelMap: Record<string, LogLevel> = {
      'debug': LogLevel.DEBUG,
      'info': LogLevel.INFO,
      'warn': LogLevel.WARN,
      'error': LogLevel.ERROR,
    };
    return levelMap[level] || LogLevel.INFO;
  }
  
  /**
   * Determine log destinations based on options
   */
  private determineDestinations(options: LoggerOptions): LogDestination[] {
    const destinations: LogDestination[] = [];
    
    // Always include console unless explicitly disabled
    if (process.env.LOG_CONSOLE !== 'false') {
      destinations.push(LogDestination.CONSOLE);
    }
    
    // Add file logging if configured
    if (process.env.LOG_FILE || process.env.LOG_TO_FILE === 'true') {
      destinations.push(LogDestination.FILE);
    }
    
    // Add syslog if configured
    if (process.env.LOG_SYSLOG === 'true') {
      destinations.push(LogDestination.SYSLOG);
    }
    
    return destinations.length > 0 ? destinations : [LogDestination.CONSOLE];
  }
}

/**
 * Factory function to create an enhanced logger with backward compatibility
 */
export function createEnhancedLogger(options?: LoggerOptions & Partial<Pick<LoggerConfig, 'customTransports' | 'destinations'>>): UILogger {
  if (process.env.USE_LEGACY_LOGGER === 'true') {
    return new UILogger(options);
  }
  return new EnhancedUILogger(options);
}

/**
 * Replace the global logger getter with enhanced version
 */
export function enhanceGlobalLogger(): void {
  const originalGetLogger = require('../../ui/Logger.js').getLogger;
  
  // Override the getLogger function
  require('../../ui/Logger.js').getLogger = function(options?: LoggerOptions): UILogger {
    return createEnhancedLogger(options);
  };
}

/**
 * Logging middleware for command execution
 */
export function createLoggingMiddleware(logger: CoreLogger) {
  return {
    /**
     * Before command execution
     */
    before: (commandName: string, args: any) => {
      const operationId = logger.startOperation(`command:${commandName}`, {
        args,
        timestamp: new Date(),
      });
      return { operationId };
    },
    
    /**
     * After command execution
     */
    after: (commandName: string, result: any, context: { operationId: string }) => {
      logger.endOperation(context.operationId, {
        success: true,
        result: result?.success,
      });
    },
    
    /**
     * On command error
     */
    error: (commandName: string, error: Error, context: { operationId: string }) => {
      logger.error(error, {
        command: commandName,
        context: { id: context.operationId, operation: `command:${commandName}` },
      });
      logger.endOperation(context.operationId, {
        success: false,
        error: error.message,
      });
    },
  };
}

/**
 * Configure logging from environment variables
 */
export function configureFromEnvironment(): Partial<LoggerConfig> {
  const config: Partial<LoggerConfig> = {};
  
  // Log level
  if (process.env.LOG_LEVEL) {
    const levelMap: Record<string, LogLevel> = {
      'debug': LogLevel.DEBUG,
      'info': LogLevel.INFO,
      'warn': LogLevel.WARN,
      'error': LogLevel.ERROR,
    };
    const level = process.env.LOG_LEVEL.toLowerCase();
    config.level = levelMap[level] || LogLevel.INFO;
  }
  
  // Log format
  if (process.env.LOG_FORMAT) {
    config.format = process.env.LOG_FORMAT as LogFormat;
  }
  
  // Destinations
  const destinations: LogDestination[] = [];
  if (process.env.LOG_CONSOLE !== 'false') {
    destinations.push(LogDestination.CONSOLE);
  }
  if (process.env.LOG_FILE) {
    destinations.push(LogDestination.FILE);
  }
  if (process.env.LOG_SYSLOG === 'true') {
    destinations.push(LogDestination.SYSLOG);
  }
  if (destinations.length > 0) {
    config.destinations = destinations;
  }
  
  // Other options
  if (process.env.LOG_NO_COLOR === 'true') {
    config.enableColors = false;
  }
  if (process.env.LOG_TIMESTAMPS === 'true') {
    config.enableTimestamps = true;
  }
  if (process.env.LOG_CONTEXT === 'false') {
    config.contextTracking = false;
  }
  if (process.env.LOG_PERFORMANCE === 'false') {
    config.performanceTracking = false;
  }
  
  // File options
  if (process.env.LOG_MAX_FILE_SIZE) {
    config.maxFileSize = parseInt(process.env.LOG_MAX_FILE_SIZE, 10);
  }
  if (process.env.LOG_MAX_FILES) {
    config.maxFiles = parseInt(process.env.LOG_MAX_FILES, 10);
  }
  
  // Syslog options
  if (process.env.LOG_SYSLOG_HOST) {
    config.syslogHost = process.env.LOG_SYSLOG_HOST;
  }
  if (process.env.LOG_SYSLOG_PORT) {
    config.syslogPort = parseInt(process.env.LOG_SYSLOG_PORT, 10);
  }
  if (process.env.LOG_SYSLOG_PROTOCOL) {
    config.syslogProtocol = process.env.LOG_SYSLOG_PROTOCOL as 'tcp' | 'udp';
  }
  
  return config;
}