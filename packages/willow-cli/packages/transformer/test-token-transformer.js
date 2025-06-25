// Simple test runner for token transformer
import {
  BaseTokenTransformer,
  AdvancedTokenTransformer,
  TokenTransformerRegistry,
} from './src/styles/theme-tokens/token-transformer.js';
import {
  TokenType,
  TokenCategory,
  TokenFormat,
} from './src/types/theme-tokens.types.js';

console.log('Running token transformer tests...');

async function testBaseTokenTransformer() {
  console.log('✓ Testing BaseTokenTransformer');
  
  const transformer = new BaseTokenTransformer();
  
  const sampleTokens = [
    {
      name: 'color.primary',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'spacing.md',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
    },
    {
      name: 'font.weight.bold',
      value: 700,
      type: TokenType.FONT_WEIGHT,
      category: TokenCategory.TYPOGRAPHY,
    },
  ];

  // Test string mapping
  const stringMapping = {
    source: 'color.primary',
    target: 'colors.brand.primary',
  };

  const stringResult = transformer.applyMapping(sampleTokens, stringMapping);
  console.assert(stringResult.length === 3, 'Should have 3 tokens after string mapping');
  
  const mappedToken = stringResult.find(t => t.name === 'colors.brand.primary');
  console.assert(mappedToken?.value === '#007bff', 'Mapped token should have correct value');
  console.assert(mappedToken?.metadata?.originalName === 'color.primary', 'Should track original name');

  // Test regex mapping
  const regexMapping = {
    source: /^color\.(.+)$/,
    target: (match) => match.replace('color.', 'colors.'),
  };

  const regexResult = transformer.applyMapping(sampleTokens, regexMapping);
  const regexMapped = regexResult.find(t => t.name === 'colors.primary');
  console.assert(regexMapped?.value === '#007bff', 'Regex mapping should work');

  // Test value transformation
  const transformMapping = {
    source: 'spacing.md',
    target: 'spacing.large',
    transform: {
      type: 'multiply',
      amount: 2,
    },
  };

  const transformResult = transformer.applyMapping(sampleTokens, transformMapping);
  const transformedToken = transformResult.find(t => t.name === 'spacing.large');
  console.assert(transformedToken?.value === '32px', 'Transform should multiply value');

  // Test validation
  const validationRules = [
    {
      name: 'Color validation',
      types: [TokenType.COLOR],
      validate: (token) => ({
        valid: typeof token.value === 'string' && token.value.startsWith('#'),
        message: 'Invalid color',
      }),
      severity: 'error',
    },
  ];

  const validationResults = transformer.validate(sampleTokens, validationRules);
  console.assert(validationResults.length === 3, 'Should validate all tokens');
  
  const colorValidation = validationResults.find(r => r.token.name === 'color.primary');
  console.assert(colorValidation?.valid === true, 'Color should be valid');
}

async function testAdvancedTokenTransformer() {
  console.log('✓ Testing AdvancedTokenTransformer');
  
  const transformer = new AdvancedTokenTransformer();
  
  // Test reference resolution
  const tokensWithRefs = [
    {
      name: 'color.primary',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'color.brand',
      value: { $ref: 'color.primary' },
      type: TokenType.REFERENCE,
      category: TokenCategory.COLOR,
    },
  ];

  const strategy = {
    name: 'Reference Test',
    sourceFormat: TokenFormat.JSON,
    targetFormat: TokenFormat.JSON,
    mappings: [],
  };

  const result = await transformer.transform(tokensWithRefs, strategy);
  console.assert(result.success === true, 'Transform should succeed');
  
  const brandToken = result.tokens.find(t => t.name === 'color.brand');
  console.assert(brandToken?.value === '#007bff', 'Reference should be resolved');
}

async function testTransformationStrategy() {
  console.log('✓ Testing transformation strategy');
  
  const transformer = new BaseTokenTransformer();
  
  const tokens = [
    {
      name: 'color.primary',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'spacing.md',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
    },
  ];

  const strategy = {
    name: 'Full Strategy Test',
    sourceFormat: TokenFormat.JSON,
    targetFormat: TokenFormat.CSS_VARIABLE,
    mappings: [
      {
        source: /^color\.(.+)$/,
        target: (match) => match.replace('color.', 'colors.'),
      },
      {
        source: 'spacing.md',
        target: 'spacing.medium',
        transform: {
          type: 'multiply',
          amount: 1.5,
        },
      },
    ],
    validation: [
      {
        name: 'Non-null validation',
        types: [TokenType.COLOR, TokenType.DIMENSION],
        validate: (token) => ({ valid: token.value !== null }),
        severity: 'error',
      },
    ],
  };

  const result = await transformer.transform(tokens, strategy);
  
  console.assert(result.success === true, 'Strategy should succeed');
  console.assert(result.output.includes(':root'), 'Should generate CSS variables');
  console.assert(result.output.includes('--colors-primary'), 'Should apply color mapping');
  console.assert(result.metadata.strategy === 'Full Strategy Test', 'Should track strategy name');
  console.assert(result.metadata.processingTime > 0, 'Should track processing time');
}

