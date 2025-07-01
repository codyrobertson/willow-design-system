import {
  AdapterConfigSchema,
  ComponentConfigSchema,
  StyleConfigSchema,
  TokenConfigSchema,
  AdapterRegistrationSchema,
  ValidationOptionsSchema,
} from './AdapterSchema';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  data?: any; // Validated and potentially coerced data
}

/**
 * Validation error interface
 */
export interface ValidationError {
  path: string;
  message: string;
  value?: any;
  expected?: string;
  code?: string;
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  path: string;
  message: string;
  value?: any;
  suggestion?: string;
}

/**
 * Validation options interface
 */
export interface ValidationOptions {
  strict?: boolean;
  allowAdditionalProperties?: boolean;
  coerceTypes?: boolean;
  removeAdditional?: boolean;
  useDefaults?: boolean;
  verbose?: boolean;
  abortEarly?: boolean;
  maxErrors?: number;
}

/**
 * JSON Schema validator for adapter configurations
 */
export class AdapterValidator {
  private defaultOptions: Required<ValidationOptions> = {
    strict: false,
    allowAdditionalProperties: true,
    coerceTypes: true,
    removeAdditional: false,
    useDefaults: true,
    verbose: false,
    abortEarly: false,
    maxErrors: 10,
  };

  /**
   * Validate adapter configuration
   */
  validateAdapterConfig(
    data: any,
    options: ValidationOptions = {}
  ): ValidationResult {
    return this.validate(data, AdapterConfigSchema, options);
  }

  /**
   * Validate component configuration
   */
  validateComponentConfig(
    data: any,
    options: ValidationOptions = {}
  ): ValidationResult {
    return this.validate(data, ComponentConfigSchema, options);
  }

  /**
   * Validate style configuration
   */
  validateStyleConfig(
    data: any,
    options: ValidationOptions = {}
  ): ValidationResult {
    return this.validate(data, StyleConfigSchema, options);
  }

  /**
   * Validate token configuration
   */
  validateTokenConfig(
    data: any,
    options: ValidationOptions = {}
  ): ValidationResult {
    return this.validate(data, TokenConfigSchema, options);
  }

  /**
   * Validate adapter registration
   */
  validateAdapterRegistration(
    data: any,
    options: ValidationOptions = {}
  ): ValidationResult {
    return this.validate(data, AdapterRegistrationSchema, options);
  }

  /**
   * Validate validation options themselves
   */
  validateValidationOptions(
    data: any,
    options: ValidationOptions = {}
  ): ValidationResult {
    return this.validate(data, ValidationOptionsSchema, options);
  }

