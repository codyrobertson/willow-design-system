/**
 * Import transformation logic
 * Task 5.2: Implement import transformation logic
 */

import * as ts from 'typescript';
import { BaseTransformer } from '../base-transformer';
import {
  TransformContext,
  TransformError,
  TransformWarning,
  TransformChange,
} from '../index';

/**
 * Configuration for import transformer
 */
export interface ImportTransformerConfig {
  /**
   * Path mappings to transform
   * Example: { '@old/ui': '@new/ui', 'old-lib': 'new-lib' }
   */
  pathMappings: Record<string, string>;

  /**
   * Whether to update relative imports
   */
  updateRelativeImports?: boolean;

  /**
   * Whether to add missing imports
   */
  addMissingImports?: boolean;

  /**
   * Imports to add to every file
   */
  globalImports?: Array<{
    moduleSpecifier: string;
    defaultImport?: string;
    namedImports?: string[];
  }>;

  /**
   * Whether to remove unused imports
   */
  removeUnusedImports?: boolean;

  /**
   * Whether to sort imports
   */
  sortImports?: boolean;

  /**
   * Import sorting order
   */
  importOrder?: string[];
}

/**
 * Result data for import transformation
 */
export interface ImportTransformResult {
  /**
   * Number of imports transformed
   */
  importsTransformed: number;

  /**
   * Number of imports added
   */
  importsAdded: number;

  /**
   * Number of imports removed
   */
  importsRemoved: number;

  /**
   * Import paths that were changed
   */
  pathChanges: Array<{
    from: string;
    to: string;
    line: number;
  }>;
}

/**
 * Transformer for import statements
 */
export class ImportTransformer extends BaseTransformer<
  ImportTransformerConfig,
  ImportTransformResult
