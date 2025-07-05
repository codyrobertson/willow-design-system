/**
 * Logger Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, createLogger, getGlobalLogger } from '../Logger.js';
import { LogLevel, LogFormat, LogDestination } from '../types.js';
import { MemoryTransport } from '../transports.js';
import { CLIError, CLIErrorCode } from '../../../types/cli.js';

describe('Logger', () => {
  let logger: Logger;
  let memoryTransport: MemoryTransport;
  
  beforeEach(() => {
    vi.clearAllMocks();
    memoryTransport = new MemoryTransport();
  });
  
  afterEach(async () => {
    if (logger) {
      await logger.close();
    }
  });
  
  describe('Basic Logging', () => {
    beforeEach(() => {
      logger = createLogger({
        level: LogLevel.DEBUG,
        format: LogFormat.PLAIN,
        customTransports: {
          memory: memoryTransport,
        },
        destinations: ['memory' as LogDestination],
      });
    });
    
    it('should log debug messages', () => {
      logger.debug('Debug message');
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.DEBUG);
      expect(entries[0].message).toBe('Debug message');
    });
    
    it('should log info messages', () => {
      logger.info('Info message');
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.INFO);
      expect(entries[0].message).toBe('Info message');
    });
    
    it('should log warn messages', () => {
      logger.warn('Warning message');
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.WARN);
      expect(entries[0].message).toBe('Warning message');
    });
    
    it('should log error messages', () => {
      logger.error('Error message');
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.ERROR);
      expect(entries[0].message).toBe('Error message');
    });
    
    it('should log Error objects', () => {
      const error = new Error('Test error');
      logger.error(error);
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.ERROR);
      expect(entries[0].message).toBe('Test error');
      expect(entries[0].metadata.error).toBe(error);
    });
    
    it('should log CLIError with code', () => {
      const error = new CLIError(CLIErrorCode.CONFIGURATION_ERROR, 'Config error');
      logger.error(error);
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].metadata.code).toBe(CLIErrorCode.CONFIGURATION_ERROR);
    });
  });
  
  describe('Log Levels', () => {
    beforeEach(() => {
      logger = createLogger({
        level: LogLevel.WARN,
        customTransports: { memory: memoryTransport },
        destinations: ['memory' as LogDestination],
      });
    });
    
    it('should respect log level filtering', () => {
      logger.debug('Debug - should not appear');
      logger.info('Info - should not appear');
      logger.warn('Warning - should appear');
      logger.error('Error - should appear');
      
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].message).toBe('Warning - should appear');
      expect(entries[1].message).toBe('Error - should appear');
    });
    
    it('should allow changing log level', () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('Now visible');
      
      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe('Now visible');
    });
    
    it('should return current log level', () => {
      expect(logger.getLevel()).toBe(LogLevel.WARN);
      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });
  });
  
  describe('Metadata', () => {
    beforeEach(() => {
      logger = createLogger({
        level: LogLevel.DEBUG,
        customTransports: { memory: memoryTransport },
        destinations: ['memory' as LogDestination],
      });
    });
    
    it('should include custom metadata', () => {
      logger.info('Message', { userId: '123', action: 'login' });
      const entries = memoryTransport.getEntries();
      expect(entries[0].metadata.userId).toBe('123');
      expect(entries[0].metadata.action).toBe('login');
    });
    
    it('should include timestamp', () => {
      logger.info('Message');
      const entries = memoryTransport.getEntries();
      expect(entries[0].metadata.timestamp).toBeInstanceOf(Date);
    });
    
    it('should include tags', () => {
      logger.info('Message', { tags: ['api', 'auth'] });
      const entries = memoryTransport.getEntries();
      expect(entries[0].metadata.tags).toEqual(['api', 'auth']);
    });
  });
  
  describe('Child Loggers', () => {
    beforeEach(() => {
      logger = createLogger({
        level: LogLevel.DEBUG,
        customTransports: { memory: memoryTransport },
        destinations: ['memory' as LogDestination],
      });
    });
    
    it('should create child logger with additional metadata', () => {
      const childLogger = logger.child({ module: 'auth' });
      childLogger.info('Child message');
      
      const entries = memoryTransport.getEntries();
      expect(entries[0].metadata.module).toBe('auth');
    });
    
    it('should inherit parent metadata', () => {
      const childLogger = logger.child({ module: 'auth' });
      const grandchildLogger = childLogger.child({ component: 'login' });
      grandchildLogger.info('Nested message');
      
      const entries = memoryTransport.getEntries();
      expect(entries[0].metadata.module).toBe('auth');
      expect(entries[0].metadata.component).toBe('login');
    });
  });
  
  describe('Context Tracking', () => {
    beforeEach(() => {
      logger = createLogger({
        level: LogLevel.DEBUG,
        contextTracking: true,
        customTransports: { memory: memoryTransport },
        destinations: ['memory' as LogDestination],
      });
    });
    
    it('should track operation context', () => {
      const operationId = logger.startOperation('user-import');
      logger.info('Processing users');
      logger.endOperation(operationId);
      
      const entries = memoryTransport.getEntries();
      expect(entries[0].message).toContain('Starting operation');
      expect(entries[1].metadata.context?.operation).toBe('user-import');
      expect(entries[2].message).toContain('Completed operation');
    });
    
    it('should create logger with context', () => {
      const contextLogger = logger.withContext({ operation: 'data-sync' });
      contextLogger.info('Syncing data');
      
      const entries = memoryTransport.getEntries();
      expect(entries[0].metadata.context?.operation).toBe('data-sync');
    });
  });
  
  describe('Performance Tracking', () => {
    beforeEach(() => {
      logger = createLogger({
        level: LogLevel.DEBUG,
        performanceTracking: true,
        customTransports: { memory: memoryTransport },
        destinations: ['memory' as LogDestination],
      });
    });
    
    it('should track performance timers', async () => {
      logger.time('operation');
      await new Promise(resolve => setTimeout(resolve, 50));
      logger.timeEnd('operation');
      
      const entries = memoryTransport.getEntries();
      expect(entries[0].message).toContain('Timer started');
      expect(entries[1].message).toContain('Timer ended');
      expect(entries[1].metadata.duration).toBeGreaterThan(40);
    });
    
    it('should log intermediate timer values', async () => {
      logger.time('long-operation');
      await new Promise(resolve => setTimeout(resolve, 30));
      logger.timeLog('long-operation', 'Still running');
      logger.timeEnd('long-operation');
      
      const entries = memoryTransport.getEntries();
      expect(entries[1].message).toContain('Still running');
      expect(entries[1].metadata.duration).toBeGreaterThan(20);
    });
  });
  
  describe('Events', () => {
    beforeEach(() => {
      logger = createLogger({
        level: LogLevel.INFO,
        customTransports: { memory: memoryTransport },
        destinations: ['memory' as LogDestination],
      });
    });
    
    it('should emit log events', async () => {
      return new Promise<void>((resolve) => {
        logger.on('log', (entry) => {
          expect(entry.message).toBe('Test message');
          resolve();
        });
        
        logger.info('Test message');
      });
    });
    
    it('should emit level change events', async () => {
      return new Promise<void>((resolve) => {
        logger.on('levelChanged', (level) => {
          expect(level).toBe(LogLevel.DEBUG);
          resolve();
        });
        
        logger.setLevel(LogLevel.DEBUG);
      });
    });
  });
  
  describe('Global Logger', () => {
    it('should return singleton instance', () => {
      const logger1 = getGlobalLogger();
      const logger2 = getGlobalLogger();
      expect(logger1).toBe(logger2);
    });
    
    it('should recreate with new config', () => {
      const logger1 = getGlobalLogger({ level: LogLevel.INFO });
      const logger2 = getGlobalLogger({ level: LogLevel.DEBUG });
      expect(logger1).not.toBe(logger2);
      expect(logger2.getLevel()).toBe(LogLevel.DEBUG);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle transport errors gracefully', () => {
      const errorTransport = {
        write: vi.fn().mockImplementation(() => {
          throw new Error('Transport error');
        }),
      };
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logger = createLogger({
        customTransports: { error: errorTransport },
        destinations: ['error' as LogDestination],
      });
      
      // Should not throw
      expect(() => logger.info('Test')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to write log entry:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
    
    it('should handle async transport errors', async () => {
      const errorTransport = {
        write: vi.fn().mockRejectedValue(new Error('Async transport error')),
      };
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logger = createLogger({
        customTransports: { error: errorTransport },
        destinations: ['error' as LogDestination],
      });
      
      logger.info('Test');
      
      // Wait for async error to be caught
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to write log entry:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Cleanup', () => {
    it('should flush pending logs', async () => {
      const flushSpy = vi.fn();
      const transport = {
        write: vi.fn(),
        flush: flushSpy,
      };
      
      logger = createLogger({
        customTransports: { test: transport },
        destinations: ['test' as LogDestination],
      });
      
      await logger.flush();
      expect(flushSpy).toHaveBeenCalled();
    });
    
    it('should close and cleanup resources', async () => {
      const closeSpy = vi.fn();
      const transport = {
        write: vi.fn(),
        close: closeSpy,
      };
      
      logger = createLogger({
        customTransports: { test: transport },
        destinations: ['test' as LogDestination],
      });
      
      await logger.close();
      expect(closeSpy).toHaveBeenCalled();
    });
  });
});