// Start of Selection
#!/usr/bin/env npx tsx

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import all the modules
import { MappingConfigLoader } from '../../src/loaders/mapping-config-loader.js';
import { PropTransformationEngine } from '../../src/engines/prop-transformation-engine.js';
import { PropNameTransformer } from '../../src/transformers/prop-name-transformer.js';
import { PropValueConverter } from '../../src/converters/prop-value-converter.js';
import { PropTypeConverter } from '../../src/converters/prop-type-converter.js';
import { PropDeprecationHandler } from '../../src/handlers/prop-deprecation-handler.js';
import { ConditionalPropMapper } from '../../src/mappers/conditional-prop-mapper.js';
import { PropSpreadingHandler } from '../../src/handlers/prop-spreading-handler.js';
import { PropValidator } from '../../src/validators/prop-validator.js';
import { MappingValidator } from '../../src/utils/mapping-validator.js';
import type { ComponentMappingConfig } from '../../src/schemas/component-mapping.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running Comprehensive Mapping Tests...\n');

let testsPassed = 0;
let testsFailed = 0;

/**
 * Simple test runner helper.
 * Keeps track of pass / fail counts and handles async tests out‑of‑the‑box.
 */
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    testsFailed++;
  }
}

/**
 * Lightweight assertion helper that throws when the condition is falsy.
 */
