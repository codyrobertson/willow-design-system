/**
 * Basic Import Transformer
 * Transforms import statements and paths
 */

import * as ts from 'typescript';
import { BaseTransformer } from '../../base-transformer';
import {
  TransformContext,
  TransformError,
  TransformWarning,
  TransformChange,
} from '../../index';

export interface ImportTransformerConfig {
  pathMappings: Record<string, string>;
  sortImports?: boolean;
  removeUnusedImports?: boolean;
}

export interface ImportTransformResult {
  importsTransformed: number;
  importsAdded: number;
  importsRemoved: number;
  pathChanges: Array<{
    from: string;
    to: string;
    line: number;
  }>;
}

export class ImportTransformer extends BaseTransformer<
  ImportTransformerConfig,
  ImportTransformResult
> {
  readonly name = 'import-transformer';
  readonly description = 'Transforms import statements including paths and sorting';
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

    const transformer: ts.TransformerFactory<ts.Node> = (context) => {
      return (rootNode) => {
        const visit = (node: ts.Node): ts.Node => {
          nodesProcessed++;

          if (ts.isImportDeclaration(node)) {
            return this.transformImportDeclaration(node, sourceFile, collectors, result);
          }

          return ts.visitEachChild(node, visit, context);
        };

        return ts.visitNode(rootNode, visit);
      };
    };

    const transformationResult = ts.transform(sourceFile, [transformer]);
    const transformedFile = transformationResult.transformed[0] as ts.SourceFile;
    transformationResult.dispose();

    return {
      transformedFile,
      data: result,
      nodesProcessed,
    };
  }

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

    return path;
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    return true; // Can transform any TypeScript/JavaScript file
  }
}