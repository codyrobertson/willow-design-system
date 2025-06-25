import {
  StyleValidator,
  StyleValidationResult,
  StyleValidationContext,
  StyleValidationRule,
  ValidationSeverity,
} from '../../types/style-transformation.types';

/**
 * CSS property validation rules
 */
export const CSS_PROPERTIES = new Set([
  // Layout
  'display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'overflow', 'overflow-x', 'overflow-y', 'visibility', 'opacity',
  
  // Flexbox
  'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction',
  'flex-wrap', 'justify-content', 'align-items', 'align-content', 'align-self',
  'order', 'gap', 'row-gap', 'column-gap',
  
  // Grid
  'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
  'grid-template-areas', 'grid-column', 'grid-row', 'grid-area',
  'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
  
  // Typography
  'font', 'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'text-align', 'text-decoration', 'text-transform',
  'letter-spacing', 'word-spacing', 'white-space', 'color',
  
  // Background & Border
  'background', 'background-color', 'background-image', 'background-position',
  'background-repeat', 'background-size', 'background-attachment',
  'border', 'border-width', 'border-style', 'border-color',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'outline', 'outline-width', 'outline-style', 'outline-color',
  
  // Transform & Transition
  'transform', 'transform-origin', 'transition', 'transition-property',
  'transition-duration', 'transition-timing-function', 'transition-delay',
  'animation', 'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'animation-direction',
  
  // Other
  'cursor', 'pointer-events', 'user-select', 'z-index', 'content',
  'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
]);

/**
 * CSS units validation
 */
export const CSS_UNITS = new Set([
  // Absolute units
  'px', 'pt', 'pc', 'in', 'cm', 'mm',
  // Relative units
  'em', 'rem', '%', 'vh', 'vw', 'vmin', 'vmax',
  'ex', 'ch', 'lh', 'rlh', 'svw', 'svh', 'lvw', 'lvh', 'dvw', 'dvh',
  // Flexible units
  'fr',
]);

/**
 * Color format validation patterns
 */
export const COLOR_PATTERNS = {
  hex: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  rgb: /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
  rgba: /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/,
  hsl: /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/,
  hsla: /^hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*[\d.]+\s*\)$/,
  named: /^(red|blue|green|yellow|black|white|gray|grey|orange|purple|pink|brown|transparent|currentColor)$/i,
};

/**
 * Base style validator implementation
 */
export class BaseStyleValidator implements StyleValidator {
  private rules: StyleValidationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  getName(): string {
    return 'base-style-validator';
  }

