/**
 * Comprehensive Namespace Alias Transformer
 * Handles namespace imports, aliases, and full AST transformation with usage replacement
 */

import * as ts from 'typescript';
import { BaseTransformer } from '../../base-transformer';
import {
  TransformContext,
  TransformError,
  TransformWarning,
  TransformChange,
} from '../../index';

export interface NamespaceAliasConfig {
  /** Namespace name mappings: oldName -> newName */
  namespaceMapping?: Record<string, string>;
  
  /** Import alias mappings: oldAlias -> newAlias */
  aliasMapping?: Record<string, string>;
  
  /** Convert star imports to named imports */
  convertStarImports?: boolean;
  
  /** Star import conversions: module -> named imports */
  starImportConversions?: Record<string, string[]>;
  
  /** Re-export path mappings: oldPath -> newPath */
  reExportMapping?: Record<string, string>;
  
  /** Convert namespace imports to default imports */
  convertNamespaceImports?: boolean;
  
  /** Preserve type-only imports */
  preserveTypeOnly?: boolean;
}

export interface NamespaceAliasResult {
  namespacesTransformed: number;
  aliasesTransformed: number;
  starImportsConverted: number;
  reExportsTransformed: number;
  transformations: Array<{
    type: 'namespace' | 'alias' | 'star-import' | 're-export';
    from: string;
    to: string;
    line: number;
  }>;
}

interface SymbolInfo {
  /** Original name in import */
  originalName: string;
  
  /** New name after transformation */
  newName: string;
  
  /** Type of symbol */
  type: 'namespace' | 'default' | 'named' | 'alias';
  
  /** Import declaration node */
  importNode: ts.ImportDeclaration;
  
  /** All usage locations */
  usages: ts.Node[];
}

export class NamespaceAliasTransformer extends BaseTransformer<
  NamespaceAliasConfig,
  NamespaceAliasResult
