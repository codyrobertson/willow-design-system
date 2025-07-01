import {
  TokenParserRegistry,
  CSSVariableParser,
  JSObjectParser,
  TailwindConfigParser,
} from '../src/styles/theme-tokens/token-parser';
import {
  TokenFormat,
  TokenType,
  TokenCategory,
} from '../src/types/theme-tokens.types';

describe('Token Parser System', () => {
  describe('CSSVariableParser', () => {
    const parser = new CSSVariableParser();

    it('should support CSS variable formats', () => {
      expect(parser.supportsFormat(TokenFormat.CSS_VARIABLE)).toBe(true);
      expect(parser.supportsFormat(TokenFormat.CSS_CUSTOM_PROPERTY)).toBe(true);
      expect(parser.supportsFormat(TokenFormat.JSON)).toBe(false);
    });

    it('should parse basic CSS custom properties', async () => {
      const css = `
        :root {
          --primary-color: #007bff;
          --spacing-md: 16px;
          --font-weight-bold: 700;
          --border-radius: 4px;
        }
      `;

      const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);

      expect(result.tokens).toHaveLength(4);
      expect(result.metadata.tokenCount).toBe(4);
      expect(result.metadata.source).toBe('css-variables');

      const primaryColor = result.tokens.find(t => t.name === '--primary-color');
      expect(primaryColor).toBeDefined();
      expect(primaryColor?.value).toBe('#007bff');
      expect(primaryColor?.type).toBe(TokenType.COLOR);
      expect(primaryColor?.category).toBe(TokenCategory.COLOR);

      const spacing = result.tokens.find(t => t.name === '--spacing-md');
      expect(spacing).toBeDefined();
      expect(spacing?.value).toBe('16px');
      expect(spacing?.type).toBe(TokenType.DIMENSION);
      expect(spacing?.category).toBe(TokenCategory.SPACING);
    });

    it('should parse CSS variable references', async () => {
      const css = `
        :root {
          --primary-color: #007bff;
          --secondary-color: var(--primary-color);
          --button-bg: var(--primary-color, #0056b3);
        }
      `;

      const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);

      expect(result.tokens).toHaveLength(3);

      const secondary = result.tokens.find(t => t.name === '--secondary-color');
      expect(secondary).toBeDefined();
      expect(secondary?.type).toBe(TokenType.REFERENCE);
      expect((secondary?.value as any)?.$ref).toBe('primary-color');

      const button = result.tokens.find(t => t.name === '--button-bg');
      expect(button).toBeDefined();
      expect(button?.type).toBe(TokenType.REFERENCE);
      expect(button?.metadata?.fallback).toBe('#0056b3');
    });

    it('should handle various CSS value types', async () => {
      const css = `
        :root {
          --number: 100;
          --string: "Inter, sans-serif";
          --dimension: 1.5rem;
          --color-rgb: rgb(0, 123, 255);
          --color-hsl: hsl(210, 100%, 50%);
          --duration: 0.3s;
          --timing: cubic-bezier(0.4, 0.0, 0.2, 1);
        }
      `;

      const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);

      expect(result.tokens).toHaveLength(7);

      const number = result.tokens.find(t => t.name === '--number');
      expect(number?.value).toBe(100);
      expect(number?.type).toBe(TokenType.DIMENSION);

      const string = result.tokens.find(t => t.name === '--string');
      expect(string?.value).toBe('Inter, sans-serif');

      const colorRgb = result.tokens.find(t => t.name === '--color-rgb');
      expect(colorRgb?.type).toBe(TokenType.COLOR);

      const duration = result.tokens.find(t => t.name === '--duration');
      expect(duration?.type).toBe(TokenType.DURATION);

      const timing = result.tokens.find(t => t.name === '--timing');
      expect(timing?.type).toBe(TokenType.CUBIC_BEZIER);
    });
  });

  describe('JSObjectParser', () => {
    const parser = new JSObjectParser();

    it('should support JavaScript object formats', () => {
      expect(parser.supportsFormat(TokenFormat.JS_OBJECT)).toBe(true);
      expect(parser.supportsFormat(TokenFormat.JS_MODULE)).toBe(true);
      expect(parser.supportsFormat(TokenFormat.JSON)).toBe(true);
      expect(parser.supportsFormat(TokenFormat.CSS_VARIABLE)).toBe(false);
    });

    it('should parse flat JSON object', async () => {
      const json = JSON.stringify({
        'color.primary': '#007bff',
        'color.secondary': '#6c757d',
        'spacing.sm': '8px',
        'spacing.md': '16px',
        'font.weight.normal': 400,
        'font.weight.bold': 700,
      });

      const result = await parser.parse(json, TokenFormat.JSON);

      expect(result.tokens).toHaveLength(6);

      const primary = result.tokens.find(t => t.name === 'color.primary');
      expect(primary?.value).toBe('#007bff');
      expect(primary?.type).toBe(TokenType.COLOR);

      const spacing = result.tokens.find(t => t.name === 'spacing.sm');
      expect(spacing?.value).toBe('8px');
      expect(spacing?.type).toBe(TokenType.DIMENSION);
      expect(spacing?.category).toBe(TokenCategory.SPACING);
    });

    it('should parse nested JSON object', async () => {
      const json = JSON.stringify({
        color: {
          primary: {
            50: '#e3f2fd',
            100: '#bbdefb',
            500: '#2196f3',
            900: '#0d47a1',
          },
          secondary: '#ff4081',
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
        },
      });

      const result = await parser.parse(json, TokenFormat.JSON);

      expect(result.tokens.length).toBeGreaterThan(5);

      const primary500 = result.tokens.find(t => t.name === 'color.primary.500');
      expect(primary500?.value).toBe('#2196f3');
      expect(primary500?.type).toBe(TokenType.COLOR);

      const spacingMd = result.tokens.find(t => t.name === 'spacing.md');
      expect(spacingMd?.value).toBe('16px');
      expect(spacingMd?.category).toBe(TokenCategory.SPACING);
    });

    it('should parse Design Tokens specification format', async () => {
      const designTokens = JSON.stringify({
        'color-primary': {
          $value: '#007bff',
          $type: 'color',
          $description: 'Primary brand color',
        },
        'spacing-base': {
          $value: '16px',
          $type: 'dimension',
          $description: 'Base spacing unit',
        },
      });

      const result = await parser.parse(designTokens, TokenFormat.JSON);

      expect(result.tokens).toHaveLength(2);

      const primary = result.tokens.find(t => t.name === 'color-primary');
      expect(primary?.value).toBe('#007bff');
      expect(primary?.type).toBe('color');
      expect(primary?.description).toBe('Primary brand color');
    });

    it('should parse composite token values', async () => {
      const json = JSON.stringify({
        shadow: {
          card: {
            offsetX: '0px',
            offsetY: '2px',
            blur: '4px',
            spread: '0px',
            color: '#000000',
          },
        },
        border: {
          default: {
            width: '1px',
            style: 'solid',
            color: '#e2e8f0',
          },
        },
        typography: {
          heading: {
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: '32px',
          },
        },
      });

      const result = await parser.parse(json, TokenFormat.JSON);

      const shadow = result.tokens.find(t => t.name === 'shadow.card');
      expect(shadow?.type).toBe(TokenType.SHADOW);
      expect(shadow?.category).toBe(TokenCategory.SHADOW);

      const border = result.tokens.find(t => t.name === 'border.default');
      expect(border?.type).toBe(TokenType.BORDER);

      const typography = result.tokens.find(t => t.name === 'typography.heading');
      expect(typography?.type).toBe(TokenType.TYPOGRAPHY);
    });

    it('should handle token references', async () => {
      const json = JSON.stringify({
        color: {
          primary: '#007bff',
          brand: { $ref: 'color.primary' },
        },
        spacing: {
          base: '16px',
          medium: { $ref: 'spacing.base' },
        },
      });

      const result = await parser.parse(json, TokenFormat.JSON);

      const brand = result.tokens.find(t => t.name === 'color.brand');
      expect(brand?.type).toBe(TokenType.REFERENCE);
      expect((brand?.value as any)?.$ref).toBe('color.primary');

      const medium = result.tokens.find(t => t.name === 'spacing.medium');
      expect(medium?.type).toBe(TokenType.REFERENCE);
      expect((medium?.value as any)?.$ref).toBe('spacing.base');
    });
  });

  describe('TailwindConfigParser', () => {
    const parser = new TailwindConfigParser();

    it('should support Tailwind config format', () => {
      expect(parser.supportsFormat(TokenFormat.TAILWIND_CONFIG)).toBe(true);
      expect(parser.supportsFormat(TokenFormat.JSON)).toBe(false);
    });

    it('should parse basic Tailwind config', async () => {
      const config = `
        module.exports = {
          theme: {
            colors: {
              primary: '#007bff',
              secondary: '#6c757d',
              gray: {
                100: '#f8f9fa',
                200: '#e9ecef',
                500: '#6c757d',
                900: '#212529',
              }
            },
            spacing: {
              '1': '0.25rem',
              '2': '0.5rem',
              '4': '1rem',
              '8': '2rem',
            }
          }
        };
      `;

      const result = await parser.parse(config, TokenFormat.TAILWIND_CONFIG);

      expect(result.tokens.length).toBeGreaterThan(5);

      const primary = result.tokens.find(t => t.name === 'colors.primary');
      expect(primary?.value).toBe('#007bff');
      expect(primary?.type).toBe(TokenType.COLOR);
      expect(primary?.category).toBe(TokenCategory.COLOR);

      const gray500 = result.tokens.find(t => t.name === 'colors.gray.500');
      expect(gray500?.value).toBe('#6c757d');
      expect(gray500?.type).toBe(TokenType.COLOR);

      const spacing4 = result.tokens.find(t => t.name === 'spacing.4');
      expect(spacing4?.value).toBe('1rem');
      expect(spacing4?.type).toBe(TokenType.DIMENSION);
      expect(spacing4?.category).toBe(TokenCategory.SPACING);
    });

    it('should parse Tailwind font configuration', async () => {
      const config = `
        module.exports = {
          theme: {
            fontFamily: {
              sans: ['Inter', 'system-ui', 'sans-serif'],
              mono: ['Fira Code', 'monospace'],
            },
            fontSize: {
              sm: ['14px', '20px'],
              base: ['16px', { lineHeight: '24px' }],
              lg: ['18px', '28px'],
              xl: '20px',
            },
            fontWeight: {
              normal: 400,
              medium: 500,
              bold: 700,
            }
          }
        };
      `;

      const result = await parser.parse(config, TokenFormat.TAILWIND_CONFIG);

      const fontSans = result.tokens.find(t => t.name === 'fontFamily.sans');
      expect(fontSans?.type).toBe(TokenType.FONT_FAMILY);
      expect(fontSans?.category).toBe(TokenCategory.TYPOGRAPHY);
      expect((fontSans?.value as any)?.$array).toEqual(['Inter', 'system-ui', 'sans-serif']);

      const fontSizeBase = result.tokens.find(t => t.name === 'fontSize.base');
      expect(fontSizeBase?.type).toBe(TokenType.TYPOGRAPHY);
      expect((fontSizeBase?.value as any)?.fontSize).toBe('16px');
      expect((fontSizeBase?.value as any)?.lineHeight).toBe('24px');

      const fontSizeXl = result.tokens.find(t => t.name === 'fontSize.xl');
      expect(fontSizeXl?.type).toBe(TokenType.DIMENSION);
      expect(fontSizeXl?.value).toBe('20px');

      const fontBold = result.tokens.find(t => t.name === 'fontWeight.bold');
      expect(fontBold?.type).toBe(TokenType.FONT_WEIGHT);
      expect(fontBold?.value).toBe(700);
    });

    it('should parse Tailwind shadows and borders', async () => {
      const config = `
        module.exports = {
          theme: {
            borderRadius: {
              none: '0',
              sm: '0.125rem',
              md: '0.375rem',
              lg: '0.5rem',
            },
            boxShadow: {
              sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }
          }
        };
      `;

      const result = await parser.parse(config, TokenFormat.TAILWIND_CONFIG);

      const borderRadius = result.tokens.find(t => t.name === 'borderRadius.md');
      expect(borderRadius?.value).toBe('0.375rem');
      expect(borderRadius?.type).toBe(TokenType.DIMENSION);
      expect(borderRadius?.category).toBe(TokenCategory.BORDER);

      const shadow = result.tokens.find(t => t.name === 'boxShadow.md');
      expect(shadow?.value).toBe('0 4px 6px -1px rgba(0, 0, 0, 0.1)');
      expect(shadow?.type).toBe(TokenType.SHADOW);
      expect(shadow?.category).toBe(TokenCategory.SHADOW);
    });
  });

  describe('TokenParserRegistry', () => {
    const registry = new TokenParserRegistry();

    it('should have default parsers registered', () => {
      const formats = registry.getSupportedFormats();
      
      expect(formats).toContain(TokenFormat.CSS_VARIABLE);
      expect(formats).toContain(TokenFormat.CSS_CUSTOM_PROPERTY);
      expect(formats).toContain(TokenFormat.JS_OBJECT);
      expect(formats).toContain(TokenFormat.JS_MODULE);
      expect(formats).toContain(TokenFormat.JSON);
      expect(formats).toContain(TokenFormat.TAILWIND_CONFIG);
    });

    it('should get appropriate parser for format', () => {
      const cssParser = registry.getParser(TokenFormat.CSS_VARIABLE);
      expect(cssParser).toBeInstanceOf(CSSVariableParser);

      const jsParser = registry.getParser(TokenFormat.JSON);
      expect(jsParser).toBeInstanceOf(JSObjectParser);

      const tailwindParser = registry.getParser(TokenFormat.TAILWIND_CONFIG);
      expect(tailwindParser).toBeInstanceOf(TailwindConfigParser);
    });

    it('should return undefined for unsupported format', () => {
      const parser = registry.getParser(TokenFormat.FIGMA_TOKENS);
      expect(parser).toBeUndefined();
    });

    it('should parse using registry', async () => {
      const json = JSON.stringify({
        'color.primary': '#007bff',
        'spacing.md': '16px',
      });

      const result = await registry.parse(json, TokenFormat.JSON);

      expect(result.tokens).toHaveLength(2);
      expect(result.metadata.tokenCount).toBe(2);
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        registry.parse('content', TokenFormat.FIGMA_TOKENS)
      ).rejects.toThrow('No parser available for format: figma-tokens');
    });

    it('should allow custom parser registration', () => {
      const customParser = new CSSVariableParser();
      registry.register(TokenFormat.FIGMA_TOKENS, customParser);

      const parser = registry.getParser(TokenFormat.FIGMA_TOKENS);
      expect(parser).toBe(customParser);

      const formats = registry.getSupportedFormats();
      expect(formats).toContain(TokenFormat.FIGMA_TOKENS);
    });
  });

  describe('Token Type Detection', () => {
    const parser = new CSSVariableParser();

    it('should detect color tokens correctly', async () => {
      const css = `
        :root {
          --hex-color: #ff0000;
          --rgb-color: rgb(255, 0, 0);
          --hsl-color: hsl(0, 100%, 50%);
          --oklch-color: oklch(0.5 0.5 0);
        }
      `;

      const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);
      
      result.tokens.forEach(token => {
        expect(token.type).toBe(TokenType.COLOR);
        expect(token.category).toBe(TokenCategory.COLOR);
      });
    });

    it('should detect dimension tokens correctly', async () => {
      const css = `
        :root {
          --width-px: 100px;
          --height-rem: 2rem;
          --margin-em: 1.5em;
          --padding-percent: 50%;
          --size-vh: 100vh;
          --gap-vw: 10vw;
        }
      `;

      const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);
      
      result.tokens.forEach(token => {
        expect(token.type).toBe(TokenType.DIMENSION);
      });
    });

    it('should detect font tokens correctly', async () => {
      const css = `
        :root {
          --font-family-body: "Inter, sans-serif";
          --font-weight-normal: 400;
          --font-weight-bold: 700;
        }
      `;

      const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);
      
      const fontFamily = result.tokens.find(t => t.name === '--font-family-body');
      expect(fontFamily?.type).toBe(TokenType.FONT_FAMILY);
      expect(fontFamily?.category).toBe(TokenCategory.TYPOGRAPHY);

      const fontWeights = result.tokens.filter(t => t.name.includes('font-weight'));
      fontWeights.forEach(token => {
        expect(token.type).toBe(TokenType.FONT_WEIGHT);
        expect(token.category).toBe(TokenCategory.TYPOGRAPHY);
      });
    });

    it('should detect timing tokens correctly', async () => {
      const css = `
        :root {
          --duration-fast: 0.15s;
          --duration-slow: 500ms;
          --easing: cubic-bezier(0.4, 0.0, 0.2, 1);
        }
      `;

      const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);
      
      const durations = result.tokens.filter(t => t.name.includes('duration'));
      durations.forEach(token => {
        expect(token.type).toBe(TokenType.DURATION);
        expect(token.category).toBe(TokenCategory.TIMING);
      });

      const easing = result.tokens.find(t => t.name === '--easing');
      expect(easing?.type).toBe(TokenType.CUBIC_BEZIER);
      expect(easing?.category).toBe(TokenCategory.TIMING);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed CSS gracefully', async () => {
      const parser = new CSSVariableParser();
      const malformedCSS = `
        :root {
          --valid: blue;
          --malformed: ;
          --incomplete
        }
      `;

      const result = await parser.parse(malformedCSS, TokenFormat.CSS_VARIABLE);
      
      // Should parse valid tokens and skip malformed ones
      expect(result.tokens.length).toBeGreaterThan(0);
      
      const valid = result.tokens.find(t => t.name === '--valid');
      expect(valid?.value).toBe('blue');
    });

    it('should handle malformed JSON gracefully', async () => {
      const parser = new JSObjectParser();
      const malformedJSON = '{ "color": "#ff0000", "spacing": }';

      await expect(
        parser.parse(malformedJSON, TokenFormat.JSON)
      ).rejects.toThrow();
    });

    it('should handle unsupported format gracefully', async () => {
      const parser = new CSSVariableParser();

      await expect(
        parser.parse('content', TokenFormat.JSON)
      ).rejects.toThrow('Unsupported format: json');
    });
  });
});