import type { TailwindClass, StyleParser, StyleTransformationContext } from '../../types/style-transformation.types';

/**
 * Parser for Tailwind CSS classes
 */
export class TailwindParser implements StyleParser<TailwindClass[]> {
  /**
   * Parse Tailwind classes from a string
   */
  parse(
    input: string | any,
    context: StyleTransformationContext
  ): TailwindClass[] {
    if (typeof input !== 'string') {
      throw new Error('Tailwind parser expects string input');
    }

    // Split classes and parse each one
    const classes = input.trim().split(/\s+/).filter(Boolean);
    return classes.map(cls => this.parseClass(cls));
  }

  /**
   * Serialize Tailwind classes back to string
   */
  serialize(
    parsed: TailwindClass[],
    context: StyleTransformationContext
  ): string {
    return parsed
      .map(cls => this.serializeClass(cls))
      .join(' ');
  }

  /**
   * Parse a single Tailwind class
   */
  private parseClass(className: string): TailwindClass {
    const result: TailwindClass = {
      utility: '',
      variant: [],
      important: false,
    };

    // Check for important modifier
    if (className.startsWith('!')) {
      result.important = true;
      className = className.slice(1);
    }

    // Split by colons to extract variants
    const parts = className.split(':');
    
    if (parts.length > 1) {
      // Has variants
      result.variant = parts.slice(0, -1);
      result.utility = parts[parts.length - 1];
    } else {
      // No variants
      result.utility = parts[0];
    }

    // Check for important modifier in utility (for variant cases like hover:!bg-blue-500)
    if (result.utility.startsWith('!')) {
      result.important = true;
      result.utility = result.utility.slice(1);
    }

    // Check for arbitrary values
    const arbitraryMatch = result.utility.match(/^(.+?)-?\[(.+)\]$/);
    if (arbitraryMatch) {
      result.utility = arbitraryMatch[1].replace(/-$/, ''); // Remove trailing dash
      result.arbitrary = arbitraryMatch[2];
    }

    return result;
  }

  /**
   * Serialize a Tailwind class back to string
   */
  private serializeClass(cls: TailwindClass): string {
    let result = '';

    // Add important modifier
    if (cls.important) {
      result += '!';
    }

    // Add variants
    if (cls.variant && cls.variant.length > 0) {
      result += cls.variant.join(':') + ':';
    }

    // Add utility
    result += cls.utility;

    // Add arbitrary value
    if (cls.arbitrary) {
      result += `[${cls.arbitrary}]`;
    }

    return result;
  }

  /**
   * Extract utility category from class name
   */
  getUtilityCategory(utility: string): string {
    // Common Tailwind utility prefixes
    const categories: Record<string, string[]> = {
      layout: ['flex', 'grid', 'block', 'inline', 'hidden', 'container'],
      spacing: ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'space'],
      sizing: ['w', 'h', 'min-w', 'min-h', 'max-w', 'max-h'],
      typography: ['text', 'font', 'leading', 'tracking', 'decoration'],
      background: ['bg', 'from', 'via', 'to'],
      border: ['border', 'rounded', 'ring'],
      effects: ['shadow', 'opacity', 'blur', 'brightness'],
      filters: ['backdrop'],
      transforms: ['scale', 'rotate', 'translate', 'skew'],
      interactivity: ['cursor', 'select', 'resize'],
      svg: ['fill', 'stroke'],
      accessibility: ['sr'],
    };

    for (const [category, prefixes] of Object.entries(categories)) {
      if (prefixes.some(prefix => utility === prefix || utility.startsWith(prefix + '-'))) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Check if a class is a valid Tailwind utility
   */
  isValidUtility(utility: string): boolean {
    // This is a simplified check - in a real implementation,
    // you might want to load the full Tailwind utility list
    const validPrefixes = [
      // Layout
      'container', 'box', 'block', 'inline', 'flex', 'table', 'grid', 'hidden',
      // Flexbox & Grid
      'justify', 'content', 'items', 'self', 'place', 'gap', 'order',
      // Spacing
      'm', 'p', 'space',
      // Sizing
      'w', 'h', 'min', 'max',
      // Typography
      'font', 'text', 'leading', 'tracking', 'align', 'whitespace', 'break',
      // Backgrounds
      'bg', 'from', 'via', 'to', 'gradient',
      // Borders
      'border', 'rounded', 'ring', 'divide',
      // Effects
      'shadow', 'opacity', 'mix', 'blur', 'brightness', 'contrast',
      // Transforms
      'transform', 'scale', 'rotate', 'translate', 'skew', 'origin',
      // Transitions
      'transition', 'duration', 'ease', 'delay',
      // Interactivity
      'cursor', 'select', 'resize', 'scroll', 'touch', 'will',
      // SVG
      'fill', 'stroke',
      // Accessibility
      'sr', 'not-sr',
      // Positioning
      'static', 'fixed', 'absolute', 'relative', 'sticky', 'inset', 'top', 'right', 'bottom', 'left', 'z',
      // Display
      'overflow', 'overscroll', 'visibility',
      // Colors
      'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow',
      'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet',
      'purple', 'fuchsia', 'pink', 'rose', 'white', 'black', 'transparent', 'current',
    ];

    // Check if utility starts with any valid prefix
    return validPrefixes.some(prefix => 
      utility === prefix || 
      utility.startsWith(prefix + '-') ||
      utility.startsWith('-' + prefix)
    );
  }
}