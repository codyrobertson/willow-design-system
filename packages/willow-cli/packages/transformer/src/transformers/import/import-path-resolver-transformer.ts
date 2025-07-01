/**
 * Import Path Resolver Transformer
 * Resolves and transforms import paths with advanced mapping
 */

import * as ts from 'typescript';
import * as path from 'path';
import { BaseTransformer } from '../../base-transformer';
import {
  TransformContext,
  TransformError,
  TransformWarning,
  TransformChange,
} from '../../index';

export interface ImportPathResolverConfig {
  /** Base URL for absolute imports */
  baseUrl?: string;
  /** Path mappings (like tsconfig paths) */
  pathMappings?: Record<string, string[]>;
  /** Extensions to add/remove */
  extensionHandling?: {
    add?: string[];
    remove?: string[];
    replace?: Record<string, string>;
  };
  /** Convert relative to absolute paths */
  convertRelativeToAbsolute?: boolean;
  /** Convert absolute to relative paths */
  convertAbsoluteToRelative?: boolean;
  /** Normalize path separators */
  normalizePaths?: boolean;
  /** Resolve symlinks */
  resolveSymlinks?: boolean;
}

export interface PathResolution {
  originalPath: string;
  resolvedPath: string;
  resolutionType: 'mapping' | 'relative-to-absolute' | 'absolute-to-relative' | 'extension' | 'normalization';
  line: number;
}

export interface ImportPathResolverResult {
  pathsResolved: number;
  resolutions: PathResolution[];
  errors: Array<{
    path: string;
    error: string;
    line: number;
  }>;
}

export class ImportPathResolverTransformer extends BaseTransformer<
  ImportPathResolverConfig,
  ImportPathResolverResult
