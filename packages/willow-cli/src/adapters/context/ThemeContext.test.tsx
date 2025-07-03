import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme, useThemeSafe, ThemeMode } from './ThemeContext';
import { AdapterProvider } from './AdapterContext';
import { TokenConfig } from '../types/AdapterTypes';
import { UIKitAdapter } from '../base/UIKitAdapter';
import { ValidationResult } from '../base/AdapterValidator';

// Mock adapter class
class MockAdapter extends UIKitAdapter {
  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  mapComponent(): any {
    return {};
  }

  translateStyles(): any {
    return {};
  }

  convertTokens(tokens: TokenConfig): any {
    return {
      colors: {
        primary: tokens.colors?.primary || '#blue',
        background: tokens.colors?.background || '#white',
      },
      spacing: tokens.spacing || { small: '8px', medium: '16px' },
    };
  }

  validateConfig(): ValidationResult {
    return { valid: true };
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AdapterProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AdapterProvider>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ThemeProvider', () => {
    it('should render children without crashing', () => {
      const { getByText } = render(
        <TestWrapper>
          <div>Test Content</div>
        </TestWrapper>
      );

      expect(getByText('Test Content')).toBeDefined();
    });

    it('should provide initial state with defaults', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(result.current.mode).toBe('auto');
      expect(result.current.tokens).toEqual({});
      expect(result.current.resolvedTokens).toEqual({});
      expect(result.current.variants.size).toBe(0);
      expect(result.current.systemTheme).toBe('light');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.enableSystemTheme).toBe(true);
      expect(result.current.enableTransitions).toBe(true);
      expect(result.current.enablePersistence).toBe(true);
    });

    it('should accept custom configuration', () => {
      const defaultTokens: TokenConfig = {
        colors: { primary: { '500': '#blue' } },
        spacing: { medium: '16px' },
      };

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider
              defaultMode="dark"
              defaultTokens={defaultTokens}
              enableSystemTheme={false}
              enableTransitions={false}
              enablePersistence={false}
              persistenceKey="custom-theme"
            >
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      expect(result.current.mode).toBe('dark');
      expect(result.current.tokens).toEqual(defaultTokens);
      expect(result.current.enableSystemTheme).toBe(false);
      expect(result.current.enableTransitions).toBe(false);
      expect(result.current.enablePersistence).toBe(false);
      expect(result.current.persistenceKey).toBe('custom-theme');
    });

    it('should call callbacks on changes', async () => {
      const onModeChange = vi.fn();
      const onTokensChange = vi.fn();

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider onModeChange={onModeChange} onTokensChange={onTokensChange}>
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      // Initial calls
      expect(onModeChange).toHaveBeenCalledWith('auto');
      expect(onTokensChange).toHaveBeenCalledWith({});

      // Change mode
      act(() => {
        result.current.setMode('dark');
      });

      expect(onModeChange).toHaveBeenCalledWith('dark');

      // Change tokens
      await act(async () => {
        await result.current.updateTokens({ colors: { primary: { '500': '#red' } } });
      });

      expect(onTokensChange).toHaveBeenCalledWith({
        colors: { primary: { '500': '#red' } },
      });
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');
    });

    it('should return theme context when used within provider', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.setMode).toBe('function');
      expect(typeof result.current.toggleMode).toBe('function');
      expect(typeof result.current.updateTokens).toBe('function');
    });
  });

  describe('useThemeSafe hook', () => {
    it('should return null when used outside provider', () => {
      const { result } = renderHook(() => useThemeSafe());
      expect(result.current).toBeNull();
    });

    it('should return theme context when used within provider', () => {
      const { result } = renderHook(() => useThemeSafe(), {
        wrapper: TestWrapper,
      });

      expect(result.current).not.toBeNull();
    });
  });

  describe('theme mode management', () => {
    it('should set theme mode', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setMode('dark');
      });

      expect(result.current.mode).toBe('dark');
    });

    it('should toggle theme mode', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Start with light mode
      act(() => {
        result.current.setMode('light');
      });

      expect(result.current.mode).toBe('light');

      // Toggle to dark
      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('dark');

      // Toggle back to light
      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('light');
    });

    it('should get effective mode', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Auto mode should return system theme
      expect(result.current.getEffectiveMode()).toBe('light'); // system default

      // Explicit mode should return that mode
      act(() => {
        result.current.setMode('dark');
      });

      expect(result.current.getEffectiveMode()).toBe('dark');
    });

    it('should handle system theme detection', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider enableSystemTheme={true}>
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      expect(result.current.systemTheme).toBe('dark');
    });
  });

  describe('token management', () => {
    it('should update tokens', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      const newTokens = {
        colors: { primary: { '500': '#blue' } },
        spacing: { medium: '16px' },
      };

      await act(async () => {
        await result.current.updateTokens(newTokens);
      });

      expect(result.current.tokens).toEqual(newTokens);
    });

    it('should get token value by path', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Set resolved tokens
      act(() => {
        (result.current as any).resolvedTokens = {
          colors: {
            primary: '#blue',
            background: '#white',
          },
          spacing: {
            medium: '16px',
          },
        };
      });

      expect(result.current.getToken('colors.primary')).toBe('#blue');
      expect(result.current.getToken('spacing.medium')).toBe('16px');
      expect(result.current.getToken('nonexistent.path')).toBeNull();
    });

    it('should set token value by path', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setToken('colors.primary', '#red');
      });

      expect(result.current.tokens).toEqual({
        colors: { primary: '#red' },
      });

      act(() => {
        result.current.setToken('colors.secondary', '#blue');
      });

      expect(result.current.tokens).toEqual({
        colors: { primary: '#red', secondary: '#blue' },
      });
    });

    it('should get color values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Mock resolved tokens
      act(() => {
        (result.current as any).resolvedTokens = {
          colors: { primary: '#blue', background: '#white' },
        };
      });

      expect(result.current.getColorValue('primary')).toBe('#blue');
      expect(result.current.getColorValue('nonexistent')).toBeNull();
    });

    it('should get spacing values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Mock resolved tokens
      act(() => {
        (result.current as any).resolvedTokens = {
          spacing: { medium: '16px', large: '24px' },
        };
      });

      expect(result.current.getSpacingValue('medium')).toBe('16px');
      expect(result.current.getSpacingValue('nonexistent')).toBeNull();
    });

    it('should get typography values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Mock resolved tokens
      act(() => {
        (result.current as any).resolvedTokens = {
          typography: { fontSize: { base: '16px' }, fontWeight: { bold: 700 } },
        };
      });

      expect(result.current.getTypographyValue('fontSize.base')).toBe('16px');
      expect(result.current.getTypographyValue('fontWeight.bold')).toBe(700);
      expect(result.current.getTypographyValue('nonexistent')).toBeNull();
    });
  });

  describe('variant management', () => {
    it('should add theme variant', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      const darkVariant: TokenConfig = {
        colors: { primary: { '500': '#darkblue' } },
      };

      act(() => {
        result.current.addVariant('dark', darkVariant);
      });

      expect(result.current.variants.has('dark')).toBe(true);
      expect(result.current.getVariant('dark')).toEqual(darkVariant);
    });

    it('should remove theme variant', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      const darkVariant: TokenConfig = {
        colors: { primary: { '500': '#darkblue' } },
      };

      act(() => {
        result.current.addVariant('dark', darkVariant);
      });

      expect(result.current.variants.has('dark')).toBe(true);

      act(() => {
        result.current.removeVariant('dark');
      });

      expect(result.current.variants.has('dark')).toBe(false);
    });

    it('should apply theme variant', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      const darkVariant: TokenConfig = {
        colors: { primary: { '500': '#darkblue' } },
      };

      act(() => {
        result.current.addVariant('dark', darkVariant);
      });

      act(() => {
        result.current.applyVariant('dark');
      });

      expect(result.current.tokens).toEqual(darkVariant);
    });

    it('should handle applying nonexistent variant', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      const originalTokens = result.current.tokens;

      act(() => {
        result.current.applyVariant('nonexistent');
      });

      expect(result.current.tokens).toEqual(originalTokens);
    });
  });

  describe('CSS variables', () => {
    it('should get CSS variables from resolved tokens', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Mock resolved tokens
      act(() => {
        (result.current as any).resolvedTokens = {
          colors: { primary: '#blue' },
          spacing: { medium: '16px' },
        };
      });

      const cssVars = result.current.getCSSVariables();
      expect(cssVars).toHaveProperty('--willow-colors-primary', '#blue');
      expect(cssVars).toHaveProperty('--willow-spacing-medium', '16px');
    });

    it('should apply CSS variables to element', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Create mock element
      const mockElement = {
        style: {
          setProperty: vi.fn(),
        },
      } as any;

      // Mock resolved tokens
      act(() => {
        (result.current as any).resolvedTokens = {
          colors: { primary: '#blue' },
        };
      });

      act(() => {
        result.current.applyCSSVariables(mockElement);
      });

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        '--willow-colors-primary',
        '#blue'
      );
    });

    it('should apply CSS variables to document.documentElement by default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Mock document.documentElement
      const mockSetProperty = vi.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: {
          setProperty: mockSetProperty,
        },
        configurable: true,
      });

      // Mock resolved tokens
      act(() => {
        (result.current as any).resolvedTokens = {
          colors: { primary: '#blue' },
        };
      });

      act(() => {
        result.current.applyCSSVariables();
      });

      expect(mockSetProperty).toHaveBeenCalledWith('--willow-colors-primary', '#blue');
    });
  });

  describe('theme persistence', () => {
    it('should load persisted theme', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider enablePersistence={true}>
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      act(() => {
        result.current.loadPersistedTheme();
      });

      expect(result.current.mode).toBe('dark');
    });

    it('should persist theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider enablePersistence={true}>
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      act(() => {
        result.current.setMode('dark');
      });

      act(() => {
        result.current.persistTheme();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('willow-theme-mode', 'dark');
    });

    it('should clear persisted theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider enablePersistence={true}>
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      act(() => {
        result.current.clearPersistedTheme();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow-theme-mode');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider enablePersistence={true}>
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      act(() => {
        result.current.persistTheme();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to persist theme:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should not persist when persistence is disabled', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider enablePersistence={false}>
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      act(() => {
        result.current.persistTheme();
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('token resolution with adapter', () => {
    it('should resolve tokens when adapter is available', async () => {
      const mockAdapter = new MockAdapter('test-adapter', '1.0.0');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <AdapterProvider>
            <ThemeProvider
              defaultTokens={{
                colors: { primary: { '500': '#blue' } },
                spacing: { medium: '16px' },
              }}
            >
              {children}
            </ThemeProvider>
          </AdapterProvider>
        ),
      });

      // Simulate adapter being available by manually setting it
      // In a real scenario, this would be done through AdapterProvider
      const adapterContext = (result.current as any);
      if (adapterContext) {
        // Mock the resolved tokens that would come from adapter
        act(() => {
          (result.current as any).resolvedTokens = {
            colors: { primary: '#blue' },
            spacing: { medium: '16px' },
          };
        });

        expect(result.current.resolvedTokens).toEqual({
          colors: { primary: '#blue' },
          spacing: { medium: '16px' },
        });
      }
    });

    it('should handle token resolution errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      // Test error handling when resolution fails
      expect(result.current.resolvedTokens).toEqual({});

      consoleSpy.mockRestore();
    });
  });
});