#!/usr/bin/env node

import { UIKitAdapter, AdapterConfig, ComponentMapping, ValidationResult } from '../UIKitAdapter';
import { ComponentConfig, StyleConfig, TokenConfig } from '../../types/AdapterTypes';

// Mock implementation for testing
class MockAdapter extends UIKitAdapter {
  async initialize(): Promise<void> {
    console.log('✓ Adapter initialized');
  }

  mapComponent(componentName: string, props: Record<string, any>): ComponentMapping {
    return {
      component: `Mock${componentName}`,
      props: { ...props, mockProp: true },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, any> {
    return {
      ...styles,
      translated: true,
    };
  }

  convertTokens(tokens: TokenConfig): Record<string, any> {
    return {
      colors: tokens.colors,
      converted: true,
    };
  }

  validateConfig(): ValidationResult {
    return {
      valid: true,
    };
  }

  protected getCapabilities() {
    return {
      supportsTheming: true,
      supportsRTL: true,
      supportsAccessibility: true,
      supportsDarkMode: true,
      supportsResponsive: true,
    };
  }

  protected getSupportedComponents(): string[] {
    return ['Button', 'Input', 'Select'];
  }
}

// Test runner
async function runTests() {
  console.log('Running UIKitAdapter tests...\n');
  
  const config: AdapterConfig = {
    name: 'MockAdapter',
    version: '1.0.0',
    options: {
      theme: 'light',
    },
  };

  const adapter = new MockAdapter(config);
  let passed = 0;
  let failed = 0;

  // Test 1: Metadata
  try {
    const metadata = adapter.getMetadata();
    if (metadata.name === 'MockAdapter' && metadata.version === '1.0.0') {
      console.log('✓ Metadata test passed');
      passed++;
    } else {
      throw new Error('Metadata mismatch');
    }
  } catch (e) {
    console.log('✗ Metadata test failed:', e.message);
    failed++;
  }

  // Test 2: Initialize
  try {
    await adapter.initialize();
    passed++;
  } catch (e) {
    console.log('✗ Initialize test failed:', e.message);
    failed++;
  }

  // Test 3: Component mapping
  try {
    const mapping = adapter.mapComponent('Button', { variant: 'primary' });
    if (mapping.component === 'MockButton' && mapping.props.mockProp === true) {
      console.log('✓ Component mapping test passed');
      passed++;
    } else {
      throw new Error('Component mapping incorrect');
    }
  } catch (e) {
    console.log('✗ Component mapping test failed:', e.message);
    failed++;
  }

  // Test 4: Style translation
  try {
    const styles: StyleConfig = {
      base: { color: 'blue' },
      variants: { primary: { background: 'red' } },
    };
    const translated = adapter.translateStyles(styles);
    if (translated.translated === true) {
      console.log('✓ Style translation test passed');
      passed++;
    } else {
      throw new Error('Style translation failed');
    }
  } catch (e) {
    console.log('✗ Style translation test failed:', e.message);
    failed++;
  }

  // Test 5: Token conversion
  try {
    const tokens: TokenConfig = {
      colors: {
        primary: { 500: '#3B82F6' },
      },
    };
    const converted = adapter.convertTokens(tokens);
    if (converted.converted === true && converted.colors) {
      console.log('✓ Token conversion test passed');
      passed++;
    } else {
      throw new Error('Token conversion failed');
    }
  } catch (e) {
    console.log('✗ Token conversion test failed:', e.message);
    failed++;
  }

  // Test 6: Validation
  try {
    const result = adapter.validateConfig();
    if (result.valid === true) {
      console.log('✓ Validation test passed');
      passed++;
    } else {
      throw new Error('Validation failed');
    }
  } catch (e) {
    console.log('✗ Validation test failed:', e.message);
    failed++;
  }

  // Summary
  console.log(`\n==================`);
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`==================`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();