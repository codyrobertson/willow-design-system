import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AdapterProvider, useAdapter, useAdapterSafe } from './AdapterContext';
import { UIKitAdapter, AdapterConfig } from '../base/UIKitAdapter';
import { AdapterRegistry } from '../base/AdapterRegistry';
import { ValidationResult } from '../base/AdapterValidator';

// Mock dependencies
vi.mock('../base/AdapterRegistry');
vi.mock('../base/AdapterLifecycle');
vi.mock('../utils/ValidationUtils');

// Mock adapter class
class MockAdapter extends UIKitAdapter {
  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  mapComponent(): any {
    return { component: 'div', props: {}, styles: {} };
  }

  translateStyles(): any {
    return {};
  }

  convertTokens(): any {
    return {};
  }

  validateConfig(): ValidationResult {
    return { valid: true };
  }
}

describe('AdapterContext', () => {
  let mockRegistry: any;
  let mockLifecycle: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock registry
    mockRegistry = {
      getInstance: vi.fn().mockReturnValue({
        getRegisteredAdapters: vi.fn().mockReturnValue(['test-adapter']),
        create: vi.fn().mockResolvedValue(new MockAdapter('test-adapter', '1.0.0')),
      }),
    };

    // Mock lifecycle
    mockLifecycle = {
      runPhase: vi.fn().mockResolvedValue(undefined),
    };

    // Mock AdapterRegistry.getInstance
    (AdapterRegistry.getInstance as any) = vi.fn().mockReturnValue(mockRegistry.getInstance());

    // Mock ValidationUtils
    const { ValidationUtils } = await import('../utils/ValidationUtils');
    (ValidationUtils.validateAdapterConfigStrict as any) = vi.fn().mockReturnValue({ valid: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AdapterProvider', () => {
    it('should render children without crashing', () => {
      const { getByText } = render(
        <AdapterProvider>
          <div>Test Content</div>
        </AdapterProvider>
      );

      expect(getByText('Test Content')).toBeDefined();
    });

    it('should provide initial state', () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      expect(result.current.currentAdapter).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.config).toBeNull();
    });

    it('should initialize default adapter if provided', async () => {
      const defaultConfig: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => (
          <AdapterProvider defaultAdapter="test-adapter" defaultConfig={defaultConfig}>
            {children}
          </AdapterProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.currentAdapter).not.toBeNull();
      });
    });

    it('should call onError when error occurs', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => (
          <AdapterProvider onError={onError}>
            {children}
          </AdapterProvider>
        ),
      });

      // Trigger an error
      const invalidConfig = {} as AdapterConfig;
      
      await act(async () => {
        try {
          await result.current.initializeAdapter('invalid', invalidConfig);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalled();
    });

    it('should call onAdapterChange when adapter changes', async () => {
      const onAdapterChange = vi.fn();
      const defaultConfig: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      renderHook(() => useAdapter(), {
        wrapper: ({ children }) => (
          <AdapterProvider onAdapterChange={onAdapterChange}>
            {children}
          </AdapterProvider>
        ),
      });

      expect(onAdapterChange).toHaveBeenCalledWith(null);
    });
  });

  describe('useAdapter hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAdapter());
      }).toThrow('useAdapter must be used within an AdapterProvider');
    });

    it('should return adapter context when used within provider', () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.initializeAdapter).toBe('function');
      expect(typeof result.current.switchAdapter).toBe('function');
      expect(typeof result.current.updateConfig).toBe('function');
    });
  });

  describe('useAdapterSafe hook', () => {
    it('should return null when used outside provider', () => {
      const { result } = renderHook(() => useAdapterSafe());
      expect(result.current).toBeNull();
    });

    it('should return adapter context when used within provider', () => {
      const { result } = renderHook(() => useAdapterSafe(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      expect(result.current).not.toBeNull();
    });
  });

  describe('initializeAdapter', () => {
    it('should successfully initialize adapter with valid config', async () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      await act(async () => {
        await result.current.initializeAdapter('test-adapter', config);
      });

      expect(result.current.currentAdapter).not.toBeNull();
      expect(result.current.config).toEqual(config);
      expect(result.current.error).toBeNull();
    });

    it('should set loading states during initialization', async () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      const initPromise = act(async () => {
        await result.current.initializeAdapter('test-adapter', config);
      });

      // Should be initializing
      expect(result.current.isInitializing).toBe(true);

      await initPromise;

      // Should no longer be initializing
      expect(result.current.isInitializing).toBe(false);
    });

    it('should handle validation errors', async () => {
      // Mock validation to fail
      const { ValidationUtils } = await import('../utils/ValidationUtils');
      (ValidationUtils.validateAdapterConfigStrict as any) = vi.fn().mockReturnValue({
        valid: false,
        errors: [{ path: 'name', message: 'Name is required', code: 'REQUIRED' }],
      });

      const invalidConfig = {} as AdapterConfig;

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      await act(async () => {
        try {
          await result.current.initializeAdapter('test-adapter', invalidConfig);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.validationErrors).not.toBeNull();
      expect(result.current.error).not.toBeNull();
    });

    it('should handle adapter creation errors', async () => {
      const registry = AdapterRegistry.getInstance();
      (registry.create as any) = vi.fn().mockRejectedValue(new Error('Creation failed'));

      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      await act(async () => {
        try {
          await result.current.initializeAdapter('test-adapter', config);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.currentAdapter).toBeNull();
    });
  });

  describe('switchAdapter', () => {
    it('should switch to different adapter', async () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      // Initialize first adapter
      await act(async () => {
        await result.current.initializeAdapter('test-adapter', config);
      });

      expect(result.current.currentAdapter).not.toBeNull();

      // Switch to different adapter
      const newConfig: AdapterConfig = {
        name: 'other-adapter',
        version: '2.0.0',
        options: {},
      };

      await act(async () => {
        await result.current.switchAdapter('other-adapter', newConfig);
      });

      expect(result.current.config).toEqual(newConfig);
    });

    it('should dispose current adapter before switching', async () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      // Create adapter with dispose method
      const disposeMock = vi.fn().mockResolvedValue(undefined);
      const adapterWithDispose = new MockAdapter('test-adapter', '1.0.0');
      (adapterWithDispose as any).dispose = disposeMock;

      const registry = AdapterRegistry.getInstance();
      (registry.create as any) = vi.fn().mockResolvedValue(adapterWithDispose);

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      // Initialize first adapter
      await act(async () => {
        await result.current.initializeAdapter('test-adapter', config);
      });

      // Switch to different adapter
      await act(async () => {
        await result.current.switchAdapter('other-adapter', config);
      });

      expect(disposeMock).toHaveBeenCalled();
    });

    it('should throw error if no config provided and no current config', async () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      await act(async () => {
        try {
          await result.current.switchAdapter('test-adapter');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toContain('No configuration provided');
        }
      });
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', async () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: { theme: 'light' },
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      // Initialize adapter
      await act(async () => {
        await result.current.initializeAdapter('test-adapter', config);
      });

      // Update config
      await act(async () => {
        await result.current.updateConfig({ options: { theme: 'dark' } });
      });

      expect(result.current.config?.options?.theme).toBe('dark');
    });

    it('should throw error if no current config', async () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      await act(async () => {
        try {
          await result.current.updateConfig({ options: { theme: 'dark' } });
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toContain('No current configuration');
        }
      });
    });

    it('should validate updated configuration', async () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      // Initialize adapter
      await act(async () => {
        await result.current.initializeAdapter('test-adapter', config);
      });

      // Mock validation to fail
      const { ValidationUtils } = await import('../utils/ValidationUtils');
      (ValidationUtils.validateAdapterConfigStrict as any) = vi.fn().mockReturnValue({
        valid: false,
        errors: [{ path: 'options', message: 'Invalid options', code: 'INVALID' }],
      });

      // Update config
      await act(async () => {
        try {
          await result.current.updateConfig({ options: { invalid: true } });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.validationErrors).not.toBeNull();
    });
  });

  describe('validateConfig', () => {
    it('should validate configuration', async () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      let validationResult: ValidationResult;
      await act(async () => {
        validationResult = await result.current.validateConfig(config);
      });

      expect(validationResult!.valid).toBe(true);
    });

    it('should measure validation time', async () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const initialTime = result.current.metrics.lastValidationTime;

      await act(async () => {
        await result.current.validateConfig(config);
      });

      expect(result.current.metrics.lastValidationTime).toBeGreaterThan(initialTime);
    });
  });

  describe('utility methods', () => {
    it('should clear errors', async () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      // Set an error by trying invalid config
      const { ValidationUtils } = await import('../utils/ValidationUtils');
      (ValidationUtils.validateAdapterConfigStrict as any) = vi.fn().mockReturnValue({
        valid: false,
        errors: [{ path: 'name', message: 'Error', code: 'ERROR' }],
      });

      await act(async () => {
        try {
          await result.current.initializeAdapter('test', {} as AdapterConfig);
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      // Clear errors
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.validationErrors).toBeNull();
    });

    it('should reset context', () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      act(() => {
        result.current.resetContext();
      });

      expect(result.current.currentAdapter).toBeNull();
      expect(result.current.config).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should get available adapters', () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      const available = result.current.getAvailableAdapters();
      expect(available).toContain('test-adapter');
    });

    it('should check if adapter is available', () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      expect(result.current.isAdapterAvailable('test-adapter')).toBe(true);
      expect(result.current.isAdapterAvailable('nonexistent')).toBe(false);
    });

    it('should get current adapter info', async () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        options: {},
      };

      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      expect(result.current.getCurrentAdapterInfo()).toBeNull();

      await act(async () => {
        await result.current.initializeAdapter('test-adapter', config);
      });

      const info = result.current.getCurrentAdapterInfo();
      expect(info).toEqual({
        name: 'test-adapter',
        version: '1.0.0',
      });
    });

    it('should get metrics', () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      const metrics = result.current.getMetrics();
      expect(metrics).toHaveProperty('initializationTime');
      expect(metrics).toHaveProperty('lastValidationTime');
      expect(metrics).toHaveProperty('componentMappingTime');
    });
  });

  describe('measureOperation', () => {
    it('should measure operation duration', async () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      const testOperation = vi.fn().mockResolvedValue('result');
      
      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.measureOperation(testOperation, 'initializationTime');
      });

      expect(operationResult!).toBe('result');
      expect(result.current.metrics.initializationTime).toBeGreaterThan(0);
    });

    it('should measure operation duration even on error', async () => {
      const { result } = renderHook(() => useAdapter(), {
        wrapper: ({ children }) => <AdapterProvider>{children}</AdapterProvider>,
      });

      const testOperation = vi.fn().mockRejectedValue(new Error('Test error'));
      
      await act(async () => {
        try {
          await result.current.measureOperation(testOperation, 'initializationTime');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.metrics.initializationTime).toBeGreaterThan(0);
    });
  });
});