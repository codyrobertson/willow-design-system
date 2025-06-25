#!/usr/bin/env npx tsx

import { BaseStyleTransformer } from './src/styles/base-style-transformer';
import { StyleTransformerRegistryImpl } from './src/styles/style-transformer-registry';
import { StyleTransformationPipelineImpl } from './src/styles/style-transformation-pipeline';
import { StyleTransformerFactory } from './src/styles/style-transformer-factory';
import {
  StyleType,
  type StyleTransformationContext,
  type StyleTransformerConfig,
  type StyleTransformationResult,
} from './src/types/style-transformation.types';

console.log('🧪 Testing Style Transformation Architecture...\n');

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

// Test transformer implementation
class TestTransformer extends BaseStyleTransformer {
  name = 'test-transformer';
  supportedTypes: StyleType[] = [StyleType.CSS_IN_JS, StyleType.INLINE_STYLES];
  priority = 10;

  transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): StyleTransformationResult {
    const configErrors = this.validateConfig(config);
    if (configErrors.length > 0) {
      return this.createErrorResult(configErrors.join(', '), input);
    }

    if (typeof input === 'object' && input !== null) {
      const { mapped, warnings } = this.applyPropertyMappings(input, config, context);
      const result = this.createSuccessResult(mapped, input, {
        transformationsApplied: Object.keys(mapped).length,
        styleType: context.styleType,
      });
      // Add warnings from property mappings
      result.warnings.push(...warnings);
      return result;
    }

    return this.createSuccessResult(input, input);
  }
}

// Another test transformer
class AnotherTestTransformer extends BaseStyleTransformer {
  name = 'another-test-transformer';
  supportedTypes: StyleType[] = [StyleType.TAILWIND];
  priority = 5;

  transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): StyleTransformationResult {
    return this.createSuccessResult(
      `transformed-${input}`,
      input,
      { styleType: context.styleType }
    );
  }
}

