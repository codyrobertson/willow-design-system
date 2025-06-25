import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationUtils } from './ValidationUtils';
import { AdapterValidator, ValidationResult } from '../base/AdapterValidator';
import { AdapterConfig } from '../base/UIKitAdapter';
import { ComponentConfig, StyleConfig, TokenConfig, ComponentType } from '../types/AdapterTypes';
import { AdapterRegistration } from '../base/AdapterRegistry';

// Mock the AdapterValidator
vi.mock('../base/AdapterValidator');

describe('ValidationUtils', () => {
  let mockValidator: any;

  beforeEach(() => {
    mockValidator = {
      validateAdapterConfig: vi.fn(),
      validateComponentConfig: vi.fn(),
      validateStyleConfig: vi.fn(),
      validateTokenConfig: vi.fn(),
      validateAdapterRegistration: vi.fn(),
    };
    (ValidationUtils as any).validator = mockValidator;
    vi.clearAllMocks();
  });

  describe('validateAdapterConfigStrict', () => {
    it('should call validator with strict options', () => {
      const config = { name: 'test', version: '1.0.0' };
      const expectedResult: ValidationResult = { valid: true };
      
      mockValidator.validateAdapterConfig.mockReturnValue(expectedResult);

      const result = ValidationUtils.validateAdapterConfigStrict(config);

      expect(mockValidator.validateAdapterConfig).toHaveBeenCalledWith(config, {
        strict: true,
        abortEarly: false,
        maxErrors: 20,
        useDefaults: false,
        coerceTypes: false,
      });
      expect(result).toBe(expectedResult);
    });

    it('should handle validation errors correctly', () => {
      const config = { invalid: 'config' };
      const expectedResult: ValidationResult = {
        valid: false,
        errors: [{ path: 'name', message: 'Required field missing', code: 'REQUIRED' }]
      };
      
      mockValidator.validateAdapterConfig.mockReturnValue(expectedResult);

      const result = ValidationUtils.validateAdapterConfigStrict(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validateAndSanitizeAdapterConfig', () => {
    it('should call validator with sanitization options', () => {
      const config = { name: 'test', version: '1.0.0', extra: 'property' };
      const expectedResult: ValidationResult = { valid: true, data: { name: 'test', version: '1.0.0' } };
      
      mockValidator.validateAdapterConfig.mockReturnValue(expectedResult);

      const result = ValidationUtils.validateAndSanitizeAdapterConfig(config);

      expect(mockValidator.validateAdapterConfig).toHaveBeenCalledWith(config, {
        strict: false,
        removeAdditional: true,
        useDefaults: true,
        coerceTypes: true,
        maxErrors: 10,
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('validateComponentConfig', () => {
    it('should validate component configuration with verbose errors', () => {
      const componentConfig: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        props: { variant: 'primary' }
      };
      const expectedResult: ValidationResult = { valid: true };
      
      mockValidator.validateComponentConfig.mockReturnValue(expectedResult);

      const result = ValidationUtils.validateComponentConfig(componentConfig);

      expect(mockValidator.validateComponentConfig).toHaveBeenCalledWith(componentConfig, {
        verbose: true,
        abortEarly: false,
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('validateStyleConfig', () => {
    it('should validate style configuration with additional properties allowed', () => {
      const styleConfig: StyleConfig = {
        base: { display: 'flex' },
        variants: { primary: { backgroundColor: 'blue' } }
      };
      const expectedResult: ValidationResult = { valid: true };
      
      mockValidator.validateStyleConfig.mockReturnValue(expectedResult);

      const result = ValidationUtils.validateStyleConfig(styleConfig);

      expect(mockValidator.validateStyleConfig).toHaveBeenCalledWith(styleConfig, {
        allowAdditionalProperties: true,
        useDefaults: false,
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('validateTokenConfig', () => {
    it('should validate token configuration with type coercion', () => {
      const tokenConfig: TokenConfig = {
        colors: { primary: { '500': '#3B82F6' } },
        typography: { fontSize: { base: '1rem' } }
      };
      const expectedResult: ValidationResult = { valid: true };
      
      mockValidator.validateTokenConfig.mockReturnValue(expectedResult);

      const result = ValidationUtils.validateTokenConfig(tokenConfig);

      expect(mockValidator.validateTokenConfig).toHaveBeenCalledWith(tokenConfig, {
        coerceTypes: true,
        removeAdditional: false,
        useDefaults: true,
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('validateAdapterRegistration', () => {
    it('should validate adapter registration with strict and verbose options', () => {
      const registration: AdapterRegistration = {
        name: 'test-adapter',
        version: '1.0.0',
        adapterClass: class TestAdapter {},
        dependencies: {},
        peerDependencies: {}
      };
      const expectedResult: ValidationResult = { valid: true };
      
      mockValidator.validateAdapterRegistration.mockReturnValue(expectedResult);

      const result = ValidationUtils.validateAdapterRegistration(registration);

      expect(mockValidator.validateAdapterRegistration).toHaveBeenCalledWith(registration, {
        strict: true,
        verbose: true,
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('batchValidate', () => {
    it('should validate multiple items and return results with type information', () => {
      const items = [
        { type: 'adapter', data: { name: 'test', version: '1.0.0' } },
        { type: 'component', data: { name: 'Button', type: ComponentType.Button } },
        { type: 'style', data: { base: { display: 'flex' } } }
      ];

      mockValidator.validateAdapterConfig.mockReturnValue({ valid: true });
      mockValidator.validateComponentConfig.mockReturnValue({ valid: true });
      mockValidator.validateStyleConfig.mockReturnValue({ valid: true });

      const results = ValidationUtils.batchValidate(items);

      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({ valid: true, type: 'adapter' });
      expect(results[1]).toMatchObject({ valid: true, type: 'component' });
      expect(results[2]).toMatchObject({ valid: true, type: 'style' });
    });

    it('should handle unknown validation types', () => {
      const items = [{ type: 'unknown', data: { some: 'data' } }];

      const results = ValidationUtils.batchValidate(items);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        valid: false,
        type: 'unknown',
        errors: [{ path: '', message: 'Unknown validation type: unknown', code: 'UNKNOWN_TYPE' }]
      });
    });

    it('should validate all supported types correctly', () => {
      const items = [
        { type: 'adapter', data: {} },
        { type: 'component', data: {} },
        { type: 'style', data: {} },
        { type: 'token', data: {} },
        { type: 'registration', data: {} }
      ];

      mockValidator.validateAdapterConfig.mockReturnValue({ valid: true });
      mockValidator.validateComponentConfig.mockReturnValue({ valid: true });
      mockValidator.validateStyleConfig.mockReturnValue({ valid: true });
      mockValidator.validateTokenConfig.mockReturnValue({ valid: true });
      mockValidator.validateAdapterRegistration.mockReturnValue({ valid: true });

      const results = ValidationUtils.batchValidate(items);

      expect(results).toHaveLength(5);
      expect(mockValidator.validateAdapterConfig).toHaveBeenCalledTimes(1);
      expect(mockValidator.validateComponentConfig).toHaveBeenCalledTimes(1);
      expect(mockValidator.validateStyleConfig).toHaveBeenCalledTimes(1);
      expect(mockValidator.validateTokenConfig).toHaveBeenCalledTimes(1);
      expect(mockValidator.validateAdapterRegistration).toHaveBeenCalledTimes(1);
    });
  });

  describe('isValidAdapterConfig', () => {
    it('should return true for valid configuration', () => {
      const config = { name: 'test', version: '1.0.0' };
      mockValidator.validateAdapterConfig.mockReturnValue({ valid: true });

      const result = ValidationUtils.isValidAdapterConfig(config);

      expect(result).toBe(true);
      expect(mockValidator.validateAdapterConfig).toHaveBeenCalledWith(config, { abortEarly: true });
    });

    it('should return false for invalid configuration', () => {
      const config = { invalid: 'config' };
      mockValidator.validateAdapterConfig.mockReturnValue({ 
        valid: false, 
        errors: [{ path: 'name', message: 'Required', code: 'REQUIRED' }] 
      });

      const result = ValidationUtils.isValidAdapterConfig(config);

      expect(result).toBe(false);
    });
  });

  describe('getValidationSummary', () => {
    it('should return summary for valid configuration', () => {
      const result: ValidationResult = { valid: true };

      const summary = ValidationUtils.getValidationSummary(result);

      expect(summary).toEqual({
        isValid: true,
        errorCount: 0,
        warningCount: 0,
        summary: 'Valid configuration'
      });
    });

    it('should return summary for invalid configuration with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          { path: 'name', message: 'Required', code: 'REQUIRED' },
          { path: 'version', message: 'Invalid format', code: 'FORMAT' }
        ]
      };

      const summary = ValidationUtils.getValidationSummary(result);

      expect(summary).toEqual({
        isValid: false,
        errorCount: 2,
        warningCount: 0,
        summary: 'Invalid: 2 error(s)'
      });
    });

    it('should return summary for valid configuration with warnings', () => {
      const result: ValidationResult = {
        valid: true,
        warnings: [
          { path: 'options', message: 'Deprecated option', suggestion: 'Use new option' }
        ]
      };

      const summary = ValidationUtils.getValidationSummary(result);

      expect(summary).toEqual({
        isValid: true,
        errorCount: 0,
        warningCount: 1,
        summary: 'Valid with 1 warning(s)'
      });
    });

    it('should return summary for invalid configuration with both errors and warnings', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [{ path: 'name', message: 'Required', code: 'REQUIRED' }],
        warnings: [{ path: 'options', message: 'Deprecated', suggestion: 'Update' }]
      };

      const summary = ValidationUtils.getValidationSummary(result);

      expect(summary).toEqual({
        isValid: false,
        errorCount: 1,
        warningCount: 1,
        summary: 'Invalid: 1 error(s), 1 warning(s)'
      });
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors and warnings correctly', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          { path: 'name', message: 'Required field', code: 'REQUIRED' },
          { path: '', message: 'Global error', code: 'GLOBAL' }
        ],
        warnings: [
          { path: 'options.theme', message: 'Deprecated option', suggestion: 'Use new theme' },
          { path: '', message: 'Global warning' }
        ]
      };

      const messages = ValidationUtils.formatValidationErrors(result);

      expect(messages).toEqual([
        'Error: [name] Required field',
        'Error: Global error',
        'Warning: [options.theme] Deprecated option',
        'Warning: Global warning'
      ]);
    });

    it('should handle empty errors and warnings', () => {
      const result: ValidationResult = { valid: true };

      const messages = ValidationUtils.formatValidationErrors(result);

      expect(messages).toEqual([]);
    });
  });

  describe('validateWithCustomRules', () => {
    it('should run schema validation first, then custom validation', () => {
      const data = { name: 'test', version: '1.0.0' };
      const customValidator = vi.fn().mockReturnValue({ valid: true });
      
      mockValidator.validateAdapterConfig.mockReturnValue({ 
        valid: true, 
        data: { name: 'test', version: '1.0.0' } 
      });

      const result = ValidationUtils.validateWithCustomRules(data, customValidator);

      expect(mockValidator.validateAdapterConfig).toHaveBeenCalledWith(data, {});
      expect(customValidator).toHaveBeenCalledWith({ name: 'test', version: '1.0.0' });
      expect(result.valid).toBe(true);
    });

    it('should return schema validation errors if schema validation fails', () => {
      const data = { invalid: 'config' };
      const customValidator = vi.fn();
      
      mockValidator.validateAdapterConfig.mockReturnValue({ 
        valid: false,
        errors: [{ path: 'name', message: 'Required', code: 'REQUIRED' }]
      });

      const result = ValidationUtils.validateWithCustomRules(data, customValidator);

      expect(customValidator).not.toHaveBeenCalled();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle custom validation errors', () => {
      const data = { name: 'test', version: '1.0.0' };
      const customValidator = vi.fn().mockImplementation(() => {
        throw new Error('Custom validation failed');
      });
      
      mockValidator.validateAdapterConfig.mockReturnValue({ 
        valid: true, 
        data: { name: 'test', version: '1.0.0' } 
      });

      const result = ValidationUtils.validateWithCustomRules(data, customValidator);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([{
        path: '',
        message: 'Custom validation failed: Custom validation failed',
        code: 'CUSTOM_VALIDATION_ERROR',
      }]);
    });
  });

  describe('mergeValidationResults', () => {
    it('should merge multiple valid results', () => {
      const results: ValidationResult[] = [
        { valid: true, data: { name: 'test' } },
        { valid: true, data: { version: '1.0.0' } },
        { valid: true, data: { theme: 'dark' } }
      ];

      const merged = ValidationUtils.mergeValidationResults(...results);

      expect(merged.valid).toBe(true);
      expect(merged.data).toEqual({ name: 'test', version: '1.0.0', theme: 'dark' });
      expect(merged.errors).toBeUndefined();
      expect(merged.warnings).toBeUndefined();
    });

    it('should merge errors and warnings from multiple results', () => {
      const results: ValidationResult[] = [
        { 
          valid: false, 
          errors: [{ path: 'name', message: 'Required', code: 'REQUIRED' }] 
        },
        { 
          valid: true, 
          warnings: [{ path: 'options', message: 'Deprecated', suggestion: 'Update' }] 
        },
        { 
          valid: false, 
          errors: [{ path: 'version', message: 'Invalid', code: 'INVALID' }] 
        }
      ];

      const merged = ValidationUtils.mergeValidationResults(...results);

      expect(merged.valid).toBe(false);
      expect(merged.errors).toHaveLength(2);
      expect(merged.warnings).toHaveLength(1);
      expect(merged.data).toBeUndefined();
    });

    it('should handle empty results array', () => {
      const merged = ValidationUtils.mergeValidationResults();

      expect(merged.valid).toBe(true);
      expect(merged.data).toEqual({});
      expect(merged.errors).toBeUndefined();
      expect(merged.warnings).toBeUndefined();
    });
  });

  describe('validateAdapterCompatibility', () => {
    it('should pass compatible versions', () => {
      const adapterConfig: AdapterConfig = {
        name: 'test-adapter',
        version: '1.2.3',
        options: {}
      };

      const result = ValidationUtils.validateAdapterCompatibility(adapterConfig, '1.5.0');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject incompatible major versions', () => {
      const adapterConfig: AdapterConfig = {
        name: 'test-adapter',
        version: '2.0.0',
        options: {}
      };

      const result = ValidationUtils.validateAdapterCompatibility(adapterConfig, '1.5.0');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        path: 'version',
        message: 'Adapter version 2.0.0 is incompatible with target version 1.5.0',
        code: 'VERSION_INCOMPATIBLE',
      });
    });

    it('should warn about performance mode with debug enabled', () => {
      const adapterConfig: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {
          performanceMode: 'fast',
          debugMode: true
        }
      };

      const result = ValidationUtils.validateAdapterCompatibility(adapterConfig, '1.0.0');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual({
        path: 'options.performanceMode',
        message: 'Fast performance mode with debug enabled may impact performance',
        suggestion: 'Consider disabling debug mode in production',
      });
    });

    it('should warn about large cache size', () => {
      const adapterConfig: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {
          cacheSize: 75000
        }
      };

      const result = ValidationUtils.validateAdapterCompatibility(adapterConfig, '1.0.0');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual({
        path: 'options.cacheSize',
        message: 'Large cache size may cause memory issues',
        suggestion: 'Consider reducing cache size below 50000',
      });
    });
  });

  describe('validateDependencies', () => {
    it('should pass with all required dependencies', () => {
      const registration: AdapterRegistration = {
        name: 'test-adapter',
        version: '1.0.0',
        adapterClass: class TestAdapter {},
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        },
        peerDependencies: {}
      };

      const result = ValidationUtils.validateDependencies(registration);

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should warn about missing common dependencies', () => {
      const registration: AdapterRegistration = {
        name: 'test-adapter',
        version: '1.0.0',
        adapterClass: class TestAdapter {},
        dependencies: {},
        peerDependencies: {}
      };

      const result = ValidationUtils.validateDependencies(registration);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings).toContainEqual({
        path: 'dependencies.react',
        message: 'Missing common dependency: react',
        suggestion: 'Consider adding react to dependencies or peerDependencies',
      });
      expect(result.warnings).toContainEqual({
        path: 'dependencies.react-dom',
        message: 'Missing common dependency: react-dom',
        suggestion: 'Consider adding react-dom to dependencies or peerDependencies',
      });
    });

    it('should detect version conflicts between dependencies and peer dependencies', () => {
      const registration: AdapterRegistration = {
        name: 'test-adapter',
        version: '1.0.0',
        adapterClass: class TestAdapter {},
        dependencies: {
          'react': '^18.0.0'
        },
        peerDependencies: {
          'react': '^17.0.0'
        }
      };

      const result = ValidationUtils.validateDependencies(registration);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        path: 'dependencies.react',
        message: 'Version conflict: react is specified in both dependencies (^18.0.0) and peerDependencies (^17.0.0)',
        code: 'VERSION_CONFLICT',
      });
    });

    it('should allow same versions in dependencies and peer dependencies', () => {
      const registration: AdapterRegistration = {
        name: 'test-adapter',
        version: '1.0.0',
        adapterClass: class TestAdapter {},
        dependencies: {
          'react': '^18.0.0'
        },
        peerDependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        }
      };

      const result = ValidationUtils.validateDependencies(registration);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });
});