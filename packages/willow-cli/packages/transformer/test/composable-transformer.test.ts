/**
 * Tests for composable transformer
 * Task 5.8: Create transformer composition system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as ts from 'typescript';
import {
  DefaultComposableTransformer,
  createComposableTransformer,
  TransformContext,
  TransformResult,
  ConsoleLogger,
  LogLevel,
  Transformer,
  BaseTransformer,
} from '../src/transformer-api';

// Mock transformer for testing
class MockTransformer extends BaseTransformer {
  constructor(
    public name: string,
    private transformFn?: (file: ts.SourceFile) => ts.SourceFile,
    private canTransformFn?: (file: ts.SourceFile) => boolean
  ) {
    super();
    this.description = `Mock transformer ${name}`;
    this.version = '1.0.0';
  }

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
    const transformedFile = this.transformFn
      ? this.transformFn(sourceFile)
      : sourceFile;

    collectors.changes.push({
      type: 'modify',
      description: `Applied ${this.name}`,
      file: sourceFile.fileName,
    });

    return {
      transformedFile,
      data: { transformed: true },
      nodesProcessed: 10,
    };
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    return this.canTransformFn ? this.canTransformFn(sourceFile) : true;
  }
}

describe('ComposableTransformer', () => {
  let composable: DefaultComposableTransformer;
  let context: TransformContext;
  let mockLogger: ConsoleLogger;

  beforeEach(() => {
    mockLogger = new ConsoleLogger(LogLevel.ERROR);
    vi.spyOn(mockLogger, 'info').mockImplementation(() => {});
    vi.spyOn(mockLogger, 'warn').mockImplementation(() => {});
    vi.spyOn(mockLogger, 'error').mockImplementation(() => {});

    context = {
      program: {} as ts.Program,
      typeChecker: {} as ts.TypeChecker,
      compilerOptions: {},
      workingDirectory: process.cwd(),
      logger: mockLogger,
      sharedState: new Map(),
      config: {},
      plugins: [],
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Transformer management', () => {
    it('should add transformers to the chain', () => {
      composable = new DefaultComposableTransformer('test-composable');
      
      const transformer1 = new MockTransformer('transformer1');
      const transformer2 = new MockTransformer('transformer2');

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);

      const transformers = composable.getTransformers();
      expect(transformers).toHaveLength(2);
      expect(transformers[0].name).toBe('transformer1');
      expect(transformers[1].name).toBe('transformer2');
    });

    it('should not allow duplicate transformers', () => {
      composable = new DefaultComposableTransformer('test-composable');
      
      const transformer = new MockTransformer('duplicate');
      composable.addTransformer(transformer);

      expect(() => composable.addTransformer(transformer)).toThrow(
        'Transformer "duplicate" is already in the chain'
      );
    });

    it('should remove transformers from the chain', () => {
      composable = new DefaultComposableTransformer('test-composable');
      
      const transformer1 = new MockTransformer('transformer1');
      const transformer2 = new MockTransformer('transformer2');

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);

      const removed = composable.removeTransformer('transformer1');
      expect(removed).toBe(true);

      const transformers = composable.getTransformers();
      expect(transformers).toHaveLength(1);
      expect(transformers[0].name).toBe('transformer2');
    });

    it('should return false when removing non-existent transformer', () => {
      composable = new DefaultComposableTransformer('test-composable');
      
      const removed = composable.removeTransformer('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Transformer ordering', () => {
    it('should set custom execution order', () => {
      composable = new DefaultComposableTransformer('test-composable');
      
      const transformer1 = new MockTransformer('first');
      const transformer2 = new MockTransformer('second');
      const transformer3 = new MockTransformer('third');

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);
      composable.addTransformer(transformer3);

      // Set reverse order
      composable.setOrder(['third', 'first', 'second']);

      const transformers = composable.getTransformers();
      expect(transformers[0].name).toBe('third');
      expect(transformers[1].name).toBe('first');
      expect(transformers[2].name).toBe('second');
    });

    it('should validate order contains all transformers', () => {
      composable = new DefaultComposableTransformer('test-composable');
      
      composable.addTransformer(new MockTransformer('one'));
      composable.addTransformer(new MockTransformer('two'));

      expect(() => composable.setOrder(['one'])).toThrow(
        'Order must include all transformers'
      );
    });

    it('should validate order contains valid transformer names', () => {
      composable = new DefaultComposableTransformer('test-composable');
      
      composable.addTransformer(new MockTransformer('valid'));

      expect(() => composable.setOrder(['valid', 'invalid'])).toThrow(
        'Transformer "invalid" not found in chain'
      );
    });
  });

  describe('Transformation chaining', () => {
    it('should chain transformations in order', async () => {
      composable = new DefaultComposableTransformer('test-composable');

      const transformations: string[] = [];

      // Create transformers that track execution order
      const transformer1 = new MockTransformer('step1', (file) => {
        transformations.push('step1');
        return file;
      });

      const transformer2 = new MockTransformer('step2', (file) => {
        transformations.push('step2');
        return file;
      });

      const transformer3 = new MockTransformer('step3', (file) => {
        transformations.push('step3');
        return file;
      });

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);
      composable.addTransformer(transformer3);

      // Initialize after adding transformers
      await composable.initialize({});

      const sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const result = await composable.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(transformations).toEqual(['step1', 'step2', 'step3']);
      expect(result.changes).toHaveLength(3);
    });

    it('should pass transformed file between transformers', async () => {
      composable = new DefaultComposableTransformer('test-composable');

      // Create transformers that modify the source
      const addComment = new MockTransformer('addComment', (file) => {
        const newStatements = [
          ts.factory.createExpressionStatement(
            ts.factory.createIdentifier('// Added by addComment')
          ),
          ...file.statements,
        ];
        return ts.factory.updateSourceFile(file, newStatements);
      });

      const addExport = new MockTransformer('addExport', (file) => {
        const exportStatement = ts.factory.createExportAssignment(
          undefined,
          undefined,
          undefined,
          ts.factory.createIdentifier('x')
        );
        const newStatements = [...file.statements, exportStatement];
        return ts.factory.updateSourceFile(file, newStatements);
      });

      composable.addTransformer(addComment);
      composable.addTransformer(addExport);
      
      // Initialize after adding transformers
      await composable.initialize({});

      const sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const result = await composable.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.transformedFile).toBeDefined();
      expect(result.transformedFile!.statements.length).toBeGreaterThan(
        sourceFile.statements.length
      );
    });

    it('should skip transformers that cannot transform the file', async () => {
      composable = new DefaultComposableTransformer('test-composable');

      const executed: string[] = [];

      const alwaysTransform = new MockTransformer('always', (file) => {
        executed.push('always');
        return file;
      });

      const neverTransform = new MockTransformer(
        'never',
        (file) => {
          executed.push('never');
          return file;
        },
        () => false // canTransform returns false
      );

      const sometimesTransform = new MockTransformer('sometimes', (file) => {
        executed.push('sometimes');
        return file;
      });

      composable.addTransformer(alwaysTransform);
      composable.addTransformer(neverTransform);
      composable.addTransformer(sometimesTransform);
      
      // Initialize after adding transformers
      await composable.initialize({});

      const sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const result = await composable.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(executed).toEqual(['always', 'sometimes']);
      expect(executed).not.toContain('never');
    });

    it('should stop chain on transformer failure', async () => {
      composable = new DefaultComposableTransformer('test-composable');

      const executed: string[] = [];

      const successTransformer = new MockTransformer('success', (file) => {
        executed.push('success');
        return file;
      });

      // Create a failing transformer
      const failingTransformer = new MockTransformer('failing');
      
      composable.addTransformer(successTransformer);
      composable.addTransformer(failingTransformer);
      
      const afterFailTransformer = new MockTransformer('afterFail', (file) => {
        executed.push('afterFail');
        return file;
      });
      
      composable.addTransformer(afterFailTransformer);
      
      // Initialize after adding transformers
      await composable.initialize({});
      
      // Mock the transform method after initialization
      vi.spyOn(failingTransformer, 'transform').mockResolvedValue({
        success: false,
        errors: [{ code: 'TEST_ERROR', message: 'Test error' }],
        warnings: [],
        changes: [],
      });

      const sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const result = await composable.transform(sourceFile, context);

      expect(result.success).toBe(false);
      expect(executed).toEqual(['success']); // afterFail should not execute
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Batch transformation', () => {
    it('should transform multiple files in batch', async () => {
      composable = new DefaultComposableTransformer('test-composable');

      const transformer1 = new MockTransformer('transformer1');
      const transformer2 = new MockTransformer('transformer2');

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);
      
      // Initialize after adding transformers
      await composable.initialize({});

      const sourceFiles = [
        ts.createSourceFile('file1.ts', 'const a = 1;', ts.ScriptTarget.Latest, true),
        ts.createSourceFile('file2.ts', 'const b = 2;', ts.ScriptTarget.Latest, true),
        ts.createSourceFile('file3.ts', 'const c = 3;', ts.ScriptTarget.Latest, true),
      ];

      const result = await composable.transformBatch(sourceFiles, context);

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(3);
      expect(result.totalErrors).toBe(0);

      // Each file should have changes from both transformers
      for (const [_, fileResult] of result.results) {
        expect(fileResult.changes).toHaveLength(2);
      }
    });

    it('should accumulate metrics from all transformers', async () => {
      composable = new DefaultComposableTransformer('test-composable');

      const transformer1 = new MockTransformer('metrics1');
      const transformer2 = new MockTransformer('metrics2');

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);
      
      // Initialize after adding transformers
      await composable.initialize({});

      const sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const result = await composable.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.metrics?.nodesProcessed).toBe(20); // 10 from each transformer
    });
  });

  describe('Lifecycle management', () => {
    it('should initialize all transformers', async () => {
      composable = new DefaultComposableTransformer('test-composable');

      const transformer1 = new MockTransformer('init1');
      const transformer2 = new MockTransformer('init2');

      const init1Spy = vi.spyOn(transformer1, 'initialize');
      const init2Spy = vi.spyOn(transformer2, 'initialize');

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);

      const config = { test: true };
      await composable.initialize(config);

      expect(init1Spy).toHaveBeenCalledWith(config);
      expect(init2Spy).toHaveBeenCalledWith(config);
    });

    it('should dispose all transformers', async () => {
      composable = new DefaultComposableTransformer('test-composable');
      await composable.initialize({});

      const transformer1 = new MockTransformer('dispose1');
      const transformer2 = new MockTransformer('dispose2');

      const dispose1Spy = vi.spyOn(transformer1, 'dispose');
      const dispose2Spy = vi.spyOn(transformer2, 'dispose');

      composable.addTransformer(transformer1);
      composable.addTransformer(transformer2);

      await composable.dispose();

      expect(dispose1Spy).toHaveBeenCalled();
      expect(dispose2Spy).toHaveBeenCalled();
    });
  });

  describe('Factory function', () => {
    it('should create composable transformer with initial transformers', () => {
      const transformer1 = new MockTransformer('factory1');
      const transformer2 = new MockTransformer('factory2');

      const composable = createComposableTransformer(
        'factory-test',
        [transformer1, transformer2],
        'Test composable',
        '2.0.0'
      );

      expect(composable.name).toBe('factory-test');
      expect(composable.description).toBe('Test composable');
      expect(composable.version).toBe('2.0.0');
      expect(composable.getTransformers()).toHaveLength(2);
    });

    it('should create empty composable transformer', () => {
      const composable = createComposableTransformer('empty-test');

      expect(composable.name).toBe('empty-test');
      expect(composable.getTransformers()).toHaveLength(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should compose import and namespace transformers', async () => {
      // This test demonstrates real-world composition
      const ImportTransformer = new MockTransformer('import-transformer', (file) => {
        // Simulate import path transformation
        return ts.factory.updateSourceFile(file, [
          ts.factory.createImportDeclaration(
            undefined,
            undefined,
            ts.factory.createImportClause(
              false,
              ts.factory.createIdentifier('React'),
              undefined
            ),
            ts.factory.createStringLiteral('react')
          ),
          ...file.statements,
        ]);
      });

      const NamespaceTransformer = new MockTransformer('namespace-transformer', (file) => {
        // Simulate namespace transformation
        return file; // Would normally transform namespace usage
      });

      composable = createComposableTransformer(
        'import-namespace-pipeline',
        [ImportTransformer, NamespaceTransformer]
      );

      await composable.initialize({});

      const sourceFile = ts.createSourceFile(
        'component.tsx',
        'const Component = () => <div>Hello</div>;',
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const result = await composable.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.changes).toHaveLength(2);
      expect(result.transformedFile!.statements.length).toBeGreaterThan(
        sourceFile.statements.length
      );
    });

    it('should handle conditional transformation pipeline', async () => {
      const jsOnlyTransformer = new MockTransformer(
        'js-only',
        (file) => file,
        (file) => file.fileName.endsWith('.js')
      );

      const tsOnlyTransformer = new MockTransformer(
        'ts-only',
        (file) => file,
        (file) => file.fileName.endsWith('.ts')
      );

      const allFilesTransformer = new MockTransformer('all-files');

      composable = createComposableTransformer('conditional-pipeline', [
        jsOnlyTransformer,
        tsOnlyTransformer,
        allFilesTransformer,
      ]);

      await composable.initialize({});

      // Test with TypeScript file
      const tsFile = ts.createSourceFile(
        'test.ts',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const tsResult = await composable.transform(tsFile, context);
      expect(tsResult.success).toBe(true);
      expect(tsResult.changes).toHaveLength(2); // ts-only and all-files

      // Test with JavaScript file
      const jsFile = ts.createSourceFile(
        'test.js',
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const jsResult = await composable.transform(jsFile, context);
      expect(jsResult.success).toBe(true);
      expect(jsResult.changes).toHaveLength(2); // js-only and all-files
    });
  });
});