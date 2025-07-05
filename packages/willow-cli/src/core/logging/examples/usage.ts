/**
 * Logging Framework Usage Examples
 */

import {
  createLogger,
  Logger,
  LogLevel,
  LogFormat,
  LogDestination,
  log,
  createEnhancedLogger,
  configureFromEnvironment,
  PrettyConsoleFormatter,
  FileTransport,
  MultiTransport,
  FilteredTransport,
  BufferedTransport,
} from '../index.js';

/**
 * Example 1: Basic Logger Usage
 */
function basicUsageExample() {
  // Create a simple logger
  const logger = createLogger({
    level: LogLevel.DEBUG,
    format: LogFormat.PRETTY,
  });
  
  // Log at different levels
  logger.debug('Debug information');
  logger.info('Application started');
  logger.warn('Low memory warning');
  logger.error('Failed to connect to database');
  
  // Log with metadata
  logger.info('User logged in', {
    userId: '123',
    email: 'user@example.com',
    timestamp: new Date(),
  });
  
  // Log errors
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error(error as Error, {
      context: 'database-connection',
      retryCount: 3,
    });
  }
}

/**
 * Example 2: Context and Operation Tracking
 */
async function contextTrackingExample() {
  const logger = createLogger({
    level: LogLevel.INFO,
    contextTracking: true,
    performanceTracking: true,
  });
  
  // Track an operation
  const operationId = logger.startOperation('data-import', {
    source: 'csv',
    recordCount: 1000,
  });
  
  logger.info('Reading CSV file');
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  logger.info('Processing records');
  
  // Create child logger with context
  const dbLogger = logger.withContext({
    operation: 'database-write',
    parentId: operationId,
  });
  
  dbLogger.info('Writing to database');
  
  // End operation
  logger.endOperation(operationId, {
    recordsImported: 950,
    recordsFailed: 50,
  });
}

/**
 * Example 3: Performance Tracking
 */
function performanceTrackingExample() {
  const logger = createLogger({
    performanceTracking: true,
  });
  
  // Simple timer
  logger.time('data-processing');
  
  // Simulate work
  for (let i = 0; i < 1000000; i++) {
    Math.sqrt(i);
  }
  
  logger.timeEnd('data-processing');
  
  // Timer with intermediate logs
  logger.time('multi-step-process');
  
  // Step 1
  logger.timeLog('multi-step-process', 'Completed step 1');
  
  // Step 2
  logger.timeLog('multi-step-process', 'Completed step 2');
  
  // Final
  logger.timeEnd('multi-step-process', {
    totalSteps: 2,
    status: 'success',
  });
}

/**
 * Example 4: Custom Transports and Formatters
 */
function customTransportExample() {
  // Create a logger with multiple destinations
  const logger = createLogger({
    level: LogLevel.INFO,
    destinations: [LogDestination.CONSOLE, LogDestination.FILE],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  });
  
  logger.info('This goes to both console and file');
  
  // Create a custom transport configuration
  const errorFileTransport = new FileTransport(
    './logs/errors.log',
    new PrettyConsoleFormatter(false)
  );
  
  const errorOnlyTransport = new FilteredTransport(
    errorFileTransport,
    entry => entry.level === LogLevel.ERROR
  );
  
  const customLogger = createLogger({
    customTransports: {
      'error-file': errorOnlyTransport,
    },
    destinations: [LogDestination.CONSOLE, 'error-file' as LogDestination],
  });
  
  customLogger.info('This goes to console only');
  customLogger.error('This goes to console and error file');
}

/**
 * Example 5: Enhanced UI Logger Integration
 */
