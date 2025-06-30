/**
 * Type definitions for the code generator module
 */

import * as ts from 'typescript';

/**
 * Options for code generation
 */
export interface CodeGeneratorOptions {
  /** Output format for the generated code */
  format: OutputFormat;

  /** Whether to format code with Prettier */
  formatCode?: boolean;

  /** Prettier configuration to use */
  prettierConfig?: PrettierConfig;

  /** Whether to include source maps */
  sourceMaps?: boolean;

  /** Whether to preserve comments */
  preserveComments?: boolean;

  /** Target ECMAScript version */
  target?: ts.ScriptTarget;

  /** Module system to use */
  module?: ts.ModuleKind;

  /** Custom print options for TypeScript printer */
  printOptions?: ts.PrinterOptions;
}

/**
 * Supported output formats
 */
export enum OutputFormat {
  TypeScript = 'typescript',
  JavaScript = 'javascript',
  JSX = 'jsx',
  TSX = 'tsx',
  ESModule = 'esm',
  CommonJS = 'cjs',
}

/**
 * Prettier configuration options
 */
export interface PrettierConfig {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  bracketSpacing?: boolean;
  arrowParens?: 'avoid' | 'always';
  endOfLine?: 'auto' | 'lf' | 'crlf' | 'cr';
}

/**
 * File organization configuration
 */
export interface FileOrganizationConfig {
  /** Base output directory */
  outputDir: string;

  /** Directory structure strategy */
  structure: DirectoryStructure;

  /** Custom directory mapping function */
  customMapper?: (filePath: string, ast: ts.SourceFile) => string;

  /** Whether to preserve original directory structure */
  preserveStructure?: boolean;

  /** File naming convention */
  fileNaming?: FileNamingConvention;

  /** Whether to group by component type */
  groupByType?: boolean;
}

/**
 * Directory structure strategies
 */
export enum DirectoryStructure {
  /** Flat structure with all files in one directory */
  Flat = 'flat',

  /** Mirror source directory structure */
  Mirror = 'mirror',

  /** Group by feature/module */
  Feature = 'feature',

  /** Group by file type (components, utils, etc.) */
  Type = 'type',

  /** Custom structure using mapper function */
  Custom = 'custom',
}

/**
 * File naming conventions
 */
export enum FileNamingConvention {
  /** Keep original names */
  Original = 'original',

  /** Convert to kebab-case */
  KebabCase = 'kebab-case',

  /** Convert to camelCase */
  CamelCase = 'camelCase',

  /** Convert to PascalCase */
  PascalCase = 'PascalCase',

  /** Add prefix/suffix */
  Custom = 'custom',
}

/**
 * Template configuration
 */
export interface TemplateConfig {
  /** Template name or ID */
  name: string;

  /** Template variables */
  variables: Record<string, any>;

  /** Template file path or content */
  template: string | TemplateContent;

  /** Output file path */
  outputPath: string;

  /** Whether to overwrite existing files */
  overwrite?: boolean;
}

/**
 * Template content structure
 */
export interface TemplateContent {
  /** Template string with placeholders */
  content: string;

  /** Template engine to use */
  engine?: TemplateEngine;

  /** Custom helpers for template processing */
  helpers?: Record<string, (...args: any[]) => any>;
}

/**
 * Supported template engines
 */
export enum TemplateEngine {
  /** Simple string replacement */
  Simple = 'simple',

  /** Handlebars templates */
  Handlebars = 'handlebars',

  /** EJS templates */
  EJS = 'ejs',

  /** Custom template engine */
  Custom = 'custom',
}

/**
 * Documentation generation options
 */
export interface DocumentationOptions {
  /** Documentation format */
  format: DocumentationFormat;

  /** Output directory for docs */
  outputDir: string;

  /** Whether to include private members */
  includePrivate?: boolean;

  /** Whether to include inherited members */
  includeInherited?: boolean;

  /** Custom documentation template */
  template?: string;

  /** Table of contents generation */
  generateTOC?: boolean;

  /** Documentation metadata */
  metadata?: DocumentationMetadata;
}

/**
 * Documentation formats
 */
export enum DocumentationFormat {
  /** Markdown documentation */
  Markdown = 'markdown',

  /** HTML documentation */
  HTML = 'html',

  /** JSON documentation */
  JSON = 'json',

  /** TypeDoc format */
  TypeDoc = 'typedoc',

  /** JSDoc format */
  JSDoc = 'jsdoc',
}

/**
 * Documentation metadata
 */
export interface DocumentationMetadata {
  title?: string;
  description?: string;
  version?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
}

/**
 * Code generation result
 */
export interface CodeGenerationResult {
  /** Generated code string */
  code: string;

  /** Source map if requested */
  sourceMap?: string;

  /** File path where code should be written */
  filePath: string;

  /** Any diagnostics or warnings */
  diagnostics?: ts.Diagnostic[];

  /** Generation metadata */
  metadata?: GenerationMetadata;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Generation timestamp */
  timestamp: Date;

  /** Generator version */
  version: string;

  /** Source file information */
  sourceFile?: string;

  /** AST node count */
  nodeCount?: number;

  /** Generation duration in ms */
  duration?: number;

  /** Output format used */
  format: OutputFormat;
}

/**
 * AST to code converter interface
 */
export interface IASTToCodeConverter {
  /**
   * Convert AST to code string
   */
  convert(sourceFile: ts.SourceFile, options?: CodeGeneratorOptions): CodeGenerationResult;

  /**
   * Convert single AST node to code
   */
  convertNode(node: ts.Node, options?: CodeGeneratorOptions): string;

