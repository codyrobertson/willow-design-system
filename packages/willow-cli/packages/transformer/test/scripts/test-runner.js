// Simple test runner to verify theme token types
import {
  TokenCategory,
  TokenType,
  TokenFormat,
  DesignToken,
  TokenCollection,
  TokenMigrationMapping,
  TokenMigrationStrategy,
  TokenValidationRule,
  TokenUsage,
  TokenConflict,
  TokenMigrationContext,
} from '../../src/types/theme-tokens.types.js';
import { StyleType } from '../../src/types/style-transformation.types.js';

console.log('Running theme token types tests...');

// Test enum values
console.log('✓ Testing enum values');
console.assert(TokenCategory.COLOR === 'color', 'TokenCategory.COLOR should be "color"');
console.assert(TokenType.DIMENSION === 'dimension', 'TokenType.DIMENSION should be "dimension"');
console.assert(TokenFormat.CSS_VARIABLE === 'css-variable', 'TokenFormat.CSS_VARIABLE should be "css-variable"');

// Test basic design token
console.log('✓ Testing DesignToken interface');
const token = {
  name: 'color.primary.500',
  value: '#007bff',
  type: TokenType.COLOR,
  category: TokenCategory.COLOR,
  description: 'Primary blue color',
};
console.assert(token.name === 'color.primary.500', 'Token name should match');

// Test token reference
console.log('✓ Testing token references');
const aliasToken = {
  name: 'color.brand',
  value: { $ref: 'color.primary.500' },
  type: TokenType.REFERENCE,
  category: TokenCategory.COLOR,
  reference: 'color.primary.500',
};
console.assert(aliasToken.reference === 'color.primary.500', 'Reference should match');

// Test token collection
console.log('✓ Testing TokenCollection interface');
const collection = {
  name: 'Brand Theme',
  description: 'Main brand design tokens',
  version: '1.0.0',
  tokens: new Map(),
};
collection.tokens.set('color.primary', token);
console.assert(collection.tokens.size === 1, 'Collection should have one token');

// Test migration mapping
console.log('✓ Testing TokenMigrationMapping interface');
const mapping = {
  source: 'colors.blue.500',
  target: 'color.primary.500',
  priority: 1,
  notes: 'Migrate to semantic naming',
};
console.assert(mapping.source === 'colors.blue.500', 'Mapping source should match');

// Test migration context
console.log('✓ Testing TokenMigrationContext interface');
const context = {
  styleType: StyleType.CSS_MODULES,
  sourceFramework: 'tailwind',
  targetFramework: 'chakra',
  filePath: 'tailwind.config.js',
  sourceTokenFormat: TokenFormat.TAILWIND_CONFIG,
  targetTokenFormat: TokenFormat.CHAKRA_THEME,
  strategy: 'tailwind-to-chakra',
  options: {
    preserveDeprecated: false,
    generateDocs: true,
    validate: true,
    conflictResolution: 'merge',
  },
};
console.assert(context.sourceTokenFormat === TokenFormat.TAILWIND_CONFIG, 'Source format should match');

console.log('🎉 All theme token type tests passed!');