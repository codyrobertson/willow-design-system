import { z } from 'zod';

/**
 * Schema for value transformation functions
 */
export const ValueTransformationSchema = z.object({
  type: z.enum(['direct', 'function', 'map', 'conditional']),
  from: z.string().optional(),
  to: z.string().optional(),
  map: z.record(z.string(), z.any()).optional(),
  condition: z.object({
    prop: z.string(),
    operator: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'exists', 'notExists']),
    value: z.any().optional(),
  }).optional(),
  transform: z.string().optional(), // Function name or inline function as string
});

/**
 * Schema for individual property mapping
 */
export const PropertyMappingSchema = z.object({
  source: z.string(),
  target: z.string(),
  required: z.boolean().default(false),
  deprecated: z.boolean().default(false),
  deprecationMessage: z.string().optional(),
  alternative: z.string().optional(),
  valueTransformation: ValueTransformationSchema.optional(),
  conditional: z.array(z.object({
    condition: z.object({
      prop: z.string(),
      operator: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'exists', 'notExists']),
      value: z.any().optional(),
    }),
    target: z.string(),
    valueTransformation: ValueTransformationSchema.optional(),
  })).optional(),
  spread: z.boolean().default(false),
  omit: z.boolean().default(false),
});

/**
 * Schema for component-level mapping configuration
 */
export const ComponentMappingSchema = z.object({
  sourceComponent: z.string(),
  targetComponent: z.string(),
  importMapping: z.object({
    source: z.string(),
    target: z.string(),
    namedImport: z.boolean().default(true),
    defaultImport: z.boolean().default(false),
  }).optional(),
  props: z.array(PropertyMappingSchema),
  children: z.object({
    transform: z.boolean().default(true),
    wrapper: z.string().optional(),
  }).optional(),
  deprecated: z.boolean().default(false),
  deprecationMessage: z.string().optional(),
  alternative: z.string().optional(),
});

/**
 * Schema for global mapping configuration
 */
export const ComponentMappingConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  sourceUIKit: z.string(),
  targetUIKit: z.string(),
  mappings: z.array(ComponentMappingSchema),
  globalPropMappings: z.array(PropertyMappingSchema).optional(),
  valueTransformers: z.record(z.string(), z.string()).optional(), // Custom transformer functions
  options: z.object({
    preserveUnmappedProps: z.boolean().default(false),
    warnOnUnmappedProps: z.boolean().default(true),
    strictMode: z.boolean().default(false),
    generateComments: z.boolean().default(true),
  }).optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type ValueTransformation = z.infer<typeof ValueTransformationSchema>;
export type PropertyMapping = z.infer<typeof PropertyMappingSchema>;
export type ComponentMapping = z.infer<typeof ComponentMappingSchema>;
export type ComponentMappingConfig = z.infer<typeof ComponentMappingConfigSchema>;

/**
 * Example configuration type for documentation
 */
export interface ComponentMappingExample {
  version: string;
  sourceUIKit: string;
  targetUIKit: string;
  mappings: Array<{
    sourceComponent: string;
    targetComponent: string;
    props: Array<{
      source: string;
      target: string;
      valueTransformation?: {
        type: 'map';
        map: Record<string, any>;
      };
    }>;
  }>;
}