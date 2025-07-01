import { CSSModulesParser } from '../src/styles/css-modules/css-modules-parser';
import { CSSModulesTransformer } from '../src/styles/css-modules/css-modules-transformer';
import { StyleType } from '../src/types/style-transformation.types';
import type { StyleTransformationContext } from '../src/types/style-transformation.types';

describe('CSS Modules Validation', () => {
  const context: StyleTransformationContext = {
    styleType: StyleType.CSS_MODULES,
    sourceFramework: 'css-modules',
    targetFramework: 'willow',
    filePath: 'Component.module.css',
  };

  const parser = new CSSModulesParser();
  const transformer = new CSSModulesTransformer();

  describe('Import validation', () => {
    it('should detect valid imports', () => {
      const input = `
        @import "./base.module.css";
        @import "../shared/theme.module.css";
        
        .button {
          color: blue;
        }
      `;
      
      const result = parser.parseWithResult(input, context);
      
      expect(result.module.imports).toHaveLength(2);
      expect(result.dependencies).toContain('./base.module.css');
      expect(result.dependencies).toContain('../shared/theme.module.css');
    });

    it('should warn about undefined composition references', () => {
      const input = `
        .button {
          composes: nonexistent;
          color: blue;
        }
        
        .card {
          composes: missing-class;
          padding: 10px;
        }
      `;
      
      const result = parser.parseWithResult(input, context);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings?.[0]).toContain('nonexistent');
      expect(result.warnings?.[1]).toContain('missing-class');
    });

    it('should not warn about valid local composition', () => {
      const input = `
        .base {
          padding: 10px;
        }
        
        .button {
          composes: base;
          color: blue;
        }
      `;
      
      const result = parser.parseWithResult(input, context);
      
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('Class name validation', () => {
    it('should handle valid CSS class names', () => {
      const input = `
        .valid-class {
          color: blue;
        }
        
        .another_valid_class {
          margin: 10px;
        }
        
        .class123 {
          padding: 5px;
        }
      `;
      
      const module = parser.parse(input, context);
      
      expect(module.classes.size).toBe(3);
      expect(module.classes.has('valid-class')).toBe(true);
      expect(module.classes.has('another_valid_class')).toBe(true);
      expect(module.classes.has('class123')).toBe(true);
    });

    it('should handle edge case class names', () => {
      const input = `
        .\\-webkit-transform {
          transform: rotate(45deg);
        }
        
        .\\@media {
          color: red;
        }
      `;
      
      // Should not throw, parser should handle gracefully
      expect(() => parser.parse(input, context)).not.toThrow();
    });
  });

  describe('CSS variable validation', () => {
    it('should parse valid CSS variables', () => {
      const input = `
        :root {
          --primary-color: #007bff;
          --spacing-unit: 8px;
          --font-family: "Helvetica Neue", sans-serif;
        }
        
        .button {
          color: var(--primary-color);
          padding: var(--spacing-unit);
          font-family: var(--font-family);
        }
      `;
      
      const module = parser.parse(input, context);
      
      expect(module.variables?.size).toBe(3);
      expect(module.variables?.get('--primary-color')).toBe('#007bff');
      expect(module.variables?.get('--spacing-unit')).toBe('8px');
    });

    it('should handle malformed variable definitions gracefully', () => {
      const input = `
        :root {
          --valid-var: blue;
          --: invalid;
          var(--nested): not-valid;
        }
      `;
      
      // Should not throw
      expect(() => parser.parse(input, context)).not.toThrow();
    });
  });

  describe('Transformation validation', () => {
    it('should validate successful transformations', async () => {
      const input = `
        .button {
          color: blue;
          padding: 10px;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.transformed).toBeTruthy();
    });

    it('should handle transformation errors gracefully', async () => {
      // Test with invalid input that might cause transformation issues
      const invalidInput = null as any;
      
      const result = await transformer.transform(invalidInput, context, {});
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate metadata generation', async () => {
      const input = `
        .button {
          color: blue;
        }
        
        .card {
          padding: 10px;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.transformationsApplied).toBeDefined();
      expect(result.metadata?.processingTime).toBeDefined();
      expect(result.metadata?.styleType).toBe(StyleType.CSS_MODULES);
    });
  });

  describe('TypeScript definition validation', () => {
    it('should generate valid TypeScript definitions', async () => {
      const options = {
        generateTypeDefinitions: true,
        exportType: 'named' as const,
      };
      
      const typedTransformer = new CSSModulesTransformer(options);
      
      const input = `
        .button {
          color: blue;
        }
        
        .primary-button {
          background: red;
        }
        
        .icon-large {
          width: 24px;
        }
      `;
      
      const result = await typedTransformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.metadata?.typeDefinitions).toBeDefined();
      expect(result.metadata?.typeDefinitions).toContain('export const button: string;');
      expect(result.metadata?.typeDefinitions).toContain('export const primary_button: string;');
      expect(result.metadata?.typeDefinitions).toContain('export const icon_large: string;');
    });

    it('should handle invalid identifiers in TypeScript generation', async () => {
      const options = {
        generateTypeDefinitions: true,
        exportType: 'named' as const,
      };
      
      const typedTransformer = new CSSModulesTransformer(options);
      
      const input = `
        .123invalid {
          color: blue;
        }
        
        .with-special@chars {
          margin: 10px;
        }
      `;
      
      const result = await typedTransformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.metadata?.typeDefinitions).toBeDefined();
      // Should convert invalid identifiers to valid ones
      expect(result.metadata?.typeDefinitions).toContain('export const _123invalid: string;');
      expect(result.metadata?.typeDefinitions).toContain('export const with_special_chars: string;');
    });
  });

  describe('Performance validation', () => {
    it('should handle large CSS modules efficiently', async () => {
      // Generate a large CSS module
      const classCount = 100;
      const classDefinitions = Array.from({ length: classCount }, (_, i) => `
        .class-${i} {
          color: rgb(${i * 2}, ${i * 3}, ${i * 4});
          margin: ${i}px;
          padding: ${i * 2}px;
        }
      `).join('\n');
      
      const input = `:root { --large-module: true; }\n${classDefinitions}`;
      
      const startTime = performance.now();
      const result = await transformer.transform(input, context, {});
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.metadata?.transformationsApplied).toBeDefined();
    });

    it('should handle deeply nested composition', async () => {
      // Create a chain of composition dependencies
      const depth = 10;
      let input = '.base { color: blue; }\n';
      
      for (let i = 1; i <= depth; i++) {
        input += `.level-${i} { composes: ${i === 1 ? 'base' : `level-${i-1}`}; margin: ${i}px; }\n`;
      }
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.base');
      expect(result.transformed).toContain(`.level-${depth}`);
    });
  });

  describe('Error recovery', () => {
    it('should recover from malformed CSS', () => {
      const input = `
        .valid {
          color: blue;
        }
        
        .malformed {
          color: blue
          // missing semicolon
          margin: 10px;
        }
        
        .another-valid {
          padding: 5px;
        }
      `;
      
      // Should not throw and should parse what it can
      expect(() => parser.parse(input, context)).not.toThrow();
    });

    it('should handle empty or whitespace-only input', async () => {
      const inputs = ['', '   ', '\n\n\n', '\t\t\t'];
      
      for (const input of inputs) {
        const result = await transformer.transform(input, context, {});
        expect(result.success).toBe(true);
        expect(result.transformed).toBeDefined();
      }
    });

    it('should handle invalid composition gracefully', () => {
      const input = `
        .button {
          composes: ;
          color: blue;
        }
        
        .card {
          composes: from;
          padding: 10px;
        }
      `;
      
      // Should not throw
      expect(() => parser.parse(input, context)).not.toThrow();
    });
  });
});