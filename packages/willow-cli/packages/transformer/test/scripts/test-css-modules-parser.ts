#!/usr/bin/env npx tsx

import { CSSModulesParser } from '../../src/styles/css-modules/css-modules-parser';
import { StyleType } from '../../src/types/style-transformation.types';
import type { StyleTransformationContext } from '../../src/types/style-transformation.types';

console.log('🧪 Testing CSS Modules Parser...\n');

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
  const parser = new CSSModulesParser();
  
  const context: StyleTransformationContext = {
    styleType: StyleType.CSS_MODULES,
    sourceFramework: 'react',
    targetFramework: 'vue',
    filePath: 'Button.module.css',
  };

  // Test 1: Parse simple CSS module
  await test('Parse simple CSS module', () => {
    const input = `
      .button {
        color: blue;
        padding: 10px;
      }
      
      .primary {
        background-color: #007bff;
        border: none;
      }
    `;
    
    const module = parser.parse(input, context);
    
    assert(module.classes.size === 2);
    assert(module.classes.has('button'));
    assert(module.classes.has('primary'));
    
    const buttonClass = module.classes.get('button');
    assert(buttonClass?.rules?.length === 2);
    assert(buttonClass?.rules?.[0].property === 'color');
    assert(buttonClass?.rules?.[0].value === 'blue');
  });

  // Test 2: Parse CSS module with composition
  await test('Parse CSS module with composition', () => {
    const input = `
      .base {
        padding: 10px;
        border-radius: 4px;
      }
      
      .primary {
        composes: base;
        background-color: blue;
        color: white;
      }
    `;
    
    const module = parser.parse(input, context);
    
    const primaryClass = module.classes.get('primary');
    assert(primaryClass?.isComposed === true);
    assert(primaryClass?.composesFrom?.includes('base'));
    assert(primaryClass?.rules?.length === 2);
  });

  // Test 3: Parse CSS variables
  await test('Parse CSS variables', () => {
    const input = `
      :root {
        --primary-color: #007bff;
        --button-padding: 8px 16px;
      }
      
      .button {
        color: var(--primary-color);
        padding: var(--button-padding);
      }
    `;
    
    const module = parser.parse(input, context);
    
    assert(module.variables?.size === 2);
    assert(module.variables?.get('--primary-color') === '#007bff');
    assert(module.variables?.get('--button-padding') === '8px 16px');
  });

  // Test 4: Parse @import statements
  await test('Parse @import statements', () => {
    const input = `
      @import "./base.module.css";
      @import "../shared/theme.module.css";
      
      .button {
        color: blue;
      }
    `;
    
    const module = parser.parse(input, context);
    
    assert(module.imports?.length === 2);
    assert(module.imports?.[0].from === './base.module.css');
    assert(module.imports?.[1].from === '../shared/theme.module.css');
  });

  // Test 5: Parse with important rules
  await test('Parse rules with !important', () => {
    const input = `
      .override {
        color: red !important;
        margin: 0;
        padding: 10px !important;
      }
    `;
    
    const module = parser.parse(input, context);
    
    const overrideClass = module.classes.get('override');
    assert(overrideClass?.rules?.length === 3);
    assert(overrideClass?.rules?.[0].important === true);
    assert(overrideClass?.rules?.[1].important === false || !overrideClass?.rules?.[1].important);
    assert(overrideClass?.rules?.[2].important === true);
  });

  // Test 6: Generate scoped names
  await test('Generate scoped class names', () => {
    const customParser = new CSSModulesParser({
      generateScopedName: (name, filename) => `${name}_${filename.replace(/\./g, '_')}`,
    });
    
    const input = `.button { color: blue; }`;
    const module = customParser.parse(input, context);
    
    const buttonClass = module.classes.get('button');
    assert(buttonClass?.localName === 'button_Button_module_css');
  });

  // Test 7: Parse complex selectors
  await test('Parse complex selectors', () => {
    const input = `
      .button.active {
        background-color: darkblue;
      }
      
      .container .item {
        margin: 5px;
      }
      
      .list-item:hover {
        color: red;
      }
    `;
    
    const module = parser.parse(input, context);
    
    // Should extract individual class names
    assert(module.classes.has('button'));
    assert(module.classes.has('active'));
    assert(module.classes.has('container'));
    assert(module.classes.has('item'));
    assert(module.classes.has('list-item'));
  });

  // Test 8: Serialize CSS module
  await test('Serialize CSS module back to string', () => {
    const input = `
      .button {
        color: blue;
        padding: 10px;
      }
      
      .primary {
        composes: button;
        background: red;
      }
    `;
    
    const module = parser.parse(input, context);
    const serialized = parser.serialize(module, context);
    
    assert(serialized.includes('.button {'));
    assert(serialized.includes('color: blue;'));
    assert(serialized.includes('.primary {'));
    assert(serialized.includes('composes: button;'));
  });

  // Test 9: Parse with result (warnings and dependencies)
  await test('Parse with warnings and dependencies', () => {
    const input = `
      @import "./base.module.css";
      
      .base {
        padding: 10px;
      }
      
      .button {
        composes: base;
        color: blue;
      }
      
      .primary {
        composes: nonexistent;
        background: red;
      }
    `;
    
    const result = parser.parseWithResult(input, context);
    
    assert(result.module.classes.size === 3);
    assert(result.dependencies?.includes('./base.module.css'));
    assert(result.warnings?.length === 1, `Expected 1 warning, got ${result.warnings?.length}: ${result.warnings?.join(', ')}`);
    assert(result.warnings?.[0].includes('nonexistent'));
  });

  // Test 10: Handle edge cases
  await test('Handle edge cases and malformed CSS', () => {
    const inputs = [
      '', // Empty string
      '   ', // Whitespace only
      '.button { }', // Empty rules
      '.button { color: }', // Invalid rule
      '@import;', // Invalid import
    ];
    
    for (const input of inputs) {
      // Should not throw, just handle gracefully
      const module = parser.parse(input, context);
      assert(module !== null);
      assert(module.filePath === 'Button.module.css');
    }
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All CSS Modules parser tests passed! 🎉');
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();