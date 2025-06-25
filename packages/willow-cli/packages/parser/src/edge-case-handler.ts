import * as ts from 'typescript';
import type { ImportInfo, ExportInfo, ParseError } from '@willow-cli/types';
import type { ParserContext } from './types';

export class EdgeCaseHandler {
  /**
   * Handle dynamic imports
   */
  handleDynamicImports(sourceFile: ts.SourceFile, context: ParserContext): ImportInfo[] {
    const dynamicImports: ImportInfo[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const importInfo = this.parseDynamicImport(node, context);
        if (importInfo) {
          dynamicImports.push(importInfo);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return dynamicImports;
  }
  
  /**
   * Parse dynamic import expression
   */
  private parseDynamicImport(node: ts.CallExpression, context: ParserContext): ImportInfo | null {
    if (node.arguments.length === 0) {
      return null;
    }
    
    const arg = node.arguments[0];
    let source: string | undefined;
    let isDynamic = true;
    
    // String literal import
    if (ts.isStringLiteral(arg)) {
      source = arg.text;
    }
    // Template literal import
    else if (ts.isTemplateExpression(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
      source = this.extractTemplateLiteralValue(arg, context);
      if (!source) {
        // Can't statically analyze
        isDynamic = true;
        source = '<dynamic>';
      }
    }
    // Variable or expression import
    else {
      source = '<dynamic>';
    }
    
    if (!source) {
      return null;
    }
    
    // Check for lazy loading patterns
    const parent = node.parent;
    const isLazyLoad = this.isLazyLoadPattern(node, parent);
    
    // Check for code splitting patterns
    const isCodeSplit = this.isCodeSplitPattern(node, parent);
    
    return {
      source,
      type: source.startsWith('./') || source.startsWith('../') ? 'relative' : 'package',
      imported: [],
      location: this.getLocation(node, context.sourceFile),
      dynamic: true,
      lazy: isLazyLoad,
      codeSplit: isCodeSplit,
      raw: node.getText(),
    };
  }
  
  /**
   * Handle re-exports
   */
  handleReExports(sourceFile: ts.SourceFile, context: ParserContext): ExportInfo[] {
    const reExports: ExportInfo[] = [];
    
    const visit = (node: ts.Node) => {
      // export * from './module'
      if (ts.isExportDeclaration(node) && !node.exportClause && node.moduleSpecifier) {
        reExports.push({
          name: '*',
          type: 're-export',
          source: ts.isStringLiteral(node.moduleSpecifier) 
            ? node.moduleSpecifier.text 
            : node.moduleSpecifier.getText(),
          location: this.getLocation(node, context.sourceFile),
        });
      }
      // export { foo, bar } from './module'
      else if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause) && node.moduleSpecifier) {
        const source = ts.isStringLiteral(node.moduleSpecifier) 
          ? node.moduleSpecifier.text 
          : node.moduleSpecifier.getText();
          
        node.exportClause.elements.forEach(element => {
          reExports.push({
            name: element.propertyName?.text || element.name.text,
            alias: element.name.text,
            type: 're-export',
            source,
            location: this.getLocation(element, context.sourceFile),
          });
        });
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return reExports;
  }
  
  /**
   * Handle barrel exports
   */
  handleBarrelExports(sourceFile: ts.SourceFile, context: ParserContext): {
    isBarrel: boolean;
    exports: ExportInfo[];
  } {
    const exports: ExportInfo[] = [];
    let hasNonReExport = false;
    
    const visit = (node: ts.Node) => {
      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) {
          // Re-export
          const reExports = this.handleReExports(sourceFile, context);
          exports.push(...reExports);
        } else {
          // Local export
          hasNonReExport = true;
        }
      } else if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        hasNonReExport = true;
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    // Barrel file typically has mostly re-exports
    const isBarrel = exports.length > 0 && !hasNonReExport;
    
    return { isBarrel, exports };
  }
  
  /**
   * Handle conditional exports
   */
  handleConditionalExports(sourceFile: ts.SourceFile, context: ParserContext): ExportInfo[] {
    const conditionalExports: ExportInfo[] = [];
    
    const visit = (node: ts.Node) => {
      // Check for module.exports patterns
      if (ts.isBinaryExpression(node) && 
          ts.isPropertyAccessExpression(node.left) &&
          node.left.expression.getText() === 'module' &&
          node.left.name.text === 'exports') {
        
        const exportInfo = this.parseModuleExports(node, context);
        if (exportInfo) {
          conditionalExports.push(exportInfo);
        }
      }
      
      // Check for exports.foo patterns
      if (ts.isBinaryExpression(node) && 
          ts.isPropertyAccessExpression(node.left) &&
          node.left.expression.getText() === 'exports') {
        
        const exportInfo = this.parseExportsProperty(node, context);
        if (exportInfo) {
          conditionalExports.push(exportInfo);
        }
      }
      
      // Check for conditional exports in if statements
      if (ts.isIfStatement(node)) {
        const conditionalExport = this.parseConditionalExport(node, context);
        if (conditionalExport) {
          conditionalExports.push(...conditionalExport);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return conditionalExports;
  }
  
  /**
   * Handle TypeScript-specific exports
   */
  handleTypeScriptExports(sourceFile: ts.SourceFile, context: ParserContext): ExportInfo[] {
    const tsExports: ExportInfo[] = [];
    
    const visit = (node: ts.Node) => {
      // Type-only exports
      if (ts.isExportDeclaration(node) && node.isTypeOnly) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          node.exportClause.elements.forEach(element => {
            tsExports.push({
              name: element.name.text,
              type: 'type',
              isTypeOnly: true,
              source: node.moduleSpecifier ? 
                (ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : undefined) : 
                undefined,
              location: this.getLocation(element, context.sourceFile),
            });
          });
        }
      }
      
      // Namespace exports
      if (ts.isModuleDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        tsExports.push({
          name: node.name.text,
          type: 'namespace',
          location: this.getLocation(node, context.sourceFile),
        });
      }
      
      // Type alias exports
      if (ts.isTypeAliasDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        tsExports.push({
          name: node.name.text,
          type: 'type',
          isTypeOnly: true,
          location: this.getLocation(node, context.sourceFile),
        });
      }
      
      // Interface exports
      if (ts.isInterfaceDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        tsExports.push({
          name: node.name.text,
          type: 'type',
          isTypeOnly: true,
          location: this.getLocation(node, context.sourceFile),
        });
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return tsExports;
  }
  
  /**
   * Handle code splitting patterns
   */
  handleCodeSplitting(sourceFile: ts.SourceFile, context: ParserContext): {
    splitPoints: Array<{
      type: 'route' | 'component' | 'library';
      import: ImportInfo;
      condition?: string;
    }>;
  } {
    const splitPoints: any[] = [];
    
    const visit = (node: ts.Node) => {
      // React.lazy pattern
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText();
        if (callee === 'React.lazy' || callee === 'lazy') {
          const lazyImport = this.parseReactLazy(node, context);
          if (lazyImport) {
            splitPoints.push({
              type: 'component',
              import: lazyImport,
            });
          }
        }
      }
      
      // Route-based splitting patterns
      if (ts.isObjectLiteralExpression(node)) {
        const routeSplit = this.parseRouteSplitting(node, context);
        if (routeSplit) {
          splitPoints.push(...routeSplit);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return { splitPoints };
  }
  
  /**
   * Extract template literal value if possible
   */
  private extractTemplateLiteralValue(
    node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral, 
    context: ParserContext
  ): string | null {
    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      return node.text;
    }
    
    // For template expressions, try to extract if all parts are static
    let result = node.head.text;
    
    for (const span of node.templateSpans) {
      // Can't statically analyze expressions
      if (!ts.isStringLiteral(span.expression)) {
        return null;
      }
      result += span.expression.text + span.literal.text;
    }
    
    return result;
  }
  
  /**
   * Check if dynamic import is lazy loading pattern
   */
  private isLazyLoadPattern(importCall: ts.CallExpression, parent: ts.Node): boolean {
    // React.lazy(() => import('./Component'))
    if (ts.isCallExpression(parent) && parent.expression.getText().includes('lazy')) {
      return true;
    }
    
    // const Component = lazy(() => import('./Component'))
    if (ts.isVariableDeclaration(parent) && parent.initializer === importCall) {
      const varParent = parent.parent?.parent;
      if (varParent && ts.isVariableStatement(varParent)) {
        const text = varParent.getText();
        return text.includes('lazy');
      }
    }
    
    return false;
  }
  
  /**
   * Check if dynamic import is code splitting pattern
   */
  private isCodeSplitPattern(importCall: ts.CallExpression, parent: ts.Node): boolean {
    // Check for route-based splitting
    if (ts.isPropertyAssignment(parent) && parent.name.getText() === 'component') {
      return true;
    }
    
    // Check for conditional imports
    if (ts.isIfStatement(parent.parent) || ts.isConditionalExpression(parent)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Parse module.exports assignment
   */
  private parseModuleExports(node: ts.BinaryExpression, context: ParserContext): ExportInfo | null {
    const right = node.right;
    let exportType: ExportInfo['type'] = 'default';
    let name = 'default';
    
    // module.exports = { foo, bar }
    if (ts.isObjectLiteralExpression(right)) {
      return {
        name: 'default',
        type: 'commonjs',
        value: right.getText(),
        location: this.getLocation(node, context.sourceFile),
      };
    }
    
    // module.exports = function() {}
    if (ts.isFunctionExpression(right) || ts.isArrowFunction(right)) {
      return {
        name: 'default',
        type: 'commonjs',
        location: this.getLocation(node, context.sourceFile),
      };
    }
    
    return {
      name: 'default',
      type: 'commonjs',
      location: this.getLocation(node, context.sourceFile),
    };
  }
  
  /**
   * Parse exports.property assignment
   */
  private parseExportsProperty(node: ts.BinaryExpression, context: ParserContext): ExportInfo | null {
    if (!ts.isPropertyAccessExpression(node.left)) {
      return null;
    }
    
    const propertyName = node.left.name.text;
    
    return {
      name: propertyName,
      type: 'commonjs',
      location: this.getLocation(node, context.sourceFile),
    };
  }
  
  /**
   * Parse conditional export in if statement
   */
  private parseConditionalExport(node: ts.IfStatement, context: ParserContext): ExportInfo[] | null {
    const exports: ExportInfo[] = [];
    const condition = node.expression.getText();
    
    // Check for environment-based exports
    if (condition.includes('process.env') || condition.includes('__DEV__')) {
      const thenExports = this.extractExportsFromBlock(node.thenStatement, context);
      thenExports.forEach(exp => {
        exp.condition = condition;
        exports.push(exp);
      });
      
      if (node.elseStatement) {
        const elseExports = this.extractExportsFromBlock(node.elseStatement, context);
        elseExports.forEach(exp => {
          exp.condition = `!(${condition})`;
          exports.push(exp);
        });
      }
    }
    
    return exports.length > 0 ? exports : null;
  }
  
  /**
   * Extract exports from a statement block
   */
  private extractExportsFromBlock(statement: ts.Statement, context: ParserContext): ExportInfo[] {
    const exports: ExportInfo[] = [];
    
    const visit = (node: ts.Node) => {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const name = this.getNodeName(node);
        if (name) {
          exports.push({
            name,
            type: 'conditional',
            location: this.getLocation(node, context.sourceFile),
          });
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(statement);
    return exports;
  }
  
  /**
   * Parse React.lazy pattern
   */
  private parseReactLazy(node: ts.CallExpression, context: ParserContext): ImportInfo | null {
    if (node.arguments.length === 0) {
      return null;
    }
    
    const arg = node.arguments[0];
    if (!ts.isArrowFunction(arg) && !ts.isFunctionExpression(arg)) {
      return null;
    }
    
    // Look for dynamic import in the function body
    let dynamicImport: ts.CallExpression | null = null;
    
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) {
        dynamicImport = n;
      }
      ts.forEachChild(n, visit);
    };
    
    if (arg.body) {
      visit(arg.body);
    }
    
    if (dynamicImport) {
      return this.parseDynamicImport(dynamicImport, context);
    }
    
    return null;
  }
  
  /**
   * Parse route-based code splitting
   */
  private parseRouteSplitting(node: ts.ObjectLiteralExpression, context: ParserContext): Array<{
    type: 'route';
    import: ImportInfo;
    path?: string;
  }> | null {
    const splits: any[] = [];
    
    // Look for route configuration patterns
    node.properties.forEach(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const name = prop.name.getText();
        
        // Common route property names
        if (name === 'component' || name === 'element' || name === 'load') {
          // Check for dynamic import
          if (ts.isArrowFunction(prop.initializer) || ts.isFunctionExpression(prop.initializer)) {
            let dynamicImport: ts.CallExpression | null = null;
            
            const visit = (n: ts.Node) => {
              if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) {
                dynamicImport = n;
              }
              ts.forEachChild(n, visit);
            };
            
            visit(prop.initializer);
            
            if (dynamicImport) {
              const importInfo = this.parseDynamicImport(dynamicImport, context);
              if (importInfo) {
                // Try to find route path
                const pathProp = node.properties.find(p => 
                  ts.isPropertyAssignment(p) && p.name.getText() === 'path'
                );
                
                splits.push({
                  type: 'route',
                  import: importInfo,
                  path: pathProp && ts.isStringLiteral(pathProp.initializer) 
                    ? pathProp.initializer.text 
                    : undefined,
                });
              }
            }
          }
        }
      }
    });
    
    return splits.length > 0 ? splits : null;
  }
  
  /**
   * Get node name
   */
  private getNodeName(node: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
      return node.name?.text;
    }
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration && ts.isIdentifier(declaration.name)) {
        return declaration.name.text;
      }
    }
    return undefined;
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
}