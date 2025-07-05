/**
 * Code Generator Type Exports
 * 
 * Central export point for all code generation types and interfaces
 */

export * from './GeneratorTypes.js';

// Re-export commonly used types for convenience
export type {
  ICodeGenerator,
  IGeneratorOptions,
  IGeneratorOutput,
  IGeneratedFile,
  ITemplateProcessor,
  IFileWriter,
  IGeneratorVisitor,
  ITemplateRegistry,
  ICodeFormatter,
  IGenerationError,
  IGenerationWarning,
  TemplateHelper,
  CompiledTemplate,
  WriteResult,
  ConflictResolutionOptions,
  ConflictResolution,
  VisitorContext,
  TemplateMetadata,
  TemplateVariable,
  TemplateInfo,
  TemplateFilter,
} from './GeneratorTypes.js';