/**
 * Tests for namespace and alias transformer
 * Task 5.5: Build namespace and alias handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as ts from 'typescript';
import {
  NamespaceAliasTransformer,
  NamespaceAliasConfig,
  TransformContext,
  ConsoleLogger,
  LogLevel,
} from '../src';

describe('NamespaceAliasTransformer', () => {
  let transformer: NamespaceAliasTransformer;
  let context: TransformContext;

  beforeEach(() => {
    transformer = new NamespaceAliasTransformer();
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

  describe('Namespace imports', () => {
    it('should transform namespace import names', async () => {
      const config: NamespaceAliasConfig = {
        namespaceMapping: {
          'OldNamespace': 'NewNamespace',
          'Utils': 'Helpers',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import * as OldNamespace from './old-module';
import * as Utils from './utils';
import * as Unchanged from './unchanged';

const result = OldNamespace.someFunction();
const helper = Utils.helperFunction();
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.namespacesTransformed).toBe(2);
      expect(result.data?.transformations).toHaveLength(2);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import * as NewNamespace');
      expect(transformedCode).toContain('import * as Helpers');
      expect(transformedCode).toContain('import * as Unchanged'); // Should remain unchanged
      expect(transformedCode).toContain('NewNamespace.someFunction()');
      expect(transformedCode).toContain('Helpers.helperFunction()');
    });

    it('should convert namespace imports to default imports', async () => {
      const config: NamespaceAliasConfig = {
        convertNamespaceImports: true,
      };

      await transformer.initialize(config);

      const sourceCode = `
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const element = React.createElement('div');
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
      expect(result.data?.namespacesTransformed).toBe(1); // Only React should convert

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      
      expect(transformedCode).toContain('import React from \'react\'');
      expect(transformedCode).not.toContain('import * as React from');
      expect(transformedCode).toContain('import * as ReactDOM'); // ReactDOM should not convert
    });
  });

  describe('Import aliases', () => {
    it('should transform import aliases', async () => {
      const config: NamespaceAliasConfig = {
        aliasMapping: {
          'OldButton': 'NewButton',
          'OldInput': 'NewInput',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import { Button as OldButton, Input as OldInput } from './components';
import { Select as MySelect } from './components';

const App = () => (
  <div>
    <OldButton />
    <OldInput />
    <MySelect />
  </div>
);
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
      expect(result.data?.aliasesTransformed).toBe(2);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('Button as NewButton');
      expect(transformedCode).toContain('Input as NewInput');
      expect(transformedCode).toContain('Select as MySelect'); // Unchanged
      // Note: The usage in JSX would need additional transformation logic
    });
  });

  describe('Star imports conversion', () => {
    it('should convert star imports to named imports', async () => {
      const config: NamespaceAliasConfig = {
        convertStarImports: true,
        starImportConversions: {
          'lodash': ['debounce', 'throttle', 'cloneDeep'],
          './utils': ['formatDate', 'parseDate'],
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import * as _ from 'lodash';
import * as utils from './utils';
import * as other from './other';

const debouncedFn = _.debounce(() => {}, 300);
const formatted = utils.formatDate(new Date());
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.starImportsConverted).toBe(2);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import { debounce, throttle, cloneDeep } from \'lodash\'');
      expect(transformedCode).toContain('import { formatDate, parseDate } from \'./utils\'');
      expect(transformedCode).toContain('import * as other'); // Unchanged
    });

    it('should handle empty star import conversions', async () => {
      const config: NamespaceAliasConfig = {
        convertStarImports: true,
        starImportConversions: {
          'lodash': [], // Empty array
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import * as _ from 'lodash';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.starImportsConverted).toBe(0);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import * as _'); // Should remain unchanged
    });
  });

  describe('Re-exports', () => {
    it('should transform re-export paths', async () => {
      const config: NamespaceAliasConfig = {
        reExportMapping: {
          './old-components': './new-components',
          '@old/ui': '@new/ui',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
export * from './old-components';
export { Button, Input } from '@old/ui';
export { Select } from './unchanged';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.reExportsTransformed).toBe(2);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('export * from "./new-components"');
      expect(transformedCode).toContain('export { Button, Input } from "@new/ui"');
      expect(transformedCode).toContain('export { Select } from \'./unchanged\'');
    });

    it('should transform export aliases', async () => {
      const config: NamespaceAliasConfig = {
        aliasMapping: {
          'OldButton': 'NewButton',
          'OldInput': 'NewInput',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
export { Button as OldButton, Input as OldInput } from './components';
export { default as OldDefault } from './default';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.aliasesTransformed).toBe(2);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('Button as NewButton');
      expect(transformedCode).toContain('Input as NewInput');
    });
  });

  describe('Type-only imports/exports', () => {
    it('should preserve type-only imports when configured', async () => {
      const config: NamespaceAliasConfig = {
        preserveTypeOnly: true,
        namespaceMapping: {
          'Types': 'NewTypes',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import type { SomeType } from './types';
import type * as Types from './all-types';
export type { OtherType } from './other-types';
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.namespacesTransformed).toBe(1);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import type * as NewTypes');
      expect(transformedCode).toContain('import type { SomeType }');
      expect(transformedCode).toContain('export type { OtherType }');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle mixed transformations', async () => {
      const config: NamespaceAliasConfig = {
        namespaceMapping: {
          'OldNS': 'NewNS',
        },
        aliasMapping: {
          'OldAlias': 'NewAlias',
        },
        convertStarImports: true,
        starImportConversions: {
          'utils': ['helper1', 'helper2'],
        },
        reExportMapping: {
          './old': './new',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import * as OldNS from './namespace';
import { Component as OldAlias } from './component';
import * as utils from 'utils';
export * from './old';

const x = OldNS.function1();
const y = OldAlias;
const z = utils.helper1();
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.namespacesTransformed).toBe(1);
      expect(result.data?.aliasesTransformed).toBe(1);
      expect(result.data?.starImportsConverted).toBe(1);
      expect(result.data?.reExportsTransformed).toBe(1);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import * as NewNS');
      expect(transformedCode).toContain('Component as NewAlias');
      expect(transformedCode).toContain('import { helper1, helper2 }');
      expect(transformedCode).toContain('export * from "./new"');
    });

    it('should handle nested namespace access', async () => {
      const config: NamespaceAliasConfig = {
        namespaceMapping: {
          'OldAPI': 'NewAPI',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
import * as OldAPI from './api';

const data = OldAPI.users.getAll();
const user = OldAPI.users.getById(1);
const post = OldAPI.posts.create({ title: 'Test' });
`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      expect(result.success).toBe(true);
      expect(result.data?.namespacesTransformed).toBe(1);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('import * as NewAPI');
      expect(transformedCode).toContain('NewAPI.users.getAll()');
      expect(transformedCode).toContain('NewAPI.users.getById(1)');
      expect(transformedCode).toContain('NewAPI.posts.create');
    });
  });

  describe('Edge cases', () => {
    it('should handle files with no imports', async () => {
      const config: NamespaceAliasConfig = {
        namespaceMapping: {
          'Test': 'NewTest',
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
      expect(result.data?.namespacesTransformed).toBe(0);
      expect(result.data?.aliasesTransformed).toBe(0);
    });

    it('should not transform non-imported identifiers', async () => {
      const config: NamespaceAliasConfig = {
        namespaceMapping: {
          'Utils': 'Helpers',
        },
        aliasMapping: {
          'Button': 'NewButton',
        },
      };

      await transformer.initialize(config);

      const sourceCode = `
// Local variables with same names
const Utils = { helper: () => {} };
const Button = () => <div>Button</div>;

// Should not be transformed
const result = Utils.helper();
const component = Button();
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
      expect(result.data?.namespacesTransformed).toBe(0);
      expect(result.data?.aliasesTransformed).toBe(0);

      const transformedCode = ts.createPrinter().printFile(result.transformedFile!);
      expect(transformedCode).toContain('const Utils =');
      expect(transformedCode).toContain('const Button =');
      expect(transformedCode).not.toContain('Helpers');
      expect(transformedCode).not.toContain('NewButton');
    });
  });
});