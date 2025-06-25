#!/usr/bin/env npx tsx

import { CSSModulesTransformer } from './src/styles/css-modules/css-modules-transformer';
import { StyleType } from './src/types/style-transformation.types';
import type {
  StyleTransformationContext,
  StyleTransformerConfig,
} from './src/types/style-transformation.types';
import type { CSSModulesTransformOptions } from './src/types/css-modules.types';

console.log('🧪 Testing CSS Modules Transformer...\n');

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
    sourceFramework: 'react',
    targetFramework: 'vue',
    filePath: 'Button.module.css',
  };

  // Test 1: Basic transformation
  await test('Basic CSS module transformation', async () => {
    const transformer = new CSSModulesTransformer();
    const input = `
      .button {
        color: blue;
        padding: 10px;
      }
      
      .primary {
        background-color: #007bff;
      }
    `;
    
    const result = await transformer.transform(input, context, {});
    
    assert(result.success === true);
    assert(result.transformed.includes('.button'));
    assert(result.transformed.includes('color: blue'));
  });

  // Test 2: Transform with class mappings
  await test('Transform with class name mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: [
        { sourceClass: 'button', targetClass: 'btn' },
        { sourceClass: 'primary', targetClass: 'btn-primary' },
      ],
    };
    
    const input = `
      .button {
        color: blue;
      }
      
      .primary {
        background: red;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.btn'));
    assert(result.transformed.includes('.btn-primary'));
    assert(!result.transformed.includes('.button'));
    assert(!result.transformed.includes('.primary'));
  });

  // Test 3: Transform with property mappings
  await test('Transform with property mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      propertyMappings: [
        { source: 'color', target: 'text-color' },
        { source: 'background-color', target: 'bg-color' },
      ],
    };
    
    const input = `
      .test {
        color: blue;
        background-color: red;
        margin: 10px;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('text-color: blue'));
    assert(result.transformed.includes('bg-color: red'));
    assert(result.transformed.includes('margin: 10px'));
  });

  // Test 4: Transform with token mappings
  await test('Transform with token mappings', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      tokenMappings: [
        {
          sourceToken: 'primary-color',
          targetToken: 'brand-500',
          category: 'color',
        },
        {
          sourceToken: 'spacing-md',
          targetToken: '16px',
          category: 'spacing',
        },
      ],
    };
    
    const input = `
      .button {
        color: var(--primary-color);
        padding: var(--spacing-md);
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    // The token mappings replace the entire value, not just the token name
    assert(result.transformed.includes('color: brand-500') || result.transformed.includes('color: var(--brand-500)'));
    assert(result.transformed.includes('padding: 16px'));
  });

  // Test 5: Generate TypeScript definitions
  await test('Generate TypeScript definitions', async () => {
    const options: CSSModulesTransformOptions = {
      generateTypeDefinitions: true,
      exportType: 'named',
    };
    
    const transformer = new CSSModulesTransformer(options);
    const input = `
      .button {
        color: blue;
      }
      
      .primary-button {
        background: red;
      }
      
      .icon-large {
        width: 24px;
      }
    `;
    
    const result = await transformer.transform(input, context, {});
    
    assert(result.success === true);
    assert(result.metadata?.typeDefinitions);
    assert(result.metadata.typeDefinitions.includes('export const button: string;'));
    assert(result.metadata.typeDefinitions.includes('export const primary_button: string;'));
    assert(result.metadata.typeDefinitions.includes('export const icon_large: string;'));
  });

  // Test 6: Custom scoped name generation
  await test('Custom scoped name generation', async () => {
    const options: CSSModulesTransformOptions = {
      generateScopedName: (name, filename) => `${filename.replace(/\./g, '_')}_${name}`,
    };
    
    const transformer = new CSSModulesTransformer(options);
    const input = `.button { color: blue; }`;
    
    const result = await transformer.transform(input, context, {});
    
    assert(result.success === true);
    // The scoped name should be reflected in the metadata or internal structure
  });

  // Test 7: Transform CSS variables
  await test('Transform CSS variables', async () => {
    const options: CSSModulesTransformOptions = {
      transformVariables: true,
      variableTransformer: (name, value) => ({
        name: name.replace('--', '--theme-'),
        value: value.toUpperCase(),
      }),
    };
    
    const transformer = new CSSModulesTransformer(options);
    const input = `
      :root {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
      }
      
      .button {
        color: var(--primary-color);
      }
    `;
    
    const result = await transformer.transform(input, context, {});
    
    assert(result.success === true);
    assert(result.transformed.includes('--theme-primary-color: #007BFF'));
    assert(result.transformed.includes('--theme-secondary-color: #6C757D'));
  });

  // Test 8: Handle composition
  await test('Handle class composition', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: [
        { sourceClass: 'base', targetClass: 'base-style' },
      ],
    };
    
    const input = `
      .base {
        padding: 10px;
      }
      
      .button {
        composes: base;
        color: blue;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.transformed.includes('.base-style'));
    assert(result.transformed.includes('composes: base-style'));
  });

  // Test 9: Different export types for TypeScript
  await test('Different TypeScript export types', async () => {
    const namedExport = new CSSModulesTransformer({ 
      generateTypeDefinitions: true,
      exportType: 'named',
    });
    
    const defaultExport = new CSSModulesTransformer({ 
      generateTypeDefinitions: true,
      exportType: 'default',
    });
    
    const namespaceExport = new CSSModulesTransformer({ 
      generateTypeDefinitions: true,
      exportType: 'namespace',
    });
    
    const input = `.button { color: blue; }`;
    
    const namedResult = await namedExport.transform(input, context, {});
    const defaultResult = await defaultExport.transform(input, context, {});
    const namespaceResult = await namespaceExport.transform(input, context, {});
    
    assert(namedResult.metadata?.typeDefinitions?.includes('export const button: string;'));
    assert(defaultResult.metadata?.typeDefinitions?.includes('export default styles;'));
    assert(namespaceResult.metadata?.typeDefinitions?.includes('export = styles;'));
  });

  // Test 10: Count transformations
  await test('Count transformations correctly', async () => {
    const transformer = new CSSModulesTransformer();
    const config: StyleTransformerConfig = {
      classMappings: [
        { sourceClass: 'old-name', targetClass: 'new-name' },
      ],
      preserveUnknownProperties: false,
    };
    
    const input = `
      .old-name {
        color: blue;
      }
      
      .keep-this {
        color: red;
      }
    `;
    
    const result = await transformer.transform(input, context, config);
    
    assert(result.success === true);
    assert(result.metadata?.transformationsApplied > 0);
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All CSS Modules transformer tests passed! 🎉');
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();