#!/usr/bin/env node

import { UIKitAdapter, AdapterConfig, ComponentMapping, ValidationResult } from './UIKitAdapter';
import { ComponentConfig, StyleConfig, TokenConfig } from '../types/AdapterTypes';

// Production-ready adapter with all features
class ProductionAdapter extends UIKitAdapter {
  private initTimeout: number = 5000;
  private componentCache = new Map<string, ComponentMapping>();
  private maxCacheSize = 10000;
  private supportedVersions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0'];
  
  async initialize(): Promise<void> {
    // Simulate network request with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Initialization timeout')), this.initTimeout);
    });
    
    const initPromise = this.performInit();
    
    try {
      await Promise.race([initPromise, timeoutPromise]);
    } catch (error) {
      if (error.message === 'Network error') {
        throw new Error('Failed to connect to UI kit CDN');
      }
      throw error;
    }
  }

  private async performInit(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate random network failure
    if (this.config.options?.simulateNetworkError) {
      throw new Error('Network error');
    }
    
    // Check version compatibility
    if (!this.checkVersionCompatibility()) {
      throw new Error(`Adapter version ${this.version} is not compatible with UI kit version ${this.config.options?.uiKitVersion}`);
    }
  }

  private checkVersionCompatibility(): boolean {
    const uiKitVersion = this.config.options?.uiKitVersion;
    if (!uiKitVersion) return true;
    
    // Semantic version compatibility check
    const adapterMajor = parseInt(this.version.split('.')[0]);
    const uiKitMajor = parseInt(uiKitVersion.split('.')[0]);
    
    // Major version must match
    return adapterMajor === uiKitMajor;
  }

  mapComponent(componentName: string, props: Record<string, any>): ComponentMapping {
    // Check cache first for performance
    const cacheKey = `${componentName}:${JSON.stringify(props)}`;
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }
    
    // Check cache size to prevent memory issues
    if (this.componentCache.size >= this.maxCacheSize) {
      // Clear oldest entries (simple FIFO)
      const firstKey = this.componentCache.keys().next().value;
      this.componentCache.delete(firstKey);
    }
    
    // Perform mapping with accessibility enhancements
    const mapping = this.performMapping(componentName, props);
    
    // Cache the result
    this.componentCache.set(cacheKey, mapping);
    
    return mapping;
  }

  private performMapping(componentName: string, props: Record<string, any>): ComponentMapping {
    const accessibilityProps = this.enhanceAccessibility(componentName, props);
    
    return {
      component: componentName,
      props: {
        ...props,
        ...accessibilityProps,
        'data-testid': props.testId || `${componentName.toLowerCase()}-component`,
      },
    };
  }

  private enhanceAccessibility(componentName: string, props: Record<string, any>): Record<string, any> {
    const a11yProps: Record<string, any> = {};
    
    switch (componentName) {
      case 'Button':
        if (!props['aria-label'] && !props.children) {
          a11yProps['aria-label'] = 'Button';
        }
        if (props.loading) {
          a11yProps['aria-busy'] = 'true';
          a11yProps['aria-disabled'] = 'true';
        }
        break;
        
      case 'Input':
        if (!props['aria-label'] && !props['aria-labelledby']) {
          a11yProps['aria-label'] = props.placeholder || 'Input field';
        }
        if (props.error) {
          a11yProps['aria-invalid'] = 'true';
          a11yProps['aria-describedby'] = props.errorId || 'input-error';
        }
        break;
        
      case 'Modal':
        a11yProps['role'] = 'dialog';
        a11yProps['aria-modal'] = 'true';
        if (!props['aria-labelledby']) {
          a11yProps['aria-label'] = 'Modal dialog';
        }
        break;
        
      case 'Tabs':
        a11yProps['role'] = 'tablist';
        if (props.orientation) {
          a11yProps['aria-orientation'] = props.orientation;
        }
        break;
    }
    
    // Keyboard navigation support
    if (props.focusable !== false) {
      a11yProps['tabIndex'] = props.tabIndex ?? 0;
    }
    
    return a11yProps;
  }

  translateStyles(styles: StyleConfig): Record<string, any> {
    // Performance tracking
    const startTime = performance.now();
    
    try {
      const result = this.performStyleTranslation(styles);
      
      // Log performance if threshold exceeded
      const duration = performance.now() - startTime;
      if (duration > 100) {
        console.warn(`Style translation took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      // Graceful degradation
      console.error('Style translation failed:', error);
      return styles as any;
    }
  }

  private performStyleTranslation(styles: StyleConfig): Record<string, any> {
    // Simulate heavy computation for performance testing
    if (this.config.options?.simulateHeavyComputation) {
      const iterations = 1000000;
      let sum = 0;
      for (let i = 0; i < iterations; i++) {
        sum += Math.sqrt(i);
      }
    }
    
    return {
      processed: true,
      styles: styles,
      timestamp: Date.now(),
    };
  }

  convertTokens(tokens: TokenConfig): Record<string, any> {
    // Handle large token sets efficiently
    const converted: any = { ':root': {} };
    let tokenCount = 0;
    
    const processTokens = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        tokenCount++;
        
        // Prevent excessive memory usage
        if (tokenCount > 10000) {
          console.warn('Token limit exceeded, truncating...');
          break;
        }
        
        const tokenKey = prefix ? `${prefix}-${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          processTokens(value, tokenKey);
        } else {
          converted[':root'][`--${tokenKey}`] = value;
        }
      }
    };
    
    processTokens(tokens);
    return converted;
  }

  validateConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Version compatibility validation
    if (this.config.options?.uiKitVersion) {
      if (!this.supportedVersions.includes(this.config.options.uiKitVersion)) {
        warnings.push(`UI kit version ${this.config.options.uiKitVersion} has not been tested with this adapter`);
      }
    }
    
    // Performance settings validation
    if (this.config.options?.cacheSize && this.config.options.cacheSize > 50000) {
      warnings.push('Cache size over 50000 may cause memory issues');
    }
    
    // Accessibility validation
    if (this.config.options?.disableAccessibility) {
      warnings.push('Accessibility features are disabled - this may violate WCAG guidelines');
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
      supportsAccessibility: !this.config.options?.disableAccessibility,
      supportsDarkMode: true,
      supportsResponsive: true,
      customCapabilities: {
        supportsAsyncLoading: true,
        supportsCaching: true,
        supportsVersioning: true,
      },
    };
  }

  protected getSupportedComponents(): string[] {
    return ['Button', 'Input', 'Modal', 'Tabs', 'Select', 'Card'];
  }

  // Additional methods for testing
  public getCacheSize(): number {
    return this.componentCache.size;
  }

  public clearCache(): void {
    this.componentCache.clear();
  }

  public setInitTimeout(timeout: number): void {
    this.initTimeout = timeout;
  }
}

