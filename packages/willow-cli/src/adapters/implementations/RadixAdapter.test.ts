import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RadixAdapter } from './RadixAdapter.js';
import { AdapterError } from '../errors/index.js';
import { ComponentMapping } from '../types/index.js';

describe('RadixAdapter', () => {
  let adapter: RadixAdapter;

  beforeEach(() => {
    adapter = new RadixAdapter();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(adapter.initialize()).resolves.not.toThrow();
      expect(adapter.initialized).toBe(true);
    });

    it('should throw error on double initialization', async () => {
      await adapter.initialize();
      await expect(adapter.initialize()).rejects.toThrow('Adapter already initialized');
    });
  });

  describe('mapComponent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should map Dialog component correctly', () => {
      const result = adapter.mapComponent('Dialog', {
        open: true,
        onOpenChange: vi.fn(),
        className: 'custom-dialog',
      });

      expect(result).toEqual({
        component: 'Dialog.Root',
        props: {
          open: true,
          onOpenChange: expect.any(Function),
          className: 'custom-dialog',
        },
        children: undefined,
        metadata: {
          originalComponent: 'Dialog',
          adapterType: 'radix',
          compound: true,
          parts: expect.objectContaining({
            trigger: 'Dialog.Trigger',
            content: 'Dialog.Content',
            overlay: 'Dialog.Overlay',
          }),
        },
      });
    });

    it('should map Select component with all props', () => {
      const onValueChange = vi.fn();
      const result = adapter.mapComponent('Select', {
        value: 'option1',
        defaultValue: 'default',
        onValueChange,
        disabled: true,
        required: true,
        name: 'test-select',
      });

      expect(result.component).toBe('Select.Root');
      expect(result.props).toEqual({
        value: 'option1',
        defaultValue: 'default',
        onValueChange,
        disabled: true,
        required: true,
        name: 'test-select',
      });
    });

    it('should preserve data and aria attributes', () => {
      const result = adapter.mapComponent('Switch', {
        'data-testid': 'my-switch',
        'aria-label': 'Toggle feature',
        checked: true,
      });

      expect(result.props).toMatchObject({
        'data-testid': 'my-switch',
        'aria-label': 'Toggle feature',
        checked: true,
      });
    });

    it('should handle asChild pattern', () => {
      const result = adapter.mapComponent('Dialog', {
        asChild: true,
        children: '<CustomButton />',
      });

      expect(result.metadata?.asChild).toBe(true);
    });

    it('should handle unknown components as fallback', () => {
      const result = adapter.mapComponent('UnknownComponent', {
        prop1: 'value1',
        prop2: 'value2',
      });

      expect(result).toEqual({
        component: 'UnknownComponent',
        props: { prop1: 'value1', prop2: 'value2' },
        metadata: {
          originalComponent: 'UnknownComponent',
          adapterType: 'radix',
          fallback: true,
        },
      });
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new RadixAdapter();
      expect(() => 
        uninitializedAdapter.mapComponent('Dialog', {})
      ).toThrow('Adapter not initialized');
    });
  });

  describe('translateStyles', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should pass through base styles', () => {
      const styles = {
        base: {
          padding: '10px',
          margin: '5px',
          color: 'red',
        },
      };

      const result = adapter.translateStyles(styles);
      expect(result).toEqual({
        padding: '10px',
        margin: '5px',
        color: 'red',
      });
    });

    it('should convert responsive styles to media queries', () => {
      const styles = {
        responsive: {
          sm: { padding: '5px' },
          md: { padding: '10px' },
          lg: { padding: '15px' },
        },
      };

      const result = adapter.translateStyles(styles);
      expect(result).toEqual({
        '@media (min-width: 640px)': { padding: '5px' },
        '@media (min-width: 768px)': { padding: '10px' },
        '@media (min-width: 1024px)': { padding: '15px' },
      });
    });

    it('should handle state styles', () => {
      const styles = {
        states: {
          hover: { backgroundColor: 'blue' },
          focus: { outline: '2px solid red' },
          disabled: { opacity: 0.5 },
        },
      };

      const result = adapter.translateStyles(styles);
      expect(result).toEqual({
        '&:hover': { backgroundColor: 'blue' },
        '&:focus': { outline: '2px solid red' },
        '&:disabled': { opacity: 0.5 },
      });
    });

    it('should handle dark mode styles', () => {
      const styles = {
        dark: {
          backgroundColor: '#000',
          color: '#fff',
        },
      };

      const result = adapter.translateStyles(styles);
      expect(result['&[data-theme="dark"]']).toEqual({
        backgroundColor: '#000',
        color: '#fff',
      });
    });
  });

  describe('convertTokens', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should convert color tokens to CSS variables', () => {
      const tokens = {
        category: 'colors',
        path: 'colors',
        value: 'all',
        tokens: {
          colors: {
            primary: {
              50: '#e3f2fd',
              500: '#2196f3',
              900: '#0d47a1',
            },
            secondary: {
              500: '#f50057',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result).toMatchObject({
        '--color-primary-50': '#e3f2fd',
        '--color-primary-500': '#2196f3',
        '--color-primary-900': '#0d47a1',
        '--color-secondary-500': '#f50057',
      });
    });

    it('should convert spacing tokens', () => {
      const tokens = {
        category: 'spacing',
        path: 'spacing',
        value: 'all',
        tokens: {
          spacing: {
            0: '0',
            1: '4px',
            2: '8px',
            4: '16px',
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result).toMatchObject({
        '--spacing-0': '0',
        '--spacing-1': '4px',
        '--spacing-2': '8px',
        '--spacing-4': '16px',
      });
    });

    it('should convert typography tokens', () => {
      const tokens = {
        category: 'typography',
        path: 'typography',
        value: 'all',
        tokens: {
          typography: {
            fontSize: {
              sm: '14px',
              base: '16px',
              lg: '18px',
            },
            fontFamily: {
              sans: ['Inter', '-apple-system', 'sans-serif'],
              mono: 'Monaco',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result).toMatchObject({
        '--font-size-sm': '14px',
        '--font-size-base': '16px',
        '--font-size-lg': '18px',
        '--font-family-sans': 'Inter, -apple-system, sans-serif',
        '--font-family-mono': 'Monaco',
      });
    });
  });

  describe('compound component mapping', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should map compound component parts', () => {
      const parts = adapter.mapCompoundComponent('Dialog', {
        trigger: { children: 'Open' },
        content: { className: 'dialog-content' },
        title: { children: 'Dialog Title' },
      });

      expect(parts).toEqual({
        trigger: {
          component: 'Dialog.Trigger',
          props: { children: 'Open' },
        },
        content: {
          component: 'Dialog.Content',
          props: { className: 'dialog-content' },
        },
        title: {
          component: 'Dialog.Title',
          props: { children: 'Dialog Title' },
        },
      });
    });

    it('should throw error for unknown component', () => {
      expect(() => 
        adapter.mapCompoundComponent('UnknownComponent', {})
      ).toThrow('Unknown component: UnknownComponent');
    });
  });

  describe('portal handling', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle portal with container', () => {
      const container = document.createElement('div');
      const result = adapter.handlePortal('Dialog', container);

      expect(result).toEqual({
        component: 'Dialog.Portal',
        props: { container },
      });
    });

    it('should handle portal without container', () => {
      const result = adapter.handlePortal('Tooltip');

      expect(result).toEqual({
        component: 'Tooltip.Portal',
        props: {},
      });
    });
  });

  describe('feature support', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should check portal support', () => {
      expect(adapter.supportsFeature('Dialog', 'portal')).toBe(true);
      expect(adapter.supportsFeature('Switch', 'portal')).toBe(false);
    });

    it('should check asChild support', () => {
      expect(adapter.supportsFeature('Dialog', 'asChild')).toBe(true);
      expect(adapter.supportsFeature('Select', 'asChild')).toBe(true);
    });

    it('should check controlled support', () => {
      expect(adapter.supportsFeature('Dialog', 'controlled')).toBe(true);
      expect(adapter.supportsFeature('Select', 'controlled')).toBe(true);
      expect(adapter.supportsFeature('Form', 'controlled')).toBe(false);
    });

    it('should check compound support', () => {
      expect(adapter.supportsFeature('Dialog', 'compound')).toBe(true);
      expect(adapter.supportsFeature('Switch', 'compound')).toBe(true);
    });

    it('should return false for unknown features', () => {
      expect(adapter.supportsFeature('Dialog', 'unknown-feature')).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = adapter.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate missing name', () => {
      const customAdapter = new RadixAdapter({ name: undefined });
      const result = customAdapter.validateConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_NAME',
          message: 'Adapter name is required',
        })
      );
    });

    it('should validate wrong framework', () => {
      const customAdapter = new RadixAdapter({
        framework: { name: 'vue', version: '3.0.0' },
      });
      const result = customAdapter.validateConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_FRAMEWORK',
          message: 'Radix UI requires React framework',
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully', async () => {
      await adapter.initialize();
      expect(adapter.initialized).toBe(true);
      
      await adapter.cleanup();
      expect(adapter.initialized).toBe(false);
    });
  });

  describe('getAvailableComponents', () => {
    it('should return all registered components', () => {
      const components = adapter.getAvailableComponents();
      expect(components).toContain('Dialog');
      expect(components).toContain('Select');
      expect(components).toContain('Accordion');
      expect(components).toContain('Slider');
      expect(components).toContain('Switch');
      expect(components).toContain('Tooltip');
      expect(components).toContain('Popover');
      expect(components).toContain('Form');
    });
  });
});