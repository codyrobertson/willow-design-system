#!/usr/bin/env tsx

import { 
  ConditionalPropMapper,
  ConditionOperator,
  type ConditionalMapperConfig,
  type ConditionEvaluator 
} from '../../src/mappers/conditional-prop-mapper.js';
import type { PropertyMapping } from '../../src/schemas/component-mapping.schema.js';
import type { ComponentMappingContext } from '../../src/types/component-mapping.types.js';

async function runTests() {
  console.log('🧪 Testing ConditionalPropMapper...\n');
  
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

  const mapper = new ConditionalPropMapper();
  const context: ComponentMappingContext = {
    sourceFile: 'test.tsx',
    targetFile: 'test.tsx',
    componentName: 'Button',
    props: {
      variant: 'primary',
      size: 'large',
      disabled: false,
      count: 5,
    },
  };

  // Test basic condition evaluation
  test('Equals condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected condition to match');
    if (result.value !== 'primary') throw new Error(`Expected value 'primary', got '${result.value}'`);
    if (!result.reason?.includes('primary === primary')) throw new Error('Expected reason to include equality check');
  });

  test('Not equals condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.NOT_EQUALS, 'secondary');
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected condition to match');
    if (!result.reason?.includes('primary !== secondary')) throw new Error('Expected reason to include inequality check');
  });

  test('Exists condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EXISTS, undefined);
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected property to exist');
    if (!result.reason?.includes('Property exists')) throw new Error('Expected reason to mention property exists');
  });

  test('Not exists condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('nonexistent', ConditionOperator.NOT_EXISTS, undefined);
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected property to not exist');
  });

  test('Contains condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.CONTAINS, 'prim');
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected string to contain substring');
    if (!result.reason?.includes('contains')) throw new Error('Expected reason to mention contains check');
  });

  test('Starts with condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.STARTS_WITH, 'prim');
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected string to start with substring');
  });

  test('Ends with condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.ENDS_WITH, 'ary');
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected string to end with substring');
  });

  test('Regex matches condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.MATCHES_REGEX, '^pri.*ry$');
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected string to match regex pattern');
  });

  test('Greater than condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('count', ConditionOperator.GREATER_THAN, 3);
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected 5 > 3');
    if (!result.reason?.includes('5 > 3')) throw new Error('Expected reason to show numeric comparison');
  });

  test('Less than condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('count', ConditionOperator.LESS_THAN, 10);
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected 5 < 10');
  });

  test('In array condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.IN_ARRAY, ['primary', 'secondary']);
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected primary to be in array');
  });

  test('Has type condition evaluation', () => {
    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.HAS_TYPE, 'string');
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected variant to be a string');
  });

  test('Conditional mapping application', () => {
    const mapping: PropertyMapping = {
      source: 'size',
      target: 'size',
      conditional: [
        ConditionalPropMapper.createConditionalMapping(
          ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
          'primarySize'
        ),
      ],
    };

    const result = mapper.applyConditionalMapping(mapping, context);

    if (!result.applied) throw new Error('Expected conditional mapping to be applied');
    if (result.effectiveMapping.target !== 'primarySize') {
      throw new Error(`Expected target 'primarySize', got '${result.effectiveMapping.target}'`);
    }
    if (result.matchedConditions.length !== 1) {
      throw new Error(`Expected 1 matched condition, got ${result.matchedConditions.length}`);
    }
  });

  test('Conditional mapping with no match', () => {
    const mapping: PropertyMapping = {
      source: 'size',
      target: 'size',
      conditional: [
        ConditionalPropMapper.createConditionalMapping(
          ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'secondary'),
          'secondarySize'
        ),
      ],
    };

    const result = mapper.applyConditionalMapping(mapping, context);

    if (result.applied) throw new Error('Expected conditional mapping not to be applied');
    if (result.effectiveMapping.target !== 'size') {
      throw new Error(`Expected original target 'size', got '${result.effectiveMapping.target}'`);
    }
  });

  test('Multiple conditional mappings', () => {
    const mapping: PropertyMapping = {
      source: 'size',
      target: 'size',
      conditional: [
        ConditionalPropMapper.createConditionalMapping(
          ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
          'primarySize'
        ),
        ConditionalPropMapper.createConditionalMapping(
          ConditionalPropMapper.createCondition('size', ConditionOperator.EQUALS, 'large'),
          'largeSize'
        ),
      ],
    };

    const result = mapper.applyConditionalMapping(mapping, context);

    if (!result.applied) throw new Error('Expected conditional mapping to be applied');
    if (result.effectiveMapping.target !== 'largeSize') {
      throw new Error(`Expected target 'largeSize', got '${result.effectiveMapping.target}'`);
    }
    if (result.matchedConditions.length !== 2) {
      throw new Error(`Expected 2 matched conditions, got ${result.matchedConditions.length}`);
    }
  });

  test('Custom operator registration', () => {
    const customEvaluator: ConditionEvaluator = (propValue, conditionValue) => ({
      matched: String(propValue).length === Number(conditionValue),
      value: propValue,
      reason: `String length ${String(propValue).length} === ${conditionValue}`,
    });

    mapper.registerCustomOperator('hasLength', customEvaluator);

    if (!mapper.supportsOperator('hasLength')) {
      throw new Error('Expected custom operator to be registered');
    }

    const condition = ConditionalPropMapper.createCondition('variant', 'hasLength', 7); // 'primary' has 7 characters
    const result = mapper.evaluateCondition(condition, context);

    if (!result.matched) throw new Error('Expected custom operator to match');
    if (!result.reason?.includes('String length 7 === 7')) {
      throw new Error('Expected custom operator reason');
    }
  });

  test('Compound AND conditions', () => {
    const conditions = [
      ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
      ConditionalPropMapper.createCondition('size', ConditionOperator.EQUALS, 'large'),
    ];

    const result = mapper.evaluateCompoundCondition(conditions, 'AND', context);

    if (!result.matched) throw new Error('Expected AND conditions to match');
    if (result.reason !== 'All conditions matched') {
      throw new Error(`Expected 'All conditions matched', got '${result.reason}'`);
    }
  });

  test('Compound OR conditions', () => {
    const conditions = [
      ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'secondary'), // false
      ConditionalPropMapper.createCondition('size', ConditionOperator.EQUALS, 'large'), // true
    ];

    const result = mapper.evaluateCompoundCondition(conditions, 'OR', context);

    if (!result.matched) throw new Error('Expected OR conditions to match');
    if (!result.reason?.includes('Matched conditions')) {
      throw new Error('Expected OR success reason');
    }
  });

  test('Caching functionality', () => {
    const cachingMapper = new ConditionalPropMapper({ enableCaching: true });

    const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');

    // First evaluation
    cachingMapper.evaluateCondition(condition, context);
    let stats = cachingMapper.getCacheStats();
    if (stats.size !== 1) throw new Error(`Expected cache size 1, got ${stats.size}`);

    // Second evaluation should use cache
    cachingMapper.evaluateCondition(condition, context);
    stats = cachingMapper.getCacheStats();
    if (stats.size !== 1) throw new Error('Expected cache to be reused');

    // Clear cache
    cachingMapper.clearCache();
    stats = cachingMapper.getCacheStats();
    if (stats.size !== 0) throw new Error('Expected cache to be cleared');
  });

  test('Tracing functionality', () => {
    const tracingMapper = new ConditionalPropMapper({ enableTracing: true });

    const mapping: PropertyMapping = {
      source: 'size',
      target: 'size',
      conditional: [
        ConditionalPropMapper.createConditionalMapping(
          ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
          'primarySize'
        ),
      ],
    };

    const result = tracingMapper.applyConditionalMapping(mapping, context);

    if (result.evaluationTrace.length !== 1) {
      throw new Error(`Expected 1 trace entry, got ${result.evaluationTrace.length}`);
    }
    if (result.evaluationTrace[0].condition.prop !== 'variant') {
      throw new Error('Expected trace to contain variant condition');
    }
  });

  test('Available operators', () => {
    const operators = mapper.getAvailableOperators();

    if (!operators.includes(ConditionOperator.EQUALS)) {
      throw new Error('Expected equals operator to be available');
    }
    if (!operators.includes(ConditionOperator.GREATER_THAN)) {
      throw new Error('Expected greater than operator to be available');
    }
    if (!operators.includes(ConditionOperator.IN_ARRAY)) {
      throw new Error('Expected in array operator to be available');
    }
  });

  test('Error handling for unknown operators', () => {
    const condition = ConditionalPropMapper.createCondition('variant', 'unknownOperator', 'value');
    const result = mapper.evaluateCondition(condition, context);

    if (result.matched) throw new Error('Expected unknown operator to fail');
    if (!result.reason?.includes('Evaluation error')) {
      throw new Error('Expected error reason for unknown operator');
    }
  });

  test('Helper method functionality', () => {
    const condition = ConditionalPropMapper.createCondition('prop', 'operator', 'value');
    
    if (condition.prop !== 'prop') throw new Error('Condition creation failed');
    if (condition.operator !== 'operator') throw new Error('Condition creation failed');
    if (condition.value !== 'value') throw new Error('Condition creation failed');

    const mapping = ConditionalPropMapper.createConditionalMapping(condition, 'target', { omit: true });
    
    if (mapping.condition !== condition) throw new Error('Conditional mapping creation failed');
    if (mapping.target !== 'target') throw new Error('Conditional mapping creation failed');
    if (mapping.omit !== true) throw new Error('Conditional mapping creation failed');
  });

  test('Performance with many evaluations', () => {
    const start = performance.now();

    // Evaluate many conditions
    for (let i = 0; i < 1000; i++) {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');
      mapper.evaluateCondition(condition, context);
    }

    const duration = performance.now() - start;
    if (duration > 100) throw new Error(`Performance too slow: ${duration}ms`);
  });

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed!');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});