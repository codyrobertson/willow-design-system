import type { SourceFile, Node, TransformationContext } from 'typescript';
import type { 
  ParseResult, 
  ImportInfo, 
  ComponentInfo, 
  ExportInfo,
  SourceLocation,
  ParseError 
} from '@willow-cli/types';

/**
 * Core transformer configuration
 */
export interface TransformerConfig {
  /**
   * Target UI kit for transformation
   */
  targetUIKit: string;
  
  /**
   * Source UI kit (defaults to 'willow')
   */
  sourceUIKit?: string;
  
  /**
   * Component mapping configuration
   */
  componentMappings?: ComponentMappingConfig;
  
  /**
   * Style transformation configuration
   */
  styleMappings?: StyleMappingConfig;
  
  /**
   * Import path mappings
   */
  importMappings?: ImportMappingConfig;
  
  /**
   * Enable dry run mode (no file writes)
   */
  dryRun?: boolean;
  
  /**
   * Enable detailed logging
   */
  verbose?: boolean;
  
  /**
   * Custom plugins
   */
  plugins?: TransformerPlugin[];
  
  /**
   * Error handling strategy
   */
  errorStrategy?: 'throw' | 'continue' | 'rollback';
  
  /**
   * Progress reporter
   */
  progressReporter?: ProgressReporter;
}

/**
 * Transformation options for a single operation
 */
export interface TransformOptions {
  /**
   * Source file path
   */
  filename: string;
  
  /**
   * Source code content
   */
  content?: string;
  
  /**
   * Parse result from parser module
   */
  parseResult?: ParseResult;
  
  /**
   * Specific transformations to apply
   */
  transformations?: TransformationType[];
  
  /**
   * Skip specific transformations
   */
  skipTransformations?: TransformationType[];
  
  /**
   * Preserve formatting
   */
  preserveFormatting?: boolean;
  
  /**
   * Generate source maps
   */
  sourceMap?: boolean;
  
  /**
   * Context data for transformers
   */
  context?: Record<string, any>;
}

/**
 * Transformation result
 */
export interface TransformResult {
  /**
   * Original file path
   */
  filename: string;
  
  /**
   * Transformed code
   */
  code: string;
  
  /**
   * Source map if requested
   */
  sourceMap?: string;
  
  /**
   * Applied transformations
   */
  appliedTransformations: AppliedTransformation[];
  
  /**
   * Skipped transformations
   */
  skippedTransformations: SkippedTransformation[];
  
  /**
   * Errors encountered
   */
  errors: TransformError[];
  
  /**
   * Warnings
   */
  warnings: TransformWarning[];
  
  /**
   * Transformation metadata
   */
  metadata: TransformMetadata;
}

/**
 * Types of transformations
 */
export type TransformationType = 
  | 'imports'
  | 'components'
  | 'props'
  | 'styles'
  | 'exports'
  | 'types'
  | 'custom';

/**
 * Applied transformation record
 */
export interface AppliedTransformation {
  type: TransformationType;
  description: string;
  location: SourceLocation;
  before: string;
  after: string;
  duration: number;
}

/**
 * Skipped transformation record
 */
export interface SkippedTransformation {
  type: TransformationType;
  reason: string;
  location?: SourceLocation;
}

/**
 * Transformation error
 */
export interface TransformError {
  type: TransformationType;
  message: string;
  location?: SourceLocation;
  stack?: string;
  recoverable: boolean;
}

/**
 * Transformation warning
 */
export interface TransformWarning {
  type: TransformationType;
  message: string;
  location?: SourceLocation;
  suggestion?: string;
}

/**
 * Transformation metadata
 */
export interface TransformMetadata {
  startTime: number;
  endTime: number;
  duration: number;
  transformationCount: number;
  errorCount: number;
  warningCount: number;
  fileSize: {
    before: number;
    after: number;
  };
}

/**
 * Component mapping configuration
 */
