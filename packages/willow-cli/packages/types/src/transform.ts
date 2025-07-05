import type { ASTNode, TransformContext } from './ast';

/**
 * Transform types
 */

export interface Transformer {
  /**
   * Transformer name
   */
  name: string;
  
  /**
   * Transformer version
   */
  version: string;
  
  /**
   * Transform priority (lower = earlier)
   */
  priority: number;
  
  /**
   * Check if this transformer should run
   */
  shouldTransform(context: TransformContext): boolean;
  
  /**
   * Transform the AST
   */
  transform(ast: ASTNode, context: TransformContext): Promise<TransformResult>;
  
  /**
   * Get transformer options
   */
  getOptions(): TransformerOptions;
}

export interface TransformResult {
  /**
   * Transformed AST
   */
  ast: ASTNode;
  
  /**
   * Whether changes were made
   */
  modified: boolean;
  
  /**
   * Transform metadata
   */
  metadata?: TransformMetadata;
  
  /**
   * Errors encountered
   */
  errors?: TransformError[];
}

export interface TransformMetadata {
  /**
   * Number of nodes transformed
   */
  nodesTransformed: number;
  
  /**
   * Types of transformations applied
   */
  transformations: string[];
  
  /**
   * Duration in milliseconds
   */
  duration: number;
  
  /**
   * Additional metadata
   */
  [key: string]: any;
}

export interface TransformError {
  message: string;
  node?: ASTNode;
  severity: 'error' | 'warning';
  transformer: string;
}

export interface TransformerOptions {
  /**
   * Whether to preserve comments
   */
  preserveComments?: boolean;
  
  /**
   * Whether to preserve formatting
   */
  preserveFormatting?: boolean;
  
  /**
   * Whether to add source maps
   */
  sourceMaps?: boolean;
  
  /**
   * Custom options
   */
  [key: string]: any;
}

/**
 * Transform pipeline
 */
export interface TransformPipeline {
  /**
   * Add a transformer to the pipeline
   */
  add(transformer: Transformer): void;
  
  /**
   * Remove a transformer from the pipeline
   */
  remove(name: string): void;
  
  /**
   * Execute the pipeline
   */
  execute(ast: ASTNode, context: TransformContext): Promise<TransformPipelineResult>;
  
  /**
   * Get all transformers
   */
  getTransformers(): Transformer[];
}

export interface TransformPipelineResult {
  /**
   * Final transformed AST
   */
  ast: ASTNode;
  
  /**
   * Results from each transformer
   */
  results: TransformResult[];
  
  /**
   * Total duration
   */
  duration: number;
  
  /**
   * Whether any errors occurred
   */
  hasErrors: boolean;
}

/**
 * Import transformation types
 */
export interface ImportTransform {
  /**
   * Source module pattern
   */
  from: string | RegExp;
  
  /**
   * Target module
   */
  to: string | ((match: string) => string);
  
  /**
   * Import name mappings
   */
  imports?: Record<string, string>;
  
  /**
   * Whether to update deep imports
   */
  deep?: boolean;
}

/**
 * Component transformation types
 */
export interface ComponentTransform {
  /**
   * Component name pattern
   */
  name: string | RegExp;
  
  /**
   * Prop transformations
   */
  props?: PropTransform[];
  
  /**
   * Children transformation
   */
  children?: ChildrenTransform;
  
  /**
   * Wrapper component
   */
  wrapper?: string;
}

export interface PropTransform {
  from: string;
  to?: string;
  value?: (value: any) => any;
  remove?: boolean;
}

export interface ChildrenTransform {
  /**
   * Transform function for children
   */
  transform: (children: ASTNode[]) => ASTNode[];
  
  /**
   * Whether to wrap children
   */
  wrap?: string;
}