import type { PropertyMapping, ConditionalMapping } from '../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../types/component-mapping.types';

/**
 * Condition evaluation result
 */
export interface ConditionResult {
  matched: boolean;
  value?: any;
  reason?: string;
}

/**
 * Conditional mapping evaluation result
 */
export interface ConditionalMappingResult {
  applied: boolean;
  originalMapping: PropertyMapping;
  effectiveMapping: PropertyMapping;
  matchedConditions: ConditionalMapping[];
  evaluationTrace: ConditionEvaluation[];
}

/**
 * Detailed condition evaluation for debugging
 */
export interface ConditionEvaluation {
  condition: ConditionalMapping['condition'];
  result: ConditionResult;
  context: {
    componentName: string;
    availableProps: string[];
    evaluatedProp?: string;
    evaluatedValue?: any;
  };
}

/**
 * Condition operators supported by the mapper
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  MATCHES_REGEX = 'matchesRegex',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  IN_ARRAY = 'inArray',
  NOT_IN_ARRAY = 'notInArray',
  HAS_TYPE = 'hasType',
}

/**
 * Configuration for conditional mapping
 */
export interface ConditionalMapperConfig {
  enableTracing?: boolean;
  enableCaching?: boolean;
  strictMode?: boolean; // Throw errors on invalid conditions
  maxConditionDepth?: number;
  customOperators?: Map<string, ConditionEvaluator>;
}

/**
 * Custom condition evaluator function
 */
export type ConditionEvaluator = (
  propValue: any,
  conditionValue: any,
  context: ComponentMappingContext
) => ConditionResult;

/**
 * Conditional property mapper for handling complex mapping scenarios
 */
export class ConditionalPropMapper {
  private config: Required<ConditionalMapperConfig>;
  private evaluationCache: Map<string, ConditionResult> = new Map();
  private customOperators: Map<string, ConditionEvaluator> = new Map();

  constructor(config: ConditionalMapperConfig = {}) {
    this.config = {
      enableTracing: false,
      enableCaching: true,
      strictMode: false,
      maxConditionDepth: 10,
      customOperators: new Map(),
      ...config,
    };

    // Register custom operators if provided
    if (config.customOperators) {
      for (const [name, evaluator] of config.customOperators) {
        this.customOperators.set(name, evaluator);
      }
    }
  }

