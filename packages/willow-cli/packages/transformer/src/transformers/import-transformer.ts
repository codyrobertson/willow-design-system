import * as ts from 'typescript';
import type {
  TransformContext,
  ImportMappingConfig,
  AppliedTransformation,
  TransformError,
  TransformWarning,
} from '../types';
import type { ImportInfo, SourceLocation } from '@willow-cli/types';

/**
 * Base class for import transformations
 */
export abstract class ImportTransformer {
  protected originalImports: ts.ImportDeclaration[] = [];
  protected transformedImports: ts.ImportDeclaration[] = [];
  
  constructor(
    protected context: TransformContext,
    protected config: ImportMappingConfig
  ) {}
  
  /**
   * Transform imports in the source file
   */
  transform(sourceFile: ts.SourceFile): ts.SourceFile {
    // Collect all import declarations
    this.collectImports(sourceFile);
    
    // Transform each import
    const transformer = this.createTransformer();
    const result = ts.transform(sourceFile, [transformer]);
    
    return result.transformed[0];
  }
  
  /**
   * Create TypeScript transformer
   */
  protected createTransformer(): ts.TransformerFactory<ts.SourceFile> {
    return (context) => {
      const visit: ts.Visitor = (node) => {
        if (ts.isImportDeclaration(node)) {
          return this.transformImport(node);
        }
        return ts.visitEachChild(node, visit, context);
      };
      
      return (sourceFile) => ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };
  }
  
  /**
   * Transform a single import declaration
   */
  protected abstract transformImport(node: ts.ImportDeclaration): ts.ImportDeclaration | undefined;
  
  /**
   * Collect all imports from source file
   */
  protected collectImports(sourceFile: ts.SourceFile): void {
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        this.originalImports.push(node);
      }
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
  }
  
  /**
   * Get module specifier text
   */
  protected getModuleSpecifier(node: ts.ImportDeclaration): string {
    if (ts.isStringLiteral(node.moduleSpecifier)) {
      return node.moduleSpecifier.text;
    }
    return node.moduleSpecifier.getText().slice(1, -1);
  }
  
  /**
   * Create new module specifier
   */
  protected createModuleSpecifier(source: string): ts.StringLiteral {
    return ts.factory.createStringLiteral(source);
  }
  
  /**
   * Get source location
   */
  protected getLocation(node: ts.Node): SourceLocation {
    const sourceFile = node.getSourceFile();
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      start: { line: start.line + 1, column: start.character + 1 },
      end: { line: end.line + 1, column: end.character + 1 },
    };
  }
  
  /**
   * Report transformation
   */
  protected reportTransformation(
    type: string,
    before: string,
    after: string,
    location: SourceLocation
  ): void {
    const transformation: AppliedTransformation = {
      type: 'imports',
      description: `Transform ${type}`,
      location,
      before,
      after,
      duration: 0,
    };
    
    this.context.helpers.reportTransformation(transformation);
  }
  
  /**
   * Report error
   */
  protected reportError(message: string, location?: SourceLocation): void {
    const error: TransformError = {
      type: 'imports',
      message,
      location,
      recoverable: true,
    };
    
    this.context.helpers.reportError(error);
  }
  
  /**
   * Report warning
   */
  protected reportWarning(message: string, location?: SourceLocation, suggestion?: string): void {
    const warning: TransformWarning = {
      type: 'imports',
      message,
      location,
      suggestion,
    };
    
    this.context.helpers.reportWarning(warning);
  }
}

/**
 * Import declaration details
 */
export interface ImportDetails {
  source: string;
  defaultImport?: string;
  namedImports?: Array<{
    name: string;
    alias?: string;
  }>;
  namespaceImport?: string;
  isTypeOnly: boolean;
  location: SourceLocation;
}