export interface ComponentMappingConfig {
  /**
   * Direct component name mappings
   */
  mappings: Record<string, ComponentMapping>;
  
  /**
   * Default mapping for unmapped components
   */
  defaultMapping?: ComponentMapping;
  
  /**
   * Component detection patterns
   */
  patterns?: ComponentPattern[];
}

/**
 * Single component mapping
 */
export interface ComponentMapping {
  /**
   * Target component name
   */
  target: string;
  
  /**
   * Prop mappings
   */
  props?: Record<string, PropMapping>;
  
  /**
   * Import source override
   */
  importSource?: string;
  
  /**
   * Transform function for complex cases
   */
  transform?: ComponentTransformFunction;
  
  /**
   * Deprecated component handling
   */
  deprecated?: {
    message: string;
    alternative?: string;
  };
}

/**
 * Prop mapping configuration
 */
export interface PropMapping {
  /**
   * Target prop name
   */
  target?: string;
  
  /**
   * Value transformer
   */
  transform?: PropTransformFunction;
  
  /**
   * Remove this prop
   */
  remove?: boolean;
  
  /**
   * Deprecated prop handling
   */
  deprecated?: {
    message: string;
    alternative?: string;
  };
}

/**
 * Style mapping configuration
 */
export interface StyleMappingConfig {
  /**
   * CSS class mappings
   */
  classMappings?: Record<string, string | string[]>;
  
  /**
   * Style prop mappings
   */
  stylePropMappings?: Record<string, StylePropMapping>;
  
  /**
   * Token mappings
   */
  tokenMappings?: Record<string, string>;
  
  /**
   * Custom style transformers
   */
  transformers?: StyleTransformer[];
}

/**
 * Style prop mapping
 */
export interface StylePropMapping {
  target?: string;
  transform?: (value: any) => any;
  remove?: boolean;
}

/**
 * Import mapping configuration
 */
export interface ImportMappingConfig {
  /**
   * Package name mappings
   */
  packageMappings: Record<string, string>;
  
  /**
   * Path mappings within packages
   */
  pathMappings?: Record<string, PathMapping>;
  
  /**
   * Import specifier mappings
   */
  specifierMappings?: Record<string, SpecifierMapping>;
}

/**
 * Path mapping configuration
 */
export interface PathMapping {
  target: string;
  transform?: (path: string) => string;
}

/**
 * Import specifier mapping
 */
export interface SpecifierMapping {
  target?: string;
  source?: string;
  remove?: boolean;
}

/**
 * Component detection pattern
 */
export interface ComponentPattern {
  name: string;
  test: (component: ComponentInfo) => boolean;
  mapping: ComponentMapping;
}

/**
 * Transformer plugin interface
 */
export interface TransformerPlugin {
  /**
   * Plugin name
   */
  name: string;
  
  /**
   * Plugin version
   */
  version: string;
  
  /**
   * Transformation hooks
   */
  hooks?: TransformerHooks;
  
  /**
   * Custom transformers
   */
  transformers?: CustomTransformer[];
}

/**
 * Transformer lifecycle hooks
 */
export interface TransformerHooks {
  /**
   * Called before any transformation
   */
  beforeTransform?: (options: TransformOptions) => void | Promise<void>;
  
  /**
   * Called after parsing, before transformation
   */
  afterParse?: (parseResult: ParseResult, options: TransformOptions) => void | Promise<void>;
  
  /**
   * Called before each transformation type
   */
  beforeTransformType?: (type: TransformationType, context: TransformContext) => boolean | Promise<boolean>;
  
  /**
   * Called after each transformation type
   */
  afterTransformType?: (type: TransformationType, context: TransformContext) => void | Promise<void>;
  
  /**
   * Called after all transformations
   */
  afterTransform?: (result: TransformResult) => void | Promise<void>;
  
  /**
   * Called on error
   */
  onError?: (error: TransformError, context: TransformContext) => void | Promise<void>;
}

