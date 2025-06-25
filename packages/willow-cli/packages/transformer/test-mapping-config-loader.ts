#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MappingConfigLoader } from './src/loaders/mapping-config-loader';
import type { ComponentMappingConfig } from './src/schemas/component-mapping.schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Mapping Config Loader...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      testsFailed++;
    }
  })();
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

const loader = new MappingConfigLoader();

// Test config
const testConfig: ComponentMappingConfig = {
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
        },
      ],
    },
  ],
};

// Run tests
(async () => {
  // Test Load from Object
  await test('load from object', async () => {
    const result = await loader.load({
      type: 'object',
      config: testConfig,
    });
    
    assert(result.success === true, 'Should load successfully');
    assert(result.config !== undefined, 'Should have config');
    assert(result.config.version === '1.0.0', 'Should have correct version');
    assert(result.errors.length === 0, 'Should have no errors');
  });

  // Test Load from JSON
  await test('load from JSON string', async () => {
    const result = await loader.load({
      type: 'json',
      content: JSON.stringify(testConfig),
    });
    
    assert(result.success === true, 'Should load successfully');
    assert(result.config !== undefined, 'Should have config');
    assert(result.config.mappings.length === 1, 'Should have mappings');
  });

  // Test Invalid JSON
  await test('handle invalid JSON', async () => {
    const result = await loader.load({
      type: 'json',
      content: '{ invalid json }',
    });
    
    assert(result.success === false, 'Should fail to load');
    assert(result.errors.length > 0, 'Should have errors');
    assert(result.errors[0].includes('JSON parse error'), 'Should have JSON parse error');
  });

  // Test Load from File
  await test('load from file', async () => {
    const tempFile = path.join(__dirname, 'test-config.json');
    fs.writeFileSync(tempFile, JSON.stringify(testConfig));
    
    try {
      const result = await loader.load({
        type: 'file',
        path: tempFile,
      });
      
      assert(result.success === true, 'Should load successfully');
      assert(result.config !== undefined, 'Should have config');
      assert(result.metadata?.fileSize !== undefined, 'Should have file size metadata');
      assert(result.metadata?.lastModified !== undefined, 'Should have last modified metadata');
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  // Test File Not Found
  await test('handle file not found', async () => {
    const result = await loader.load({
      type: 'file',
      path: '/non/existent/file.json',
    });
    
    assert(result.success === false, 'Should fail to load');
    assert(result.errors.some(e => e.includes('File not found')), 'Should have file not found error');
  });

  // Test Validation
  await test('validate configuration', async () => {
    const invalidConfig = {
      version: 'invalid-version',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [],
    };
    
    const result = await loader.load({
      type: 'object',
      config: invalidConfig as any,
    }, { validate: true });
    
    assert(result.success === false, 'Should fail validation');
    assert(result.errors.length > 0, 'Should have validation errors');
  });

  // Test Skip Validation
  await test('skip validation when requested', async () => {
    const invalidConfig = {
      version: 'invalid-version',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [],
    };
    
    const result = await loader.load({
      type: 'object',
      config: invalidConfig as any,
    }, { validate: false });
    
    assert(result.success === true, 'Should succeed without validation');
  });

  // Test Cache
  await test('cache loaded configurations', async () => {
    const source = { type: 'object' as const, config: testConfig };
    
    const result1 = await loader.load(source, { cache: true });
    const result2 = await loader.load(source, { cache: true });
    
    assert(result1 === result2, 'Should return cached result');
    
    loader.clearCache();
    
    const result3 = await loader.load(source, { cache: true });
    assert(result3 !== result2, 'Should return new result after cache clear');
  });

  // Test Merge Configurations
  await test('merge multiple configurations', () => {
    const config1: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'WillowButton',
          props: [{ source: 'color', target: 'variant' }],
        },
      ],
    };
    
    const config2: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'TextField',
          targetComponent: 'WillowInput',
          props: [{ source: 'variant', target: 'appearance' }],
        },
      ],
    };
    
    const merged = loader.mergeConfigs([config1, config2]);
    
    assert(merged.mappings.length === 2, 'Should have both mappings');
    assert(merged.mappings.some(m => m.sourceComponent === 'Button'), 'Should have Button mapping');
    assert(merged.mappings.some(m => m.sourceComponent === 'TextField'), 'Should have TextField mapping');
  });

  // Test Merge with Replace Strategy
  await test('merge with replace strategy', () => {
    const config1: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'OldButton',
          props: [],
        },
      ],
    };
    
    const config2: ComponentMappingConfig = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'NewButton',
          props: [],
        },
      ],
    };
    
    const merged = loader.mergeConfigs([config1, config2], { mappings: 'replace' });
    
    assert(merged.mappings.length === 1, 'Should have only last mapping');
    assert(merged.mappings[0].targetComponent === 'NewButton', 'Should use last mapping');
  });

  // Test Find Config
  await test('find configuration file', async () => {
    const tempDir = path.join(__dirname, 'test-find-config');
    const configFile = path.join(tempDir, 'component-mapping.json');
    
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify(testConfig));
    
    try {
      const found = await loader.findConfig(tempDir);
      assert(found !== null, 'Should find config file');
      assert(found === configFile, 'Should find correct config file');
    } finally {
      fs.unlinkSync(configFile);
      fs.rmdirSync(tempDir);
    }
  });

  // Test Find Config Not Found
  await test('handle config file not found', async () => {
    const tempDir = path.join(__dirname, 'test-no-config');
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      const found = await loader.findConfig(tempDir);
      assert(found === null, 'Should not find config file');
    } finally {
      fs.rmdirSync(tempDir);
    }
  });

  // Test Transformers
  await test('apply transformers to configuration', async () => {
    const transformer = (config: ComponentMappingConfig) => {
      return {
        ...config,
        mappings: config.mappings.map(m => ({
          ...m,
          targetComponent: `Transformed${m.targetComponent}`,
        })),
      };
    };
    
    const result = await loader.load({
      type: 'object',
      config: testConfig,
    }, {
      transformers: { addPrefix: transformer },
    });
    
    assert(result.success === true, 'Should load successfully');
    assert(result.config?.mappings[0].targetComponent === 'TransformedWillowButton', 'Should apply transformer');
  });

  // Test Export Configuration
  await test('export configuration to file', async () => {
    const exportPath = path.join(__dirname, 'exported-config.json');
    
    try {
      await loader.export(testConfig, exportPath);
      
      assert(fs.existsSync(exportPath), 'Should create export file');
      
      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
      assert(exported.version === testConfig.version, 'Should export correct config');
    } finally {
      if (fs.existsSync(exportPath)) {
        fs.unlinkSync(exportPath);
      }
    }
  });

  // Test Load with Fallback
  await test('load with fallback paths', async () => {
    const fallbackFile = path.join(__dirname, 'component-mapping.json');
    fs.writeFileSync(fallbackFile, JSON.stringify(testConfig));
    
    try {
      const result = await loader.loadWithFallback({
        type: 'file',
        path: '/non/existent/primary.json',
      }, {
        fallbackPaths: [fallbackFile],
      });
      
      assert(result.success === true, 'Should load from fallback');
      assert(result.warnings.some(w => w.includes('fallback')), 'Should have fallback warning');
    } finally {
      fs.unlinkSync(fallbackFile);
    }
  });

  // Test Validate Config Schema
  await test('validate configuration schema', () => {
    const validResult = loader.validateConfig(testConfig);
    assert(validResult.success === true, 'Should validate valid config');
    
    const invalidResult = loader.validateConfig({ invalid: 'config' });
    assert(invalidResult.success === false, 'Should not validate invalid config');
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed + testsFailed} tests`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All mapping config loader tests passed!');
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();