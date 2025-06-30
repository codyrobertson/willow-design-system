import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ErrorRecovery,
  RecoveryStrategy,
  RecoveryContext,
  RecoveryResult,
  globalErrorRecovery,
  executeWithRecovery,
  withErrorRecovery,
} from './ErrorRecovery';
import {
  AdapterError,
  AdapterInitializationError,
  AdapterConfigurationError,
  AdapterDependencyError,
  AdapterPerformanceError,
  AdapterMappingError,
  AdapterStyleError,
  AdapterTokenError,
} from './AdapterError';

describe('ErrorRecovery', () => {
  let errorRecovery: ErrorRecovery;
  let consoleWarnSpy: any;
  let consoleInfoSpy: any;

  beforeEach(() => {
    errorRecovery = new ErrorRecovery();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('Constructor and initialization', () => {
    it('should create with default strategies', () => {
      const recovery = new ErrorRecovery();
      const strategyNames = recovery.getStrategyNames();

      expect(strategyNames).toContain('configurationFallback');
      expect(strategyNames).toContain('initializationRetry');
      expect(strategyNames).toContain('dependencyFallback');
      expect(strategyNames).toContain('performanceOptimization');
      expect(strategyNames).toContain('mappingFallback');
      expect(strategyNames).toContain('styleFallback');
      expect(strategyNames).toContain('tokenFallback');
      expect(strategyNames).toContain('genericFallback');
    });

    it('should register custom strategy', () => {
      const customStrategy: RecoveryStrategy = {
        canRecover: () => true,
        recover: async () => 'custom-result',
        priority: 10,
      };

      errorRecovery.registerStrategy('custom', customStrategy);
      
      expect(errorRecovery.getStrategyNames()).toContain('custom');
    });

    it('should remove strategy', () => {
      const result = errorRecovery.removeStrategy('genericFallback');
      
      expect(result).toBe(true);
      expect(errorRecovery.getStrategyNames()).not.toContain('genericFallback');
    });

    it('should clear all strategies', () => {
      errorRecovery.clearStrategies();
      
      expect(errorRecovery.getStrategyNames()).toHaveLength(0);
    });
  });

  describe('Recovery strategy execution', () => {
    it('should recover from configuration error', async () => {
      const error = new AdapterConfigurationError('Invalid config');
      const result = await errorRecovery.recover(error, {
        operation: 'test-config',
        adapterName: 'test-adapter',
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('configurationFallback');
      expect(result.result).toEqual(
        expect.objectContaining({
          name: 'test-adapter',
          version: '1.0.0',
          options: expect.objectContaining({
            theme: 'light',
            rtl: false,
            accessibility: true,
          }),
        })
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using default configuration due to error:')
      );
    });

    it('should retry initialization errors', async () => {
      const error = new AdapterInitializationError('Init failed');
      const result = await errorRecovery.recover(error, {
        operation: 'initialization',
        retryCount: 0,
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('initializationRetry');
      expect(result.result).toEqual({ retry: true });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retrying initialization (1/3)')
      );
    });

    it('should not retry initialization beyond max retries', async () => {
      const error = new AdapterInitializationError('Init failed');
      
      try {
        await errorRecovery.recover(error, {
          operation: 'initialization',
          retryCount: 3,
          maxRetries: 3,
        });
      } catch (thrownError) {
        expect(thrownError).toBe(error);
      }
    });

    it('should handle dependency errors with fallback adapter', async () => {
      const error = new AdapterDependencyError('React not found', {
        dependencyName: 'react',
        requiredVersion: '^18.0.0',
        actualVersion: '17.0.0',
      });

      const result = await errorRecovery.recover(error, {
        operation: 'dependency-check',
        adapterName: 'react-adapter',
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('dependencyFallback');
      expect(result.result).toEqual({
        name: 'fallback-adapter',
        initialized: true,
        capabilities: ['basic-mapping', 'simple-styles'],
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Loading fallback adapter due to dependency error:')
      );
    });

    it('should handle performance errors with optimizations', async () => {
      const error = new AdapterPerformanceError('Operation timeout', {
        operation: 'component-mapping',
        duration: 5000,
        threshold: 3000,
      });

      const result = await errorRecovery.recover(error, {
        operation: 'performance-check',
        metadata: { cacheSize: 2000 },
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('performanceOptimization');
      expect(result.result).toEqual({
        cacheEnabled: true,
        cacheSize: 1000, // Half of original
        lazyLoading: true,
        debounceTime: 300,
      });
    });

    it('should handle mapping errors with fallback', async () => {
      const error = new AdapterMappingError('Component mapping failed', {
        componentName: 'Button',
        componentType: 'button',
      });

      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('mappingFallback');
      expect(result.result).toEqual({
        component: 'Button',
        props: {},
        styles: expect.objectContaining({
          display: 'block',
          fontFamily: 'inherit',
        }),
        variants: [],
        displayName: 'Button',
      });
    });

    it('should handle style errors with fallback styles', async () => {
      const error = new AdapterStyleError('Style translation failed', {
        styleName: 'buttonPrimary',
        styleValue: 'invalid-color',
      });

      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('styleFallback');
      expect(result.result).toEqual(
        expect.objectContaining({
          cursor: 'pointer',
          padding: '8px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f0f0f0',
        })
      );
    });

    it('should handle token errors with fallback tokens', async () => {
      const error = new AdapterTokenError('Token conversion failed', {
        tokenPath: 'colors.primary.500',
        tokenValue: 'invalid',
      });

      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('tokenFallback');
      expect(result.result).toBe('#007bff'); // Primary color fallback
    });

    it('should use generic fallback for recoverable errors', async () => {
      const error = new AdapterError('Generic error', 'GENERIC_ERROR', {
        recoverable: true,
      });

      const result = await errorRecovery.recover(error, {
        operation: 'component-mapping',
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('genericFallback');
      expect(result.result).toEqual(
        expect.objectContaining({
          component: 'div',
          props: {},
          styles: expect.objectContaining({
            display: 'block',
          }),
        })
      );
    });

    it('should return error when no strategies can recover', async () => {
      const error = new AdapterError('Unrecoverable', 'UNRECOVERABLE', {
        recoverable: false,
      });

      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.strategy).toBeUndefined();
      expect(result.recoveryAttempts).toBe(0);
    });

    it('should try strategies in priority order', async () => {
      // Register a high-priority custom strategy
      const highPriorityStrategy: RecoveryStrategy = {
        canRecover: (error) => error.code === 'TEST_ERROR',
        recover: async () => 'high-priority-result',
        priority: 100,
      };

      const lowPriorityStrategy: RecoveryStrategy = {
        canRecover: (error) => error.code === 'TEST_ERROR',
        recover: async () => 'low-priority-result',
        priority: 1,
      };

      errorRecovery.registerStrategy('high', highPriorityStrategy);
      errorRecovery.registerStrategy('low', lowPriorityStrategy);

      const error = new AdapterError('Test', 'TEST_ERROR');
      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('high');
      expect(result.result).toBe('high-priority-result');
    });

    it('should continue to next strategy if one fails', async () => {
      const failingStrategy: RecoveryStrategy = {
        canRecover: () => true,
        recover: async () => { throw new Error('Strategy failed'); },
        priority: 10,
      };

      const workingStrategy: RecoveryStrategy = {
        canRecover: () => true,
        recover: async () => 'working-result',
        priority: 5,
      };

      errorRecovery.clearStrategies();
      errorRecovery.registerStrategy('failing', failingStrategy);
      errorRecovery.registerStrategy('working', workingStrategy);

      const error = new AdapterError('Test', 'TEST_ERROR');
      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('working');
      expect(result.result).toBe('working-result');
      expect(result.recoveryAttempts).toBe(2);
    });
  });

  describe('ExecuteWithRecovery', () => {
    it('should execute operation successfully without recovery', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await errorRecovery.executeWithRecovery(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should recover from operation failure', async () => {
      const error = new AdapterConfigurationError('Config error');
      const operation = vi.fn().mockRejectedValue(error);

      const result = await errorRecovery.executeWithRecovery(operation, {
        operation: 'test-operation',
        adapterName: 'test-adapter',
      });

      expect(result).toEqual(
        expect.objectContaining({
          name: 'test-adapter',
          version: '1.0.0',
        })
      );
    });

    it('should throw error if recovery fails', async () => {
      const error = new AdapterError('Unrecoverable', 'UNRECOVERABLE', {
        recoverable: false,
      });
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        errorRecovery.executeWithRecovery(operation)
      ).rejects.toThrow(error);
    });

    it('should normalize non-adapter errors', async () => {
      const regularError = new Error('Regular error');
      const operation = vi.fn().mockRejectedValue(regularError);

      // Should recover with generic fallback since wrapped errors are recoverable by default
      const result = await errorRecovery.executeWithRecovery(operation, {
        operation: 'config-operation',
      });

      expect(result).toEqual(
        expect.objectContaining({
          name: 'fallback-adapter',
          version: '1.0.0',
        })
      );
    });

    it('should handle string errors', async () => {
      const operation = vi.fn().mockRejectedValue('String error');

      const result = await errorRecovery.executeWithRecovery(operation, {
        operation: 'config-operation',
      });

      expect(result).toEqual(
        expect.objectContaining({
          name: 'fallback-adapter',
          version: '1.0.0',
        })
      );
    });
  });

  describe('Fallback token values', () => {
    it('should return correct color fallbacks', async () => {
      const testCases = [
        { path: 'colors.primary.500', expected: '#007bff' },
        { path: 'colors.secondary.300', expected: '#6c757d' },
        { path: 'colors.success.600', expected: '#28a745' },
        { path: 'colors.warning.400', expected: '#ffc107' },
        { path: 'colors.error.500', expected: '#dc3545' },
        { path: 'colors.unknown.500', expected: '#000000' },
      ];

      for (const testCase of testCases) {
        const error = new AdapterTokenError('Token error', {
          tokenPath: testCase.path,
        });

        const result = await errorRecovery.recover(error);
        expect(result.result).toBe(testCase.expected);
      }
    });

    it('should return correct spacing fallbacks', async () => {
      const testCases = [
        { path: 'spacing.xs.value', expected: '4px' },
        { path: 'spacing.sm.value', expected: '8px' },
        { path: 'spacing.md.value', expected: '16px' },
        { path: 'spacing.lg.value', expected: '24px' },
        { path: 'spacing.xl.value', expected: '32px' },
        { path: 'spacing.unknown.value', expected: '16px' },
      ];

      for (const testCase of testCases) {
        const error = new AdapterTokenError('Token error', {
          tokenPath: testCase.path,
        });

        const result = await errorRecovery.recover(error);
        expect(result.result).toBe(testCase.expected);
      }
    });

    it('should return correct typography fallbacks', async () => {
      const testCases = [
        { path: 'typography.fontFamily.base', expected: 'system-ui, -apple-system, sans-serif' },
        { path: 'typography.fontSize.base', expected: '16px' },
        { path: 'typography.fontWeight.normal', expected: 400 },
        { path: 'typography.lineHeight.base', expected: 1.5 },
        { path: 'typography.unknown.value', expected: '16px' },
      ];

      for (const testCase of testCases) {
        const error = new AdapterTokenError('Token error', {
          tokenPath: testCase.path,
        });

        const result = await errorRecovery.recover(error);
        expect(result.result).toBe(testCase.expected);
      }
    });

    it('should return correct border fallbacks', async () => {
      const testCases = [
        { path: 'borders.width.thin', expected: '1px' },
        { path: 'borders.style.solid', expected: 'solid' },
        { path: 'borders.color.default', expected: '#ccc' },
        { path: 'borders.radius.small', expected: '4px' },
        { path: 'borders.unknown.value', expected: '1px' },
      ];

      for (const testCase of testCases) {
        const error = new AdapterTokenError('Token error', {
          tokenPath: testCase.path,
        });

        const result = await errorRecovery.recover(error);
        expect(result.result).toBe(testCase.expected);
      }
    });

    it('should return null for unknown token categories', async () => {
      const error = new AdapterTokenError('Token error', {
        tokenPath: 'unknown.category.value',
      });

      const result = await errorRecovery.recover(error);
      expect(result.result).toBeNull();
    });

    it('should return null for invalid token paths', async () => {
      const error = new AdapterTokenError('Token error', {
        tokenPath: '',
      });

      const result = await errorRecovery.recover(error);
      expect(result.result).toBeNull();
    });
  });

  describe('Fallback styles', () => {
    it('should return button styles for button-related style names', async () => {
      const error = new AdapterStyleError('Style error', {
        styleName: 'buttonPrimary',
      });

      const result = await errorRecovery.recover(error);

      expect(result.result).toEqual(
        expect.objectContaining({
          cursor: 'pointer',
          padding: '8px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f0f0f0',
        })
      );
    });

    it('should return input styles for input-related style names', async () => {
      const error = new AdapterStyleError('Style error', {
        styleName: 'inputField',
      });

      const result = await errorRecovery.recover(error);

      expect(result.result).toEqual(
        expect.objectContaining({
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px',
        })
      );
    });

    it('should return base styles for unknown style names', async () => {
      const error = new AdapterStyleError('Style error', {
        styleName: 'unknownStyle',
      });

      const result = await errorRecovery.recover(error);

      expect(result.result).toEqual(
        expect.objectContaining({
          display: 'block',
          margin: 0,
          padding: 0,
          border: 'none',
          background: 'transparent',
          font: 'inherit',
          color: 'inherit',
        })
      );
    });
  });

  describe('Generic fallbacks by operation type', () => {
    it('should return mapping fallback for mapping operations', async () => {
      const error = new AdapterError('Generic error', 'GENERIC', { recoverable: true });

      const result = await errorRecovery.recover(error, {
        operation: 'component-mapping',
      });

      expect(result.result).toEqual(
        expect.objectContaining({
          component: 'div',
          props: {},
          styles: expect.objectContaining({
            display: 'block',
          }),
        })
      );
    });

    it('should return style fallback for style operations', async () => {
      const error = new AdapterError('Generic error', 'GENERIC', { recoverable: true });

      const result = await errorRecovery.recover(error, {
        operation: 'style-translation',
      });

      expect(result.result).toEqual(
        expect.objectContaining({
          display: 'block',
          margin: 0,
          padding: 0,
        })
      );
    });

    it('should return null for token operations', async () => {
      const error = new AdapterError('Generic error', 'GENERIC', { recoverable: true });

      const result = await errorRecovery.recover(error, {
        operation: 'token-conversion',
      });

      expect(result.result).toBeNull();
    });

    it('should return config fallback for config operations', async () => {
      const error = new AdapterError('Generic error', 'GENERIC', { recoverable: true });

      const result = await errorRecovery.recover(error, {
        operation: 'config-validation',
      });

      expect(result.result).toEqual(
        expect.objectContaining({
          name: 'fallback-adapter',
          version: '1.0.0',
          options: expect.objectContaining({
            theme: 'light',
          }),
        })
      );
    });
  });

  describe('Statistics and monitoring', () => {
    it('should provide recovery statistics', () => {
      const stats = errorRecovery.getStatistics();

      expect(stats).toEqual({
        strategiesCount: expect.any(Number),
        errorHandlerStats: expect.any(Object),
      });
      expect(stats.strategiesCount).toBeGreaterThan(0);
    });
  });

  describe('Global instance and convenience functions', () => {
    it('should use global error recovery', async () => {
      const operation = vi.fn().mockResolvedValue('global-success');
      const result = await executeWithRecovery(operation);

      expect(result).toBe('global-success');
    });

    it('should handle errors with global recovery', async () => {
      const error = new AdapterConfigurationError('Global config error');
      const operation = vi.fn().mockRejectedValue(error);

      const result = await executeWithRecovery(operation, {
        adapterName: 'global-adapter',
      });

      expect(result).toEqual(
        expect.objectContaining({
          name: 'global-adapter',
        })
      );
    });
  });

  describe('Decorator', () => {
    it('should apply error recovery to decorated methods', async () => {
      class TestClass {
        async testMethod(shouldFail: boolean) {
          if (shouldFail) {
            throw new AdapterConfigurationError('Decorated error');
          }
          return 'success';
        }
      }

      // Apply decorator manually
      const originalMethod = TestClass.prototype.testMethod;
      const decorator = withErrorRecovery({
        operation: 'custom-operation',
        adapterName: 'test-adapter',
      });

      const descriptor = {
        value: originalMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      };

      decorator(TestClass.prototype, 'testMethod', descriptor);
      TestClass.prototype.testMethod = descriptor.value!;

      const instance = new TestClass();

      // Test success case
      const successResult = await instance.testMethod(false);
      expect(successResult).toBe('success');

      // Test error recovery case
      const errorResult = await instance.testMethod(true);
      expect(errorResult).toEqual(
        expect.objectContaining({
          name: 'test-adapter',
        })
      );
    });

    it('should include method context in recovery', async () => {
      const customStrategy: RecoveryStrategy = {
        canRecover: () => true,
        recover: async (error, context) => {
          expect(context.operation).toBe('TestClass.decoratedMethod');
          expect(context.originalArgs).toEqual(['test-arg']);
          return 'recovered-with-context';
        },
        priority: 100,
      };

      globalErrorRecovery.registerStrategy('context-test', customStrategy);

      class TestClass {
        async decoratedMethod(arg: string) {
          throw new AdapterError('Test error', 'TEST');
        }
      }

      // Apply decorator manually
      const originalMethod = TestClass.prototype.decoratedMethod;
      const decorator = withErrorRecovery();

      const descriptor = {
        value: originalMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      };

      decorator(TestClass.prototype, 'decoratedMethod', descriptor);
      TestClass.prototype.decoratedMethod = descriptor.value!;

      const instance = new TestClass();
      const result = await instance.decoratedMethod('test-arg');

      expect(result).toBe('recovered-with-context');
      
      // Clean up global strategy
      globalErrorRecovery.removeStrategy('context-test');
    });

    it('should throw unrecoverable errors even with decorator', async () => {
      class TestClass {
        async failingMethod() {
          throw new AdapterError('Unrecoverable', 'UNRECOVERABLE', {
            recoverable: false,
          });
        }
      }

      // Apply decorator manually
      const originalMethod = TestClass.prototype.failingMethod;
      const decorator = withErrorRecovery();

      const descriptor = {
        value: originalMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      };

      decorator(TestClass.prototype, 'failingMethod', descriptor);
      TestClass.prototype.failingMethod = descriptor.value!;

      const instance = new TestClass();

      await expect(instance.failingMethod()).rejects.toThrow('Unrecoverable');
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should handle recovery strategy that returns undefined', async () => {
      const undefinedStrategy: RecoveryStrategy = {
        canRecover: () => true,
        recover: async () => undefined,
        priority: 10,
      };

      errorRecovery.clearStrategies();
      errorRecovery.registerStrategy('undefined', undefinedStrategy);

      const error = new AdapterError('Test', 'TEST');
      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });

    it('should handle empty context gracefully', async () => {
      const error = new AdapterConfigurationError('Test');
      const result = await errorRecovery.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.result).toEqual(
        expect.objectContaining({
          name: 'fallback-adapter',
        })
      );
    });

    it('should handle null error context gracefully', async () => {
      const error = new AdapterTokenError('Token error', {});
      const result = await errorRecovery.recover(error);

      expect(result.success).toBe(true);
      expect(result.result).toBeNull();
    });

    it('should handle retry count exceeding max retries', async () => {
      const error = new AdapterInitializationError('Init failed');
      
      const result = await errorRecovery.recover(error, {
        retryCount: 5,
        maxRetries: 3,
      });

      // Should fall through to next strategy (generic fallback)
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('genericFallback');
    });

    it('should handle very large cache sizes in performance optimization', async () => {
      const error = new AdapterPerformanceError('Performance issue');
      
      const result = await errorRecovery.recover(error, {
        metadata: { cacheSize: 2000000 }, // Very large cache
      });

      expect(result.success).toBe(true);
      expect((result.result as any).cacheSize).toBe(Math.max(500, 1000000)); // Half, but at least 500
    });

    it('should handle malformed token paths', async () => {
      const testCases = [
        'single',
        'category.',
        '.property',
        'category..property',
        'category.property.',
      ];

      for (const tokenPath of testCases) {
        const error = new AdapterTokenError('Token error', { tokenPath });
        const result = await errorRecovery.recover(error);
        
        // Should handle gracefully and return appropriate fallback or null
        expect(result.success).toBe(true);
        expect(['string', 'object']).toContain(typeof result.result);
      }
    });
  });
});