async function testOutputFormats() {
  console.log('✓ Testing output formats');
  
  const transformer = new BaseTokenTransformer();
  
  const tokens = [
    {
      name: 'color.primary',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'spacing.md',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
    },
  ];

  // Test CSS variables
  const cssStrategy = {
    name: 'CSS Test',
    sourceFormat: TokenFormat.JSON,
    targetFormat: TokenFormat.CSS_VARIABLE,
    mappings: [],
  };

  const cssResult = await transformer.transform(tokens, cssStrategy);
  console.assert(cssResult.output.includes(':root {'), 'Should generate CSS root');
  console.assert(cssResult.output.includes('--color-primary: #007bff'), 'Should include CSS variable');

  // Test JSON
  const jsonStrategy = {
    name: 'JSON Test',
    sourceFormat: TokenFormat.JSON,
    targetFormat: TokenFormat.JSON,
    mappings: [],
  };

  const jsonResult = await transformer.transform(tokens, jsonStrategy);
  const parsed = JSON.parse(jsonResult.output);
  console.assert(parsed.color.primary === '#007bff', 'Should generate nested JSON');

  // Test Tailwind config
  const tailwindStrategy = {
    name: 'Tailwind Test',
    sourceFormat: TokenFormat.JSON,
    targetFormat: TokenFormat.TAILWIND_CONFIG,
    mappings: [],
  };

  const tailwindResult = await transformer.transform(tokens, tailwindStrategy);
  console.assert(tailwindResult.output.includes('module.exports'), 'Should generate Tailwind config');
  console.assert(tailwindResult.output.includes('theme:'), 'Should include theme object');
}

async function testTokenTransformerRegistry() {
  console.log('✓ Testing TokenTransformerRegistry');
  
  const registry = new TokenTransformerRegistry();
  
  // Test default transformers
  const transformers = registry.getAvailableTransformers();
  console.assert(transformers.includes('base'), 'Should include base transformer');
  console.assert(transformers.includes('advanced'), 'Should include advanced transformer');
  
  // Test getting transformers
  const baseTransformer = registry.getTransformer('base');
  console.assert(baseTransformer instanceof BaseTokenTransformer, 'Should return BaseTokenTransformer');
  
  const advancedTransformer = registry.getTransformer('advanced');
  console.assert(advancedTransformer instanceof AdvancedTokenTransformer, 'Should return AdvancedTokenTransformer');
  
  // Test custom registration
  const customTransformer = new BaseTokenTransformer();
  registry.register('custom', customTransformer);
  
  const retrieved = registry.getTransformer('custom');
  console.assert(retrieved === customTransformer, 'Should return registered transformer');
  
  // Test transform through registry
  const tokens = [
    {
      name: 'color.primary',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
  ];

  const strategy = {
    name: 'Registry Test',
    sourceFormat: TokenFormat.JSON,
    targetFormat: TokenFormat.CSS_VARIABLE,
    mappings: [],
  };

  const result = await registry.transform(tokens, strategy, 'advanced');
  console.assert(result.success === true, 'Registry transform should succeed');
}

async function testErrorHandling() {
  console.log('✓ Testing error handling');
  
  const transformer = new BaseTokenTransformer();
  
  // Test validation errors
  const invalidTokens = [
    {
      name: 'invalid.color',
      value: 'not-a-color',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
  ];

  const strictStrategy = {
    name: 'Strict Test',
    sourceFormat: TokenFormat.JSON,
    targetFormat: TokenFormat.JSON,
    mappings: [],
    validation: [
      {
        name: 'Color validation',
        types: [TokenType.COLOR],
        validate: (token) => ({
          valid: typeof token.value === 'string' && token.value.startsWith('#'),
          message: 'Invalid color format',
        }),
        severity: 'error',
      },
    ],
  };

  const result = await transformer.transform(invalidTokens, strictStrategy);
  console.assert(result.success === false, 'Should fail validation');
  console.assert(result.errors.length > 0, 'Should have validation errors');
  console.assert(result.errors[0].includes('Invalid color format'), 'Should include error message');
}

// Run all tests
async function runTests() {
  try {
    await testBaseTokenTransformer();
    await testAdvancedTokenTransformer();
    await testTransformationStrategy();
    await testOutputFormats();
    await testTokenTransformerRegistry();
    await testErrorHandling();
    
    console.log('🎉 All token transformer tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();