// Run tests
(async () => {
  // Test 1: Base Style Transformer
  await test('BaseStyleTransformer - property mappings', () => {
    const transformer = new TestTransformer();
    const config: StyleTransformerConfig = {
      propertyMappings: [
        { source: 'color', target: 'textColor' },
        { source: 'background', target: 'backgroundColor' },
        { 
          source: 'padding', 
          target: 'spacing',
          transform: (value) => `${value}px`
        },
      ],
    };

    const context: StyleTransformationContext = {
      styleType: StyleType.CSS_IN_JS,
      sourceFramework: 'mui',
      targetFramework: 'willow',
      filePath: 'test.tsx',
    };

    const result = transformer.transform(
      { color: 'red', background: 'blue', padding: 10 },
      context,
      config
    );

    assert(result.success === true);
    assert(result.transformed.textColor === 'red');
    assert(result.transformed.backgroundColor === 'blue');
    assert(result.transformed.spacing === '10px');
  });

  // Test 2: Base Style Transformer - deprecation warnings
  await test('BaseStyleTransformer - deprecation warnings', () => {
    const transformer = new TestTransformer();
    const config: StyleTransformerConfig = {
      propertyMappings: [
        { 
          source: 'oldProp', 
          target: 'newProp',
          deprecated: true,
          deprecationMessage: 'oldProp is deprecated, use newProp'
        },
      ],
      warnOnUnmappedProperties: true,
      preserveUnknownProperties: true,
    };

    const context: StyleTransformationContext = {
      styleType: StyleType.CSS_IN_JS,
      sourceFramework: 'mui',
      targetFramework: 'willow',
      filePath: 'test.tsx',
    };

    const result = transformer.transform(
      { oldProp: 'value', unknownProp: 'test' },
      context,
      config
    );

    assert(result.success === true);
    // Check for warnings - the base transformer collects warnings from applyPropertyMappings
    const transformResult = result as StyleTransformationResult;
    assert(transformResult.warnings.length === 2, `Expected 2 warnings, got ${transformResult.warnings.length}: ${transformResult.warnings.join(', ')}`);
    assert(transformResult.warnings.includes('oldProp is deprecated, use newProp'));
    assert(transformResult.warnings.some(w => w.includes('Unmapped property: unknownProp')));
  });

  // Test 3: Style Transformer Registry
  await test('StyleTransformerRegistry - registration and retrieval', () => {
    const registry = new StyleTransformerRegistryImpl();
    const transformer1 = new TestTransformer();
    const transformer2 = new AnotherTestTransformer();

    registry.register(transformer1);
    registry.register(transformer2);

    assert(registry.size === 2);
    assert(registry.get('test-transformer') === transformer1);
    assert(registry.get('another-test-transformer') === transformer2);
    assert(registry.has('test-transformer') === true);
    assert(registry.getNames().includes('test-transformer'));
  });

  // Test 4: Style Transformer Registry - get by style type
  await test('StyleTransformerRegistry - get by style type', () => {
    const registry = new StyleTransformerRegistryImpl();
    const transformer1 = new TestTransformer();
    const transformer2 = new AnotherTestTransformer();

    registry.register(transformer1);
    registry.register(transformer2);

    const cssInJsTransformers = registry.getForStyleType(StyleType.CSS_IN_JS);
    assert(cssInJsTransformers.length === 1);
    assert(cssInJsTransformers[0] === transformer1);

    const tailwindTransformers = registry.getForStyleType(StyleType.TAILWIND);
    assert(tailwindTransformers.length === 1);
    assert(tailwindTransformers[0] === transformer2);
  });

  // Test 5: Style Transformation Pipeline
  await test('StyleTransformationPipeline - basic transformation', async () => {
    const pipeline = new StyleTransformationPipelineImpl();
    const transformer = new TestTransformer();
    
    pipeline.add(transformer);

    const context: StyleTransformationContext = {
      styleType: StyleType.CSS_IN_JS,
      sourceFramework: 'mui',
      targetFramework: 'willow',
      filePath: 'test.tsx',
    };

    const config: StyleTransformerConfig = {
      propertyMappings: [
        { source: 'display', target: 'display' },
      ],
    };

    const result = await pipeline.transform(
      { display: 'flex' },
      context,
      config
    );

    assert(result.success === true);
    assert(result.transformed.display === 'flex');
  });

  // Test 6: Style Transformation Pipeline - priority ordering
  await test('StyleTransformationPipeline - priority ordering', () => {
    const pipeline = new StyleTransformationPipelineImpl();
    const transformer1 = new TestTransformer(); // priority 10
    const transformer2 = new AnotherTestTransformer(); // priority 5

    pipeline.add(transformer2);
    pipeline.add(transformer1);

    const transformers = pipeline.getTransformers();
    assert(transformers[0].name === 'test-transformer'); // higher priority first
    assert(transformers[1].name === 'another-test-transformer');
  });

  // Test 7: Style Transformer Factory - registration and creation
  await test('StyleTransformerFactory - registration and creation', () => {
    // Clear any existing registrations
    StyleTransformerFactory.clear();

    StyleTransformerFactory.register('test', TestTransformer);
    StyleTransformerFactory.register('another', AnotherTestTransformer);

    assert(StyleTransformerFactory.has('test') === true);
    assert(StyleTransformerFactory.has('another') === true);

    const transformer = StyleTransformerFactory.create('test');
    assert(transformer instanceof TestTransformer);
    assert(transformer.name === 'test-transformer');
  });

  // Test 8: Style Transformer Factory - composite transformer
  await test('StyleTransformerFactory - composite transformer', async () => {
    const transformer1 = new TestTransformer();
    const transformer2 = new AnotherTestTransformer();

    const composite = StyleTransformerFactory.createComposite(
      'composite',
      [transformer1, transformer2]
    );

    assert(composite.name === 'composite');
    
    const context: StyleTransformationContext = {
      styleType: StyleType.CSS_IN_JS,
      sourceFramework: 'mui',
      targetFramework: 'willow',
      filePath: 'test.tsx',
    };

    const result = await composite.transform({}, context, {});
    assert(result.success === true);
  });

  // Test 9: Token mapping
  await test('BaseStyleTransformer - token mapping', () => {
    const transformer = new TestTransformer();
    
    // Test token mapping method directly
    const config: StyleTransformerConfig = {
      tokenMappings: [
        { 
          sourceToken: 'primary.main',
          targetToken: 'brand.500',
          category: 'color'
        },
        {
          sourceToken: 'spacing.4',
          targetToken: '1rem',
          category: 'spacing'
        }
      ],
    };

    const context: StyleTransformationContext = {
      styleType: StyleType.CSS_IN_JS,
      sourceFramework: 'mui',
      targetFramework: 'willow',
      filePath: 'test.tsx',
      theme: { primary: { main: '#007bff' } },
    };

    // Test the protected method through reflection
    const transformerAny = transformer as any;
    const result1 = transformerAny.applyTokenMappings('${primary.main}', config, context);
    assert(result1 === 'brand.500');

    const result2 = transformerAny.applyTokenMappings('var(--spacing-4)', config, context);
    assert(result2 === '1rem');
  });

  // Test 10: Error handling
  await test('StyleTransformationPipeline - error handling', async () => {
    const pipeline = new StyleTransformationPipelineImpl();
    
    const context: StyleTransformationContext = {
      styleType: StyleType.EMOTION, // No transformer registered for this
      sourceFramework: 'mui',
      targetFramework: 'willow',
      filePath: 'test.tsx',
    };

    const result = await pipeline.transform({}, context, {});
    assert(result.success === false);
    assert(result.errors.length > 0);
    assert(result.errors[0].includes('No transformer found'));
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All style transformation architecture tests passed! 🎉');
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();