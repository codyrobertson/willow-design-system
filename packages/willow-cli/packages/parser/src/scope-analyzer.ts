import * as ts from 'typescript';
import type { ParserContext, ScopeInfo, SymbolInfo } from './types';

export class ScopeAnalyzer {
  /**
   * Analyze scopes in source file
   */
  analyze(sourceFile: ts.SourceFile, context: ParserContext): ScopeInfo {
    const globalScope: ScopeInfo = {
      type: 'module',
      symbols: new Map(),
      children: [],
      node: sourceFile,
    };
    
    this.buildScope(sourceFile, globalScope, context);
    return globalScope;
  }
  
  /**
   * Build scope tree
   */
  private buildScope(node: ts.Node, parentScope: ScopeInfo, context: ParserContext): void {
    let currentScope = parentScope;
    
    // Check if node creates a new scope
    if (this.createsScope(node)) {
      const newScope: ScopeInfo = {
        type: this.getScopeType(node),
        parent: parentScope,
        symbols: new Map(),
        children: [],
        node,
      };
      
      parentScope.children.push(newScope);
      currentScope = newScope;
    }
    
    // Process declarations in current node
    this.processDeclarations(node, currentScope, context);
    
    // Recursively process children
    ts.forEachChild(node, child => {
      this.buildScope(child, currentScope, context);
    });
  }
  
