import type * as ts from 'typescript';

/**
 * Style transformation types
 */
export enum StyleType {
  CSS_IN_JS = 'css-in-js',
  STYLED_COMPONENTS = 'styled-components',
  EMOTION = 'emotion',
  CSS_MODULES = 'css-modules',
  TAILWIND = 'tailwind',
  INLINE_STYLES = 'inline-styles',
  SASS = 'sass',
  LESS = 'less',
}

/**
 * Style transformation context
 */
export interface StyleTransformationContext {
  styleType: StyleType;
  sourceFramework: string;
  targetFramework: string;
  filePath: string;
  componentName?: string;
  className?: string;
  theme?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Style transformation result
 */
export interface StyleTransformationResult {
  success: boolean;
  transformed: string | ts.Node | Record<string, any>;
  original: string | ts.Node | Record<string, any>;
  warnings: string[];
  errors: string[];
  metadata?: {
    transformationsApplied: number;
    processingTime: number;
    styleType: StyleType;
    [key: string]: any;
  };
}

/**
 * Style property mapping
 */
export interface StylePropertyMapping {
  source: string;
  target: string;
  transform?: (value: any, context: StyleTransformationContext) => any;
  deprecated?: boolean;
  deprecationMessage?: string;
}

/**
 * Theme token mapping
 */
export interface ThemeTokenMapping {
  sourceToken: string;
  targetToken: string;
  category: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'custom';
  transform?: (value: any) => any;
}

/**
 * CSS class mapping
 */
export interface CSSClassMapping {
  sourceClass: string | RegExp;
  targetClass: string | ((match: string) => string);
  priority?: number;
  context?: string[];
}

/**
 * Style transformer configuration
 */
export interface StyleTransformerConfig {
  propertyMappings?: StylePropertyMapping[];
  tokenMappings?: ThemeTokenMapping[];
  classMappings?: CSSClassMapping[];
  preserveUnknownProperties?: boolean;
  warnOnUnmappedProperties?: boolean;
  optimizeOutput?: boolean;
  customTransformers?: StyleTransformer[];
  sourceMap?: boolean;
}

/**
 * Base interface for style transformers
 */
export interface StyleTransformer {
  name: string;
  supports(styleType: StyleType, context: StyleTransformationContext): boolean;
  transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult> | StyleTransformationResult;
  priority?: number;
}

/**
 * Style parser interface
 */
export interface StyleParser<T = any> {
  parse(input: string | ts.Node, context: StyleTransformationContext): T;
  serialize(parsed: T, context: StyleTransformationContext): string;
}

/**
 * Style validator interface
 */
export interface StyleValidator {
  validate(
    styles: any,
    context: StyleTransformationContext
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Style optimizer interface
 */
export interface StyleOptimizer {
  optimize(
    styles: any,
    context: StyleTransformationContext
  ): {
    optimized: any;
    savings: {
      originalSize: number;
      optimizedSize: number;
      percentage: number;
    };
  };
}

/**
 * CSS-in-JS specific types
 */
export interface CSSInJSObject {
  [selector: string]: CSSInJSValue | CSSInJSObject;
}

export type CSSInJSValue = string | number | boolean | null | undefined;

/**
 * Tailwind specific types
 */
export interface TailwindClass {
  utility: string;
  variant?: string[];
  arbitrary?: string;
  important?: boolean;
}

/**
 * Styled components specific types
 */
export interface StyledComponentTemplate {
  strings: string[];
  expressions: any[];
}

/**
 * CSS modules specific types
 */
export interface CSSModuleImport {
  imported: string[];
  local: string[];
  from: string;
}

/**
 * Style transformation pipeline
 */
export interface StyleTransformationPipeline {
  add(transformer: StyleTransformer): void;
  remove(name: string): void;
  transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult>;
}

/**
 * Style transformation registry
 */
export interface StyleTransformerRegistry {
  register(transformer: StyleTransformer): void;
  unregister(name: string): void;
  get(name: string): StyleTransformer | undefined;
  getAll(): StyleTransformer[];
  getForStyleType(styleType: StyleType): StyleTransformer[];
}

/**
 * Styled-components specific types
 */
export interface StyledComponentResult {
  type: 'styled-component';
  element: string;
  isWrapped: boolean;
  styles: {
    static: Record<string, string>;
    dynamic: Array<{
      property: string;
      expression: string;
    }>;
    conditional: Array<{
      condition: string;
      styles: string;
    }>;
    media: Record<string, string>;
    pseudo: Record<string, string>;
    nested: Record<string, string>;
  };
  fullDefinition: string;
  hasTheme: boolean;
  hasProps: boolean;
  propUsages?: string[];
}

export interface StyledComponentAnalysis {
  components: StyledComponentResult[];
  themeUsages: string[];
  propUsages: string[];
  cssBlocks: string[];
  hasGlobalStyles: boolean;
  hasThemeProvider: boolean;
  hasKeyframes: boolean;
  hasJsxPragma?: boolean;
  hasCssImport?: boolean;
}