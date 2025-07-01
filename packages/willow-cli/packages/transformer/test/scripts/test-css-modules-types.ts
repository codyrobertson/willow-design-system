#!/usr/bin/env npx tsx

import type {
  CSSModule,
  CSSModuleClass,
  CSSRule,
  CSSModuleImport,
  CSSModulesTransformOptions,
  CSSModuleParseResult,
  CSSModulesConfig,
  CSSModuleTypeDefinition,
  CSSModuleComposition,
  CSSModuleValidationResult,
  CSSModuleValidationError,
  CSSModuleUsageContext,
} from '../../src/types/css-modules.types';
import { StyleType } from '../../src/types/style-transformation.types';

console.log('🧪 Testing CSS Modules Type Definitions...\n');

let testsPassed = 0;
let testsFailed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    testsFailed++;
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Run tests
(async () => {
  // Test 1: CSSModuleClass interface
  await test('CSSModuleClass interface', () => {
    const cssClass: CSSModuleClass = {
      originalName: 'button',
      localName: 'button__abc123',
      globalName: 'btn',
      isComposed: true,
      composesFrom: ['base-button', 'themed-button'],
      rules: [
        { property: 'color', value: 'blue' },
        { property: 'padding', value: '10px', important: true },
      ],
    };

    assert(cssClass.originalName === 'button');
    assert(cssClass.localName === 'button__abc123');
    assert(cssClass.isComposed === true);
    assert(cssClass.composesFrom?.length === 2);
    assert(cssClass.rules?.length === 2);
  });

  // Test 2: CSSModule interface
  await test('CSSModule interface', () => {
    const module: CSSModule = {
      filePath: '/styles/Button.module.css',
      classes: new Map([
        ['button', {
          originalName: 'button',
          localName: 'button__xyz789',
        }],
        ['primary', {
          originalName: 'primary',
          localName: 'primary__xyz789',
        }],
      ]),
      variables: new Map([
        ['--primary-color', '#007bff'],
        ['--button-padding', '8px 16px'],
      ]),
      imports: [{
        from: './base.module.css',
        imports: new Map([['baseButton', 'button']]),
      }],
      exports: new Map([['default', 'button']]),
    };

    assert(module.filePath === '/styles/Button.module.css');
    assert(module.classes.size === 2);
    assert(module.variables?.size === 2);
    assert(module.imports?.length === 1);
  });

  // Test 3: CSSModulesTransformOptions interface
  await test('CSSModulesTransformOptions interface', () => {
    const options: CSSModulesTransformOptions = {
      generateTypeDefinitions: true,
      generateScopedName: (name, filename, css) => `${name}__${filename.replace(/\W/g, '_')}`,
      preserveOriginalNames: true,
      transformVariables: true,
      variableTransformer: (name, value) => ({
        name: name.replace('--', 'var_'),
        value: value.toUpperCase(),
      }),
      resolveImports: true,
      baseDir: '/src/styles',
    };

    assert(options.generateTypeDefinitions === true);
    assert(typeof options.generateScopedName === 'function');
    assert(options.generateScopedName('button', 'Button.css', '') === 'button__Button_css');
  });

  // Test 4: CSSModuleImport interface
  await test('CSSModuleImport interface', () => {
    const moduleImport: CSSModuleImport = {
      from: '../shared/theme.module.css',
      imports: new Map([
        ['primaryButton', 'primary'],
        ['secondaryButton', 'secondary'],
      ]),
      isValueImport: true,
    };

    assert(moduleImport.from === '../shared/theme.module.css');
    assert(moduleImport.imports.size === 2);
    assert(moduleImport.imports.get('primaryButton') === 'primary');
    assert(moduleImport.isValueImport === true);
  });

  // Test 5: CSSModulesConfig interface
  await test('CSSModulesConfig interface', () => {
    const config: CSSModulesConfig = {
      pattern: /\.module\.(css|scss|sass)$/,
      searchDirs: ['/src/styles', '/src/components'],
      autoImport: true,
      namingConvention: 'camelCase',
      exportType: 'named',
    };

    assert(config.pattern?.test('Button.module.css') === true);
    assert(config.pattern?.test('Button.css') === false);
    assert(config.searchDirs?.length === 2);
    assert(config.namingConvention === 'camelCase');
  });

  // Test 6: CSSModuleTypeDefinition interface
  await test('CSSModuleTypeDefinition interface', () => {
    const typeDef: CSSModuleTypeDefinition = {
      modulePath: './Button.module.css',
      classes: {
        button: 'button__abc123',
        primary: 'primary__abc123',
        secondary: 'secondary__abc123',
      },
      variables: {
        primaryColor: 'var(--primary-color)',
        buttonPadding: 'var(--button-padding)',
      },
      code: `export const button: string;\nexport const primary: string;`,
    };

    assert(typeDef.modulePath === './Button.module.css');
    assert(Object.keys(typeDef.classes).length === 3);
    assert(typeDef.variables && Object.keys(typeDef.variables).length === 2);
    assert(typeDef.code.includes('export const button'));
  });

  // Test 7: CSSModuleComposition interface
  await test('CSSModuleComposition interface', () => {
    const composition: CSSModuleComposition = {
      composes: ['base', 'theme'],
      from: './base.module.css',
      global: false,
    };

    assert(composition.composes.length === 2);
    assert(composition.from === './base.module.css');
    assert(composition.global === false);
  });

  // Test 8: CSSModuleValidationResult interface
  await test('CSSModuleValidationResult interface', () => {
    const validation: CSSModuleValidationResult = {
      valid: false,
      errors: [
        {
          type: 'undefined-class',
          message: 'Class "nonexistent" is not defined',
          line: 10,
          column: 15,
          reference: 'nonexistent',
        },
        {
          type: 'circular-composition',
          message: 'Circular composition detected',
        },
      ],
      unusedClasses: ['unused-class-1', 'unused-class-2'],
      undefinedReferences: ['nonexistent', 'missing-import'],
    };

    assert(validation.valid === false);
    assert(validation.errors.length === 2);
    assert(validation.errors[0].type === 'undefined-class');
    assert(validation.unusedClasses?.length === 2);
  });

  // Test 9: CSSModuleUsageContext interface
  await test('CSSModuleUsageContext interface', () => {
    const context: CSSModuleUsageContext = {
      styleType: StyleType.CSS_MODULES,
      sourceFramework: 'react',
      targetFramework: 'vue',
      filePath: '/components/Button.tsx',
      componentPath: '/components/Button.tsx',
      importStyle: 'named',
      importName: 'styles',
    };

    assert(context.styleType === StyleType.CSS_MODULES);
    assert(context.componentPath === '/components/Button.tsx');
    assert(context.importStyle === 'named');
    assert(context.importName === 'styles');
  });

  // Test 10: Complex nested structures
  await test('Complex nested CSS module structures', () => {
    const parseResult: CSSModuleParseResult = {
      module: {
        filePath: '/complex.module.css',
        classes: new Map([
          ['container', {
            originalName: 'container',
            localName: 'container__complex',
            isComposed: true,
            composesFrom: ['flex-container', 'themed-container'],
            rules: [
              { property: 'display', value: 'flex' },
              { property: 'gap', value: '1rem' },
            ],
          }],
        ]),
        imports: [
          {
            from: './layout.module.css',
            imports: new Map([['flexContainer', 'flex-container']]),
          },
          {
            from: './theme.module.css',
            imports: new Map([['themedContainer', 'themed-container']]),
          },
        ],
      },
      warnings: ['Some classes are not used'],
      dependencies: ['./layout.module.css', './theme.module.css'],
    };

    assert(parseResult.module.classes.size === 1);
    assert(parseResult.module.imports?.length === 2);
    assert(parseResult.dependencies?.length === 2);
    assert(parseResult.warnings?.length === 1);
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All CSS Modules type definition tests passed! 🎉');
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();