/**
 * Import Parser Transformer
 * Advanced import parsing and manipulation
 */

import * as ts from 'typescript';
import { BaseTransformer } from '../../base-transformer';
import {
  TransformContext,
  TransformError,
  TransformWarning,
  TransformChange,
} from '../../index';

export interface ImportParserConfig {
  /** Parse and collect import information without transforming */
  collectOnly?: boolean;
  /** Extract import metadata for analysis */
  extractMetadata?: boolean;
  /** Validate import structure */
  validateImports?: boolean;
  /** Sort imports by category */
  sortImports?: boolean;
  /** Group imports by type */
  groupByType?: boolean;
}

export interface ImportInfo {
  moduleSpecifier: string;
  importClause?: {
    defaultImport?: string;
    namedImports?: string[];
    namespaceImport?: string;
  };
  isTypeOnly: boolean;
  position: {
    line: number;
    character: number;
  };
}

export interface ImportParserResult {
  imports: ImportInfo[];
  totalImports: number;
  defaultImports: number;
  namedImports: number;
  namespaceImports: number;
  typeOnlyImports: number;
  externalImports: number;
  relativeImports: number;
  sortedImports?: ImportInfo[];
}

export class ImportParserTransformer extends BaseTransformer<
  ImportParserConfig,
  ImportParserResult
> {
  readonly name = 'import-parser-transformer';
  readonly description = 'Parses and analyzes import statements';
  readonly version = '1.0.0';

  protected async performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    data?: ImportParserResult;
    nodesProcessed?: number;
  }> {
    const result: ImportParserResult = {
      imports: [],
      totalImports: 0,
      defaultImports: 0,
      namedImports: 0,
      namespaceImports: 0,
      typeOnlyImports: 0,
      externalImports: 0,
      relativeImports: 0,
    };

    let nodesProcessed = 0;

    const transformer: ts.TransformerFactory<ts.Node> = (context) => {
      return (rootNode) => {
        const visit = (node: ts.Node): ts.Node => {
          nodesProcessed++;

          if (ts.isImportDeclaration(node)) {
            this.parseImportDeclaration(node, sourceFile, result);
            
            if (this.config?.collectOnly) {
              return node; // Don't transform, just collect
            }
          }

          return ts.visitEachChild(node, visit, context);
        };

        return ts.visitNode(rootNode, visit);
      };
    };

    const transformationResult = ts.transform(sourceFile, [transformer]);
    const transformedFile = transformationResult.transformed[0] as ts.SourceFile;
    transformationResult.dispose();

    // Post-process: sort imports if requested
    if (this.config?.sortImports) {
      result.sortedImports = this.sortImports(result.imports);
    }

    return {
      transformedFile,
      data: result,
      nodesProcessed,
    };
  }

  private parseImportDeclaration(
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile,
    result: ImportParserResult
  ): void {
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      return;
    }

    const moduleSpecifier = node.moduleSpecifier.text;
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    
    const importInfo: ImportInfo = {
      moduleSpecifier,
      isTypeOnly: node.importClause?.isTypeOnly ?? false,
      position: {
        line: position.line + 1,
        character: position.character,
      },
    };

    // Parse import clause
    if (node.importClause) {
      importInfo.importClause = {};

      // Default import
      if (node.importClause.name) {
        importInfo.importClause.defaultImport = node.importClause.name.text;
        result.defaultImports++;
      }

      // Named bindings
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // Namespace import: import * as Name
          importInfo.importClause.namespaceImport = node.importClause.namedBindings.name.text;
          result.namespaceImports++;
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          // Named imports: import { a, b }
          importInfo.importClause.namedImports = node.importClause.namedBindings.elements.map(
            element => element.name.text
          );
          result.namedImports++;
        }
      }
    }

    // Categorize import
    if (importInfo.isTypeOnly) {
      result.typeOnlyImports++;
    }

    if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
      result.relativeImports++;
    } else {
      result.externalImports++;
    }

    result.imports.push(importInfo);
    result.totalImports++;
  }

  private sortImports(imports: ImportInfo[]): ImportInfo[] {
    // Sort order: external imports first, then relative imports
    // Within each group: type-only imports first, then regular imports
    // Within each subgroup: alphabetical by module specifier
    
    return [...imports].sort((a, b) => {
      // External vs relative
      const aIsExternal = !a.moduleSpecifier.startsWith('.') && !a.moduleSpecifier.startsWith('/');
      const bIsExternal = !b.moduleSpecifier.startsWith('.') && !b.moduleSpecifier.startsWith('/');
      
      if (aIsExternal !== bIsExternal) {
        return aIsExternal ? -1 : 1;
      }

      // Type-only vs regular
      if (a.isTypeOnly !== b.isTypeOnly) {
        return a.isTypeOnly ? -1 : 1;
      }

      // Alphabetical by module specifier
      return a.moduleSpecifier.localeCompare(b.moduleSpecifier);
    });
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    // Can parse any file with imports
    let hasImports = false;

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        hasImports = true;
      }
      if (!hasImports) {
        ts.forEachChild(node, visit);
      }
    };

    visit(sourceFile);
    return hasImports;
  }
}