> {
  readonly name = 'import-path-resolver-transformer';
  readonly description = 'Resolves and transforms import paths with advanced mapping capabilities';
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
    data?: ImportPathResolverResult;
    nodesProcessed?: number;
  }> {
    const result: ImportPathResolverResult = {
      pathsResolved: 0,
      resolutions: [],
      errors: [],
    };

    let nodesProcessed = 0;

    const transformer: ts.TransformerFactory<ts.Node> = (context) => {
      return (rootNode) => {
        const visit = (node: ts.Node): ts.Node => {
          nodesProcessed++;

          if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            return this.transformImportOrExportDeclaration(node, sourceFile, collectors, result);
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

  private transformImportOrExportDeclaration(
    node: ts.ImportDeclaration | ts.ExportDeclaration,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportPathResolverResult
  ): ts.ImportDeclaration | ts.ExportDeclaration {
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
      return node;
    }

    const originalPath = node.moduleSpecifier.text;
    const resolvedPath = this.resolvePath(originalPath, sourceFile.fileName);

    if (originalPath !== resolvedPath) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      
      result.pathsResolved++;
      result.resolutions.push({
        originalPath,
        resolvedPath,
        resolutionType: this.getResolutionType(originalPath, resolvedPath),
        line,
      });

      collectors.changes.push(
        this.createChange(
          'modify',
          `Resolved import path from "${originalPath}" to "${resolvedPath}"`,
          sourceFile.fileName,
          node,
          originalPath,
          resolvedPath
        )
      );

      const newModuleSpecifier = ts.factory.createStringLiteral(resolvedPath);

      if (ts.isImportDeclaration(node)) {
        return ts.factory.updateImportDeclaration(
          node,
          node.modifiers,
          node.importClause,
          newModuleSpecifier,
          node.assertClause
        );
      } else {
        return ts.factory.updateExportDeclaration(
          node,
          node.modifiers,
          node.isTypeOnly,
          node.exportClause,
          newModuleSpecifier,
          node.assertClause
        );
      }
    }

    return node;
  }

  private resolvePath(importPath: string, currentFilePath: string): string {
    let resolvedPath = importPath;

    // Apply path mappings
    resolvedPath = this.applyPathMappings(resolvedPath);

    // Handle extension transformations
    resolvedPath = this.handleExtensions(resolvedPath);

    // Convert between relative and absolute
    resolvedPath = this.convertPathType(resolvedPath, currentFilePath);

    // Normalize paths
    if (this.config?.normalizePaths) {
      resolvedPath = this.normalizePath(resolvedPath);
    }

    return resolvedPath;
  }

  private applyPathMappings(importPath: string): string {
    if (!this.config?.pathMappings) {
      return importPath;
    }

    for (const [pattern, mappings] of Object.entries(this.config.pathMappings)) {
      // Handle wildcard patterns
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2);
        if (importPath.startsWith(prefix + '/')) {
          const suffix = importPath.slice(prefix.length + 1);
          const mapping = mappings[0]; // Use first mapping
          if (mapping.endsWith('/*')) {
            return mapping.slice(0, -2) + '/' + suffix;
          }
        }
      } else if (importPath === pattern) {
        return mappings[0]; // Use first mapping for exact matches
      }
    }

    return importPath;
  }

  private handleExtensions(importPath: string): string {
    const config = this.config?.extensionHandling;
    if (!config) {
      return importPath;
    }

    let result = importPath;

    // Remove extensions
    if (config.remove) {
      for (const ext of config.remove) {
        if (result.endsWith(ext)) {
          result = result.slice(0, -ext.length);
          break;
        }
      }
    }

    // Replace extensions
    if (config.replace) {
      for (const [from, to] of Object.entries(config.replace)) {
        if (result.endsWith(from)) {
          result = result.slice(0, -from.length) + to;
          break;
        }
      }
    }

    // Add extensions
    if (config.add) {
      const hasExtension = config.add.some(ext => result.endsWith(ext));
      if (!hasExtension) {
        result += config.add[0]; // Add first extension
      }
    }

    return result;
  }

  private convertPathType(importPath: string, currentFilePath: string): string {
    // Skip external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return importPath;
    }

    if (this.config?.convertRelativeToAbsolute && importPath.startsWith('.')) {
      return this.convertToAbsolute(importPath, currentFilePath);
    }

    if (this.config?.convertAbsoluteToRelative && importPath.startsWith('/')) {
      return this.convertToRelative(importPath, currentFilePath);
    }

    return importPath;
  }

  private convertToAbsolute(relativePath: string, currentFilePath: string): string {
    const currentDir = path.dirname(currentFilePath);
    const absolutePath = path.resolve(currentDir, relativePath);
    
    if (this.config?.baseUrl) {
      return path.relative(this.config.baseUrl, absolutePath);
    }
    
    return absolutePath;
  }

  private convertToRelative(absolutePath: string, currentFilePath: string): string {
    const currentDir = path.dirname(currentFilePath);
    let relativePath = path.relative(currentDir, absolutePath);
    
    // Ensure relative paths start with ./ or ../
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    return relativePath;
  }

  private normalizePath(importPath: string): string {
    // Normalize path separators to forward slashes
    return importPath.replace(/\\/g, '/');
  }

  private getResolutionType(originalPath: string, resolvedPath: string): PathResolution['resolutionType'] {
    if (this.config?.pathMappings && this.applyPathMappings(originalPath) !== originalPath) {
      return 'mapping';
    }
    
    if (originalPath.startsWith('.') && !resolvedPath.startsWith('.')) {
      return 'relative-to-absolute';
    }
    
    if (!originalPath.startsWith('.') && resolvedPath.startsWith('.')) {
      return 'absolute-to-relative';
    }
    
    if (this.hasExtensionChange(originalPath, resolvedPath)) {
      return 'extension';
    }
    
    return 'normalization';
  }

  private hasExtensionChange(originalPath: string, resolvedPath: string): boolean {
    const originalExt = path.extname(originalPath);
    const resolvedExt = path.extname(resolvedPath);
    return originalExt !== resolvedExt;
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    // Can transform any file with imports or exports
    let hasImportOrExport = false;

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        hasImportOrExport = true;
      }
      if (!hasImportOrExport) {
        ts.forEachChild(node, visit);
      }
    };

    visit(sourceFile);
    return hasImportOrExport;
  }
}