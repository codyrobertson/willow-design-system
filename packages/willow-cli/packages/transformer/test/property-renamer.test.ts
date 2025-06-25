import {
  BasePropertyRenamer,
  PropertyRenamerFactory,
  PropertyRenamerRegistry,
  NamingConvention,
  type PropertyRenamingConfig,
  type PropertyContext,
  type FrameworkPropertyRules,
} from '../src/styles/property-renaming/property-renamer';

describe('Property Renamer', () => {
  describe('BasePropertyRenamer', () => {
    describe('Naming Convention Conversion', () => {
      it('should convert kebab-case to camelCase', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
        });

        expect(renamer.renameProperty('background-color')).toBe('backgroundColor');
        expect(renamer.renameProperty('border-top-width')).toBe('borderTopWidth');
        expect(renamer.renameProperty('margin')).toBe('margin');
      });

      it('should convert camelCase to kebab-case', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.CAMEL_CASE,
          targetConvention: NamingConvention.KEBAB_CASE,
        });

        expect(renamer.renameProperty('backgroundColor')).toBe('background-color');
        expect(renamer.renameProperty('borderTopWidth')).toBe('border-top-width');
        expect(renamer.renameProperty('margin')).toBe('margin');
      });

      it('should convert to PascalCase', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.PASCAL_CASE,
        });

        expect(renamer.renameProperty('background-color')).toBe('BackgroundColor');
        expect(renamer.renameProperty('z-index')).toBe('ZIndex');
      });

      it('should convert to snake_case', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.CAMEL_CASE,
          targetConvention: NamingConvention.SNAKE_CASE,
        });

        expect(renamer.renameProperty('backgroundColor')).toBe('background_color');
        expect(renamer.renameProperty('fontSize')).toBe('font_size');
      });

      it('should convert to CONSTANT_CASE', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CONSTANT_CASE,
        });

        expect(renamer.renameProperty('background-color')).toBe('BACKGROUND_COLOR');
        expect(renamer.renameProperty('font-size')).toBe('FONT_SIZE');
      });
    });

    describe('Custom Mappings', () => {
      it('should apply custom property mappings', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          customMappings: {
            'float': 'cssFloat',
            'class': 'className',
            'flex-grow': 'flexGrow',
          },
        });

        expect(renamer.renameProperty('float')).toBe('cssFloat');
        expect(renamer.renameProperty('class')).toBe('className');
        expect(renamer.renameProperty('flex-grow')).toBe('flexGrow');
      });

      it('should prioritize custom mappings over convention conversion', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          customMappings: {
            'background-color': 'bgColor', // Custom mapping
          },
        });

        expect(renamer.renameProperty('background-color')).toBe('bgColor');
      });
    });

    describe('Vendor Prefixes', () => {
      it('should preserve vendor prefixes by default', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
        });

        expect(renamer.renameProperty('-webkit-transform')).toBe('-webkit-transform');
        expect(renamer.renameProperty('-moz-box-shadow')).toBe('-moz-boxShadow');
        expect(renamer.renameProperty('-ms-flex')).toBe('-ms-flex');
      });

      it('should remove vendor prefixes when configured', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          preserveVendorPrefixes: false,
        });

        expect(renamer.renameProperty('-webkit-transform')).toBe('transform');
        expect(renamer.renameProperty('-moz-box-shadow')).toBe('boxShadow');
      });
    });

    describe('Excluded Properties', () => {
      it('should not rename excluded properties', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          excludeProperties: ['data-testid', 'aria-label'],
        });

        expect(renamer.renameProperty('data-testid')).toBe('data-testid');
        expect(renamer.renameProperty('aria-label')).toBe('aria-label');
        expect(renamer.renameProperty('background-color')).toBe('backgroundColor');
      });
    });

    describe('Framework Rules', () => {
      it('should apply framework-specific aliases', () => {
        const frameworkRules: FrameworkPropertyRules = {
          framework: 'react',
          aliases: {
            'class': 'className',
            'for': 'htmlFor',
            'tabindex': 'tabIndex',
          },
        };

        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          frameworkRules,
        });

        expect(renamer.renameProperty('class')).toBe('className');
        expect(renamer.renameProperty('for')).toBe('htmlFor');
        expect(renamer.renameProperty('tabindex')).toBe('tabIndex');
      });

      it('should apply required transformations', () => {
        const frameworkRules: FrameworkPropertyRules = {
          framework: 'custom',
          required: [
            {
              from: /^grid-(.+)$/,
              to: (match: string) => match.replace('grid-', 'g-'),
            },
            {
              from: 'float',
              to: 'cssFloat',
            },
          ],
        };

        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          frameworkRules,
        });

        expect(renamer.renameProperty('grid-template')).toBe('g-template');
        expect(renamer.renameProperty('grid-area')).toBe('g-area');
        expect(renamer.renameProperty('float')).toBe('cssFloat');
      });

      it('should apply conditional transformations', () => {
        const frameworkRules: FrameworkPropertyRules = {
          framework: 'custom',
          conditional: [
            {
              from: 'display',
              to: 'd',
              condition: (ctx: PropertyContext) => ctx.value === 'flex',
            },
            {
              from: 'justify-content',
              to: 'jc',
              condition: (ctx: PropertyContext) => ctx.parent === 'flex-container',
            },
          ],
        };

        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.KEBAB_CASE,
          frameworkRules,
        });

        // With matching condition
        expect(renamer.renameProperty('display', { 
          property: 'display', 
          value: 'flex' 
        })).toBe('d');

        // Without matching condition
        expect(renamer.renameProperty('display', { 
          property: 'display', 
          value: 'block' 
        })).toBe('display');
      });
    });

    describe('Property Renaming in Objects', () => {
      it('should rename properties in style objects', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
        });

        const styles = {
          'background-color': '#fff',
          'border-radius': '4px',
          'font-size': '16px',
          margin: '10px',
        };

        const result = renamer.renameProperties(styles);

        expect(result.changes).toHaveLength(3);
        expect(JSON.parse(result.renamed)).toEqual({
          backgroundColor: '#fff',
          borderRadius: '4px',
          fontSize: '16px',
          margin: '10px',
        });
      });

      it('should handle nested style objects', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
        });

        const styles = {
          'background-color': '#fff',
          '&:hover': {
            'background-color': '#f0f0f0',
            'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
          },
        };

        const result = renamer.renameProperties(styles);
        const renamed = JSON.parse(result.renamed);

        expect(renamed.backgroundColor).toBe('#fff');
        expect(renamed['&:hover']).toEqual({
          backgroundColor: '#f0f0f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        });
      });
    });

    describe('Shorthand Expansion', () => {
      it('should expand shorthand properties when configured', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          expandShorthands: true,
        });

        const styles = {
          margin: '10px 20px',
          padding: '5px',
        };

        const result = renamer.renameProperties(styles);
        const renamed = JSON.parse(result.renamed);

        expect(renamed).toEqual({
          marginTop: '10px',
          marginRight: '20px',
          marginBottom: '10px',
          marginLeft: '20px',
          paddingTop: '5px',
          paddingRight: '5px',
          paddingBottom: '5px',
          paddingLeft: '5px',
        });
      });

      it('should handle all margin/padding formats', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          expandShorthands: true,
        });

        // Test 1 value
        let result = renamer.renameProperties({ margin: '10px' });
        let renamed = JSON.parse(result.renamed);
        expect(renamed.marginTop).toBe('10px');
        expect(renamed.marginRight).toBe('10px');
        expect(renamed.marginBottom).toBe('10px');
        expect(renamed.marginLeft).toBe('10px');

        // Test 2 values
        result = renamer.renameProperties({ margin: '10px 20px' });
        renamed = JSON.parse(result.renamed);
        expect(renamed.marginTop).toBe('10px');
        expect(renamed.marginRight).toBe('20px');
        expect(renamed.marginBottom).toBe('10px');
        expect(renamed.marginLeft).toBe('20px');

        // Test 3 values
        result = renamer.renameProperties({ margin: '10px 20px 30px' });
        renamed = JSON.parse(result.renamed);
        expect(renamed.marginTop).toBe('10px');
        expect(renamed.marginRight).toBe('20px');
        expect(renamed.marginBottom).toBe('30px');
        expect(renamed.marginLeft).toBe('20px');

        // Test 4 values
        result = renamer.renameProperties({ margin: '10px 20px 30px 40px' });
        renamed = JSON.parse(result.renamed);
        expect(renamed.marginTop).toBe('10px');
        expect(renamed.marginRight).toBe('20px');
        expect(renamed.marginBottom).toBe('30px');
        expect(renamed.marginLeft).toBe('40px');
      });
    });

    describe('CSS Property Renaming', () => {
      it('should rename properties in CSS text', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
        });

        const css = `
          .button {
            background-color: #007bff;
            border-radius: 4px;
            font-size: 16px;
          }
        `;

        const result = renamer.renameCssProperties(css);

        expect(result.changes).toHaveLength(3);
        expect(result.renamed).toContain('backgroundColor: #007bff');
        expect(result.renamed).toContain('borderRadius: 4px');
        expect(result.renamed).toContain('fontSize: 16px');
      });

      it('should track line and column locations', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
        });

        const css = `.button { background-color: #fff; }`;
        const result = renamer.renameCssProperties(css);

        expect(result.changes[0].location).toBeDefined();
        expect(result.changes[0].location!.line).toBe(1);
        expect(result.changes[0].location!.column).toBeGreaterThan(0);
      });
    });

    describe('Property Validation', () => {
      it('should validate known CSS properties', () => {
        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
        });

        expect(renamer.isValidProperty('display')).toBe(true);
        expect(renamer.isValidProperty('background-color')).toBe(true);
        expect(renamer.isValidProperty('--custom-property')).toBe(true);
        expect(renamer.isValidProperty('invalid-property-name')).toBe(false);
      });
    });

    describe('Warnings and Deprecations', () => {
      it('should warn about deprecated properties', () => {
        const frameworkRules: FrameworkPropertyRules = {
          framework: 'custom',
          deprecated: {
            'box-lines': 'Use flexbox properties instead',
            'box-orient': 'Use flex-direction instead',
          },
        };

        const renamer = new BasePropertyRenamer({
          sourceConvention: NamingConvention.KEBAB_CASE,
          targetConvention: NamingConvention.CAMEL_CASE,
          frameworkRules,
        });

        const styles = {
          'box-lines': 'multiple',
          'display': 'flex',
        };

        const result = renamer.renameProperties(styles);

        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('deprecated');
        expect(result.warnings[0]).toContain('flexbox properties');
      });
    });
  });

  describe('PropertyRenamerFactory', () => {
    it('should create renamer with specified conventions', () => {
      const renamer = PropertyRenamerFactory.createRenamer(
        NamingConvention.KEBAB_CASE,
        NamingConvention.CAMEL_CASE
      );

      expect(renamer.renameProperty('background-color')).toBe('backgroundColor');
    });

    it('should create framework-specific renamers', () => {
      const reactRenamer = PropertyRenamerFactory.createForFramework('react');
      expect(reactRenamer.renameProperty('class')).toBe('className');
      expect(reactRenamer.renameProperty('for')).toBe('htmlFor');

      const vueRenamer = PropertyRenamerFactory.createForFramework('vue');
      expect(vueRenamer.renameProperty('v-bind:class')).toBe(':class');
    });

    it('should merge options with framework defaults', () => {
      const renamer = PropertyRenamerFactory.createForFramework('react', {
        customMappings: {
          'custom-prop': 'customProp',
        },
      });

      expect(renamer.renameProperty('class')).toBe('className');
      expect(renamer.renameProperty('custom-prop')).toBe('customProp');
    });
  });

  describe('PropertyRenamerRegistry', () => {
    let registry: PropertyRenamerRegistry;

    beforeEach(() => {
      registry = new PropertyRenamerRegistry();
    });

    it('should have default renamers registered', () => {
      const available = registry.getAvailableRenamers();
      
      expect(available).toContain('kebab-to-camel');
      expect(available).toContain('camel-to-kebab');
      expect(available).toContain('react');
      expect(available).toContain('vue');
      expect(available).toContain('styled-components');
      expect(available).toContain('emotion');
    });

    it('should retrieve and use registered renamers', () => {
      const property = registry.renameProperty('background-color', 'kebab-to-camel');
      expect(property).toBe('backgroundColor');

      const reverseProperty = registry.renameProperty('backgroundColor', 'camel-to-kebab');
      expect(reverseProperty).toBe('background-color');
    });

    it('should allow custom renamer registration', () => {
      const customRenamer = new BasePropertyRenamer({
        sourceConvention: NamingConvention.KEBAB_CASE,
        targetConvention: NamingConvention.SNAKE_CASE,
      });

      registry.register('kebab-to-snake', customRenamer);
      
      const property = registry.renameProperty('background-color', 'kebab-to-snake');
      expect(property).toBe('background_color');
    });

    it('should throw error for unknown renamer', () => {
      expect(() => {
        registry.getRenamer('non-existent');
      }).toThrow('No property renamer registered for: non-existent');
    });

    it('should rename properties in objects using registry', () => {
      const styles = {
        'background-color': '#fff',
        'font-size': '16px',
      };

      const result = registry.renameProperties(styles, 'react');
      const renamed = JSON.parse(result.renamed);

      expect(renamed.backgroundColor).toBe('#fff');
      expect(renamed.fontSize).toBe('16px');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex React component styles', () => {
      const renamer = PropertyRenamerFactory.createForFramework('react');
      
      const styles = {
        'background-color': '#fff',
        'border-radius': '8px',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        'class': 'button-primary',
        'data-testid': 'submit-button',
        '&:hover': {
          'background-color': '#f0f0f0',
          'transform': 'translateY(-2px)',
        },
        '@media (max-width: 768px)': {
          'font-size': '14px',
          'padding': '8px 16px',
        },
      };

      const result = renamer.renameProperties(styles);
      const renamed = JSON.parse(result.renamed);

      expect(renamed.backgroundColor).toBe('#fff');
      expect(renamed.borderRadius).toBe('8px');
      expect(renamed.className).toBe('button-primary');
      expect(renamed['data-testid']).toBe('submit-button');
      expect(renamed['&:hover'].backgroundColor).toBe('#f0f0f0');
      expect(renamed['@media (max-width: 768px)'].fontSize).toBe('14px');
    });

    it('should handle styled-components with shorthand expansion', () => {
      const renamer = PropertyRenamerFactory.createForFramework('styled-components');
      
      const styles = {
        'margin': '10px 20px',
        'padding': '15px',
        'border': '1px solid #ccc',
        'transition': 'all 0.3s ease',
      };

      const result = renamer.renameProperties(styles);
      const renamed = JSON.parse(result.renamed);

      // Shorthands should be expanded
      expect(renamed.marginTop).toBe('10px');
      expect(renamed.marginRight).toBe('20px');
      expect(renamed.paddingTop).toBe('15px');
      
      // Complex shorthands might not be expanded
      expect(renamed.border || renamed.borderWidth).toBeDefined();
    });
  });
});