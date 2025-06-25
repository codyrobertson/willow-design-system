#!/usr/bin/env npx tsx

import * as ts from 'typescript';
import { PropSpreadingHandler } from './src/handlers/prop-spreading-handler';
import type { PropertyMapping } from './src/schemas/component-mapping.schema';

console.log('🧪 Testing Prop Spreading Handler...\n');

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

const handler = new PropSpreadingHandler();

// Test prop mappings
const propMappings: PropertyMapping[] = [
  { source: 'color', target: 'variant', spread: false },
  { source: 'size', target: 'size', spread: false },
  { source: 'disabled', target: 'isDisabled', spread: false },
  { source: 'className', target: 'className', spread: true },
  { source: 'style', target: 'style', spread: true },
  { source: 'omitMe', target: 'omitted', omit: true },
];

// Test Extract Props from Spread
test('extract props from spread object', () => {
  const props = {
    color: 'primary',
    size: 'large',
    disabled: true,
    className: 'custom-class',
    style: { margin: 10 },
    unknownProp: 'value',
  };

  const result = handler.extractPropsFromSpread(props, propMappings);
  
  assert(result.extracted.variant === 'primary', 'Should extract and transform color to variant');
  assert(result.extracted.size === 'large', 'Should extract size');
  assert(result.extracted.isDisabled === true, 'Should extract and transform disabled to isDisabled');
  assert(!result.extracted.className, 'Should not extract className (spread=true)');
  assert(!result.extracted.style, 'Should not extract style (spread=true)');
  
  assert(result.remaining.className === 'custom-class', 'Should keep className in remaining');
  assert(result.remaining.style.margin === 10, 'Should keep style in remaining');
  assert(result.remaining.unknownProp === 'value', 'Should keep unknown props in remaining');
  assert(!result.remaining.color, 'Should not keep color in remaining');
  
  assert(result.transformations.length === 3, 'Should have 3 transformations');
  assert(result.transformations.some(t => t.from === 'color' && t.to === 'variant'), 'Should track color transformation');
});

// Test Filter Props Option
test('filter props option', () => {
  const props = {
    color: 'primary',
    'data-testid': 'button-test',
    'aria-label': 'Click me',
    onClick: 'handleClick',
  };

  const result = handler.extractPropsFromSpread(props, propMappings, {
    filterProps: ['data-testid', 'aria-label'],
  });
  
  assert(result.extracted.variant === 'primary', 'Should extract color as variant');
  assert(!result.remaining['data-testid'], 'Should filter out data-testid');
  assert(!result.remaining['aria-label'], 'Should filter out aria-label');
  assert(result.remaining.onClick === 'handleClick', 'Should keep onClick');
});

// Test Create Spread Expression
test('create spread expression from remaining props', () => {
  const remainingProps = {
    className: 'custom-class',
    style: { margin: 10 },
    onClick: 'handleClick',
  };

  const expr = handler.createSpreadExpression(remainingProps, 'props');
  assert(expr.includes('className:'), 'Should include className');
  assert(expr.includes('style:'), 'Should include style');
  assert(expr.includes('onClick:'), 'Should include onClick');
});

// Test Empty Remaining Props
test('empty remaining props returns empty string', () => {
  const expr = handler.createSpreadExpression({}, 'props');
  assert(expr === '', 'Should return empty string for no remaining props');
});

// Test Preserve Original Spread Option
test('preserve original spread option', () => {
  const remainingProps = { a: 1, b: 2 };
  const expr = handler.createSpreadExpression(remainingProps, 'originalProps', {
    preserveOriginalSpread: true,
  });
  assert(expr === '...originalProps', 'Should preserve original spread expression');
});

// Test Merge Spread with Existing
test('merge spread with existing props - after position', () => {
  const spreadProps = { color: 'red', size: 'large' };
  const existingProps = { color: 'blue', disabled: true };
  
  const merged = handler.mergeSpreadWithExisting(spreadProps, existingProps, {
    spreadPosition: 'after',
  });
  
  assert(merged.color === 'red', 'Spread props should override when position is after');
  assert(merged.size === 'large', 'Should include spread props');
  assert(merged.disabled === true, 'Should include existing props');
});

test('merge spread with existing props - before position', () => {
  const spreadProps = { color: 'red', size: 'large' };
  const existingProps = { color: 'blue', disabled: true };
  
  const merged = handler.mergeSpreadWithExisting(spreadProps, existingProps, {
    spreadPosition: 'before',
  });
  
  assert(merged.color === 'blue', 'Existing props should override when spread position is before');
  assert(merged.size === 'large', 'Should include spread props');
  assert(merged.disabled === true, 'Should include existing props');
});

