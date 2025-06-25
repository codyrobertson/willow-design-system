import * as ts from 'typescript';
import type { PropertyMapping, ValueTransformation } from '../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../types/component-mapping.types';

/**
 * Validation rule for a prop
 */
export interface PropValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'any';
  required?: boolean;
  enum?: any[];
  pattern?: string | RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: any, context: ComponentMappingContext) => ValidationResult;
  message?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Prop validation configuration
 */
export interface PropValidationConfig {
  rules: Record<string, PropValidationRule>;
  strictMode?: boolean;
  allowExtraProps?: boolean;
  validateTypes?: boolean;
  customValidators?: Record<string, (value: any, rule: PropValidationRule) => ValidationResult>;
}

/**
 * Validation error detail
 */
export interface ValidationError {
  prop: string;
  value: any;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Handles prop validation for component transformations
 */
export class PropValidator {
  private validationRules = new Map<string, Map<string, PropValidationRule>>();
  private globalRules = new Map<string, PropValidationRule>();
  private customValidators = new Map<string, (value: any, rule: PropValidationRule) => ValidationResult>();

  constructor() {
    this.registerBuiltInValidators();
  }

  /**
   * Register built-in validators
   */
  private registerBuiltInValidators(): void {
    // Email validator
    this.registerCustomValidator('email', (value, rule) => {
      const result: ValidationResult = { valid: true, errors: [], warnings: [] };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (typeof value !== 'string' || !emailRegex.test(value)) {
        result.valid = false;
        result.errors.push(rule.message || 'Invalid email format');
      }
      
      return result;
    });

    // URL validator
    this.registerCustomValidator('url', (value, rule) => {
      const result: ValidationResult = { valid: true, errors: [], warnings: [] };
      
      try {
        new URL(value);
      } catch {
        result.valid = false;
        result.errors.push(rule.message || 'Invalid URL format');
      }
      
      return result;
    });

    // Color validator
    this.registerCustomValidator('color', (value, rule) => {
      const result: ValidationResult = { valid: true, errors: [], warnings: [] };
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^(rgb|hsl)a?\([^)]+\)$/;
      
      if (typeof value !== 'string' || !colorRegex.test(value)) {
        result.valid = false;
        result.errors.push(rule.message || 'Invalid color format');
      }
      
      return result;
    });

    // Date validator
    this.registerCustomValidator('date', (value, rule) => {
      const result: ValidationResult = { valid: true, errors: [], warnings: [] };
      
      if (!(value instanceof Date) && isNaN(Date.parse(value))) {
        result.valid = false;
        result.errors.push(rule.message || 'Invalid date format');
      }
      
      return result;
    });
  }

  /**
   * Register validation rules for a component
   */
  registerComponentRules(componentName: string, rules: Record<string, PropValidationRule>): void {
    const componentRules = new Map<string, PropValidationRule>();
    
    for (const [prop, rule] of Object.entries(rules)) {
      componentRules.set(prop, rule);
    }
    
    this.validationRules.set(componentName, componentRules);
  }

  /**
   * Register global validation rules
   */
  registerGlobalRules(rules: Record<string, PropValidationRule>): void {
    for (const [prop, rule] of Object.entries(rules)) {
      this.globalRules.set(prop, rule);
    }
  }

  /**
   * Register a custom validator
   */
  registerCustomValidator(
    name: string,
    validator: (value: any, rule: PropValidationRule) => ValidationResult
  ): void {
    this.customValidators.set(name, validator);
  }

  /**
   * Validate props for a component
   */
  validateProps(
    props: Record<string, any>,
    componentName: string,
    context: ComponentMappingContext,
    config: PropValidationConfig = {}
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const componentRules = this.validationRules.get(componentName) || new Map();
    const allRules = new Map([...this.globalRules, ...componentRules]);

    // Override with config rules if provided
    if (config.rules) {
      for (const [prop, rule] of Object.entries(config.rules)) {
        allRules.set(prop, rule);
      }
    }

    // Validate each prop
    for (const [propName, propValue] of Object.entries(props)) {
      const rule = allRules.get(propName);
      
      if (rule) {
        const propResult = this.validateProp(propName, propValue, rule, context, config);
        result.errors.push(...propResult.errors);
        result.warnings.push(...propResult.warnings);
        if (propResult.suggestions) {
          result.suggestions?.push(...propResult.suggestions);
        }
        if (!propResult.valid) {
          result.valid = false;
        }
      } else if (config.strictMode && !config.allowExtraProps) {
        result.warnings.push(`Unknown prop '${propName}' for component ${componentName}`);
      }
    }

    // Check required props
    for (const [propName, rule] of allRules) {
      if (rule.required && !(propName in props)) {
        result.valid = false;
        result.errors.push(`Required prop '${propName}' is missing`);
      }
    }

    return result;
  }

