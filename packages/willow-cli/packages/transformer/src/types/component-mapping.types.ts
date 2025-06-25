import type { ComponentMapping, PropertyMapping, ValueTransformation } from '../schemas/component-mapping.schema';

/**
 * Runtime context for component property mapping
 */
export interface ComponentMappingContext {
  sourceFile: string;
  targetFile: string;
  componentName: string;
  props: Record<string, any>;
  parentContext?: ComponentMappingContext;
}

/**
 * Result of a property mapping operation
 */
export interface PropertyMappingResult {
  success: boolean;
  sourceProp: string;
  targetProp: string;
  value: any;
  transformedValue: any;
  warnings: string[];
  errors: string[];
  deprecated?: {
    message: string;
    alternative?: string;
  };
}

/**
 * Result of a component mapping operation
 */
export interface ComponentMappingResult {
  success: boolean;
  sourceComponent: string;
  targetComponent: string;
  importChange?: {
    from: string;
    to: string;
  };
  propResults: PropertyMappingResult[];
  unmappedProps: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Custom value transformer function type
 */
export type ValueTransformer = (
  value: any,
  context: ComponentMappingContext
) => any | Promise<any>;

/**
 * Registry for custom value transformers
 */
export interface ValueTransformerRegistry {
  register(name: string, transformer: ValueTransformer): void;
  get(name: string): ValueTransformer | undefined;
  has(name: string): boolean;
  list(): string[];
}

/**
 * Component mapping engine configuration
 */
export interface ComponentMappingEngineConfig {
  mappingConfig: ComponentMapping[];
  globalPropMappings?: PropertyMapping[];
  transformerRegistry?: ValueTransformerRegistry;
  options?: {
    preserveUnmappedProps?: boolean;
    warnOnUnmappedProps?: boolean;
    strictMode?: boolean;
    generateComments?: boolean;
  };
}

/**
 * Conditional mapping evaluation context
 */
export interface ConditionalContext {
  props: Record<string, any>;
  component: string;
  evaluate(condition: ConditionalExpression): boolean;
}

/**
 * Conditional expression for prop mapping
 */
export interface ConditionalExpression {
  prop: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists';
  value?: any;
}

/**
 * Prop deprecation information
 */
export interface PropDeprecation {
  prop: string;
  message: string;
  alternative?: string;
  version?: string;
  removeInVersion?: string;
}

/**
 * Mapping validation result
 */
export interface MappingValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  suggestions: Array<{
    component: string;
    prop: string;
    suggestion: string;
  }>;
}

/**
 * Component mapping statistics
 */
export interface MappingStatistics {
  totalComponents: number;
  mappedComponents: number;
  unmappedComponents: string[];
  totalProps: number;
  mappedProps: number;
  unmappedProps: Array<{
    component: string;
    props: string[];
  }>;
  deprecatedProps: PropDeprecation[];
  transformationCount: number;
}

/**
 * Mapping suggestion from analyzer
 */
export interface MappingSuggestion {
  confidence: number; // 0-1
  sourceComponent: string;
  targetComponent: string;
  reason: string;
  propSuggestions: Array<{
    sourceProp: string;
    targetProp: string;
    confidence: number;
    reason: string;
  }>;
}