#!/usr/bin/env node

import { UIKitAdapter, AdapterConfig, ComponentMapping, ValidationResult } from '../UIKitAdapter';
import { ComponentConfig, StyleConfig, TokenConfig } from '../../types/AdapterTypes';

// Edge case test adapter
class EdgeCaseAdapter extends UIKitAdapter {
  async initialize(): Promise<void> {
    // Test initialization with missing options
    if (!this.config.options) {
      this.config.options = {};
    }
  }

  mapComponent(componentName: string, props: Record<string, any>): ComponentMapping {
    // Handle null/undefined props
    const safeProps = props || {};
    
    // Handle special characters in component names
    const safeName = componentName.replace(/[^a-zA-Z0-9]/g, '');
    
    return {
      component: safeName,
      props: {
        ...safeProps,
        'data-original-name': componentName,
      },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, any> {
    if (!styles || typeof styles !== 'object') {
      return {};
    }

    const result: any = {};
    
    // Handle nested undefined values
    if (styles.base) {
      result.base = this.sanitizeStyles(styles.base);
    }
    
    // Handle empty responsive object
    if (styles.responsive && Object.keys(styles.responsive).length > 0) {
      result.responsive = {};
      for (const [key, value] of Object.entries(styles.responsive)) {
        if (value && typeof value === 'object') {
          result.responsive[key] = this.sanitizeStyles(value);
        }
      }
    }

    return result;
  }

  private sanitizeStyles(styles: Record<string, any>): Record<string, any> {
    const sanitized = {};
    for (const [key, value] of Object.entries(styles)) {
      // Skip undefined, null, or invalid values
      if (value !== undefined && value !== null && value !== '') {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  convertTokens(tokens: TokenConfig): Record<string, any> {
    if (!tokens || typeof tokens !== 'object') {
      return { ':root': {} };
    }

    const converted: any = { ':root': {} };
    
    // Handle deeply nested token structures
    const flattenTokens = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}-${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenTokens(value, newKey);
        } else if (value !== undefined && value !== null) {
          converted[':root'][`--${newKey}`] = String(value);
        }
      }
    };

    flattenTokens(tokens);
    return converted;
  }

  validateConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Handle completely empty config
    if (!this.config || Object.keys(this.config).length === 0) {
      errors.push('Configuration object is empty');
      return { valid: false, errors };
    }

    // Handle empty name
    if (this.config.name === '') {
      errors.push('Adapter name cannot be empty');
    }

    // Handle extremely long names
    if (this.config.name && this.config.name.length > 100) {
      warnings.push('Adapter name is unusually long (>100 characters)');
    }

    // Handle special characters in name
    if (this.config.name && /[^a-zA-Z0-9\-_]/.test(this.config.name)) {
      warnings.push('Adapter name contains special characters');
    }

    // Handle invalid version formats
    if (this.config.version === '') {
      errors.push('Version cannot be empty string');
    }

    // Check for circular references in config
    try {
      JSON.stringify(this.config);
    } catch (e) {
      errors.push('Configuration contains circular references');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
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
    // Return empty array edge case
    return this.config.options?.noComponents ? [] : ['Generic'];
  }
}

// Edge case tests
async function runEdgeCaseTests() {
  console.log('Running edge case tests for UIKitAdapter...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Empty/null configurations
  try {
    console.log('Test 1: Empty/null configurations');
    const adapter = new EdgeCaseAdapter({
      name: '',
      version: '1.0.0',
    });
    
    const validation = adapter.validateConfig();
    if (validation.errors && validation.errors.includes('Adapter name cannot be empty')) {
      console.log('✓ Empty name handled correctly');
      passed++;
    } else {
      throw new Error('Should error about empty name');
    }
  } catch (e) {
    console.log('✗ Empty configuration test failed:', e.message);
    failed++;
  }

  // Test 2: Special characters in component names
  try {
    console.log('\nTest 2: Special characters in component names');
    const adapter = new EdgeCaseAdapter({
      name: 'Test',
      version: '1.0.0',
    });
    
    const mapping = adapter.mapComponent('Button@#$%', { onClick: () => {} });
    if (mapping.component === 'Button' && mapping.props['data-original-name'] === 'Button@#$%') {
      console.log('✓ Special characters handled correctly');
      passed++;
    } else {
      throw new Error('Special characters not sanitized properly');
    }
  } catch (e) {
    console.log('✗ Special characters test failed:', e.message);
    failed++;
  }

  // Test 3: Null/undefined props
  try {
    console.log('\nTest 3: Null/undefined props');
    const adapter = new EdgeCaseAdapter({
      name: 'Test',
      version: '1.0.0',
    });
    
    const mapping1 = adapter.mapComponent('Button', null as any);
    const mapping2 = adapter.mapComponent('Button', undefined as any);
    
    if (mapping1.props && mapping2.props && typeof mapping1.props === 'object') {
      console.log('✓ Null/undefined props handled gracefully');
      passed++;
    } else {
      throw new Error('Null/undefined props caused issues');
    }
  } catch (e) {
    console.log('✗ Null/undefined props test failed:', e.message);
    failed++;
  }

  // Test 4: Empty/invalid style objects
  try {
    console.log('\nTest 4: Empty/invalid style objects');
    const adapter = new EdgeCaseAdapter({
      name: 'Test',
      version: '1.0.0',
    });
    
    const emptyStyles = adapter.translateStyles({} as StyleConfig);
    const nullStyles = adapter.translateStyles(null as any);
    const undefinedStyles = adapter.translateStyles(undefined as any);
    
    if (
      typeof emptyStyles === 'object' &&
      typeof nullStyles === 'object' &&
      typeof undefinedStyles === 'object'
    ) {
      console.log('✓ Empty/invalid styles handled correctly');
      passed++;
    } else {
      throw new Error('Style translation failed with edge cases');
    }
  } catch (e) {
    console.log('✗ Empty/invalid styles test failed:', e.message);
    failed++;
  }

  // Test 5: Deeply nested tokens
  try {
    console.log('\nTest 5: Deeply nested tokens');
    const adapter = new EdgeCaseAdapter({
      name: 'Test',
      version: '1.0.0',
    });
    
    const complexTokens: TokenConfig = {
      colors: {
        primary: {
          light: {
            '100': '#E3F2FD',
            '200': '#BBDEFB',
          },
          dark: {
            '800': '#1565C0',
            '900': '#0D47A1',
          },
        },
      },
      custom: {
        deeply: {
          nested: {
            value: 'test',
          },
        },
      },
    };
    
    const converted = adapter.convertTokens(complexTokens);
    if (
      converted[':root']['--colors-primary-light-100'] === '#E3F2FD' &&
      converted[':root']['--custom-deeply-nested-value'] === 'test'
    ) {
      console.log('✓ Deeply nested tokens converted correctly');
      passed++;
    } else {
      throw new Error('Nested token conversion failed');
    }
  } catch (e) {
    console.log('✗ Deeply nested tokens test failed:', e.message);
    failed++;
  }

  // Test 6: Very long adapter names
  try {
    console.log('\nTest 6: Very long adapter names');
    const longName = 'A'.repeat(150);
    const adapter = new EdgeCaseAdapter({
      name: longName,
      version: '1.0.0',
    });
    
    const validation = adapter.validateConfig();
    if (validation.warnings && validation.warnings.some(w => w.includes('unusually long'))) {
      console.log('✓ Long names generate appropriate warnings');
      passed++;
    } else {
      throw new Error('Long name warning not generated');
    }
  } catch (e) {
    console.log('✗ Long name test failed:', e.message);
    failed++;
  }

  // Test 7: Empty supported components
  try {
    console.log('\nTest 7: Empty supported components');
    const adapter = new EdgeCaseAdapter({
      name: 'Test',
      version: '1.0.0',
      options: { noComponents: true },
    });
    
    const components = adapter.getMetadata().supportedComponents;
    if (Array.isArray(components) && components.length === 0) {
      console.log('✓ Empty component list handled correctly');
      passed++;
    } else {
      throw new Error('Empty component list not handled');
    }
  } catch (e) {
    console.log('✗ Empty components test failed:', e.message);
    failed++;
  }

  // Test 8: Mixed valid/invalid data
  try {
    console.log('\nTest 8: Mixed valid/invalid style data');
    const adapter = new EdgeCaseAdapter({
      name: 'Test',
      version: '1.0.0',
    });
    
    const mixedStyles: StyleConfig = {
      base: {
        color: 'blue',
        background: undefined,
        padding: null,
        margin: '',
        border: '1px solid black',
      },
      responsive: {
        sm: null,
        md: {
          color: 'red',
        },
      },
    };
    
    const translated = adapter.translateStyles(mixedStyles);
    if (
      translated.base.color === 'blue' &&
      translated.base.border === '1px solid black' &&
      !('background' in translated.base) &&
      !('padding' in translated.base) &&
      !('margin' in translated.base)
    ) {
      console.log('✓ Mixed valid/invalid data filtered correctly');
      passed++;
    } else {
      throw new Error('Invalid data not filtered properly');
    }
  } catch (e) {
    console.log('✗ Mixed data test failed:', e.message);
    failed++;
  }

  // Summary
  console.log(`\n==================`);
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`==================`);

  process.exit(failed > 0 ? 1 : 0);
}

runEdgeCaseTests();