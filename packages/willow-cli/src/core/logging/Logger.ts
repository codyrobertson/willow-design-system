/**
 * Core Logger Implementation
 */

import { EventEmitter } from 'events';
import {
  ILogger,
  LogLevel,
  LogEntry,
  LogMetadata,
  LogContext,
  LoggerConfig,
  LogTransport,
  LogFormatter,
  LogFormat,
  LogDestination,
} from './types.js';
import { FormatterFactory } from './formatters.js';
import { TransportFactory, ConsoleTransport, FileTransport, MultiTransport } from './transports.js';
import { globalContextManager, performanceTracker } from './context.js';
import { CLIError, CLIErrorCode } from '../../types/cli.js';

/**
 * Thread-safe logger implementation
 */
export class Logger extends EventEmitter implements ILogger {
  private config: LoggerConfig;
  private transport: LogTransport;
  private metadata: Partial<LogMetadata> = {};
  private contextManager = globalContextManager;
  private performanceTracker = performanceTracker;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    super();
    
    this.config = {
      level: config.level ?? LogLevel.INFO,
      format: config.format ?? LogFormat.PRETTY,
      destinations: config.destinations ?? [LogDestination.CONSOLE],
      enableColors: config.enableColors ?? true,
      enableTimestamps: config.enableTimestamps ?? true,
      contextTracking: config.contextTracking ?? true,
      performanceTracking: config.performanceTracking ?? true,
      maxFileSize: config.maxFileSize,
      maxFiles: config.maxFiles,
      syslogHost: config.syslogHost,
      syslogPort: config.syslogPort,
      syslogProtocol: config.syslogProtocol,
      customFormatters: config.customFormatters,
      customTransports: config.customTransports,
    };
    