/**
 * Custom transformer
 */
export interface CustomTransformer {
  /**
   * Transformer name
   */
  name: string;
  
  /**
   * Transformation type
   */
  type: TransformationType;
  
  /**
   * Order priority (lower = earlier)
   */
  priority?: number;
  
  /**
   * Transform function
   */
  transform: TransformFunction;
}

/**
 * Transform context passed to transformers
 */
export interface TransformContext {
  /**
   * Current source file
   */
  sourceFile: SourceFile;
  
  /**
   * Parse result
   */
  parseResult: ParseResult;
  
  /**
   * Transformer configuration
   */
  config: TransformerConfig;
  
  /**
   * Transform options
   */
  options: TransformOptions;
  
  /**
   * Applied transformations
   */
  appliedTransformations: AppliedTransformation[];
  
  /**
   * Errors collected
   */
  errors: TransformError[];
  
  /**
   * Warnings collected
   */
  warnings: TransformWarning[];
  
  /**
   * Shared context data
   */
  data: Record<string, any>;
  
  /**
   * Helper methods
   */
  helpers: TransformHelpers;
}

/**
 * Transform helper methods
 */
export interface TransformHelpers {
  /**
   * Report a transformation
   */
  reportTransformation(transformation: AppliedTransformation): void;
  
  /**
   * Report an error
   */
  reportError(error: TransformError): void;
  
  /**
   * Report a warning
   */
  reportWarning(warning: TransformWarning): void;
  
  /**
   * Get component mapping
   */
  getComponentMapping(name: string): ComponentMapping | undefined;
  
  /**
   * Get import mapping
   */
  getImportMapping(source: string): string | undefined;
  
  /**
   * Add to rollback queue
   */
  addRollback(rollback: RollbackAction): void;
}

/**
 * Rollback action
 */
export interface RollbackAction {
  /**
   * Action description
   */
  description: string;
  
  /**
   * Rollback function
   */
  rollback: () => void | Promise<void>;
}

/**
 * Progress reporter interface
 */
export interface ProgressReporter {
  /**
   * Report start of transformation
   */
  onStart(totalFiles: number): void;
  
  /**
   * Report file transformation start
   */
  onFileStart(filename: string, index: number): void;
  
  /**
   * Report file transformation complete
   */
  onFileComplete(filename: string, result: TransformResult): void;
  
  /**
   * Report transformation type progress
   */
  onTransformationType(type: TransformationType, progress: number): void;
  
  /**
   * Report completion
   */
  onComplete(results: TransformResult[]): void;
  
  /**
   * Report error
   */
  onError(error: Error): void;
}

/**
 * Function types
 */
export type TransformFunction = (node: Node, context: TransformContext) => Node | Node[] | undefined;
export type ComponentTransformFunction = (component: ComponentInfo, context: TransformContext) => ComponentMapping;
export type PropTransformFunction = (value: any, propName: string, context: TransformContext) => any;
export type StyleTransformer = (styleValue: any, context: TransformContext) => any;

/**
 * Transformer factory
 */
export interface TransformerFactory {
  /**
   * Create a transformer instance
   */
  create(config: TransformerConfig): Transformer;
}

/**
 * Main transformer interface
 */
export interface Transformer {
  /**
   * Transform a single file
   */
  transform(options: TransformOptions): Promise<TransformResult>;
  
  /**
   * Transform multiple files
   */
  transformBatch(files: TransformOptions[]): Promise<TransformResult[]>;
  
  /**
   * Validate configuration
   */
  validateConfig(): Promise<ValidationResult>;
  
  /**
   * Get available transformations
   */
  getAvailableTransformations(): TransformationType[];
  
  /**
   * Register a plugin
   */
  registerPlugin(plugin: TransformerPlugin): void;
  
  /**
   * Dispose resources
   */
  dispose(): void;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}