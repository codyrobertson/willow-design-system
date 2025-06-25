/**
 * Core Transformer API interfaces and types
 * Task 5.1: Design transformer API interface
 */

import * as ts from 'typescript';

/**
 * Core transformer interface that all transformers must implement
 */
export interface Transformer<TConfig = any, TResult = any> {
  /**
   * Unique identifier for the transformer
   */
  readonly name: string;

  /**
   * Human-readable description of what this transformer does
   */
  readonly description: string;

  /**
   * Version of the transformer
   */
  readonly version: string;

  /**
   * Initialize the transformer with configuration
   */
  initialize(config: TConfig): Promise<void>;

  /**
   * Transform a single source file
   */
  transform(sourceFile: ts.SourceFile, context: TransformContext): Promise<TransformResult<TResult>>;

  /**
   * Transform multiple files in batch
   */
  transformBatch(sourceFiles: ts.SourceFile[], context: TransformContext): Promise<BatchTransformResult<TResult>>;

  /**
   * Validate if a file can be transformed
   */
  canTransform(sourceFile: ts.SourceFile): boolean;

  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}

/**
 * Context provided to transformers during transformation
 */
export interface TransformContext {
  /**
   * TypeScript program instance
   */
  program: ts.Program;

  /**
   * Type checker for semantic analysis
   */
  typeChecker: ts.TypeChecker;

  /**
   * Compiler options
   */
  compilerOptions: ts.CompilerOptions;

  /**
   * Current working directory
   */
  workingDirectory: string;

  /**
   * Logger instance
   */
  logger: Logger;

  /**
   * Shared state between transformers
   */
  sharedState: Map<string, any>;

  /**
   * Transformer configuration
   */
  config: TransformerConfig;

  /**
   * Plugin instances
   */
  plugins: TransformerPlugin[];
}

/**
 * Result of a single transformation
 */
export interface TransformResult<T = any> {
  /**
   * Whether the transformation succeeded
   */
  success: boolean;

  /**
   * Transformed source file (if success)
   */
  transformedFile?: ts.SourceFile;

  /**
   * Custom result data
   */
  data?: T;

  /**
   * Errors encountered during transformation
   */
  errors: TransformError[];

  /**
   * Warnings generated during transformation
   */
  warnings: TransformWarning[];

  /**
   * Changes made during transformation
   */
  changes: TransformChange[];

  /**
   * Performance metrics
   */
  metrics?: TransformMetrics;
}

/**
 * Result of a batch transformation
 */
export interface BatchTransformResult<T = any> {
  /**
   * Individual file results
   */
  results: Map<string, TransformResult<T>>;

  /**
   * Overall success status
   */
  success: boolean;

  /**
   * Total errors across all files
   */
  totalErrors: number;

  /**
   * Total warnings across all files
   */
  totalWarnings: number;

  /**
   * Aggregated metrics
   */
  metrics?: TransformMetrics;
}

/**
 * Error encountered during transformation
 */
export interface TransformError {
  /**
   * Error code for programmatic handling
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * File where the error occurred
   */
  file?: string;

  /**
   * Location in the file
   */
  location?: SourceLocation;

  /**
   * Stack trace if available
   */
  stack?: string;

  /**
   * Suggestions for fixing the error
   */
  suggestions?: string[];
}

/**
 * Warning generated during transformation
 */
export interface TransformWarning {
  /**
   * Warning code
   */
  code: string;

  /**
   * Warning message
   */
  message: string;

  /**
   * File where the warning was generated
   */
  file?: string;

  /**
   * Location in the file
   */
  location?: SourceLocation;

  /**
   * Severity level
   */
  severity: 'info' | 'warning';
}

/**
 * Change made during transformation
 */
export interface TransformChange {
  /**
   * Type of change
   */
  type: 'add' | 'remove' | 'modify' | 'rename' | 'move';

  /**
   * Description of the change
   */
  description: string;

  /**
   * File affected
   */
  file: string;

  /**
   * Location of the change
   */
  location?: SourceLocation;

  /**
   * Before state (for modify/rename/move)
   */
  before?: string;

  /**
   * After state
   */
  after?: string;
}

/**
 * Source location information
 */
export interface SourceLocation {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

/**
 * Performance metrics for transformation
 */
export interface TransformMetrics {
  /**
   * Total duration in milliseconds
   */
  duration: number;

  /**
   * Time spent parsing
   */
  parseTime?: number;

  /**
   * Time spent transforming
   */
  transformTime?: number;

  /**
   * Time spent generating output
   */
  generateTime?: number;

  /**
   * Memory usage in bytes
   */
  memoryUsed?: number;

  /**
   * Number of nodes processed
   */
  nodesProcessed?: number;
}

/**
 * Logger interface for transformers
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Configuration for transformers
 */
export interface TransformerConfig {
  /**
   * Dry run mode - preview changes without applying
   */
  dryRun?: boolean;

  /**
   * Create backups before transformation
   */
  createBackups?: boolean;

  /**
   * Transform files in place vs creating copies
   */
  inPlace?: boolean;

  /**
   * Output directory for transformed files (if not in-place)
   */
  outputDir?: string;

  /**
   * File patterns to include
   */
  include?: string[];

  /**
   * File patterns to exclude
   */
  exclude?: string[];

  /**
   * Maximum number of files to process in parallel
   */
  maxConcurrency?: number;

