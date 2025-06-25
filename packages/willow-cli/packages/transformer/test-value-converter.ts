#!/usr/bin/env tsx

import { PropValueConverter, type ConverterConfig } from './src/converters/prop-value-converter.js';
import type { ValueTransformation } from './src/schemas/component-mapping.schema.js';
import type { ComponentMappingContext } from './src/types/component-mapping.types.js';

async function runTests() {
  console.log('🧪 Testing PropValueConverter...\n');
  
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.then(() => {
          console.log(`✅ ${name}`);
          passed++;
        }).catch((error) => {
          console.log(`❌ ${name}: ${error.message}`);
        });
      } else {
        console.log(`✅ ${name}`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const converter = new PropValueConverter();
  const context: ComponentMappingContext = {
    sourceFile: 'test.tsx',
    targetFile: 'test.tsx',
    componentName: 'Button',
    props: {},
  };

  // Test direct transformations
  await test('Direct transformation: primary -> main', async () => {
    const transformation: ValueTransformation = {
      type: 'direct',
      from: 'primary',
      to: 'main',
    };
    const result = await converter.convert('primary', transformation, context);
    if (!result.success || result.value !== 'main') {
      throw new Error(`Expected 'main', got '${result.value}'`);
    }
  });

  await test('Direct transformation: no match returns original', async () => {
    const transformation: ValueTransformation = {
      type: 'direct',
      from: 'primary',
      to: 'main',
    };
    const result = await converter.convert('secondary', transformation, context);
    if (!result.success || result.value !== 'secondary') {
      throw new Error(`Expected 'secondary', got '${result.value}'`);
    }
  });

  // Test map transformations
  await test('Map transformation: error -> danger', async () => {
    const transformation: ValueTransformation = {
      type: 'map',
      map: {
        'primary': 'main',
        'secondary': 'accent',
        'error': 'danger',
      },
    };
    const result = await converter.convert('error', transformation, context);
    if (!result.success || result.value !== 'danger') {
      throw new Error(`Expected 'danger', got '${result.value}'`);
    }
  });

  // Test boolean conversion
  await test('Boolean conversion: true to string', async () => {
    const result = await converter.convertByType(true, 'boolean', context);
    if (!result.success || result.value !== 'true') {
      throw new Error(`Expected 'true', got '${result.value}'`);
    }
  });

  await test('Boolean conversion: false to string', async () => {
    const result = await converter.convertByType(false, 'boolean', context);
    if (!result.success || result.value !== 'false') {
      throw new Error(`Expected 'false', got '${result.value}'`);
    }
  });

  // Test unit conversion
  await test('Unit conversion: 32px to rem', async () => {
    const result = await converter.convertByType('32px', 'px', context);
    if (!result.success || result.value !== '2.000rem') {
      throw new Error(`Expected '2.000rem', got '${result.value}'`);
    }
  });

  await test('Unit conversion: 2rem to px', async () => {
    const result = await converter.convertByType('2rem', 'rem', context);
    if (!result.success || result.value !== '32px') {
      throw new Error(`Expected '32px', got '${result.value}'`);
    }
  });

  // Test color conversion
  await test('Color conversion: rgb to hex', async () => {
    const result = await converter.convertByType('rgb(255, 0, 0)', 'color', context);
    if (!result.success || result.value !== '#ff0000') {
      throw new Error(`Expected '#ff0000', got '${result.value}'`);
    }
  });

  await test('Color conversion: hex passthrough', async () => {
    const result = await converter.convertByType('#ff0000', 'color', context);
    if (!result.success || result.value !== '#ff0000') {
      throw new Error(`Expected '#ff0000', got '${result.value}'`);
    }
  });

  // Test string conversion
  await test('String conversion: number to string', async () => {
    const result = await converter.convertByType(123, 'string', context);
    if (!result.success || String(result.value) !== '123') {
      throw new Error(`Expected '123', got '${result.value}'`);
    }
  });

  // Test number conversion
  await test('Number conversion: string to number', async () => {
    const result = await converter.convertByType('123', 'number', context);
    if (!result.success || result.value !== 123) {
      throw new Error(`Expected 123, got '${result.value}'`);
    }
  });

  // Test converter management
  test('Converter management: check built-in converters', () => {
    const converters = converter.getConverters();
    const expectedConverters = ['boolean', 'unit', 'color', 'enum', 'string', 'number'];
    for (const expected of expectedConverters) {
      if (!converters.includes(expected)) {
        throw new Error(`Expected converter '${expected}' to be registered`);
      }
    }
  });

  test('Converter management: check converter existence', () => {
    if (!converter.hasConverter('boolean')) {
      throw new Error('Expected boolean converter to exist');
    }
    if (converter.hasConverter('nonexistent')) {
      throw new Error('Expected nonexistent converter to not exist');
    }
  });

  // Test custom converter registration
  test('Custom converter registration', () => {
    const customConverter = {
      name: 'custom',
      convert: (value: any) => `custom-${value}`,
      supports: (type: string) => type === 'custom',
    };
    
    converter.registerConverter(customConverter);
    
    if (!converter.hasConverter('custom')) {
      throw new Error('Expected custom converter to be registered');
    }
  });

  await test('Custom converter usage', async () => {
    const transformation: ValueTransformation = {
      type: 'function',
      transform: 'custom',
    };
    const result = await converter.convert('test', transformation, context);
    if (!result.success || result.value !== 'custom-test') {
      throw new Error(`Expected 'custom-test', got '${result.value}'`);
    }
  });

  // Test error handling
  await test('Error handling: unknown converter', async () => {
    const transformation: ValueTransformation = {
      type: 'function',
      transform: 'unknown-converter',
    };
    const result = await converter.convert('test', transformation, context);
    if (result.success) {
      throw new Error('Expected conversion to fail for unknown converter');
    }
    if (!result.errors.some(e => e.includes('Unknown converter'))) {
      throw new Error('Expected error message about unknown converter');
    }
  });

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed!');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});