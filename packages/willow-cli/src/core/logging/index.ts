/**
 * Logging Framework Public API
 */

// Core exports
export {
  Logger,
  getGlobalLogger,
  configureLogger,
  createLogger,
} from './Logger.js';

// Type exports
export {
  LogLevel,
  LogFormat,
  LogDestination,
  LogEntry,
  LogMetadata,
  LogContext,
  LoggerConfig,
  ILogger,
  LogFormatter,
  LogTransport,
  LogFilter,
  LogQueryResult,
  PerformanceMetrics,
} from './types.js';

// Formatter exports
export {
  PlainTextFormatter,
  JSONFormatter,
  PrettyConsoleFormatter,
  StructuredFormatter,
  CompactFormatter,
  DevelopmentFormatter,
  FormatterFactory,
} from './formatters.js';

// Transport exports
export {
  ConsoleTransport,
  FileTransport,
  MemoryTransport,
  SyslogTransport,
  MultiTransport,
  FilteredTransport,
  BufferedTransport,
  TransportFactory,
} from './transports.js';

// Context exports
export {
  ContextManager,
  AsyncContextManager,
  PerformanceTracker,
  globalContextManager,
  performanceTracker,
} from './context.js';

// Integration exports
export {
  EnhancedUILogger,
  createEnhancedLogger,
  enhanceGlobalLogger,
  createLoggingMiddleware,
  configureFromEnvironment,
} from './integration.js';

// Convenience functions
import { getGlobalLogger } from './Logger.js';
import { LogLevel } from './types.js';

/**
 * Global convenience logging functions
 */
export const log = {
  debug: (message: string, metadata?: any) => getGlobalLogger().debug(message, metadata),
  info: (message: string, metadata?: any) => getGlobalLogger().info(message, metadata),
  warn: (message: string, metadata?: any) => getGlobalLogger().warn(message, metadata),
  error: (message: string | Error, metadata?: any) => getGlobalLogger().error(message, metadata),
  
  // Context helpers
  withContext: (operation: string, metadata?: any) => getGlobalLogger().withContext({ operation, metadata }),
  startOperation: (operation: string, metadata?: any) => getGlobalLogger().startOperation(operation, metadata),
  endOperation: (operationId: string, metadata?: any) => getGlobalLogger().endOperation(operationId, metadata),
  
  // Performance helpers
  time: (label: string) => getGlobalLogger().time(label),
  timeEnd: (label: string, metadata?: any) => getGlobalLogger().timeEnd(label, metadata),
  timeLog: (label: string, message?: string) => getGlobalLogger().timeLog(label, message),
  
  // Configuration
  setLevel: (level: LogLevel) => getGlobalLogger().setLevel(level),
  getLevel: () => getGlobalLogger().getLevel(),
};