> {
  readonly name = 'import-transformer';
  readonly description = 'Transforms import statements including paths, adding/removing imports, and sorting';
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
    data?: ImportTransformResult;
    nodesProcessed?: number;
  }> {
    const result: ImportTransformResult = {
      importsTransformed: 0,
      importsAdded: 0,
      importsRemoved: 0,
      pathChanges: [],
    };

    let nodesProcessed = 0;

    // Create transformer factory
    const transformerFactory: ts.TransformerFactory<ts.Node> = (context) => {
      return (rootNode) => {
        const visit = (node: ts.Node): ts.Node => {
          nodesProcessed++;

          // Handle import declarations
          if (ts.isImportDeclaration(node)) {
            return this.transformImportDeclaration(
              node,
              sourceFile,
              collectors,
              result
            );
          }

          // Handle dynamic imports
          if (ts.isCallExpression(node) && this.isDynamicImport(node)) {
            return this.transformDynamicImport(
              node,
              sourceFile,
              collectors,
              result
            );
          }

          return ts.visitEachChild(node, visit, context);
        };

        return ts.visitNode(rootNode, visit);
      };
    };

    // Transform the source file
    const transformationResult = ts.transform(sourceFile, [transformerFactory]);
    let transformedFile = transformationResult.transformed[0] as ts.SourceFile;

    // Clean up
    transformationResult.dispose();

    // Add global imports if configured
    if (this.config?.globalImports) {
      transformedFile = this.addGlobalImports(
        transformedFile,
        collectors,
        result
      );
    }

    // Remove unused imports if configured
    if (this.config?.removeUnusedImports) {
      transformedFile = this.removeUnusedImports(
        transformedFile,
        context,
        collectors,
        result
      );
    }

    // Sort imports if configured
    if (this.config?.sortImports) {
      transformedFile = this.sortImports(
        transformedFile,
        collectors,
        result
      );
    }

    return {
      transformedFile,
      data: result,
      nodesProcessed,
    };
  }

  /**
   * Transform an import declaration
   */
  private transformImportDeclaration(
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportTransformResult
  ): ts.ImportDeclaration {
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      return node;
    }

    const oldPath = node.moduleSpecifier.text;
    const newPath = this.transformPath(oldPath);

    if (oldPath !== newPath) {
      result.importsTransformed++;
      result.pathChanges.push({
        from: oldPath,
        to: newPath,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      });

      collectors.changes.push(
        this.createChange(
          'modify',
          `Changed import from "${oldPath}" to "${newPath}"`,
          sourceFile.fileName,
          node,
          oldPath,
          newPath
        )
      );

      return ts.factory.updateImportDeclaration(
        node,
        node.modifiers,
        node.importClause,
        ts.factory.createStringLiteral(newPath),
        node.assertClause
      );
    }

    return node;
  }

  /**
   * Transform a dynamic import
   */
  private transformDynamicImport(
    node: ts.CallExpression,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportTransformResult
  ): ts.CallExpression {
    const importArg = node.arguments[0];
    
    if (!ts.isStringLiteral(importArg)) {
      // Can't transform non-literal dynamic imports
      collectors.warnings.push(
        this.createWarning(
          'DYNAMIC_IMPORT_NON_LITERAL',
          'Cannot transform non-literal dynamic import',
          node
        )
      );
      return node;
    }

    const oldPath = importArg.text;
    const newPath = this.transformPath(oldPath);

    if (oldPath !== newPath) {
      result.importsTransformed++;
      result.pathChanges.push({
        from: oldPath,
        to: newPath,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      });

      collectors.changes.push(
        this.createChange(
          'modify',
          `Changed dynamic import from "${oldPath}" to "${newPath}"`,
          sourceFile.fileName,
          node,
          oldPath,
          newPath
        )
      );

      return ts.factory.updateCallExpression(
        node,
        node.expression,
        node.typeArguments,
        [ts.factory.createStringLiteral(newPath), ...node.arguments.slice(1)]
      );
    }

    return node;
  }

  /**
   * Check if a call expression is a dynamic import
   */
  private isDynamicImport(node: ts.CallExpression): boolean {
    return (
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length >= 1
    );
  }

  /**
   * Transform an import path
   */
  private transformPath(path: string): string {
    if (!this.config?.pathMappings) {
      return path;
    }

    // Check exact matches first
    if (this.config.pathMappings[path]) {
      return this.config.pathMappings[path];
    }

    // Check prefix matches
    for (const [pattern, replacement] of Object.entries(this.config.pathMappings)) {
      if (path.startsWith(pattern)) {
        return path.replace(pattern, replacement);
      }
    }

    // Handle relative imports if configured
    if (this.config.updateRelativeImports && path.startsWith('.')) {
      // This would need more context about file moves
      // For now, just return the original path
      return path;
    }

    return path;
  }

  /**
   * Add global imports to a file
   */
  private addGlobalImports(
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportTransformResult
  ): ts.SourceFile {
    if (!this.config?.globalImports || this.config.globalImports.length === 0) {
      return sourceFile;
    }

    const existingImports = this.collectExistingImports(sourceFile);
    const newImports: ts.ImportDeclaration[] = [];

    for (const globalImport of this.config.globalImports) {
      // Check if import already exists
      if (existingImports.has(globalImport.moduleSpecifier)) {
        continue;
      }

      // Create import clause
      let importClause: ts.ImportClause | undefined;

      if (globalImport.defaultImport || globalImport.namedImports) {
        const defaultImport = globalImport.defaultImport
          ? ts.factory.createIdentifier(globalImport.defaultImport)
          : undefined;

        const namedImports = globalImport.namedImports
          ? ts.factory.createNamedImports(
              globalImport.namedImports.map((name) =>
                ts.factory.createImportSpecifier(
                  false,
                  undefined,
                  ts.factory.createIdentifier(name)
                )
              )
            )
          : undefined;

        importClause = ts.factory.createImportClause(
          false,
          defaultImport,
          namedImports
        );
      }

      const importDecl = ts.factory.createImportDeclaration(
        undefined,
        importClause,
        ts.factory.createStringLiteral(globalImport.moduleSpecifier)
      );

      newImports.push(importDecl);
      result.importsAdded++;

      collectors.changes.push({
        type: 'add',
        description: `Added global import: ${globalImport.moduleSpecifier}`,
        file: sourceFile.fileName,
      });
    }

    if (newImports.length === 0) {
      return sourceFile;
    }

    // Add new imports at the beginning of the file
    const statements = [...newImports, ...sourceFile.statements];
    
    return ts.factory.updateSourceFile(
      sourceFile,
      statements,
      sourceFile.isDeclarationFile,
      sourceFile.referencedFiles,
      sourceFile.typeReferenceDirectives,
      sourceFile.hasNoDefaultLib,
      sourceFile.libReferenceDirectives
    );
  }

  /**
   * Remove unused imports from a file
   */
  private removeUnusedImports(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportTransformResult
  ): ts.SourceFile {
    // This requires semantic analysis with the type checker
    // For now, we'll just detect obviously unused imports (no import clause)
    
    const statements = sourceFile.statements.filter((statement) => {
      if (ts.isImportDeclaration(statement)) {
        // Keep side-effect imports (no import clause)
        if (!statement.importClause) {
          return true;
        }

        // For a full implementation, we'd use the type checker to find references
        // For now, we'll keep all imports with import clauses
        return true;
      }
      return true;
    });

    const removedCount = sourceFile.statements.length - statements.length;
    if (removedCount > 0) {
      result.importsRemoved += removedCount;
      collectors.changes.push({
        type: 'remove',
        description: `Removed ${removedCount} unused imports`,
        file: sourceFile.fileName,
      });

      return ts.factory.updateSourceFile(
        sourceFile,
        statements,
        sourceFile.isDeclarationFile,
        sourceFile.referencedFiles,
        sourceFile.typeReferenceDirectives,
        sourceFile.hasNoDefaultLib,
        sourceFile.libReferenceDirectives
      );
    }

    return sourceFile;
  }

  /**
   * Sort imports in a file
   */
  private sortImports(
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportTransformResult
  ): ts.SourceFile {
    const imports: ts.ImportDeclaration[] = [];
    const otherStatements: ts.Statement[] = [];

    // Separate imports from other statements
    for (const statement of sourceFile.statements) {
      if (ts.isImportDeclaration(statement)) {
        imports.push(statement);
      } else {
        otherStatements.push(statement);
      }
    }

    if (imports.length <= 1) {
      return sourceFile;
    }

    // Sort imports
    const sortedImports = this.sortImportDeclarations(imports);

    // Check if order changed
    const orderChanged = imports.some((imp, index) => imp !== sortedImports[index]);

    if (orderChanged) {
      collectors.changes.push({
        type: 'modify',
        description: 'Sorted import statements',
        file: sourceFile.fileName,
      });

      const statements = [...sortedImports, ...otherStatements];
      
      return ts.factory.updateSourceFile(
        sourceFile,
        statements,
        sourceFile.isDeclarationFile,
        sourceFile.referencedFiles,
        sourceFile.typeReferenceDirectives,
        sourceFile.hasNoDefaultLib,
        sourceFile.libReferenceDirectives
      );
    }

    return sourceFile;
  }

  /**
   * Sort import declarations
   */
  private sortImportDeclarations(
    imports: ts.ImportDeclaration[]
  ): ts.ImportDeclaration[] {
    const importOrder = this.config?.importOrder || [
      'react',
      '@',
      '~',
      '.',
      '..',
    ];

    return [...imports].sort((a, b) => {
      const aPath = (a.moduleSpecifier as ts.StringLiteral).text;
      const bPath = (b.moduleSpecifier as ts.StringLiteral).text;

      // Get order indices
      const aIndex = this.getImportOrderIndex(aPath, importOrder);
      const bIndex = this.getImportOrderIndex(bPath, importOrder);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // Same category, sort alphabetically
      return aPath.localeCompare(bPath);
    });
  }

  /**
   * Get import order index
   */
  private getImportOrderIndex(path: string, order: string[]): number {
    for (let i = 0; i < order.length; i++) {
      const pattern = order[i];
      if (path === pattern || path.startsWith(pattern)) {
        return i;
      }
    }
    // Default order for unmatched imports
    return order.length;
  }

  /**
   * Collect existing imports
   */
  private collectExistingImports(sourceFile: ts.SourceFile): Set<string> {
    const imports = new Set<string>();

    for (const statement of sourceFile.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        imports.add(statement.moduleSpecifier.text);
      }
    }

    return imports;
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    // Can transform any TypeScript/JavaScript file
    return true;
  }
}