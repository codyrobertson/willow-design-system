import * as ts from 'typescript';
import type { 
  ComponentMapping, 
  PropertyMapping,
  ComponentMappingConfig 
} from '../schemas/component-mapping.schema';
import type {
  ComponentMappingContext,
  PropertyMappingResult,
  ComponentMappingResult,
} from '../types/component-mapping.types';
// import { PropNameTransformer } from '../transformers/core/prop-name-transformer';

/**
 * Simple prop name transformer
 */
class SimplePropNameTransformer {
  transform(propName: string, mapping?: PropertyMapping): string {
    if (mapping && mapping.target) {
      return mapping.target;
    }
    return propName;
  }
}

/**
 * Main engine for transforming component properties
 */
export class PropTransformationEngine {
  private propNameTransformer: SimplePropNameTransformer;
  private componentMappings: Map<string, ComponentMapping>;
  private globalPropMappings: Map<string, PropertyMapping>;

  constructor(private config: ComponentMappingConfig) {
    this.propNameTransformer = new SimplePropNameTransformer();
    this.componentMappings = new Map();
    this.globalPropMappings = new Map();
    
    this.initializeMappings();
  }

  /**
   * Initialize mapping structures for efficient lookup
   */
  private initializeMappings(): void {
    // Build component mapping index
    for (const mapping of this.config.mappings) {
      this.componentMappings.set(mapping.sourceComponent, mapping);
    }

    // Build global prop mapping index
    if (this.config.globalPropMappings) {
      for (const propMapping of this.config.globalPropMappings) {
        this.globalPropMappings.set(propMapping.source, propMapping);
      }
    }
  }

  /**
   * Transform JSX element props
   */
  transformJsxElementProps(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    componentName: string,
    context: ComponentMappingContext
  ): ComponentMappingResult {
    const result: ComponentMappingResult = {
      success: true,
      sourceComponent: componentName,
      targetComponent: componentName,
      propResults: [],
      unmappedProps: [],
      warnings: [],
      errors: [],
    };

    // Get component mapping
    const componentMapping = this.componentMappings.get(componentName);
    if (componentMapping) {
      result.targetComponent = componentMapping.targetComponent;
      
      if (componentMapping.importMapping) {
        result.importChange = {
          from: componentMapping.importMapping.source,
          to: componentMapping.importMapping.target,
        };
      }

      if (componentMapping.deprecated) {
        result.warnings.push(
          `Component ${componentName} is deprecated. ${componentMapping.deprecationMessage || ''}`
        );
      }
    }

    // Get attributes to transform
    const attributes = this.getJsxAttributes(node);
    
    // Transform each prop
    for (const attr of attributes) {
      const propResult = this.transformProp(attr, componentMapping, context);
      result.propResults.push(propResult);
      
      if (!propResult.success) {
        result.success = false;
      }
      
      // Collect warnings and errors
      result.warnings.push(...propResult.warnings);
      result.errors.push(...propResult.errors);
    }

    // Identify unmapped props
    const mappedProps = new Set(result.propResults.map(r => r.sourceProp));
    const allProps = attributes
      .filter(attr => ts.isJsxAttribute(attr))
      .map(attr => this.getAttributeName(attr as ts.JsxAttribute));
    result.unmappedProps = allProps.filter(prop => !mappedProps.has(prop));

    return result;
  }

  /**
   * Transform a single prop
   */
  private transformProp(
    attr: ts.JsxAttribute | ts.JsxSpreadAttribute,
    componentMapping: ComponentMapping | undefined,
    context: ComponentMappingContext
  ): PropertyMappingResult {
    const result: PropertyMappingResult = {
      success: true,
      sourceProp: '',
      targetProp: '',
      value: undefined,
      transformedValue: undefined,
      warnings: [],
      errors: [],
    };

    // Handle spread attributes
    if (ts.isJsxSpreadAttribute(attr)) {
      result.sourceProp = '...spread';
      result.targetProp = '...spread';
      result.value = attr.expression.getText();
      result.transformedValue = result.value;
      return result;
    }

    // Get prop name and value
    const propName = this.getAttributeName(attr);
    result.sourceProp = propName;
    result.value = this.getAttributeValue(attr);

    // Find prop mapping
    const propMapping = this.findPropMapping(propName, componentMapping);
    
    if (propMapping) {
      // Check if prop should be omitted
      if (propMapping.omit) {
        result.targetProp = '';
        result.warnings.push(`Property ${propName} is omitted in target component`);
        return result;
      }

      // Apply conditional mapping if needed
      const effectiveMapping = this.evaluateConditionalMapping(propMapping, context);
      
      // Transform prop name
      result.targetProp = this.propNameTransformer.transform(propName, effectiveMapping);
      
      // Handle deprecation
      if (effectiveMapping.deprecated) {
        result.deprecated = {
          message: effectiveMapping.deprecationMessage || `Property ${propName} is deprecated`,
          alternative: effectiveMapping.alternative,
        };
        result.warnings.push(result.deprecated.message);
      }

      // Transform value if needed
      if (effectiveMapping.valueTransformation) {
        result.transformedValue = this.transformValue(
          result.value,
          effectiveMapping.valueTransformation,
          context
        );
      } else {
        result.transformedValue = result.value;
      }
    } else {
      // No mapping found, apply default transformation
      result.targetProp = this.propNameTransformer.transform(propName);
      result.transformedValue = result.value;
      
      if (this.config.options?.warnOnUnmappedProps) {
        result.warnings.push(`No mapping found for property ${propName}`);
      }
    }

    return result;
  }

