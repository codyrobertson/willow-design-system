import { CSSModulesParser } from '../src/styles/css-modules/css-modules-parser';
import { CSSModulesTransformer } from '../src/styles/css-modules/css-modules-transformer';
import { StyleType } from '../src/types/style-transformation.types';
import type { StyleTransformationContext, StyleTransformerConfig } from '../src/types/style-transformation.types';

describe('CSS Modules Composition Handling', () => {
  const context: StyleTransformationContext = {
    styleType: StyleType.CSS_MODULES,
    sourceFramework: 'css-modules',
    targetFramework: 'tailwind',
    filePath: 'Component.module.css',
  };

  const parser = new CSSModulesParser();
  const transformer = new CSSModulesTransformer();

  describe('Parser composition handling', () => {
    it('should parse simple composition', () => {
      const input = `
        .base {
          padding: 10px;
          border-radius: 4px;
        }
        
        .primary {
          composes: base;
          background-color: blue;
          color: white;
        }
      `;
      
      const module = parser.parse(input, context);
      
      expect(module.classes.size).toBe(2);
      
      const primaryClass = module.classes.get('primary');
      expect(primaryClass?.isComposed).toBe(true);
      expect(primaryClass?.composesFrom).toContain('base');
      expect(primaryClass?.rules).toHaveLength(2);
      expect(primaryClass?.rules?.[0].property).toBe('background-color');
    });

    it('should parse multiple composition dependencies', () => {
      const input = `
        .base {
          padding: 10px;
        }
        
        .themed {
          color: blue;
        }
        
        .button {
          composes: base themed;
          border: none;
        }
      `;
      
      const module = parser.parse(input, context);
      
      const buttonClass = module.classes.get('button');
      expect(buttonClass?.isComposed).toBe(true);
      expect(buttonClass?.composesFrom).toContain('base');
      expect(buttonClass?.composesFrom).toContain('themed');
      expect(buttonClass?.composesFrom).toHaveLength(2);
    });

    it('should parse composition from external modules', () => {
      const input = `
        @import "./base.module.css";
        
        .button {
          composes: baseButton from "./base.module.css";
          background: red;
        }
      `;
      
      const module = parser.parse(input, context);
      
      expect(module.imports).toHaveLength(1);
      expect(module.imports?.[0].from).toBe('./base.module.css');
      
      const buttonClass = module.classes.get('button');
      expect(buttonClass?.isComposed).toBe(true);
      expect(buttonClass?.composesFrom).toContain('baseButton');
    });

    it('should detect composition warnings', () => {
      const input = `
        .button {
          composes: nonexistent;
          color: blue;
        }
        
        .primary {
          composes: button;
          background: red;
        }
      `;
      
      const result = parser.parseWithResult(input, context);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0]).toContain('nonexistent');
    });
  });

  describe('Transformer composition handling', () => {
    it('should transform composition with class mappings', async () => {
      const config: StyleTransformerConfig = {
        classMappings: [
          { sourceClass: 'base', targetClass: 'base-style' },
          { sourceClass: 'button', targetClass: 'btn' },
        ],
      };
      
      const input = `
        .base {
          padding: 10px;
        }
        
        .button {
          composes: base;
          color: blue;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.base-style');
      expect(result.transformed).toContain('.btn');
      expect(result.transformed).toContain('composes: base-style');
    });

    it('should preserve composition order', async () => {
      const input = `
        .base {
          padding: 10px;
        }
        
        .themed {
          color: blue;
        }
        
        .button {
          composes: base themed;
          border: none;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('composes: base themed');
    });

    it('should handle nested composition', async () => {
      const input = `
        .base {
          padding: 8px;
        }
        
        .interactive {
          composes: base;
          cursor: pointer;
        }
        
        .button {
          composes: interactive;
          border: 1px solid;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.interactive');
      expect(result.transformed).toContain('composes: base');
      expect(result.transformed).toContain('.button');
      expect(result.transformed).toContain('composes: interactive');
    });

    it('should apply property mappings to composed classes', async () => {
      const config: StyleTransformerConfig = {
        propertyMappings: [
          { source: 'background-color', target: 'bg' },
          { source: 'color', target: 'text-color' },
        ],
      };
      
      const input = `
        .base {
          background-color: white;
          padding: 10px;
        }
        
        .button {
          composes: base;
          color: blue;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('bg: white');
      expect(result.transformed).toContain('text-color: blue');
    });

    it('should handle composition with token mappings', async () => {
      const config: StyleTransformerConfig = {
        tokenMappings: [
          {
            sourceToken: 'primary-color',
            targetToken: 'blue-600',
            category: 'color',
          },
        ],
      };
      
      const input = `
        .base {
          color: var(--primary-color);
        }
        
        .button {
          composes: base;
          padding: 10px;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('color: blue-600');
      expect(result.transformed).toContain('composes: base');
    });
  });

  describe('Complex composition scenarios', () => {
    it('should handle circular composition detection', () => {
      const input = `
        .a {
          composes: b;
          color: red;
        }
        
        .b {
          composes: c;
          margin: 10px;
        }
        
        .c {
          composes: a;
          padding: 5px;
        }
      `;
      
      const result = parser.parseWithResult(input, context);
      
      // Should detect potential circular dependencies
      expect(result.warnings).toBeDefined();
    });

    it('should serialize composition correctly', () => {
      const input = `
        .base {
          padding: 10px;
        }
        
        .button {
          composes: base;
          background: blue;
        }
      `;
      
      const module = parser.parse(input, context);
      const serialized = parser.serialize(module, context);
      
      expect(serialized).toContain('.button {');
      expect(serialized).toContain('composes: base;');
      expect(serialized).toContain('background: blue;');
    });

    it('should handle composition with scoped names', async () => {
      const options = {
        generateScopedName: (name: string, filename: string) => `${name}_${filename.replace(/\./g, '_')}`,
      };
      
      const scopedTransformer = new CSSModulesTransformer(options);
      
      const input = `
        .base {
          padding: 10px;
        }
        
        .button {
          composes: base;
          color: blue;
        }
      `;
      
      const result = await scopedTransformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('composes: base');
    });

    it('should count composition transformations correctly', async () => {
      const config: StyleTransformerConfig = {
        classMappings: [
          { sourceClass: 'base', targetClass: 'foundation' },
        ],
      };
      
      const input = `
        .base {
          padding: 10px;
        }
        
        .button {
          composes: base;
          color: blue;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.metadata?.transformationsApplied).toBeGreaterThan(0);
    });
  });
});