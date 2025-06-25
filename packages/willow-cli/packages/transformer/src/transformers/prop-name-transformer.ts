import type { PropertyMapping } from '../schemas/component-mapping.schema';

/**
 * Handles property name transformations based on mapping rules
 */
export class PropNameTransformer {
  private transformCache = new Map<string, string>();

  /**
   * Transform a property name based on mapping rules
   */
  transform(propName: string, mapping?: PropertyMapping): string {
    // Check cache first
    const cacheKey = `${propName}:${mapping?.target || ''}`;
    if (this.transformCache.has(cacheKey)) {
      return this.transformCache.get(cacheKey)!;
    }

    let result = propName;

    // Apply direct mapping if available
    if (mapping?.target) {
      result = mapping.target;
    } else {
      // Apply default transformations
      result = this.applyDefaultTransformations(propName);
    }

    // Cache the result
    this.transformCache.set(cacheKey, result);
    return result;
  }

  /**
   * Convert camelCase to kebab-case
   */
  camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (match, offset) => {
      return offset > 0 ? `-${match.toLowerCase()}` : match.toLowerCase();
    });
  }

  /**
   * Convert kebab-case to camelCase
   */
  kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (match, offset) => {
      return offset > 0 ? `_${match.toLowerCase()}` : match.toLowerCase();
    });
  }

  /**
   * Add prefix to property name
   */
  addPrefix(propName: string, prefix: string): string {
    // Handle different casing styles
    if (propName.includes('-')) {
      // kebab-case
      return `${prefix}-${propName}`;
    } else if (propName.includes('_')) {
      // snake_case
      return `${prefix}_${propName}`;
    } else {
      // camelCase/PascalCase
      return prefix + propName.charAt(0).toUpperCase() + propName.slice(1);
    }
  }

  /**
   * Add suffix to property name
   */
  addSuffix(propName: string, suffix: string): string {
    // Handle different casing styles
    if (propName.includes('-')) {
      // kebab-case
      return `${propName}-${suffix}`;
    } else if (propName.includes('_')) {
      // snake_case
      return `${propName}_${suffix}`;
    } else {
      // camelCase/PascalCase
      return propName + suffix.charAt(0).toUpperCase() + suffix.slice(1);
    }
  }

  /**
   * Remove prefix from property name
   */
  removePrefix(propName: string, prefix: string): string {
    // Handle different casing styles
    if (propName.startsWith(`${prefix}-`)) {
      return propName.slice(prefix.length + 1);
    } else if (propName.startsWith(`${prefix}_`)) {
      return propName.slice(prefix.length + 1);
    } else if (propName.startsWith(prefix)) {
      const remaining = propName.slice(prefix.length);
      return remaining.charAt(0).toLowerCase() + remaining.slice(1);
    }
    return propName;
  }

  /**
   * Remove suffix from property name
   */
  removeSuffix(propName: string, suffix: string): string {
    // Handle different casing styles
    if (propName.endsWith(`-${suffix}`)) {
      return propName.slice(0, -(suffix.length + 1));
    } else if (propName.endsWith(`_${suffix}`)) {
      return propName.slice(0, -(suffix.length + 1));
    } else if (propName.endsWith(suffix)) {
      return propName.slice(0, -suffix.length);
    }
    return propName;
  }

  /**
   * Apply custom transformation function
   */
  applyCustomTransform(propName: string, transformFn: (name: string) => string): string {
    try {
      return transformFn(propName);
    } catch (error) {
      console.error(`Custom transform failed for ${propName}:`, error);
      return propName;
    }
  }

  /**
   * Handle nested property paths (e.g., "style.color" -> "sx.color")
   */
  transformNestedPath(path: string, mapping?: PropertyMapping): string {
    const parts = path.split('.');
    
    if (parts.length === 1) {
      return this.transform(path, mapping);
    }

    // Transform each part of the path
    const transformedParts = parts.map((part, index) => {
      if (index === 0 && mapping?.target) {
        // Use mapping for the root property
        const targetParts = mapping.target.split('.');
        return targetParts[0];
      }
      return this.transform(part);
    });

    return transformedParts.join('.');
  }

  /**
   * Handle spread operator properties
   */
  transformSpreadProp(propName: string): string {
    // Remove the spread operator prefix if present
    if (propName.startsWith('...')) {
      const baseName = propName.slice(3);
      return `...${this.transform(baseName)}`;
    }
    return this.transform(propName);
  }

  /**
   * Batch transform multiple property names
   */
  transformBatch(propNames: string[], mappings?: Record<string, PropertyMapping>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const propName of propNames) {
      const mapping = mappings?.[propName];
      result[propName] = this.transform(propName, mapping);
    }
    
    return result;
  }

  /**
   * Apply default transformations based on common patterns
   */
  private applyDefaultTransformations(propName: string): string {
    // Common React -> Framework transformations
    const commonTransformations: Record<string, string> = {
      className: 'class',
      htmlFor: 'for',
      tabIndex: 'tabindex',
      autoComplete: 'autocomplete',
      autoFocus: 'autofocus',
      readOnly: 'readonly',
      onClick: 'onPress',
      onChange: 'onValueChange',
      onBlur: 'onBlurChange',
      onFocus: 'onFocusChange',
    };

    if (commonTransformations[propName]) {
      return commonTransformations[propName];
    }

    // Handle data-* and aria-* attributes
    if (propName.startsWith('data') || propName.startsWith('aria')) {
      return this.camelToKebab(propName);
    }

    return propName;
  }

  /**
   * Clear transformation cache
   */
  clearCache(): void {
    this.transformCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.transformCache.size,
      entries: Array.from(this.transformCache.keys()),
    };
  }
}