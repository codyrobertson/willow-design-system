import { describe, it, expect } from 'vitest';
import {
  ComponentMappingConfigSchema,
  ComponentMappingSchema,
  PropertyMappingSchema,
  ValueTransformationSchema,
} from '../component-mapping.schema';

describe('ComponentMappingSchema', () => {
  describe('ValueTransformationSchema', () => {
    it('should validate direct transformation', () => {
      const valid = {
        type: 'direct',
        from: 'value1',
        to: 'value2',
      };
      
      const result = ValueTransformationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate map transformation', () => {
      const valid = {
        type: 'map',
        map: {
          small: 'sm',
          medium: 'md',
          large: 'lg',
        },
      };
      
      const result = ValueTransformationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate conditional transformation', () => {
      const valid = {
        type: 'conditional',
        condition: {
          prop: 'variant',
          operator: 'equals',
          value: 'primary',
        },
      };
      
      const result = ValueTransformationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid transformation type', () => {
      const invalid = {
        type: 'invalid',
      };
      
      const result = ValueTransformationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('PropertyMappingSchema', () => {
    it('should validate basic property mapping', () => {
      const valid = {
        source: 'color',
        target: 'variant',
      };
      
      const result = PropertyMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data?.required).toBe(false);
      expect(result.data?.deprecated).toBe(false);
    });

    it('should validate deprecated property mapping', () => {
      const valid = {
        source: 'type',
        target: 'variant',
        deprecated: true,
        deprecationMessage: 'Use variant instead of type',
        alternative: 'variant',
      };
      
      const result = PropertyMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate conditional property mapping', () => {
      const valid = {
        source: 'size',
        target: 'size',
        conditional: [
          {
            condition: {
              prop: 'variant',
              operator: 'equals',
              value: 'icon',
            },
            target: 'iconSize',
          },
        ],
      };
      
      const result = PropertyMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate property with value transformation', () => {
      const valid = {
        source: 'color',
        target: 'variant',
        valueTransformation: {
          type: 'map',
          map: {
            blue: 'primary',
            red: 'danger',
            green: 'success',
          },
        },
      };
      
      const result = PropertyMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('ComponentMappingSchema', () => {
    it('should validate basic component mapping', () => {
      const valid = {
        sourceComponent: 'Button',
        targetComponent: 'WillowButton',
        props: [
          {
            source: 'color',
            target: 'variant',
          },
        ],
      };
      
      const result = ComponentMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate component with import mapping', () => {
      const valid = {
        sourceComponent: 'Button',
        targetComponent: 'WillowButton',
        importMapping: {
          source: '@mui/material',
          target: '@willow/ui',
        },
        props: [],
      };
      
      const result = ComponentMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate deprecated component mapping', () => {
      const valid = {
        sourceComponent: 'RaisedButton',
        targetComponent: 'Button',
        deprecated: true,
        deprecationMessage: 'RaisedButton is deprecated, use Button with variant="raised"',
        alternative: 'Button',
        props: [],
      };
      
      const result = ComponentMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject component without required fields', () => {
      const invalid = {
        sourceComponent: 'Button',
        // missing targetComponent and props
      };
      
      const result = ComponentMappingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ComponentMappingConfigSchema', () => {
    it('should validate complete configuration', () => {
      const valid = {
        version: '1.0.0',
        sourceUIKit: 'material-ui',
        targetUIKit: 'willow-ui',
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
      
      const result = ComponentMappingConfigSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate configuration with options', () => {
      const valid = {
        version: '1.0.0',
        sourceUIKit: 'ant-design',
        targetUIKit: 'willow-ui',
        mappings: [],
        options: {
          preserveUnmappedProps: true,
          warnOnUnmappedProps: false,
          strictMode: true,
          generateComments: true,
        },
      };
      
      const result = ComponentMappingConfigSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate configuration with global prop mappings', () => {
      const valid = {
        version: '1.0.0',
        sourceUIKit: 'radix-ui',
        targetUIKit: 'willow-ui',
        mappings: [],
        globalPropMappings: [
          {
            source: 'className',
            target: 'class',
          },
          {
            source: 'sx',
            target: 'style',
          },
        ],
      };
      
      const result = ComponentMappingConfigSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid version format', () => {
      const invalid = {
        version: '1.0', // Should be semver
        sourceUIKit: 'material-ui',
        targetUIKit: 'willow-ui',
        mappings: [],
      };
      
      const result = ComponentMappingConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should handle complex nested configuration', () => {
      const complex = {
        version: '2.1.0',
        sourceUIKit: 'ant-design',
        targetUIKit: 'willow-ui',
        mappings: [
          {
            sourceComponent: 'Select',
            targetComponent: 'Dropdown',
            importMapping: {
              source: 'antd',
              target: '@willow/ui',
              namedImport: true,
              defaultImport: false,
            },
            props: [
              {
                source: 'mode',
                target: 'selectionMode',
                valueTransformation: {
                  type: 'map',
                  map: {
                    multiple: 'multi',
                    tags: 'multi-create',
                  },
                },
              },
              {
                source: 'dropdownClassName',
                target: 'popoverClass',
                deprecated: true,
                deprecationMessage: 'Use popoverClass instead',
                conditional: [
                  {
                    condition: {
                      prop: 'mode',
                      operator: 'exists',
                    },
                    target: 'popoverClassName',
                  },
                ],
              },
            ],
          },
        ],
        globalPropMappings: [
          {
            source: 'style',
            target: 'sx',
            valueTransformation: {
              type: 'function',
              transform: 'convertStyleToSx',
            },
          },
        ],
        valueTransformers: {
          convertStyleToSx: 'utils/style-converters',
        },
        options: {
          preserveUnmappedProps: false,
          warnOnUnmappedProps: true,
          strictMode: false,
          generateComments: true,
        },
      };
      
      const result = ComponentMappingConfigSchema.safeParse(complex);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arrays', () => {
      const valid = {
        version: '1.0.0',
        sourceUIKit: 'mui',
        targetUIKit: 'willow',
        mappings: [],
      };
      
      const result = ComponentMappingConfigSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in prop names', () => {
      const valid = {
        source: 'data-testid',
        target: 'data-test-id',
      };
      
      const result = PropertyMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should handle numeric values in conditions', () => {
      const valid = {
        type: 'conditional',
        condition: {
          prop: 'columns',
          operator: 'equals',
          value: 12,
        },
      };
      
      const result = ValueTransformationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should handle boolean values in transformations', () => {
      const valid = {
        source: 'disabled',
        target: 'isDisabled',
        valueTransformation: {
          type: 'direct',
          from: 'true',
          to: 'true',
        },
      };
      
      const result = PropertyMappingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});