    this.transport = this.createTransport();
  }
  
  /**
   * Log at debug level
   */
  debug(message: string, metadata?: Partial<LogMetadata>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  /**
   * Log at info level
   */
  info(message: string, metadata?: Partial<LogMetadata>): void {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  /**
   * Log at warn level
   */
  warn(message: string, metadata?: Partial<LogMetadata>): void {
    this.log(LogLevel.WARN, message, metadata);
  }
  
  /**
   * Log at error level
   */
  error(message: string | Error, metadata?: Partial<LogMetadata>): void {
    if (message instanceof Error) {
      const errorMetadata: Partial<LogMetadata> = {
        ...metadata,
        error: message,
      };
      
      // Extract CLIError code if available
      if (message instanceof CLIError) {
        errorMetadata.code = message.code;
      }
      
      this.log(LogLevel.ERROR, message.message, errorMetadata);
    } else {
      this.log(LogLevel.ERROR, message, metadata);
    }
  }
  
  /**
   * Create a child logger with additional metadata
   */
  child(metadata: Partial<LogMetadata>): ILogger {
    const childLogger = new Logger(this.config);
    childLogger.metadata = { ...this.metadata, ...metadata };
    childLogger.transport = this.transport; // Share transport
    return childLogger;
  }
  
  /**
   * Create a logger with a specific context
   */
  withContext(context: Partial<LogContext>): ILogger {
    const fullContext = this.contextManager.getGlobalManager().createContext(
      context.operation || 'unknown',
      context.parentId,
      context.metadata
    );
    
    return this.child({ context: fullContext });
  }
  
  /**
   * Start tracking an operation
   */
  startOperation(operation: string, metadata?: Record<string, unknown>): string {
    const context = this.contextManager.getGlobalManager().createContext(operation, undefined, metadata);
    this.contextManager.getGlobalManager().startContext(context);
    
    if (this.config.performanceTracking) {
      this.performanceTracker.start(context.id);
    }
    
    this.debug(`Starting operation: ${operation}`, { context });
    
    return context.id;
  }
  
  /**
   * End tracking an operation
   */
  endOperation(operationId: string, metadata?: Record<string, unknown>): void {
    const context = this.contextManager.getGlobalManager().endContext(operationId);
    
    if (context && this.config.performanceTracking) {
      const timing = this.performanceTracker.end(operationId);
      if (timing) {
        this.debug(`Completed operation: ${context.operation}`, {
          context,
          duration: timing.duration,
          ...metadata,
        });
      }
    }
  }
  
  /**
   * Start a performance timer
   */
  time(label: string): void {
    if (this.config.performanceTracking) {
      this.performanceTracker.start(label);
      this.debug(`Timer started: ${label}`);
    }
  }
  
  /**
   * End a performance timer
   */
  timeEnd(label: string, metadata?: Record<string, unknown>): void {
    if (this.config.performanceTracking) {
      const timing = this.performanceTracker.end(label);
      if (timing) {
        this.debug(`Timer ended: ${label}`, {
          duration: timing.duration,
          ...metadata,
        });
      }
    }
  }
  
  /**
   * Log the current time for a timer
   */
  timeLog(label: string, message?: string): void {
    if (this.config.performanceTracking) {
      const duration = this.performanceTracker.getDuration(label);
      if (duration !== undefined) {
        const msg = message ? `${label}: ${message}` : `Timer: ${label}`;
        this.debug(msg, { duration });
      }
    }
  }
  
  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.emit('levelChanged', level);
  }
  
  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
  
  /**
   * Flush all pending log entries
   */
  async flush(): Promise<void> {
    if (this.transport.flush) {
      await this.transport.flush();
    }
  }
  
  /**
   * Close the logger and clean up resources
   */
  async close(): Promise<void> {
    if (this.transport.close) {
      await this.transport.close();
    }
    this.contextManager.getGlobalManager().clear();
    this.performanceTracker.clear();
    this.removeAllListeners();
  }
  
  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: Partial<LogMetadata>): void {
    // Check if we should log this level
    if (level < this.config.level) {
      return;
    }
    
    // Build log entry
    const entry: LogEntry = {
      level,
      message,
      metadata: this.buildMetadata(level, metadata),
    };
    
    // Emit log event
    this.emit('log', entry);
    
    // Write to transport
    try {
      const result = this.transport.write(entry);
      if (result instanceof Promise) {
        result.catch(err => {
          console.error('Failed to write log entry:', err);
        });
      }
    } catch (err) {
      console.error('Failed to write log entry:', err);
    }
  }
  
  /**
   * Build complete metadata for a log entry
   */
  private buildMetadata(level: LogLevel, metadata?: Partial<LogMetadata>): LogMetadata {
    const fullMetadata: LogMetadata = {
      timestamp: new Date(),
      level,
      ...this.metadata,
      ...metadata,
    };
    
    // Add current context if tracking is enabled
    if (this.config.contextTracking && !fullMetadata.context) {
      const currentContext = this.contextManager.getCurrentContext();
      if (currentContext) {
        fullMetadata.context = currentContext;
      }
    }
    
    // Add source location in development
    if (process.env.NODE_ENV === 'development') {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        const callerLine = lines[4]; // Skip Error, log, and wrapper method lines
        const match = callerLine?.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
        if (match) {
          fullMetadata.source = `${match[2]}:${match[3]}`;
        }
      }
    }
    
    return fullMetadata;
  }
  
  /**
   * Create transport based on configuration
   */
  private createTransport(): LogTransport {
    const formatter = this.createFormatter();
    const transports: LogTransport[] = [];
    
    for (const destination of this.config.destinations) {
      switch (destination) {
        case LogDestination.CONSOLE:
          transports.push(new ConsoleTransport(formatter));
          break;
          
        case LogDestination.FILE:
          const filename = process.env.LOG_FILE || './logs/willow-cli.log';
          transports.push(new FileTransport(
            filename,
            formatter,
            this.config.maxFileSize,
            this.config.maxFiles
          ));
          break;
          
        case LogDestination.SYSLOG:
          const SyslogTransport = require('./transports.js').SyslogTransport;
          transports.push(new SyslogTransport(
            this.config.syslogHost,
            this.config.syslogPort,
            this.config.syslogProtocol,
            formatter
          ));
          break;
          
        default:
          // Check custom transports
          if (this.config.customTransports?.[destination]) {
            transports.push(this.config.customTransports[destination]);
          }
      }
    }
    
    return transports.length === 1 ? transports[0] : new MultiTransport(transports);
  }
  
  /**
   * Create formatter based on configuration
   */
  private createFormatter(): LogFormatter {
    // Check custom formatters first
    if (this.config.customFormatters?.[this.config.format]) {
      return this.config.customFormatters[this.config.format];
    }
    
    // Use built-in formatter
    const options = {
      enableColors: this.config.enableColors,
      enableTimestamps: this.config.enableTimestamps,
    };
    
    return FormatterFactory.create(this.config.format, options);
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Get or create the global logger
 */
export function getGlobalLogger(config?: Partial<LoggerConfig>): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(config);
  } else if (config) {
    // Update configuration
    globalLogger = new Logger(config);
  }
  return globalLogger;
}

/**
 * Configure the global logger
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalLogger = new Logger(config);
}

/**
 * Create a new logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}