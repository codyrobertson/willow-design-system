/**
 * Code Generator Types and Interfaces
 * 
 * Core type definitions for the Willow Design System code generation module.
 * Provides comprehensive interfaces for AST-to-code generation, template processing,
 * and file organization with full TypeScript support.
 */

import type { Node, SourceFile, Statement } from 'typescript';

/**
 * Code generator options configuration
 */
export interface IGeneratorOptions {
  /** Target language for code generation */
  language: 'typescript' | 'javascript' | 'tsx' | 'jsx';
  
  /** TypeScript compiler options */
  compilerOptions?: {
    /** Module system to use */
    module?: 'commonjs' | 'esm' | 'amd' | 'umd' | 'system';
    /** Target ES version */
    target?: 'es5' | 'es6' | 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext';
    /** Enable JSX support */
    jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev';
    /** Use strict mode */
    strict?: boolean;
    /** Source map generation */
    sourceMap?: boolean;
    /** Declaration file generation */
    declaration?: boolean;
  };
  
  /** Output formatting options */
  formatting?: {
    /** Indentation style */
    indent?: 'spaces' | 'tabs';
    /** Indentation size */
    indentSize?: number;
    /** Line ending style */
    lineEnding?: 'lf' | 'crlf' | 'cr';
    /** Quote style for strings */
    quoteStyle?: 'single' | 'double';
    /** Trailing comma preference */
    trailingComma?: 'none' | 'es5' | 'all';
    /** Semicolon preference */
    semicolons?: boolean;
    /** Max line length */
    printWidth?: number;
  };
  
  /** File organization options */
  fileOrganization?: {
    /** Base output directory */
    outputDir: string;
    /** Preserve source directory structure */
    preserveStructure?: boolean;
    /** File naming convention */
    fileNaming?: 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';
    /** Directory naming convention */
    directoryNaming?: 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';
    /** Create barrel exports (index files) */
    createBarrelExports?: boolean;
    /** Group files by type */
    groupByType?: boolean;
  };
  
  /** Template processing options */
  templateOptions?: {
    /** Template variable prefix */
    variablePrefix?: string;
    /** Template variable suffix */
    variableSuffix?: string;
    /** Enable conditional blocks */
    enableConditionals?: boolean;
    /** Enable loops in templates */
    enableLoops?: boolean;
    /** Custom template helpers */
    helpers?: Record<string, TemplateHelper>;
  };
  
  /** Code transformation options */
  transformations?: {
    /** Add file headers */
    addHeaders?: boolean;
    /** Header template */
    headerTemplate?: string;
    /** Add imports optimization */
    optimizeImports?: boolean;
    /** Sort imports */
    sortImports?: boolean;
    /** Remove unused imports */
    removeUnusedImports?: boolean;
    /** Add missing imports */
    addMissingImports?: boolean;
  };
  
  /** Error handling options */
  errorHandling?: {
    /** Continue on error */
    continueOnError?: boolean;
    /** Max errors before stopping */
    maxErrors?: number;
    /** Error reporting level */
    errorLevel?: 'error' | 'warning' | 'info';
    /** Validation before generation */
    validateBeforeGeneration?: boolean;
  };
}

/**
 * Template helper function type
 */
export type TemplateHelper = (value: any, ...args: any[]) => string;

/**
 * Generated file information
 */
export interface IGeneratedFile {
  /** Relative file path from output directory */
  path: string;
  /** Generated file content */
  content: string;
  /** Source file reference */
  sourceFile?: string;
  /** File metadata */
  metadata?: {
    /** Original AST nodes */
    nodes?: Node[];
    /** Template used */
    template?: string;
    /** Generation timestamp */
    timestamp?: Date;
    /** Checksum for content verification */
    checksum?: string;
  };
}

/**
 * Code generation output result
 */
export interface IGeneratorOutput {
  /** Successfully generated files */
  files: IGeneratedFile[];
  /** Generation errors */
  errors: IGenerationError[];
  /** Generation warnings */
  warnings: IGenerationWarning[];
  /** Generation statistics */
  stats: {
    /** Total files processed */
    totalFiles: number;
    /** Successfully generated files */
    successCount: number;
    /** Failed files */
    failureCount: number;
    /** Total lines of code generated */
    linesGenerated: number;
    /** Generation duration in ms */
    duration: number;
  };
}

