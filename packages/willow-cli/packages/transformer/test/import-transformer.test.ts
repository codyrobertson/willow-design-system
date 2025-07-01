/**
 * Tests for import transformer
 * Task 5.2: Implement import transformation logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as ts from 'typescript';
import {
  ImportTransformer,
  ImportTransformerConfig,
  TransformContext,
  ConsoleLogger,
  LogLevel,
} from '../src';

describe('ImportTransformer', () => {
  let transformer: ImportTransformer;
  let context: TransformContext;

  beforeEach(() => {
    transformer = new ImportTransformer();
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

  describe('Basic import transformations', () => {
    it('should transform import paths based on mappings', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          '@old/ui': '@new/ui',
          'old-lib': 'new-lib',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import { Button } from '@old/ui';
import utils from 'old-lib';
import { Component } from 'react';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.importsTransformed).toBe(2);
      expect(result.data?.pathChanges).toHaveLength(2);
      expect(result.data?.pathChanges[0]).toEqual({
        from: '@old/ui',
        to: '@new/ui',
        line: 2,
      });
      expect(result.data?.pathChanges[1]).toEqual({
        from: 'old-lib',
        to: 'new-lib',
        line: 3,
      });

      // Check the transformed code
      const printer = ts.createPrinter();
      const transformedCode = printer.printFile(result.transformedFile!);
      
      expect(transformedCode).toContain('@new/ui');
      expect(transformedCode).toContain('new-lib');
      expect(transformedCode).toContain('react'); // Unchanged
    });

    it('should handle prefix-based path mappings', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          '@company/old-': '@company/new-',
          '../old/': '../new/',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import { Widget } from '@company/old-widgets';
import { Helper } from '@company/old-utils';
import styles from '../old/styles.css';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.importsTransformed).toBe(3);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('@company/new-widgets');
      expect(transformedCode).toContain('@company/new-utils');
      expect(transformedCode).toContain('../new/styles.css');
    });
  });

  describe('Dynamic imports', () => {
    it('should transform dynamic imports with string literals', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          './old-module': './new-module',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
async function loadModule() {
  const module = await import('./old-module');
  return module;
}
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.importsTransformed).toBe(1);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import("./new-module")');
    });

    it('should warn about non-literal dynamic imports', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          './old-module': './new-module',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
async function loadModule(name: string) {
  const module = await import(name);
  return module;
}
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('DYNAMIC_IMPORT_NON_LITERAL');
    });
  });

  describe('Global imports', () => {
    it('should add global imports to files', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {},
        globalImports: [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
          {
            moduleSpecifier: '@emotion/styled',
            defaultImport: 'styled',
          },
          {
            moduleSpecifier: 'utils',
            namedImports: ['helper1', 'helper2'],
          },
        ],
      };

      await transformer.initialize(config);

      const sourceCode = `
const Component = () => <div>Hello</div>;
`;

      const sourceFile = ts.createSourceFile(
        'test.tsx',
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.importsAdded).toBe(3);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import React from "react"');
      expect(transformedCode).toContain('import styled from "@emotion/styled"');
      expect(transformedCode).toContain('import { helper1, helper2 } from "utils"');
    });

    it('should not add duplicate global imports', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {},
        globalImports: [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
        ],
      };

      await transformer.initialize(config);

      const sourceCode = `
import React from 'react';
const Component = () => <div>Hello</div>;
`;

      const sourceFile = ts.createSourceFile(
        'test.tsx',
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.importsAdded).toBe(0);
    });
  });

  describe('Import sorting', () => {
    it('should sort imports according to configured order', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {},
        sortImports: true,
        importOrder: ['react', '@', '~', './', '../'],
      };

      await transformer.initialize(config);

      const sourceCode = `
import { helper } from './utils';
import { Button } from '@ui/components';
import React from 'react';
import styles from '../styles.css';
import { api } from '~/api';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.changes.some(c => c.description === 'Sorted import statements')).toBe(true);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      const lines = transformedCode.split('\n').filter(line => line.includes('import'));
      
      // Check order: react first, then @, then ~, then ./, then ../
      expect(lines[0]).toContain('react');
      expect(lines[1]).toContain('@ui/components');
      expect(lines[2]).toContain('~/api');
      expect(lines[3]).toContain('./utils');
      expect(lines[4]).toContain('../styles.css');
    });

    it('should handle imports without configured order', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {},
        sortImports: true,
      };

      await transformer.initialize(config);

      const sourceCode = `
import z from 'zebra';
import a from 'aardvark';
import m from 'mongoose';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      const lines = transformedCode.split('\n').filter(line => line.includes('import'));
      
      // Should be alphabetically sorted
      expect(lines[0]).toContain('aardvark');
      expect(lines[1]).toContain('mongoose');
      expect(lines[2]).toContain('zebra');
    });
  });

  describe('Edge cases', () => {
    it('should handle files with no imports', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          'old': 'new',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
const x = 1;
export default x;
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.importsTransformed).toBe(0);
    });

    it('should handle side-effect imports', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          './old-styles.css': './new-styles.css',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import './old-styles.css';
import 'polyfill';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.importsTransformed).toBe(1);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('./new-styles.css');
      expect(transformedCode).toContain('polyfill');
    });

    it('should handle export from statements', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          '@old/ui': '@new/ui',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
export { Button } from '@old/ui';
export * from '@old/ui/types';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      // Note: Current implementation doesn't handle export statements
      // This test documents current behavior
      expect(result.success).toBe(true);
      expect(result.data?.importsTransformed).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should handle files with many imports efficiently', async () => {
      const config: ImportTransformerConfig = {
        pathMappings: {
          '@old/': '@new/',
        },
        sortImports: true,
      };

      await transformer.initialize(config);

      // Generate source with many imports
      const imports = Array.from({ length: 100 }, (_, i) => 
        `import { Component${i} } from '@old/component${i}';`
      ).join('\n');

      const sourceCode = `
${imports}
const x = 1;
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const startTime = Date.now();
      const result = await transformer.transform(sourceFile, context);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.importsTransformed).toBe(100);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});