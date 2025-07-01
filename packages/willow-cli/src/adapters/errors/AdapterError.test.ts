import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AdapterError,
  AdapterInitializationError,
  AdapterConfigurationError,
  AdapterValidationError,
  AdapterMappingError,
  AdapterStyleError,
  AdapterTokenError,
  AdapterRegistryError,
  AdapterLifecycleError,
  AdapterDependencyError,
  AdapterPerformanceError,
  isAdapterError,
  isAdapterErrorType,
  getErrorCode,
  toAdapterError,
} from './AdapterError';

describe('AdapterError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base AdapterError', () => {
    it('should create error with basic properties', () => {
      const error = new AdapterError('Test error', 'TEST_ERROR');

      expect(error.name).toBe('AdapterError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.severity).toBe('medium');
      expect(error.recoverable).toBe(true);
      expect(error.context).toEqual({});
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.cause).toBeUndefined();
    });

    it('should create error with custom options', () => {
      const context = { adapterName: 'test-adapter' };
      const cause = new Error('Original error');
      
      const error = new AdapterError('Test error', 'TEST_ERROR', {
        context,
        severity: 'high',
        recoverable: false,
        cause,
      });

      expect(error.context).toEqual(context);
      expect(error.severity).toBe('high');
      expect(error.recoverable).toBe(false);
      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON correctly', () => {
      const cause = new Error('Original error');
      const error = new AdapterError('Test error', 'TEST_ERROR', {
        context: { key: 'value' },
        severity: 'critical',
        recoverable: false,
        cause,
      });

      const json = error.toJSON();

      expect(json.name).toBe('AdapterError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.severity).toBe('critical');
      expect(json.recoverable).toBe(false);
      expect(json.context).toEqual({ key: 'value' });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
      expect(json.cause).toEqual({
        name: 'Error',
        message: 'Original error',
        stack: cause.stack,
      });
    });

    it('should get error details', () => {
      const error = new AdapterError('Test error', 'TEST_ERROR', {
        context: { adapterName: 'test' },
        severity: 'high',
      });

      const details = error.getDetails();

      expect(details).toContain('Code: TEST_ERROR');
      expect(details).toContain('Severity: high');
      expect(details).toContain('Recoverable: true');
      expect(details).toContain('adapterName');
    });

    it('should maintain proper stack trace', () => {
      const error = new AdapterError('Test error', 'TEST_ERROR');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AdapterError');
    });
  });

  describe('AdapterInitializationError', () => {
    it('should create initialization error with proper defaults', () => {
      const error = new AdapterInitializationError('Initialization failed');

      expect(error.name).toBe('AdapterInitializationError');
      expect(error.code).toBe('ADAPTER_INITIALIZATION_ERROR');
      expect(error.severity).toBe('high');
      expect(error.recoverable).toBe(true);
    });

    it('should include adapter information in context', () => {
      const error = new AdapterInitializationError('Initialization failed', {
        adapterName: 'test-adapter',
        version: '1.0.0',
        context: { customData: 'value' },
      });

      expect(error.context).toEqual({
        adapterName: 'test-adapter',
        version: '1.0.0',
        customData: 'value',
      });
    });
  });

  describe('AdapterConfigurationError', () => {
    it('should create configuration error with proper defaults', () => {
      const error = new AdapterConfigurationError('Invalid configuration');

      expect(error.name).toBe('AdapterConfigurationError');
      expect(error.code).toBe('ADAPTER_CONFIGURATION_ERROR');
      expect(error.severity).toBe('medium');
      expect(error.recoverable).toBe(true);
    });

    it('should include configuration details in context', () => {
      const error = new AdapterConfigurationError('Invalid configuration', {
        configPath: 'options.theme',
        expectedType: 'string',
        actualValue: 123,
      });

      expect(error.context).toEqual({
        configPath: 'options.theme',
        expectedType: 'string',
        actualValue: 123,
      });
    });
  });

  describe('AdapterValidationError', () => {
    it('should create validation error with proper defaults', () => {
      const validationErrors = [
        { path: 'name', message: 'Required', code: 'REQUIRED' },
        { path: 'version', message: 'Invalid format', code: 'FORMAT' },
      ];

      const error = new AdapterValidationError('Validation failed', validationErrors);

      expect(error.name).toBe('AdapterValidationError');
      expect(error.code).toBe('ADAPTER_VALIDATION_ERROR');
      expect(error.severity).toBe('medium');
      expect(error.recoverable).toBe(true);
      expect(error.validationErrors).toEqual(validationErrors);
      expect(error.context.errorCount).toBe(2);
    });

    it('should get formatted validation messages', () => {
      const validationErrors = [
        { path: 'name', message: 'Required', code: 'REQUIRED' },
        { path: '', message: 'Global error', code: 'GLOBAL' },
      ];

      const error = new AdapterValidationError('Validation failed', validationErrors);
      const messages = error.getValidationMessages();

      expect(messages).toEqual([
        '[name] Required',
        'Global error',
      ]);
    });

    it('should include validation errors in JSON', () => {
      const validationErrors = [
        { path: 'name', message: 'Required', code: 'REQUIRED' },
      ];

      const error = new AdapterValidationError('Validation failed', validationErrors);
      const json = error.toJSON();

      expect(json.validationErrors).toEqual(validationErrors);
    });
  });

  describe('AdapterMappingError', () => {
    it('should create mapping error with component context', () => {
      const error = new AdapterMappingError('Component mapping failed', {
        componentName: 'Button',
        componentType: 'button',
        props: { variant: 'primary' },
      });

      expect(error.name).toBe('AdapterMappingError');
      expect(error.code).toBe('ADAPTER_MAPPING_ERROR');
      expect(error.context).toEqual({
        componentName: 'Button',
        componentType: 'button',
        props: { variant: 'primary' },
      });
    });
  });

  describe('AdapterStyleError', () => {
    it('should create style error with style context', () => {
      const error = new AdapterStyleError('Style translation failed', {
        styleName: 'backgroundColor',
        styleValue: 'invalid-color',
        expectedFormat: 'hex color',
      });

      expect(error.name).toBe('AdapterStyleError');
      expect(error.code).toBe('ADAPTER_STYLE_ERROR');
      expect(error.severity).toBe('low');
      expect(error.context).toEqual({
        styleName: 'backgroundColor',
        styleValue: 'invalid-color',
        expectedFormat: 'hex color',
      });
    });
  });

  describe('AdapterTokenError', () => {
    it('should create token error with token context', () => {
      const error = new AdapterTokenError('Token conversion failed', {
        tokenPath: 'colors.primary.500',
        tokenValue: 'invalid',
        conversionType: 'hex-to-rgb',
      });

      expect(error.name).toBe('AdapterTokenError');
      expect(error.code).toBe('ADAPTER_TOKEN_ERROR');
      expect(error.context).toEqual({
        tokenPath: 'colors.primary.500',
        tokenValue: 'invalid',
        conversionType: 'hex-to-rgb',
      });
    });
  });

  describe('AdapterRegistryError', () => {
    it('should create registry error with proper severity', () => {
      const error = new AdapterRegistryError('Registry operation failed', {
        operation: 'register',
        adapterName: 'test-adapter',
        version: '1.0.0',
      });

      expect(error.name).toBe('AdapterRegistryError');
      expect(error.code).toBe('ADAPTER_REGISTRY_ERROR');
      expect(error.severity).toBe('high');
      expect(error.recoverable).toBe(false);
      expect(error.context).toEqual({
        operation: 'register',
        adapterName: 'test-adapter',
        version: '1.0.0',
      });
    });
  });

  describe('AdapterLifecycleError', () => {
    it('should create lifecycle error with phase context', () => {
      const error = new AdapterLifecycleError('Lifecycle hook failed', {
        phase: 'initialization',
        adapterName: 'test-adapter',
        hookName: 'beforeInitialize',
      });

      expect(error.name).toBe('AdapterLifecycleError');
      expect(error.code).toBe('ADAPTER_LIFECYCLE_ERROR');
      expect(error.severity).toBe('high');
      expect(error.context).toEqual({
        phase: 'initialization',
        adapterName: 'test-adapter',
        hookName: 'beforeInitialize',
      });
    });
  });

  describe('AdapterDependencyError', () => {
    it('should create dependency error with critical severity', () => {
      const error = new AdapterDependencyError('Dependency not found', {
        dependencyName: 'react',
        requiredVersion: '^18.0.0',
        actualVersion: '17.0.0',
        operation: 'version-check',
      });

      expect(error.name).toBe('AdapterDependencyError');
      expect(error.code).toBe('ADAPTER_DEPENDENCY_ERROR');
      expect(error.severity).toBe('critical');
      expect(error.recoverable).toBe(false);
      expect(error.context).toEqual({
        dependencyName: 'react',
        requiredVersion: '^18.0.0',
        actualVersion: '17.0.0',
        operation: 'version-check',
      });
    });
  });

  describe('AdapterPerformanceError', () => {
    it('should create performance error with timing context', () => {
      const error = new AdapterPerformanceError('Operation timeout', {
        operation: 'component-mapping',
        duration: 5000,
        threshold: 3000,
        memoryUsage: 50000000,
      });

      expect(error.name).toBe('AdapterPerformanceError');
      expect(error.code).toBe('ADAPTER_PERFORMANCE_ERROR');
      expect(error.severity).toBe('medium');
      expect(error.context).toEqual({
        operation: 'component-mapping',
        duration: 5000,
        threshold: 3000,
        memoryUsage: 50000000,
      });
    });
  });

  describe('Type guards and utilities', () => {
    it('should identify AdapterError instances', () => {
      const adapterError = new AdapterError('Test', 'TEST');
      const regularError = new Error('Regular error');
      const notError = 'not an error';

      expect(isAdapterError(adapterError)).toBe(true);
      expect(isAdapterError(regularError)).toBe(false);
      expect(isAdapterError(notError)).toBe(false);
    });

    it('should identify specific adapter error types', () => {
      const initError = new AdapterInitializationError('Init failed');
      const configError = new AdapterConfigurationError('Config failed');
      const baseError = new AdapterError('Base error', 'BASE');

      expect(isAdapterErrorType(initError, AdapterInitializationError)).toBe(true);
      expect(isAdapterErrorType(configError, AdapterInitializationError)).toBe(false);
      expect(isAdapterErrorType(baseError, AdapterInitializationError)).toBe(false);
    });

    it('should get error codes correctly', () => {
      const adapterError = new AdapterError('Test', 'TEST_CODE');
      const regularError = new Error('Regular error');
      const notError = 'not an error';

      expect(getErrorCode(adapterError)).toBe('TEST_CODE');
      expect(getErrorCode(regularError)).toBe('UNKNOWN_ERROR');
      expect(getErrorCode(notError)).toBe('INVALID_ERROR');
    });

    it('should convert errors to AdapterError', () => {
      const adapterError = new AdapterError('Test', 'TEST');
      const regularError = new Error('Regular error');
      const stringError = 'string error';

      const context = { operation: 'test' };

      // AdapterError should be returned as-is
      expect(toAdapterError(adapterError, context)).toBe(adapterError);

      // Regular Error should be wrapped
      const wrappedError = toAdapterError(regularError, context);
      expect(wrappedError).toBeInstanceOf(AdapterError);
      expect(wrappedError.code).toBe('WRAPPED_ERROR');
      expect(wrappedError.message).toBe('Regular error');
      expect(wrappedError.cause).toBe(regularError);
      expect(wrappedError.context.operation).toBe('test');

      // String should be converted
      const stringWrapped = toAdapterError(stringError, context);
      expect(stringWrapped).toBeInstanceOf(AdapterError);
      expect(stringWrapped.code).toBe('UNKNOWN_ERROR');
      expect(stringWrapped.message).toBe('string error');
      expect(stringWrapped.context.operation).toBe('test');
    });
  });

  describe('Error serialization and deserialization', () => {
    it('should serialize complex error to JSON', () => {
      const cause = new Error('Original cause');
      cause.stack = 'Error: Original cause\n    at test';

      const error = new AdapterValidationError(
        'Complex validation error',
        [
          { path: 'field1', message: 'Required', code: 'REQUIRED', value: undefined },
          { path: 'field2', message: 'Invalid', code: 'INVALID', value: 'bad-value' },
        ],
        {
          context: { operation: 'validate-config' },
          cause,
        }
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'AdapterValidationError',
        message: 'Complex validation error',
        code: 'ADAPTER_VALIDATION_ERROR',
        severity: 'medium',
        recoverable: true,
        validationErrors: [
          { path: 'field1', message: 'Required', code: 'REQUIRED', value: undefined },
          { path: 'field2', message: 'Invalid', code: 'INVALID', value: 'bad-value' },
        ],
        context: {
          errorCount: 2,
          operation: 'validate-config',
        },
        cause: {
          name: 'Error',
          message: 'Original cause',
          stack: 'Error: Original cause\n    at test',
        },
      });

      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it('should handle errors without cause in JSON', () => {
      const error = new AdapterError('Simple error', 'SIMPLE');
      const json = error.toJSON();

      expect(json.cause).toBeUndefined();
    });

    it('should provide detailed error information', () => {
      const error = new AdapterError('Test error', 'TEST_ERROR', {
        context: { key1: 'value1', key2: 'value2' },
        severity: 'critical',
        recoverable: false,
      });

      const details = error.getDetails();

      expect(details).toContain('Code: TEST_ERROR');
      expect(details).toContain('Severity: critical');
      expect(details).toContain('Recoverable: false');
      expect(details).toContain('key1');
      expect(details).toContain('value1');
      expect(details).toContain('key2');
      expect(details).toContain('value2');
    });
  });
});