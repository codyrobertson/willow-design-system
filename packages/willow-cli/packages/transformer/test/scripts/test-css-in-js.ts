#!/usr/bin/env npx tsx

import * as ts from 'typescript';
import { CSSInJSParser } from '../../src/styles/css-in-js/css-in-js-parser';
import { CSSInJSTransformer } from '../../src/styles/css-in-js/css-in-js-transformer';
import { StyleTransformerFactory } from '../../src/styles/style-transformer-factory';
import {
  StyleType,
  type StyleTransformationContext,
  type StyleTransformerConfig,
} from '../../src/types/style-transformation.types';

console.log('🧪 Testing CSS-in-JS Parser and Transformer...\n');

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

function createASTNode(code: string): ts.Node {
  const sourceFile = ts.createSourceFile(
    'test.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  
  // Find the first expression
  let result: ts.Node | undefined;
  const visitor = (node: ts.Node): ts.Node => {
    if (!result && ts.isExpressionStatement(node)) {
      result = (node as ts.ExpressionStatement).expression;
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  
  if (!result) {
    throw new Error('Could not find expression in code');
  }
  
  return result;
}

// Run tests
(async () => {
  const parser = new CSSInJSParser();
  const transformer = new CSSInJSTransformer();
  
  const context: StyleTransformationContext = {
    styleType: StyleType.CSS_IN_JS,
    sourceFramework: 'mui',
    targetFramework: 'willow',
    filePath: 'test.tsx',
  };

  // Test 1: Parse simple object literal
  await test('Parse simple CSS-in-JS object', () => {
    const node = createASTNode(`({
      color: 'red',
      fontSize: 16,
      padding: '10px'
    })`);
    
    const parsed = parser.parse(node, context);
    assert(parsed.color === 'red');
    assert(parsed.fontSize === 16);
    assert(parsed.padding === '10px');
  });

  // Test 2: Parse nested selectors
  await test('Parse nested selectors', () => {
    const node = createASTNode(`({
      color: 'blue',
      '&:hover': {
        color: 'red',
        backgroundColor: 'yellow'
      },
      '@media (min-width: 768px)': {
        fontSize: 18
      }
    })`);
    
    const parsed = parser.parse(node, context);
    assert(parsed.color === 'blue');
    assert(parsed['&:hover'].color === 'red');
    assert(parsed['@media (min-width: 768px)'].fontSize === 18);
  });

  // Test 3: Parse string input
  await test('Parse string JSON input', () => {
    const input = JSON.stringify({
      display: 'flex',
      alignItems: 'center',
      gap: 16
    });
    
    const parsed = parser.parse(input, context);
    assert(parsed.display === 'flex');
    assert(parsed.alignItems === 'center');
    assert(parsed.gap === 16);
  });

  // Test 4: Serialize parsed object
  await test('Serialize CSS-in-JS object', () => {
    const obj = {
      margin: 0,
      padding: '10px 20px',
      nested: {
        color: 'green'
      }
    };
    
    const serialized = parser.serialize(obj, context);
    assert(serialized.includes('margin: 0'));
    assert(serialized.includes('padding: "10px 20px"'));
    assert(serialized.includes('nested: {'));
    assert(serialized.includes('color: "green"'));
  });

  // Test 5: Transform with property mappings
  await test('Transform with property mappings', async () => {
    const config: StyleTransformerConfig = {
      propertyMappings: [
        { source: 'color', target: 'textColor' },
        { source: 'backgroundColor', target: 'bgColor' },
        { source: 'fontSize', target: 'textSize' }
      ],
      preserveUnknownProperties: true
    };
    
    const input = {
      color: 'red',
      backgroundColor: 'blue',
      fontSize: 16,
      margin: 10
    };
    
    const result = await transformer.transform(input, context, config);
    if (!result.success) {
      console.error('Transform errors:', result.errors);
      console.error('Transform warnings:', result.warnings);
    }
    assert(result.success === true, 'Transform should succeed');
    const transformed = result.transformed as any;
    assert(transformed.textColor === 'red', `Expected textColor to be 'red', got ${transformed.textColor}`);
    assert(transformed.bgColor === 'blue', `Expected bgColor to be 'blue', got ${transformed.bgColor}`);
    assert(transformed.textSize === 16, `Expected textSize to be 16, got ${transformed.textSize}`);
    assert(transformed.margin === 10, `Expected margin to be 10, got ${transformed.margin}`); // preserved
  });

  // Test 6: Transform with token mappings
  await test('Transform with token mappings', async () => {
    const config: StyleTransformerConfig = {
      tokenMappings: [
        {
          sourceToken: 'colors.primary',
          targetToken: 'theme.brand.500',
          category: 'color'
        },
        {
          sourceToken: 'spacing.4',
          targetToken: '1rem',
          category: 'spacing'
        }
      ],
      preserveUnknownProperties: true  // Add this to preserve properties
    };
    
    const input = {
      color: '${colors.primary}',
      padding: 'var(--spacing-4)',
      margin: '${spacing.4} ${spacing.4}'
    };
    
    const result = await transformer.transform(input, context, config);
    assert(result.success === true, 'Token transform should succeed');
    const transformed = result.transformed as any;
    assert(transformed.color === 'theme.brand.500', `Expected color to be 'theme.brand.500', got ${transformed.color}`);
    assert(transformed.padding === '1rem', `Expected padding to be '1rem', got ${transformed.padding}`);
    assert(transformed.margin === '1rem 1rem', `Expected margin to be '1rem 1rem', got ${transformed.margin}`);
  });

  // Test 7: Transform nested selectors
  await test('Transform nested selectors', async () => {
    const config: StyleTransformerConfig = {
      propertyMappings: [
        { source: 'color', target: 'textColor' }
      ]
    };
    
    const input = {
      color: 'black',
      '&:hover': {
        color: 'blue'
      },
      '& .child': {
        color: 'green'
      }
    };
    
    const result = await transformer.transform(input, context, config);
    assert(result.success === true);
    assert(result.transformed.textColor === 'black');
    assert(result.transformed['&:hover'].textColor === 'blue');
    assert(result.transformed['& .child'].textColor === 'green');
  });

  // Test 8: Handle array values
  await test('Handle array values', async () => {
    const input = {
      fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
      boxShadow: [
        '0 1px 3px rgba(0,0,0,0.12)',
        '0 1px 2px rgba(0,0,0,0.24)'
      ]
    };
    
    const result = await transformer.transform(input, context, { preserveUnknownProperties: true });
    assert(result.success === true, 'Array transform should succeed');
    const transformed = result.transformed as any;
    assert(Array.isArray(transformed.fontFamily), `fontFamily should be array, got ${typeof transformed.fontFamily}`);
    assert(transformed.fontFamily.length === 3, `Expected 3 fonts, got ${transformed.fontFamily.length}`);
    assert(Array.isArray(transformed.boxShadow), 'boxShadow should be array');
  });

  // Test 9: Parse template literals
  await test('Parse template literals', () => {
    const node = createASTNode('({ color: `rgba(255, 0, 0, 0.5)` })');
    
    const parsed = parser.parse(node, context);
    assert(parsed.color === 'rgba(255, 0, 0, 0.5)');
  });

  // Test 10: Count transformations
  await test('Count transformations correctly', async () => {
    const config: StyleTransformerConfig = {
      propertyMappings: [
        { source: 'color', target: 'textColor' },
        { source: 'margin', target: 'spacing' }
      ]
    };
    
    const input = {
      color: 'red',
      margin: 10,
      padding: 20 // Not transformed
    };
    
    const result = await transformer.transform(input, context, config);
    assert(result.success === true, 'Count transform should succeed');
    // The counting includes properties that are transformed (name changes) plus unmapped properties in non-strict mode
    // color->textColor (1), margin->spacing (1), padding removed (1) = 3 total
    const expected = 3;
    assert(result.metadata?.transformationsApplied === expected, `Expected ${expected} transformations, got ${result.metadata?.transformationsApplied}`);
  });

  // Test 11: Handle spread properties
  await test('Handle spread properties in AST', () => {
    const node = createASTNode(`({
      ...baseStyles,
      color: 'red',
      fontSize: 16
    })`);
    
    // Parser should handle spread gracefully
    const parsed = parser.parse(node, context);
    assert(parsed.color === 'red');
    assert(parsed.fontSize === 16);
  });

  // Test 12: Error handling
  await test('Error handling for invalid input', async () => {
    const result = await transformer.transform(
      'invalid css string {{',
      context,
      {}
    );
    
    assert(result.success === false);
    assert(result.errors.length > 0);
    assert(result.errors[0].includes('Invalid CSS-in-JS'));
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All CSS-in-JS tests passed! 🎉');
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();