  /**
   * Find prop mapping for a given prop name
   */
  private findPropMapping(
    propName: string,
    componentMapping: ComponentMapping | undefined
  ): PropertyMapping | undefined {
    // Check component-specific mapping first
    if (componentMapping) {
      const mapping = componentMapping.props.find(p => p.source === propName);
      if (mapping) return mapping;
    }

    // Check global prop mappings
    return this.globalPropMappings.get(propName);
  }

  /**
   * Evaluate conditional mapping based on context
   */
  private evaluateConditionalMapping(
    mapping: PropertyMapping,
    context: ComponentMappingContext
  ): PropertyMapping {
    if (!mapping.conditional || mapping.conditional.length === 0) {
      return mapping;
    }

    for (const condition of mapping.conditional) {
      if (this.evaluateCondition(condition.condition, context)) {
        // Create new mapping with conditional overrides
        return {
          ...mapping,
          target: condition.target,
          valueTransformation: condition.valueTransformation || mapping.valueTransformation,
        };
      }
    }

    return mapping;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(
    condition: PropertyMapping['conditional'][0]['condition'],
    context: ComponentMappingContext
  ): boolean {
    const propValue = context.props[condition.prop];

    switch (condition.operator) {
      case 'equals':
        return propValue === condition.value;
      case 'notEquals':
        return propValue !== condition.value;
      case 'contains':
        return String(propValue).includes(String(condition.value));
      case 'notContains':
        return !String(propValue).includes(String(condition.value));
      case 'exists':
        return propValue !== undefined;
      case 'notExists':
        return propValue === undefined;
      default:
        return false;
    }
  }

  /**
   * Transform a property value
   */
  private transformValue(
    value: any,
    transformation: PropertyMapping['valueTransformation'],
    context: ComponentMappingContext
  ): any {
    if (!transformation) return value;

    switch (transformation.type) {
      case 'direct':
        return transformation.from === value ? transformation.to : value;
        
      case 'map':
        return transformation.map?.[value] ?? value;
        
      case 'function':
        if (transformation.transform && this.config.valueTransformers) {
          const transformerPath = this.config.valueTransformers[transformation.transform];
          // In real implementation, this would dynamically load and execute the transformer
          console.warn(`Custom transformer ${transformation.transform} not implemented`);
        }
        return value;
        
      case 'conditional':
        if (transformation.condition && 
            this.evaluateCondition(transformation.condition, context)) {
          return transformation.to ?? value;
        }
        return transformation.from ?? value;
        
      default:
        return value;
    }
  }

  /**
   * Get JSX attributes from element
   */
  private getJsxAttributes(
    node: ts.JsxElement | ts.JsxSelfClosingElement
  ): (ts.JsxAttribute | ts.JsxSpreadAttribute)[] {
    const attributes = ts.isJsxElement(node)
      ? node.openingElement.attributes
      : node.attributes;

    return attributes.properties.filter(
      (prop): prop is ts.JsxAttribute | ts.JsxSpreadAttribute =>
        ts.isJsxAttribute(prop) || ts.isJsxSpreadAttribute(prop)
    );
  }

  /**
   * Get attribute name
   */
  private getAttributeName(attr: ts.JsxAttribute): string {
    return attr.name.getText();
  }

  /**
   * Get attribute value
   */
  private getAttributeValue(attr: ts.JsxAttribute): any {
    if (!attr.initializer) return true; // Boolean prop

    if (ts.isStringLiteral(attr.initializer)) {
      return attr.initializer.text;
    }

    if (ts.isJsxExpression(attr.initializer)) {
      return attr.initializer.expression?.getText() ?? '';
    }

    return attr.initializer.getText();
  }

  /**
   * Apply transformations to create new JSX element
   */
  createTransformedJsxElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    mappingResult: ComponentMappingResult
  ): ts.JsxElement | ts.JsxSelfClosingElement {
    const factory = ts.factory;
    
    // Create new attributes
    const newAttributes: ts.JsxAttributeLike[] = [];
    
    for (const propResult of mappingResult.propResults) {
      if (propResult.targetProp && propResult.targetProp !== '...spread') {
        const newAttr = factory.createJsxAttribute(
          factory.createIdentifier(propResult.targetProp),
          propResult.transformedValue !== true
            ? factory.createStringLiteral(String(propResult.transformedValue))
            : undefined
        );
        newAttributes.push(newAttr);
      }
    }

    // Create new element with transformed component name and props
    if (ts.isJsxElement(node)) {
      const openingElement = factory.createJsxOpeningElement(
        factory.createIdentifier(mappingResult.targetComponent),
        undefined,
        factory.createJsxAttributes(newAttributes)
      );
      
      const closingElement = factory.createJsxClosingElement(
        factory.createIdentifier(mappingResult.targetComponent)
      );
      
      return factory.createJsxElement(
        openingElement,
        node.children,
        closingElement
      );
    } else {
      return factory.createJsxSelfClosingElement(
        factory.createIdentifier(mappingResult.targetComponent),
        undefined,
        factory.createJsxAttributes(newAttributes)
      );
    }
  }

  /**
   * Clear internal caches
   */
  clearCache(): void {
    this.propNameTransformer.clearCache();
  }
}