#!/usr/bin/env node

import { UIKitAdapter, AdapterConfig, ComponentMapping, ValidationResult } from './UIKitAdapter';
import { ComponentConfig, StyleConfig, TokenConfig } from '../types/AdapterTypes';

// More realistic mock adapter simulating real UI kit integration
class RealisticMockAdapter extends UIKitAdapter {
  private componentMappings = {
    Button: {
      primary: { className: 'btn-primary', role: 'button' },
      secondary: { className: 'btn-secondary', role: 'button' },
      danger: { className: 'btn-danger', role: 'button' }
    },
    Input: {
      text: { type: 'text', className: 'input-text' },
      password: { type: 'password', className: 'input-password' },
      email: { type: 'email', className: 'input-email' }
    }
  };

  async initialize(): Promise<void> {
    // Simulate async initialization (loading resources, configs, etc.)
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Validate required configurations
    if (!this.config.options?.theme) {
      throw new Error('Theme configuration is required');
    }
  }

  mapComponent(componentName: string, props: Record<string, any>): ComponentMapping {
    const mappings = this.componentMappings[componentName];
    if (!mappings) {
      throw new Error(`Unsupported component: ${componentName}`);
    }

    const variant = props.variant || 'primary';
    const variantMapping = mappings[variant];
    
    if (!variantMapping) {
      throw new Error(`Unsupported variant "${variant}" for ${componentName}`);
    }

    // Realistic prop transformation
    const transformedProps = {
      ...props,
      className: `${variantMapping.className} ${props.className || ''}`.trim(),
      'data-theme': this.config.options?.theme,
    };

    // Remove variant from final props as it's been transformed
    delete transformedProps.variant;

    // Add accessibility props
    if (variantMapping.role) {
      transformedProps.role = variantMapping.role;
    }

    return {
      component: componentName,
      props: transformedProps,
    };
  }

  translateStyles(styles: StyleConfig): Record<string, any> {
    const translated: any = {};

    // Translate base styles
    if (styles.base) {
      translated.base = this.translateStyleObject(styles.base);
    }

    // Translate variants
    if (styles.variants) {
      translated.variants = {};
      for (const [key, value] of Object.entries(styles.variants)) {
        translated.variants[key] = this.translateStyleObject(value);
      }
    }

    // Translate responsive styles
    if (styles.responsive) {
      translated['@media'] = {};
      const breakpoints = {
        xs: '0px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      };

      for (const [breakpoint, breakpointStyles] of Object.entries(styles.responsive)) {
        if (breakpoints[breakpoint]) {
          translated['@media'][`(min-width: ${breakpoints[breakpoint]})`] = 
            this.translateStyleObject(breakpointStyles);
        }
      }
    }

    // Handle dark mode
    if (styles.dark) {
      translated['@media']['(prefers-color-scheme: dark)'] = 
        this.translateStyleObject(styles.dark);
    }

    return translated;
  }

  private translateStyleObject(styles: Record<string, any>): Record<string, any> {
    const translated = {};
    
    // Simulate CSS-in-JS to utility class conversion
    for (const [key, value] of Object.entries(styles)) {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      translated[cssKey] = value;
    }

    return translated;
  }

  convertTokens(tokens: TokenConfig): Record<string, any> {
    const converted: any = {
      ':root': {}
    };

    // Convert colors
    if (tokens.colors) {
      for (const [colorName, colorValue] of Object.entries(tokens.colors)) {
        if (typeof colorValue === 'object') {
          // Handle color scales or color groups
          for (const [shade, hex] of Object.entries(colorValue)) {
            converted[':root'][`--color-${colorName}-${shade}`] = hex;
          }
        } else if (typeof colorValue === 'string') {
          converted[':root'][`--color-${colorName}`] = colorValue;
        }
      }
    }

    // Convert typography
    if (tokens.typography) {
      if (tokens.typography.fontFamily) {
        for (const [name, value] of Object.entries(tokens.typography.fontFamily)) {
          converted[':root'][`--font-${name}`] = value;
        }
      }
      if (tokens.typography.fontSize) {
        for (const [size, value] of Object.entries(tokens.typography.fontSize)) {
          converted[':root'][`--text-${size}`] = value;
        }
      }
    }

    // Convert spacing
    if (tokens.spacing) {
      for (const [size, value] of Object.entries(tokens.spacing)) {
        converted[':root'][`--spacing-${size}`] = value;
      }
    }

    return converted;
  }

  validateConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!this.config.name) {
      errors.push('Adapter name is required');
    }

    if (!this.config.version) {
      errors.push('Adapter version is required');
    }

    // Validate version format
    if (this.config.version && !/^\d+\.\d+\.\d+/.test(this.config.version)) {
      warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
    }

    // Validate theme configuration
    if (!this.config.options?.theme) {
      warnings.push('No theme specified, defaulting to "light"');
    }

    // Check for deprecated options
    if (this.config.options?.legacyMode) {
      warnings.push('legacyMode is deprecated and will be removed in v2.0.0');
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
      supportsRTL: this.config.options?.rtl !== false,
      supportsAccessibility: true,
      supportsDarkMode: true,
      supportsResponsive: true,
      customCapabilities: {
        supportsAnimations: true,
        supportsCustomProperties: true,
        supportsCSSinJS: false,
      }
    };
  }

  protected getSupportedComponents(): string[] {
    return Object.keys(this.componentMappings);
  }
}

