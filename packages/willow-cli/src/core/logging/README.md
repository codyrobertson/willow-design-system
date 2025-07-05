# Willow CLI Logging Framework

A comprehensive, thread-safe logging framework for the Willow CLI with support for multiple log levels, formatters, and output destinations.

## Features

- **Multiple Log Levels**: Debug, Info, Warn, Error
- **Multiple Formatters**: Plain text, JSON, Pretty console, Structured, Compact, Development
- **Multiple Destinations**: Console, File (with rotation), Syslog, Memory (for testing)
- **Context Tracking**: Track operations across async boundaries
- **Performance Monitoring**: Built-in timing and performance metrics
- **Thread-Safe**: Uses AsyncLocalStorage for concurrent operation tracking
- **Extensible**: Custom formatters and transports
- **Integration**: Seamless integration with existing UI Logger

## Quick Start

```typescript
import { createLogger, log } from '@willow/cli/logging';

// Simple usage with global logger
log.info('Application started');
log.error(new Error('Something went wrong'));

// Create a custom logger
const logger = createLogger({
  level: LogLevel.DEBUG,
  format: LogFormat.PRETTY,
  destinations: [LogDestination.CONSOLE, LogDestination.FILE],
});

logger.info('Custom logger initialized');
```

## Configuration

### Environment Variables

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Log format (plain, json, pretty, structured, compact, development)
LOG_FORMAT=pretty

# Destinations
LOG_FILE=/var/log/willow-cli.log
LOG_SYSLOG=true
LOG_CONSOLE=true

# Options
LOG_NO_COLOR=false
LOG_TIMESTAMPS=true
LOG_CONTEXT=true
LOG_PERFORMANCE=true

# File rotation
LOG_MAX_FILE_SIZE=10485760  # 10MB
LOG_MAX_FILES=5

# Syslog
LOG_SYSLOG_HOST=localhost
LOG_SYSLOG_PORT=514
LOG_SYSLOG_PROTOCOL=udp
```

### Programmatic Configuration

```typescript
const logger = createLogger({
  level: LogLevel.INFO,
  format: LogFormat.JSON,
  destinations: [LogDestination.CONSOLE, LogDestination.FILE],
  enableColors: true,
  enableTimestamps: true,
  contextTracking: true,
  performanceTracking: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
});
```

## Usage Examples

### Basic Logging

```typescript
logger.debug('Debug information');
logger.info('User logged in', { userId: '123' });
logger.warn('Low memory', { available: '100MB' });
logger.error(new Error('Connection failed'));
```

### Context Tracking

```typescript
// Track operations
const operationId = logger.startOperation('data-import', {
  source: 'csv',
  recordCount: 1000,
});

logger.info('Processing records...');

// Create contextual logger
const dbLogger = logger.withContext({
  operation: 'database-write',
  parentId: operationId,
});

dbLogger.info('Writing to database');

logger.endOperation(operationId, {
  recordsImported: 950,
  recordsFailed: 50,
});
```

### Performance Tracking

```typescript
// Simple timer
logger.time('data-processing');
// ... do work ...
logger.timeEnd('data-processing');

// Timer with intermediate logs
logger.time('multi-step-process');
logger.timeLog('multi-step-process', 'Completed step 1');
logger.timeLog('multi-step-process', 'Completed step 2');
logger.timeEnd('multi-step-process');
```

### Child Loggers

```typescript
// Create child logger with additional metadata
const moduleLogger = logger.child({ module: 'auth' });
moduleLogger.info('Authentication initialized');

const requestLogger = moduleLogger.child({ 
  requestId: 'req-123',
  userId: 'user-456',
});
requestLogger.info('Processing request');
```

### Enhanced UI Logger

```typescript
import { createEnhancedLogger } from '@willow/cli/logging';

const uiLogger = createEnhancedLogger({
  level: 'info',
  prefix: 'MyApp',
  timestamp: true,
});

// All UI Logger methods available
uiLogger.success('Installation complete');
uiLogger.box('Welcome to Willow CLI!', 'blue');
uiLogger.table(['Name', 'Status'], [['Component', 'Installed']]);

