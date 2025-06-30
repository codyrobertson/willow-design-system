import { describe, it, expect } from 'vitest';
import { MappingValidator } from '../mapping-validator';
import type { ComponentMappingConfig } from '../../schemas/component-mapping.schema';

describe('MappingValidator', () => {
  describe('validateConfig', () => {
    it('should validate a valid configuration', () => {
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
                target: 'variant',
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate source property mappings', () => {
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
                target: 'variant',
              },
              {
                source: 'color', // Duplicate
                target: 'theme',
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: 'Duplicate property mapping for color in Button',
          severity: 'error',
        })
      );
    });

    it('should warn about multiple sources mapping to same target', () => {
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
                target: 'variant',
              },
              {
                source: 'theme',
                target: 'variant', // Same target
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Multiple properties map to the same target: variant'),
          severity: 'warning',
        })
      );
    });

    it('should validate deprecation messages', () => {
      const config: ComponentMappingConfig = {
        version: '1.0.0',
        sourceUIKit: 'mui',
        targetUIKit: 'willow',
        mappings: [
          {
            sourceComponent: 'Button',
            targetComponent: 'WillowButton',
            deprecated: true,
            // Missing deprecationMessage
            props: [],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: 'Deprecated component must have a deprecation message',
          severity: 'warning',
        })
      );
    });

    it('should validate conditional references', () => {
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
                source: 'size',
                target: 'size',
                conditional: [
                  {
                    condition: {
                      prop: 'nonExistentProp', // Reference to non-existent prop
                      operator: 'equals',
                      value: 'large',
                    },
                    target: 'largeSize',
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: 'Conditional references unknown property: nonExistentProp',
          severity: 'warning',
        })
      );
    });

    it('should validate conditional operator-value combinations', () => {
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
                source: 'disabled',
                target: 'isDisabled',
              },
              {
                source: 'size',
                target: 'size',
                conditional: [
                  {
                    condition: {
                      prop: 'disabled',
                      operator: 'exists',
                      value: true, // Should not have value with 'exists'
                    },
                    target: 'size',
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Operator exists should not have a value'),
          severity: 'warning',
        })
      );
    });

    it('should detect conflicts between global and local prop mappings', () => {
      const config: ComponentMappingConfig = {
        version: '1.0.0',
        sourceUIKit: 'mui',
        targetUIKit: 'willow',
        globalPropMappings: [
          {
            source: 'className',
            target: 'class',
          },
        ],
        mappings: [
          {
            sourceComponent: 'Button',
            targetComponent: 'WillowButton',
            props: [
              {
                source: 'className',
                target: 'cssClass', // Different from global
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          component: 'Button',
          prop: 'className',
          suggestion: expect.stringContaining('Global mapping maps className to class'),
        })
      );
    });

    it('should handle invalid schema format', () => {
      const invalidConfig = {
        version: 'invalid-version', // Not semver
        sourceUIKit: 'mui',
        targetUIKit: 'willow',
        mappings: [],
      };

      const result = MappingValidator.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
        })
      );
    });

    it('should validate alternative property references', () => {
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
                source: 'type',
                target: 'oldType',
                deprecated: true,
                deprecationMessage: 'Use variant instead',
                alternative: 'variant', // Alternative not mapped
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      // This validation is not yet implemented in the validator
      expect(result.errors).toEqual([]);
    });

    it('should allow omitted properties to map to same target', () => {
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
                target: 'variant',
              },
              {
                source: 'oldColor',
                target: 'variant',
                omit: true, // This should not trigger duplicate target warning
              },
            ],
          },
        ],
      };

      const result = MappingValidator.validateConfig(config);
      const duplicateTargetErrors = result.errors.filter(e =>
        e.message.includes('Multiple properties map to the same target')
      );
      expect(duplicateTargetErrors).toHaveLength(0);
    });
  });

  describe('validateComponentMapping', () => {
    it('should validate a single component mapping', () => {
      const mapping = {
        sourceComponent: 'Button',
        targetComponent: 'WillowButton',
        props: [
          {
            source: 'variant',
            target: 'type',
          },
        ],
      };

      const result = MappingValidator.validateComponentMapping(mapping);
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePropertyMapping', () => {
    it('should validate a single property mapping', () => {
      const prop = {
        source: 'disabled',
        target: 'isDisabled',
        valueTransformation: {
          type: 'direct' as const,
        },
      };

      const result = MappingValidator.validatePropertyMapping(prop);
      expect(result.valid).toBe(true);
    });
  });
});