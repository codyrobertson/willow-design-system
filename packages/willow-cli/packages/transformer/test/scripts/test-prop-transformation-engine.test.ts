#!/usr/bin/env npx tsx

import { PropTransformationEngine } from '../../src/engines/prop-transformation-engine';
import type { ComponentMappingConfig } from '../../src/schemas/component-mapping.schema';
import * as ts from 'typescript';

console.log('🧪 Testing Prop Transformation Engine...\n');

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

// Test Configuration
const config: ComponentMappingConfig = {
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
          source: 'size',
          target: 'size'
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
          target: 'appearance'
        },
        {
          source: 'error',
          target: 'hasError'
        }
      ]
    }
  ]
};

const engine = new PropTransformationEngine(config);

// Test Basic JSX Element Transformation
test('basic JSX self-closing element transformation', () => {
  const sourceCode = `<Button color="primary" size="large" />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let found = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)) {
      found = true;
      const result = engine.transformJsxElementProps(node, 'Button', {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: { color: 'primary', size: 'large' }
      });
      
      assert(result.success, 'Transformation should succeed');
      assert(result.transformedProps.variant === 'primary', 'color should map to variant');
      assert(result.transformedProps.size === 'large', 'size should remain unchanged');
      assert(result.componentName === 'WillowButton', 'Component name should be transformed');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(found, 'Should find JSX element');
});

// Test JSX Element with Opening/Closing Tags
test('JSX element with opening/closing tags transformation', () => {
  const sourceCode = `<Button color="secondary">Click me</Button>`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let found = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxElement(node) && ts.isIdentifier(node.openingElement.tagName)) {
      found = true;
      const result = engine.transformJsxElementProps(node, 'Button', {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: { color: 'secondary' }
      });
      
      assert(result.success, 'Transformation should succeed');
      assert(result.transformedProps.variant === 'secondary', 'color should map to variant');
      assert(result.componentName === 'WillowButton', 'Component name should be transformed');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(found, 'Should find JSX element');
});

// Test Multiple Props Transformation
test('multiple props transformation', () => {
  const sourceCode = `<Button color="primary" size="small" disabled={true} />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let found = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)) {
      found = true;
      const result = engine.transformJsxElementProps(node, 'Button', {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: { color: 'primary', size: 'small', disabled: true }
      });
      
      assert(result.success, 'Transformation should succeed');
      assert(result.transformedProps.variant === 'primary', 'color should map to variant');
      assert(result.transformedProps.size === 'small', 'size should pass through');
      assert(result.transformedProps.isDisabled === true, 'disabled should map to isDisabled');
      assert(!('color' in result.transformedProps), 'Original color prop should be removed');
      assert(!('disabled' in result.transformedProps), 'Original disabled prop should be removed');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(found, 'Should find JSX element');
});

// Test Unknown Component
test('unknown component handling', () => {
  const sourceCode = `<UnknownComponent color="primary" />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let found = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)) {
      found = true;
      const result = engine.transformJsxElementProps(node, 'UnknownComponent', {
        componentName: 'UnknownComponent',
        filePath: 'test.tsx',
        props: { color: 'primary' }
      });
      
      assert(result.success, 'Should succeed even for unknown component');
      assert(result.componentName === 'UnknownComponent', 'Unknown component name should remain unchanged');
      assert(result.transformedProps.color === 'primary', 'Props should pass through unchanged');
      assert(result.warnings.length > 0, 'Should have warnings about unknown component');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(found, 'Should find JSX element');
});

// Test TextField Component
test('TextField component transformation', () => {
  const sourceCode = `<TextField variant="outlined" error={true} />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let found = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)) {
      found = true;
      const result = engine.transformJsxElementProps(node, 'TextField', {
        componentName: 'TextField',
        filePath: 'test.tsx',
        props: { variant: 'outlined', error: true }
      });
      
      assert(result.success, 'Transformation should succeed');
      assert(result.componentName === 'WillowInput', 'TextField should map to WillowInput');
      assert(result.transformedProps.appearance === 'outlined', 'variant should map to appearance');
      assert(result.transformedProps.hasError === true, 'error should map to hasError');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(found, 'Should find JSX element');
});

// Test Empty Props
test('empty props handling', () => {
  const sourceCode = `<Button />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let found = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)) {
      found = true;
      const result = engine.transformJsxElementProps(node, 'Button', {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {}
      });
      
      assert(result.success, 'Transformation should succeed');
      assert(result.componentName === 'WillowButton', 'Component name should be transformed');
      assert(Object.keys(result.transformedProps).length === 0, 'Should have no transformed props');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(found, 'Should find JSX element');
});

// Test Batch Transformation
test('batch transformation of components', () => {
  const components = [
    { name: 'Button', context: { componentName: 'Button', filePath: 'test.tsx', props: { color: 'primary' } } },
    { name: 'TextField', context: { componentName: 'TextField', filePath: 'test.tsx', props: { variant: 'filled' } } },
    { name: 'Unknown', context: { componentName: 'Unknown', filePath: 'test.tsx', props: { foo: 'bar' } } }
  ];
  
  const results = engine.transformBatch(components);
  
  assert(results.length === 3, 'Should have 3 results');
  assert(results[0].componentName === 'WillowButton', 'First should be WillowButton');
  assert(results[1].componentName === 'WillowInput', 'Second should be WillowInput');
  assert(results[2].componentName === 'Unknown', 'Third should remain Unknown');
  
  assert(results[0].transformedProps.variant === 'primary', 'Button color should map to variant');
  assert(results[1].transformedProps.appearance === 'filled', 'TextField variant should map to appearance');
  assert(results[2].transformedProps.foo === 'bar', 'Unknown component props should pass through');
});

// Test Get Mapping
test('get component mapping', () => {
  const buttonMapping = engine.getComponentMapping('Button');
  assert(buttonMapping !== null, 'Should find Button mapping');
  assert(buttonMapping?.targetComponent === 'WillowButton', 'Should map to WillowButton');
  
  const unknownMapping = engine.getComponentMapping('Unknown');
  assert(unknownMapping === null, 'Should not find Unknown mapping');
});

// Test Has Mapping
test('has component mapping', () => {
  assert(engine.hasComponentMapping('Button') === true, 'Should have Button mapping');
  assert(engine.hasComponentMapping('TextField') === true, 'Should have TextField mapping');
  assert(engine.hasComponentMapping('Unknown') === false, 'Should not have Unknown mapping');
});

// Test Clear Cache
test('cache clearing', () => {
  // First transformation
  engine.transformJsxElementProps(
    {} as any,
    'Button',
    { componentName: 'Button', filePath: 'test.tsx', props: { color: 'primary' } }
  );
  
  // Clear cache
  engine.clearCache();
  
  // Transformation after cache clear should still work
  const result = engine.transformJsxElementProps(
    {} as any,
    'Button',
    { componentName: 'Button', filePath: 'test.tsx', props: { color: 'secondary' } }
  );
  
  assert(result.success, 'Should work after cache clear');
  assert(result.transformedProps.variant === 'secondary', 'Should transform correctly after cache clear');
});

// Summary
console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All prop transformation engine tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${testsFailed} test(s) failed`);
  process.exit(1);
}