// Comprehensive test suite
async function runRealisticTests() {
  console.log('Running realistic UIKitAdapter tests...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Valid configuration
  try {
    console.log('Test 1: Valid configuration');
    const config: AdapterConfig = {
      name: 'RealisticAdapter',
      version: '1.2.3',
      options: {
        theme: 'light',
        rtl: true,
      },
    };

    const adapter = new RealisticMockAdapter(config);
    await adapter.initialize();
    console.log('✓ Valid configuration accepted\n');
    passed++;
  } catch (e) {
    console.log('✗ Valid configuration test failed:', e.message, '\n');
    failed++;
  }

  // Test 2: Invalid configuration
  try {
    console.log('Test 2: Invalid configuration handling');
    const config: AdapterConfig = {
      name: 'BadAdapter',
      version: 'invalid-version',
      options: {},
    };

    const adapter = new RealisticMockAdapter(config);
    const validation = adapter.validateConfig();
    
    if (!validation.valid || validation.warnings?.length > 0) {
      console.log('✓ Invalid configuration detected');
      console.log('  Warnings:', validation.warnings);
      passed++;
    } else {
      throw new Error('Should have detected configuration issues');
    }
    console.log();
  } catch (e) {
    console.log('✗ Invalid configuration test failed:', e.message, '\n');
    failed++;
  }

  // Test 3: Component mapping with variants
  try {
    console.log('Test 3: Component mapping with variants');
    const adapter = new RealisticMockAdapter({
      name: 'Test',
      version: '1.0.0',
      options: { theme: 'dark' },
    });

    const primaryButton = adapter.mapComponent('Button', {
      variant: 'primary',
      onClick: () => {},
      className: 'custom-class',
    });

    const dangerButton = adapter.mapComponent('Button', {
      variant: 'danger',
      disabled: true,
    });

    if (
      primaryButton.props.className === 'btn-primary custom-class' &&
      primaryButton.props['data-theme'] === 'dark' &&
      dangerButton.props.className === 'btn-danger' &&
      dangerButton.props.disabled === true
    ) {
      console.log('✓ Component variants mapped correctly');
      passed++;
    } else {
      throw new Error('Component mapping incorrect');
    }
    console.log();
  } catch (e) {
    console.log('✗ Component mapping test failed:', e.message, '\n');
    failed++;
  }

  // Test 4: Unsupported component handling
  try {
    console.log('Test 4: Unsupported component handling');
    const adapter = new RealisticMockAdapter({
      name: 'Test',
      version: '1.0.0',
      options: { theme: 'light' },
    });

    try {
      adapter.mapComponent('UnsupportedComponent', {});
      throw new Error('Should have thrown for unsupported component');
    } catch (e) {
      if (e.message.includes('Unsupported component')) {
        console.log('✓ Unsupported component error thrown correctly');
        passed++;
      } else {
        throw e;
      }
    }
    console.log();
  } catch (e) {
    console.log('✗ Unsupported component test failed:', e.message, '\n');
    failed++;
  }

  // Test 5: Style translation with responsive and dark mode
  try {
    console.log('Test 5: Style translation with responsive and dark mode');
    const adapter = new RealisticMockAdapter({
      name: 'Test',
      version: '1.0.0',
      options: { theme: 'light' },
    });

    const styles: StyleConfig = {
      base: {
        backgroundColor: 'white',
        fontSize: '16px',
      },
      responsive: {
        md: {
          fontSize: '18px',
        },
        lg: {
          fontSize: '20px',
        },
      },
      dark: {
        backgroundColor: 'black',
        color: 'white',
      },
    };

    const translated = adapter.translateStyles(styles);
    
    if (
      translated.base['background-color'] === 'white' &&
      translated['@media']['(min-width: 768px)']['font-size'] === '18px' &&
      translated['@media']['(prefers-color-scheme: dark)']['background-color'] === 'black'
    ) {
      console.log('✓ Styles translated correctly with responsive and dark mode');
      passed++;
    } else {
      throw new Error('Style translation incorrect');
    }
    console.log();
  } catch (e) {
    console.log('✗ Style translation test failed:', e.message, '\n');
    failed++;
  }

  // Test 6: Token conversion
  try {
    console.log('Test 6: Design token conversion');
    const adapter = new RealisticMockAdapter({
      name: 'Test',
      version: '1.0.0',
      options: { theme: 'light' },
    });

    const tokens: TokenConfig = {
      colors: {
        primary: {
          '500': '#3B82F6',
          '600': '#2563EB',
        },
        background: {
          default: '#FFFFFF',
          paper: '#F5F5F5',
        },
      },
      typography: {
        fontFamily: {
          sans: 'Inter, sans-serif',
          mono: 'Fira Code, monospace',
        },
        fontSize: {
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
        },
      },
      spacing: {
        '0': '0px',
        '1': '0.25rem',
        '2': '0.5rem',
        '4': '1rem',
      },
    };

    const converted = adapter.convertTokens(tokens);
    
    if (
      converted[':root']['--color-primary-500'] === '#3B82F6' &&
      converted[':root']['--font-sans'] === 'Inter, sans-serif' &&
      converted[':root']['--text-base'] === '1rem' &&
      converted[':root']['--spacing-4'] === '1rem'
    ) {
      console.log('✓ Design tokens converted correctly');
      passed++;
    } else {
      throw new Error('Token conversion incorrect');
    }
    console.log();
  } catch (e) {
    console.log('✗ Token conversion test failed:', e.message, '\n');
    failed++;
  }

  // Summary
  console.log(`==================`);
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`==================`);

  process.exit(failed > 0 ? 1 : 0);
}

runRealisticTests();