function enhancedUILoggerExample() {
  const logger = createEnhancedLogger({
    level: 'debug',
    prefix: 'MyApp',
    timestamp: true,
    colors: true,
  });
  
  // All UI Logger methods are available
  logger.success('Component installed successfully');
  logger.fail('Failed to install component');
  logger.section('Installation Summary');
  logger.box('Installation completed!', 'green');
  
  // Plus enhanced features
  const operationId = logger.startOperation('component-installation');
  
  logger.timedInfo('Installing dependencies', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  logger.endOperation(operationId);
  
  // Create child logger
  const moduleLogger = logger.child('auth-module');
  moduleLogger.info('Initializing authentication');
}

/**
 * Example 6: Environment-based Configuration
 */
function environmentConfigExample() {
  // Set environment variables
  process.env.LOG_LEVEL = 'debug';
  process.env.LOG_FORMAT = 'json';
  process.env.LOG_FILE = './logs/app.log';
  process.env.LOG_TIMESTAMPS = 'true';
  
  // Create logger from environment
  const config = configureFromEnvironment();
  const logger = createLogger(config);
  
  logger.info('Logger configured from environment', config);
}

/**
 * Example 7: Structured Logging for Production
 */
function structuredLoggingExample() {
  const logger = createLogger({
    level: LogLevel.INFO,
    format: LogFormat.JSON,
    enableTimestamps: true,
  });
  
  // Add request context
  const requestLogger = logger.child({
    requestId: 'req-123',
    userId: 'user-456',
    endpoint: '/api/users',
  });
  
  requestLogger.info('Request received');
  
  // Log with tags
  requestLogger.warn('Slow database query', {
    tags: ['performance', 'database'],
    query: 'SELECT * FROM users',
    duration: 1234,
  });
  
  // Log security events
  requestLogger.error('Authentication failed', {
    tags: ['security', 'auth'],
    attemptedUser: 'admin',
    ipAddress: '192.168.1.1',
  });
}

/**
 * Example 8: Buffered Logging for High-throughput
 */
async function bufferedLoggingExample() {
  const fileTransport = new FileTransport('./logs/high-throughput.log');
  const bufferedTransport = new BufferedTransport(
    fileTransport,
    100,  // Buffer size
    1000  // Flush interval (ms)
  );
  
  const logger = createLogger({
    customTransports: {
      buffered: bufferedTransport,
    },
    destinations: ['buffered' as LogDestination],
  });
  
  // High-frequency logging
  for (let i = 0; i < 1000; i++) {
    logger.info(`Processing item ${i}`);
  }
  
  // Ensure all logs are written
  await logger.flush();
  await logger.close();
}

/**
 * Example 9: Global Convenience Functions
 */
function globalLogExample() {
  // Use global log functions
  log.info('Quick info message');
  log.debug('Debug details');
  log.error(new Error('Something failed'));
  
  // Track operations
  const opId = log.startOperation('batch-process');
  log.info('Processing batch...');
  log.endOperation(opId);
  
  // Performance tracking
  log.time('calculation');
  // ... do work ...
  log.timeEnd('calculation');
  
  // Create contextual logger
  const contextLogger = log.withContext('user-import');
  contextLogger.info('Importing users from CSV');
}

/**
 * Example 10: Error Handling and Recovery
 */
function errorHandlingExample() {
  const logger = createLogger({
    level: LogLevel.ERROR,
    destinations: [LogDestination.CONSOLE, LogDestination.FILE],
  });
  
  // Set up error recovery
  logger.on('log', (entry) => {
    if (entry.level === LogLevel.ERROR) {
      // Send to error tracking service
      console.log('Sending error to tracking service:', entry);
    }
  });
  
  // Log various error types
  logger.error('Simple error message');
  
  logger.error(new Error('Standard error'), {
    stack: true,
    context: 'api-handler',
  });
  
  // Custom error class
  class ValidationError extends Error {
    constructor(message: string, public field: string, public value: any) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  
  const validationError = new ValidationError(
    'Invalid email format',
    'email',
    'not-an-email'
  );
  
  logger.error(validationError, {
    tags: ['validation', 'user-input'],
    formData: { email: 'not-an-email' },
  });
}

// Run examples
if (require.main === module) {
  console.log('=== Basic Usage ===');
  basicUsageExample();
  
  console.log('\n=== Context Tracking ===');
  contextTrackingExample();
  
  console.log('\n=== Performance Tracking ===');
  performanceTrackingExample();
  
  console.log('\n=== Custom Transports ===');
  customTransportExample();
  
  console.log('\n=== Enhanced UI Logger ===');
  enhancedUILoggerExample();
  
  console.log('\n=== Structured Logging ===');
  structuredLoggingExample();
  
  console.log('\n=== Global Logging ===');
  globalLogExample();
  
  console.log('\n=== Error Handling ===');
  errorHandlingExample();
}