import * as ts from 'typescript';
import type {
  Transformer,
  TransformerConfig,
  TransformOptions,
  TransformResult,
  TransformerPlugin,
  ValidationResult,
  TransformationType,
  TransformContext,
  TransformHelpers,
  AppliedTransformation,
  TransformError,
  TransformWarning,
  RollbackAction,
} from './types';
import { ASTParser } from '@willow-cli/parser';
import type { ParseResult } from '@willow-cli/types';

/**
 * Main AST-based transformer implementation
 */
export class ASTTransformer implements Transformer {
  private plugins: TransformerPlugin[] = [];
  private rollbackQueue: RollbackAction[] = [];
  
  constructor(private config: TransformerConfig) {
    // Register default plugins
    if (config.plugins) {
      config.plugins.forEach(plugin => this.registerPlugin(plugin));
    }
  }
  
  /**
   * Transform a single file
   */
  async transform(options: TransformOptions): Promise<TransformResult> {
    const startTime = Date.now();
    const appliedTransformations: AppliedTransformation[] = [];
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];
    
    try {
      // Call beforeTransform hooks
      await this.callHook('beforeTransform', options);
      
      // Parse the file if not already parsed
      const parseResult = options.parseResult || await this.parseFile(options);
      
      // Call afterParse hooks
      await this.callHook('afterParse', parseResult, options);
      
      // Create transform context
      const context = this.createContext(
        parseResult.sourceFile,
        parseResult,
        options,
        appliedTransformations,
        errors,
        warnings
      );
      
      // Get transformations to apply
      const transformations = this.getTransformations(options);
      
      // Apply transformations
      let transformedFile = parseResult.sourceFile;
      for (const type of transformations) {
        // Call beforeTransformType hooks
        const shouldTransform = await this.callHook('beforeTransformType', type, context);
        if (shouldTransform === false) {
          context.helpers.reportWarning({
            type,
            message: `Transformation type '${type}' skipped by plugin`,
          });
          continue;
        }
        
        // Apply transformation
        transformedFile = await this.applyTransformation(type, transformedFile, context);
        
        // Call afterTransformType hooks
        await this.callHook('afterTransformType', type, context);
      }
      
      // Generate output code
      const code = this.printSourceFile(transformedFile, options);
      
      // Create result
      const result: TransformResult = {
        filename: options.filename,
        code,
        appliedTransformations,
        skippedTransformations: [],
        errors,
        warnings,
        metadata: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          transformationCount: appliedTransformations.length,
          errorCount: errors.length,
          warningCount: warnings.length,
          fileSize: {
            before: options.content?.length || 0,
            after: code.length,
          },
        },
      };
      
      // Call afterTransform hooks
      await this.callHook('afterTransform', result);
      
