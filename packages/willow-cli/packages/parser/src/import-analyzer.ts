import * as ts from 'typescript';
import type { ImportInfo, ImportType } from '@willow-cli/types';
import type { ParserContext, ImportPattern } from './types';

export class ImportAnalyzer {
  private patterns: ImportPattern[];
  
  constructor() {
    this.patterns = this.createDefaultPatterns();
  }
  
  /**
   * Analyze imports in source file
   */
  analyze(sourceFile: ts.SourceFile, context: ParserContext): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importInfo = this.analyzeImportDeclaration(node, context);
        if (importInfo) {
          imports.push(importInfo);
        }
      } else if (ts.isImportEqualsDeclaration(node)) {
        const importInfo = this.analyzeImportEquals(node, context);
        if (importInfo) {
          imports.push(importInfo);
        }
      } else if (ts.isCallExpression(node) && this.isDynamicImport(node)) {
        const importInfo = this.analyzeDynamicImport(node, context);
        if (importInfo) {
          imports.push(importInfo);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return imports;
  }
  
  /**
   * Analyze import declaration
   */
  private analyzeImportDeclaration(node: ts.ImportDeclaration, context: ParserContext): ImportInfo | null {
    const moduleSpecifier = node.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) {
      return null;
    }
    
    const source = moduleSpecifier.text;
    const importClause = node.importClause;
    
    if (!importClause) {
      // Side effect import: import 'module';
      return {
        source,
        type: 'side-effect',
        imported: [],
        location: this.getLocation(node, context.sourceFile),
      };
    }
    
    const imported: ImportInfo['imported'] = [];
    
    // Default import
    if (importClause.name) {
      imported.push({
        name: importClause.name.text,
        alias: importClause.name.text,
        type: 'default',
      });
    }
    
    // Named imports
    if (importClause.namedBindings) {
      if (ts.isNamedImports(importClause.namedBindings)) {
        importClause.namedBindings.elements.forEach(element => {
          imported.push({
            name: element.propertyName?.text || element.name.text,
            alias: element.name.text,
            type: 'named',
          });
        });
      }
      // Namespace import
      else if (ts.isNamespaceImport(importClause.namedBindings)) {
        imported.push({
          name: '*',
          alias: importClause.namedBindings.name.text,
          type: 'namespace',
        });
      }
    }
    
    // Determine import type
    const type = this.determineImportType(source);
    
    // Check for type-only imports
    const isTypeOnly = node.importClause?.isTypeOnly || false;
    
    return {
      source,
      type,
      imported,
      location: this.getLocation(node, context.sourceFile),
      isTypeOnly,
      raw: node.getText(),
    };
  }
  
  /**
   * Analyze import equals declaration
   */
  private analyzeImportEquals(node: ts.ImportEqualsDeclaration, context: ParserContext): ImportInfo | null {
    const name = node.name.text;
    let source = '';
    
    if (ts.isExternalModuleReference(node.moduleReference)) {
      const expr = node.moduleReference.expression;
      if (ts.isStringLiteral(expr)) {
        source = expr.text;
      }
    } else {
      source = node.moduleReference.getText();
    }
    
    return {
      source,
      type: this.determineImportType(source),
      imported: [{
        name: name,
        alias: name,
        type: 'default',
      }],
      location: this.getLocation(node, context.sourceFile),
      raw: node.getText(),
    };
  }
  
  /**
   * Analyze dynamic import
   */
  private analyzeDynamicImport(node: ts.CallExpression, context: ParserContext): ImportInfo | null {
    if (node.arguments.length === 0) {
      return null;
    }
    
    const arg = node.arguments[0];
    if (!ts.isStringLiteral(arg)) {
      return null;
    }
    
    const source = arg.text;
    
    return {
      source,
      type: this.determineImportType(source),
      imported: [],
      location: this.getLocation(node, context.sourceFile),
      dynamic: true,
      raw: node.getText(),
    };
  }
  
  /**
   * Check if call expression is dynamic import
   */
  private isDynamicImport(node: ts.CallExpression): boolean {
    return node.expression.kind === ts.SyntaxKind.ImportKeyword;
  }
  
  /**
   * Determine import type based on source
   */
  private determineImportType(source: string): ImportType {
    // Relative imports
    if (source.startsWith('./') || source.startsWith('../')) {
      return 'relative';
    }
    
    // Absolute imports (path mapping)
    if (source.startsWith('@/') || source.startsWith('~/')) {
      return 'absolute';
    }
    
    // Package imports
    if (!source.includes('/') || source.startsWith('@')) {
      return 'package';
    }
    
    // Deep imports from packages
    return 'package';
  }
  
  /**
   * Create default import patterns
   */
  private createDefaultPatterns(): ImportPattern[] {
    return [
      // React imports
      {
        name: 'react',
        matches: (node) => {
          const source = this.getImportSource(node);
          return source === 'react' || source.startsWith('react/');
        },
        extract: (node) => ({
          framework: 'react',
          category: 'library',
        }),
      },
      
      // Component library imports
      {
        name: 'ui-library',
        matches: (node) => {
          const source = this.getImportSource(node);
          return source.includes('ui/') || 
                 source.includes('/components/') ||
                 source.includes('@ui/') ||
                 source.includes('@components/');
        },
        extract: (node) => ({
          category: 'ui',
        }),
      },
      
      // Style imports
      {
        name: 'styles',
        matches: (node) => {
          const source = this.getImportSource(node);
          return source.endsWith('.css') || 
                 source.endsWith('.scss') || 
                 source.endsWith('.sass') ||
                 source.endsWith('.less') ||
                 source.endsWith('.module.css') ||
                 source.endsWith('.module.scss');
        },
        extract: (node) => ({
          category: 'styles',
        }),
      },
      
      // Type imports
      {
        name: 'types',
        matches: (node) => {
          return node.importClause?.isTypeOnly || false;
        },
        extract: (node) => ({
          category: 'types',
        }),
      },
      
      // Test utilities
      {
        name: 'test',
        matches: (node) => {
          const source = this.getImportSource(node);
          return source.includes('test') || 
                 source.includes('jest') || 
                 source.includes('vitest') ||
                 source.includes('@testing-library');
        },
        extract: (node) => ({
          category: 'test',
        }),
      },
    ];
  }
  
  /**
   * Get import source from declaration
   */
  private getImportSource(node: ts.ImportDeclaration): string {
    if (ts.isStringLiteral(node.moduleSpecifier)) {
      return node.moduleSpecifier.text;
    }
    return '';
  }
  
  /**
   * Get source location
   */
  private getLocation(node: ts.Node, sourceFile: ts.SourceFile): import('@willow-cli/types').SourceLocation {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      start: { line: start.line + 1, column: start.character + 1 },
      end: { line: end.line + 1, column: end.character + 1 },
    };
  }
  
  /**
   * Group imports by type
   */
  groupByType(imports: ImportInfo[]): Record<ImportType, ImportInfo[]> {
    const groups: Record<ImportType, ImportInfo[]> = {
      'side-effect': [],
      'package': [],
      'absolute': [],
      'relative': [],
    };
    
    imports.forEach(imp => {
      groups[imp.type].push(imp);
    });
    
    return groups;
  }
  
  /**
   * Group imports by category
   */
  groupByCategory(imports: ImportInfo[]): Record<string, ImportInfo[]> {
    const groups: Record<string, ImportInfo[]> = {};
    
    imports.forEach(imp => {
      const category = imp.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(imp);
    });
    
    return groups;
  }
  
  /**
   * Find imports from specific source
   */
  findBySource(imports: ImportInfo[], source: string | RegExp): ImportInfo[] {
    if (typeof source === 'string') {
      return imports.filter(imp => imp.source === source);
    } else {
      return imports.filter(imp => source.test(imp.source));
    }
  }
  
  /**
   * Find specific imported names
   */
  findImportedName(imports: ImportInfo[], name: string): ImportInfo | undefined {
    for (const imp of imports) {
      const found = imp.imported.find(i => i.name === name || i.alias === name);
      if (found) {
        return imp;
      }
    }
    return undefined;
  }
  
  /**
   * Get all imported names
   */
  getAllImportedNames(imports: ImportInfo[]): string[] {
    const names = new Set<string>();
    
    imports.forEach(imp => {
      imp.imported.forEach(i => {
        names.add(i.alias);
      });
    });
    
    return Array.from(names);
  }
}