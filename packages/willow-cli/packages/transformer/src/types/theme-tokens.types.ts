import { StyleTransformationContext } from './style-transformation.types';

/**
 * Theme token system types for design system migrations
 */

/**
 * Token categories based on design token taxonomy
 */
export enum TokenCategory {
  COLOR = 'color',
  SPACING = 'spacing',
  TYPOGRAPHY = 'typography',
  BORDER = 'border',
  SHADOW = 'shadow',
  SIZING = 'sizing',
  TIMING = 'timing',
  OPACITY = 'opacity',
  Z_INDEX = 'z-index',
  BREAKPOINT = 'breakpoint',
  TRANSITION = 'transition',
  ANIMATION = 'animation',
  GRADIENT = 'gradient',
  ASSET = 'asset',
  LAYOUT = 'layout',
  MOTION = 'motion',
  CUSTOM = 'custom',
}

/**
 * Token types based on W3C Design Tokens specification
 */
export enum TokenType {
  // Core types
  DIMENSION = 'dimension',
  COLOR = 'color',
  CUBIC_BEZIER = 'cubicBezier',
  DURATION = 'duration',
  FONT_FAMILY = 'fontFamily',
  FONT_WEIGHT = 'fontWeight',
  STROKE_STYLE = 'strokeStyle',
  BORDER = 'border',
  TRANSITION = 'transition',
  SHADOW = 'shadow',
  GRADIENT = 'gradient',
  TYPOGRAPHY = 'typography',
  
  // Composite types
  COMPOSITE = 'composite',
  
  // Custom types
  REFERENCE = 'reference',
  ALIAS = 'alias',
  RAW = 'raw',
}

/**
 * Token format types
 */
export enum TokenFormat {
  // CSS formats
  CSS_VARIABLE = 'css-variable',
  CSS_CUSTOM_PROPERTY = 'css-custom-property',
  
  // JavaScript formats
  JS_OBJECT = 'js-object',
  JS_MODULE = 'js-module',
  JSON = 'json',
  
  // Design tool formats
  FIGMA_TOKENS = 'figma-tokens',
  SKETCH_TOKENS = 'sketch-tokens',
  
  // Framework formats
  TAILWIND_CONFIG = 'tailwind-config',
  STYLED_SYSTEM = 'styled-system',
  CHAKRA_THEME = 'chakra-theme',
  MUI_THEME = 'mui-theme',
  ANTD_THEME = 'antd-theme',
  
  // Build tool formats
  STYLE_DICTIONARY = 'style-dictionary',
  DESIGN_TOKENS = 'design-tokens',
  
  // Platform formats
  IOS_COLORS = 'ios-colors',
  ANDROID_COLORS = 'android-colors',
  FLUTTER_THEME = 'flutter-theme',
}

/**
 * Core design token definition
 */
export interface DesignToken {
  /** Unique identifier for the token */
  name: string;
  
  /** Token value (can be primitive or reference) */
  value: TokenValue;
  
  /** Token type for validation and transformation */
  type: TokenType;
  
  /** Token category for organization */
  category: TokenCategory;
  
  /** Human-readable description */
  description?: string;
  
  /** Token metadata */
  metadata?: TokenMetadata;
  
  /** Reference to another token (for aliases) */
  reference?: string;
  
  /** Whether this token is deprecated */
  deprecated?: boolean;
  
  /** Replacement token if deprecated */
  replacement?: string;
  
  /** Platform-specific extensions */
  extensions?: Record<string, any>;
}

/**
 * Token value types
 */
export type TokenValue = 
  | string
  | number
  | boolean
  | TokenCompositeValue
  | TokenReference
  | TokenArray
  | null;

/**
 * Composite token value (e.g., border, shadow, typography)
 */
export interface TokenCompositeValue {
  [key: string]: TokenValue;
}

/**
 * Token reference for aliases
 */
export interface TokenReference {
  /** Reference path using dot notation */
  $ref: string;
  
  /** Optional transformation to apply to referenced value */
  $transform?: TokenTransform;
}

/**
 * Token array for multi-value tokens
 */
export interface TokenArray {
  $array: TokenValue[];
}

