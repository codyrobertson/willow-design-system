import { z } from 'zod';
import type { WillowConfig, ConfigSource } from '@willow-cli/types';
import { WillowConfigSchema } from '@willow-cli/types';

export interface ValidationOptions {
  /**
   * Whether to allow unknown properties
   */
  strict?: boolean;
  
  /**
   * Whether to coerce types
   */
  coerce?: boolean;
  
  /**
   * Custom error formatter
   */
  errorFormatter?: (error: z.ZodError) => ValidationError[];
}

export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;
  
  /**
   * Validated and transformed data
   */
  data?: WillowConfig;
  
  /**
   * Validation errors
   */
  errors?: ValidationError[];
  
  /**
   * Warnings (non-fatal issues)
   */
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  source?: ConfigSource;
  value?: any;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export class ConfigValidator {
  private schema: z.ZodSchema<WillowConfig>;
  
  constructor(private options: ValidationOptions = {}) {
    this.schema = this.createSchema();
  }
  
  /**
   * Validate configuration
   */
  validate(config: unknown, source?: ConfigSource): ValidationResult {
    try {
      const data = this.schema.parse(config);
      const warnings = this.checkForWarnings(data);
      
      return {
        valid: true,
        data,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = this.options.errorFormatter
          ? this.options.errorFormatter(error)
          : this.formatErrors(error, source);
          
        return {
          valid: false,
          errors,
        };
      }
      
      // Unknown error
      return {
        valid: false,
        errors: [{
          path: '',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          source,
        }],
      };
    }
  }
  
  /**
   * Validate partial configuration (for development)
   */
  validatePartial(config: unknown, source?: ConfigSource): ValidationResult {
    try {
      // Use partial schema for development
      const partialSchema = this.schema.partial();
      const data = partialSchema.parse(config) as WillowConfig;
      const warnings = this.checkForWarnings(data);
      
      return {
        valid: true,
        data,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = this.options.errorFormatter
          ? this.options.errorFormatter(error)
          : this.formatErrors(error, source);
          
        return {
          valid: false,
          errors,
        };
      }
      
      return {
        valid: false,
        errors: [{
          path: '',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          source,
        }],
      };
    }
  }
  
  /**
   * Create validation schema
   */
  private createSchema(): z.ZodSchema<WillowConfig> {
    let schema = WillowConfigSchema;
    
    // Apply options
    if (!this.options.strict) {
      schema = schema.passthrough() as any;
    }
    
    if (this.options.coerce) {
      // Add coercion for common types
      // This would need to be implemented with custom preprocessing
      // For now, we'll use the base schema
    }
    
    return schema;
  }
  
  /**
   * Format Zod errors
   */
  private formatErrors(zodError: z.ZodError, source?: ConfigSource): ValidationError[] {
    return zodError.errors.map(error => ({
      path: error.path.join('.'),
      message: this.formatErrorMessage(error),
      source,
      value: error.code === 'invalid_type' ? (error as any).received : undefined,
    }));
  }
  
  /**
   * Format error message
   */
  private formatErrorMessage(error: z.ZodIssue): string {
    switch (error.code) {
      case 'invalid_type':
        return `Expected ${(error as any).expected}, received ${(error as any).received}`;
        
      case 'invalid_enum_value':
        return `Invalid value. Expected one of: ${(error as any).options.join(', ')}`;
        
      case 'too_small':
        return `Value is too small. Minimum: ${(error as any).minimum}`;
        
      case 'too_big':
        return `Value is too large. Maximum: ${(error as any).maximum}`;
        
      case 'invalid_string':
        return `Invalid string format: ${(error as any).validation}`;
        
      default:
        return error.message;
    }
  }
  
  /**
   * Check for configuration warnings
   */
  private checkForWarnings(config: WillowConfig): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Check for deprecated options
    if (config.uiKit === 'legacy-ui') {
      warnings.push({
        path: 'uiKit',
        message: 'The "legacy-ui" kit is deprecated',
        suggestion: 'Consider migrating to "willow" or "radix"',
      });
    }
    
    // Check for experimental features in production
    if (config.features?.experimental?.aiTranslation && !config.features.dryRun) {
      warnings.push({
        path: 'features.experimental.aiTranslation',
        message: 'AI translation is experimental and may produce unexpected results',
        suggestion: 'Enable dry-run mode to preview changes before applying',
      });
    }
    
    // Check for missing recommended options
    if (!config.validation?.rules || config.validation.rules.length === 0) {
      warnings.push({
        path: 'validation.rules',
        message: 'No validation rules configured',
        suggestion: 'Add validation rules to ensure code quality',
      });
    }
    
    // Check for performance considerations
    if (config.features?.verbose && !config.paths?.cache) {
      warnings.push({
        path: 'paths.cache',
        message: 'Verbose mode without cache may impact performance',
        suggestion: 'Configure a cache directory for better performance',
      });
    }
    
    return warnings;
  }
  
  /**
   * Get schema information
   */
  getSchemaInfo(): SchemaInfo {
    return {
      requiredFields: this.getRequiredFields(),
      optionalFields: this.getOptionalFields(),
      enumValues: this.getEnumValues(),
    };
  }
  
  /**
   * Get required fields from schema
   */
  private getRequiredFields(): string[] {
    // This would need to traverse the schema
    // For now, return known required fields
    return ['version'];
  }
  
  /**
   * Get optional fields from schema
   */
  private getOptionalFields(): string[] {
    // This would need to traverse the schema
    // For now, return known optional fields
    return [
      'uiKit',
      'designSystem',
      'features',
      'paths',
      'transforms',
      'validation',
      'plugins',
    ];
  }
  
  /**
   * Get enum values from schema
   */
  private getEnumValues(): Record<string, string[]> {
    return {
      'features.componentNaming': ['PascalCase', 'kebab-case', 'camelCase'],
      'features.styleNaming': ['camelCase', 'kebab-case', 'snake_case'],
    };
  }
}

export interface SchemaInfo {
  requiredFields: string[];
  optionalFields: string[];
  enumValues: Record<string, string[]>;
}