  /**
   * Batch convert multiple source files
   */
  convertBatch(
    sourceFiles: ts.SourceFile[],
    options?: CodeGeneratorOptions
  ): CodeGenerationResult[];
}

/**
 * File organizer interface
 */
export interface IFileOrganizer {
  /**
   * Organize generated files according to configuration
   */
  organize(files: CodeGenerationResult[], config: FileOrganizationConfig): OrganizedFiles;

  /**
   * Get output path for a single file
   */
  getOutputPath(sourceFile: ts.SourceFile, config: FileOrganizationConfig): string;
}

/**
 * Organized files structure
 */
export interface OrganizedFiles {
  /** File paths organized by directory */
  directories: Map<string, CodeGenerationResult[]>;

  /** Total file count */
  fileCount: number;

  /** Directory structure visualization */
  structure?: string;
}

/**
 * Template processor interface
 */
export interface ITemplateProcessor {
  /**
   * Process a template with given configuration
   */
  process(config: TemplateConfig): Promise<string>;

  /**
   * Register custom template engine
   */
  registerEngine(name: string, engine: (template: string, data: any) => string): void;

  /**
   * Register template helper function
   */
  registerHelper(name: string, helper: (...args: any[]) => any): void;
}

/**
 * File writer interface
 */
export interface IFileWriter {
  /**
   * Write files to the file system
   */
  writeFiles(files: CodeGenerationResult[], config: FileWriterConfig): Promise<FileWriteResult[]>;

  /**
   * Write a single file
   */
  writeFile(file: CodeGenerationResult, config: FileWriterConfig): Promise<FileWriteResult>;

  /**
   * Create directory recursively
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Backup existing file
   */
  backupFile(path: string): Promise<string>;
}

/**
 * File writer configuration
 */
export interface FileWriterConfig {
  /** Base output directory */
  outputDir: string;

  /** Conflict resolution strategy */
  conflictResolution: ConflictResolution;

  /** Whether to create backups */
  createBackups?: boolean;

  /** Backup directory */
  backupDir?: string;

  /** Whether to create directories automatically */
  createDirectories?: boolean;

  /** File permissions */
  fileMode?: number;

  /** Directory permissions */
  dirMode?: number;

  /** Whether to overwrite readonly files */
  overwriteReadonly?: boolean;

  /** Custom conflict resolver function */
  customResolver?: (
    existingContent: string,
    newContent: string,
    filePath: string
  ) => Promise<string>;
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolution {
  /** Overwrite existing files */
  Overwrite = 'overwrite',

  /** Skip existing files */
  Skip = 'skip',

  /** Merge content */
  Merge = 'merge',

  /** Prompt user for action */
  Prompt = 'prompt',

  /** Use custom resolver */
  Custom = 'custom',

  /** Create with suffix */
  Suffix = 'suffix',
}

/**
 * File write result
 */
export interface FileWriteResult {
  /** Written file path */
  filePath: string;

  /** Whether file was written successfully */
  success: boolean;

  /** Action taken (created, overwritten, skipped, etc.) */
  action: FileWriteAction;

  /** Error if write failed */
  error?: Error;

  /** Backup file path if created */
  backupPath?: string;

  /** File size in bytes */
  size?: number;

  /** Write timestamp */
  timestamp: Date;
}

/**
 * File write actions
 */
export enum FileWriteAction {
  Created = 'created',
  Overwritten = 'overwritten',
  Skipped = 'skipped',
  Merged = 'merged',
  BackedUp = 'backed-up',
  Failed = 'failed',
}

/**
 * Documentation generator interface
 */
export interface IDocumentationGenerator {
  /**
   * Generate documentation from AST
   */
  generate(
    sourceFiles: ts.SourceFile[],
    options: DocumentationOptions
  ): Promise<DocumentationResult>;

  /**
   * Extract documentation from single node
   */
  extractDocs(node: ts.Node): DocumentationEntry;
}

/**
 * Documentation result
 */
export interface DocumentationResult {
  /** Generated documentation files */
  files: DocumentationFile[];

  /** Table of contents if generated */
  toc?: TableOfContents;

  /** Generation metadata */
  metadata: DocumentationMetadata;
}

/**
 * Documentation file
 */
export interface DocumentationFile {
  /** File path */
  path: string;

  /** File content */
  content: string;

  /** Documentation format */
  format: DocumentationFormat;
}

/**
 * Documentation entry for a single item
 */
export interface DocumentationEntry {
  /** Item name */
  name: string;

  /** Item kind (class, function, interface, etc.) */
  kind: string;

  /** Description/JSDoc comment */
  description?: string;

  /** Parameters if applicable */
  parameters?: ParameterDoc[];

  /** Return type if applicable */
  returns?: string;

  /** Type information */
  type?: string;

  /** Modifiers (public, private, static, etc.) */
  modifiers?: string[];

  /** Source location */
  source?: SourceLocation;
}

/**
 * Parameter documentation
 */
export interface ParameterDoc {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  defaultValue?: string;
}

/**
 * Source location information
 */
export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

/**
 * Table of contents structure
 */
export interface TableOfContents {
  /** TOC entries */
  entries: TOCEntry[];

  /** Nested structure */
  tree?: TOCEntry;
}

/**
 * Table of contents entry
 */
export interface TOCEntry {
  /** Entry title */
  title: string;

  /** Link to documentation */
  link: string;

  /** Nested entries */
  children?: TOCEntry[];

  /** Entry level (for indentation) */
  level: number;
}