      return result;
    } catch (error) {
      // Handle errors based on strategy
      if (this.config.errorStrategy === 'rollback') {
        await this.rollback();
      }
      
      const transformError: TransformError = {
        type: 'custom',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        recoverable: false,
      };
      
      errors.push(transformError);
      
      // Call onError hooks
      await this.callHook('onError', transformError, {} as TransformContext);
      
      if (this.config.errorStrategy === 'throw') {
        throw error;
      }
      
      // Return error result
      return {
        filename: options.filename,
        code: options.content || '',
        appliedTransformations,
        skippedTransformations: [],
        errors,
        warnings,
        metadata: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          transformationCount: 0,
          errorCount: errors.length,
          warningCount: warnings.length,
          fileSize: {
            before: options.content?.length || 0,
            after: options.content?.length || 0,
          },
        },
      };
    }
  }
  
  /**
   * Transform multiple files
   */
  async transformBatch(files: TransformOptions[]): Promise<TransformResult[]> {
    const results: TransformResult[] = [];
    
    // Report progress
    this.config.progressReporter?.onStart(files.length);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Report file start
      this.config.progressReporter?.onFileStart(file.filename, i);
      
      try {
        const result = await this.transform(file);
        results.push(result);
        
        // Report file complete
        this.config.progressReporter?.onFileComplete(file.filename, result);
      } catch (error) {
        // Report error
        this.config.progressReporter?.onError(error as Error);
        
        if (this.config.errorStrategy === 'throw') {
          throw error;
        }
      }
    }
    
    // Report completion
    this.config.progressReporter?.onComplete(results);
    
    return results;
  }
  
  /**
   * Validate configuration
   */
  async validateConfig(): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    
    // Validate required fields
    if (!this.config.targetUIKit) {
      errors.push({
        path: 'targetUIKit',
        message: 'Target UI kit is required',
      });
    }
    
    // Validate plugins
    for (const plugin of this.plugins) {
      if (!plugin.name) {
        errors.push({
          path: 'plugins',
          message: 'Plugin must have a name',
        });
      }
    }
    
    // Validate component mappings
    if (this.config.componentMappings) {
      for (const [source, mapping] of Object.entries(this.config.componentMappings.mappings)) {
        if (!mapping.target) {
          errors.push({
            path: `componentMappings.mappings.${source}`,
            message: 'Component mapping must have a target',
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * Get available transformations
   */
  getAvailableTransformations(): TransformationType[] {
    return ['imports', 'components', 'props', 'styles', 'exports', 'types', 'custom'];
  }
  
  /**
   * Register a plugin
   */
  registerPlugin(plugin: TransformerPlugin): void {
    this.plugins.push(plugin);
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.plugins = [];
    this.rollbackQueue = [];
  }
  
  /**
   * Parse file using parser module
   */
  private async parseFile(options: TransformOptions): Promise<ParseResult> {
    const parser = new ASTParser({
      filename: options.filename,
      content: options.content,
      analyzeImports: true,
      detectComponents: true,
      analyzeExports: true,
      includeEdgeCases: true,
      jsx: true,
    });
    
    return parser.parse();
  }
  
  /**
   * Create transform context
   */
  private createContext(
    sourceFile: ts.SourceFile,
    parseResult: ParseResult,
    options: TransformOptions,
    appliedTransformations: AppliedTransformation[],
    errors: TransformError[],
    warnings: TransformWarning[]
  ): TransformContext {
    const data: Record<string, any> = {};
    
    const helpers: TransformHelpers = {
      reportTransformation: (transformation) => {
        appliedTransformations.push(transformation);
      },
      reportError: (error) => {
        errors.push(error);
      },
      reportWarning: (warning) => {
        warnings.push(warning);
      },
      getComponentMapping: (name) => {
        return this.config.componentMappings?.mappings[name];
      },
      getImportMapping: (source) => {
        return this.config.importMappings?.packageMappings[source];
      },
      addRollback: (action) => {
        this.rollbackQueue.push(action);
      },
    };
    
    return {
      sourceFile,
      parseResult,
      config: this.config,
      options,
      appliedTransformations,
      errors,
      warnings,
      data,
      helpers,
    };
  }
  
  /**
   * Get transformations to apply
   */
  private getTransformations(options: TransformOptions): TransformationType[] {
    const available = this.getAvailableTransformations();
    let transformations = options.transformations || available;
    
    // Remove skipped transformations
    if (options.skipTransformations) {
      transformations = transformations.filter(
        t => !options.skipTransformations?.includes(t)
      );
    }
    
    return transformations;
  }
  
  /**
   * Apply a transformation type
   */
  private async applyTransformation(
    type: TransformationType,
    sourceFile: ts.SourceFile,
    context: TransformContext
  ): Promise<ts.SourceFile> {
    // Report progress
    this.config.progressReporter?.onTransformationType(type, 0);
    
    let transformed = sourceFile;
    
    switch (type) {
      case 'imports':
        if (this.config.importMappings) {
          const { ImportTransformationEngine } = await import('./transformers/import-transformation-engine');
          const importTransformer = new ImportTransformationEngine(context, this.config.importMappings);
          transformed = importTransformer.transform(sourceFile);
        }
        break;
        
      case 'components':
        // Will be implemented in next subtask
        break;
        
      case 'props':
        // Will be implemented in next subtask
        break;
        
      case 'styles':
        // Will be implemented in next subtask
        break;
        
      case 'exports':
        // Will be implemented later
        break;
        
      case 'types':
        // Will be implemented later
        break;
        
      case 'custom':
        // Apply custom transformers from plugins
        for (const plugin of this.plugins) {
          if (plugin.transformers) {
            for (const customTransformer of plugin.transformers) {
              if (customTransformer.type === type) {
                // Apply custom transformation
                // This would need more implementation
              }
            }
          }
        }
        break;
    }
    
    this.config.progressReporter?.onTransformationType(type, 100);
    
    return transformed;
  }
  
  /**
   * Print source file to code
   */
  private printSourceFile(sourceFile: ts.SourceFile, options: TransformOptions): string {
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });
    
    return printer.printFile(sourceFile);
  }
  
  /**
   * Call plugin hooks
   */
  private async callHook(hookName: string, ...args: any[]): Promise<any> {
    for (const plugin of this.plugins) {
      const hook = (plugin.hooks as any)?.[hookName];
      if (hook) {
        const result = await hook(...args);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
  
  /**
   * Rollback transformations
   */
  private async rollback(): Promise<void> {
    for (const action of this.rollbackQueue.reverse()) {
      try {
        await action.rollback();
      } catch (error) {
        console.error(`Rollback failed: ${action.description}`, error);
      }
    }
    this.rollbackQueue = [];
  }
}