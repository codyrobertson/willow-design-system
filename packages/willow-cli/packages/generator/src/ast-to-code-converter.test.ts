/**
 * Tests for AST to Code Converter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as ts from 'typescript';
import { ASTToCodeConverter } from './ast-to-code-converter';
import { OutputFormat } from './types';

describe('ASTToCodeConverter', () => {
  let converter: ASTToCodeConverter;

  beforeEach(() => {
    converter = new ASTToCodeConverter();
  });

  describe('convert', () => {
    it('should convert TypeScript AST to code', () => {
      const sourceCode = `
        interface User {
          name: string;
          age: number;
        }
        
        function greet(user: User): string {
          return \`Hello, \${user.name}!\`;
        }
      `;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile);

      expect(result.code).toBeDefined();
      expect(result.code).toContain('interface User');
      expect(result.code).toContain('function greet');
      expect(result.filePath).toBe('test.ts');
      expect(result.metadata?.format).toBe(OutputFormat.TypeScript);
    });

    it('should strip types when converting to JavaScript', () => {
      const sourceCode = `
        interface User {
          name: string;
          age: number;
        }
        
        function greet(user: User): string {
          return \`Hello, \${user.name}!\`;
        }
        
        const x: number = 42;
      `;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile, {
        format: OutputFormat.JavaScript,
      });

      expect(result.code).not.toContain('interface User');
      expect(result.code).not.toContain(': User');
      expect(result.code).not.toContain(': string');
      expect(result.code).not.toContain(': number');
      expect(result.code).toContain('function greet');
      expect(result.code).toContain('const x = 42');
      expect(result.filePath).toBe('test.js');
    });

    it('should handle JSX format', () => {
      const sourceCode = `
        const Button = ({ onClick, children }) => {
          return <button onClick={onClick}>{children}</button>;
        };
      `;

      const sourceFile = ts.createSourceFile(
        'button.tsx',
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const result = converter.convert(sourceFile, {
        format: OutputFormat.JSX,
      });

      expect(result.code).toContain('/** @jsx React.createElement */');
      expect(result.code).toContain('<button');
      expect(result.filePath).toBe('button.jsx');
    });

    it('should preserve comments when configured', () => {
      const sourceCode = `
        // This is a comment
        /**
         * This is a JSDoc comment
         */
        function test() {
          // Inner comment
          return 42;
        }
      `;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile, {
        preserveComments: true,
      });

      expect(result.code).toContain('This is a comment');
      expect(result.code).toContain('This is a JSDoc comment');
      expect(result.code).toContain('Inner comment');
    });

    it('should generate metadata', () => {
      const sourceCode = `const x = 1;`;
      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.timestamp).toBeInstanceOf(Date);
      expect(result.metadata?.version).toBe('1.0.0');
      expect(result.metadata?.sourceFile).toBe('test.ts');
      expect(result.metadata?.nodeCount).toBeGreaterThan(0);
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('convertNode', () => {
    it('should convert single AST node to code', () => {
      const sourceFile = ts.createSourceFile(
        'test.ts',
        'const x = 42; function test() { return x; }',
        ts.ScriptTarget.Latest,
        true
      );

      // Find the function declaration node
      let functionNode: ts.FunctionDeclaration | undefined;
      ts.forEachChild(sourceFile, node => {
        if (ts.isFunctionDeclaration(node)) {
          functionNode = node;
        }
      });

      expect(functionNode).toBeDefined();
      
      const code = converter.convertNode(functionNode!);
      expect(code).toContain('function test()');
      expect(code).toContain('return x');
    });

    it('should handle type stripping for single nodes', () => {
      const sourceFile = ts.createSourceFile(
        'test.ts',
        'function test(x: number): string { return x.toString(); }',
        ts.ScriptTarget.Latest,
        true
      );

      let functionNode: ts.FunctionDeclaration | undefined;
      ts.forEachChild(sourceFile, node => {
        if (ts.isFunctionDeclaration(node)) {
          functionNode = node;
        }
      });

      const code = converter.convertNode(functionNode!, {
        format: OutputFormat.JavaScript,
      });

      expect(code).toContain('function test');
      expect(code).not.toContain(': number');
      expect(code).not.toContain(': string');
    });
  });

  describe('convertBatch', () => {
    it('should convert multiple source files', () => {
      const sourceFiles = [
        ts.createSourceFile(
          'file1.ts',
          'const x = 1;',
          ts.ScriptTarget.Latest,
          true
        ),
        ts.createSourceFile(
          'file2.ts',
          'const y = 2;',
          ts.ScriptTarget.Latest,
          true
        ),
        ts.createSourceFile(
          'file3.ts',
          'const z = 3;',
          ts.ScriptTarget.Latest,
          true
        ),
      ];

      const results = converter.convertBatch(sourceFiles);

      expect(results).toHaveLength(3);
      expect(results[0].code).toContain('const x = 1');
      expect(results[1].code).toContain('const y = 2');
      expect(results[2].code).toContain('const z = 3');
      expect(results[0].filePath).toBe('file1.ts');
      expect(results[1].filePath).toBe('file2.ts');
      expect(results[2].filePath).toBe('file3.ts');
    });

    it('should apply same options to all files in batch', () => {
      const sourceFiles = [
        ts.createSourceFile(
          'file1.ts',
          'const x: number = 1;',
          ts.ScriptTarget.Latest,
          true
        ),
        ts.createSourceFile(
          'file2.ts',
          'const y: string = "hello";',
          ts.ScriptTarget.Latest,
          true
        ),
      ];

      const results = converter.convertBatch(sourceFiles, {
        format: OutputFormat.JavaScript,
      });

      expect(results[0].code).not.toContain(': number');
      expect(results[1].code).not.toContain(': string');
      expect(results[0].filePath).toBe('file1.js');
      expect(results[1].filePath).toBe('file2.js');
    });
  });

  describe('format transformations', () => {
    it('should handle CommonJS format', () => {
      const sourceCode = `
        import { readFile } from 'fs';
        import path from 'path';
        
        export function test() {
          return 42;
        }
        
        export default class MyClass {}
      `;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile, {
        format: OutputFormat.CommonJS,
      });

      expect(result.code).toContain('require');
      expect(result.code).toContain('module.exports');
      expect(result.filePath).toBe('test.cjs');
    });

    it('should handle ES module format', () => {
      const sourceCode = `
        import { something } from './other-file';
        export const value = 42;
      `;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile, {
        format: OutputFormat.ESModule,
      });

      expect(result.code).toContain("from './other-file.js'");
      expect(result.filePath).toBe('test.mjs');
    });
  });

  describe('edge cases', () => {
    it('should handle empty source file', () => {
      const sourceFile = ts.createSourceFile(
        'empty.ts',
        '',
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile);
      expect(result.code).toBe('');
      expect(result.metadata?.nodeCount).toBeGreaterThanOrEqual(1); // At least SourceFile node
    });

    it('should handle complex type transformations', () => {
      const sourceCode = `
        type Nullable<T> = T | null;
        interface Generic<T, U extends string = "default"> {
          value: T;
          key: U;
        }
        
        const fn = <T extends object>(arg: T): T & { id: string } => {
          return { ...arg, id: "123" };
        };
      `;

      const sourceFile = ts.createSourceFile(
        'complex.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = converter.convert(sourceFile, {
        format: OutputFormat.JavaScript,
      });

      expect(result.code).not.toContain('type Nullable');
      expect(result.code).not.toContain('interface Generic');
      expect(result.code).not.toContain('<T extends object>');
      expect(result.code).toContain('const fn =');
    });

    it('should handle decorators', () => {
      const sourceCode = `
        @decorator
        class MyClass {
          @readonly
          property = 42;
          
          @logged
          method() {
            return this.property;
          }
        }
      `;

      const sourceFile = ts.createSourceFile(
        'decorators.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
      );

      const result = converter.convert(sourceFile);
      expect(result.code).toContain('@decorator');
      expect(result.code).toContain('@readonly');
      expect(result.code).toContain('@logged');
    });
  });
});