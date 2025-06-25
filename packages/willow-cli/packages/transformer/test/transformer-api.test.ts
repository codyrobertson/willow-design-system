/**
 * Tests for Transformer API
 * Task 5.1: Design transformer API interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ts from 'typescript';
import {
  BaseTransformer,
  DefaultTransformerRegistry,
  DefaultTransformerPipeline,
  DefaultComposableTransformer,
  ConsoleLogger,
  LogLevel,
  createTransformerPipeline,
  createComposableTransformer,
  TransformContext,
  TransformResult,
  TransformerConfig,
} from '../src/transformer-api';

// Mock transformer for testing
class MockTransformer extends BaseTransformer<any, any> {
  readonly name = 'mock-transformer';
  readonly description = 'Mock transformer for testing';
  readonly version = '1.0.0';

  protected async performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: any[];
      warnings: any[];
      changes: any[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    data?: any;
    nodesProcessed?: number;
  }> {
    // Simple transformation: add a comment to the file
    const printer = ts.createPrinter();
    const comment = '// Transformed by mock-transformer\n';
    const newText = comment + sourceFile.text;
    
    const newSourceFile = ts.createSourceFile(
      sourceFile.fileName,
      newText,
      sourceFile.languageVersion,
      true
    );

    collectors.changes.push({
      type: 'add',
      description: 'Added transformation comment',
      file: sourceFile.fileName,
    });

    return {
      transformedFile: newSourceFile,
      nodesProcessed: 1,
    };
  }
}

describe('Transformer API', () => {
  describe('BaseTransformer', () => {
    let transformer: MockTransformer;
    let sourceFile: ts.SourceFile;
    let context: TransformContext;

    beforeEach(() => {
      transformer = new MockTransformer();
      sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );
      
      context = {
        program: {} as ts.Program,
        typeChecker: {} as ts.TypeChecker,
        compilerOptions: {},
        workingDirectory: process.cwd(),
        logger: new ConsoleLogger(LogLevel.ERROR),
        sharedState: new Map(),
        config: {},
        plugins: [],
      };
    });

    it('should initialize transformer', async () => {
      const config = { test: true };
      await transformer.initialize(config);
      
      // Should not throw
      expect(transformer.name).toBe('mock-transformer');
    });

    it('should transform a source file', async () => {
      await transformer.initialize({});
      const result = await transformer.transform(sourceFile, context);
      
      expect(result.success).toBe(true);
      expect(result.transformedFile).toBeDefined();
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('add');
      expect(result.metrics?.nodesProcessed).toBe(1);
    });

    it('should handle errors during transformation', async () => {
      // Create a transformer that throws
      class ErrorTransformer extends BaseTransformer {
        readonly name = 'error-transformer';
        readonly description = 'Throws errors';
        readonly version = '1.0.0';

        protected async performTransform(): Promise<any> {
          throw new Error('Test error');
        }
      }

      const errorTransformer = new ErrorTransformer();
      await errorTransformer.initialize({});
      
      const result = await errorTransformer.transform(sourceFile, context);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Test error');
    });

    it('should transform multiple files in batch', async () => {
      await transformer.initialize({});
      
      const files = [
        ts.createSourceFile('file1.ts', 'const a = 1;', ts.ScriptTarget.Latest, true),
        ts.createSourceFile('file2.ts', 'const b = 2;', ts.ScriptTarget.Latest, true),
      ];
      
      const result = await transformer.transformBatch(files, context);
      
      expect(result.success).toBe(true);
      expect(result.results.size).toBe(2);
      expect(result.totalErrors).toBe(0);
      expect(result.totalWarnings).toBe(0);
    });
  });

  describe('TransformerRegistry', () => {
    let registry: DefaultTransformerRegistry;
    let transformer: MockTransformer;

    beforeEach(() => {
      registry = new DefaultTransformerRegistry();
      transformer = new MockTransformer();
    });

    it('should register and retrieve transformers', () => {
      registry.register(transformer);
      
      expect(registry.has('mock-transformer')).toBe(true);
      expect(registry.get('mock-transformer')).toBe(transformer);
      expect(registry.getAll()).toHaveLength(1);
    });

    it('should prevent duplicate registration', () => {
      registry.register(transformer);
      
      expect(() => registry.register(transformer)).toThrow(
        'Transformer with name "mock-transformer" is already registered'
      );
    });

    it('should unregister transformers', () => {
      registry.register(transformer);
      const removed = registry.unregister('mock-transformer');
      
      expect(removed).toBe(true);
      expect(registry.has('mock-transformer')).toBe(false);
      expect(registry.size).toBe(0);
    });
  });

  describe('TransformerPipeline', () => {
    let pipeline: DefaultTransformerPipeline;
    let transformer1: MockTransformer;
    let transformer2: MockTransformer;
    let context: TransformContext;

    beforeEach(() => {
      transformer1 = new MockTransformer();
      transformer2 = new MockTransformer();
      // Give them different names to avoid conflicts
      Object.defineProperty(transformer1, 'name', { value: 'mock-transformer-1' });
      Object.defineProperty(transformer2, 'name', { value: 'mock-transformer-2' });
      
      pipeline = new DefaultTransformerPipeline({
        transformers: [transformer1, transformer2],
        stopOnError: false,
      });

      context = {
        program: {} as ts.Program,
        typeChecker: {} as ts.TypeChecker,
        compilerOptions: {},
        workingDirectory: process.cwd(),
        logger: new ConsoleLogger(LogLevel.ERROR),
        sharedState: new Map(),
        config: {},
        plugins: [],
      };
    });

    it('should execute transformers in sequence', async () => {
      const sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      await transformer1.initialize({});
      await transformer2.initialize({});

      const result = await pipeline.execute([sourceFile], context);
      
      expect(result.success).toBe(true);
      expect(result.transformerResults.size).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should add and remove transformers', () => {
      const newTransformer = new MockTransformer();
      pipeline.addTransformer(newTransformer);
      
      const config = pipeline.getConfig();
      expect(config.transformers).toHaveLength(3);
      
      const removed = pipeline.removeTransformer('mock-transformer');
      expect(removed).toBe(true);
      
      const updatedConfig = pipeline.getConfig();
      expect(updatedConfig.transformers).toHaveLength(2);
    });
  });

  describe('ComposableTransformer', () => {
    let composable: DefaultComposableTransformer;
    let transformer1: MockTransformer;
    let transformer2: MockTransformer;

    beforeEach(() => {
      composable = new DefaultComposableTransformer(
        'composed',
        'Composed transformer'
      );
      transformer1 = new MockTransformer();
      transformer2 = new MockTransformer();
      // Give them different names
      Object.defineProperty(transformer1, 'name', { value: 'transformer-1' });
      Object.defineProperty(transformer2, 'name', { value: 'transformer-2' });
    });

    it('should add and chain transformers', () => {
      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);
      
      const transformers = composable.getTransformers();
      expect(transformers).toHaveLength(2);
      expect(transformers[0]).toBe(transformer1);
      expect(transformers[1]).toBe(transformer2);
    });

    it('should prevent duplicate transformers', () => {
      composable.addTransformer(transformer1);
      
      expect(() => composable.addTransformer(transformer1)).toThrow(
        'Transformer "transformer-1" is already in the chain'
      );
    });

    it('should set transformer order', () => {
      // Add two transformers with different names
      const t1 = new MockTransformer();
      const t2 = new MockTransformer();
      Object.defineProperty(t1, 'name', { value: 'transformer-1' });
      Object.defineProperty(t2, 'name', { value: 'transformer-2' });
      
      composable.addTransformer(t1);
      composable.addTransformer(t2);
      
      composable.setOrder(['transformer-2', 'transformer-1']);
      
      const transformers = composable.getTransformers();
      expect(transformers[0]).toBe(t2);
      expect(transformers[1]).toBe(t1);
    });
  });

  describe('Factory Functions', () => {
    it('should create a transformer pipeline', () => {
      const pipeline = createTransformerPipeline({
        transformers: [new MockTransformer()],
        stopOnError: true,
      });
      
      expect(pipeline).toBeDefined();
      expect(pipeline.getConfig().stopOnError).toBe(true);
    });

    it('should create a composable transformer', () => {
      const composable = createComposableTransformer(
        'test-composable',
        [new MockTransformer()],
        'Test composable transformer'
      );
      
      expect(composable).toBeDefined();
      expect(composable.name).toBe('test-composable');
      expect(composable.getTransformers()).toHaveLength(1);
    });
  });
});