/**
 * Import Transformation Engine Transformer
 * Advanced import transformation engine with complex logic
 */

import * as ts from 'typescript';
import { BaseTransformer } from '../../base-transformer';
import {
  TransformContext,
  TransformError,
  TransformWarning,
  TransformChange,
} from '../../index';

export interface ImportTransformationRule {
  /** Rule identifier */
  id: string;
  /** Rule description */
  description: string;
  /** Condition to match imports */
  condition: {
    modulePattern?: RegExp;
    importType?: 'default' | 'named' | 'namespace' | 'side-effect';
    isTypeOnly?: boolean;
    namedImports?: string[];
  };
  /** Transformation to apply */
  transformation: {
    newModulePath?: string;
    renameImports?: Record<string, string>;
    convertToDefault?: boolean;
    convertToNamed?: boolean;
    convertToNamespace?: string;
    addImports?: Array<{
      module: string;
      imports: string[];
      isTypeOnly?: boolean;
    }>;
    removeImports?: string[];
  };
  /** Rule priority (higher = applied first) */
  priority?: number;
}

export interface ImportTransformationEngineConfig {
  /** Transformation rules to apply */
  rules: ImportTransformationRule[];
  /** Whether to apply rules in priority order */
  priorityOrder?: boolean;
  /** Stop on first matching rule */
  stopOnFirstMatch?: boolean;
  /** Validate transformations */
  validateTransformations?: boolean;
}

export interface RuleApplication {
  ruleId: string;
  originalImport: string;
  transformedImport: string;
  line: number;
  changes: string[];
}

export interface ImportTransformationEngineResult {
  rulesApplied: number;
  importsTransformed: number;
  importsAdded: number;
  importsRemoved: number;
  applications: RuleApplication[];
  addedImports: Array<{
    module: string;
    imports: string[];
    line: number;
  }>;
}

export class ImportTransformationEngineTransformer extends BaseTransformer<
  ImportTransformationEngineConfig,
  ImportTransformationEngineResult
