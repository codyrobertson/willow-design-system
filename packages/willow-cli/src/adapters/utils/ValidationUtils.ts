import { AdapterValidator, ValidationResult, ValidationOptions } from '../base/AdapterValidator.js';
import { AdapterConfig } from '../base/UIKitAdapter.js';
import { ComponentConfig, StyleConfig, TokenConfig } from '../types/AdapterTypes.js';
import { AdapterRegistration } from '../base/AdapterRegistry.js';

/**
 * Validation utilities for adapter configurations
 */
export class ValidationUtils {
  private static validator = new AdapterValidator();

  /**
   * Validate adapter configuration with strict rules
   */
  static validateAdapterConfigStrict(config: unknown): ValidationResult {
    return this.validator.validateAdapterConfig(config, {
      strict: true,
      abortEarly: false,
      maxErrors: 20,
      useDefaults: false,
      coerceTypes: false,
    });
  }

  /**
   * Validate and sanitize adapter configuration
   */
  static validateAndSanitizeAdapterConfig(config: unknown): ValidationResult {
    return this.validator.validateAdapterConfig(config, {
      strict: false,
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
      maxErrors: 10,
    });
  }

  /**
   * Validate component configuration with detailed errors
   */
  static validateComponentConfig(config: unknown): ValidationResult {
    return this.validator.validateComponentConfig(config, {
      verbose: true,
      abortEarly: false,
    });
  }

  /**
   * Validate style configuration
   */
  static validateStyleConfig(styles: unknown): ValidationResult {
    return this.validator.validateStyleConfig(styles, {
      allowAdditionalProperties: true,
      useDefaults: false,
    });
  }

  /**
   * Validate token configuration with coercion
   */
  static validateTokenConfig(tokens: unknown): ValidationResult {
    return this.validator.validateTokenConfig(tokens, {
      coerceTypes: true,
      removeAdditional: false,
      useDefaults: true,
    });
  }

  /**
   * Validate adapter registration
   */
  static validateAdapterRegistration(registration: unknown): ValidationResult {
    return this.validator.validateAdapterRegistration(registration, {
      strict: true,
      verbose: true,
    });
  }

  /**
   * Batch validate multiple configurations
   */
  static batchValidate(items: Array<{ type: string; data: unknown }>): Array<ValidationResult & { type: string }> {
    return items.map(({ type, data }) => {
      let result: ValidationResult;
      
      switch (type) {
        case 'adapter':
          result = this.validator.validateAdapterConfig(data);
          break;
        case 'component':
          result = this.validator.validateComponentConfig(data);
          break;
        case 'style':
          result = this.validator.validateStyleConfig(data);
          break;
        case 'token':
          result = this.validator.validateTokenConfig(data);
          break;
        case 'registration':
          result = this.validator.validateAdapterRegistration(data);
          break;
        default:
          result = {
            valid: false,
            errors: [{ path: '', message: `Unknown validation type: ${type}`, code: 'UNKNOWN_TYPE' }],
          };
      }
      
      return { ...result, type };
    });
  }

  /**
   * Check if configuration is valid without detailed results
   */
  static isValidAdapterConfig(config: unknown): boolean {
    const result = this.validator.validateAdapterConfig(config, { abortEarly: true });
    return result.valid;
  }

  /**
   * Get validation summary
   */
  static getValidationSummary(result: ValidationResult): {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    summary: string;
  } {
    const errorCount = result.errors?.length || 0;
    const warningCount = result.warnings?.length || 0;
    
    let summary = 'Valid configuration';
    if (!result.valid) {
      summary = `Invalid: ${errorCount} error(s)`;
      if (warningCount > 0) {
        summary += `, ${warningCount} warning(s)`;
      }
    } else if (warningCount > 0) {
      summary = `Valid with ${warningCount} warning(s)`;
    }

    return {
      isValid: result.valid,
      errorCount,
      warningCount,
      summary,
    };
  }

  /**
   * Format validation errors for display
   */
  static formatValidationErrors(result: ValidationResult): string[] {
    const messages: string[] = [];
    
    if (result.errors) {
      result.errors.forEach(error => {
        const path = error.path ? `[${error.path}] ` : '';
        messages.push(`Error: ${path}${error.message}`);
      });
    }
    
    if (result.warnings) {
      result.warnings.forEach(warning => {
        const path = warning.path ? `[${warning.path}] ` : '';
        messages.push(`Warning: ${path}${warning.message}`);
      });
    }
    
    return messages;
  }

