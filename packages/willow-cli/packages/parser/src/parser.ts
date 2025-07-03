import * as ts from 'typescript';
import { resolve, dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import type { ParseResult, ParseError, SourceLocation } from '@willow-cli/types';
import type { ParserOptions, ParserContext } from './types';
import { ComponentDetector } from './component-detector';
import { ImportAnalyzer } from './import-analyzer';
import { JSXParser } from './jsx-parser';
import { ScopeAnalyzer } from './scope-analyzer';
import { EdgeCaseHandler } from './edge-case-handler';
import { TypeStripper } from './type-stripper';
import { ParserOptimizer, ConsoleProgressReporter } from './parser-optimizer';

export class ASTParser {
  private program: ts.Program | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private compilerOptions: ts.CompilerOptions;
  private typeStripper: TypeStripper;
  private optimizer?: ParserOptimizer;
  
  constructor(private options: ParserOptions) {
    this.compilerOptions = this.createCompilerOptions(options.compilerOptions);
    this.typeStripper = new TypeStripper();
    
    // Initialize optimizer if optimization is enabled
    if (options.enableOptimization) {
      this.optimizer = new ParserOptimizer({
        enableCache: options.enableCache !== false,
        cacheSize: options.cacheSize || 100,
        enableIncrementalParsing: options.incrementalParsing,
        enableParallelProcessing: options.parallelProcessing,
        memoryLimit: options.memoryLimit,
        progressReporter: options.progressReporter || (options.showProgress ? new ConsoleProgressReporter() : undefined),
        earlyTermination: options.earlyTermination,
      });
    }
  }
  
  /**
   * Parse a file and extract information
   */
  parse(): ParseResult {
    // Check cache first
    if (this.optimizer) {
      const cached = this.optimizer.getCached(this.options);
      if (cached) {
        return cached;
      }
    }
    
    const errors: ParseError[] = [];
    const startTime = Date.now();
    
    try {
      // Create program and get source file
      const { program, sourceFile } = this.createProgram();
      this.program = program;
      this.typeChecker = program.getTypeChecker();
      
      // Create parser context
      const context: ParserContext = {
        program,
        typeChecker: this.typeChecker,
        sourceFile,
        options: this.options,
        errors,
      };
      
      // Initialize components
      const componentDetector = new ComponentDetector(this.options.componentPatterns);
      const importAnalyzer = new ImportAnalyzer();
      const jsxParser = new JSXParser();
      const scopeAnalyzer = new ScopeAnalyzer();
      const edgeCaseHandler = new EdgeCaseHandler();
      
      // Parse based on options
      const result: ParseResult = {
        sourceFile,
        imports: this.options.analyzeImports !== false 
          ? importAnalyzer.analyze(sourceFile, context)
          : [],
        components: this.options.detectComponents !== false
          ? componentDetector.detect(sourceFile, context)
          : [],
        exports: this.options.analyzeExports !== false
          ? this.analyzeExports(sourceFile, context)
          : [],
        errors,
      };
      
      // Handle edge cases
      if (this.options.includeEdgeCases !== false) {
        // Dynamic imports
        result.dynamicImports = edgeCaseHandler.handleDynamicImports(sourceFile, context);
        
        // Re-exports
        result.reExports = edgeCaseHandler.handleReExports(sourceFile, context);
        
        // Barrel exports
        result.barrelExports = edgeCaseHandler.handleBarrelExports(sourceFile, context);
        
        // Conditional exports
        result.conditionalExports = edgeCaseHandler.handleConditionalExports(sourceFile, context);
        
        // TypeScript-specific exports
        result.typeScriptExports = edgeCaseHandler.handleTypeScriptExports(sourceFile, context);
        
        // Code splitting patterns
        result.codeSplitting = edgeCaseHandler.handleCodeSplitting(sourceFile, context);
      }
      
      // Add JSX elements to components
      if (this.options.jsx !== false && result.components.length > 0) {
        for (const component of result.components) {
          const componentNode = this.findComponentNode(sourceFile, component.name);
          if (componentNode) {
            component.jsxElements = jsxParser.parse(componentNode, context);
          }
        }
      }
      
      // Cache the result
      if (this.optimizer) {
        this.optimizer.setCached(this.options, result);
      }
      
      // Report parsing metrics
      const parseTime = Date.now() - startTime;
      if (this.optimizer) {
        this.optimizer.emit('parse:complete', { 
          filename: this.options.filename, 
          parseTime,
          components: result.components.length,
          imports: result.imports.length,
          errors: result.errors?.length || 0,
        });
      }
      
      return result;
    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown parse error',
        severity: 'error',
      });
      
      return {
        sourceFile: null as any,
        imports: [],
        components: [],
        exports: [],
        errors,
      };
    }
  }
  
  /**
   * Create TypeScript program
   */
  private createProgram(): { program: ts.Program; sourceFile: ts.SourceFile } {
    const { filename, content } = this.options;
    
    // Create compiler host
    const compilerHost: ts.CompilerHost = {
      getSourceFile: (fileName: string) => {
        if (fileName === filename) {
          const sourceText = content || readFileSync(fileName, 'utf-8');
          return ts.createSourceFile(
            fileName,
            sourceText,
            this.compilerOptions.target || ts.ScriptTarget.ES2020,
            true,
            this.options.jsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
          );
        }
        
        // Try to read other files
        if (existsSync(fileName)) {
          const sourceText = readFileSync(fileName, 'utf-8');
          return ts.createSourceFile(
            fileName,
            sourceText,
            this.compilerOptions.target || ts.ScriptTarget.ES2020,
            true
          );
        }
        
        return undefined;
      },
      writeFile: () => {},
      getCurrentDirectory: () => dirname(filename),
      getDirectories: ts.sys.getDirectories,
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    };
    
    // Create program
    const program = ts.createProgram([filename], this.compilerOptions, compilerHost);
    const sourceFile = program.getSourceFile(filename);
    
    if (!sourceFile) {
      throw new Error(`Failed to create source file for ${filename}`);
    }
    
    return { program, sourceFile };
  }
  
  /**
   * Create compiler options
   */
  private createCompilerOptions(userOptions?: ts.CompilerOptions): ts.CompilerOptions {
    return {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
      jsx: this.options.jsx ? ts.JsxEmit.React : undefined,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      skipLibCheck: true,
      noEmit: true,
      ...userOptions,
    };
  }
  
  /**
   * Analyze exports
   */
  private analyzeExports(sourceFile: ts.SourceFile, context: ParserContext): import('@willow-cli/types').ExportInfo[] {
    const exports: import('@willow-cli/types').ExportInfo[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isExportDeclaration(node)) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          node.exportClause.elements.forEach(element => {
            exports.push({
              name: element.name.text,
              type: 'named',
              source: node.moduleSpecifier ? node.moduleSpecifier.getText().slice(1, -1) : undefined,
              location: this.getLocation(element, sourceFile),
            });
          });
        }
      } else if (ts.isExportAssignment(node)) {
        exports.push({
          name: 'default',
          type: 'default',
          location: this.getLocation(node, sourceFile),
        });
      } else if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const name = this.getNodeName(node);
        if (name) {
          const isDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
          exports.push({
            name,
            type: isDefault ? 'default' : 'named',
            location: this.getLocation(node, sourceFile),
          });
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return exports;
  }
  
  /**
   * Find component node by name
   */
  private findComponentNode(sourceFile: ts.SourceFile, name: string): ts.Node | undefined {
    let componentNode: ts.Node | undefined;
    
    const visit = (node: ts.Node) => {
      if (this.getNodeName(node) === name) {
        componentNode = node;
        return;
      }
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return componentNode;
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
  private getLocation(node: ts.Node, sourceFile: ts.SourceFile): SourceLocation {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      start: { line: start.line + 1, column: start.character + 1 },
      end: { line: end.line + 1, column: end.character + 1 },
    };
  }
  
  /**
   * Strip types from source code
   */
  stripTypes(sourceCode: string, filename?: string): string {
    const file = filename || this.options.filename;
    return this.typeStripper.stripTypes(sourceCode, file);
  }
  
  /**
   * Strip types with source map
   */
  stripTypesWithSourceMap(sourceCode: string, filename?: string): { code: string; sourceMap?: string } {
    const file = filename || this.options.filename;
    return this.typeStripper.stripTypesWithSourceMap(sourceCode, file);
  }
  
  /**
   * Extract type information before stripping
   */
  extractTypes(sourceCode: string, filename?: string): any[] {
    const file = filename || this.options.filename;
    return this.typeStripper.extractTypeInfo(sourceCode, file);
  }
  
  /**
   * Check if file needs type stripping
   */
  needsTypeStripping(filename?: string, content?: string): boolean {
    const file = filename || this.options.filename;
    const code = content || this.options.content;
    return this.typeStripper.needsTypeStripping(file, code);
  }
  
  /**
   * Parse and optionally strip types
   */
  parseWithTypeStripping(stripTypes: boolean = false): ParseResult & { strippedCode?: string } {
    const result = this.parse();
    
    if (stripTypes && this.options.content) {
      const strippedCode = this.stripTypes(this.options.content);
      return {
        ...result,
        strippedCode,
      };
    }
    
    return result;
  }
  
  /**
   * Parse multiple files with optimization
   */
  async parseMultiple(files: ParserOptions[]): Promise<ParseResult[]> {
    if (!this.optimizer || !this.options.parallelProcessing) {
      // Sequential parsing
      return files.map(options => {
        const parser = new ASTParser(options);
        const result = parser.parse();
        parser.dispose();
        return result;
      });
    }
    
    // Use worker pool for parallel parsing
    const workerPool = this.optimizer.createWorkerPool(
      this.options.maxWorkers || 4
    );
    
    try {
      return await workerPool.parse(files);
    } finally {
      workerPool.terminate();
    }
  }
  
  /**
   * Get parser metrics
   */
  getMetrics(): Map<string, any> | undefined {
    return this.optimizer?.getMetrics();
  }
  
  /**
   * Clear parser cache
   */
  clearCache(): void {
    this.optimizer?.clearCache();
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    this.program = null;
    this.typeChecker = null;
    
    if (this.optimizer) {
      this.optimizer.dispose();
    }
  }
}