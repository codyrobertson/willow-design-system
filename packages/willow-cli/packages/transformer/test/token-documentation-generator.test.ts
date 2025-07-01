import {
  BaseTokenDocumentationGenerator,
  TokenDocumentationGeneratorRegistry,
  DocumentationFormat,
  type DocumentationGenerationOptions,
  type DocumentationExportOptions,
} from '../src/styles/theme-tokens/token-documentation-generator';
import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenSemanticContext,
  TokenMigrationContext,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
} from '../src/types/theme-tokens.types';

describe('Token Documentation Generator', () => {
  const sampleTokens: DesignToken[] = [
    {
      name: 'colors.primary.500',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Primary brand color',
    },
    {
      name: 'colors.primary.600',
      value: '#0056b3',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Darker primary color',
    },
    {
      name: 'spacing.md',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
      description: 'Medium spacing',
    },
    {
      name: 'font.family.sans',
      value: {
        $array: ['Inter', 'system-ui', 'sans-serif'],
      } as TokenArray,
      type: TokenType.FONT_FAMILY,
      category: TokenCategory.TYPOGRAPHY,
      description: 'Primary sans-serif font stack',
    },
    {
      name: 'shadow.elevated',
      value: {
        x: '0px',
        y: '4px',
        blur: '8px',
        color: 'rgba(0, 0, 0, 0.1)',
      } as TokenCompositeValue,
      type: TokenType.SHADOW,
      category: TokenCategory.SHADOW,
      description: 'Elevated shadow for cards and modals',
    },
    {
      name: 'button.primary.background',
      value: { $ref: 'colors.primary.500' } as TokenReference,
      type: TokenType.REFERENCE,
      category: TokenCategory.CUSTOM,
      description: 'Primary button background color',
    },
    {
      name: 'colors.deprecated',
      value: '#ff0000',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Deprecated color token',
      deprecated: true,
      replacement: 'colors.danger.500',
    },
  ];

  const semanticContext: TokenSemanticContext = {
    framework: 'tailwind',
    version: '3.4.0',
    sourceFramework: 'custom',
  };

  const migrationContext: TokenMigrationContext = {
    sourceFramework: 'custom',
    targetFramework: 'tailwind',
    preserveSemantics: true,
    strictValidation: false,
  };

  describe('BaseTokenDocumentationGenerator', () => {
    let generator: BaseTokenDocumentationGenerator;

    beforeEach(() => {
      generator = new BaseTokenDocumentationGenerator();
    });

    describe('generateTokenDocumentation', () => {
      it('should generate documentation for a color token', async () => {
        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        expect(result).toBeDefined();
        expect(result.token).toBe(colorToken);
        expect(result.documentation).toContain('colors.primary.500');
        expect(result.documentation).toContain('#007bff');
        expect(result.documentation).toContain('Primary brand color');
        expect(result.examples.length).toBeGreaterThan(0);

        // Should include CSS examples
        const cssExample = result.examples.find(e => e.language === 'css');
        expect(cssExample).toBeDefined();
        expect(cssExample!.code).toContain('--colors-primary-500');
        expect(cssExample!.code).toContain('#007bff');
      });

      it('should generate documentation for a spacing token', async () => {
        const spacingToken = sampleTokens[2];
        const result = await generator.generateTokenDocumentation(spacingToken);

        expect(result).toBeDefined();
        expect(result.documentation).toContain('spacing.md');
        expect(result.documentation).toContain('16px');
        expect(result.documentation).toContain('Medium spacing');

        // Should include visual preview for spacing
        expect(result.documentation).toContain('Visual Preview');
        expect(result.documentation).toContain('Spacing:');
      });

      it('should generate documentation for a font family token', async () => {
        const fontToken = sampleTokens[3];
        const result = await generator.generateTokenDocumentation(fontToken);

        expect(result).toBeDefined();
        expect(result.documentation).toContain('font.family.sans');
        expect(result.documentation).toContain('Inter, system-ui, sans-serif');
        expect(result.documentation).toContain('Font Stack');
        expect(result.documentation).toContain('Primary Font');
        expect(result.documentation).toContain('Fallbacks');
      });

      it('should generate documentation for a composite shadow token', async () => {
        const shadowToken = sampleTokens[4];
        const result = await generator.generateTokenDocumentation(shadowToken);

        expect(result).toBeDefined();
        expect(result.documentation).toContain('shadow.elevated');
        expect(result.documentation).toContain('Elevated shadow');
        expect(result.documentation).toContain('Visual Preview');
        expect(result.documentation).toContain('box-shadow');
      });

      it('should generate documentation for a reference token', async () => {
        const referenceToken = sampleTokens[5];
        const result = await generator.generateTokenDocumentation(referenceToken);

        expect(result).toBeDefined();
        expect(result.documentation).toContain('button.primary.background');
        expect(result.documentation).toContain('var(--colors-primary-500)');
        expect(result.examples.length).toBeGreaterThan(0);
      });

      it('should generate documentation for a deprecated token', async () => {
        const deprecatedToken = sampleTokens[6];
        const result = await generator.generateTokenDocumentation(deprecatedToken);

        expect(result).toBeDefined();
        expect(result.documentation).toContain('⚠️ **Deprecated**');
        expect(result.documentation).toContain('colors.danger.500');
        expect(result.migrationNotes).toBeDefined();
        expect(result.migrationNotes!.length).toBeGreaterThan(0);
      });

      it('should include accessibility information', async () => {
        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        expect(result.documentation).toContain('Accessibility');
        expect(result.documentation).toContain('WCAG');
        expect(result.documentation).toContain('contrast ratio');
      });

      it('should include usage guidelines', async () => {
        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        expect(result.documentation).toContain('Usage Guidelines');
        expect(result.documentation).toContain('backgrounds, text, borders');
      });

      it('should include framework-specific guidelines when context provided', async () => {
        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken, semanticContext);

        expect(result.documentation).toContain('tailwind Guidelines');
        expect(result.documentation).toContain('Tailwind color utilities');
      });
    });

    describe('generateTokensDocumentation', () => {
      it('should generate documentation for multiple tokens', async () => {
        const results = await generator.generateTokensDocumentation(sampleTokens.slice(0, 3));

        expect(results.length).toBe(3);
        expect(results[0].token.name).toBe('colors.primary.500');
        expect(results[1].token.name).toBe('colors.primary.600');
        expect(results[2].token.name).toBe('spacing.md');

        results.forEach(result => {
          expect(result.documentation).toBeDefined();
          expect(result.examples.length).toBeGreaterThan(0);
        });
      });

      it('should handle large token sets efficiently', async () => {
        const largeTokenSet: DesignToken[] = [];
        for (let i = 0; i < 50; i++) {
          largeTokenSet.push({
            name: `test.token.${i}`,
            value: `#${i.toString(16).padStart(6, '0')}`,
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
            description: `Test token ${i}`,
          });
        }

        const startTime = performance.now();
        const results = await generator.generateTokensDocumentation(largeTokenSet);
        const endTime = performance.now();

        expect(results.length).toBe(50);
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      });
    });

    describe('generateMigrationGuide', () => {
      it('should generate a comprehensive migration guide', async () => {
        const sourceTokens = sampleTokens.slice(0, 3);
        const targetTokens = sampleTokens.slice(1, 4);

        const guide = await generator.generateMigrationGuide(
          sourceTokens,
          targetTokens,
          migrationContext
        );

        expect(guide).toBeDefined();
        expect(guide).toContain('Token Migration Guide');
        expect(guide).toContain('custom');
        expect(guide).toContain('tailwind');
        expect(guide).toContain('Overview');
        expect(guide).toContain('Token Mapping');
        expect(guide).toContain('Breaking Changes');
        expect(guide).toContain('Migration Steps');
        expect(guide).toContain('Code Examples');
        expect(guide).toContain('Validation and Testing');
      });

      it('should include token mapping table', async () => {
        const sourceTokens = sampleTokens.slice(0, 2);
        const targetTokens = sampleTokens.slice(1, 3);

        const guide = await generator.generateMigrationGuide(
          sourceTokens,
          targetTokens,
          migrationContext
        );

        expect(guide).toContain('| Source Token | Target Token | Type | Notes |');
        expect(guide).toContain('colors.primary.500');
        expect(guide).toContain('colors.primary.600');
      });

      it('should highlight breaking changes', async () => {
        const deprecatedTokens = [sampleTokens[6]]; // Deprecated token
        const targetTokens = [sampleTokens[0]];

        const guide = await generator.generateMigrationGuide(
          deprecatedTokens,
          targetTokens,
          migrationContext
        );

        expect(guide).toContain('Breaking Changes');
        expect(guide).toContain('Deprecated Tokens');
        expect(guide).toContain('colors.deprecated');
        expect(guide).toContain('colors.danger.500');
      });
    });

    describe('generateUsageDocumentation', () => {
      it('should generate Markdown usage documentation', async () => {
        const doc = await generator.generateUsageDocumentation(
          sampleTokens.slice(0, 3),
          DocumentationFormat.MARKDOWN
        );

        expect(doc).toContain('# Design Token Usage Guide');
        expect(doc).toContain('## Color');
        expect(doc).toContain('## Spacing');
        expect(doc).toContain('colors.primary.500');
        expect(doc).toContain('spacing.md');
      });

      it('should generate HTML usage documentation', async () => {
        const doc = await generator.generateUsageDocumentation(
          sampleTokens.slice(0, 3),
          DocumentationFormat.HTML
        );

        expect(doc).toContain('<!DOCTYPE html>');
        expect(doc).toContain('<h1>Design Token Usage Guide</h1>');
        expect(doc).toContain('colors.primary.500');
        expect(doc).toContain('class="token"');
      });

      it('should generate JSON usage documentation', async () => {
        const doc = await generator.generateUsageDocumentation(
          sampleTokens.slice(0, 3),
          DocumentationFormat.JSON
        );

        const parsed = JSON.parse(doc);
        expect(parsed.title).toBe('Design Token Usage Guide');
        expect(parsed.tokens).toBeDefined();
        expect(parsed.tokens.length).toBe(3);
        expect(parsed.tokens[0].name).toBe('colors.primary.500');
      });

      it('should generate Storybook usage documentation', async () => {
        const doc = await generator.generateUsageDocumentation(
          sampleTokens.slice(0, 2),
          DocumentationFormat.STORYBOOK
        );

        expect(doc).toContain('import type { Meta, StoryObj }');
        expect(doc).toContain("title: 'Design System/Tokens'");
        expect(doc).toContain('export const colorsprimary500');
        expect(doc).toContain('colors.primary.500');
      });

      it('should throw error for unsupported format', async () => {
        await expect(
          generator.generateUsageDocumentation(
            sampleTokens,
            'unsupported' as DocumentationFormat
          )
        ).rejects.toThrow('Unsupported documentation format');
      });
    });

    describe('exportDocumentation', () => {
      let tokenDocumentations: any[];

      beforeEach(async () => {
        tokenDocumentations = await generator.generateTokensDocumentation(
          sampleTokens.slice(0, 3)
        );
      });

      it('should export documentation as Markdown', async () => {
        const exported = await generator.exportDocumentation(
          tokenDocumentations,
          DocumentationFormat.MARKDOWN
        );

        expect(exported).toContain('# Design Token Documentation');
        expect(exported).toContain('## Table of Contents');
        expect(exported).toContain('colors.primary.500');
        expect(exported).toContain('### Examples');
        expect(exported).toContain('---'); // Section dividers
      });

      it('should export documentation as HTML', async () => {
        const exported = await generator.exportDocumentation(
          tokenDocumentations,
          DocumentationFormat.HTML
        );

        expect(exported).toContain('<!DOCTYPE html>');
        expect(exported).toContain('<h1>Design Token Documentation</h1>');
        expect(exported).toContain('class="token-doc"');
        expect(exported).toContain('colors.primary.500');
      });

      it('should export documentation as JSON', async () => {
        const exported = await generator.exportDocumentation(
          tokenDocumentations,
          DocumentationFormat.JSON
        );

        const parsed = JSON.parse(exported);
        expect(parsed.title).toBe('Design Token Documentation');
        expect(parsed.documentation).toBeDefined();
        expect(parsed.documentation.length).toBe(3);
        expect(parsed.documentation[0].token.name).toBe('colors.primary.500');
      });

      it('should export documentation as Storybook', async () => {
        const exported = await generator.exportDocumentation(
          tokenDocumentations,
          DocumentationFormat.STORYBOOK
        );

        expect(exported).toContain('import type { Meta, StoryObj }');
        expect(exported).toContain("title: 'Design System/Token Documentation'");
        expect(exported).toContain('export const colorsprimary500');
        expect(exported).toContain('render: () =>');
      });

      it('should include table of contents when requested', async () => {
        const options: DocumentationExportOptions = {
          includeTableOfContents: true,
        };

        const exported = await generator.exportDocumentation(
          tokenDocumentations,
          DocumentationFormat.MARKDOWN,
          options
        );

        expect(exported).toContain('## Table of Contents');
        expect(exported).toContain('- [colors.primary.500]');
      });

      it('should exclude table of contents when not requested', async () => {
        const options: DocumentationExportOptions = {
          includeTableOfContents: false,
        };

        const exported = await generator.exportDocumentation(
          tokenDocumentations,
          DocumentationFormat.MARKDOWN,
          options
        );

        expect(exported).not.toContain('## Table of Contents');
      });

      it('should include custom styling in HTML export', async () => {
        const options: DocumentationExportOptions = {
          customStyling: 'body { background: red; }',
        };

        const exported = await generator.exportDocumentation(
          tokenDocumentations,
          DocumentationFormat.HTML,
          options
        );

        expect(exported).toContain('body { background: red; }');
      });
    });

    describe('Code Examples Generation', () => {
      it('should generate CSS examples for all token types', async () => {
        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        const cssExamples = result.examples.filter(e => e.language === 'css');
        expect(cssExamples.length).toBeGreaterThan(0);

        const variableExample = cssExamples.find(e => e.title.includes('Variable'));
        expect(variableExample).toBeDefined();
        expect(variableExample!.code).toContain(':root');
        expect(variableExample!.code).toContain('--colors-primary-500');

        const directExample = cssExamples.find(e => e.title.includes('Direct'));
        expect(directExample).toBeDefined();
        expect(directExample!.code).toContain('color: #007bff');
      });

      it('should generate React examples', async () => {
        const options: DocumentationGenerationOptions = {
          frameworkExamples: ['react'],
        };
        const generator = new BaseTokenDocumentationGenerator(options);

        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        const reactExamples = result.examples.filter(e => e.language === 'jsx');
        expect(reactExamples.length).toBeGreaterThan(0);

        const styledExample = reactExamples.find(e => e.title.includes('Styled Components'));
        expect(styledExample).toBeDefined();
        expect(styledExample!.code).toContain('styled-components');
        expect(styledExample!.code).toContain('props.theme.colors.primary.500');

        const cssInJsExample = reactExamples.find(e => e.title.includes('CSS-in-JS'));
        expect(cssInJsExample).toBeDefined();
        expect(cssInJsExample!.code).toContain('const styles');
      });

      it('should generate Vue examples', async () => {
        const options: DocumentationGenerationOptions = {
          frameworkExamples: ['vue'],
        };
        const generator = new BaseTokenDocumentationGenerator(options);

        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        const vueExamples = result.examples.filter(e => e.language === 'vue');
        expect(vueExamples.length).toBeGreaterThan(0);

        const sfcExample = vueExamples[0];
        expect(sfcExample.code).toContain('<template>');
        expect(sfcExample.code).toContain('<style scoped>');
        expect(sfcExample.code).toContain('#007bff');
      });

      it('should generate examples for multiple frameworks', async () => {
        const options: DocumentationGenerationOptions = {
          frameworkExamples: ['css', 'react', 'vue'],
        };
        const generator = new BaseTokenDocumentationGenerator(options);

        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        const languages = new Set(result.examples.map(e => e.language));
        expect(languages.has('css')).toBe(true);
        expect(languages.has('jsx')).toBe(true);
        expect(languages.has('vue')).toBe(true);
      });
    });

    describe('Visual Previews', () => {
      it('should generate color previews', async () => {
        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        expect(result.documentation).toContain('Visual Preview');
        expect(result.documentation).toContain('background-color: #007bff');
        expect(result.documentation).toContain('width: 100px; height: 100px');
      });

      it('should generate spacing previews', async () => {
        const spacingToken = sampleTokens[2];
        const result = await generator.generateTokenDocumentation(spacingToken);

        expect(result.documentation).toContain('Visual Preview');
        expect(result.documentation).toContain('width: 16px');
        expect(result.documentation).toContain('height: 20px');
      });

      it('should generate shadow previews', async () => {
        const shadowToken = sampleTokens[4];
        const result = await generator.generateTokenDocumentation(shadowToken);

        expect(result.documentation).toContain('Visual Preview');
        expect(result.documentation).toContain('box-shadow:');
      });

      it('should skip visual previews when disabled', async () => {
        const options: DocumentationGenerationOptions = {
          includeVisualPreviews: false,
        };
        const generator = new BaseTokenDocumentationGenerator(options);

        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken);

        expect(result.documentation).not.toContain('Visual Preview');
      });
    });

    describe('Framework-specific Guidelines', () => {
      it('should include Tailwind-specific guidelines', async () => {
        const tailwindContext: TokenSemanticContext = {
          framework: 'tailwind',
          version: '3.4.0',
        };

        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken, tailwindContext);

        expect(result.documentation).toContain('tailwind Guidelines');
        expect(result.documentation).toContain('bg-`, `text-`, `border-');
        expect(result.documentation).toContain('arbitrary value syntax');
      });

      it('should include Chakra UI guidelines', async () => {
        const chakraContext: TokenSemanticContext = {
          framework: 'chakra',
          version: '2.8.0',
        };

        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken, chakraContext);

        expect(result.documentation).toContain('chakra Guidelines');
        expect(result.documentation).toContain('theme.colors');
        expect(result.documentation).toContain('bg`, `color`, `borderColor');
      });

      it('should include Material-UI guidelines', async () => {
        const muiContext: TokenSemanticContext = {
          framework: 'mui',
          version: '5.0.0',
        };

        const colorToken = sampleTokens[0];
        const result = await generator.generateTokenDocumentation(colorToken, muiContext);

        expect(result.documentation).toContain('mui Guidelines');
        expect(result.documentation).toContain('theme.palette');
        expect(result.documentation).toContain('Material-UI theme');
      });
    });

    describe('Performance and Caching', () => {
      it('should cache code examples for performance', async () => {
        const token = sampleTokens[0];

        const result1 = await generator.generateTokenDocumentation(token, semanticContext);
        const result2 = await generator.generateTokenDocumentation(token, semanticContext);

        // Should have same examples due to caching
        expect(result1.examples.length).toBe(result2.examples.length);
      });

      it('should handle concurrent documentation generation', async () => {
        const tokens = sampleTokens.slice(0, 5);
        
        const promises = tokens.map(token => 
          generator.generateTokenDocumentation(token, semanticContext)
        );

        const results = await Promise.all(promises);

        expect(results.length).toBe(5);
        results.forEach(result => {
          expect(result.documentation).toBeDefined();
          expect(result.examples.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle tokens with null values gracefully', async () => {
        const tokenWithNullValue: DesignToken = {
          name: 'null.token',
          value: null,
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        };

        const result = await generator.generateTokenDocumentation(tokenWithNullValue);

        expect(result).toBeDefined();
        expect(result.documentation).toContain('null.token');
        expect(result.documentation).toContain('null');
      });

      it('should handle complex composite values', async () => {
        const complexToken: DesignToken = {
          name: 'complex.token',
          value: {
            nested: {
              deep: {
                value: 'test',
                array: [1, 2, 3],
              },
            },
          } as TokenCompositeValue,
          type: TokenType.COMPOSITE,
          category: TokenCategory.CUSTOM,
        };

        const result = await generator.generateTokenDocumentation(complexToken);

        expect(result).toBeDefined();
        expect(result.documentation).toContain('complex.token');
        // Should handle complex structure without errors
      });
    });
  });

  describe('TokenDocumentationGeneratorRegistry', () => {
    let registry: TokenDocumentationGeneratorRegistry;

    beforeEach(() => {
      registry = new TokenDocumentationGeneratorRegistry();
    });

    it('should have default generator registered', () => {
      const generators = registry.getAvailableGenerators();
      expect(generators).toContain('base');
    });

    it('should allow custom generator registration', () => {
      const customGenerator = new BaseTokenDocumentationGenerator();
      registry.register('custom', customGenerator);

      const retrieved = registry.getGenerator('custom');
      expect(retrieved).toBe(customGenerator);

      const generators = registry.getAvailableGenerators();
      expect(generators).toContain('custom');
    });

    it('should generate token documentation using registry', async () => {
      const token = sampleTokens[0];
      const result = await registry.generateTokenDocumentation(token);

      expect(result).toBeDefined();
      expect(result.token).toBe(token);
      expect(result.documentation).toBeDefined();
    });

    it('should generate multiple tokens documentation using registry', async () => {
      const tokens = sampleTokens.slice(0, 3);
      const results = await registry.generateTokensDocumentation(tokens);

      expect(results.length).toBe(3);
      expect(results[0].token.name).toBe('colors.primary.500');
    });

    it('should generate migration guide using registry', async () => {
      const sourceTokens = sampleTokens.slice(0, 2);
      const targetTokens = sampleTokens.slice(1, 3);

      const guide = await registry.generateMigrationGuide(
        sourceTokens,
        targetTokens,
        migrationContext
      );

      expect(guide).toBeDefined();
      expect(guide).toContain('Token Migration Guide');
    });

    it('should export documentation using registry', async () => {
      const tokens = sampleTokens.slice(0, 2);
      const documentation = await registry.generateTokensDocumentation(tokens);

      const exported = await registry.exportDocumentation(
        documentation,
        DocumentationFormat.MARKDOWN
      );

      expect(exported).toBeDefined();
      expect(exported).toContain('# Design Token Documentation');
    });

    it('should throw error for unknown generator', async () => {
      expect(() => {
        registry.getGenerator('nonexistent');
      }).toThrow('No documentation generator available');

      await expect(
        registry.generateTokenDocumentation(sampleTokens[0], undefined, 'nonexistent')
      ).rejects.toThrow('No documentation generator available');
    });
  });

  describe('Integration Tests', () => {
    let generator: BaseTokenDocumentationGenerator;

    beforeEach(() => {
      generator = new BaseTokenDocumentationGenerator({
        includeVisualPreviews: true,
        includeCodeExamples: true,
        includeMigrationNotes: true,
        includeAccessibility: true,
        includeSemanticRelationships: true,
        frameworkExamples: ['css', 'react', 'vue'],
      });
    });

    it('should generate complete documentation for a design system', async () => {
      const documentation = await generator.generateTokensDocumentation(
        sampleTokens,
        semanticContext
      );

      expect(documentation.length).toBe(sampleTokens.length);

      // Verify each token has complete documentation
      documentation.forEach(doc => {
        expect(doc.documentation).toBeDefined();
        expect(doc.documentation.length).toBeGreaterThan(100); // Substantial content
        expect(doc.examples.length).toBeGreaterThan(0);

        // Visual tokens should have previews
        if (['color', 'spacing', 'shadow', 'border'].includes(doc.token.category)) {
          expect(doc.documentation).toContain('Visual Preview');
        }

        // Deprecated tokens should have migration notes
        if (doc.token.deprecated) {
          expect(doc.migrationNotes).toBeDefined();
          expect(doc.migrationNotes!.length).toBeGreaterThan(0);
        }
      });
    });

    it('should export complete design system documentation', async () => {
      const documentation = await generator.generateTokensDocumentation(sampleTokens);

      const markdownExport = await generator.exportDocumentation(
        documentation,
        DocumentationFormat.MARKDOWN,
        { includeTableOfContents: true, groupByCategory: true }
      );

      expect(markdownExport).toBeDefined();
      expect(markdownExport.length).toBeGreaterThan(1000); // Substantial content
      expect(markdownExport).toContain('# Design Token Documentation');
      expect(markdownExport).toContain('## Table of Contents');

      // Should contain all token names
      sampleTokens.forEach(token => {
        expect(markdownExport).toContain(token.name);
      });
    });

    it('should generate migration guide with comprehensive coverage', async () => {
      const sourceTokens = sampleTokens.slice(0, 4);
      const targetTokens = sampleTokens.slice(2, 6);

      const guide = await generator.generateMigrationGuide(
        sourceTokens,
        targetTokens,
        {
          ...migrationContext,
          options: {
            generateDocs: true,
            validate: true,
            conflictResolution: 'merge',
          },
        }
      );

      expect(guide).toBeDefined();
      expect(guide.length).toBeGreaterThan(500); // Comprehensive content

      // Should include all required sections
      const requiredSections = [
        'Token Migration Guide',
        'Overview',
        'Token Mapping',
        'Breaking Changes',
        'Migration Steps',
        'Code Examples',
        'Validation and Testing',
      ];

      requiredSections.forEach(section => {
        expect(guide).toContain(section);
      });
    });
  });
});