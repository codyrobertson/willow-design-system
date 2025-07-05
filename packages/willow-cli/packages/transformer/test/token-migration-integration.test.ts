import * as fs from 'fs';
import * as path from 'path';
import {
  TokenFormat,
  TokenMigrationContext,
  TokenSemanticContext,
} from '../src/types/theme-tokens.types';
import { BaseTokenParser } from '../src/styles/theme-tokens/token-parser';
import { BaseTokenExtractor } from '../src/styles/theme-tokens/token-extractor';
import { BaseTokenTransformer } from '../src/styles/theme-tokens/token-transformer';
import { BaseTokenMapper } from '../src/styles/theme-tokens/token-mapper';
import { TokenFormatConverterRegistry } from '../src/styles/theme-tokens/token-format-converters';
import { BaseSemanticTokenMigrator } from '../src/styles/theme-tokens/semantic-token-migration';
import { BaseTokenValidator } from '../src/styles/theme-tokens/token-validation';
import { BaseTokenDocumentationGenerator, DocumentationFormat } from '../src/styles/theme-tokens/token-documentation-generator';
import { BaseTokenUsageTracker } from '../src/styles/theme-tokens/token-usage-tracker';
import {
  makeColorToken,
  makeSpacingToken,
  makeMigrationContext,
  makeSemanticContext,
  TokenSetBuilder,
  createBasicColorTokens,
  createBasicSpacingTokens,
  createCircularReferenceTokens,
  assertTokenEqual,
  assertValidationSuccess,
  assertValidationError,
  measureExecutionTime,
  assertPerformanceImprovement,
} from './helpers/token-factories';

// Load fixtures
const loadFixture = (filename: string): string => {
  return fs.readFileSync(
    path.join(__dirname, '__fixtures__', filename),
    'utf-8'
  );
};