  /**
   * Validate a single prop
   */
  validateProp(
    propName: string,
    value: any,
    rule: PropValidationRule,
    context: ComponentMappingContext,
    config: PropValidationConfig = {}
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Type validation
    if (rule.type && config.validateTypes !== false) {
      const typeResult = this.validateType(value, rule.type);
      if (!typeResult.valid) {
        result.valid = false;
        result.errors.push(
          rule.message || `Prop '${propName}' must be of type ${rule.type}, got ${typeof value}`
        );
      }
    }

    // Enum validation
    if (rule.enum && rule.enum.length > 0) {
      if (!rule.enum.includes(value)) {
        result.valid = false;
        result.errors.push(
          rule.message || `Prop '${propName}' must be one of: ${rule.enum.join(', ')}`
        );
        result.suggestions = [`Valid values: ${rule.enum.join(', ')}`];
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      const regex = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
      if (!regex.test(value)) {
        result.valid = false;
        result.errors.push(
          rule.message || `Prop '${propName}' does not match pattern ${regex}`
        );
      }
    }

    // Numeric range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        result.valid = false;
        result.errors.push(
          rule.message || `Prop '${propName}' must be at least ${rule.min}`
        );
      }
      if (rule.max !== undefined && value > rule.max) {
        result.valid = false;
        result.errors.push(
          rule.message || `Prop '${propName}' must be at most ${rule.max}`
        );
      }
    }

