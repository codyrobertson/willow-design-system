import type { ValueTransformation } from '../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../types/component-mapping.types';

/**
 * Interface for custom value converters
 */
export interface ValueConverter {
  name: string;
  convert(value: any, context: ComponentMappingContext): Promise<any> | any;
  supports(type: string): boolean;
}

/**
 * Result of value conversion
 */
export interface ConversionResult {
  success: boolean;
  value: any;
  originalValue: any;
  converter: string;
  warnings: string[];
  errors: string[];
}

/**
 * Configuration for value converters
 */
export interface ConverterConfig {
  booleanToString?: {
    trueValue?: string;
    falseValue?: string;
  };
  unitConversions?: {
    baseFontSize?: number; // For px to rem conversions
    pixelDensity?: number; // For px to dp conversions
  };
  colorFormats?: {
    preferredFormat?: 'hex' | 'rgb' | 'hsl' | 'rgba' | 'hsla';
    allowAlpha?: boolean;
  };
}

/**
 * Main value converter system
 */
export class PropValueConverter {
  private converters: Map<string, ValueConverter> = new Map();
  private config: ConverterConfig;

  constructor(config: ConverterConfig = {}) {
    this.config = {
      booleanToString: {
        trueValue: 'true',
        falseValue: 'false',
        ...config.booleanToString,
      },
      unitConversions: {
        baseFontSize: 16,
        pixelDensity: 1,
        ...config.unitConversions,
      },
      colorFormats: {
        preferredFormat: 'hex',
        allowAlpha: true,
        ...config.colorFormats,
      },
    };

    this.registerBuiltInConverters();
  }

  /**
   * Register built-in converters
   */
  private registerBuiltInConverters(): void {
    this.registerConverter(new BooleanConverter(this.config));
    this.registerConverter(new UnitConverter(this.config));
    this.registerConverter(new ColorConverter(this.config));
    this.registerConverter(new EnumConverter());
    this.registerConverter(new StringConverter());
    this.registerConverter(new NumberConverter());
  }

  /**
   * Register a custom converter
   */
  registerConverter(converter: ValueConverter): void {
    this.converters.set(converter.name, converter);
  }

