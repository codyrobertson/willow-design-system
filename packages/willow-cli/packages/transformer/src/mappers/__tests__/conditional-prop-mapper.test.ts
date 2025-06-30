import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ConditionalPropMapper,
  ConditionOperator,
  type ConditionalMapperConfig,
  type ConditionEvaluator 
} from '../conditional-prop-mapper';
import type { PropertyMapping, ConditionalMapping } from '../../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../../types/component-mapping.types';

describe('ConditionalPropMapper', () => {
  let mapper: ConditionalPropMapper;
  let context: ComponentMappingContext;

  beforeEach(() => {
    mapper = new ConditionalPropMapper();
    context = {
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
  });

  describe('basic condition evaluation', () => {
    it('should evaluate equals condition correctly', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.value).toBe('primary');
      expect(result.reason).toContain('"primary" === "primary"');
    });

    it('should evaluate not equals condition correctly', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.NOT_EQUALS, 'secondary');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.value).toBe('primary');
      expect(result.reason).toContain('"primary" !== "secondary"');
    });

    it('should evaluate exists condition correctly', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EXISTS, undefined);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('Property exists');
    });

    it('should evaluate not exists condition correctly', () => {
      const condition = ConditionalPropMapper.createCondition('nonexistent', ConditionOperator.NOT_EXISTS, undefined);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('Property does not exist');
    });

    it('should evaluate contains condition correctly', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.CONTAINS, 'prim');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('"primary" contains "prim"');
    });

    it('should evaluate not contains condition correctly', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.NOT_CONTAINS, 'secondary');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('"primary" does not contain "secondary"');
    });
  });

  describe('string condition operators', () => {
    it('should evaluate starts with condition', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.STARTS_WITH, 'prim');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('"primary" starts with "prim"');
    });

    it('should evaluate ends with condition', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.ENDS_WITH, 'ary');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('"primary" ends with "ary"');
    });

    it('should evaluate regex matches condition', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.MATCHES_REGEX, '^pri.*ry$');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('"primary" matches pattern');
    });

    it('should handle invalid regex gracefully', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.MATCHES_REGEX, '[invalid');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(false);
      expect(result.reason).toContain('Evaluation error');
    });
  });

  describe('numeric condition operators', () => {
    it('should evaluate greater than condition', () => {
      const condition = ConditionalPropMapper.createCondition('count', ConditionOperator.GREATER_THAN, 3);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('5 > 3');
    });

    it('should evaluate less than condition', () => {
      const condition = ConditionalPropMapper.createCondition('count', ConditionOperator.LESS_THAN, 10);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('5 < 10');
    });

    it('should evaluate greater than or equal condition', () => {
      const condition = ConditionalPropMapper.createCondition('count', ConditionOperator.GREATER_THAN_OR_EQUAL, 5);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('5 >= 5');
    });

    it('should evaluate less than or equal condition', () => {
      const condition = ConditionalPropMapper.createCondition('count', ConditionOperator.LESS_THAN_OR_EQUAL, 5);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('5 <= 5');
    });
  });

  describe('array condition operators', () => {
    it('should evaluate in array condition', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.IN_ARRAY, ['primary', 'secondary']);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('primary is in [primary,secondary]');
    });

    it('should evaluate not in array condition', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.NOT_IN_ARRAY, ['danger', 'warning']);
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('primary is not in [danger,warning]');
    });

    it('should handle non-array values for array operators', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.IN_ARRAY, 'not-an-array');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(false);
    });
  });

  describe('type condition operators', () => {
    it('should evaluate has type condition for string', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.HAS_TYPE, 'string');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('typeof primary === "string"');
    });

    it('should evaluate has type condition for boolean', () => {
      const condition = ConditionalPropMapper.createCondition('disabled', ConditionOperator.HAS_TYPE, 'boolean');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('typeof false === "boolean"');
    });

    it('should evaluate has type condition for number', () => {
      const condition = ConditionalPropMapper.createCondition('count', ConditionOperator.HAS_TYPE, 'number');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('typeof 5 === "number"');
    });
  });

  describe('conditional mapping application', () => {
    it('should apply conditional mapping when condition matches', () => {
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

      expect(result.applied).toBe(true);
      expect(result.effectiveMapping.target).toBe('primarySize');
      expect(result.matchedConditions).toHaveLength(1);
    });

    it('should not apply conditional mapping when condition does not match', () => {
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

      expect(result.applied).toBe(false);
      expect(result.effectiveMapping.target).toBe('size');
      expect(result.matchedConditions).toHaveLength(0);
    });

    it('should apply multiple conditional mappings in order', () => {
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

      expect(result.applied).toBe(true);
      expect(result.effectiveMapping.target).toBe('largeSize'); // Last matching condition wins
      expect(result.matchedConditions).toHaveLength(2);
    });

    it('should apply value transformation overrides', () => {
      const mapping: PropertyMapping = {
        source: 'variant',
        target: 'variant',
        conditional: [
          ConditionalPropMapper.createConditionalMapping(
            ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
            'color',
            {
              valueTransformation: {
                type: 'map',
                map: { primary: 'blue' },
              },
            }
          ),
        ],
      };

      const result = mapper.applyConditionalMapping(mapping, context);

      expect(result.applied).toBe(true);
      expect(result.effectiveMapping.target).toBe('color');
      expect(result.effectiveMapping.valueTransformation?.type).toBe('map');
      expect(result.effectiveMapping.valueTransformation?.map?.primary).toBe('blue');
    });

    it('should handle omit overrides', () => {
      const mapping: PropertyMapping = {
        source: 'size',
        target: 'size',
        conditional: [
          ConditionalPropMapper.createConditionalMapping(
            ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
            'size',
            { omit: true }
          ),
        ],
      };

      const result = mapper.applyConditionalMapping(mapping, context);

      expect(result.applied).toBe(true);
      expect(result.effectiveMapping.omit).toBe(true);
    });
  });

  describe('custom operators', () => {
    it('should register and use custom operators', () => {
      const customEvaluator: ConditionEvaluator = (propValue, conditionValue) => ({
        matched: String(propValue).length === Number(conditionValue),
        value: propValue,
        reason: `String length ${String(propValue).length} ${String(propValue).length === Number(conditionValue) ? '===' : '!=='} ${conditionValue}`,
      });

      mapper.registerCustomOperator('hasLength', customEvaluator);

      const condition = ConditionalPropMapper.createCondition('variant', 'hasLength', 7); // 'primary' has 7 characters
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('String length 7 === 7');
    });

    it('should unregister custom operators', () => {
      const customEvaluator: ConditionEvaluator = () => ({ matched: true });
      mapper.registerCustomOperator('test', customEvaluator);

      expect(mapper.supportsOperator('test')).toBe(true);

      const removed = mapper.unregisterCustomOperator('test');
      expect(removed).toBe(true);
      expect(mapper.supportsOperator('test')).toBe(false);
    });

    it('should list available operators', () => {
      const operators = mapper.getAvailableOperators();

      expect(operators).toContain(ConditionOperator.EQUALS);
      expect(operators).toContain(ConditionOperator.GREATER_THAN);
      expect(operators).toContain(ConditionOperator.IN_ARRAY);
    });
  });

  describe('compound conditions', () => {
    it('should evaluate AND conditions correctly', () => {
      const conditions = [
        ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
        ConditionalPropMapper.createCondition('size', ConditionOperator.EQUALS, 'large'),
      ];

      const result = mapper.evaluateCompoundCondition(conditions, 'AND', context);

      expect(result.matched).toBe(true);
      expect(result.reason).toBe('All conditions matched');
    });

    it('should fail AND conditions when one fails', () => {
      const conditions = [
        ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary'),
        ConditionalPropMapper.createCondition('size', ConditionOperator.EQUALS, 'small'),
      ];

      const result = mapper.evaluateCompoundCondition(conditions, 'AND', context);

      expect(result.matched).toBe(false);
      expect(result.reason).toContain('Failed conditions');
    });

    it('should evaluate OR conditions correctly', () => {
      const conditions = [
        ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'secondary'),
        ConditionalPropMapper.createCondition('size', ConditionOperator.EQUALS, 'large'),
      ];

      const result = mapper.evaluateCompoundCondition(conditions, 'OR', context);

      expect(result.matched).toBe(true);
      expect(result.reason).toContain('Matched conditions');
    });

    it('should fail OR conditions when all fail', () => {
      const conditions = [
        ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'secondary'),
        ConditionalPropMapper.createCondition('size', ConditionOperator.EQUALS, 'small'),
      ];

      const result = mapper.evaluateCompoundCondition(conditions, 'OR', context);

      expect(result.matched).toBe(false);
      expect(result.reason).toBe('No conditions matched');
    });

    it('should handle empty condition arrays', () => {
      const result = mapper.evaluateCompoundCondition([], 'AND', context);

      expect(result.matched).toBe(false);
      expect(result.reason).toBe('No conditions provided');
    });
  });

  describe('caching', () => {
    it('should cache condition evaluation results', () => {
      const config: ConditionalMapperConfig = { enableCaching: true };
      const cachingMapper = new ConditionalPropMapper(config);

      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');

      // First evaluation
      cachingMapper.evaluateCondition(condition, context);
      let stats = cachingMapper.getCacheStats();
      expect(stats.size).toBe(1);

      // Second evaluation should use cache
      cachingMapper.evaluateCondition(condition, context);
      stats = cachingMapper.getCacheStats();
      expect(stats.size).toBe(1); // Still 1, reused cache
    });

    it('should not cache when caching is disabled', () => {
      const config: ConditionalMapperConfig = { enableCaching: false };
      const noCacheMapper = new ConditionalPropMapper(config);

      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');

      noCacheMapper.evaluateCondition(condition, context);
      const stats = noCacheMapper.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');

      mapper.evaluateCondition(condition, context);
      expect(mapper.getCacheStats().size).toBeGreaterThan(0);

      mapper.clearCache();
      expect(mapper.getCacheStats().size).toBe(0);
    });
  });

  describe('tracing', () => {
    it('should provide evaluation trace when enabled', () => {
      const config: ConditionalMapperConfig = { enableTracing: true };
      const tracingMapper = new ConditionalPropMapper(config);

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

      expect(result.evaluationTrace).toHaveLength(1);
      expect(result.evaluationTrace[0].condition.prop).toBe('variant');
      expect(result.evaluationTrace[0].result.matched).toBe(true);
      expect(result.evaluationTrace[0].context.componentName).toBe('Button');
    });

    it('should not provide trace when disabled', () => {
      const config: ConditionalMapperConfig = { enableTracing: false };
      const noTraceMapper = new ConditionalPropMapper(config);

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

      const result = noTraceMapper.applyConditionalMapping(mapping, context);

      expect(result.evaluationTrace).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle unknown operators gracefully in non-strict mode', () => {
      const condition = ConditionalPropMapper.createCondition('variant', 'unknownOperator', 'value');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(false);
      expect(result.reason).toContain('Evaluation error');
    });

    it('should throw errors for unknown operators in strict mode', () => {
      const config: ConditionalMapperConfig = { strictMode: true };
      const strictMapper = new ConditionalPropMapper(config);

      const condition = ConditionalPropMapper.createCondition('variant', 'unknownOperator', 'value');

      expect(() => {
        strictMapper.evaluateCondition(condition, context);
      }).toThrow('Unknown condition operator: unknownOperator');
    });

    it('should handle evaluation errors in custom operators', () => {
      const errorEvaluator: ConditionEvaluator = () => {
        throw new Error('Custom operator error');
      };

      mapper.registerCustomOperator('errorOperator', errorEvaluator);

      const condition = ConditionalPropMapper.createCondition('variant', 'errorOperator', 'value');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(false);
      expect(result.reason).toContain('Custom operator error');
    });
  });

  describe('edge cases', () => {
    it('should handle missing properties', () => {
      const condition = ConditionalPropMapper.createCondition('nonexistent', ConditionOperator.EQUALS, 'value');
      const result = mapper.evaluateCondition(condition, context);

      expect(result.matched).toBe(false);
      expect(result.value).toBeUndefined();
    });

    it('should handle null and undefined values', () => {
      const nullContext = {
        ...context,
        props: { ...context.props, nullProp: null, undefinedProp: undefined },
      };

      const nullCondition = ConditionalPropMapper.createCondition('nullProp', ConditionOperator.EQUALS, null);
      const nullResult = mapper.evaluateCondition(nullCondition, nullContext);
      expect(nullResult.matched).toBe(true);

      const undefinedCondition = ConditionalPropMapper.createCondition('undefinedProp', ConditionOperator.EXISTS, undefined);
      const undefinedResult = mapper.evaluateCondition(undefinedCondition, nullContext);
      expect(undefinedResult.matched).toBe(false);
    });

    it('should handle mappings without conditional properties', () => {
      const mapping: PropertyMapping = {
        source: 'size',
        target: 'size',
        // No conditional property
      };

      const result = mapper.applyConditionalMapping(mapping, context);

      expect(result.applied).toBe(false);
      expect(result.effectiveMapping).toEqual(mapping);
      expect(result.matchedConditions).toHaveLength(0);
    });

    it('should handle empty conditional arrays', () => {
      const mapping: PropertyMapping = {
        source: 'size',
        target: 'size',
        conditional: [], // Empty array
      };

      const result = mapper.applyConditionalMapping(mapping, context);

      expect(result.applied).toBe(false);
      expect(result.effectiveMapping).toEqual(mapping);
    });
  });

  describe('performance', () => {
    it('should handle many conditions efficiently', () => {
      const start = performance.now();

      // Create many conditions
      for (let i = 0; i < 1000; i++) {
        const condition = ConditionalPropMapper.createCondition(`prop${i}`, ConditionOperator.EQUALS, `value${i}`);
        mapper.evaluateCondition(condition, { ...context, props: { [`prop${i}`]: `value${i}` } });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete quickly
    });

    it('should benefit from caching with repeated evaluations', () => {
      const condition = ConditionalPropMapper.createCondition('variant', ConditionOperator.EQUALS, 'primary');

      const start = performance.now();

      // Evaluate the same condition many times
      for (let i = 0; i < 10000; i++) {
        mapper.evaluateCondition(condition, context);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should be very fast with caching
    });
  });

  describe('helper methods', () => {
    it('should create conditions correctly', () => {
      const condition = ConditionalPropMapper.createCondition('prop', 'operator', 'value');

      expect(condition.prop).toBe('prop');
      expect(condition.operator).toBe('operator');
      expect(condition.value).toBe('value');
    });

    it('should create conditional mappings correctly', () => {
      const condition = ConditionalPropMapper.createCondition('prop', 'operator', 'value');
      const mapping = ConditionalPropMapper.createConditionalMapping(condition, 'target', { omit: true });

      expect(mapping.condition).toBe(condition);
      expect(mapping.target).toBe('target');
      expect(mapping.omit).toBe(true);
    });
  });
});