    // String/Array length validation
    if ((typeof value === 'string' || Array.isArray(value)) && value.length !== undefined) {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        result.valid = false;
        result.errors.push(
          rule.message || `Prop '${propName}' must have at least ${rule.minLength} ${Array.isArray(value) ? 'items' : 'characters'}`
        );
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        result.valid = false;
        result.errors.push(
          rule.message || `Prop '${propName}' must have at most ${rule.maxLength} ${Array.isArray(value) ? 'items' : 'characters'}`
        );
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value, context);
      result.valid = result.valid && customResult.valid;
      result.errors.push(...customResult.errors);
      result.warnings.push(...customResult.warnings);
      if (customResult.suggestions) {
        result.suggestions = [...(result.suggestions || []), ...customResult.suggestions];
      }
    }

    // Check custom validators from config
    if (config.customValidators) {
      for (const [validatorName, validator] of Object.entries(config.customValidators)) {
        if ((rule as any)[validatorName]) {
          const validatorResult = validator(value, rule);
          result.valid = result.valid && validatorResult.valid;
          result.errors.push(...validatorResult.errors);
          result.warnings.push(...validatorResult.warnings);
        }
      }
    }

    return result;
  }

  /**
   * Validate type
   */
  private validateType(value: any, expectedType: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    switch (expectedType) {
      case 'string':
        result.valid = typeof value === 'string';
        break;
      case 'number':
        result.valid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        result.valid = typeof value === 'boolean';
        break;
      case 'object':
        result.valid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'array':
        result.valid = Array.isArray(value);
        break;
      case 'function':
        result.valid = typeof value === 'function';
        break;
      case 'any':
        result.valid = true;
        break;
      default:
        result.warnings.push(`Unknown type '${expectedType}'`);
    }

    return result;
  }

  /**
   * Validate props against TypeScript types
   */
  validateWithTypeChecker(
    props: Record<string, any>,
    componentType: ts.Type,
    typeChecker: ts.TypeChecker,
    context: ComponentMappingContext
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Get props type from component type
    const propsSymbol = componentType.getProperty('props');
    if (!propsSymbol) {
      result.warnings.push('Could not find props type for component');
      return result;
    }

    const propsType = typeChecker.getTypeOfSymbolAtLocation(propsSymbol, propsSymbol.valueDeclaration!);
    const propsMembers = propsType.getProperties();

    // Check each prop
    for (const member of propsMembers) {
      const propName = member.getName();
      const propType = typeChecker.getTypeOfSymbolAtLocation(member, member.valueDeclaration!);
      const isOptional = member.flags & ts.SymbolFlags.Optional;

      if (!isOptional && !(propName in props)) {
        result.valid = false;
        result.errors.push(`Required prop '${propName}' is missing`);
      }

      if (propName in props) {
        const value = props[propName];
        const typeString = typeChecker.typeToString(propType);
        
        // Basic type checking (more complex checking would require runtime type info)
        if (!this.isValueCompatibleWithType(value, typeString)) {
          result.warnings.push(
            `Prop '${propName}' may not be compatible with type '${typeString}'`
          );
        }
      }
    }

    // Check for extra props
    for (const propName of Object.keys(props)) {
      if (!propsMembers.some(m => m.getName() === propName)) {
        result.warnings.push(`Unknown prop '${propName}' for component`);
      }
    }

    return result;
  }

  /**
   * Check if a value is compatible with a type string
   */
  private isValueCompatibleWithType(value: any, typeString: string): boolean {
    // Basic checks - would need more sophisticated type checking for complex types
    if (typeString === 'string') return typeof value === 'string';
    if (typeString === 'number') return typeof value === 'number';
    if (typeString === 'boolean') return typeof value === 'boolean';
    if (typeString === 'any') return true;
    if (typeString.includes('|')) return true; // Union types need more complex checking
    if (typeString.includes('[]')) return Array.isArray(value);
    
    return true; // Default to compatible for complex types
  }

  /**
   * Validate transformation result
   */
  validateTransformation(
    sourceProps: Record<string, any>,
    targetProps: Record<string, any>,
    mappings: PropertyMapping[],
    context: ComponentMappingContext
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Check that all required mappings were applied
    for (const mapping of mappings) {
      if (mapping.required && mapping.source in sourceProps) {
        if (!(mapping.target in targetProps) && !mapping.omit) {
          result.valid = false;
          result.errors.push(
            `Required mapping from '${mapping.source}' to '${mapping.target}' was not applied`
          );
        }
      }
    }

    // Validate value transformations
    for (const mapping of mappings) {
      if (mapping.valueTransformation && mapping.source in sourceProps && mapping.target in targetProps) {
        const sourceValue = sourceProps[mapping.source];
        const targetValue = targetProps[mapping.target];
        
        const transformResult = this.validateValueTransformation(
          sourceValue,
          targetValue,
          mapping.valueTransformation,
          context
        );
        
        if (!transformResult.valid) {
          result.valid = false;
          result.errors.push(...transformResult.errors);
        }
        result.warnings.push(...transformResult.warnings);
      }
    }

    return result;
  }

  /**
   * Validate value transformation
   */
  private validateValueTransformation(
    sourceValue: any,
    targetValue: any,
    transformation: ValueTransformation,
    context: ComponentMappingContext
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    switch (transformation.type) {
      case 'direct':
        if (sourceValue !== targetValue) {
          result.warnings.push(
            `Direct transformation expected same value, got source='${sourceValue}' target='${targetValue}'`
          );
        }
        break;
        
      case 'map':
        if (transformation.map && transformation.map[sourceValue] !== targetValue) {
          result.warnings.push(
            `Map transformation expected '${transformation.map[sourceValue]}', got '${targetValue}'`
          );
        }
        break;
        
      case 'function':
        // Can't validate function transformations without executing them
        break;
        
      case 'conditional':
        // Complex validation for conditional transformations
        break;
    }

    return result;
  }

  /**
   * Create validation report
   */
  createValidationReport(
    results: ValidationResult[],
    componentName: string
  ): {
    summary: {
      totalProps: number;
      validProps: number;
      errors: number;
      warnings: number;
    };
    details: ValidationError[];
  } {
    const details: ValidationError[] = [];
    let totalProps = 0;
    let validProps = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of results) {
      totalProps++;
      if (result.valid) {
        validProps++;
      }
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      // Add error details
      for (const error of result.errors) {
        details.push({
          prop: componentName,
          value: null,
          rule: 'validation',
          message: error,
          severity: 'error',
        });
      }

      // Add warning details
      for (const warning of result.warnings) {
        details.push({
          prop: componentName,
          value: null,
          rule: 'validation',
          message: warning,
          severity: 'warning',
        });
      }
    }

    return {
      summary: {
        totalProps,
        validProps,
        errors: totalErrors,
        warnings: totalWarnings,
      },
      details,
    };
  }

  /**
   * Clear all validation rules
   */
  clearRules(): void {
    this.validationRules.clear();
    this.globalRules.clear();
  }

  /**
   * Get validation rules for a component
   */
  getComponentRules(componentName: string): Map<string, PropValidationRule> | undefined {
    return this.validationRules.get(componentName);
  }
}