#!/usr/bin/env npx tsx

import { PropValidator } from './src/validators/prop-validator';
import type { PropValidationRule } from './src/validators/prop-validator';

console.log('🧪 Testing Prop Validator...\n');

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

const validator = new PropValidator();

// Test Basic Type Validation
test('basic type validation', () => {
  const rules: Record<string, PropValidationRule> = {
    name: { type: 'string', required: true },
    age: { type: 'number' },
    active: { type: 'boolean' },
  };
  
  validator.registerComponentRules('TestComponent', rules);
  
  const result1 = validator.validateProps(
    { name: 'John', age: 25, active: true },
    'TestComponent',
    { componentName: 'TestComponent', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should validate correct types');
  
  const result2 = validator.validateProps(
    { name: 123, age: '25', active: 'yes' },
    'TestComponent',
    { componentName: 'TestComponent', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail on incorrect types');
  assert(result2.errors.length === 3, 'Should have 3 type errors');
});

// Test Required Props
test('required prop validation', () => {
  const rules: Record<string, PropValidationRule> = {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    optional: { type: 'string', required: false },
  };
  
  validator.registerComponentRules('RequiredTest', rules);
  
  const result1 = validator.validateProps(
    { id: '123', name: 'Test' },
    'RequiredTest',
    { componentName: 'RequiredTest', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should pass with all required props');
  
  const result2 = validator.validateProps(
    { id: '123' },
    'RequiredTest',
    { componentName: 'RequiredTest', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail with missing required prop');
  assert(result2.errors.some(e => e.includes("Required prop 'name'")), 'Should have error for missing name');
});

// Test Enum Validation
test('enum validation', () => {
  const rules: Record<string, PropValidationRule> = {
    size: { type: 'string', enum: ['small', 'medium', 'large'] },
    variant: { enum: ['primary', 'secondary', 'danger'] },
  };
  
  validator.registerComponentRules('EnumTest', rules);
  
  const result1 = validator.validateProps(
    { size: 'medium', variant: 'primary' },
    'EnumTest',
    { componentName: 'EnumTest', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should pass with valid enum values');
  
  const result2 = validator.validateProps(
    { size: 'extra-large', variant: 'tertiary' },
    'EnumTest',
    { componentName: 'EnumTest', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail with invalid enum values');
  assert(result2.errors.length === 2, 'Should have 2 enum errors');
  assert(result2.suggestions && result2.suggestions.length > 0, 'Should provide suggestions');
});

// Test Pattern Validation
test('pattern validation', () => {
  const rules: Record<string, PropValidationRule> = {
    email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { type: 'string', pattern: '^\\d{3}-\\d{3}-\\d{4}$' },
  };
  
  validator.registerComponentRules('PatternTest', rules);
  
  const result1 = validator.validateProps(
    { email: 'user@example.com', phone: '123-456-7890' },
    'PatternTest',
    { componentName: 'PatternTest', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should pass with valid patterns');
  
  const result2 = validator.validateProps(
    { email: 'invalid-email', phone: '1234567890' },
    'PatternTest',
    { componentName: 'PatternTest', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail with invalid patterns');
});

// Test Numeric Range Validation
test('numeric range validation', () => {
  const rules: Record<string, PropValidationRule> = {
    age: { type: 'number', min: 0, max: 120 },
    score: { type: 'number', min: 0, max: 100 },
  };
  
  validator.registerComponentRules('RangeTest', rules);
  
  const result1 = validator.validateProps(
    { age: 25, score: 85 },
    'RangeTest',
    { componentName: 'RangeTest', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should pass with values in range');
  
  const result2 = validator.validateProps(
    { age: -5, score: 150 },
    'RangeTest',
    { componentName: 'RangeTest', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail with values out of range');
  assert(result2.errors.length === 2, 'Should have 2 range errors');
});

// Test String Length Validation
test('string length validation', () => {
  const rules: Record<string, PropValidationRule> = {
    username: { type: 'string', minLength: 3, maxLength: 20 },
    password: { type: 'string', minLength: 8 },
  };
  
  validator.registerComponentRules('LengthTest', rules);
  
  const result1 = validator.validateProps(
    { username: 'johndoe', password: 'securepass123' },
    'LengthTest',
    { componentName: 'LengthTest', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should pass with valid lengths');
  
  const result2 = validator.validateProps(
    { username: 'ab', password: 'short' },
    'LengthTest',
    { componentName: 'LengthTest', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail with invalid lengths');
});

// Test Array Length Validation
test('array length validation', () => {
  const rules: Record<string, PropValidationRule> = {
    items: { type: 'array', minLength: 1, maxLength: 10 },
  };
  
  validator.registerComponentRules('ArrayTest', rules);
  
  const result1 = validator.validateProps(
    { items: [1, 2, 3] },
    'ArrayTest',
    { componentName: 'ArrayTest', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should pass with valid array length');
  
  const result2 = validator.validateProps(
    { items: [] },
    'ArrayTest',
    { componentName: 'ArrayTest', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail with empty array');
});

// Test Custom Validation
test('custom validation function', () => {
  const rules: Record<string, PropValidationRule> = {
    password: {
      type: 'string',
      custom: (value, context) => {
        const result = { valid: true, errors: [], warnings: [] };
        
        if (typeof value === 'string') {
          if (!/[A-Z]/.test(value)) {
            result.valid = false;
            result.errors.push('Password must contain at least one uppercase letter');
          }
          if (!/[0-9]/.test(value)) {
            result.valid = false;
            result.errors.push('Password must contain at least one number');
          }
        }
        
        return result;
      },
    },
  };
  
  validator.registerComponentRules('CustomTest', rules);
  
  const result1 = validator.validateProps(
    { password: 'SecurePass123' },
    'CustomTest',
    { componentName: 'CustomTest', filePath: 'test.tsx', props: {} }
  );
  assert(result1.valid === true, 'Should pass custom validation');
  
  const result2 = validator.validateProps(
    { password: 'weakpassword' },
    'CustomTest',
    { componentName: 'CustomTest', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail custom validation');
  assert(result2.errors.length === 2, 'Should have 2 custom validation errors');
});

// Test Global Rules
test('global validation rules', () => {
  validator.registerGlobalRules({
    className: { type: 'string' },
    style: { type: 'object' },
  });
  
  const result = validator.validateProps(
    { className: 'test-class', style: { color: 'red' }, customProp: 'value' },
    'AnyComponent',
    { componentName: 'AnyComponent', filePath: 'test.tsx', props: {} }
  );
  assert(result.valid === true, 'Should validate with global rules');
  
  const result2 = validator.validateProps(
    { className: 123, style: 'invalid' },
    'AnyComponent',
    { componentName: 'AnyComponent', filePath: 'test.tsx', props: {} }
  );
  assert(result2.valid === false, 'Should fail with invalid global props');
});

// Test Built-in Validators
test('built-in email validator', () => {
  const emailValidator = validator['customValidators'].get('email');
  assert(emailValidator !== undefined, 'Should have email validator');
  
  const rule: PropValidationRule = { type: 'string' };
  
  const result1 = emailValidator!('user@example.com', rule);
  assert(result1.valid === true, 'Should validate correct email');
  
  const result2 = emailValidator!('invalid-email', rule);
  assert(result2.valid === false, 'Should fail invalid email');
});

test('built-in URL validator', () => {
  const urlValidator = validator['customValidators'].get('url');
  assert(urlValidator !== undefined, 'Should have URL validator');
  
  const rule: PropValidationRule = { type: 'string' };
  
  const result1 = urlValidator!('https://example.com', rule);
  assert(result1.valid === true, 'Should validate correct URL');
  
  const result2 = urlValidator!('not-a-url', rule);
  assert(result2.valid === false, 'Should fail invalid URL');
});

test('built-in color validator', () => {
  const colorValidator = validator['customValidators'].get('color');
  assert(colorValidator !== undefined, 'Should have color validator');
  
  const rule: PropValidationRule = { type: 'string' };
  
  const result1 = colorValidator!('#FF0000', rule);
  assert(result1.valid === true, 'Should validate hex color');
  
  const result2 = colorValidator!('rgb(255, 0, 0)', rule);
  assert(result2.valid === true, 'Should validate rgb color');
  
  const result3 = colorValidator!('not-a-color', rule);
  assert(result3.valid === false, 'Should fail invalid color');
});

// Test Strict Mode
test('strict mode validation', () => {
  const result = validator.validateProps(
    { unknownProp: 'value' },
    'StrictComponent',
    { componentName: 'StrictComponent', filePath: 'test.tsx', props: {} },
    { strictMode: true, allowExtraProps: false }
  );
  assert(result.warnings.length > 0, 'Should warn about unknown props in strict mode');
  assert(result.warnings[0].includes('Unknown prop'), 'Should have unknown prop warning');
});

// Test Validation Report
test('validation report generation', () => {
  const results = [
    { valid: true, errors: [], warnings: ['Warning 1'] },
    { valid: false, errors: ['Error 1', 'Error 2'], warnings: [] },
    { valid: true, errors: [], warnings: [] },
  ];
  
  const report = validator.createValidationReport(results, 'TestComponent');
  
  assert(report.summary.totalProps === 3, 'Should count total props');
  assert(report.summary.validProps === 2, 'Should count valid props');
  assert(report.summary.errors === 2, 'Should count total errors');
  assert(report.summary.warnings === 1, 'Should count total warnings');
  assert(report.details.length === 3, 'Should have 3 detail entries');
});

// Test Clear Rules
test('clear validation rules', () => {
  validator.registerComponentRules('TempComponent', {
    prop1: { type: 'string' },
  });
  
  assert(validator.getComponentRules('TempComponent') !== undefined, 'Should have component rules');
  
  validator.clearRules();
  
  assert(validator.getComponentRules('TempComponent') === undefined, 'Should clear component rules');
});

// Test Custom Message
test('custom error messages', () => {
  const rules: Record<string, PropValidationRule> = {
    age: {
      type: 'number',
      min: 18,
      message: 'You must be at least 18 years old',
    },
  };
  
  validator.registerComponentRules('MessageTest', rules);
  
  const result = validator.validateProps(
    { age: 16 },
    'MessageTest',
    { componentName: 'MessageTest', filePath: 'test.tsx', props: {} }
  );
  
  assert(result.valid === false, 'Should fail validation');
  assert(result.errors[0] === 'You must be at least 18 years old', 'Should use custom message');
});

// Summary
console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All prop validator tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${testsFailed} test(s) failed`);
  process.exit(1);
}