  /**
   * Apply conditional mapping to a property mapping
   */
  applyConditionalMapping(
    mapping: PropertyMapping,
    context: ComponentMappingContext
  ): ConditionalMappingResult {
    const result: ConditionalMappingResult = {
      applied: false,
      originalMapping: mapping,
      effectiveMapping: { ...mapping },
      matchedConditions: [],
      evaluationTrace: [],
    };

    // If no conditional mappings, return original
    if (!mapping.conditional || mapping.conditional.length === 0) {
      return result;
    }

    // Evaluate each conditional mapping
    for (const conditionalMapping of mapping.conditional) {
      const evaluation = this.evaluateCondition(
        conditionalMapping.condition,
        context
      );

      if (this.config.enableTracing) {
        result.evaluationTrace.push({
          condition: conditionalMapping.condition,
          result: evaluation,
          context: {
            componentName: context.componentName,
            availableProps: Object.keys(context.props),
            evaluatedProp: conditionalMapping.condition.prop,
            evaluatedValue: context.props[conditionalMapping.condition.prop],
          },
        });
      }

      if (evaluation.matched) {
        result.applied = true;
        result.matchedConditions.push(conditionalMapping);

        // Apply the conditional overrides
        result.effectiveMapping = this.applyConditionalOverrides(
          result.effectiveMapping,
          conditionalMapping
        );
      }
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(
    condition: ConditionalMapping['condition'],
    context: ComponentMappingContext
  ): ConditionResult {
    // Check cache first
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(condition, context);
      const cached = this.evaluationCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const propValue = context.props[condition.prop];
    const conditionValue = condition.value;
    const operator = condition.operator;

    let result: ConditionResult;

    try {
      // Check for custom operators first
      if (this.customOperators.has(operator)) {
        const customEvaluator = this.customOperators.get(operator)!;
        result = customEvaluator(propValue, conditionValue, context);
      } else {
        // Use built-in operators
        result = this.evaluateBuiltInCondition(propValue, conditionValue, operator);
      }
    } catch (error) {
      if (this.config.strictMode) {
        throw new Error(
          `Condition evaluation failed for ${condition.prop} ${condition.operator} ${condition.value}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      result = {
        matched: false,
        reason: `Evaluation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Cache the result
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(condition, context);
      this.evaluationCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Evaluate built-in condition operators
   */
  private evaluateBuiltInCondition(
    propValue: any,
    conditionValue: any,
    operator: string
  ): ConditionResult {
    switch (operator) {
      case ConditionOperator.EQUALS:
        return {
          matched: propValue === conditionValue,
          value: propValue,
          reason: `${this.formatValue(propValue)} ${propValue === conditionValue ? '===' : '!=='} ${this.formatValue(conditionValue)}`,
        };

      case ConditionOperator.NOT_EQUALS:
        return {
          matched: propValue !== conditionValue,
          value: propValue,
          reason: `${this.formatValue(propValue)} ${propValue !== conditionValue ? '!==' : '==='} ${this.formatValue(conditionValue)}`,
        };

      case ConditionOperator.CONTAINS:
        const contains = String(propValue).includes(String(conditionValue));
        return {
          matched: contains,
          value: propValue,
          reason: `"${propValue}" ${contains ? 'contains' : 'does not contain'} "${conditionValue}"`,
        };

      case ConditionOperator.NOT_CONTAINS:
        const notContains = !String(propValue).includes(String(conditionValue));
        return {
          matched: notContains,
          value: propValue,
          reason: `"${propValue}" ${notContains ? 'does not contain' : 'contains'} "${conditionValue}"`,
        };

      case ConditionOperator.EXISTS:
        return {
          matched: propValue !== undefined,
          value: propValue,
          reason: `Property ${propValue !== undefined ? 'exists' : 'does not exist'}`,
        };

      case ConditionOperator.NOT_EXISTS:
        return {
          matched: propValue === undefined,
          value: propValue,
          reason: `Property ${propValue === undefined ? 'does not exist' : 'exists'}`,
        };

      case ConditionOperator.STARTS_WITH:
        const startsWith = String(propValue).startsWith(String(conditionValue));
        return {
          matched: startsWith,
          value: propValue,
          reason: `"${propValue}" ${startsWith ? 'starts with' : 'does not start with'} "${conditionValue}"`,
        };

      case ConditionOperator.ENDS_WITH:
        const endsWith = String(propValue).endsWith(String(conditionValue));
        return {
          matched: endsWith,
          value: propValue,
          reason: `"${propValue}" ${endsWith ? 'ends with' : 'does not end with'} "${conditionValue}"`,
        };

      case ConditionOperator.MATCHES_REGEX:
        const regex = new RegExp(String(conditionValue));
        const matches = regex.test(String(propValue));
        return {
          matched: matches,
          value: propValue,
          reason: `"${propValue}" ${matches ? 'matches' : 'does not match'} pattern /${conditionValue}/`,
        };

      case ConditionOperator.GREATER_THAN:
        const gt = Number(propValue) > Number(conditionValue);
        return {
          matched: gt,
          value: propValue,
          reason: `${propValue} ${gt ? '>' : '<='} ${conditionValue}`,
        };

      case ConditionOperator.LESS_THAN:
        const lt = Number(propValue) < Number(conditionValue);
        return {
          matched: lt,
          value: propValue,
          reason: `${propValue} ${lt ? '<' : '>='} ${conditionValue}`,
        };

      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        const gte = Number(propValue) >= Number(conditionValue);
        return {
          matched: gte,
          value: propValue,
          reason: `${propValue} ${gte ? '>=' : '<'} ${conditionValue}`,
        };

      case ConditionOperator.LESS_THAN_OR_EQUAL:
        const lte = Number(propValue) <= Number(conditionValue);
        return {
          matched: lte,
          value: propValue,
          reason: `${propValue} ${lte ? '<=' : '>'} ${conditionValue}`,
        };

      case ConditionOperator.IN_ARRAY:
        const inArray = Array.isArray(conditionValue) && conditionValue.includes(propValue);
        return {
          matched: inArray,
          value: propValue,
          reason: `${propValue} ${inArray ? 'is in' : 'is not in'} [${conditionValue}]`,
        };

      case ConditionOperator.NOT_IN_ARRAY:
        const notInArray = Array.isArray(conditionValue) && !conditionValue.includes(propValue);
        return {
          matched: notInArray,
          value: propValue,
          reason: `${propValue} ${notInArray ? 'is not in' : 'is in'} [${conditionValue}]`,
        };

      case ConditionOperator.HAS_TYPE:
        const hasType = typeof propValue === conditionValue;
        return {
          matched: hasType,
          value: propValue,
          reason: `typeof ${propValue} ${hasType ? '===' : '!=='} "${conditionValue}"`,
        };

      default:
        throw new Error(`Unknown condition operator: ${operator}`);
    }
  }

  /**
   * Apply conditional overrides to a property mapping
   */
  private applyConditionalOverrides(
    mapping: PropertyMapping,
    conditionalMapping: ConditionalMapping
  ): PropertyMapping {
    const overrides: Partial<PropertyMapping> = {};

    // Apply target override
    if (conditionalMapping.target) {
      overrides.target = conditionalMapping.target;
    }

    // Apply value transformation override
    if (conditionalMapping.valueTransformation) {
      overrides.valueTransformation = conditionalMapping.valueTransformation;
    }

    // Apply other conditional overrides
    if (conditionalMapping.required !== undefined) {
      overrides.required = conditionalMapping.required;
    }

    if (conditionalMapping.omit !== undefined) {
      overrides.omit = conditionalMapping.omit;
    }

    return { ...mapping, ...overrides };
  }

  /**
   * Generate cache key for condition evaluation
   */
  private generateCacheKey(
    condition: ConditionalMapping['condition'],
    context: ComponentMappingContext
  ): string {
    const propValue = context.props[condition.prop];
    return `${condition.prop}:${condition.operator}:${condition.value}:${JSON.stringify(propValue)}`;
  }

  /**
   * Register a custom condition operator
   */
  registerCustomOperator(name: string, evaluator: ConditionEvaluator): void {
    this.customOperators.set(name, evaluator);
  }

  /**
   * Remove a custom condition operator
   */
  unregisterCustomOperator(name: string): boolean {
    return this.customOperators.delete(name);
  }

  /**
   * Get list of available operators
   */
  getAvailableOperators(): string[] {
    const builtInOperators = Object.values(ConditionOperator);
    const customOperators = Array.from(this.customOperators.keys());
    return [...builtInOperators, ...customOperators];
  }

  /**
   * Check if an operator is supported
   */
  supportsOperator(operator: string): boolean {
    return Object.values(ConditionOperator).includes(operator as ConditionOperator) ||
           this.customOperators.has(operator);
  }

  /**
   * Format value for display in reason strings
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.evaluationCache.size,
      keys: Array.from(this.evaluationCache.keys()),
    };
  }

  /**
   * Evaluate multiple conditions with logical operators (AND/OR)
   */
  evaluateCompoundCondition(
    conditions: ConditionalMapping['condition'][],
    logicalOperator: 'AND' | 'OR',
    context: ComponentMappingContext
  ): ConditionResult {
    if (conditions.length === 0) {
      return { matched: false, reason: 'No conditions provided' };
    }

    const results = conditions.map(condition => this.evaluateCondition(condition, context));

    let matched: boolean;
    let reason: string;

    if (logicalOperator === 'AND') {
      matched = results.every(result => result.matched);
      const failedConditions = results.filter(result => !result.matched);
      reason = matched 
        ? 'All conditions matched'
        : `Failed conditions: ${failedConditions.map(r => r.reason).join(', ')}`;
    } else { // OR
      matched = results.some(result => result.matched);
      const successfulConditions = results.filter(result => result.matched);
      reason = matched
        ? `Matched conditions: ${successfulConditions.map(r => r.reason).join(', ')}`
        : 'No conditions matched';
    }

    return {
      matched,
      reason,
      value: matched ? results.find(r => r.matched)?.value : undefined,
    };
  }

  /**
   * Create a condition for testing purposes
   */
  static createCondition(
    prop: string,
    operator: string,
    value: any
  ): ConditionalMapping['condition'] {
    return { prop, operator, value };
  }

  /**
   * Create a conditional mapping for testing purposes
   */
  static createConditionalMapping(
    condition: ConditionalMapping['condition'],
    target: string,
    overrides: Partial<ConditionalMapping> = {}
  ): ConditionalMapping {
    return {
      condition,
      target,
      ...overrides,
    };
  }
}