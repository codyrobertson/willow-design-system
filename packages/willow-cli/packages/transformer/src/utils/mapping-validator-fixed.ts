import { z } from 'zod';
import type { ComponentMappingConfig, ComponentMapping, PropertyMapping } from '../schemas/component-mapping.schema';
import { ComponentMappingConfigSchema } from '../schemas/component-mapping.schema';
import type { MappingValidationResult } from '../types/component-mapping.types';

/**
 * Validates component mapping configuration
 */
export class MappingValidator {
  /**
   * Validate a complete mapping configuration
   */
  static validateConfig(config: unknown): MappingValidationResult {
    const errors: MappingValidationResult['errors'] = [];
    const suggestions: MappingValidationResult['suggestions'] = [];

    try {
      // Schema validation
      const parsed = ComponentMappingConfigSchema.parse(config);
      
      // Additional business logic validation
      this.validateComponentReferences(parsed, errors, suggestions);
      this.validatePropConsistency(parsed, errors, suggestions);
      this.validateDeprecations(parsed, errors, suggestions);
      this.validateConditionals(parsed, errors);
      
      return {
        valid: errors.filter(e => e.severity === 'error').length === 0,
        errors,
        suggestions,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.errors) {
          errors.push({
            path: issue.path.join('.'),
            message: issue.message,
            severity: 'error',
          });
        }
      } else {
        errors.push({
          path: '',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'error',
        });
      }
      
      return {
        valid: false,
        errors,
        suggestions,
      };
    }
  }

  /**
   * Validate that component references are consistent
   */
  private static validateComponentReferences(
    config: ComponentMappingConfig,
    errors: MappingValidationResult['errors'],
    suggestions: MappingValidationResult['suggestions']
  ): void {
    const componentMap = new Map<string, string>();
    const seenComponents = new Set<string>();
    
    for (const mapping of config.mappings) {
      if (seenComponents.has(mapping.sourceComponent)) {
        errors.push({
          path: `mappings.${mapping.sourceComponent}`,
          message: `Duplicate component mapping for ${mapping.sourceComponent}`,
          severity: 'error',
        });
      }
      seenComponents.add(mapping.sourceComponent);
      
      const existing = componentMap.get(mapping.sourceComponent);
      if (existing && existing !== mapping.targetComponent) {
        errors.push({
          path: `mappings.${mapping.sourceComponent}`,
          message: `Component ${mapping.sourceComponent} is mapped to multiple targets: ${existing} and ${mapping.targetComponent}`,
          severity: 'error',
        });
      }
      componentMap.set(mapping.sourceComponent, mapping.targetComponent);
    }
  }

  /**
   * Validate property mapping consistency
   */
  private static validatePropConsistency(
    config: ComponentMappingConfig,
    errors: MappingValidationResult['errors'],
    suggestions: MappingValidationResult['suggestions']
  ): void {
    // Check for duplicate prop mappings within components
    for (const mapping of config.mappings) {
      const propSources = new Set<string>();
      const propTargets = new Set<string>();
      
      for (const prop of mapping.props) {
        if (propSources.has(prop.source)) {
          errors.push({
            path: `mappings.${mapping.sourceComponent}.props.${prop.source}`,
            message: `Duplicate property mapping for ${prop.source} in ${mapping.sourceComponent}`,
            severity: 'error',
          });
        }
        propSources.add(prop.source);
        
        if (!prop.omit && propTargets.has(prop.target)) {
          errors.push({
            path: `mappings.${mapping.sourceComponent}.props.${prop.target}`,
            message: `Multiple properties map to the same target: ${prop.target}`,
            severity: 'warning',
          });
        }
        if (!prop.omit) {
          propTargets.add(prop.target);
        }
      }
    }
    
    // Check global prop mappings for conflicts
    if (config.globalPropMappings) {
      for (const globalProp of config.globalPropMappings) {
        for (const mapping of config.mappings) {
          const localProp = mapping.props.find(p => p.source === globalProp.source);
          if (localProp && localProp.target !== globalProp.target) {
            suggestions.push({
              component: mapping.sourceComponent,
              prop: globalProp.source,
              suggestion: `Global mapping maps ${globalProp.source} to ${globalProp.target}, but component mapping uses ${localProp.target}`,
            });
          }
        }
      }
    }
  }

  /**
   * Validate deprecation consistency
   */
  private static validateDeprecations(
    config: ComponentMappingConfig,
    errors: MappingValidationResult['errors'],
    suggestions: MappingValidationResult['suggestions']
  ): void {
    for (const mapping of config.mappings) {
      // Check component deprecation
      if (mapping.deprecated && !mapping.deprecationMessage) {
        errors.push({
          path: `mappings.${mapping.sourceComponent}.deprecated`,
          message: 'Deprecated component must have a deprecation message',
          severity: 'warning',
        });
      }
      
      // Check prop deprecations
      for (const prop of mapping.props) {
        if (prop.deprecated) {
          if (!prop.deprecationMessage) {
            errors.push({
              path: `mappings.${mapping.sourceComponent}.props.${prop.source}.deprecated`,
              message: 'Deprecated property must have a deprecation message',
              severity: 'warning',
            });
          }
          
          // If there's a deprecation message but no alternative specified
          if (prop.deprecationMessage && !prop.alternative && prop.target !== prop.source) {
            suggestions.push({
              component: mapping.sourceComponent,
              prop: prop.source,
              suggestion: `Consider setting 'alternative' to '${prop.target}' for deprecated property '${prop.source}'`,
            });
          }
        }
      }
    }
  }

  /**
   * Validate conditional mappings
   */
  private static validateConditionals(
    config: ComponentMappingConfig,
    errors: MappingValidationResult['errors']
  ): void {
    for (const mapping of config.mappings) {
      for (const prop of mapping.props) {
        if (prop.conditional) {
          for (const condition of prop.conditional) {
            // Check if the condition references an existing prop - but it's just a warning
            // because conditionals can reference props from context
            const conditionProp = mapping.props.find(p => p.source === condition.condition.prop);
            if (!conditionProp && !config.globalPropMappings?.find(p => p.source === condition.condition.prop)) {
              // Only error if it's not a common prop like 'variant', 'size', etc.
              const commonProps = ['variant', 'size', 'color', 'disabled', 'type', 'className', 'style'];
              if (!commonProps.includes(condition.condition.prop)) {
                errors.push({
                  path: `mappings.${mapping.sourceComponent}.props.${prop.source}.conditional`,
                  message: `Conditional references unknown property: ${condition.condition.prop}`,
                  severity: 'warning',
                });
              }
            }
            
            // Validate operator-value combinations
            if (condition.condition.operator === 'exists' || condition.condition.operator === 'notExists') {
              if (condition.condition.value !== undefined) {
                errors.push({
                  path: `mappings.${mapping.sourceComponent}.props.${prop.source}.conditional`,
                  message: `Operator ${condition.condition.operator} should not have a value`,
                  severity: 'warning',
                });
              }
            } else if (condition.condition.value === undefined) {
              errors.push({
                path: `mappings.${mapping.sourceComponent}.props.${prop.source}.conditional`,
                message: `Operator ${condition.condition.operator} requires a value`,
                severity: 'error',
              });
            }
          }
        }
      }
    }
  }

  /**
   * Validate a single component mapping
   */
  static validateComponentMapping(mapping: ComponentMapping): MappingValidationResult {
    return this.validateConfig({
      version: '1.0.0',
      sourceUIKit: 'unknown',
      targetUIKit: 'unknown',
      mappings: [mapping],
    });
  }

  /**
   * Validate a single property mapping
   */
  static validatePropertyMapping(prop: PropertyMapping): MappingValidationResult {
    return this.validateConfig({
      version: '1.0.0',
      sourceUIKit: 'unknown',
      targetUIKit: 'unknown',
      mappings: [{
        sourceComponent: 'TestComponent',
        targetComponent: 'TestComponent',
        props: [prop],
      }],
    });
  }
}