/**
 * Token transformation operations
 */
export interface TokenTransform {
  /** Transformation type */
  type: 'multiply' | 'divide' | 'add' | 'subtract' | 'lighten' | 'darken' | 'saturate' | 'desaturate' | 'custom';
  
  /** Transformation amount/factor */
  amount?: number;
  
  /** Custom transformation function */
  transform?: (value: TokenValue) => TokenValue;
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  /** Source file or system */
  source?: string;
  
  /** Creation/modification timestamps */
  created?: string;
  modified?: string;
  
  /** Author information */
  author?: string;
  
  /** Version information */
  version?: string;
  
  /** Usage examples */
  examples?: string[];
  
  /** Related tokens */
  related?: string[];
  
  /** Custom properties */
  [key: string]: any;
}

/**
 * Token collection/theme
 */
export interface TokenCollection {
  /** Collection name */
  name: string;
  
  /** Collection description */
  description?: string;
  
  /** Collection version */
  version?: string;
  
  /** All tokens in the collection */
  tokens: Map<string, DesignToken>;
  
  /** Token groups/sets */
  groups?: Map<string, TokenGroup>;
  
  /** Collection metadata */
  metadata?: TokenMetadata;
}

/**
 * Token group for organization
 */
export interface TokenGroup {
  /** Group name */
  name: string;
  
  /** Group description */
  description?: string;
  
  /** Tokens in this group */
  tokens: string[];
  
  /** Nested groups */
  groups?: Map<string, TokenGroup>;
  
  /** Group type */
  type?: TokenCategory;
}

/**
 * Token migration mapping
 */
export interface TokenMigrationMapping {
  /** Source token pattern */
  source: string | RegExp;
  
  /** Target token name/pattern */
  target: string | ((match: string) => string);
  
  /** Mapping priority */
  priority?: number;
  
  /** Value transformation */
  transform?: TokenTransform;
  
  /** Migration notes */
  notes?: string;
  
  /** Deprecation warning */
  deprecated?: boolean;
}

/**
 * Token migration strategy
 */
export interface TokenMigrationStrategy {
  /** Strategy name */
  name: string;
  
  /** Source format */
  sourceFormat: TokenFormat;
  
  /** Target format */
  targetFormat: TokenFormat;
  
  /** Token mappings */
  mappings: TokenMigrationMapping[];
  
  /** Pre-migration transforms */
  preTransforms?: TokenTransform[];
  
  /** Post-migration transforms */
  postTransforms?: TokenTransform[];
  
  /** Validation rules */
  validation?: TokenValidationRule[];
}

/**
 * Token validation rule
 */
export interface TokenValidationRule {
  /** Rule name */
  name: string;
  
  /** Token types this rule applies to */
  types: TokenType[];
  
  /** Validation function */
  validate: (token: DesignToken) => TokenValidationResult;
  
  /** Error severity */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Error/warning message */
  message?: string;
  
  /** Suggested fix */
  suggestion?: string;
  
  /** Validation metadata */
  metadata?: Record<string, any>;
}

/**
 * Token extraction result
 */
export interface TokenExtractionResult {
  /** Extracted tokens */
  tokens: DesignToken[];
  
  /** Extraction warnings */
  warnings: string[];
  
  /** Extraction metadata */
  metadata: {
    /** Source file/format */
    source: string;
    
    /** Extraction timestamp */
    timestamp: string;
    
    /** Number of tokens found */
    tokenCount: number;
    
    /** Token categories found */
    categories: TokenCategory[];
  };
}

/**
 * Token transformation result
 */
export interface TokenTransformationResult {
  /** Success status */
  success: boolean;
  
  /** Transformed tokens */
  tokens: DesignToken[];
  
  /** Output in target format */
  output: string;
  
  /** Transformation warnings */
  warnings: string[];
  
  /** Transformation errors */
  errors: string[];
  