  /**
   * Validate styles
   */
  validate(
    styles: any,
    context: StyleValidationContext
  ): StyleValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Apply all validation rules
    for (const rule of this.rules) {
      if (this.shouldApplyRule(rule, context)) {
        const result = rule.validate(styles, context);
        
        if (result.severity === ValidationSeverity.ERROR) {
          errors.push(...result.violations);
        } else if (result.severity === ValidationSeverity.WARNING) {
          warnings.push(...result.violations);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Add validation rule
   */
  addRule(rule: StyleValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove validation rule
   */
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Property validation
    this.addRule(new PropertyValidationRule());
    
    // Value validation
    this.addRule(new ValueValidationRule());
    
    // Color validation
    this.addRule(new ColorValidationRule());
    
    // Unit validation
    this.addRule(new UnitValidationRule());
    
    // Duplicate detection
    this.addRule(new DuplicatePropertyRule());
    
    // Performance rules
    this.addRule(new PerformanceValidationRule());
    
    // Best practices
    this.addRule(new BestPracticesRule());
    
    // Accessibility
    this.addRule(new AccessibilityRule());
  }

  /**
   * Check if rule should be applied
   */
  private shouldApplyRule(
    rule: StyleValidationRule,
    context: StyleValidationContext
  ): boolean {
    // Check framework compatibility
    if (rule.frameworks && !rule.frameworks.includes(context.framework)) {
      return false;
    }

    // Check style type compatibility
    if (rule.styleTypes && !rule.styleTypes.includes(context.styleType)) {
      return false;
    }

    return true;
  }
}

/**
 * Property validation rule
 */
class PropertyValidationRule implements StyleValidationRule {
  name = 'property-validation';
  description = 'Validates CSS property names';
  severity = ValidationSeverity.ERROR;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];

    if (typeof styles === 'object' && !Array.isArray(styles)) {
      for (const property of Object.keys(styles)) {
        if (!this.isValidProperty(property)) {
          violations.push({
            rule: this.name,
            message: `Unknown CSS property: ${property}`,
            location: { property },
            severity: this.severity,
          });
        }
      }
    }

    return { violations, severity: this.severity };
  }

  private isValidProperty(property: string): boolean {
    // Convert camelCase to kebab-case for validation
    const kebabCase = property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    
    return (
      CSS_PROPERTIES.has(property) ||
      CSS_PROPERTIES.has(kebabCase) ||
      property.startsWith('--') || // CSS custom properties
      property.startsWith('data-') || // Data attributes
      property.startsWith('aria-') // ARIA attributes
    );
  }
}

/**
 * Value validation rule
 */
class ValueValidationRule implements StyleValidationRule {
  name = 'value-validation';
  description = 'Validates CSS property values';
  severity = ValidationSeverity.WARNING;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];

    if (typeof styles === 'object' && !Array.isArray(styles)) {
      for (const [property, value] of Object.entries(styles)) {
        const issues = this.validateValue(property, value);
        violations.push(...issues);
      }
    }

    return { violations, severity: this.severity };
  }

  private validateValue(property: string, value: any): any[] {
    const issues: any[] = [];

    // Check for undefined or null values
    if (value === undefined || value === null) {
      issues.push({
        rule: this.name,
        message: `Invalid value for ${property}: ${value}`,
        location: { property, value },
        severity: this.severity,
      });
    }

    // Type-specific validation
    if (typeof value === 'string') {
      // Check for typos in common values
      if (property === 'display' && !this.isValidDisplayValue(value)) {
        issues.push({
          rule: this.name,
          message: `Invalid display value: ${value}`,
          location: { property, value },
          severity: this.severity,
        });
      }
    }

    return issues;
  }

  private isValidDisplayValue(value: string): boolean {
    // Strip !important suffix for validation
    const cleanValue = value.replace(/\s*!important\s*$/, '').trim();
    
    const validValues = [
      'block', 'inline', 'inline-block', 'flex', 'inline-flex',
      'grid', 'inline-grid', 'none', 'contents', 'table',
      'table-row', 'table-cell', 'list-item', 'inherit', 'initial',
    ];
    return validValues.includes(cleanValue);
  }
}

/**
 * Color validation rule
 */
class ColorValidationRule implements StyleValidationRule {
  name = 'color-validation';
  description = 'Validates color values';
  severity = ValidationSeverity.WARNING;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];
    const colorProperties = [
      'color', 'background-color', 'border-color', 'outline-color',
      'backgroundColor', 'borderColor', 'outlineColor',
    ];

    if (typeof styles === 'object' && !Array.isArray(styles)) {
      for (const [property, value] of Object.entries(styles)) {
        if (colorProperties.some(cp => property.includes(cp)) && 
            typeof value === 'string' &&
            !this.isValidColor(value)) {
          violations.push({
            rule: this.name,
            message: `Invalid color value: ${value}`,
            location: { property, value },
            severity: this.severity,
          });
        }
      }
    }

    return { violations, severity: this.severity };
  }

  private isValidColor(value: string): boolean {
    // Strip !important suffix for validation
    const cleanValue = value.replace(/\s*!important\s*$/, '').trim();
    return Object.values(COLOR_PATTERNS).some(pattern => pattern.test(cleanValue));
  }
}