> {
  readonly name = 'import-transformation-engine-transformer';
  readonly description = 'Advanced import transformation engine with rule-based transformations';
  readonly version = '1.0.0';

  private importAdditions: Array<{
    module: string;
    imports: string[];
    isTypeOnly: boolean;
  }> = [];

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
    data?: ImportTransformationEngineResult;
    nodesProcessed?: number;
  }> {
    const result: ImportTransformationEngineResult = {
      rulesApplied: 0,
      importsTransformed: 0,
      importsAdded: 0,
      importsRemoved: 0,
      applications: [],
      addedImports: [],
    };

    this.importAdditions = [];
    let nodesProcessed = 0;

    // Sort rules by priority if enabled
    const sortedRules = this.config?.priorityOrder
      ? [...(this.config.rules || [])].sort((a, b) => (b.priority || 0) - (a.priority || 0))
      : this.config?.rules || [];

    const transformer: ts.TransformerFactory<ts.Node> = (context) => {
      return (rootNode) => {
        const visit = (node: ts.Node): ts.Node => {
          nodesProcessed++;

          if (ts.isImportDeclaration(node)) {
            return this.transformImportDeclaration(node, sourceFile, sortedRules, collectors, result);
          }

          return ts.visitEachChild(node, visit, context);
        };

        const visitedNode = ts.visitNode(rootNode, visit);

        // Add new imports at the top
        if (this.importAdditions.length > 0) {
          return this.addImportsToFile(visitedNode as ts.SourceFile, result);
        }

        return visitedNode;
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
    rules: ImportTransformationRule[],
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportTransformationEngineResult
  ): ts.ImportDeclaration | ts.EmptyStatement {
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      return node;
    }

    const originalModule = node.moduleSpecifier.text;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    for (const rule of rules) {
      if (this.matchesRule(node, rule)) {
        const application: RuleApplication = {
          ruleId: rule.id,
          originalImport: originalModule,
          transformedImport: '',
          line,
          changes: [],
        };

        const transformedNode = this.applyRule(node, rule, sourceFile, collectors, result, application);
        
        if (transformedNode !== node) {
          result.rulesApplied++;
          result.applications.push(application);

          if (this.config?.stopOnFirstMatch) {
            return transformedNode;
          }
        }

        // If transformation resulted in removal
        if (ts.isEmptyStatement(transformedNode)) {
          return transformedNode;
        }

        node = transformedNode as ts.ImportDeclaration;
      }
    }

    return node;
  }

  private matchesRule(node: ts.ImportDeclaration, rule: ImportTransformationRule): boolean {
    const condition = rule.condition;
    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;

    // Check module pattern
    if (condition.modulePattern && !condition.modulePattern.test(moduleSpecifier)) {
      return false;
    }

    // Check type-only
    if (condition.isTypeOnly !== undefined && (node.importClause?.isTypeOnly || false) !== condition.isTypeOnly) {
      return false;
    }

    // Check import type
    if (condition.importType) {
      const importType = this.getImportType(node);
      if (importType !== condition.importType) {
        return false;
      }
    }

    // Check named imports
    if (condition.namedImports && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      const nodeImports = node.importClause.namedBindings.elements.map(el => el.name.text);
      const hasAllRequired = condition.namedImports.every(required => nodeImports.includes(required));
      if (!hasAllRequired) {
        return false;
      }
    }

    return true;
  }

  private getImportType(node: ts.ImportDeclaration): 'default' | 'named' | 'namespace' | 'side-effect' {
    if (!node.importClause) {
      return 'side-effect';
    }

    if (node.importClause.name && !node.importClause.namedBindings) {
      return 'default';
    }

    if (node.importClause.namedBindings) {
      if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        return 'namespace';
      } else {
        return 'named';
      }
    }

    return 'side-effect';
  }

  private applyRule(
    node: ts.ImportDeclaration,
    rule: ImportTransformationRule,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: ImportTransformationEngineResult,
    application: RuleApplication
  ): ts.ImportDeclaration | ts.EmptyStatement {
    const transformation = rule.transformation;
    let transformedNode = node;
    let moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;

    // Transform module path
    if (transformation.newModulePath) {
      moduleSpecifier = transformation.newModulePath;
      transformedNode = ts.factory.updateImportDeclaration(
        transformedNode,
        transformedNode.modifiers,
        transformedNode.importClause,
        ts.factory.createStringLiteral(moduleSpecifier),
        transformedNode.assertClause
      );
      application.changes.push(`Changed module path to "${moduleSpecifier}"`);
    }

    // Handle import clause transformations
    if (transformedNode.importClause) {
      let importClause = transformedNode.importClause;

      // Convert to default import
      if (transformation.convertToDefault) {
        importClause = this.convertToDefaultImport(importClause);
        application.changes.push('Converted to default import');
      }

      // Convert to named imports
      if (transformation.convertToNamed) {
        importClause = this.convertToNamedImports(importClause);
        application.changes.push('Converted to named imports');
      }

      // Convert to namespace import
      if (transformation.convertToNamespace) {
        importClause = this.convertToNamespaceImport(importClause, transformation.convertToNamespace);
        application.changes.push(`Converted to namespace import as "${transformation.convertToNamespace}"`);
      }

      // Rename imports
      if (transformation.renameImports) {
        importClause = this.renameImports(importClause, transformation.renameImports);
        application.changes.push('Renamed imports');
      }

      transformedNode = ts.factory.updateImportDeclaration(
        transformedNode,
        transformedNode.modifiers,
        importClause,
        transformedNode.moduleSpecifier,
        transformedNode.assertClause
      );
    }

    // Handle import additions
    if (transformation.addImports) {
      for (const addition of transformation.addImports) {
        this.importAdditions.push({
          module: addition.module,
          imports: addition.imports,
          isTypeOnly: addition.isTypeOnly || false,
        });
        result.importsAdded++;
        application.changes.push(`Added imports from "${addition.module}"`);
      }
    }

    // Handle import removal
    if (transformation.removeImports) {
      // Create empty statement to remove the import
      result.importsRemoved++;
      application.changes.push('Removed import');
      
      collectors.changes.push(
        this.createChange(
          'remove',
          `Removed import: ${node.getText(sourceFile)}`,
          sourceFile.fileName,
          node
        )
      );

      return ts.factory.createEmptyStatement();
    }

    application.transformedImport = moduleSpecifier;
    
    if (transformedNode !== node) {
      result.importsTransformed++;
      
      collectors.changes.push(
        this.createChange(
          'modify',
          `Applied rule "${rule.id}": ${application.changes.join(', ')}`,
          sourceFile.fileName,
          node
        )
      );
    }

    return transformedNode;
  }

  private convertToDefaultImport(importClause: ts.ImportClause): ts.ImportClause {
    // Extract first named import as default
    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      const firstImport = importClause.namedBindings.elements[0];
      if (firstImport) {
        return ts.factory.createImportClause(
          importClause.isTypeOnly,
          ts.factory.createIdentifier(firstImport.name.text),
          undefined
        );
      }
    }
    return importClause;
  }

  private convertToNamedImports(importClause: ts.ImportClause): ts.ImportClause {
    // Convert default or namespace to named import
    const imports: ts.ImportSpecifier[] = [];

    if (importClause.name) {
      imports.push(ts.factory.createImportSpecifier(
        false,
        ts.factory.createIdentifier('default'),
        importClause.name
      ));
    }

    return ts.factory.createImportClause(
      importClause.isTypeOnly,
      undefined,
      ts.factory.createNamedImports(imports)
    );
  }

  private convertToNamespaceImport(importClause: ts.ImportClause, namespaceName: string): ts.ImportClause {
    return ts.factory.createImportClause(
      importClause.isTypeOnly,
      undefined,
      ts.factory.createNamespaceImport(ts.factory.createIdentifier(namespaceName))
    );
  }

  private renameImports(importClause: ts.ImportClause, renameMappings: Record<string, string>): ts.ImportClause {
    if (!importClause.namedBindings || !ts.isNamedImports(importClause.namedBindings)) {
      return importClause;
    }

    const renamedElements = importClause.namedBindings.elements.map(element => {
      const currentName = element.name.text;
      const newName = renameMappings[currentName];
      
      if (newName) {
        return ts.factory.createImportSpecifier(
          element.isTypeOnly,
          element.propertyName || ts.factory.createIdentifier(currentName),
          ts.factory.createIdentifier(newName)
        );
      }
      
      return element;
    });

    return ts.factory.createImportClause(
      importClause.isTypeOnly,
      importClause.name,
      ts.factory.createNamedImports(renamedElements)
    );
  }

  private addImportsToFile(sourceFile: ts.SourceFile, result: ImportTransformationEngineResult): ts.SourceFile {
    const newImports = this.importAdditions.map(addition => {
      const namedImports = ts.factory.createNamedImports(
        addition.imports.map(name => 
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
        )
      );

      result.addedImports.push({
        module: addition.module,
        imports: addition.imports,
        line: 1, // Added at top
      });

      return ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(addition.isTypeOnly, undefined, namedImports),
        ts.factory.createStringLiteral(addition.module),
        undefined
      );
    });

    return ts.factory.updateSourceFile(
      sourceFile,
      [...newImports, ...sourceFile.statements]
    );
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    // Can transform any file with imports
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