  /** Transformation metadata */
  metadata: {
    /** Number of tokens transformed */
    transformedCount: number;
    
    /** Number of tokens skipped */
    skippedCount: number;
    
    /** Processing time */
    processingTime: number;
    
    /** Applied strategy */
    strategy: string;
    
    /** Semantic relationships discovered */
    semanticRelationships?: any;
    
    /** Conflict resolutions applied */
    conflictResolutions?: any[];
    
    /** Additional metadata */
    [key: string]: any;
  };
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  /** Token name */
  tokenName: string;
  
  /** Usage locations */
  locations: TokenUsageLocation[];
  
  /** Usage count */
  count: number;
  
  /** Last used timestamp */
  lastUsed: string;
  
  /** Usage context */
  context: StyleTransformationContext;
}

/**
 * Token usage location
 */
export interface TokenUsageLocation {
  /** File path */
  filePath: string;
  
  /** Line number */
  line?: number;
  
  /** Column number */
  column?: number;
  
  /** Context (CSS property, component prop, etc.) */
  context: string;
  
  /** Raw value in source */
  rawValue: string;
}

/**
 * Token documentation
 */
export interface TokenDocumentation {
  /** Token being documented */
  token: DesignToken;
  
  /** Generated documentation */
  documentation: string;
  
  /** Code examples */
  examples: TokenExample[];
  
  /** Related tokens */
  related: string[];
  
  /** Migration notes */
  migrationNotes?: string[];
}

/**
 * Token usage example
 */
export interface TokenExample {
  /** Example title */
  title: string;
  
  /** Example description */
  description?: string;
  
  /** Code example */
  code: string;
  
  /** Example language/format */
  language: string;
  
  /** Example category */
  category: 'css' | 'javascript' | 'component' | 'design';
}

/**
 * Token conflict detection
 */
export interface TokenConflict {
  /** Conflict type */
  type: 'name' | 'value' | 'semantic' | 'category';
  
  /** Conflicting tokens */
  tokens: string[];
  
  /** Conflict description */
  description: string;
  
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  
  /** Suggested resolution */
  resolution?: string;
  
  /** Automatic resolution possible */
  autoResolvable: boolean;
}

/**
 * Token migration context
 */
export interface TokenMigrationContext extends StyleTransformationContext {
  /** Source token format */
  sourceTokenFormat?: TokenFormat;
  
  /** Target token format */
  targetTokenFormat?: TokenFormat;
  
  /** Migration strategy */
  strategy?: string;
  
  /** Migration options */
  options?: TokenMigrationOptions;
  
  /** Preserve semantic relationships */
  preserveSemantics?: boolean;
  
  /** Strict validation mode */
  strictValidation?: boolean;
}

/**
 * Token migration options
 */
export interface TokenMigrationOptions {
  /** Preserve deprecated tokens */
  preserveDeprecated?: boolean;
  
  /** Generate documentation */
  generateDocs?: boolean;
  
  /** Validate tokens */
  validate?: boolean;
  
  /** Track usage */
  trackUsage?: boolean;
  
  /** Merge strategies for conflicts */
  conflictResolution?: 'source' | 'target' | 'merge' | 'prompt';
  
  /** Custom token transformers */
  customTransformers?: Map<string, (token: DesignToken) => DesignToken>;
  
  /** Output options */
  output?: {
    /** Include metadata in output */
    includeMetadata?: boolean;
    
    /** Pretty print output */
    prettyPrint?: boolean;
    
    /** Include comments */
    includeComments?: boolean;
  };
}

/**
 * Semantic token context for framework-aware migrations
 */
export interface TokenSemanticContext {
  /** Target framework name */
  framework: string;
  
  /** Framework version */
  version: string;
  
  /** Source framework (if migrating) */
  sourceFramework?: string;
  
  /** Framework-specific configuration */
  config?: Record<string, any>;
  
  /** Semantic rules to apply */
  semanticRules?: string[];
}

/**
 * Semantic mapping between token patterns
 */
export interface TokenSemanticMapping {
  /** Source token pattern */
  sourcePattern: RegExp;
  
  /** Target token pattern */
  targetPattern: RegExp;
  
  /** Mapping confidence score */
  confidence: number;
  
  /** Semantic role */
  semanticRole: string;
  
  /** Transformation function */
  transform?: (name: string, value: TokenValue) => string;
  
  /** Mapping notes */
  notes?: string;
}