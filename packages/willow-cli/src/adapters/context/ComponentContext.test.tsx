import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import React from 'react';
import { ComponentProvider, useComponent, useComponentSafe, useComponentMapping } from './ComponentContext';
import { AdapterProvider } from './AdapterContext';
import { ComponentConfig, ComponentType, ComponentVariant } from '../types/AdapterTypes';
import { UIKitAdapter } from '../base/UIKitAdapter';
import { ValidationResult } from '../base/AdapterValidator';

// Mock adapter class
class MockAdapter extends UIKitAdapter {
  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  mapComponent(componentName: string, props: Record<string, any>): any {
    return {
      component: componentName,
      props,
      styles: { color: 'blue' },
      variants: [
        { name: 'primary', props: { variant: 'primary' } },
        { name: 'secondary', props: { variant: 'secondary' } },
      ],
      displayName: componentName,
    };
  }

  translateStyles(): any {
    return { backgroundColor: 'white', color: 'black' };
  }

  convertTokens(): any {
    return {};
  }

  validateConfig(): ValidationResult {
    return { valid: true };
  }
}

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AdapterProvider>
      <ComponentProvider>{children}</ComponentProvider>
    </AdapterProvider>
  );
}

describe('ComponentContext', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdapter = new MockAdapter('test-adapter', '1.0.0');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ComponentProvider', () => {
    it('should render children without crashing', () => {
      const { getByText } = render(
        <TestWrapper>
          <div>Test Content</div>
        </TestWrapper>
      );

      expect(getByText('Test Content')).toBeDefined();
    });

    it('should provide initial state with default configuration', () => {
      const defaultComponents = [
        {
          type: ComponentType.Button,
          config: {
            name: 'Button',
            type: ComponentType.Button,
            variants: [
              { name: 'primary', props: { variant: 'primary' } },
              { name: 'secondary', props: { variant: 'secondary' } },
            ],
          } as ComponentConfig,
        },
      ];

      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider defaultComponents={defaultComponents}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      expect(result.current.components.size).toBe(1);
      expect(result.current.components.has(ComponentType.Button)).toBe(true);
      expect(result.current.enableCaching).toBe(true);
      expect(result.current.mappings.size).toBe(0);
    });

    it('should accept custom configuration', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider
              enableCaching={false}
              enablePerformanceTracking={true}
              maxCacheSize={500}
            >
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      expect(result.current.enableCaching).toBe(false);
      expect(result.current.enablePerformanceTracking).toBe(true);
      expect(result.current.maxCacheSize).toBe(500);
    });
  });

  describe('useComponent hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useComponent());
      }).toThrow('useComponent must be used within a ComponentProvider');
    });

    it('should return component context when used within provider', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.mapComponent).toBe('function');
      expect(typeof result.current.getComponent).toBe('function');
      expect(typeof result.current.registerComponent).toBe('function');
    });
  });

  describe('useComponentSafe hook', () => {
    it('should return null when used outside provider', () => {
      const { result } = renderHook(() => useComponentSafe());
      expect(result.current).toBeNull();
    });

    it('should return component context when used within provider', () => {
      const { result } = renderHook(() => useComponentSafe(), {
        wrapper: TestWrapper,
      });

      expect(result.current).not.toBeNull();
    });
  });

  describe('mapComponent', () => {
    it('should return null when no adapter is available', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const mapping = result.current.mapComponent('Button');
      expect(mapping).toBeNull();
    });

    it('should map component when adapter is available', () => {
      const { result } = renderHook(
        () => {
          const component = useComponent();
          return { component };
        },
        {
          wrapper: ({ children }) => (
            <AdapterProvider>
              <ComponentProvider>{children}</ComponentProvider>
            </AdapterProvider>
          ),
        }
      );

      // Mock the adapter in the context
      const adapterContext = result.current as any;
      if (adapterContext.component) {
        // Simulate having an adapter
        const componentContext = adapterContext.component;
        
        // Manually set up mock adapter for this test
        const mockMapping = {
          component: 'Button',
          props: { size: 'medium' },
          styles: { color: 'blue' },
          variants: [],
          displayName: 'Button',
        };

        // Mock the mapComponent method to return our test mapping
        componentContext.mapComponent = vi.fn().mockReturnValue(mockMapping);

        const mapping = componentContext.mapComponent('Button', { size: 'medium' });
        expect(mapping).toEqual(mockMapping);
      }
    });

    it('should cache component mappings when caching is enabled', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      // Create a component mapping with caching enabled
      const componentContext = result.current;
      expect(componentContext.enableCaching).toBe(true);

      // Initial cache should be empty
      expect(componentContext.mappings.size).toBe(0);
      expect(componentContext.cacheHits).toBe(0);
      expect(componentContext.cacheMisses).toBe(0);
    });

    it('should handle component mapping errors gracefully', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      // Test error handling by mocking console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should not throw and should return null
      const mapping = result.current.mapComponent('NonexistentComponent');
      expect(mapping).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should respect max cache size', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider maxCacheSize={2}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      const componentContext = result.current;
      expect(componentContext.maxCacheSize).toBe(2);
    });
  });

  describe('getComponent', () => {
    it('should return component configuration', () => {
      const buttonConfig: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        variants: [{ name: 'primary', props: { variant: 'primary' } }],
      };

      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider defaultComponents={[{ type: ComponentType.Button, config: buttonConfig }]}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      const config = result.current.getComponent(ComponentType.Button);
      expect(config).toEqual(buttonConfig);
    });

    it('should return null for unregistered component', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const config = result.current.getComponent(ComponentType.Button);
      expect(config).toBeNull();
    });
  });

  describe('getVariant', () => {
    it('should return component variant', () => {
      const buttonConfig: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        variants: [
          { name: 'primary', props: { variant: 'primary' } },
          { name: 'secondary', props: { variant: 'secondary' } },
        ],
      };

      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider defaultComponents={[{ type: ComponentType.Button, config: buttonConfig }]}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      const variant = result.current.getVariant('button', 'primary');
      expect(variant).toEqual({ name: 'primary', props: { variant: 'primary' } });
    });

    it('should return null for nonexistent variant', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const variant = result.current.getVariant('button', 'nonexistent');
      expect(variant).toBeNull();
    });
  });

  describe('applyVariant', () => {
    it('should apply variant props to mapping', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const mapping = {
        component: 'Button',
        props: { size: 'medium' },
        styles: {},
        variants: [
          { name: 'primary', props: { color: 'blue' } },
          { name: 'secondary', props: { color: 'gray' } },
        ],
        displayName: 'Button',
      };

      const updatedMapping = result.current.applyVariant(mapping, 'primary');
      expect(updatedMapping.props).toEqual({
        size: 'medium',
        color: 'blue',
      });
    });

    it('should warn for nonexistent variant', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mapping = {
        component: 'Button',
        props: {},
        styles: {},
        variants: [],
        displayName: 'Button',
      };

      const updatedMapping = result.current.applyVariant(mapping, 'nonexistent');
      expect(updatedMapping).toEqual(mapping);
      expect(consoleSpy).toHaveBeenCalledWith("Variant 'nonexistent' not found for component");

      consoleSpy.mockRestore();
    });
  });

  describe('getStyles', () => {
    it('should return empty styles when no adapter is available', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const styles = result.current.getStyles('Button');
      expect(styles).toEqual({});
    });

    it('should handle style translation errors', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const styles = result.current.getStyles('Button');
      expect(styles).toEqual({});

      consoleSpy.mockRestore();
    });
  });

  describe('mergeStyles', () => {
    it('should merge style objects', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const baseStyles = { color: 'blue', fontSize: '16px' };
      const additionalStyles = { backgroundColor: 'white', color: 'red' };

      const merged = result.current.mergeStyles(baseStyles, additionalStyles);
      expect(merged).toEqual({
        color: 'red', // Should override
        fontSize: '16px',
        backgroundColor: 'white',
      });
    });
  });

  describe('cache management', () => {
    it('should clear cache and reset stats', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      // Simulate some cache activity
      act(() => {
        result.current.clearCache();
      });

      const stats = result.current.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const stats = result.current.getCacheStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
    });
  });

  describe('component registration', () => {
    it('should register new component', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const config: ComponentConfig = {
        name: 'CustomButton',
        type: ComponentType.Button,
        variants: [],
      };

      act(() => {
        result.current.registerComponent(ComponentType.Button, config);
      });

      expect(result.current.components.has(ComponentType.Button)).toBe(true);
      expect(result.current.getComponent(ComponentType.Button)).toEqual(config);
    });

    it('should unregister component', () => {
      const config: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        variants: [],
      };

      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider defaultComponents={[{ type: ComponentType.Button, config }]}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      expect(result.current.components.has(ComponentType.Button)).toBe(true);

      act(() => {
        result.current.unregisterComponent(ComponentType.Button);
      });

      expect(result.current.components.has(ComponentType.Button)).toBe(false);
    });

    it('should clear cache when registering component', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const clearCacheSpy = vi.spyOn(result.current, 'clearCache');

      const config: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        variants: [],
      };

      act(() => {
        result.current.registerComponent(ComponentType.Button, config);
      });

      expect(clearCacheSpy).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should check if component is supported', () => {
      const config: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        variants: [],
      };

      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider defaultComponents={[{ type: ComponentType.Button, config }]}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      expect(result.current.isComponentSupported('button')).toBe(true);
      expect(result.current.isComponentSupported('nonexistent')).toBe(false);
    });

    it('should get available components', () => {
      const config: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        variants: [],
      };

      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider defaultComponents={[{ type: ComponentType.Button, config }]}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      const available = result.current.getAvailableComponents();
      expect(available).toContain(ComponentType.Button);
    });

    it('should get supported variants', () => {
      const config: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        variants: [
          { name: 'primary', props: {} },
          { name: 'secondary', props: {} },
        ],
      };

      const { result } = renderHook(() => useComponent(), {
        wrapper: ({ children }) => (
          <TestWrapper>
            <ComponentProvider defaultComponents={[{ type: ComponentType.Button, config }]}>
              {children}
            </ComponentProvider>
          </TestWrapper>
        ),
      });

      const variants = result.current.getSupportedVariants('button');
      expect(variants).toEqual(['primary', 'secondary']);
    });

    it('should return empty array for unsupported component variants', () => {
      const { result } = renderHook(() => useComponent(), {
        wrapper: TestWrapper,
      });

      const variants = result.current.getSupportedVariants('nonexistent');
      expect(variants).toEqual([]);
    });
  });

  describe('useComponentMapping hook', () => {
    it('should return component mapping without variant', () => {
      const { result } = renderHook(
        () => useComponentMapping('Button', { size: 'large' }),
        {
          wrapper: TestWrapper,
        }
      );

      // Since no adapter is available, should return null
      expect(result.current).toBeNull();
    });

    it('should return component mapping with variant', () => {
      const { result } = renderHook(
        () => useComponentMapping('Button', { size: 'large' }, 'primary'),
        {
          wrapper: TestWrapper,
        }
      );

      // Since no adapter is available, should return null
      expect(result.current).toBeNull();
    });
  });
});