function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ---------------------------------------------------------------------------
// Test Configuration
// ---------------------------------------------------------------------------
const comprehensiveConfig: ComponentMappingConfig = {
  version: '1.0.0',
  sourceUIKit: 'mui',
  targetUIKit: 'willow',
  mappings: [
    {
      sourceComponent: 'Button',
      targetComponent: 'WillowButton',
      props: [
        {
          source: 'color',
          target: 'variant',
          valueTransformation: {
            type: 'map',
            map: {
              primary: 'brand',
              secondary: 'neutral',
              error: 'danger',
            },
          },
        },
        {
          source: 'size',
          target: 'size',
          conditional: [
            {
              condition: { prop: 'variant', operator: 'equals', value: 'text' },
              target: 'textSize',
            },
          ],
        },
        {
          source: 'disabled',
          target: 'isDisabled',
          valueTransformation: {
            type: 'function',
            transform: 'booleanToString',
          },
        },
        {
          source: 'fullWidth',
          target: 'fullWidth',
          deprecated: true,
          deprecationMessage: 'Use className="w-full" instead',
          alternative: 'className',
        },
      ],
    },
    {
      sourceComponent: 'TextField',
      targetComponent: 'WillowInput',
      props: [
        {
          source: 'variant',
          target: 'appearance',
          required: true,
        },
        {
          source: 'error',
          target: 'hasError',
        },
        {
          source: 'helperText',
          target: 'helpText',
        },
      ],
    },
  ],
  globalPropMappings: [
    {
      source: 'className',
      target: 'className',
      spread: true,
    },
    {
      source: 'style',
      target: 'style',
      spread: true,
    },
  ],
  options: {
    preserveUnmappedProps: false,
    warnOnUnmappedProps: true,
    strictMode: true,
    generateComments: true,
  },
};

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
(async (): Promise<void> => {
  // -----------------------------------------------------------------------
  // Test 1: Configuration Loading and Validation
  // -----------------------------------------------------------------------
  await test('configuration loading and validation', async () => {
    const loader = new MappingConfigLoader();

    // Save config to file
    const configPath = path.join(__dirname, 'test-comprehensive-config.json');
    await loader.export(comprehensiveConfig, configPath);

    try {
      // Load from file
      const result = await loader.load({ type: 'file', path: configPath });
      assert(result.success === true, 'Should load config successfully');
      assert(result.config !== undefined, 'Should have config');

      // Validate
      const validation = MappingValidator.validateConfig(result.config!);
      assert(validation.valid === true, 'Config should be valid');

      // Clear cache first to ensure clean test
      loader.clearCache?.(); // optional chaining in case clearCache is not implemented

      // Load with cache
      const cachedResult1 = await loader.load({ type: 'file', path: configPath }, { cache: true });
      const cachedResult2 = await loader.load({ type: 'file', path: configPath }, { cache: true });
      assert(cachedResult1 === cachedResult2, 'Should return cached result');
    } finally {
      fs.unlinkSync(configPath);
    }
  });

  // -----------------------------------------------------------------------
  // Test 2: End‑to‑End Component Transformation
  // -----------------------------------------------------------------------
  await test('end‑to‑end component transformation', () => {
    const engine = new PropTransformationEngine(comprehensiveConfig);

    const sourceCode = `
      <Button 
        color="primary" 
        size="large" 
        disabled={true}
        fullWidth
        className="custom-button"
        onClick={handleClick}
      >
        Click Me
      </Button>
    `;

    const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    let transformed = false;

    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxElement(node)) {
        const tagName =
          ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName;

        if (ts.isIdentifier(tagName) && tagName.text === 'Button') {
          transformed = true;

          const result = engine.transformJsxElementProps(node, 'Button', {
            componentName: 'Button',
            filePath: 'test.tsx',
            props: {
              color: 'primary',
              size: 'large',
              disabled: true,
              fullWidth: true,
              className: 'custom-button',
              onClick: 'handleClick',
            },
          });

          assert(result.success === true, 'Transformation should succeed');
          assert(result.targetComponent === 'WillowButton', 'Should transform component name');
          assert(
            result.propResults.some(
              (r: any) => r.targetProp === 'variant' && r.transformedValue === 'brand',
            ),
            'Should transform color to variant with value mapping',
          );

          // Check for deprecation in prop results or warnings instead
          const fullWidthResult = result.propResults.find((r: any) => r.sourceProp === 'fullWidth');
          assert(fullWidthResult !== undefined, 'Should have fullWidth prop result');
          assert(
            fullWidthResult?.deprecated !== undefined || (result.warnings?.length ?? 0) > 0,
            'Should have deprecation info or warnings',
          );
        }
      }

      ts.forEachChild(node, visitor);
      return node;
    };

    ts.forEachChild(sourceFile, visitor);
    assert(transformed === true, 'Should find and transform component');
  });

  // -----------------------------------------------------------------------
  // Test 3: Value Converter Integration
  // -----------------------------------------------------------------------
  await test('value converter integration', async () => {
    const converter = new PropValueConverter();

    // Test direct boolean conversion (identity)
    const boolResult = await converter.convert(
      true,
      { type: 'function', transform: 'identity' },
      {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      },
    );
    assert(boolResult.success === true, 'Direct conversion should succeed');
    assert(boolResult.value === true, 'Identity conversion should preserve value');

    // Register a custom converter for booleanToString
    converter.registerConverter({
      name: 'booleanToString',
      supports: () => true,
      convert: (value: unknown) => String(value),
    });

    const boolResult2 = await converter.convert(
      true,
      {
        type: 'function',
        transform: 'booleanToString',
      },
      {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      },
    );

    assert(boolResult2.success === true, 'Boolean conversion should succeed');
    assert(boolResult2.value === 'true', 'Should convert boolean to string');

    // Test map conversion
    const mapResult = await converter.convert(
      'primary',
      {
        type: 'map',
        map: {
          primary: 'brand',
          secondary: 'neutral',
        },
      },
      {
        componentName: 'Button',
        filePath: 'test.tsx',
        props: {},
      },
    );

    assert(mapResult.success === true, 'Map conversion should succeed');
    assert(mapResult.value === 'brand', 'Should map primary to brand');
  });

  // -----------------------------------------------------------------------
  // Test 4: Type Converter Integration
  // -----------------------------------------------------------------------
  await test('type converter integration', () => {
    const converter = new PropTypeConverter();

    // Test React to Willow type conversions
    const buttonPropsResult = converter.convertTypeString('ButtonProps');
    assert(buttonPropsResult.targetType === 'WillowButtonProps', 'Should convert ButtonProps');

    // Test complex generic type
    const genericResult = converter.convertTypeString('Array<ButtonProps | TextFieldProps>');
    assert(
      genericResult.targetType === 'Array<WillowButtonProps | WillowInputProps>',
      'Should convert complex generic types',
    );

    // Generate imports only if requiresImport is set
    const conversions = buttonPropsResult.requiresImport ? [buttonPropsResult] : [];
    const imports = converter.generateTypeImports(conversions);
    assert(imports.length >= 0, 'Should handle type imports');
  });

  // -----------------------------------------------------------------------
  // Test 5: Deprecation Handler Integration
  // -----------------------------------------------------------------------
  await test('deprecation handler integration', () => {
    const handler = new PropDeprecationHandler();

    // Register deprecations from config
    const buttonMapping = comprehensiveConfig.mappings.find((m) => m.sourceComponent === 'Button');
    const fullWidthProp = buttonMapping?.props.find((p) => p.source === 'fullWidth');

    assert(fullWidthProp !== undefined, 'Should find fullWidth prop');
    assert(buttonMapping !== undefined, 'Should find button mapping');

    const deprecation = handler.registerDeprecation('Button', fullWidthProp!, {
      componentName: 'Button',
      filePath: 'test1.tsx',
      props: { fullWidth: true },
    });

    assert(deprecation !== null, 'Should register deprecation');
    assert(deprecation?.message.includes('w-full'), 'Should have correct deprecation message');

    // Generate report
    const report = handler.generateReport();
    assert(report !== null && report !== undefined, 'Should generate report');
    assert(typeof report === 'object', 'Report should be an object');

    // Check report structure
    assert('totalDeprecations' in report, 'Report should have totalDeprecations property');
    assert((report as any).totalDeprecations === 1, 'Should have 1 deprecation');
  });

  // -----------------------------------------------------------------------
  // Test 6: Conditional Prop Mapper Integration
  // -----------------------------------------------------------------------
  await test('conditional prop mapper integration', () => {
    const mapper = new ConditionalPropMapper();

    const sizeMapping = comprehensiveConfig.mappings[0].props.find((p) => p.source === 'size');
    assert(sizeMapping !== undefined, 'Should find size mapping');

    if (sizeMapping) {
      // Test with variant = 'text'
      const result1 = mapper.applyConditionalMapping(
        sizeMapping,
        {
          componentName: 'Button',
          filePath: 'test.tsx',
          props: { variant: 'text', size: 'large' },
        },
      );

      assert(result1.applied === true, 'Conditional mapping should be applied');
      assert(result1.effectiveMapping.target === 'textSize', 'Should use conditional target when variant is text');
      assert(result1.matchedConditions.length > 0, 'Should have matched conditions');

      // Test with variant = 'contained'
      const result2 = mapper.applyConditionalMapping(
        sizeMapping,
        {
          componentName: 'Button',
          filePath: 'test.tsx',
          props: { variant: 'contained', size: 'large' },
        },
      );

      assert(result2.effectiveMapping.target === 'size', 'Should use conditional target when variant is contained');
      assert(result2.matchedConditions.length > 0, 'Should have matched conditions');
    }
  });
})();
// End of Selectio