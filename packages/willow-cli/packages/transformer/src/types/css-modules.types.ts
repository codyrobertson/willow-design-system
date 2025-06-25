import type { StyleTransformationContext } from './style-transformation.types';

/**
 * CSS Modules specific types
 */

/**
 * Represents a CSS class definition in a CSS module
 */
export interface CSSModuleClass {
  /** Original class name in the CSS module */
  originalName: string;
  /** Local scoped class name */
  localName: string;
  /** Global class name (if exported) */
  globalName?: string;
  /** Whether this class is composed from other classes */
  isComposed?: boolean;
  /** Classes this class composes from */
  composesFrom?: string[];
  /** The CSS rules associated with this class */
  rules?: CSSRule[];
}

/**
 * Represents a CSS rule
 */
export interface CSSRule {
  /** CSS property name */
  property: string;
  /** CSS property value */
  value: string;
  /** Whether this rule is important */
  important?: boolean;
}

/**
 * Represents a CSS Module
 */
export interface CSSModule {
  /** Module file path */
  filePath: string;
  /** All classes defined in this module */
  classes: Map<string, CSSModuleClass>;
  /** CSS variables defined in this module */
  variables?: Map<string, string>;
  /** Imports from other CSS modules */
  imports?: CSSModuleImport[];
  /** Exports to be available for other modules */
  exports?: Map<string, string>;
  /** Raw CSS content */
  rawContent?: string;
}

/**
 * Represents an import from another CSS module
 */
export interface CSSModuleImport {
  /** Path to the imported module */
  from: string;
  /** Imported class names mapping (imported name -> local name) */
  imports: Map<string, string>;
  /** Whether this is a value import */
  isValueImport?: boolean;
}

/**
 * CSS Modules transformation options
 */
export interface CSSModulesTransformOptions {
  /** Whether to generate TypeScript definitions */
  generateTypeDefinitions?: boolean;
  /** Custom class name format function */
  generateScopedName?: (name: string, filename: string, css: string) => string;
  /** Whether to preserve original class names as comments */
  preserveOriginalNames?: boolean;
  /** Enable CSS variables transformation */
  transformVariables?: boolean;
  /** Custom variable name transformer */
  variableTransformer?: (name: string, value: string) => { name: string; value: string };
  /** Whether to resolve imports */
  resolveImports?: boolean;
  /** Base directory for resolving imports */
  baseDir?: string;
}

/**
 * Result of parsing a CSS module
 */
export interface CSSModuleParseResult {
  /** The parsed CSS module */
  module: CSSModule;
  /** Any warnings encountered during parsing */
  warnings?: string[];
  /** Dependencies (imported modules) */
  dependencies?: string[];
}

/**
 * CSS Modules transformer configuration
 */
export interface CSSModulesConfig {
  /** Pattern for matching CSS module files */
  pattern?: RegExp;
  /** Directories to search for CSS modules */
  searchDirs?: string[];
  /** Whether to auto-import CSS modules in components */
  autoImport?: boolean;
  /** Custom naming convention */
  namingConvention?: 'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase';
  /** Export style for TypeScript definitions */
  exportType?: 'named' | 'default' | 'namespace';
}

/**
 * TypeScript definition for a CSS module
 */
export interface CSSModuleTypeDefinition {
  /** Module path */
  modulePath: string;
  /** Class name exports */
  classes: Record<string, string>;
  /** Variable exports (if any) */
  variables?: Record<string, string>;
  /** The generated TypeScript code */
  code: string;
}

/**
 * CSS Module composition
 */
export interface CSSModuleComposition {
  /** Base classes to compose from */
  composes: string[];
  /** Whether composition is from external module */
  from?: string;
  /** Whether to compose from global scope */
  global?: boolean;
}

/**
 * CSS Module validation result
 */
export interface CSSModuleValidationResult {
  /** Whether the module is valid */
  valid: boolean;
  /** Validation errors */
  errors: CSSModuleValidationError[];
  /** Unused classes */
  unusedClasses?: string[];
  /** Undefined class references */
  undefinedReferences?: string[];
}

/**
 * CSS Module validation error
 */
export interface CSSModuleValidationError {
  /** Error type */
  type: 'undefined-class' | 'circular-composition' | 'invalid-import' | 'duplicate-class';
  /** Error message */
  message: string;
  /** Line number where error occurred */
  line?: number;
  /** Column number where error occurred */
  column?: number;
  /** The problematic class or import */
  reference?: string;
}

/**
 * CSS Module usage context
 */
export interface CSSModuleUsageContext extends StyleTransformationContext {
  /** The component using this CSS module */
  componentPath?: string;
  /** How the CSS module is imported */
  importStyle?: 'named' | 'default' | 'namespace';
  /** The import name used in the component */
  importName?: string;
}