  /**
   * Convert a value using the specified transformation
   */
  async convert(
    value: any,
    transformation: ValueTransformation,
    context: ComponentMappingContext
  ): Promise<ConversionResult> {
    const result: ConversionResult = {
      success: true,
      value,
      originalValue: value,
      converter: 'none',
      warnings: [],
      errors: [],
    };

    try {
      switch (transformation.type) {
        case 'direct':
          result.value = transformation.from === value ? transformation.to : value;
          result.converter = 'direct';
          break;

        case 'map':
          if (transformation.map && value in transformation.map) {
            result.value = transformation.map[value];
            result.converter = 'map';
          }
          break;

        case 'function':
          if (transformation.transform) {
            result.value = await this.applyCustomTransform(
              value,
              transformation.transform,
              context
            );
            result.converter = transformation.transform;
          }
          break;

        case 'conditional':
          if (transformation.condition) {
            // Conditional logic would be evaluated elsewhere
            result.value = transformation.to ?? value;
            result.converter = 'conditional';
          }
          break;

        default:
          result.warnings.push(`Unknown transformation type: ${transformation.type}`);
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Apply custom transformation function
   */
  private async applyCustomTransform(
    value: any,
    transformerName: string,
    context: ComponentMappingContext
  ): Promise<any> {
    const converter = this.converters.get(transformerName);
    if (!converter) {
      throw new Error(`Unknown converter: ${transformerName}`);
    }

    return await converter.convert(value, context);
  }

  /**
   * Convert value by type detection
   */
  async convertByType(
    value: any,
    targetType: string,
    context: ComponentMappingContext
  ): Promise<ConversionResult> {
    const result: ConversionResult = {
      success: true,
      value,
      originalValue: value,
      converter: 'auto',
      warnings: [],
      errors: [],
    };

    try {
      // Find appropriate converter
      for (const [name, converter] of this.converters) {
        if (converter.supports(targetType)) {
          result.value = await converter.convert(value, context);
          result.converter = name;
          break;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Auto-conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Get list of registered converters
   */
  getConverters(): string[] {
    return Array.from(this.converters.keys());
  }

  /**
   * Check if converter exists
   */
  hasConverter(name: string): boolean {
    return this.converters.has(name);
  }
}

/**
 * Boolean to string converter
 */
class BooleanConverter implements ValueConverter {
  name = 'boolean';

  constructor(private config: ConverterConfig) {}

  supports(type: string): boolean {
    return type === 'boolean' || type === 'string';
  }

  convert(value: any): any {
    if (typeof value === 'boolean') {
      return value 
        ? this.config.booleanToString?.trueValue || 'true'
        : this.config.booleanToString?.falseValue || 'false';
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) return true;
      if (['false', '0', 'no', 'off'].includes(lower)) return false;
    }
    
    return value;
  }
}

/**
 * Unit conversion converter
 */
class UnitConverter implements ValueConverter {
  name = 'unit';

  constructor(private config: ConverterConfig) {}

  supports(type: string): boolean {
    return ['px', 'rem', 'em', 'dp', 'pt'].includes(type);
  }

  convert(value: any): any {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return value;
    }

    const stringValue = String(value);
    const numericValue = parseFloat(stringValue);
    
    if (isNaN(numericValue)) return value;

    // Pixel to rem conversion
    if (stringValue.endsWith('px')) {
      const baseFontSize = this.config.unitConversions?.baseFontSize || 16;
      return `${(numericValue / baseFontSize).toFixed(3)}rem`;
    }

    // Rem to pixel conversion
    if (stringValue.endsWith('rem')) {
      const baseFontSize = this.config.unitConversions?.baseFontSize || 16;
      return `${(numericValue * baseFontSize)}px`;
    }

    // Points to pixels (assuming 72 DPI)
    if (stringValue.endsWith('pt')) {
      return `${(numericValue * 1.333).toFixed(1)}px`;
    }

    return value;
  }
}

/**
 * Color format converter
 */
class ColorConverter implements ValueConverter {
  name = 'color';

  constructor(private config: ConverterConfig) {}

  supports(type: string): boolean {
    return ['color', 'hex', 'rgb', 'hsl', 'rgba', 'hsla'].includes(type);
  }

  convert(value: any): any {
    if (typeof value !== 'string') return value;

    const color = this.parseColor(value);
    if (!color) return value;

    const preferredFormat = this.config.colorFormats?.preferredFormat || 'hex';
    
    switch (preferredFormat) {
      case 'hex':
        return this.toHex(color);
      case 'rgb':
        return this.toRgb(color);
      case 'hsl':
        return this.toHsl(color);
      case 'rgba':
        return this.toRgba(color);
      case 'hsla':
        return this.toHsla(color);
      default:
        return value;
    }
  }

  private parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
    // Hex format
    const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16),
        a: hexMatch[4] ? parseInt(hexMatch[4], 16) / 255 : 1,
      };
    }

    // RGB/RGBA format
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
        a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
      };
    }

    // HSL format (basic implementation)
    const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/);
    if (hslMatch) {
      const { r, g, b } = this.hslToRgb(
        parseInt(hslMatch[1]) / 360,
        parseInt(hslMatch[2]) / 100,
        parseInt(hslMatch[3]) / 100
      );
      return {
        r,
        g,
        b,
        a: hslMatch[4] ? parseFloat(hslMatch[4]) : 1,
      };
    }

    return null;
  }

  private toHex(color: { r: number; g: number; b: number; a: number }): string {
    const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    const alpha = color.a < 1 ? hex(color.a * 255) : '';
    return `#${hex(color.r)}${hex(color.g)}${hex(color.b)}${alpha}`;
  }

  private toRgb(color: { r: number; g: number; b: number }): string {
    return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
  }

  private toRgba(color: { r: number; g: number; b: number; a: number }): string {
    return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
  }

  private toHsl(color: { r: number; g: number; b: number }): string {
    const { h, s, l } = this.rgbToHsl(color.r, color.g, color.b);
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  private toHsla(color: { r: number; g: number; b: number; a: number }): string {
    const { h, s, l } = this.rgbToHsl(color.r, color.g, color.b);
    return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${color.a})`;
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const l = (max + min) / 2;

    if (diff === 0) {
      return { h: 0, s: 0, l };
    }

    const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    let h = 0;
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;

    return { h, s, l };
  }
}

/**
 * Enum value converter
 */
class EnumConverter implements ValueConverter {
  name = 'enum';

  supports(type: string): boolean {
    return type === 'enum';
  }

  convert(value: any): any {
    // Basic enum conversion - could be enhanced with mapping tables
    if (typeof value === 'string') {
      // Convert to camelCase
      return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    return value;
  }
}

/**
 * String converter
 */
class StringConverter implements ValueConverter {
  name = 'string';

  supports(type: string): boolean {
    return type === 'string';
  }

  convert(value: any): string {
    return String(value);
  }
}

/**
 * Number converter
 */
class NumberConverter implements ValueConverter {
  name = 'number';

  supports(type: string): boolean {
    return type === 'number';
  }

  convert(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }
}