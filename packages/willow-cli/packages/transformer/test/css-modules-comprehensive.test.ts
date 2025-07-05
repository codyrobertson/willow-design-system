import { CSSModulesParser } from '../src/styles/css-modules/css-modules-parser';
import { CSSModulesTransformer } from '../src/styles/css-modules/css-modules-transformer';
import { cssModulesToBootstrapMappings, cssModulesToTailwindMappings } from '../src/styles/css-modules/css-modules-mappings';
import { StyleType } from '../src/types/style-transformation.types';
import type { StyleTransformationContext, StyleTransformerConfig } from '../src/types/style-transformation.types';
import type { CSSModulesTransformOptions } from '../src/types/css-modules.types';

describe('CSS Modules Comprehensive Integration Tests', () => {
  const context: StyleTransformationContext = {
    styleType: StyleType.CSS_MODULES,
    sourceFramework: 'css-modules',
    targetFramework: 'willow',
    filePath: 'ComplexComponent.module.css',
  };

  describe('Real-world CSS module scenarios', () => {
    it('should handle a complete component CSS module', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: cssModulesToBootstrapMappings.slice(0, 20),
        propertyMappings: [
          { source: 'background-color', target: 'bg' },
          { source: 'color', target: 'text-color' },
        ],
        tokenMappings: [
          { sourceToken: 'primary-color', targetToken: 'blue-600', category: 'color' },
          { sourceToken: 'spacing-md', targetToken: '16px', category: 'spacing' },
        ],
      };
      
      const input = `
        @import "./base.module.css";
        @import "../theme/colors.module.css";
        
        :root {
          --component-padding: var(--spacing-md);
          --component-color: var(--primary-color);
          --border-radius: 4px;
        }
        
        .container {
          composes: flex-center from "./base.module.css";
          background-color: var(--component-color);
          padding: var(--component-padding);
          border-radius: var(--border-radius);
        }
        
        .header {
          composes: container;
          flex-direction: column;
          margin-bottom: 20px;
        }
        
        .title {
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }
        
        .content {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
        }
        
        .button {
          composes: interactive from "./base.module.css";
          background-color: transparent;
          border: 2px solid var(--component-color);
          color: var(--component-color);
          padding: 8px 16px;
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .button:hover {
          background-color: var(--component-color);
          color: white;
        }
        
        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .primary {
          composes: button;
          background-color: var(--component-color);
          color: white;
          border-color: var(--component-color);
        }
        
        .secondary {
          composes: button;
          background-color: transparent;
          color: var(--component-color);
        }
        
        .list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        
        .list-item {
          padding: 12px;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .list-item:last-child {
          border-bottom: none;
        }
        
        .icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          fill: currentColor;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 12px;
          }
          
          .header {
            margin-bottom: 16px;
          }
          
          .title {
            font-size: 1.25rem;
          }
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.d-flex'); // container mapping
      expect(result.transformed).toContain('bg: blue-600'); // token + property mapping
      expect(result.transformed).toContain('padding: 16px'); // token mapping
      expect(result.transformed).toContain('composes: flex-center'); // preserved composition
      expect(result.transformed).toContain('@media (max-width: 768px)'); // preserved media queries
      expect(result.metadata?.transformationsApplied).toBeGreaterThan(0);
    });

    it('should handle complex composition chains', async () => {
      const transformer = new CSSModulesTransformer();
      
      const input = `
        .base {
          display: block;
          position: relative;
        }
        
        .interactive {
          composes: base;
          cursor: pointer;
          user-select: none;
        }
        
        .styled {
          composes: interactive;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 8px;
        }
        
        .button {
          composes: styled;
          background: #007bff;
          color: white;
          font-weight: 500;
        }
        
        .primary {
          composes: button;
          background: #0056b3;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .large {
          composes: primary;
          padding: 12px 24px;
          font-size: 1.1rem;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      
      // Check that all classes are present
      expect(result.transformed).toContain('.base');
      expect(result.transformed).toContain('.interactive');
      expect(result.transformed).toContain('.styled');
      expect(result.transformed).toContain('.button');
      expect(result.transformed).toContain('.primary');
      expect(result.transformed).toContain('.large');
      
      // Check that composition is preserved
      expect(result.transformed).toContain('composes: base');
      expect(result.transformed).toContain('composes: interactive');
      expect(result.transformed).toContain('composes: styled');
      expect(result.transformed).toContain('composes: button');
      expect(result.transformed).toContain('composes: primary');
    });

    it('should handle CSS modules with TypeScript generation', async () => {
      const options: CSSModulesTransformOptions = {
        generateTypeDefinitions: true,
        exportType: 'default',
        namingConvention: 'camelCase',
      };
      
      const transformer = new CSSModulesTransformer(options);
      
      const input = `
        .app-container {
          width: 100%;
          height: 100vh;
        }
        
        .nav-bar {
          height: 60px;
          background: #333;
        }
        
        .main-content {
          flex: 1;
          padding: 20px;
        }
        
        .side-bar {
          width: 250px;
          background: #f5f5f5;
        }
        
        .footer-section {
          height: 80px;
          text-align: center;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.metadata?.typeDefinitions).toBeDefined();
      
      const typeDefs = result.metadata!.typeDefinitions!;
      expect(typeDefs).toContain('interface Styles');
      expect(typeDefs).toContain('appContainer: string');
      expect(typeDefs).toContain('navBar: string');
      expect(typeDefs).toContain('mainContent: string');
      expect(typeDefs).toContain('sideBar: string');
      expect(typeDefs).toContain('footerSection: string');
      expect(typeDefs).toContain('export default styles');
    });
  });

  describe('Framework migration scenarios', () => {
    it('should migrate from CSS modules to Tailwind', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: cssModulesToTailwindMappings,
      };
      
      const input = `
        .card {
          flex: 1;
          m-4: auto;
          text-center: center;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .card-header {
          text-lg: large;
          font-bold: 700;
          margin-bottom: 16px;
          color: #374151;
        }
        
        .card-body {
          color: #6b7280;
          line-height: 1.6;
        }
        
        .button-group {
          flex: row;
          justify-center: center;
          gap: 12px;
          margin-top: 20px;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.flex'); // flex mapping
      expect(result.transformed).toContain('.text-center'); // text-center mapping
      expect(result.transformed).toContain('.flex-row'); // flex-row mapping
      expect(result.transformed).toContain('.justify-center'); // justify-center mapping
    });

    it('should handle variable transformation during migration', async () => {
      const options: CSSModulesTransformOptions = {
        transformVariables: true,
        variableTransformer: (name, value) => ({
          name: name.replace('--old-', '--new-'),
          value: value.replace('px', 'rem'),
        }),
      };
      
      const transformer = new CSSModulesTransformer(options);
      
      const input = `
        :root {
          --old-primary: #007bff;
          --old-spacing: 16px;
          --old-radius: 4px;
        }
        
        .component {
          color: var(--old-primary);
          padding: var(--old-spacing);
          border-radius: var(--old-radius);
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('--new-primary: #007bff');
      expect(result.transformed).toContain('--new-spacing: 16rem');
      expect(result.transformed).toContain('--new-radius: 4rem');
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle very large CSS modules', async () => {
      const transformer = new CSSModulesTransformer();
      
      // Generate a large number of classes
      const classCount = 500;
      let input = ':root { --test: true; }\n';
      
      for (let i = 0; i < classCount; i++) {
        input += `
          .class-${i} {
            color: hsl(${i % 360}, 70%, 50%);
            margin: ${i % 20}px;
            padding: ${(i % 10) * 2}px;
            border-radius: ${i % 5 + 1}px;
          }
        `;
        
        if (i % 50 === 0 && i > 0) {
          input += `
            .composed-${i} {
              composes: class-${i - 1};
              font-size: ${12 + (i % 6)}px;
            }
          `;
        }
      }
      
      const startTime = performance.now();
      const result = await transformer.transform(input, context, {});
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.metadata?.transformationsApplied).toBeDefined();
    });

    it('should handle malformed input gracefully', async () => {
      const transformer = new CSSModulesTransformer();
      
      const malformedInputs = [
        '{{{}}}',
        '.class { color: }',
        '.incomplete {',
        'not css at all',
        '.class { composes: ; }',
        '@import ;',
        ':root { --: invalid; }',
      ];
      
      for (const input of malformedInputs) {
        const result = await transformer.transform(input, context, {});
        // Should not crash, but may not be successful
        expect(result).toBeDefined();
        expect(result.transformed).toBeDefined();
      }
    });

    it('should preserve complex selectors and rules', async () => {
      const transformer = new CSSModulesTransformer();
      
      const input = `
        .component {
          color: blue;
        }
        
        .component:hover,
        .component:focus {
          color: darkblue;
        }
        
        .component::before {
          content: "";
          position: absolute;
        }
        
        .component > .child {
          margin-left: 10px;
        }
        
        .component + .sibling {
          margin-top: 20px;
        }
        
        .component[data-active="true"] {
          background: yellow;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animated {
          animation: fadeIn 0.3s ease-in-out;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain(':hover');
      expect(result.transformed).toContain('::before');
      expect(result.transformed).toContain('> .child');
      expect(result.transformed).toContain('+ .sibling');
      expect(result.transformed).toContain('[data-active="true"]');
      expect(result.transformed).toContain('@keyframes fadeIn');
    });
  });

  describe('Integration with other systems', () => {
    it('should work with PostCSS features', () => {
      const parser = new CSSModulesParser();
      
      const input = `
        .component {
          color: blue;
          & .nested {
            color: red;
          }
        }
        
        @custom-media --small-viewport (max-width: 30em);
        
        @media (--small-viewport) {
          .component {
            padding: 10px;
          }
        }
      `;
      
      // Should handle gracefully even if PostCSS features aren't fully supported
      expect(() => parser.parse(input, context)).not.toThrow();
    });

    it('should generate valid output for build systems', async () => {
      const options: CSSModulesTransformOptions = {
        generateTypeDefinitions: true,
        exportType: 'named',
        generateScopedName: (name, filename) => `${name}__${filename.split('.')[0]}`,
      };
      
      const transformer = new CSSModulesTransformer(options);
      
      const input = `
        .header {
          background: #333;
          color: white;
          padding: 20px;
        }
        
        .navigation {
          display: flex;
          gap: 20px;
        }
        
        .link {
          color: inherit;
          text-decoration: none;
        }
        
        .link:hover {
          text-decoration: underline;
        }
      `;
      
      const result = await transformer.transform(input, context, {});
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeTruthy();
      expect(result.metadata?.typeDefinitions).toBeTruthy();
      
      // Should be valid CSS
      expect(result.transformed).toMatch(/\.[\w-_]+\s*\{[^}]*\}/);
      
      // Should be valid TypeScript
      const typeDefs = result.metadata!.typeDefinitions!;
      expect(typeDefs).toMatch(/export const \w+: string;/);
    });
  });
});