// Mock React component for integration testing
const MockReactComponent = (props: any) => {
  return { type: 'div', props };
};

// Production tests
async function runProductionTests() {
  console.log('Running production-ready tests for UIKitAdapter...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Async error handling - Network timeout
  try {
    console.log('Test 1: Async error handling - Network timeout');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    adapter.setInitTimeout(50); // Very short timeout
    
    try {
      await adapter.initialize();
      throw new Error('Should have timed out');
    } catch (error) {
      if (error.message === 'Initialization timeout') {
        console.log('✓ Network timeout handled correctly');
        passed++;
      } else {
        throw error;
      }
    }
  } catch (e) {
    console.log('✗ Network timeout test failed:', e.message);
    failed++;
  }

  // Test 2: Async error handling - Network failure
  try {
    console.log('\nTest 2: Async error handling - Network failure');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
      options: { simulateNetworkError: true },
    });
    
    try {
      await adapter.initialize();
      throw new Error('Should have failed with network error');
    } catch (error) {
      if (error.message === 'Failed to connect to UI kit CDN') {
        console.log('✓ Network failure handled correctly');
        passed++;
      } else {
        throw error;
      }
    }
  } catch (e) {
    console.log('✗ Network failure test failed:', e.message);
    failed++;
  }

  // Test 3: Memory constraints - Large component library
  try {
    console.log('\nTest 3: Memory constraints - Large component library');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    // Generate many unique components to test cache limits
    for (let i = 0; i < 15000; i++) {
      adapter.mapComponent('Button', { id: i, variant: i % 3 });
    }
    
    const cacheSize = adapter.getCacheSize();
    if (cacheSize <= 10000) {
      console.log(`✓ Cache size limited correctly: ${cacheSize} entries`);
      passed++;
    } else {
      throw new Error(`Cache size exceeded limit: ${cacheSize}`);
    }
  } catch (e) {
    console.log('✗ Memory constraint test failed:', e.message);
    failed++;
  }

  // Test 4: Version compatibility
  try {
    console.log('\nTest 4: Version compatibility - Incompatible versions');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
      options: { uiKitVersion: '2.0.0' },
    });
    
    try {
      await adapter.initialize();
      throw new Error('Should have failed with version mismatch');
    } catch (error) {
      if (error.message.includes('not compatible')) {
        console.log('✓ Version incompatibility detected correctly');
        passed++;
      } else {
        throw error;
      }
    }
  } catch (e) {
    console.log('✗ Version compatibility test failed:', e.message);
    failed++;
  }

  // Test 5: Performance benchmarks
  try {
    console.log('\nTest 5: Performance benchmarks - Style translation');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    const complexStyles: StyleConfig = {
      base: { 
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        margin: '0 auto',
      },
      variants: {
        primary: { backgroundColor: 'blue' },
        secondary: { backgroundColor: 'gray' },
      },
      responsive: {
        md: { padding: '2rem' },
        lg: { padding: '3rem' },
      },
    };
    
    const iterations = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      adapter.translateStyles(complexStyles);
    }
    
    const duration = performance.now() - startTime;
    const avgTime = duration / iterations;
    
    console.log(`  Average translation time: ${avgTime.toFixed(3)}ms`);
    
    if (avgTime < 1) { // Should be very fast
      console.log('✓ Performance within acceptable limits');
      passed++;
    } else {
      throw new Error(`Performance too slow: ${avgTime}ms average`);
    }
  } catch (e) {
    console.log('✗ Performance benchmark test failed:', e.message);
    failed++;
  }

  // Test 6: Integration with React-like framework
  try {
    console.log('\nTest 6: Integration tests - React-like framework');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    // Simulate React component integration
    const buttonMapping = adapter.mapComponent('Button', {
      onClick: () => console.log('clicked'),
      children: 'Click me',
      variant: 'primary',
    });
    
    const reactElement = MockReactComponent(buttonMapping.props);
    
    if (
      reactElement.props['data-testid'] === 'button-component' &&
      reactElement.props.children === 'Click me' &&
      reactElement.props.onClick
    ) {
      console.log('✓ React integration successful');
      passed++;
    } else {
      throw new Error('React integration failed');
    }
  } catch (e) {
    console.log('✗ React integration test failed:', e.message);
    failed++;
  }

  // Test 7: Accessibility validation - Button
  try {
    console.log('\nTest 7: Accessibility validation - Button component');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    // Test loading button
    const loadingButton = adapter.mapComponent('Button', {
      loading: true,
      onClick: () => {},
    });
    
    // Test button without label
    const unlabeledButton = adapter.mapComponent('Button', {
      onClick: () => {},
    });
    
    if (
      loadingButton.props['aria-busy'] === 'true' &&
      loadingButton.props['aria-disabled'] === 'true' &&
      unlabeledButton.props['aria-label'] === 'Button'
    ) {
      console.log('✓ Button accessibility attributes added correctly');
      passed++;
    } else {
      throw new Error('Button accessibility validation failed');
    }
  } catch (e) {
    console.log('✗ Button accessibility test failed:', e.message);
    failed++;
  }

  // Test 8: Accessibility validation - Input
  try {
    console.log('\nTest 8: Accessibility validation - Input component');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    // Test error input
    const errorInput = adapter.mapComponent('Input', {
      error: true,
      placeholder: 'Email',
      type: 'email',
    });
    
    // Test input without label
    const unlabeledInput = adapter.mapComponent('Input', {
      type: 'text',
    });
    
    if (
      errorInput.props['aria-invalid'] === 'true' &&
      errorInput.props['aria-describedby'] === 'input-error' &&
      errorInput.props['aria-label'] === 'Email' &&
      unlabeledInput.props['aria-label'] === 'Input field'
    ) {
      console.log('✓ Input accessibility attributes added correctly');
      passed++;
    } else {
      throw new Error('Input accessibility validation failed');
    }
  } catch (e) {
    console.log('✗ Input accessibility test failed:', e.message);
    failed++;
  }

  // Test 9: Accessibility validation - Modal
  try {
    console.log('\nTest 9: Accessibility validation - Modal component');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    const modal = adapter.mapComponent('Modal', {
      open: true,
      onClose: () => {},
    });
    
    if (
      modal.props['role'] === 'dialog' &&
      modal.props['aria-modal'] === 'true' &&
      modal.props['aria-label'] === 'Modal dialog'
    ) {
      console.log('✓ Modal accessibility attributes added correctly');
      passed++;
    } else {
      throw new Error('Modal accessibility validation failed');
    }
  } catch (e) {
    console.log('✗ Modal accessibility test failed:', e.message);
    failed++;
  }

  // Test 10: Keyboard navigation
  try {
    console.log('\nTest 10: Accessibility validation - Keyboard navigation');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    // Test default focusable element
    const focusableButton = adapter.mapComponent('Button', {
      onClick: () => {},
    });
    
    // Test explicitly non-focusable element
    const nonFocusableButton = adapter.mapComponent('Button', {
      focusable: false,
    });
    
    // Test custom tabIndex
    const customTabButton = adapter.mapComponent('Button', {
      tabIndex: -1,
    });
    
    if (
      focusableButton.props['tabIndex'] === 0 &&
      !('tabIndex' in nonFocusableButton.props) &&
      customTabButton.props['tabIndex'] === -1
    ) {
      console.log('✓ Keyboard navigation support implemented correctly');
      passed++;
    } else {
      throw new Error('Keyboard navigation validation failed');
    }
  } catch (e) {
    console.log('✗ Keyboard navigation test failed:', e.message);
    failed++;
  }

  // Test 11: Performance with heavy computation
  try {
    console.log('\nTest 11: Performance under load - Heavy computation');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
      options: { simulateHeavyComputation: true },
    });
    
    await adapter.initialize();
    
    const startTime = performance.now();
    const result = adapter.translateStyles({ base: { color: 'red' } });
    const duration = performance.now() - startTime;
    
    console.log(`  Heavy computation took: ${duration.toFixed(2)}ms`);
    
    if (result.processed === true && duration < 5000) {
      console.log('✓ Heavy computation completed within timeout');
      passed++;
    } else {
      throw new Error('Heavy computation failed or took too long');
    }
  } catch (e) {
    console.log('✗ Heavy computation test failed:', e.message);
    failed++;
  }

  // Test 12: Large token set handling
  try {
    console.log('\nTest 12: Memory constraints - Large token sets');
    const adapter = new ProductionAdapter({
      name: 'ProductionAdapter',
      version: '1.0.0',
    });
    
    await adapter.initialize();
    
    // Generate a massive token set
    const largeTokens: any = {
      colors: {},
      spacing: {},
      typography: {},
    };
    
    // Add 15000 tokens
    for (let i = 0; i < 5000; i++) {
      largeTokens.colors[`color-${i}`] = `#${i.toString(16).padStart(6, '0')}`;
      largeTokens.spacing[`space-${i}`] = `${i}px`;
      largeTokens.typography[`font-${i}`] = `${i}px sans-serif`;
    }
    
    const result = adapter.convertTokens(largeTokens);
    const tokenCount = Object.keys(result[':root']).length;
    
    if (tokenCount <= 10000) {
      console.log(`✓ Token limit enforced: ${tokenCount} tokens processed`);
      passed++;
    } else {
      throw new Error(`Too many tokens processed: ${tokenCount}`);
    }
  } catch (e) {
    console.log('✗ Large token set test failed:', e.message);
    failed++;
  }

  // Summary
  console.log(`\n==================`);
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`==================`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runProductionTests();