// Plus enhanced features
uiLogger.timedInfo('Installing dependencies', async () => {
  await installDependencies();
});
```

## Custom Formatters

```typescript
class CustomFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return `[${entry.metadata.timestamp.toISOString()}] ${entry.message}`;
  }
}

const logger = createLogger({
  customFormatters: {
    custom: new CustomFormatter(),
  },
  format: 'custom' as LogFormat,
});
```

## Custom Transports

```typescript
class SlackTransport implements LogTransport {
  async write(entry: LogEntry): Promise<void> {
    if (entry.level === LogLevel.ERROR) {
      await sendToSlack(entry.message);
    }
  }
}

const logger = createLogger({
  customTransports: {
    slack: new SlackTransport(),
  },
  destinations: [LogDestination.CONSOLE, 'slack' as LogDestination],
});
```

## Advanced Usage

### Filtered Logging

```typescript
// Only log errors to file
const errorFileTransport = new FilteredTransport(
  new FileTransport('./errors.log'),
  entry => entry.level === LogLevel.ERROR
);

const logger = createLogger({
  customTransports: { 'error-file': errorFileTransport },
  destinations: [LogDestination.CONSOLE, 'error-file' as LogDestination],
});
```

### Buffered Logging

```typescript
// Buffer logs for high-throughput scenarios
const bufferedTransport = new BufferedTransport(
  new FileTransport('./app.log'),
  100,  // Buffer size
  1000  // Flush interval (ms)
);

const logger = createLogger({
  customTransports: { buffered: bufferedTransport },
  destinations: ['buffered' as LogDestination],
});
```

### Structured Logging

```typescript
const logger = createLogger({
  format: LogFormat.STRUCTURED,
});

logger.info('API request', {
  '@service': 'api',
  '@trace_id': 'trace-123',
  endpoint: '/users',
  method: 'GET',
  duration: 45,
});
```

## Testing

Use the `MemoryTransport` for testing:

```typescript
import { MemoryTransport } from '@willow/cli/logging';

const memoryTransport = new MemoryTransport();
const logger = createLogger({
  customTransports: { memory: memoryTransport },
  destinations: ['memory' as LogDestination],
});

logger.info('Test message');

const entries = memoryTransport.getEntries();
expect(entries[0].message).toBe('Test message');
```

## Migration from UI Logger

The framework is designed to be backward compatible:

```typescript
// Existing code continues to work
import { getLogger } from '@willow/cli/ui';
const logger = getLogger();

// Behind the scenes, it uses the enhanced logger
logger.info('This uses the new logging framework');
```

## Best Practices

1. **Use appropriate log levels**:
   - DEBUG: Detailed information for debugging
   - INFO: General informational messages
   - WARN: Warning messages for potentially harmful situations
   - ERROR: Error messages for serious problems

2. **Include context**: Always provide relevant metadata
   ```typescript
   logger.info('User action', { 
     userId: user.id,
     action: 'login',
     timestamp: new Date(),
   });
   ```

3. **Use child loggers** for modules and components
   ```typescript
   const authLogger = logger.child({ module: 'auth' });
   ```

4. **Track operations** for better debugging
   ```typescript
   const opId = logger.startOperation('critical-task');
   try {
     // ... do work ...
     logger.endOperation(opId, { status: 'success' });
   } catch (error) {
     logger.endOperation(opId, { status: 'failed', error });
   }
   ```

5. **Configure for production**:
   ```typescript
   const prodLogger = createLogger({
     level: LogLevel.INFO,
     format: LogFormat.JSON,
     destinations: [LogDestination.FILE, LogDestination.SYSLOG],
   });
   ```

## Performance Considerations

- Use buffered transports for high-frequency logging
- Set appropriate log levels in production
- Consider using filtered transports to reduce I/O
- File rotation prevents unbounded disk usage
- Context tracking has minimal overhead when disabled

## License

This logging framework is part of the Willow Design System and follows the same license terms.