// Test Handle Spread Props with Object Literal
test('handle spread props with object literal', () => {
  const sourceCode = `<Button {...{ color: 'primary', size: 'large' }} />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let foundSpread = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSpreadAttribute(node)) {
      foundSpread = true;
      const result = handler.handleSpreadProps(node, propMappings, {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      });
      
      assert(result.success, 'Should handle object literal spread successfully');
      assert(result.extractedProps.variant === 'primary', 'Should extract color as variant');
      assert(result.extractedProps.size === 'large', 'Should extract size');
      assert(Object.keys(result.remainingProps).length === 0, 'Should have no remaining props for simple literals');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(foundSpread, 'Should find spread attribute');
});

// Test Handle Spread Props with Identifier
test('handle spread props with identifier', () => {
  const sourceCode = `<Button {...props} />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let foundSpread = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSpreadAttribute(node)) {
      foundSpread = true;
      const result = handler.handleSpreadProps(node, propMappings, {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      });
      
      assert(result.success, 'Should handle identifier spread');
      assert(result.warnings.length > 0, 'Should have warning about static analysis');
      assert(result.warnings[0].includes('Cannot statically analyze'), 'Warning should mention static analysis');
      assert('...props' in result.remainingProps, 'Should keep identifier spread in remaining');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(foundSpread, 'Should find spread attribute');
});

// Test Handle Spread Props with Function Call
test('handle spread props with function call', () => {
  const sourceCode = `<Button {...getProps()} />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let foundSpread = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSpreadAttribute(node)) {
      foundSpread = true;
      const result = handler.handleSpreadProps(node, propMappings, {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      });
      
      assert(result.success, 'Should handle function call spread');
      assert(result.warnings.length > 0, 'Should have warning about function call');
      assert(result.warnings[0].includes('function call'), 'Warning should mention function call');
      assert('...getProps()' in result.remainingProps, 'Should keep function call spread');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(foundSpread, 'Should find spread attribute');
});

// Test Should Spread Prop
test('should spread prop logic', () => {
  const spreadMapping: PropertyMapping = { source: 'className', target: 'className', spread: true };
  const noSpreadMapping: PropertyMapping = { source: 'color', target: 'variant', spread: false };
  
  assert(handler.shouldSpreadProp('className', spreadMapping) === true, 'Should spread when spread=true');
  assert(handler.shouldSpreadProp('color', noSpreadMapping) === false, 'Should not spread when spread=false');
  assert(handler.shouldSpreadProp('unknownProp') === true, 'Should spread unknown props by default');
});

// Test Generate Transformed Spread Code
test('generate transformed spread code', () => {
  const extractedProps = { variant: 'primary', size: 'large' };
  const remainingSpread = '{...restProps}';
  
  const code1 = handler.generateTransformedSpreadCode(extractedProps, remainingSpread, {
    spreadPosition: 'before',
  });
  assert(code1.startsWith('{...restProps}'), 'Should put spread first when position is before');
  assert(code1.includes('variant={"primary"}'), 'Should include extracted props');
  
  const code2 = handler.generateTransformedSpreadCode(extractedProps, remainingSpread, {
    spreadPosition: 'after',
  });
  assert(code2.endsWith('{...restProps}'), 'Should put spread last when position is after');
  assert(code2.includes('size={"large"}'), 'Should include extracted props');
});

// Test Cache Behavior
test('caching for performance', () => {
  const sourceCode = `<Button {...{ color: 'primary' }} />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let callCount = 0;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSpreadAttribute(node)) {
      callCount++;
      handler.handleSpreadProps(node, propMappings, {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      });
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  // First visit
  ts.visitNode(sourceFile, visitor);
  // Second visit (should use cache)
  ts.visitNode(sourceFile, visitor);
  
  assert(callCount === 2, 'Should be called twice');
  
  // Clear cache and visit again
  handler.clearCache();
  ts.visitNode(sourceFile, visitor);
  assert(callCount === 3, 'Should be called again after cache clear');
});

// Test Complex Object Spread
test('handle complex object spread with nested values', () => {
  const sourceCode = `<Button {...{ 
    color: 'primary', 
    size: 'large',
    style: { margin: 10, padding: 5 },
    data: [1, 2, 3],
    disabled: true
  }} />`;
  const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  
  let foundSpread = false;
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isJsxSpreadAttribute(node)) {
      foundSpread = true;
      const result = handler.handleSpreadProps(node, propMappings, {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      });
      
      assert(result.success, 'Should handle complex object spread');
      assert(result.extractedProps.variant === 'primary', 'Should extract color as variant');
      assert(result.extractedProps.isDisabled === true, 'Should extract disabled as isDisabled');
      assert(result.remainingProps.style && typeof result.remainingProps.style === 'object', 'Should keep style as object in remaining');
      assert(result.remainingProps.style.margin === 10, 'Should preserve style properties');
      assert(Array.isArray(result.remainingProps.data), 'Should keep array as array');
      assert(result.remainingProps.data.length === 3, 'Should preserve array elements');
    }
    return ts.visitEachChild(node, visitor, undefined);
  };
  
  ts.visitNode(sourceFile, visitor);
  assert(foundSpread, 'Should find spread attribute');
});

// Test Omit Property
test('omit property handling', () => {
  const props = {
    color: 'primary',
    omitMe: 'should be omitted',
    size: 'large',
  };

  const result = handler.extractPropsFromSpread(props, propMappings);
  
  assert(!result.extracted.omitted, 'Should not extract omitted props');
  assert(!result.remaining.omitMe, 'Should not keep omitted props in remaining');
  assert(result.extracted.variant === 'primary', 'Should still extract other props');
});

// Summary
console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All prop spreading handler tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${testsFailed} test(s) failed`);
  process.exit(1);
}