  /**
   * Core validation method
   */
  private validate(
    data: any,
    schema: any,
    options: ValidationOptions = {}
  ): ValidationResult {
    const opts = { ...this.defaultOptions, ...options };
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Apply defaults if requested
      let validatedData = opts.useDefaults ? this.applyDefaults(data, schema) : { ...data };

      // Perform validation
      const validationResult = this.validateAgainstSchema(validatedData, schema, '', opts);
      
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
      validatedData = validationResult.data;

      // Type coercion if requested (before validation)
      if (opts.coerceTypes) {
        validatedData = this.coerceTypes(validatedData, schema);
        // Re-validate after coercion
        const revalidationResult = this.validateAgainstSchema(validatedData, schema, '', opts);
        errors.length = 0; // Clear previous errors
        warnings.length = 0; // Clear previous warnings
        errors.push(...revalidationResult.errors);
        warnings.push(...revalidationResult.warnings);
        validatedData = revalidationResult.data;
      }

      // Remove additional properties if requested
      if (opts.removeAdditional && errors.length === 0) {
        validatedData = this.removeAdditionalProperties(validatedData, schema);
      }

      // Strict mode additional checks
      if (opts.strict) {
        const strictErrors = this.performStrictValidation(validatedData, schema);
        errors.push(...strictErrors);
      }

      // Limit errors if specified
      if (errors.length > opts.maxErrors) {
        errors.splice(opts.maxErrors);
        errors.push({
          path: '',
          message: `Too many errors (showing first ${opts.maxErrors})`,
          code: 'TOO_MANY_ERRORS',
        });
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        data: errors.length === 0 ? validatedData : data,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: '',
          message: `Validation failed: ${error.message}`,
          code: 'VALIDATION_ERROR',
        }],
      };
    }
  }

  /**
   * Validate data against schema recursively
   */
  private validateAgainstSchema(
    data: any,
    schema: any,
    path: string,
    options: Required<ValidationOptions>
  ): { errors: ValidationError[]; warnings: ValidationWarning[]; data: any } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validatedData = data;

    if (options.abortEarly && errors.length > 0) {
      return { errors, warnings, data: validatedData };
    }

    // Handle null/undefined
    if (data === null || data === undefined) {
      if (schema.required && schema.required.length > 0) {
        errors.push({
          path,
          message: 'Required data is missing',
          expected: 'non-null value',
          code: 'REQUIRED',
        });
      }
      return { errors, warnings, data: validatedData };
    }

    // Type validation
    if (schema.type) {
      const typeError = this.validateType(data, schema.type, path);
      if (typeError) {
        errors.push(typeError);
        return { errors, warnings, data: validatedData };
      }
    }

    // Object validation
    if (schema.type === 'object' && typeof data === 'object') {
      const objectResult = this.validateObject(data, schema, path, options);
      errors.push(...objectResult.errors);
      warnings.push(...objectResult.warnings);
      validatedData = objectResult.data;
    }

    // Array validation
    if (schema.type === 'array' && Array.isArray(data)) {
      const arrayResult = this.validateArray(data, schema, path, options);
      errors.push(...arrayResult.errors);
      warnings.push(...arrayResult.warnings);
      validatedData = arrayResult.data;
    }

    // String validation
    if (schema.type === 'string' && typeof data === 'string') {
      const stringErrors = this.validateString(data, schema, path);
      errors.push(...stringErrors);
    }

    // Number validation
    if ((schema.type === 'number' || schema.type === 'integer') && typeof data === 'number') {
      const numberErrors = this.validateNumber(data, schema, path);
      errors.push(...numberErrors);
    }

    return { errors, warnings, data: validatedData };
  }

  /**
   * Validate type
   */
  private validateType(data: any, expectedType: string | string[], path: string): ValidationError | null {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    const types = Array.isArray(expectedType) ? expectedType : [expectedType];

    // Special handling for integer type
    if (types.includes('integer')) {
      if (typeof data === 'number' && Number.isInteger(data)) {
        return null; // Valid integer
      }
      if (types.length === 1) {
        return {
          path,
          message: `Expected integer, got ${actualType}`,
          value: data,
          expected: 'integer',
          code: 'TYPE_MISMATCH',
        };
      }
    }

    // For non-integer types, check if actual type matches any expected type
    const matchesType = types.some(type => {
      if (type === 'integer') {
        return typeof data === 'number' && Number.isInteger(data);
      }
      return type === actualType;
    });

    if (!matchesType) {
      return {
        path,
        message: `Expected ${types.join(' or ')}, got ${actualType}`,
        value: data,
        expected: types.join(' | '),
        code: 'TYPE_MISMATCH',
      };
    }

    return null;
  }

  /**
   * Validate object
   */
  private validateObject(
    data: Record<string, any>,
    schema: any,
    path: string,
    options: Required<ValidationOptions>
  ): { errors: ValidationError[]; warnings: ValidationWarning[]; data: any } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validatedData = { ...data };

    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          errors.push({
            path: path ? `${path}.${requiredProp}` : requiredProp,
            message: `Required property '${requiredProp}' is missing`,
            expected: 'required property',
            code: 'REQUIRED_PROPERTY',
          });
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in data) {
          const propPath = path ? `${path}.${propName}` : propName;
          const propResult = this.validateAgainstSchema(
            data[propName],
            propSchema,
            propPath,
            options
          );
          errors.push(...propResult.errors);
          warnings.push(...propResult.warnings);
          validatedData[propName] = propResult.data;
        }
      }
    }

    // Check additional properties
    if (schema.additionalProperties === false && !options.allowAdditionalProperties) {
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      for (const propName of Object.keys(data)) {
        if (!allowedProps.has(propName)) {
          if (options.strict) {
            errors.push({
              path: path ? `${path}.${propName}` : propName,
              message: `Additional property '${propName}' is not allowed`,
              value: data[propName],
              code: 'ADDITIONAL_PROPERTY',
            });
          } else {
            warnings.push({
              path: path ? `${path}.${propName}` : propName,
              message: `Additional property '${propName}' found`,
              value: data[propName],
              suggestion: 'Consider removing or adding to schema',
            });
          }
        }
      }
    }

    return { errors, warnings, data: validatedData };
  }

  /**
   * Validate array
   */
  private validateArray(
    data: any[],
    schema: any,
    path: string,
    options: Required<ValidationOptions>
  ): { errors: ValidationError[]; warnings: ValidationWarning[]; data: any[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validatedData = [...data];

    // Length validation
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({
        path,
        message: `Array must have at least ${schema.minItems} items`,
        value: data.length,
        expected: `>= ${schema.minItems}`,
        code: 'MIN_ITEMS',
      });
    }

    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({
        path,
        message: `Array must have at most ${schema.maxItems} items`,
        value: data.length,
        expected: `<= ${schema.maxItems}`,
        code: 'MAX_ITEMS',
      });
    }

    // Unique items validation
    if (schema.uniqueItems) {
      const seen = new Set();
      for (let i = 0; i < data.length; i++) {
        const item = JSON.stringify(data[i]);
        if (seen.has(item)) {
          errors.push({
            path: `${path}[${i}]`,
            message: 'Array items must be unique',
            value: data[i],
            code: 'UNIQUE_ITEMS',
          });
        }
        seen.add(item);
      }
    }

    // Items validation
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemPath = `${path}[${i}]`;
        const itemResult = this.validateAgainstSchema(
          data[i],
          schema.items,
          itemPath,
          options
        );
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
        validatedData[i] = itemResult.data;
      }
    }

    return { errors, warnings, data: validatedData };
  }

  /**
   * Validate string
   */
  private validateString(data: string, schema: any, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({
        path,
        message: `String must be at least ${schema.minLength} characters long`,
        value: data.length,
        expected: `>= ${schema.minLength}`,
        code: 'MIN_LENGTH',
      });
    }

    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({
        path,
        message: `String must be at most ${schema.maxLength} characters long`,
        value: data.length,
        expected: `<= ${schema.maxLength}`,
        code: 'MAX_LENGTH',
      });
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push({
        path,
        message: `String does not match required pattern`,
        value: data,
        expected: schema.pattern,
        code: 'PATTERN_MISMATCH',
      });
    }

    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value: data,
        expected: schema.enum.join(' | '),
        code: 'ENUM_MISMATCH',
      });
    }

    return errors;
  }

  /**
   * Validate number
   */
  private validateNumber(data: number, schema: any, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        path,
        message: `Number must be at least ${schema.minimum}`,
        value: data,
        expected: `>= ${schema.minimum}`,
        code: 'MINIMUM',
      });
    }

    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        path,
        message: `Number must be at most ${schema.maximum}`,
        value: data,
        expected: `<= ${schema.maximum}`,
        code: 'MAXIMUM',
      });
    }

    if (schema.type === 'integer' && !Number.isInteger(data)) {
      errors.push({
        path,
        message: `Value must be an integer`,
        value: data,
        expected: 'integer',
        code: 'INTEGER_REQUIRED',
      });
    }

    return errors;
  }

  /**
   * Apply default values from schema
   */
  private applyDefaults(data: any, schema: any): any {
    if (!schema || typeof schema !== 'object') return data;

    if (schema.default !== undefined && (data === undefined || data === null)) {
      return schema.default;
    }

    if (schema.type === 'object' && schema.properties && data && typeof data === 'object') {
      const result = { ...data };
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        result[key] = this.applyDefaults(result[key], propSchema);
      }
      return result;
    }

    return data;
  }

  /**
   * Coerce types where possible
   */
  private coerceTypes(data: any, schema: any): any {
    if (!schema || typeof schema !== 'object') return data;

    if (schema.type === 'object' && schema.properties && data && typeof data === 'object') {
      const result = { ...data };
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in result) {
          result[key] = this.coerceTypes(result[key], propSchema);
        }
      }
      return result;
    }

    if (!schema.type) return data;

    // String to number coercion
    if ((schema.type === 'number' || schema.type === 'integer') && typeof data === 'string' && !isNaN(Number(data))) {
      return Number(data);
    }

    // String to boolean coercion
    if (schema.type === 'boolean' && typeof data === 'string') {
      if (data.toLowerCase() === 'true') return true;
      if (data.toLowerCase() === 'false') return false;
    }

    // Number to string coercion
    if (schema.type === 'string' && typeof data === 'number') {
      return String(data);
    }

    return data;
  }

  /**
   * Remove additional properties not defined in schema
   */
  private removeAdditionalProperties(data: any, schema: any): any {
    if (schema.type !== 'object' || !schema.properties || !data || typeof data !== 'object') {
      return data;
    }

    const result = {};
    const allowedProps = Object.keys(schema.properties);
    
    for (const prop of allowedProps) {
      if (prop in data) {
        result[prop] = data[prop];
      }
    }

    return result;
  }

  /**
   * Perform strict validation checks
   */
  private performStrictValidation(data: any, schema: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Add custom strict validation rules here
    // For example, checking for deprecated properties, security concerns, etc.

    return errors;
  }
}