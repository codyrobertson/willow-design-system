import { UIKitAdapter, AdapterConfig, ComponentMapping, ValidationResult } from './UIKitAdapter';
import { ComponentConfig, StyleConfig, TokenConfig, ComponentType } from '../types/AdapterTypes';

// Mock implementation for testing
class MockAdapter extends UIKitAdapter {
  async initialize(): Promise<void> {
    // Mock initialization
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

describe('UIKitAdapter', () => {
  let adapter: MockAdapter;
  const config: AdapterConfig = {
    name: 'MockAdapter',
    version: '1.0.0',
    options: {
      theme: 'light',
    },
  };

  beforeEach(() => {
    adapter = new MockAdapter(config);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(adapter.getMetadata().name).toBe('MockAdapter');
      expect(adapter.getMetadata().version).toBe('1.0.0');
    });
  });

  describe('getMetadata', () => {
    it('should return complete metadata', () => {
      const metadata = adapter.getMetadata();
      expect(metadata).toEqual({
        name: 'MockAdapter',
        version: '1.0.0',
        capabilities: {
          supportsTheming: true,
          supportsRTL: true,
          supportsAccessibility: true,
          supportsDarkMode: true,
          supportsResponsive: true,
        },
        supportedComponents: ['Button', 'Input', 'Select'],
      });
    });
  });

  describe('abstract methods', () => {
    it('should initialize successfully', async () => {
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });

    it('should map components correctly', () => {
      const mapping = adapter.mapComponent('Button', { variant: 'primary' });
      expect(mapping).toEqual({
        component: 'MockButton',
        props: { variant: 'primary', mockProp: true },
      });
    });

    it('should translate styles', () => {
      const styles: StyleConfig = {
        base: { color: 'blue' },
        variants: { primary: { background: 'red' } },
      };
      const translated = adapter.translateStyles(styles);
      expect(translated).toEqual({
        base: { color: 'blue' },
        variants: { primary: { background: 'red' } },
        translated: true,
      });
    });

    it('should convert tokens', () => {
      const tokens: TokenConfig = {
        colors: {
          primary: { 500: '#3B82F6' },
        },
      };
      const converted = adapter.convertTokens(tokens);
      expect(converted).toEqual({
        colors: {
          primary: { 500: '#3B82F6' },
        },
        converted: true,
      });
    });

    it('should validate config', () => {
      const result = adapter.validateConfig();
      expect(result).toEqual({ valid: true });
    });
  });
});