  /**
   * Check if node creates a new scope
   */
  private createsScope(node: ts.Node): boolean {
    return ts.isFunctionDeclaration(node) ||
           ts.isFunctionExpression(node) ||
           ts.isArrowFunction(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isClassDeclaration(node) ||
           ts.isClassExpression(node) ||
           ts.isBlock(node) ||
           ts.isModuleDeclaration(node) ||
           ts.isSourceFile(node);
  }
  
  /**
   * Get scope type for node
   */
  private getScopeType(node: ts.Node): ScopeInfo['type'] {
    if (ts.isSourceFile(node)) {
      return 'module';
    }
    if (ts.isFunctionDeclaration(node) || 
        ts.isFunctionExpression(node) || 
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)) {
      return 'function';
    }
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      return 'class';
    }
    if (ts.isBlock(node)) {
      return 'block';
    }
    if (ts.isModuleDeclaration(node)) {
      return 'module';
    }
    return 'block';
  }
  
  /**
   * Process declarations in node
   */
  private processDeclarations(node: ts.Node, scope: ScopeInfo, context: ParserContext): void {
    // Variable declarations
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        this.processVariableDeclaration(decl, scope, context);
      });
    }
    
    // Function declarations
    else if (ts.isFunctionDeclaration(node) && node.name) {
      const symbol = this.createSymbol(node.name.text, 'function', node, context);
      scope.symbols.set(node.name.text, symbol);
    }
    
    // Class declarations
    else if (ts.isClassDeclaration(node) && node.name) {
      const symbol = this.createSymbol(node.name.text, 'class', node, context);
      scope.symbols.set(node.name.text, symbol);
    }
    
    // Interface declarations
    else if (ts.isInterfaceDeclaration(node)) {
      const symbol = this.createSymbol(node.name.text, 'interface', node, context);
      scope.symbols.set(node.name.text, symbol);
    }
    
    // Type alias declarations
    else if (ts.isTypeAliasDeclaration(node)) {
      const symbol = this.createSymbol(node.name.text, 'type', node, context);
      scope.symbols.set(node.name.text, symbol);
    }
    
    // Enum declarations
    else if (ts.isEnumDeclaration(node)) {
      const symbol = this.createSymbol(node.name.text, 'enum', node, context);
      scope.symbols.set(node.name.text, symbol);
    }
    
    // Namespace/Module declarations
    else if (ts.isModuleDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      const symbol = this.createSymbol(node.name.text, 'namespace', node, context);
      scope.symbols.set(node.name.text, symbol);
    }
    
    // Parameter declarations
    else if (ts.isParameter(node) && node.name && ts.isIdentifier(node.name)) {
      const symbol = this.createSymbol(node.name.text, 'variable', node, context);
      scope.symbols.set(node.name.text, symbol);
    }
  }
  
  /**
   * Process variable declaration
   */
  private processVariableDeclaration(
    node: ts.VariableDeclaration, 
    scope: ScopeInfo, 
    context: ParserContext
  ): void {
    if (ts.isIdentifier(node.name)) {
      const symbol = this.createSymbol(node.name.text, 'variable', node, context);
      scope.symbols.set(node.name.text, symbol);
    } else if (ts.isObjectBindingPattern(node.name) || ts.isArrayBindingPattern(node.name)) {
      // Handle destructuring
      this.processBindingPattern(node.name, scope, node, context);
    }
  }
  
  /**
   * Process binding pattern (destructuring)
   */
  private processBindingPattern(
    pattern: ts.BindingPattern, 
    scope: ScopeInfo, 
    declaration: ts.Node,
    context: ParserContext
  ): void {
    pattern.elements.forEach(element => {
      if (ts.isBindingElement(element)) {
        if (element.name && ts.isIdentifier(element.name)) {
          const symbol = this.createSymbol(element.name.text, 'variable', declaration, context);
          scope.symbols.set(element.name.text, symbol);
        } else if (element.name && (ts.isObjectBindingPattern(element.name) || ts.isArrayBindingPattern(element.name))) {
          this.processBindingPattern(element.name, scope, declaration, context);
        }
      }
    });
  }
  
  /**
   * Create symbol info
   */
  private createSymbol(
    name: string, 
    kind: SymbolInfo['kind'], 
    declaration: ts.Node,
    context: ParserContext
  ): SymbolInfo {
    const symbol: SymbolInfo = {
      name,
      kind,
      declaration,
      references: [],
      exported: this.isExported(declaration),
    };
    
    // Try to get type information
    if (context.options.includeTypes && context.typeChecker) {
      try {
        const tsSymbol = context.typeChecker.getSymbolAtLocation(declaration);
        if (tsSymbol) {
          const type = context.typeChecker.getTypeOfSymbolAtLocation(tsSymbol, declaration);
          symbol.type = context.typeChecker.typeToString(type);
        }
      } catch {
        // Ignore type checking errors
      }
    }
    
    return symbol;
  }
  
  /**
   * Check if declaration is exported
   */
  private isExported(node: ts.Node): boolean {
    if (!node.modifiers) return false;
    return node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }
  
  /**
   * Find symbol in scope chain
   */
  findSymbol(scope: ScopeInfo, name: string): SymbolInfo | undefined {
    // Check current scope
    const symbol = scope.symbols.get(name);
    if (symbol) return symbol;
    
    // Check parent scope
    if (scope.parent) {
      return this.findSymbol(scope.parent, name);
    }
    
    return undefined;
  }
  
  /**
   * Get all symbols in scope (including parent scopes)
   */
  getAllSymbols(scope: ScopeInfo): Map<string, SymbolInfo> {
    const allSymbols = new Map<string, SymbolInfo>();
    
    // Add parent symbols first
    if (scope.parent) {
      const parentSymbols = this.getAllSymbols(scope.parent);
      parentSymbols.forEach((symbol, name) => {
        allSymbols.set(name, symbol);
      });
    }
    
    // Add current scope symbols (may override parent symbols)
    scope.symbols.forEach((symbol, name) => {
      allSymbols.set(name, symbol);
    });
    
    return allSymbols;
  }
  
  /**
   * Get symbols by kind
   */
  getSymbolsByKind(scope: ScopeInfo, kind: SymbolInfo['kind']): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    
    const collect = (s: ScopeInfo) => {
      s.symbols.forEach(symbol => {
        if (symbol.kind === kind) {
          symbols.push(symbol);
        }
      });
      
      s.children.forEach(collect);
    };
    
    collect(scope);
    return symbols;
  }
  
  /**
   * Find references to symbol
   */
  findReferences(
    symbol: SymbolInfo, 
    scope: ScopeInfo, 
    context: ParserContext
  ): ts.Node[] {
    const references: ts.Node[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) && node.text === symbol.name) {
        // Check if this identifier refers to our symbol
        const foundSymbol = this.findSymbolAtLocation(node, scope);
        if (foundSymbol === symbol) {
          references.push(node);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(scope.node);
    return references;
  }
  
  /**
   * Find symbol at specific location
   */
  private findSymbolAtLocation(node: ts.Identifier, scope: ScopeInfo): SymbolInfo | undefined {
    // This is a simplified version - in a real implementation,
    // you would need to consider the exact scope chain at the location
    return this.findSymbol(scope, node.text);
  }
  
  /**
   * Check if variable is used
   */
  isSymbolUsed(symbol: SymbolInfo, scope: ScopeInfo, context: ParserContext): boolean {
    const references = this.findReferences(symbol, scope, context);
    // First reference is usually the declaration itself
    return references.length > 1;
  }
  
  /**
   * Get unused symbols
   */
  getUnusedSymbols(scope: ScopeInfo, context: ParserContext): SymbolInfo[] {
    const unused: SymbolInfo[] = [];
    
    const check = (s: ScopeInfo) => {
      s.symbols.forEach(symbol => {
        if (!symbol.exported && !this.isSymbolUsed(symbol, s, context)) {
          unused.push(symbol);
        }
      });
      
      s.children.forEach(check);
    };
    
    check(scope);
    return unused;
  }
}