  /**
   * Custom transformer-specific options
   */
  [key: string]: any;
}

/**
 * Plugin interface for extending transformers
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
   * Hook called before transformation starts
   */
  beforeTransform?(context: TransformContext): Promise<void>;

  /**
   * Hook called before transforming a file
   */
  beforeTransformFile?(
    sourceFile: ts.SourceFile,
    context: TransformContext
  ): Promise<ts.SourceFile | void>;

  /**
   * Hook called after transforming a file
   */
  afterTransformFile?(
    sourceFile: ts.SourceFile,
    result: TransformResult,
    context: TransformContext
  ): Promise<TransformResult | void>;

  /**
   * Hook called after all transformations complete
   */
  afterTransform?(
    results: BatchTransformResult,
    context: TransformContext
  ): Promise<void>;

  /**
   * Hook called on error
   */
  onError?(error: Error, context: TransformContext): Promise<void>;
}

/**
 * Factory for creating transformers
 */
export interface TransformerFactory<TConfig = any, TResult = any> {
  /**
   * Create a new transformer instance
   */
  create(config?: TConfig): Transformer<TConfig, TResult>;
}

/**
 * Registry for managing transformers
 */
export interface TransformerRegistry {
  /**
   * Register a transformer
   */
  register(transformer: Transformer): void;

  /**
   * Get a transformer by name
   */
  get(name: string): Transformer | undefined;

  /**
   * Get all registered transformers
   */
  getAll(): Transformer[];

  /**
   * Unregister a transformer
   */
  unregister(name: string): boolean;

  /**
   * Check if a transformer is registered
   */
  has(name: string): boolean;
}

/**
 * Composable transformer that chains multiple transformers
 */
export interface ComposableTransformer extends Transformer {
  /**
   * Add a transformer to the chain
   */
  addTransformer(transformer: Transformer): void;

  /**
   * Remove a transformer from the chain
   */
  removeTransformer(name: string): boolean;

  /**
   * Get all transformers in the chain
   */
  getTransformers(): Transformer[];

  /**
   * Set the execution order of transformers
   */
  setOrder(order: string[]): void;
}

/**
 * Options for creating a transformer pipeline
 */
export interface TransformerPipelineOptions {
  /**
   * Transformers to include in the pipeline
   */
  transformers: Transformer[];

  /**
   * Whether to stop on first error
   */
  stopOnError?: boolean;

  /**
   * Whether to run transformers in parallel (when possible)
   */
  parallel?: boolean;

  /**
   * Shared configuration for all transformers
   */
  config?: TransformerConfig;

  /**
   * Plugins to apply to all transformers
   */
  plugins?: TransformerPlugin[];
}

/**
 * Pipeline for running multiple transformers
 */
export interface TransformerPipeline {
  /**
   * Execute the pipeline on source files
   */
  execute(sourceFiles: ts.SourceFile[], context: TransformContext): Promise<PipelineResult>;

  /**
   * Add a transformer to the pipeline
   */
  addTransformer(transformer: Transformer, position?: number): void;

  /**
   * Remove a transformer from the pipeline
   */
  removeTransformer(name: string): boolean;

  /**
   * Get pipeline configuration
   */
  getConfig(): TransformerPipelineOptions;
}

/**
 * Result of pipeline execution
 */
export interface PipelineResult {
  /**
   * Results from each transformer
   */
  transformerResults: Map<string, BatchTransformResult>;

  /**
   * Overall success status
   */
  success: boolean;

  /**
   * Total duration
   */
  duration: number;

  /**
   * Aggregated errors
   */
  errors: TransformError[];

  /**
   * Aggregated warnings
   */
  warnings: TransformWarning[];
}

/**
 * Rollback handler for reverting transformations
 */
export interface RollbackHandler {
  /**
   * Create a backup before transformation
   */
  createBackup(files: string[], description?: string): Promise<string>;

  /**
   * Restore from a backup
   */
  restore(backupId: string): Promise<void>;

  /**
   * List available backups
   */
  listBackups(): Promise<BackupInfo[]>;

  /**
   * Delete a backup
   */
  deleteBackup(backupId: string): Promise<void>;
}

/**
 * Information about a backup
 */
export interface BackupInfo {
  /**
   * Unique backup identifier
   */
  id: string;

  /**
   * When the backup was created
   */
  timestamp: Date;

  /**
   * Files included in the backup
   */
  files: string[];

  /**
   * Size of the backup in bytes
   */
  size: number;

  /**
   * Description or reason for the backup
   */
  description?: string;
}

/**
 * Validator for transformation results
 */
export interface TransformationValidator {
  /**
   * Validate transformation results
   */
  validate(
    before: ts.SourceFile,
    after: ts.SourceFile,
    context: TransformContext
  ): ValidationResult;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: ValidationError[];

  /**
   * Validation warnings
   */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Severity
   */
  severity: 'error' | 'critical';

  /**
   * Location in source
   */
  location?: SourceLocation;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /**
   * Warning code
   */
  code: string;

  /**
   * Warning message
   */
  message: string;

  /**
   * Location in source
   */
  location?: SourceLocation;
}

// Re-export implementations
export * from './base-transformer';
export * from './transformer-registry';
export * from './transformer-pipeline';
export * from './composable-transformer';
export * from './rollback-handler';
export * from './transformation-validator';
export * from './plugin-manager';
export * from './logger';
export * from './transformation-mode-handler';

// Re-export transformers
export * from './transformers';