/**
 * Generation error information
 */
export interface IGenerationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** File where error occurred */
  file?: string;
  /** Line number if applicable */
  line?: number;
  /** Column number if applicable */
  column?: number;
  /** Stack trace */
  stack?: string;
  /** Error context */
  context?: Record<string, unknown>;
}

/**
 * Generation warning information
 */
export interface IGenerationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** File where warning occurred */
  file?: string;
  /** Line number if applicable */
  line?: number;
  /** Suggestion for fixing */
  suggestion?: string;
}

/**
 * Main code generator interface
 */
export interface ICodeGenerator {
  /** Generator name */
  readonly name: string;
  
  /** Generator version */
  readonly version: string;
  
  /** Supported languages */
  readonly supportedLanguages: string[];
  
  /**
   * Generate code from TypeScript AST
   * @param sourceFile - TypeScript source file AST
   * @param options - Generation options
   * @returns Generated code string
   */
  generateFromAST(sourceFile: SourceFile, options?: IGeneratorOptions): Promise<string>;
  
  /**
   * Generate code from multiple AST nodes
   * @param nodes - Array of TypeScript AST nodes
   * @param options - Generation options
   * @returns Generated code string
   */
  generateFromNodes(nodes: Node[], options?: IGeneratorOptions): Promise<string>;
  
  /**
   * Generate multiple files from AST
   * @param sourceFiles - Map of file paths to AST
   * @param options - Generation options
   * @returns Generation output result
   */
  generateFiles(sourceFiles: Map<string, SourceFile>, options?: IGeneratorOptions): Promise<IGeneratorOutput>;
  
  /**
   * Validate AST before generation
   * @param sourceFile - Source file to validate
   * @returns Validation result
   */
  validateAST(sourceFile: SourceFile): Promise<{ valid: boolean; errors: IGenerationError[] }>;
  
  /**
   * Apply transformations to AST before generation
   * @param sourceFile - Source file to transform
   * @param options - Generation options
   * @returns Transformed source file
   */
  transformAST(sourceFile: SourceFile, options?: IGeneratorOptions): Promise<SourceFile>;
}

/**
 * Template processor interface
 */
export interface ITemplateProcessor {
  /** Processor name */
  readonly name: string;
  
  /**
   * Process template with variables
   * @param template - Template string
   * @param variables - Template variables
   * @param options - Template options
   * @returns Processed template
   */
  process(template: string, variables: Record<string, any>, options?: IGeneratorOptions['templateOptions']): Promise<string>;
  
  /**
   * Compile template for reuse
   * @param template - Template string
   * @param options - Template options
   * @returns Compiled template function
   */
  compile(template: string, options?: IGeneratorOptions['templateOptions']): Promise<CompiledTemplate>;
  
  /**
   * Register custom helper
   * @param name - Helper name
   * @param helper - Helper function
   */
  registerHelper(name: string, helper: TemplateHelper): void;
  
  /**
   * Validate template syntax
   * @param template - Template to validate
   * @returns Validation result
   */
  validateTemplate(template: string): { valid: boolean; errors: string[] };
}

/**
 * Compiled template function
 */
export type CompiledTemplate = (variables: Record<string, any>) => string;

/**
 * File writer interface
 */
export interface IFileWriter {
  /** Writer name */
  readonly name: string;
  
  /**
   * Write single file
   * @param file - File to write
   * @param options - File organization options
   * @returns Write result
   */
  writeFile(file: IGeneratedFile, options?: IGeneratorOptions['fileOrganization']): Promise<WriteResult>;
  
  /**
   * Write multiple files
   * @param files - Files to write
   * @param options - File organization options
   * @returns Write results
   */
  writeFiles(files: IGeneratedFile[], options?: IGeneratorOptions['fileOrganization']): Promise<WriteResult[]>;
  
  /**
   * Check if file exists
   * @param path - File path
   * @returns Existence check result
   */
  fileExists(path: string): Promise<boolean>;
  
  /**
   * Handle file conflict
   * @param file - File with conflict
   * @param existingContent - Existing file content
   * @param options - Conflict resolution options
   * @returns Resolution result
   */
  handleConflict(file: IGeneratedFile, existingContent: string, options?: ConflictResolutionOptions): Promise<ConflictResolution>;
}

/**
 * File write result
 */
