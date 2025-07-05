/**
 * Formatter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PlainTextFormatter,
  JSONFormatter,
  PrettyConsoleFormatter,
  StructuredFormatter,
  CompactFormatter,
  DevelopmentFormatter,
  FormatterFactory,
} from '../formatters.js';
import { LogEntry, LogLevel } from '../types.js';

describe('Formatters', () => {
  const createTestEntry = (overrides?: Partial<LogEntry>): LogEntry => ({
    level: LogLevel.INFO,
    message: 'Test message',
    metadata: {
      timestamp: new Date('2023-01-01T12:00:00Z'),
      level: LogLevel.INFO,
      ...overrides?.metadata,
    },
    ...overrides,
  });
  
  describe('PlainTextFormatter', () => {
    let formatter: PlainTextFormatter;
    
    beforeEach(() => {
      formatter = new PlainTextFormatter();
    });
    
    it('should format basic log entry', () => {
      const entry = createTestEntry();
      const result = formatter.format(entry);
      expect(result).toBe('[2023-01-01T12:00:00.000Z] [INFO] Test message');
    });
    
    it('should include context operation', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          context: {
            id: 'ctx-123',
            operation: 'user-import',
            startTime: new Date(),
          },
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('[user-import]');
    });
    
    it('should include error stack', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:10:5';
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.ERROR,
          error,
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('Error: Test error');
      expect(result).toContain('at test.js:10:5');
    });
  });
  
  describe('JSONFormatter', () => {
    let formatter: JSONFormatter;
    
    beforeEach(() => {
      formatter = new JSONFormatter();
    });
    
    it('should format as valid JSON', () => {
      const entry = createTestEntry();
      const result = formatter.format(entry);
      expect(() => JSON.parse(result)).not.toThrow();
    });
    
    it('should include all metadata', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          userId: '123',
          requestId: 'req-456',
        },
      });
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);
      expect(parsed.userId).toBe('123');
      expect(parsed.requestId).toBe('req-456');
    });
    
    it('should serialize error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:10:5';
      const entry = createTestEntry({
        level: LogLevel.ERROR,
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.ERROR,
          error,
        },
      });
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);
      expect(parsed.error).toEqual({
        name: 'Error',
        message: 'Test error',
        stack: error.stack,
      });
    });
  });
  
  describe('PrettyConsoleFormatter', () => {
    let formatter: PrettyConsoleFormatter;
    
    beforeEach(() => {
      formatter = new PrettyConsoleFormatter(false); // Disable colors for testing
    });
    
    it('should format with level icons', () => {
      const debugEntry = createTestEntry({ level: LogLevel.DEBUG });
      const infoEntry = createTestEntry({ level: LogLevel.INFO });
      const warnEntry = createTestEntry({ level: LogLevel.WARN });
      const errorEntry = createTestEntry({ level: LogLevel.ERROR });
      
      expect(formatter.format(debugEntry)).toContain('🔍');
      expect(formatter.format(infoEntry)).toContain('ℹ️');
      expect(formatter.format(warnEntry)).toContain('⚠️');
      expect(formatter.format(errorEntry)).toContain('❌');
    });
    
    it('should format tags', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          tags: ['api', 'auth'],
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('#api');
      expect(result).toContain('#auth');
    });
    
    it('should highlight patterns in messages', () => {
      const entry = createTestEntry({
        message: 'Processing `file.txt` with "special chars" and 123 items',
      });
      const result = formatter.format(entry);
      // Since colors are disabled, we just check the content is preserved
      expect(result).toContain('file.txt');
      expect(result).toContain('"special chars"');
      expect(result).toContain('123');
    });
    
    it('should show additional metadata', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          custom: 'value',
          nested: { data: true },
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('"custom": "value"');
      expect(result).toContain('"nested"');
    });
  });
  
  describe('StructuredFormatter', () => {
    let formatter: StructuredFormatter;
    
    beforeEach(() => {
      formatter = new StructuredFormatter();
    });
    
    it('should use @ prefixed fields', () => {
      const entry = createTestEntry();
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);
      expect(parsed['@timestamp']).toBe('2023-01-01T12:00:00.000Z');
      expect(parsed['@level']).toBe('INFO');
      expect(parsed['@message']).toBe('Test message');
    });
    
    it('should structure context data', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          context: {
            id: 'ctx-123',
            operation: 'data-sync',
            parentId: 'parent-456',
            startTime: new Date(),
          },
        },
      });
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);
      expect(parsed['@context']).toEqual({
        id: 'ctx-123',
        operation: 'data-sync',
        parent_id: 'parent-456',
      });
    });
    
    it('should structure error data', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at line1\n    at line2';
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.ERROR,
          error,
        },
      });
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);
      expect(parsed['@error']).toEqual({
        type: 'Error',
        message: 'Test error',
        stack_trace: ['Error: Test error', '    at line1', '    at line2'],
      });
    });
  });
  
  describe('CompactFormatter', () => {
    let formatter: CompactFormatter;
    
    beforeEach(() => {
      formatter = new CompactFormatter();
    });
    
    it('should format single line output', () => {
      const entry = createTestEntry();
      const result = formatter.format(entry);
      expect(result.split('\n')).toHaveLength(1);
      expect(result).toMatch(/^\d{1,2}:\d{2}:\d{2}( AM| PM)? [A-Z]: Test message$/);
    });
    
    it('should abbreviate log levels', () => {
      const debugEntry = createTestEntry({ level: LogLevel.DEBUG });
      const infoEntry = createTestEntry({ level: LogLevel.INFO });
      const warnEntry = createTestEntry({ level: LogLevel.WARN });
      const errorEntry = createTestEntry({ level: LogLevel.ERROR });
      
      expect(formatter.format(debugEntry)).toContain(' D:');
      expect(formatter.format(infoEntry)).toContain(' I:');
      expect(formatter.format(warnEntry)).toContain(' W:');
      expect(formatter.format(errorEntry)).toContain(' E:');
    });
    
    it('should include context operation', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          context: {
            id: 'ctx-123',
            operation: 'api-call',
            startTime: new Date(),
          },
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('[api-call]');
    });
    
    it('should append error message', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.ERROR,
          error: new Error('Failed to connect'),
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('Test message - Failed to connect');
    });
  });
  
  describe('DevelopmentFormatter', () => {
    let formatter: DevelopmentFormatter;
    
    beforeEach(() => {
      formatter = new DevelopmentFormatter(false);
      // Mock process.memoryUsage
      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 100 * 1024 * 1024,
        heapTotal: 80 * 1024 * 1024,
        heapUsed: 50 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
      });
    });
    
    it('should include memory usage', () => {
      const entry = createTestEntry();
      const result = formatter.format(entry);
      expect(result).toContain('Memory: 50.00MB');
    });
    
    it('should include duration if available', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          duration: 123.45,
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('Duration: 123.45ms');
    });
    
    it('should include source location if available', () => {
      const entry = createTestEntry({
        metadata: {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          level: LogLevel.INFO,
          source: 'src/app.ts:42',
        },
      });
      const result = formatter.format(entry);
      expect(result).toContain('Source: src/app.ts:42');
    });
  });
  
  describe('FormatterFactory', () => {
    it('should create built-in formatters', () => {
      expect(FormatterFactory.create('plain')).toBeInstanceOf(PlainTextFormatter);
      expect(FormatterFactory.create('json')).toBeInstanceOf(JSONFormatter);
      expect(FormatterFactory.create('pretty')).toBeInstanceOf(PrettyConsoleFormatter);
      expect(FormatterFactory.create('structured')).toBeInstanceOf(StructuredFormatter);
      expect(FormatterFactory.create('compact')).toBeInstanceOf(CompactFormatter);
      expect(FormatterFactory.create('development')).toBeInstanceOf(DevelopmentFormatter);
    });
    
    it('should pass options to formatter', () => {
      const formatter = FormatterFactory.create('pretty', false);
      expect(formatter).toBeInstanceOf(PrettyConsoleFormatter);
    });
    
    it('should throw for unknown formatter', () => {
      expect(() => FormatterFactory.create('unknown')).toThrow('Unknown formatter type: unknown');
    });
    
    it('should allow registering custom formatters', () => {
      class CustomFormatter {
        format(entry: LogEntry): string {
          return `CUSTOM: ${entry.message}`;
        }
      }
      
      FormatterFactory.register('custom', CustomFormatter as any);
      const formatter = FormatterFactory.create('custom');
      expect(formatter).toBeInstanceOf(CustomFormatter);
    });
  });
});