describe('Token Migration Integration Tests', () => {
  let tokenConfigJson: string;
  let sampleCssContent: string;
  let sampleVueContent: string;

  beforeAll(() => {
    // Load fixtures once for all tests
    tokenConfigJson = loadFixture('sample-tokens.json');
    sampleCssContent = loadFixture('sample-styles.css');
    sampleVueContent = loadFixture('sample-component.vue');
  });

  describe('Token Parsing', () => {
    let parser: BaseTokenParser;

    beforeEach(() => {
      parser = new BaseTokenParser();
    });

    it('should parse JSON token configuration', async () => {
      const tokens = await parser.parseTokens(
        tokenConfigJson,
        TokenFormat.JSON
      );

      expect(tokens.length).toBeGreaterThan(0);
      assertTokenEqual(tokens[0], {
        type: expect.any(String),
        category: expect.any(String),
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{ "tokens": { "invalid": }';
      
      await expect(
        parser.parseTokens(malformedJson, TokenFormat.JSON)
      ).rejects.toThrow();
    });

    it('should support caching for repeated parses', async () => {
      const { duration: firstDuration } = await measureExecutionTime(
        () => parser.parseTokens(tokenConfigJson, TokenFormat.JSON)
      );

      const { duration: secondDuration } = await measureExecutionTime(
        () => parser.parseTokens(tokenConfigJson, TokenFormat.JSON)
      );

      assertPerformanceImprovement(firstDuration, secondDuration);
    });
  });

  describe('Token Extraction', () => {
    let extractor: BaseTokenExtractor;

    beforeEach(() => {
      extractor = new BaseTokenExtractor();
    });

    it('should extract tokens from CSS files', async () => {
      const result = await extractor.extractTokens(
        sampleCssContent,
        'css',
        { filePath: '/src/styles.css' }
      );

      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.references.length).toBeGreaterThan(0);
      expect(result.references[0]).toHaveProperty('tokenName');
      expect(result.references[0]).toHaveProperty('location');
    });

    it('should extract tokens from Vue SFC', async () => {
      const result = await extractor.extractTokens(
        sampleVueContent,
        'vue',
        { filePath: '/src/Component.vue' }
      );

      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.metadata).toHaveProperty('language', 'vue');
    });

    it('should handle empty files', async () => {
      const result = await extractor.extractTokens(
        '',
        'css',
        { filePath: '/src/empty.css' }
      );

      expect(result.tokens).toHaveLength(0);
      expect(result.references).toHaveLength(0);
    });
  });

  describe('Token Transformation', () => {
    let transformer: BaseTokenTransformer;
    let parser: BaseTokenParser;

    beforeEach(() => {
      transformer = new BaseTokenTransformer();
      parser = new BaseTokenParser();
    });

    it('should transform tokens to Tailwind format', async () => {
      const tokens = createBasicColorTokens();
      const context = makeMigrationContext('custom', 'tailwind');

      const transformed = await transformer.transformTokens(tokens, context);

      expect(transformed).toHaveLength(tokens.length);
      transformed.forEach(token => {
        expect(token.metadata?.tailwind).toBeDefined();
      });
    });

    it('should preserve semantic relationships', async () => {
      const builder = new TokenSetBuilder();
      const tokens = builder
        .addColor('base.primary', '#2196f3')
        .addReference('semantic.brand', 'base.primary')
        .build();

      const context = makeMigrationContext('custom', 'chakra', {
        preserveSemantics: true,
      });

      const transformed = await transformer.transformTokens(tokens, context);

      const semanticToken = transformed.find(t => t.name.includes('semantic'));
      expect(semanticToken?.metadata?.semanticRole).toBeDefined();
    });

    it('should handle batch transformations efficiently', async () => {
      const largeTokenSet = new TokenSetBuilder();
      for (let i = 0; i < 100; i++) {
        largeTokenSet.addColor(`color.generated.${i}`, `#${i.toString(16).padStart(6, '0')}`);
      }
      const tokens = largeTokenSet.build();

      const { duration } = await measureExecutionTime(
        () => transformer.transformTokens(
          tokens,
          makeMigrationContext('custom', 'tailwind')
        )
      );

      expect(duration).toBeLessThan(500); // Should complete quickly
    });
  });

  describe('Token Validation', () => {
    let validator: BaseTokenValidator;

    beforeEach(() => {
      validator = new BaseTokenValidator();
    });

    it('should validate correct token sets', async () => {
      const tokens = createBasicColorTokens();
      const result = await validator.validateTokens(tokens);

      assertValidationSuccess(result);
    });

    it('should detect circular references', async () => {
      const tokens = createCircularReferenceTokens();
      const result = await validator.validateTokens(tokens);

      assertValidationError(result, /Circular reference/);
    });

    it('should detect naming conflicts', async () => {
      const tokens = [
        makeColorToken('colors.primary', '#2196f3'),
        makeColorToken('colors.primary', '#ff0000'), // Duplicate name
      ];

      const conflicts = await validator.detectConflicts(tokens);

      expect(conflicts.hasConflicts).toBe(true);
      expect(conflicts.conflicts).toHaveLength(1);
      expect(conflicts.conflicts[0].type).toBe('naming');
    });

    it('should validate framework-specific constraints', async () => {
      const tokens = [
        makeColorToken('invalid-name!', '#2196f3'), // Invalid characters
      ];

      const context = makeMigrationContext('custom', 'tailwind', {
        strictValidation: true,
      });

      const result = await validator.validateTokens(tokens, context);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('naming'))).toBe(true);
    });
  });

  describe('Format Conversion', () => {
    let converterRegistry: TokenFormatConverterRegistry;

    beforeEach(() => {
      converterRegistry = new TokenFormatConverterRegistry();
    });

    it('should convert to CSS variables', async () => {
      const tokens = createBasicColorTokens();
      const css = await converterRegistry.convert(tokens, TokenFormat.CSS_VARIABLES);

      expect(css).toMatchInlineSnapshot(`
        ":root {
          --colors-primary-500: #2196f3;
          --colors-secondary-500: #9c27b0;
          --colors-error-500: #f44336;
          --colors-success-500: #4caf50;
        }"
      `);
    });

    it('should convert to Tailwind config', async () => {
      const tokens = [
        ...createBasicColorTokens(),
        ...createBasicSpacingTokens(),
      ];

      const config = await converterRegistry.convert(tokens, TokenFormat.TAILWIND_CONFIG);

      expect(config).toContain('module.exports');
      expect(config).toContain('colors:');
      expect(config).toContain('spacing:');
      
      // Parse and validate the generated config
      const configObj = eval(`(function() { ${config}; return module.exports; })()`);
      expect(configObj.theme.extend.colors.primary['500']).toBe('#2196f3');
    });

    it('should handle minification option', async () => {
      const tokens = createBasicColorTokens();
      const minified = await converterRegistry.convert(
        tokens,
        TokenFormat.CSS_VARIABLES,
        { minify: true }
      );

      expect(minified).not.toContain('\n  '); // No indentation
      expect(minified).toContain(':root{'); // No space after selector
    });
  });

  describe('Semantic Migration', () => {
    let semanticMigrator: BaseSemanticTokenMigrator;

    beforeEach(() => {
      semanticMigrator = new BaseSemanticTokenMigrator();
    });

    it('should migrate with framework-specific semantics', async () => {
      const tokens = createBasicColorTokens();
      const context = makeMigrationContext('custom', 'chakra', {
        preserveSemantics: true,
      });

      const result = await semanticMigrator.migrateTokens(tokens, context);

      expect(result.migratedTokens).toHaveLength(tokens.length);
      expect(result.semanticMappings.length).toBeGreaterThan(0);

      const mapping = result.semanticMappings[0];
      expect(mapping).toHaveProperty('sourceTokens');
      expect(mapping).toHaveProperty('targetTokens');
      expect(mapping).toHaveProperty('semanticRole');
    });

    it('should handle relationship analysis', async () => {
      const builder = new TokenSetBuilder();
      const tokens = builder
        .addColor('colors.blue.500', '#2196f3')
        .addColor('colors.blue.600', '#1976d2')
        .addColor('colors.blue.700', '#1565c0')
        .build();

      const relationships = await semanticMigrator.analyzeRelationships(tokens);

      expect(relationships.length).toBeGreaterThan(0);
      expect(relationships[0].type).toBe('scale');
      expect(relationships[0].tokens).toHaveLength(3);
    });
  });

  describe('Documentation Generation', () => {
    let docGenerator: BaseTokenDocumentationGenerator;

    beforeEach(() => {
      docGenerator = new BaseTokenDocumentationGenerator();
    });

    it('should generate token documentation', async () => {
      const token = makeColorToken('colors.primary', '#2196f3', {
        description: 'Primary brand color',
      });

      const doc = await docGenerator.generateTokenDocumentation(token);

      expect(doc.documentation).toContain('colors.primary');
      expect(doc.documentation).toContain('#2196f3');
      expect(doc.documentation).toContain('Primary brand color');
      expect(doc.examples.length).toBeGreaterThan(0);
    });

    it('should export documentation as Markdown', async () => {
      const tokens = createBasicColorTokens();
      const docs = await docGenerator.generateTokensDocumentation(tokens);

      const markdown = await docGenerator.exportDocumentation(
        docs,
        DocumentationFormat.MARKDOWN
      );

      expect(markdown).toMatchSnapshot('token-documentation-markdown');
    });

    it('should generate migration guides', async () => {
      const sourceTokens = createBasicColorTokens();
      const targetTokens = sourceTokens.map(t => ({
        ...t,
        name: t.name.replace('colors.', ''),
      }));

      const guide = await docGenerator.generateMigrationGuide(
        sourceTokens,
        targetTokens,
        makeMigrationContext('custom', 'tailwind')
      );

      expect(guide).toContain('Token Migration Guide');
      expect(guide).toContain('| Source Token | Target Token |');
      expect(guide).toMatchSnapshot('migration-guide');
    });
  });

  describe('Usage Tracking', () => {
    let usageTracker: BaseTokenUsageTracker;

    beforeEach(() => {
      usageTracker = new BaseTokenUsageTracker();
    });

    it('should track token usage in CSS', async () => {
      const tokens = [
        makeColorToken('colors.primary.500', '#2196f3'),
        makeSpacingToken('spacing.md', '16px'),
      ];

      const usages = await usageTracker.trackFileUsage(
        '/src/styles.css',
        sampleCssContent,
        tokens
      );

      expect(usages.length).toBeGreaterThan(0);
      
      const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
      expect(primaryUsage).toBeDefined();
      expect(primaryUsage!.locations[0]).toHaveProperty('line');
      expect(primaryUsage!.locations[0]).toHaveProperty('column');
    });

    it('should generate usage analytics', async () => {
      const tokens = [
        ...createBasicColorTokens(),
        makeColorToken('unused.color', '#000000'),
      ];

      const report = await usageTracker.scanForTokenUsage(
        ['/src/styles.css'],
        tokens
      );

      const analytics = await usageTracker.generateUsageAnalytics(report);

      expect(analytics.totalTokens).toBe(tokens.length);
      expect(analytics.unusedTokens).toBeGreaterThan(0);
      expect(analytics.coverage.tokenCoverage).toBeLessThan(100);
    });

    it('should generate refactoring suggestions', async () => {
      const tokens = [
        makeColorToken('unused.token', '#000000'),
        makeColorToken('rarely.used', '#111111'),
      ];

      const report = await usageTracker.scanForTokenUsage([], tokens);
      const suggestions = await usageTracker.generateRefactoringSuggestions(report);

      const removeUnused = suggestions.find(s => s.type === 'remove');
      expect(removeUnused).toBeDefined();
      expect(removeUnused!.affectedTokens).toContain('unused.token');
    });
  });

  describe('End-to-End Scenarios', () => {
    it.concurrent('should migrate Bootstrap to Tailwind', async () => {
      const bootstrapTokens = new TokenSetBuilder()
        .addColor('$primary', '#007bff')
        .addColor('$secondary', '#6c757d')
        .addSpacing('$spacer', '1rem')
        .addBorderRadius('$border-radius', '0.25rem')
        .build();

      const context = makeMigrationContext('bootstrap', 'tailwind');
      
      // Transform tokens
      const transformer = new BaseTokenTransformer();
      const transformed = await transformer.transformTokens(bootstrapTokens, context);

      // Generate Tailwind config
      const converterRegistry = new TokenFormatConverterRegistry();
      const config = await converterRegistry.convert(
        transformed,
        TokenFormat.TAILWIND_CONFIG
      );

      expect(config).toMatchSnapshot('bootstrap-to-tailwind-config');
    });

    it.concurrent('should migrate Material Design to CSS Custom Properties', async () => {
      const materialTokens = new TokenSetBuilder()
        .addColor('md.sys.color.primary', '#6750a4')
        .addColor('md.sys.color.on-primary', '#ffffff')
        .addBorderRadius('md.sys.shape.corner.small', '8px')
        .build();

      const context = makeMigrationContext('material', 'css', {
        options: { prefix: 'md' },
      });

      // Transform and convert
      const transformer = new BaseTokenTransformer();
      const transformed = await transformer.transformTokens(materialTokens, context);

      const converterRegistry = new TokenFormatConverterRegistry();
      const css = await converterRegistry.convert(
        transformed,
        TokenFormat.CSS_VARIABLES
      );

      expect(css).toMatchSnapshot('material-to-css-variables');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large token sets efficiently', async () => {
      const builder = new TokenSetBuilder();
      for (let i = 0; i < 1000; i++) {
        builder.addColor(`generated.color.${i}`, `#${i.toString(16).padStart(6, '0')}`);
      }
      const tokens = builder.build();

      const transformer = new BaseTokenTransformer();
      const { duration } = await measureExecutionTime(
        () => transformer.transformTokens(
          tokens,
          makeMigrationContext('custom', 'tailwind')
        )
      );

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should process files concurrently', async () => {
      const tokens = createBasicColorTokens();
      const contexts = [
        makeMigrationContext('custom', 'tailwind'),
        makeMigrationContext('custom', 'chakra'),
        makeMigrationContext('custom', 'mui'),
      ];

      const transformer = new BaseTokenTransformer();
      const { duration } = await measureExecutionTime(
        () => Promise.all(
          contexts.map(ctx => transformer.transformTokens(tokens, ctx))
        )
      );

      // Concurrent processing should be faster than sequential
      expect(duration).toBeLessThan(300);
    });
  });
});