  /**
   * Validate with custom rules
   */
  static validateWithCustomRules<T>(
    data: unknown,
    validator: (data: T) => ValidationResult,
    options: ValidationOptions = {}
  ): ValidationResult {
    try {
      // First run standard validation
      const schemaResult = this.validator.validateAdapterConfig(data, options);
      if (!schemaResult.valid) {
        return schemaResult;
      }

      // Then run custom validation
      return validator(schemaResult.data as T);
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: '',
          message: `Custom validation failed: ${error.message}`,
          code: 'CUSTOM_VALIDATION_ERROR',
        }],
      };
    }
  }

  /**
   * Deep merge validation results
   */
  static mergeValidationResults(...results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap(r => r.errors || []);
    const allWarnings = results.flatMap(r => r.warnings || []);
    const isValid = results.every(r => r.valid);
    
    // Merge data objects if all are valid
    let mergedData: any = {};
    if (isValid) {
      for (const result of results) {
        if (result.data && typeof result.data === 'object') {
          mergedData = { ...mergedData, ...result.data };
        }
      }
    }

    return {
      valid: isValid,
      errors: allErrors.length > 0 ? allErrors : undefined,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
      data: isValid ? mergedData : undefined,
    };
  }

  /**
   * Validate adapter compatibility
   */
  static validateAdapterCompatibility(
    adapterConfig: AdapterConfig,
    targetVersion: string
  ): ValidationResult {
    const errors: Array<{ path: string; message: string; code: string }> = [];
    const warnings: Array<{ path: string; message: string; suggestion?: string }> = [];

    // Version compatibility check
    const adapterVersion = adapterConfig.version;
    const adapterMajor = parseInt(adapterVersion.split('.')[0]);
    const targetMajor = parseInt(targetVersion.split('.')[0]);

    if (adapterMajor !== targetMajor) {
      errors.push({
        path: 'version',
        message: `Adapter version ${adapterVersion} is incompatible with target version ${targetVersion}`,
        code: 'VERSION_INCOMPATIBLE',
      });
    }

    // Performance mode validation
    if (adapterConfig.options?.performanceMode === 'fast' && adapterConfig.options?.debugMode) {
      warnings.push({
        path: 'options.performanceMode',
        message: 'Fast performance mode with debug enabled may impact performance',
        suggestion: 'Consider disabling debug mode in production',
      });
    }

    // Cache size validation
    const cacheSize = adapterConfig.options?.cacheSize;
    if (cacheSize && cacheSize > 50000) {
      warnings.push({
        path: 'options.cacheSize',
        message: 'Large cache size may cause memory issues',
        suggestion: 'Consider reducing cache size below 50000',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate required dependencies
   */
  static validateDependencies(registration: AdapterRegistration): ValidationResult {
    const errors: Array<{ path: string; message: string; code: string }> = [];
    const warnings: Array<{ path: string; message: string; suggestion?: string }> = [];

    // Check for common required dependencies
    const requiredDeps = ['react', 'react-dom'];
    const availableDeps = Object.keys(registration.dependencies || {});
    const availablePeerDeps = Object.keys(registration.peerDependencies || {});
    const allDeps = [...availableDeps, ...availablePeerDeps];

    for (const requiredDep of requiredDeps) {
      if (!allDeps.includes(requiredDep)) {
        warnings.push({
          path: `dependencies.${requiredDep}`,
          message: `Missing common dependency: ${requiredDep}`,
          suggestion: `Consider adding ${requiredDep} to dependencies or peerDependencies`,
        });
      }
    }

    // Check for version conflicts
    if (registration.dependencies && registration.peerDependencies) {
      for (const [dep, version] of Object.entries(registration.dependencies)) {
        if (registration.peerDependencies[dep] && registration.peerDependencies[dep] !== version) {
          errors.push({
            path: `dependencies.${dep}`,
            message: `Version conflict: ${dep} is specified in both dependencies (${version}) and peerDependencies (${registration.peerDependencies[dep]})`,
            code: 'VERSION_CONFLICT',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}