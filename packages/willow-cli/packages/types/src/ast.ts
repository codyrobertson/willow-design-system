import type { Node, SourceFile, ImportDeclaration, CallExpression } from 'typescript';

/**
 * AST Node types for transformation
 */
export type ASTNode = Node;

export type ImportType = 'side-effect' | 'package' | 'absolute' | 'relative';

export interface ImportedItem {
  name: string;
  alias: string;
  type: 'default' | 'named' | 'namespace';
}

export interface ParseResult {
  sourceFile: SourceFile;
  imports: ImportInfo[];
  components: ComponentInfo[];
  exports: ExportInfo[];
  errors?: ParseError[];
  // Edge case handling results
  dynamicImports?: ImportInfo[];
  reExports?: ExportInfo[];
  barrelExports?: {
    isBarrel: boolean;
    exports: ExportInfo[];
  };
  conditionalExports?: ExportInfo[];
  typeScriptExports?: ExportInfo[];
  codeSplitting?: {
    splitPoints: Array<{
      type: 'route' | 'component' | 'library';
      import: ImportInfo;
      condition?: string;
      path?: string;
    }>;
  };
}

export interface ImportInfo {
  source: string;
  type: ImportType;
  imported: ImportedItem[];
  location: SourceLocation;
  isTypeOnly?: boolean;
  dynamic?: boolean;
  lazy?: boolean;
  codeSplit?: boolean;
  raw?: string;
  // Additional fields from edge cases
  category?: string;
  framework?: string;
}

export type ComponentType = 'functional' | 'class';

export interface ComponentInfo {
  name: string;
  type: ComponentType;
  props?: PropInfo[];
  hooks?: string[];
  location: SourceLocation;
  jsxElements?: JSXElementInfo[];
  exported?: boolean;
  memo?: boolean;
  forwardRef?: boolean;
}

export interface PropInfo {
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: any;
}

export interface JSXAttribute {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'expression' | 'spread' | 'array' | 'object' | 'function' | 'identifier' | 'template' | 'null' | 'undefined';
  raw?: string;
}

export interface JSXElementInfo {
  tagName: string;
  attributes: JSXAttribute[];
  children: Array<{
    type: 'text' | 'expression' | 'element' | 'fragment';
    value: string | JSXElementInfo;
    raw?: string;
  }>;
  isComponent: boolean;
  isSelfClosing: boolean;
  location: SourceLocation;
  raw?: string;
}

export interface ExportInfo {
  name: string;
  type: 'named' | 'default' | 'namespace' | 're-export' | 'type' | 'commonjs' | 'conditional';
  source?: string;
  location: SourceLocation;
  alias?: string;
  isTypeOnly?: boolean;
  condition?: string;
  value?: string;
}

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface ParseError {
  message: string;
  location?: SourceLocation;
  severity: 'error' | 'warning';
}

/**
 * Transform context for AST operations
 */
export interface TransformContext {
  filename: string;
  sourceCode: string;
  options: Record<string, any>;
  uiKit: string;
  errors: ParseError[];
  warnings: ParseError[];
}