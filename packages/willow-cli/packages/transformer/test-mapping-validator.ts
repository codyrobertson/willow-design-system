#!/usr/bin/env tsx

import { MappingValidator } from './src/utils/mapping-validator.js';
import type { ComponentMappingConfig } from './src/schemas/component-mapping.schema.js';

async function runTests() {
  console.log('🧪 Testing Mapping Validator...\n');
  
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

  // Test valid configuration
  test('Valid configuration validation', () => {
    const validConfig: ComponentMappingConfig = {
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
            },
            {
              source: 'size',
              target: 'size'
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

    const result = MappingValidator.validateConfig(validConfig);
    if (!result.valid) {
      throw new Error(`Expected config to be valid. Errors: ${result.errors.map(e => e.message).join(', ')}`);
    }
  });

  test('Invalid schema validation', () => {
    const invalidConfig = {
      version: '1.0.0',
      // Missing required fields
      mappings: []
    };

    const result = MappingValidator.validateConfig(invalidConfig);
    if (result.valid) {
      throw new Error('Expected config to be invalid due to missing required fields');
    }
    if (result.errors.length === 0) {
      throw new Error('Expected validation errors for invalid config');
    }
  });

  test('Duplicate component mapping detection', () => {
    const configWithDuplicates: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'WillowButton',
          props: []
        },
        {
          sourceComponent: 'Button', // Duplicate
          targetComponent: 'AnotherButton',
          props: []
        }
      ]
    };

    const result = MappingValidator.validateConfig(configWithDuplicates);
    if (result.valid) {
      throw new Error('Expected config to be invalid due to duplicate component mappings');
    }
    
    const hasDuplicateError = result.errors.some(error => 
      error.message.includes('Duplicate component mapping') && error.message.includes('Button')
    );
    if (!hasDuplicateError) {
      throw new Error('Expected duplicate component mapping error');
    }
  });

  test('Duplicate property mapping detection', () => {
    const configWithDuplicateProps: ComponentMappingConfig = {
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
              target: 'variant'
            },
            {
              source: 'color', // Duplicate
              target: 'theme'
            }
          ]
        }
      ]
    };

    const result = MappingValidator.validateConfig(configWithDuplicateProps);
    if (result.valid) {
      throw new Error('Expected config to be invalid due to duplicate property mappings');
    }

    const hasDuplicateError = result.errors.some(error => 
      error.message.includes('Duplicate property mapping') && error.message.includes('color')
    );
    if (!hasDuplicateError) {
      throw new Error('Expected duplicate property mapping error');
    }
  });

  test('Deprecation consistency validation', () => {
    const configWithInconsistentDeprecation: ComponentMappingConfig = {
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
              deprecated: true,
              // Missing deprecationMessage for deprecated property
            }
          ]
        }
      ]
    };

    const result = MappingValidator.validateConfig(configWithInconsistentDeprecation);
    
    // This should pass validation but might have suggestions
    if (!result.valid) {
      // Check if the error is related to deprecation
      const hasDeprecationError = result.errors.some(error => 
        error.message.includes('deprecation') || error.message.includes('deprecated')
      );
      if (hasDeprecationError) {
        // This is expected behavior
      } else {
        throw new Error(`Unexpected validation error: ${result.errors.map(e => e.message).join(', ')}`);
      }
    }
  });

  test('Conditional reference validation', () => {
    const configWithInvalidConditional: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'WillowButton',
          props: [
            {
              source: 'size',
              target: 'size',
              conditional: [
                {
                  condition: {
                    prop: 'nonexistentProp', // References non-existent prop
                    operator: 'equals',
                    value: 'value'
                  },
                  target: 'conditionalSize'
                }
              ]
            }
          ]
        }
      ]
    };

    const result = MappingValidator.validateConfig(configWithInvalidConditional);
    
    // This should still be valid (conditional props can reference external props)
    // but might have suggestions about the reference
    if (!result.valid && result.errors.length > 0) {
      // Check if errors are related to conditional references
      const hasConditionalError = result.errors.some(error => 
        error.message.includes('conditional') || error.message.includes('reference')
      );
      if (!hasConditionalError) {
        throw new Error(`Unexpected validation error: ${result.errors.map(e => e.message).join(', ')}`);
      }
    }
  });

  test('Suggestions generation', () => {
    const configNeedingSuggestions: ComponentMappingConfig = {
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
              deprecated: true,
              deprecationMessage: 'Use variant instead',
              // Has target different from source but no alternative set
              // This should generate a suggestion
            }
          ]
        }
      ]
    };

    const result = MappingValidator.validateConfig(configNeedingSuggestions);
    
    // Should be valid
    if (!result.valid) {
      throw new Error(`Expected config to be valid. Errors: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    // Should have suggestions
    if (result.suggestions.length === 0) {
      throw new Error('Expected suggestions for configuration improvement');
    }
  });

  test('Empty configuration validation', () => {
    const emptyConfig: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: []
    };

    const result = MappingValidator.validateConfig(emptyConfig);
    if (!result.valid) {
      throw new Error(`Expected empty config to be valid. Errors: ${result.errors.map(e => e.message).join(', ')}`);
    }
  });

  test('Complex valid configuration', () => {
    const complexConfig: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'WillowButton',
          deprecated: false,
          props: [
            {
              source: 'color',
              target: 'variant',
              valueTransformation: {
                type: 'map',
                map: {
                  'primary': 'main',
                  'secondary': 'accent',
                  'error': 'danger'
                }
              }
            },
            {
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
            },
            {
              source: 'disabled',
              target: 'isDisabled'
            }
          ]
        },
        {
          sourceComponent: 'TextField',
          targetComponent: 'WillowInput',
          props: [
            {
              source: 'variant',
              target: 'appearance',
              valueTransformation: {
                type: 'map',
                map: {
                  'outlined': 'border',
                  'filled': 'filled'
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
        },
        {
          source: 'style',
          target: 'sx'
        }
      ],
      options: {
        strictMode: false,
        warnOnUnmappedProps: true,
        preserveUnknownProps: false
      }
    };

    const result = MappingValidator.validateConfig(complexConfig);
    if (!result.valid) {
      throw new Error(`Expected complex config to be valid. Errors: ${result.errors.map(e => e.message).join(', ')}`);
    }
  });

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All mapping validator tests passed!');
    return true;
  } else {
    console.log('❌ Some mapping validator tests failed!');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});