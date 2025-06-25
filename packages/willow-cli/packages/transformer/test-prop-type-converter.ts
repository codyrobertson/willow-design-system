#!/usr/bin/env npx tsx

import * as ts from 'typescript';
import { PropTypeConverter } from './src/converters/prop-type-converter';

console.log('🧪 Testing Prop Type Converter...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
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

const converter = new PropTypeConverter();

// Test Basic Type Conversions
test('basic React type conversions', () => {
  const result1 = converter.convertTypeString('React.ReactNode');
  assert(result1.targetType === 'VNode | string | number', 'Should convert React.ReactNode');
  
  const result2 = converter.convertTypeString('React.CSSProperties');
  assert(result2.targetType === 'CSSProperties', 'Should convert React.CSSProperties');
  
  const result3 = converter.convertTypeString('React.MouseEvent');
  assert(result3.targetType === 'MouseEvent', 'Should convert React.MouseEvent');
});

// Test MUI to Willow Conversions
test('MUI to Willow component prop conversions', () => {
  const result1 = converter.convertTypeString('ButtonProps');
  assert(result1.targetType === 'WillowButtonProps', 'Should convert ButtonProps');
  
  const result2 = converter.convertTypeString('TextFieldProps');
  assert(result2.targetType === 'WillowInputProps', 'Should convert TextFieldProps');
});

// Test Pattern-based Conversions
test('pattern-based type conversions', () => {
  const result1 = converter.convertTypeString('MuiButtonProps');
  assert(result1.targetType === 'WillowButtonProps', 'Should convert MuiButtonProps pattern');
  
  const result2 = converter.convertTypeString('MuiDialogProps');
  assert(result2.targetType === 'WillowDialogProps', 'Should convert MuiDialogProps pattern');
  
  const result3 = converter.convertTypeString('React.FC');
  assert(result3.targetType === 'FunctionalComponent', 'Should convert React.FC');
});

// Test Generic Type Conversions
test('generic type conversions', () => {
  const result1 = converter.convertTypeString('Array<ButtonProps>');
  assert(result1.targetType === 'Array<WillowButtonProps>', 'Should convert generic array type');
  
  const result2 = converter.convertTypeString('React.FC<ButtonProps>');
  assert(result2.targetType === 'FunctionalComponent<WillowButtonProps>', 'Should convert nested generics');
  
  const result3 = converter.convertTypeString('Map<string, ButtonProps>');
  assert(result3.targetType === 'Map<string, WillowButtonProps>', 'Should convert Map with type parameter');
});

// Test Union Type Conversions
test('union type conversions', () => {
  const result1 = converter.convertTypeString('ButtonProps | TextFieldProps');
  assert(result1.targetType === 'WillowButtonProps | WillowInputProps', 'Should convert union types');
  
  const result2 = converter.convertTypeString('string | number | ButtonProps');
  assert(result2.targetType === 'string | number | WillowButtonProps', 'Should handle mixed unions');
  
  const result3 = converter.convertTypeString('React.ReactNode | null');
  assert(result3.targetType === 'VNode | string | number | null', 'Should convert complex unions');
});

// Test Intersection Type Conversions
test('intersection type conversions', () => {
  const result1 = converter.convertTypeString('ButtonProps & { custom: string }');
  assert(result1.targetType === 'WillowButtonProps & { custom: string }', 'Should convert intersection types');
  
  const result2 = converter.convertTypeString('React.CSSProperties & { theme: string }');
  assert(result2.targetType === 'CSSProperties & { theme: string }', 'Should handle intersection with objects');
});

// Test Complex Nested Types
test('complex nested type conversions', () => {
  const result1 = converter.convertTypeString('Array<ButtonProps | TextFieldProps>');
  assert(
    result1.targetType === 'Array<WillowButtonProps | WillowInputProps>',
    'Should convert nested union in generic'
  );
  
  const result2 = converter.convertTypeString('Map<string, Array<ButtonProps>>');
  assert(
    result2.targetType === 'Map<string, Array<WillowButtonProps>>',
    'Should convert deeply nested generics'
  );
});

// Test Custom Type Registration
test('custom type registration', () => {
  converter.registerConversion({
    from: 'CustomType',
    to: 'ConvertedType',
  });
  
  const result = converter.convertTypeString('CustomType');
  assert(result.targetType === 'ConvertedType', 'Should use custom conversion');
  
  // Test with generics
  const result2 = converter.convertTypeString('Array<CustomType>');
  assert(result2.targetType === 'Array<ConvertedType>', 'Should apply custom conversion in generics');
});

// Test Custom Pattern Rules
test('custom pattern rules', () => {
  converter.addTypeMappingRule({
    pattern: /^Legacy(\w+)$/,
    replacement: (match) => `Modern${match.slice(6)}`,
    preserveGenerics: true,
  });
  
  const result = converter.convertTypeString('LegacyComponent');
  assert(result.targetType === 'ModernComponent', 'Should apply custom pattern rule');
});

// Test Type Node Conversion (without TypeChecker)
test('type node conversion without type checker', () => {
  const sourceCode = `type Props = { color: ButtonProps; }`;
  const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
  
  let found = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isTypeAliasDeclaration(node) && node.type && ts.isTypeLiteralNode(node.type)) {
      const propType = node.type.members[0];
      if (ts.isPropertySignature(propType) && propType.type) {
        found = true;
        const result = converter.convertTypeNode(propType.type);
        assert(result.warnings.length > 0, 'Should have warning about missing type checker');
        assert(result.targetType === 'WillowButtonProps', 'Should still convert using string method');
      }
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(found, 'Should find type node');
});

// Test Edge Cases
test('edge cases and special types', () => {
  const result1 = converter.convertTypeString('unknown');
  assert(result1.targetType === 'unknown', 'Should preserve unknown type');
  
  const result2 = converter.convertTypeString('any');
  assert(result2.targetType === 'any', 'Should preserve any type');
  
  const result3 = converter.convertTypeString('void');
  assert(result3.targetType === 'void', 'Should preserve void type');
  
  const result4 = converter.convertTypeString('never');
  assert(result4.targetType === 'never', 'Should preserve never type');
});

// Test Multiple Generic Arguments
test('multiple generic arguments', () => {
  const result = converter.convertTypeString('Map<ButtonProps, TextFieldProps>');
  assert(
    result.targetType === 'Map<WillowButtonProps, WillowInputProps>',
    'Should convert multiple generic arguments'
  );
});

// Test Preserve Generics Option
test('preserve generics in pattern rules', () => {
  const result = converter.convertTypeString('React.FC<{ color: string }>');
  assert(
    result.targetType === 'FunctionalComponent<{ color: string }>',
    'Should preserve generic arguments'
  );
});

// Test Clear Custom Conversions
test('clear custom conversions', () => {
  converter.registerConversion({
    from: 'TempType',
    to: 'TempConverted',
  });
  
  let result = converter.convertTypeString('TempType');
  assert(result.targetType === 'TempConverted', 'Should have custom conversion');
  
  converter.clearCustomConversions();
  
  result = converter.convertTypeString('TempType');
  assert(result.targetType === 'TempType', 'Should not have custom conversion after clear');
  
  // Built-in conversions should still work
  result = converter.convertTypeString('ButtonProps');
  assert(result.targetType === 'WillowButtonProps', 'Built-in conversions should be restored');
});

// Test Generate Type Imports
test('generate type imports', () => {
  const conversions = [
    {
      success: true,
      sourceType: 'React.ReactNode',
      targetType: 'VNode',
      requiresImport: { module: 'vue', types: ['VNode'] },
      warnings: [],
    },
    {
      success: true,
      sourceType: 'ButtonProps',
      targetType: 'WillowButtonProps',
      requiresImport: { module: '@willow/ui', types: ['WillowButtonProps'] },
      warnings: [],
    },
    {
      success: true,
      sourceType: 'TextFieldProps',
      targetType: 'WillowInputProps',
      requiresImport: { module: '@willow/ui', types: ['WillowInputProps'] },
      warnings: [],
    },
  ];
  
  const imports = converter.generateTypeImports(conversions);
  assert(imports.length === 2, 'Should generate 2 import statements');
  assert(imports.some(i => i.includes('vue')), 'Should include vue import');
  assert(imports.some(i => i.includes('@willow/ui')), 'Should include @willow/ui import');
  assert(
    imports.some(i => i.includes('WillowButtonProps') && i.includes('WillowInputProps')),
    'Should combine imports from same module'
  );
});

// Summary
console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All prop type converter tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${testsFailed} test(s) failed`);
  process.exit(1);
}