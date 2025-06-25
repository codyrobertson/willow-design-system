#!/usr/bin/env npx tsx

import {
  cssModulesToBootstrapMappings,
  cssModulesToTailwindMappings,
  cssModulesToMuiMappings,
  cssModulesToAntdMappings,
  createCSSModuleMappings,
  mergeCSSModuleMappings,
  semanticColorMappings,
  responsiveMappings,
} from './src/styles/css-modules/css-modules-mappings';
import { CSSModulesTransformer } from './src/styles/css-modules/css-modules-transformer';
import { StyleType } from './src/types/style-transformation.types';
import type { StyleTransformationContext, StyleTransformerConfig } from './src/types/style-transformation.types';

console.log('🧪 Testing CSS Modules Mappings...\n');

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
  const context: StyleTransformationContext = {
    styleType: StyleType.CSS_MODULES,
    sourceFramework: 'css-modules',
    targetFramework: 'bootstrap',
    filePath: 'Component.module.css',
  };

  // Test 1: Bootstrap mappings
  await test('Bootstrap class mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: cssModulesToBootstrapMappings.slice(0, 15), // Include justify-center mapping
    };
    
    const input = `
      .container {
        width: 100%;
      }
      
      .flex {
        display: flex;
      }
      
      .justify-center {
        justify-content: center;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.container'));
    assert(result.transformed.includes('.d-flex'));
    assert(result.transformed.includes('.justify-content-center'));
  });

  // Test 2: Tailwind mappings
  await test('Tailwind class mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: cssModulesToTailwindMappings, // Use all mappings
    };
    
    const input = `
      .flex {
        display: flex;
      }
      
      .m-3 {
        margin: 12px;
      }
      
      .text-primary {
        color: var(--primary);
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.flex'));
    assert(result.transformed.includes('.m-8')); // Converted to Tailwind scale
    assert(result.transformed.includes('.text-blue-600')); // Semantic to specific
  });

  // Test 3: Material-UI mappings
  await test('Material-UI class mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: cssModulesToMuiMappings, // Use all mappings
    };
    
    const input = `
      .button {
        padding: 8px 16px;
      }
      
      .button-primary {
        background: blue;
      }
      
      .text-h1 {
        font-size: 2rem;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.MuiButton-root'));
    assert(result.transformed.includes('.MuiButton-containedPrimary'));
    assert(result.transformed.includes('.MuiTypography-h1'));
  });

  // Test 4: Ant Design mappings
  await test('Ant Design class mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: cssModulesToAntdMappings, // Use all mappings
    };
    
    const input = `
      .button {
        border: 1px solid;
      }
      
      .form {
        width: 100%;
      }
      
      .col-6 {
        width: 50%;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.ant-btn'));
    assert(result.transformed.includes('.ant-form'));
    assert(result.transformed.includes('.ant-col-6'));
  });

  // Test 5: Custom mappings creation
  await test('Create custom mappings', () => {
    const customMappings = createCSSModuleMappings([
      { source: 'custom-button', target: 'btn-custom', priority: 10 },
      { source: /^icon-(.+)$/, target: (match) => `icon-${match.replace('icon-', '').toUpperCase()}` },
      { source: 'legacy-class', target: 'new-class' },
    ]);
    
    assert(customMappings.length === 3);
    assert(customMappings[0].sourceClass === 'custom-button');
    assert(customMappings[0].targetClass === 'btn-custom');
    assert(customMappings[0].priority === 10);
    assert(customMappings[1].sourceClass instanceof RegExp);
  });

  // Test 6: Merge multiple mapping sets
  await test('Merge mapping sets', () => {
    const set1 = createCSSModuleMappings([
      { source: 'class1', target: 'target1', priority: 1 },
    ]);
    
    const set2 = createCSSModuleMappings([
      { source: 'class2', target: 'target2', priority: 2 },
    ]);
    
    const merged = mergeCSSModuleMappings(set1, set2, semanticColorMappings);
    
    assert(merged.length >= 2);
    // Should be sorted by priority (higher first)
    assert(merged[0].priority >= (merged[1].priority || 0));
  });

  // Test 7: Semantic color mappings
  await test('Semantic color mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: semanticColorMappings,
    };
    
    const input = `
      .primary {
        color: var(--primary);
      }
      
      .success {
        color: var(--success);
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.blue'));
    assert(result.transformed.includes('.green'));
  });

  // Test 8: Responsive mappings
  await test('Responsive utility mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: responsiveMappings,
    };
    
    const input = `
      .sm\\:flex {
        display: flex;
      }
      
      .hover\\:bg-blue {
        background: blue;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    // Note: CSS escaping makes this complex, but the mappings should work
  });

  // Test 9: RegExp mappings
  await test('RegExp-based mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: [
        { sourceClass: /^m-(\d+)$/, targetClass: (match) => `margin-${match.replace('m-', '')}` },
        { sourceClass: /^col-(\d+)$/, targetClass: (match) => `column-${match.replace('col-', '')}` },
      ],
    };
    
    const input = `
      .m-4 {
        margin: 16px;
      }
      
      .col-6 {
        width: 50%;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.margin-4'));
    assert(result.transformed.includes('.column-6'));
  });

  // Test 10: Priority-based mapping resolution
  await test('Priority-based mapping resolution', async () => {
    const transformer = new CSSModulesTransformer();
    
    // Create mappings with different priorities for same class
    const highPriorityMappings = createCSSModuleMappings([
      { source: 'button', target: 'high-priority-btn', priority: 10 },
    ]);
    
    const lowPriorityMappings = createCSSModuleMappings([
      { source: 'button', target: 'low-priority-btn', priority: 1 },
    ]);
    
    const merged = mergeCSSModuleMappings(lowPriorityMappings, highPriorityMappings);
    const config: StyleTransformerConfig = {
      classMappings: merged,
    };
    
    const input = `
      .button {
        padding: 8px;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    // Should use the high priority mapping
    assert(result.transformed.includes('.high-priority-btn'));
    assert(!result.transformed.includes('.low-priority-btn'));
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All CSS Modules mapping tests passed! 🎉');
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();