> {
  readonly name = 'namespace-alias-transformer';
  readonly description = 'Transforms namespace imports and aliases with full AST transformation';
  readonly version = '1.0.0';

  /** Symbol table to track all imported identifiers and their usages */
  private symbolTable = new Map<string, SymbolInfo>();

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
    data?: NamespaceAliasResult;
    nodesProcessed?: number;
  }> {
    const result: NamespaceAliasResult = {
      namespacesTransformed: 0,
      aliasesTransformed: 0,
      starImportsConverted: 0,
      reExportsTransformed: 0,
      transformations: [],
    };

    // Step 1: Build symbol table to track imported namespace identifiers
    this.buildSymbolTable(sourceFile);

    // Step 2: Create transformer that handles both imports and usage
    const transformer: ts.TransformerFactory<ts.Node> = (context) => {
      return (rootNode) => {
        const visit = (node: ts.Node): ts.Node => {
          // Handle import declarations
          if (ts.isImportDeclaration(node)) {
            return this.transformImportDeclaration(node, sourceFile, collectors, result);
          }
          
          // Handle export declarations (re-exports)
          if (ts.isExportDeclaration(node)) {
            return this.transformExportDeclaration(node, sourceFile, collectors, result);
          }

          // Step 2: Traverse AST to find all namespace usage (PropertyAccessExpression)
          if (ts.isPropertyAccessExpression(node)) {
            return this.transformPropertyAccess(node, sourceFile, collectors, result);
          }

          // Handle type references
          if (ts.isTypeReferenceNode(node)) {
            return this.transformTypeReference(node, sourceFile, collectors, result);
          }

          // Handle qualified names in types
          if (ts.isQualifiedName(node)) {
            return this.transformQualifiedName(node, sourceFile, collectors, result);
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
      nodesProcessed: this.symbolTable.size,
    };
  }

  /**
   * Step 1: Build symbol table to track imported namespace identifiers
   */
  private buildSymbolTable(sourceFile: ts.SourceFile): void {
    this.symbolTable.clear();

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && node.importClause) {
        this.processImportForSymbolTable(node);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Second pass: find all usages of imported symbols
    this.findSymbolUsages(sourceFile);
  }

  /**
   * Process import declaration for symbol table
   */
  private processImportForSymbolTable(importNode: ts.ImportDeclaration): void {
    const importClause = importNode.importClause!;

    // Handle default imports
    if (importClause.name) {
      const originalName = importClause.name.text;
      this.symbolTable.set(originalName, {
        originalName,
        newName: originalName, // Will be updated if transformation applies
        type: 'default',
        importNode,
        usages: [],
      });
    }

    // Handle named bindings
    if (importClause.namedBindings) {
      if (ts.isNamespaceImport(importClause.namedBindings)) {
        // Namespace import: import * as Name
        const originalName = importClause.namedBindings.name.text;
        const newName = this.config?.namespaceMapping?.[originalName] || originalName;
        
        this.symbolTable.set(originalName, {
          originalName,
          newName,
          type: 'namespace',
          importNode,
          usages: [],
        });
      } else if (ts.isNamedImports(importClause.namedBindings)) {
        // Named imports: import { a, b as c }
        for (const element of importClause.namedBindings.elements) {
          const originalName = element.name.text;
          const aliasName = element.propertyName?.text || originalName;
          const newName = this.config?.aliasMapping?.[originalName] || originalName;
          
          this.symbolTable.set(originalName, {
            originalName,
            newName,
            type: element.propertyName ? 'alias' : 'named',
            importNode,
            usages: [],
          });
        }
      }
    }
  }

  /**
   * Find all usages of imported symbols in the source file
   */
  private findSymbolUsages(sourceFile: ts.SourceFile): void {
    const visit = (node: ts.Node) => {
      // Property access expressions: namespace.property
      if (ts.isPropertyAccessExpression(node)) {
        if (ts.isIdentifier(node.expression)) {
          const symbolName = node.expression.text;
          const symbol = this.symbolTable.get(symbolName);
          if (symbol) {
            symbol.usages.push(node);
          }
        }
      }

      // Type references: namespace.Type
      if (ts.isTypeReferenceNode(node) && ts.isQualifiedName(node.typeName)) {
        const symbolName = this.getQualifiedNameRoot(node.typeName);
        const symbol = this.symbolTable.get(symbolName);
        if (symbol) {
          symbol.usages.push(node);
        }
      }

      // Qualified names in types: namespace.SubNamespace.Type
      if (ts.isQualifiedName(node)) {
        const symbolName = this.getQualifiedNameRoot(node);
        const symbol = this.symbolTable.get(symbolName);
        if (symbol) {
          symbol.usages.push(node);
        }
      }

      // Direct identifier usage
      if (ts.isIdentifier(node)) {
        const symbol = this.symbolTable.get(node.text);
        if (symbol && symbol.type !== 'namespace') {
          symbol.usages.push(node);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * Get the root identifier from a qualified name
   */
  private getQualifiedNameRoot(qualifiedName: ts.QualifiedName): string {
    let current: ts.EntityName = qualifiedName;
    while (ts.isQualifiedName(current)) {
      current = current.left;
    }
    return (current as ts.Identifier).text;
  }

  /**
   * Transform import declaration
   */
  private transformImportDeclaration(
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: NamespaceAliasResult
  ): ts.ImportDeclaration {
    if (!node.importClause) return node;

    let changed = false;
    let importClause = node.importClause;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    // Handle namespace imports
    if (importClause.namedBindings && ts.isNamespaceImport(importClause.namedBindings)) {
      const namespaceName = importClause.namedBindings.name.text;
      const newNamespace = this.config?.namespaceMapping?.[namespaceName];
      
      if (newNamespace) {
        importClause = ts.factory.updateImportClause(
          importClause,
          importClause.isTypeOnly,
          importClause.name,
          ts.factory.createNamespaceImport(ts.factory.createIdentifier(newNamespace))
        );
        changed = true;
        result.namespacesTransformed++;
        result.transformations.push({
          type: 'namespace',
          from: namespaceName,
          to: newNamespace,
          line,
        });
        
        collectors.changes.push(
          this.createChange(
            'modify',
            `Changed namespace import from "${namespaceName}" to "${newNamespace}"`,
            sourceFile.fileName,
            node
          )
        );
      }

      // Handle star import conversion
      if (this.config?.convertStarImports) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        const namedImports = this.config.starImportConversions?.[moduleSpecifier];
        
        if (namedImports && namedImports.length > 0) {
          const importSpecifiers = namedImports.map(name =>
            ts.factory.createImportSpecifier(
              false,
              undefined,
              ts.factory.createIdentifier(name)
            )
          );
          
          importClause = ts.factory.updateImportClause(
            importClause,
            importClause.isTypeOnly,
            importClause.name,
            ts.factory.createNamedImports(importSpecifiers)
          );
          changed = true;
          result.starImportsConverted++;
          result.transformations.push({
            type: 'star-import',
            from: `* as ${namespaceName}`,
            to: `{ ${namedImports.join(', ')} }`,
            line,
          });
        }
      }

      // Convert namespace to default import (React specific)
      if (this.config?.convertNamespaceImports) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        
        if (moduleSpecifier === 'react' && namespaceName === 'React') {
          importClause = ts.factory.updateImportClause(
            importClause,
            importClause.isTypeOnly,
            ts.factory.createIdentifier('React'),
            undefined
          );
          changed = true;
          result.starImportsConverted++;
          result.transformations.push({
            type: 'star-import',
            from: `* as ${namespaceName}`,
            to: 'React',
            line,
          });
        }
      }
    }

    // Handle named imports with aliases
    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      const elements = importClause.namedBindings.elements;
      const newElements: ts.ImportSpecifier[] = [];
      
      for (const element of elements) {
        const aliasName = element.name.text;
        const newAlias = this.config?.aliasMapping?.[aliasName];
        
        if (newAlias) {
          const newElement = ts.factory.updateImportSpecifier(
            element,
            element.isTypeOnly,
            element.propertyName,
            ts.factory.createIdentifier(newAlias)
          );
          newElements.push(newElement);
          changed = true;
          result.aliasesTransformed++;
          result.transformations.push({
            type: 'alias',
            from: aliasName,
            to: newAlias,
            line,
          });
        } else {
          newElements.push(element);
        }
      }
      
      if (changed) {
        importClause = ts.factory.updateImportClause(
          importClause,
          importClause.isTypeOnly,
          importClause.name,
          ts.factory.createNamedImports(newElements)
        );
      }
    }

    if (changed) {
      return ts.factory.updateImportDeclaration(
        node,
        node.modifiers,
        importClause,
        node.moduleSpecifier,
        node.assertClause
      );
    }

    return node;
  }

  /**
   * Transform export declaration (re-exports)
   */
  private transformExportDeclaration(
    node: ts.ExportDeclaration,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: NamespaceAliasResult
  ): ts.ExportDeclaration {
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
      return node;
    }

    const originalPath = node.moduleSpecifier.text;
    const newPath = this.config?.reExportMapping?.[originalPath];
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    if (newPath) {
      result.reExportsTransformed++;
      result.transformations.push({
        type: 're-export',
        from: originalPath,
        to: newPath,
        line,
      });

      collectors.changes.push(
        this.createChange(
          'modify',
          `Changed re-export path from "${originalPath}" to "${newPath}"`,
          sourceFile.fileName,
          node
        )
      );

      return ts.factory.updateExportDeclaration(
        node,
        node.modifiers,
        node.isTypeOnly,
        node.exportClause,
        ts.factory.createStringLiteral(newPath),
        node.assertClause
      );
    }

    return node;
  }

  /**
   * Step 3: Replace namespace references throughout file with new names
   */
  private transformPropertyAccess(
    node: ts.PropertyAccessExpression,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: NamespaceAliasResult
  ): ts.PropertyAccessExpression {
    if (ts.isIdentifier(node.expression)) {
      const symbolName = node.expression.text;
      const symbol = this.symbolTable.get(symbolName);
      
      if (symbol && symbol.originalName !== symbol.newName) {
        // Update the namespace reference
        return ts.factory.updatePropertyAccessExpression(
          node,
          ts.factory.createIdentifier(symbol.newName),
          node.name
        );
      }
    }

    return node;
  }

  /**
   * Step 5: Update type references and namespace in type annotations
   */
  private transformTypeReference(
    node: ts.TypeReferenceNode,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: NamespaceAliasResult
  ): ts.TypeReferenceNode {
    if (ts.isQualifiedName(node.typeName)) {
      const transformedTypeName = this.transformQualifiedName(node.typeName, sourceFile, collectors, result);
      if (transformedTypeName !== node.typeName) {
        return ts.factory.updateTypeReferenceNode(
          node,
          transformedTypeName as ts.EntityName,
          node.typeArguments
        );
      }
    } else if (ts.isIdentifier(node.typeName)) {
      const symbol = this.symbolTable.get(node.typeName.text);
      if (symbol && symbol.originalName !== symbol.newName) {
        return ts.factory.updateTypeReferenceNode(
          node,
          ts.factory.createIdentifier(symbol.newName),
          node.typeArguments
        );
      }
    }

    return node;
  }

  /**
   * Transform qualified names (namespace.Type)
   */
  private transformQualifiedName(
    node: ts.QualifiedName,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: NamespaceAliasResult
  ): ts.QualifiedName {
    const rootName = this.getQualifiedNameRoot(node);
    const symbol = this.symbolTable.get(rootName);
    
    if (symbol && symbol.originalName !== symbol.newName) {
      // Recursively update the qualified name
      return this.updateQualifiedNameRoot(node, symbol.newName);
    }

    return node;
  }

  /**
   * Update the root of a qualified name
   */
  private updateQualifiedNameRoot(qualifiedName: ts.QualifiedName, newRoot: string): ts.QualifiedName {
    if (ts.isIdentifier(qualifiedName.left)) {
      // Base case: left is the root identifier
      return ts.factory.updateQualifiedName(
        qualifiedName,
        ts.factory.createIdentifier(newRoot),
        qualifiedName.right
      );
    } else {
      // Recursive case: left is another qualified name
      return ts.factory.updateQualifiedName(
        qualifiedName,
        this.updateQualifiedNameRoot(qualifiedName.left, newRoot),
        qualifiedName.right
      );
    }
  }

  /**
   * Check if the transformer can handle this file
   */
  canTransform(sourceFile: ts.SourceFile): boolean {
    // Can transform files with imports or exports
    let hasImportsOrExports = false;

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        hasImportsOrExports = true;
      }
      if (!hasImportsOrExports) {
        ts.forEachChild(node, visit);
      }
    };

    visit(sourceFile);
    return hasImportsOrExports;
  }
}