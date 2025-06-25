#!/usr/bin/env tsx

import { ComponentMappingConfigSchema, PropertyMappingSchema, ValueTransformationSchema } from './src/schemas/component-mapping.schema.js';

async function runTests() {
  console.log('🧪 Testing Component Mapping Schema Validation...\n');
  
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Test ValueTransformationSchema
  test('ValueTransformation: direct type validation', () => {
    const valid = {
      type: 'direct',
      from: 'old',
      to: 'new'
    };
    
    const result = ValueTransformationSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  test('ValueTransformation: map type validation', () => {
    const valid = {
      type: 'map',
      map: {
        'primary': 'main',
        'secondary': 'accent'
      }
    };
    
    const result = ValueTransformationSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  test('ValueTransformation: function type validation', () => {
    const valid = {
      type: 'function',
      transform: 'customTransformer'
    };
    
    const result = ValueTransformationSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  test('ValueTransformation: conditional type validation', () => {
    const valid = {
      type: 'conditional',
      condition: {
        prop: 'variant',
        operator: 'equals',
        value: 'primary'
      },
      to: 'main'
    };
    
    const result = ValueTransformationSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  // Test PropertyMappingSchema
  test('PropertyMapping: basic mapping validation', () => {
    const valid = {
      source: 'color',
      target: 'variant'
    };
    
    const result = PropertyMappingSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  test('PropertyMapping: with value transformation', () => {
    const valid = {
      source: 'color',
      target: 'variant',
      valueTransformation: {
        type: 'map',
        map: {
          'primary': 'main'
        }
      }
    };
    
    const result = PropertyMappingSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  test('PropertyMapping: with deprecation info', () => {
    const valid = {
      source: 'color',
      target: 'variant',
      deprecated: true,
      deprecationMessage: 'Use variant instead',
      alternative: 'variant'
    };
    
    const result = PropertyMappingSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  test('PropertyMapping: with conditional mapping', () => {
    const valid = {
      source: 'size',
      target: 'size',
      conditional: [
        {
          condition: {
            prop: 'variant',
            operator: 'equals',
            value: 'icon'
          },
          target: 'iconSize'
        }
      ]
    };
    
    const result = PropertyMappingSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  // Test ComponentMappingConfigSchema
  test('ComponentMappingConfig: full configuration', () => {
    const valid = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'WillowButton',
          props: [
            {
              source: 'color',
              target: 'variant',
              valueTransformation: {
                type: 'map',
                map: {
                  'primary': 'main',
                  'secondary': 'accent'
                }
              }
            }
          ]
        }
      ],
      globalPropMappings: [
        {
          source: 'className',
          target: 'class'
        }
      ]
    };
    
    const result = ComponentMappingConfigSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  test('ComponentMappingConfig: with options', () => {
    const valid = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [],
      options: {
        strictMode: true,
        warnOnUnmappedProps: true,
        preserveUnknownProps: false
      }
    };
    
    const result = ComponentMappingConfigSchema.safeParse(valid);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
  });

  // Test invalid schemas
  test('Schema: reject invalid value transformation type', () => {
    const invalid = {
      type: 'invalid-type',
      from: 'old',
      to: 'new'
    };
    
    const result = ValueTransformationSchema.safeParse(invalid);
    if (result.success) throw new Error('Expected schema validation to fail for invalid type');
  });

  test('Schema: reject missing required fields', () => {
    const invalid = {
      // Missing source and target
      deprecated: true
    };
    
    const result = PropertyMappingSchema.safeParse(invalid);
    if (result.success) throw new Error('Expected schema validation to fail for missing required fields');
  });

  test('Schema: reject invalid component mapping', () => {
    const invalid = {
      version: '1.0.0',
      // Missing sourceUIKit and targetUIKit
      mappings: []
    };
    
    const result = ComponentMappingConfigSchema.safeParse(invalid);
    if (result.success) throw new Error('Expected schema validation to fail for missing required fields');
  });

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All schema validation tests passed!');
    return true;
  } else {
    console.log('❌ Some schema validation tests failed!');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});