/**
 * Unit validation rule
 */
class UnitValidationRule implements StyleValidationRule {
  name = 'unit-validation';
  description = 'Validates CSS units';
  severity = ValidationSeverity.WARNING;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];
    const dimensionProperties = [
      'width', 'height', 'margin', 'padding', 'top', 'left', 'right', 'bottom',
      'border-width', 'border-radius',
    ];

    if (typeof styles === 'object' && !Array.isArray(styles)) {
      for (const [property, value] of Object.entries(styles)) {
        if (dimensionProperties.some(dp => property.includes(dp)) && 
            typeof value === 'string' &&
            !this.hasValidUnit(value)) {
          violations.push({
            rule: this.name,
            message: `Missing or invalid unit: ${value}`,
            location: { property, value },
            severity: this.severity,
            suggestion: 'Add a valid CSS unit (px, rem, %, etc.)',
          });
        }
      }
    }

    return { violations, severity: this.severity };
  }

  private hasValidUnit(value: string): boolean {
    // Special values that don't need units
    if (['0', 'auto', 'inherit', 'initial', 'unset'].includes(value)) {
      return true;
    }

    // Check if value ends with a valid unit
    return Array.from(CSS_UNITS).some(unit => value.endsWith(unit));
  }
}

/**
 * Duplicate property detection rule
 */
class DuplicatePropertyRule implements StyleValidationRule {
  name = 'duplicate-property';
  description = 'Detects duplicate CSS properties';
  severity = ValidationSeverity.WARNING;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];
    
    // This would need more sophisticated parsing for CSS strings
    // For now, just handle object styles
    
    return { violations, severity: this.severity };
  }
}

/**
 * Performance validation rule
 */
class PerformanceValidationRule implements StyleValidationRule {
  name = 'performance';
  description = 'Validates performance-related style issues';
  severity = ValidationSeverity.WARNING;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];

    if (typeof styles === 'object' && !Array.isArray(styles)) {
      // Check for expensive properties
      if (styles.filter && typeof styles.filter === 'string') {
        violations.push({
          rule: this.name,
          message: 'CSS filters can impact performance',
          location: { property: 'filter' },
          severity: ValidationSeverity.INFO,
          suggestion: 'Use sparingly on animated elements',
        });
      }

      // Check for will-change overuse
      if (styles.willChange && styles.willChange !== 'auto') {
        violations.push({
          rule: this.name,
          message: 'will-change should be used sparingly',
          location: { property: 'will-change' },
          severity: this.severity,
          suggestion: 'Only use before animations and remove after',
        });
      }

      // Check for complex selectors (in CSS strings)
      if (context.styleType === 'css' && context.rawStyle) {
        const complexSelectors = this.findComplexSelectors(context.rawStyle);
        for (const selector of complexSelectors) {
          violations.push({
            rule: this.name,
            message: `Complex selector may impact performance: ${selector}`,
            location: { selector },
            severity: this.severity,
          });
        }
      }
    }

    return { violations, severity: this.severity };
  }

  private findComplexSelectors(css: string): string[] {
    const complexSelectors: string[] = [];
    // Simplified check - would need proper CSS parsing
    const selectorRegex = /([^{]+)\s*{/g;
    let match;
    
    while ((match = selectorRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      // Check for deeply nested or attribute selectors
      if (selector.split(' ').length > 3 || selector.includes('[')) {
        complexSelectors.push(selector);
      }
    }
    
    return complexSelectors;
  }
}

/**
 * Best practices validation rule
 */
class BestPracticesRule implements StyleValidationRule {
  name = 'best-practices';
  description = 'Validates CSS best practices';
  severity = ValidationSeverity.WARNING;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];

    if (typeof styles === 'object' && !Array.isArray(styles)) {
      // Check for !important usage
      for (const [property, value] of Object.entries(styles)) {
        if (typeof value === 'string' && value.includes('!important')) {
          violations.push({
            rule: this.name,
            message: 'Avoid using !important',
            location: { property, value },
            severity: ValidationSeverity.WARNING,
            suggestion: 'Use more specific selectors instead',
          });
        }
      }

      // Check for magic numbers
      for (const [property, value] of Object.entries(styles)) {
        if (typeof value === 'string' && this.isMagicNumber(value)) {
          violations.push({
            rule: this.name,
            message: `Magic number detected: ${value}`,
            location: { property, value },
            severity: ValidationSeverity.WARNING,
            suggestion: 'Consider using design tokens or CSS variables',
          });
        }
      }

      // Check for z-index values
      if (styles.zIndex !== undefined) {
        const zIndexValue = typeof styles.zIndex === 'string' ? parseInt(styles.zIndex) : styles.zIndex;
        if (!isNaN(zIndexValue) && zIndexValue > 100) {
          violations.push({
            rule: this.name,
            message: 'High z-index value detected',
            location: { property: 'zIndex', value: styles.zIndex },
            severity: ValidationSeverity.WARNING,
            suggestion: 'Use a z-index scale system',
          });
        }
      }
    }

    return { violations, severity: this.severity };
  }

  private isMagicNumber(value: string): boolean {
    // Check for arbitrary pixel values
    const pixelMatch = value.match(/^(\d+)px$/);
    if (pixelMatch) {
      const num = parseInt(pixelMatch[1]);
      // Common values that are OK
      const commonValues = [0, 1, 2, 4, 8, 12, 16, 20, 24, 32, 48, 64, 100];
      // Return true for any number not in common values
      return !commonValues.includes(num);
    }
    return false;
  }
}