export interface WriteResult {
  /** File path */
  path: string;
  /** Write success */
  success: boolean;
  /** Error if failed */
  error?: Error;
  /** Bytes written */
  bytesWritten?: number;
  /** Backup created */
  backupCreated?: boolean;
}

/**
 * Conflict resolution options
 */
export interface ConflictResolutionOptions {
  /** Resolution strategy */
  strategy: 'overwrite' | 'backup' | 'merge' | 'skip' | 'prompt';
  /** Backup directory */
  backupDir?: string;
  /** Merge strategy */
  mergeStrategy?: 'ours' | 'theirs' | 'manual';
  /** Custom merge function */
  customMerge?: (existing: string, generated: string) => string;
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  /** Action taken */
  action: 'overwritten' | 'backed-up' | 'merged' | 'skipped';
  /** Final content */
  content?: string;
  /** Backup path if created */
  backupPath?: string;
}

/**
 * AST visitor interface for code generation
 */
export interface IGeneratorVisitor {
  /** Visitor name */
  readonly name: string;
  
  /**
   * Visit AST node
   * @param node - Node to visit
   * @param context - Visitor context
   * @returns Generated code fragment
   */
  visitNode(node: Node, context: VisitorContext): string;
  
  /**
   * Enter node (pre-order traversal)
   * @param node - Node being entered
   * @param context - Visitor context
   */
  enterNode?(node: Node, context: VisitorContext): void;
  
  /**
   * Exit node (post-order traversal)
   * @param node - Node being exited
   * @param context - Visitor context
   */
  exitNode?(node: Node, context: VisitorContext): void;
}

/**
 * Visitor context for code generation
 */
export interface VisitorContext {
  /** Current indentation level */
  indentLevel: number;
  /** Parent node stack */
  parentStack: Node[];
  /** Generation options */
  options: IGeneratorOptions;
  /** Custom state */
  state: Record<string, any>;
  /** Helper methods */
  helpers: {
    indent(): string;
    dedent(): string;
    newline(): string;
    quote(text: string): string;
  };
}

/**
 * Template registry interface
 */
export interface ITemplateRegistry {
  /** Registry name */
  readonly name: string;
  
  /**
   * Register template
   * @param name - Template name
   * @param template - Template content
   * @param metadata - Template metadata
   */
  register(name: string, template: string, metadata?: TemplateMetadata): void;
  
  /**
   * Get template by name
   * @param name - Template name
   * @returns Template info
   */
  get(name: string): TemplateInfo | undefined;
  
  /**
   * List all templates
   * @param filter - Optional filter
   * @returns Template list
   */
  list(filter?: TemplateFilter): TemplateInfo[];
  
  /**
   * Remove template
   * @param name - Template name
   * @returns Removal success
   */
  remove(name: string): boolean;
  
  /**
   * Clear all templates
   */
  clear(): void;
}

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /** Template description */
  description?: string;
  /** Template category */
  category?: string;
  /** Template tags */
  tags?: string[];
  /** Template variables */
  variables?: TemplateVariable[];
  /** Template version */
  version?: string;
  /** Template author */
  author?: string;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Variable description */
  description?: string;
  /** Default value */
  defaultValue?: any;
  /** Required flag */
  required?: boolean;
  /** Validation pattern */
  pattern?: string;
}

/**
 * Template information
 */
export interface TemplateInfo {
  /** Template name */
  name: string;
  /** Template content */
  content: string;
  /** Template metadata */
  metadata?: TemplateMetadata;
  /** Registration timestamp */
  registeredAt: Date;
}

/**
 * Template filter options
 */
export interface TemplateFilter {
  /** Filter by category */
  category?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by name pattern */
  namePattern?: string;
}

/**
 * Code formatter interface
 */
export interface ICodeFormatter {
  /** Formatter name */
  readonly name: string;
  
  /**
   * Format generated code
   * @param code - Code to format
   * @param options - Formatting options
   * @returns Formatted code
   */
  format(code: string, options?: IGeneratorOptions['formatting']): Promise<string>;
  
  /**
   * Check if code is formatted
   * @param code - Code to check
   * @param options - Formatting options
   * @returns Format check result
   */
  check(code: string, options?: IGeneratorOptions['formatting']): Promise<{ formatted: boolean; issues?: string[] }>;
}