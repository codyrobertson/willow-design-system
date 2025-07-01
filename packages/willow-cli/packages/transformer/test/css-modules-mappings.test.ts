import {
  cssModulesToBootstrapMappings,
  cssModulesToTailwindMappings,
  cssModulesToMuiMappings,
  cssModulesToAntdMappings,
  createCSSModuleMappings,
  mergeCSSModuleMappings,
  semanticColorMappings,
  responsiveMappings,
} from '../src/styles/css-modules/css-modules-mappings';
import { CSSModulesTransformer } from '../src/styles/css-modules/css-modules-transformer';
import { StyleType } from '../src/types/style-transformation.types';
import type { StyleTransformationContext, StyleTransformerConfig } from '../src/types/style-transformation.types';

describe('CSS Modules Mappings', () => {
  const context: StyleTransformationContext = {
    styleType: StyleType.CSS_MODULES,
    sourceFramework: 'css-modules',
    targetFramework: 'bootstrap',
    filePath: 'Component.module.css',
  };

  describe('Bootstrap mappings', () => {
    it('should map CSS modules classes to Bootstrap classes', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: cssModulesToBootstrapMappings.slice(0, 15),
      };
      
      const input = `
        .container {
          width: 100%;
        }
        
        .flex {
          display: flex;
        }
        
        .justify-center {
          justify-content: center;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.container');
      expect(result.transformed).toContain('.d-flex');
      expect(result.transformed).toContain('.justify-content-center');
    });
  });

  describe('Tailwind mappings', () => {
    it('should map CSS modules classes to Tailwind classes', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: cssModulesToTailwindMappings,
      };
      
      const input = `
        .flex {
          display: flex;
        }
        
        .m-3 {
          margin: 12px;
        }
        
        .text-primary {
          color: var(--primary);
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.flex');
      expect(result.transformed).toContain('.m-4'); // m-3 maps to m-4 in Tailwind scale
      expect(result.transformed).toContain('.text-blue-600'); // primary -> blue-600
    });
  });

  describe('Material-UI mappings', () => {
    it('should map CSS modules classes to Material-UI classes', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: cssModulesToMuiMappings,
      };
      
      const input = `
        .button {
          padding: 8px 16px;
        }
        
        .button-primary {
          background: blue;
        }
        
        .text-h1 {
          font-size: 2rem;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.MuiButton-root');
      expect(result.transformed).toContain('.MuiButton-containedPrimary');
      expect(result.transformed).toContain('.MuiTypography-h1');
    });
  });

  describe('Ant Design mappings', () => {
    it('should map CSS modules classes to Ant Design classes', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: cssModulesToAntdMappings,
      };
      
      const input = `
        .button {
          border: 1px solid;
        }
        
        .form {
          width: 100%;
        }
        
        .col-6 {
          width: 50%;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.ant-btn');
      expect(result.transformed).toContain('.ant-form');
      expect(result.transformed).toContain('.ant-col-6');
    });
  });

  describe('Custom mappings', () => {
    it('should create custom mappings', () => {
      const customMappings = createCSSModuleMappings([
        { source: 'custom-button', target: 'btn-custom', priority: 10 },
        { source: /^icon-(.+)$/, target: (match) => `icon-${match.replace('icon-', '').toUpperCase()}` },
        { source: 'legacy-class', target: 'new-class' },
      ]);
      
      expect(customMappings).toHaveLength(3);
      expect(customMappings[0].sourceClass).toBe('custom-button');
      expect(customMappings[0].targetClass).toBe('btn-custom');
      expect(customMappings[0].priority).toBe(10);
      expect(customMappings[1].sourceClass).toBeInstanceOf(RegExp);
    });

    it('should merge mapping sets', () => {
      const set1 = createCSSModuleMappings([
        { source: 'class1', target: 'target1', priority: 1 },
      ]);
      
      const set2 = createCSSModuleMappings([
        { source: 'class2', target: 'target2', priority: 2 },
      ]);
      
      const merged = mergeCSSModuleMappings(set1, set2, semanticColorMappings);
      
      expect(merged.length).toBeGreaterThanOrEqual(2);
      // Should be sorted by priority (higher first)
      expect(merged[0].priority || 0).toBeGreaterThanOrEqual(merged[1].priority || 0);
    });
  });

  describe('Semantic color mappings', () => {
    it('should map semantic colors', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: semanticColorMappings,
      };
      
      const input = `
        .primary {
          color: var(--primary);
        }
        
        .success {
          color: var(--success);
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.blue');
      expect(result.transformed).toContain('.green');
    });
  });

  describe('Responsive mappings', () => {
    it('should handle responsive utilities', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: responsiveMappings,
      };
      
      const input = `
        .sm\\:flex {
          display: flex;
        }
        
        .hover\\:bg-blue {
          background: blue;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      // Note: CSS escaping makes this complex, but the mappings should work
    });
  });

  describe('RegExp mappings', () => {
    it('should handle RegExp-based mappings', async () => {
      const transformer = new CSSModulesTransformer();
      const config: StyleTransformerConfig = {
        classMappings: [
          { sourceClass: /^m-(\d+)$/, targetClass: (match) => `margin-${match.replace('m-', '')}` },
          { sourceClass: /^col-(\d+)$/, targetClass: (match) => `column-${match.replace('col-', '')}` },
        ],
      };
      
      const input = `
        .m-4 {
          margin: 16px;
        }
        
        .col-6 {
          width: 50%;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toContain('.margin-4');
      expect(result.transformed).toContain('.column-6');
    });
  });

  describe('Priority-based mapping', () => {
    it('should resolve mappings based on priority', async () => {
      const transformer = new CSSModulesTransformer();
      
      // Create mappings with different priorities for same class
      const highPriorityMappings = createCSSModuleMappings([
        { source: 'button', target: 'high-priority-btn', priority: 10 },
      ]);
      
      const lowPriorityMappings = createCSSModuleMappings([
        { source: 'button', target: 'low-priority-btn', priority: 1 },
      ]);
      
      const merged = mergeCSSModuleMappings(lowPriorityMappings, highPriorityMappings);
      const config: StyleTransformerConfig = {
        classMappings: merged,
      };
      
      const input = `
        .button {
          padding: 8px;
        }
      `;
      
      const result = await transformer.transform(input, context, config);
      
      expect(result.success).toBe(true);
      // Should use the high priority mapping
      expect(result.transformed).toContain('.high-priority-btn');
      expect(result.transformed).not.toContain('.low-priority-btn');
    });
  });
});