/**
 * Accessibility validation rule
 */
class AccessibilityRule implements StyleValidationRule {
  name = 'accessibility';
  description = 'Validates accessibility-related styles';
  severity = ValidationSeverity.WARNING;

  validate(styles: any, context: StyleValidationContext): any {
    const violations: any[] = [];

    if (typeof styles === 'object' && !Array.isArray(styles)) {
      // Check for outline removal without alternative
      if (styles.outline === 'none' && !styles.boxShadow) {
        violations.push({
          rule: this.name,
          message: 'Removing outline without alternative focus indicator',
          location: { property: 'outline' },
          severity: this.severity,
          suggestion: 'Provide visible focus indicator for keyboard navigation',
        });
      }

      // Check for color contrast (simplified)
      // Only warn when both color and backgroundColor are present
      if (styles.color && styles.backgroundColor) {
        // This would need actual color contrast calculation
        violations.push({
          rule: this.name,
          message: 'Verify color contrast meets WCAG standards',
          location: { 
            properties: ['color', 'backgroundColor'],
            values: [styles.color, styles.backgroundColor],
          },
          severity: ValidationSeverity.INFO,
        });
      }

      // Check for motion without prefers-reduced-motion
      if ((styles.animation || styles.transition) && 
          !context.rawStyle?.includes('prefers-reduced-motion')) {
        violations.push({
          rule: this.name,
          message: 'Consider prefers-reduced-motion for animations',
          location: { property: styles.animation ? 'animation' : 'transition' },
          severity: ValidationSeverity.INFO,
          suggestion: '@media (prefers-reduced-motion: reduce) { }',
        });
      }
    }

    return { violations, severity: this.severity };
  }
}

/**
 * Create a style validator with custom configuration
 */
export function createStyleValidator(config?: {
  rules?: StyleValidationRule[];
  excludeRules?: string[];
}): StyleValidator {
  const validator = new BaseStyleValidator();

  // Add custom rules
  if (config?.rules) {
    for (const rule of config.rules) {
      validator.addRule(rule);
    }
  }

  // Remove excluded rules
  if (config?.excludeRules) {
    for (const ruleName of config.excludeRules) {
      validator.removeRule(ruleName);
    }
  }

  return validator;
}