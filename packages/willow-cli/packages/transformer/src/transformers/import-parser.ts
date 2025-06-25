import * as ts from 'typescript';
import type { ImportDetails } from './import-transformer';
import type { SourceLocation } from '@willow-cli/types';

/**
 * Parser for extracting import declaration details
 */
export class ImportParser {
  /**
   * Parse import declaration
   */
  static parse(node: ts.ImportDeclaration): ImportDetails {
    const details: ImportDetails = {
      source: this.getModuleSource(node),
      isTypeOnly: node.importClause?.isTypeOnly || false,
      location: this.getLocation(node),
    };
    
    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        details.defaultImport = node.importClause.name.text;
      }
      
      // Named bindings
      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          // Named imports: import { a, b as c } from 'module'
          details.namedImports = node.importClause.namedBindings.elements.map(element => ({
            name: element.propertyName?.text || element.name.text,
            alias: element.propertyName ? element.name.text : undefined,
          }));
        } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // Namespace import: import * as ns from 'module'
          details.namespaceImport = node.importClause.namedBindings.name.text;
        }
      }
    }
    
    return details;
  }
  
  /**
   * Get module source from import declaration
   */
  private static getModuleSource(node: ts.ImportDeclaration): string {
    if (ts.isStringLiteral(node.moduleSpecifier)) {
      return node.moduleSpecifier.text;
    }
    return node.moduleSpecifier.getText().slice(1, -1);
  }
  
  /**
   * Get source location
   */
  private static getLocation(node: ts.Node): SourceLocation {
    const sourceFile = node.getSourceFile();
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      start: { line: start.line + 1, column: start.character + 1 },
      end: { line: end.line + 1, column: end.character + 1 },
    };
  }
  
  /**
   * Create import declaration from details
   */
  static create(details: ImportDetails): ts.ImportDeclaration {
    let importClause: ts.ImportClause | undefined;
    
    if (details.defaultImport || details.namedImports || details.namespaceImport) {
      const name = details.defaultImport 
        ? ts.factory.createIdentifier(details.defaultImport)
        : undefined;
      
      let namedBindings: ts.NamedImportBindings | undefined;
      
      if (details.namedImports) {
        // Create named imports
        const elements = details.namedImports.map(imp => {
          if (imp.alias) {
            return ts.factory.createImportSpecifier(
              false,
              ts.factory.createIdentifier(imp.name),
              ts.factory.createIdentifier(imp.alias)
            );
          }
          return ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier(imp.name)
          );
        });
        
        namedBindings = ts.factory.createNamedImports(elements);
      } else if (details.namespaceImport) {
        // Create namespace import
        namedBindings = ts.factory.createNamespaceImport(
          ts.factory.createIdentifier(details.namespaceImport)
        );
      }
      
      importClause = ts.factory.createImportClause(
        details.isTypeOnly,
        name,
        namedBindings
      );
    }
    
    return ts.factory.createImportDeclaration(
      undefined, // modifiers
      importClause,
      ts.factory.createStringLiteral(details.source)
    );
  }
  
  /**
   * Merge multiple import details from same source
   */
  static merge(imports: ImportDetails[]): ImportDetails | null {
    if (imports.length === 0) return null;
    if (imports.length === 1) return imports[0];
    
    const merged: ImportDetails = {
      source: imports[0].source,
      isTypeOnly: imports.some(imp => imp.isTypeOnly),
      location: imports[0].location,
      namedImports: [],
    };
    
    // Collect all imports
    const namedImportsMap = new Map<string, { name: string; alias?: string }>();
    
    for (const imp of imports) {
      if (imp.defaultImport && !merged.defaultImport) {
        merged.defaultImport = imp.defaultImport;
      } else if (imp.defaultImport && merged.defaultImport && imp.defaultImport !== merged.defaultImport) {
        // Conflict: multiple default imports
        throw new Error(`Multiple default imports from ${imp.source}: ${merged.defaultImport} and ${imp.defaultImport}`);
      }
      
      if (imp.namespaceImport && !merged.namespaceImport) {
        merged.namespaceImport = imp.namespaceImport;
      } else if (imp.namespaceImport && merged.namespaceImport && imp.namespaceImport !== merged.namespaceImport) {
        // Conflict: multiple namespace imports
        throw new Error(`Multiple namespace imports from ${imp.source}: ${merged.namespaceImport} and ${imp.namespaceImport}`);
      }
      
      if (imp.namedImports) {
        for (const named of imp.namedImports) {
          const key = named.alias || named.name;
          if (!namedImportsMap.has(key)) {
            namedImportsMap.set(key, named);
          }
        }
      }
    }
    
    merged.namedImports = Array.from(namedImportsMap.values());
    
    return merged;
  }
  
  /**
   * Check if import is relative
   */
  static isRelativeImport(source: string): boolean {
    return source.startsWith('./') || source.startsWith('../');
  }
  
  /**
   * Check if import is absolute (path alias)
   */
  static isAbsoluteImport(source: string): boolean {
    return source.startsWith('@/') || source.startsWith('~/') || source.startsWith('/');
  }
  
  /**
   * Check if import is from node_modules
   */
  static isPackageImport(source: string): boolean {
    return !this.isRelativeImport(source) && !this.isAbsoluteImport(source);
  }
  
  /**
   * Get import type
   */
  static getImportType(source: string): 'relative' | 'absolute' | 'package' {
    if (this.isRelativeImport(source)) return 'relative';
    if (this.isAbsoluteImport(source)) return 'absolute';
    return 'package';
  }
}