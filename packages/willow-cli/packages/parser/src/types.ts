import type { 
  ParseResult, 
  ImportInfo, 
  ComponentInfo, 
  ExportInfo,
  JSXElementInfo,
  SourceLocation,
  ParseError
} from '@willow-cli/types';

export type {
  ParseResult,
  ImportInfo,
  ComponentInfo,
  ExportInfo,
  JSXElementInfo,
  SourceLocation,
  ParseError
};

export interface ParserOptions {
  /**
   * Target file to parse
   */
  filename: string;
  
  /**
   * Source code content
   */
  content?: string;
  
  /**
   * TypeScript compiler options
   */
  compilerOptions?: import('typescript').CompilerOptions;
  
  /**
   * Whether to include type information
   */
  includeTypes?: boolean;
  
  /**
   * Whether to parse JSX
   */
  jsx?: boolean;
  
  /**
   * Whether to analyze imports
   */
  analyzeImports?: boolean;
  
  /**
   * Whether to detect components
   */
  detectComponents?: boolean;
  
  /**
   * Whether to analyze exports
   */
  analyzeExports?: boolean;
  
  /**
   * Custom component detection patterns
   */
  componentPatterns?: RegExp[];
  
  /**
   * Whether to include edge case handling
   */
  includeEdgeCases?: boolean;
  
  /**
   * Enable parser optimization
   */
  enableOptimization?: boolean;
  
  /**
   * Enable caching
   */
  enableCache?: boolean;
  
  /**
   * Cache size limit
   */
  cacheSize?: number;
  
  /**
   * Enable incremental parsing
   */
  incrementalParsing?: boolean;
  
  /**
   * Enable parallel processing
   */
  parallelProcessing?: boolean;
  
  /**
   * Memory limit in MB
   */
  memoryLimit?: number;
  
  /**
   * Show progress reporting
   */
  showProgress?: boolean;
  
  /**
   * Progress reporter instance
   */
  progressReporter?: import('./parser-optimizer').ProgressReporter;
  
  /**
   * Enable early termination on too many errors
   */
  earlyTermination?: boolean;
  
  /**
   * Maximum number of workers for parallel processing
   */
  maxWorkers?: number;
}

export interface ParserContext {
  /**
   * TypeScript program instance
   */
  program: import('typescript').Program;
  
  /**
   * Type checker
   */
  typeChecker: import('typescript').TypeChecker;
  
  /**
   * Source file being parsed
   */
  sourceFile: import('typescript').SourceFile;
  
  /**
   * Parser options
   */
  options: ParserOptions;
  
  /**
   * Collected errors
   */
  errors: ParseError[];
}

export interface ComponentPattern {
  /**
   * Pattern name
   */
  name: string;
  
  /**
   * Detection function
   */
  detect: (node: import('typescript').Node, context: ParserContext) => boolean;
  
  /**
   * Extract component info
   */
  extract: (node: import('typescript').Node, context: ParserContext) => Partial<ComponentInfo>;
}

export interface ImportPattern {
  /**
   * Pattern name
   */
  name: string;
  
  /**
   * Check if import matches pattern
   */
  matches: (importDecl: import('typescript').ImportDeclaration) => boolean;
  
  /**
   * Extract import info
   */
  extract: (importDecl: import('typescript').ImportDeclaration) => Partial<ImportInfo>;
}

export interface ScopeInfo {
  /**
   * Scope type
   */
  type: 'global' | 'module' | 'function' | 'block' | 'class';
  
  /**
   * Parent scope
   */
  parent?: ScopeInfo;
  
  /**
   * Symbols defined in this scope
   */
  symbols: Map<string, SymbolInfo>;
  
  /**
   * Child scopes
   */
  children: ScopeInfo[];
  
  /**
   * AST node for this scope
   */
  node: import('typescript').Node;
}

export interface SymbolInfo {
  /**
   * Symbol name
   */
  name: string;
  
  /**
   * Symbol kind
   */
  kind: 'variable' | 'function' | 'class' | 'interface' | 'type' | 'enum' | 'namespace';
  
  /**
   * Declaration node
   */
  declaration: import('typescript').Node;
  
  /**
   * Type information
   */
  type?: string;
  
  /**
   * Whether exported
   */
  exported?: boolean;
  
  /**
   * References to this symbol
   */
  references: import('typescript').Node[];
}