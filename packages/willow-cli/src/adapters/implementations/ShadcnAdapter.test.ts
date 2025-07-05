import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShadcnAdapter } from './ShadcnAdapter.js';
import { AdapterError } from '../errors/index.js';

describe('ShadcnAdapter', () => {
  let adapter: ShadcnAdapter;

  beforeEach(() => {
    adapter = new ShadcnAdapter();
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

    it('should use CSS variables by default', () => {
      expect(adapter.isUsingCssVariables()).toBe(true);
    });

    it('should allow disabling CSS variables', () => {
      const utilityAdapter = new ShadcnAdapter({
        options: { styling: { cssVariables: false } }
      });
      expect(utilityAdapter.isUsingCssVariables()).toBe(false);
    });
  });

  describe('mapComponent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('Button mapping', () => {
      it('should map Button with default variant and size', () => {
        const result = adapter.mapComponent('Button', {
          children: 'Click me',
          onClick: vi.fn(),
        });

        expect(result.component).toBe('button');
        expect(result.props?.className).toContain('inline-flex items-center justify-center');
        expect(result.props?.className).toContain('bg-primary text-primary-foreground');
        expect(result.props?.className).toContain('h-10 px-4 py-2');
        expect(result.props?.children).toBe('Click me');
        expect(result.props?.onClick).toBeDefined();
        expect(result.props?.variant).toBeUndefined(); // Should be removed
        expect(result.props?.size).toBeUndefined(); // Should be removed
      });

      it('should map Button with destructive variant', () => {
        const result = adapter.mapComponent('Button', {
          variant: 'destructive',
          children: 'Delete',
        });

        expect(result.props?.className).toContain('bg-destructive text-destructive-foreground');
      });

      it('should map Button with outline variant and large size', () => {
        const result = adapter.mapComponent('Button', {
          variant: 'outline',
          size: 'lg',
          children: 'Large Outline',
        });

        expect(result.props?.className).toContain('border border-input bg-background');
        expect(result.props?.className).toContain('h-11 rounded-md px-8');
      });

      it('should merge custom className', () => {
        const result = adapter.mapComponent('Button', {
          className: 'custom-class',
          variant: 'ghost',
        });

        expect(result.props?.className).toContain('custom-class');
        expect(result.props?.className).toContain('hover:bg-accent');
      });
    });

    describe('Input mapping', () => {
      it('should map Input component', () => {
        const result = adapter.mapComponent('Input', {
          placeholder: 'Enter text',
          type: 'email',
          disabled: true,
        });

        expect(result.component).toBe('input');
        expect(result.props?.className).toContain('flex h-10 w-full rounded-md border');
        expect(result.props?.placeholder).toBe('Enter text');
        expect(result.props?.type).toBe('email');
        expect(result.props?.disabled).toBe(true);
      });
    });

    describe('Card mapping', () => {
      it('should map Card component with slots', () => {
        const result = adapter.mapComponent('Card', {
          children: 'Card content',
        });

        expect(result.component).toBe('div');
        expect(result.props?.className).toContain('rounded-lg border bg-card');
        expect(result.metadata?.styled).toBe(true);
      });
    });

    describe('Dialog mapping (Radix-based)', () => {
      it('should map Dialog to Radix root', () => {
        const result = adapter.mapComponent('Dialog', {
          open: true,
          onOpenChange: vi.fn(),
        });

        expect(result.component).toBe('Dialog.Root');
        expect(result.props).toEqual({
          open: true,
          onOpenChange: expect.any(Function),
        });
        expect(result.metadata?.radixBased).toBe(true);
      });

      it('should handle Dialog modal prop', () => {
        const result = adapter.mapComponent('Dialog', {
          modal: false,
        });

        expect(result.props?.modal).toBe(false);
      });
    });

    describe('Select mapping (Radix-based)', () => {
      it('should map Select with Radix props', () => {
        const onValueChange = vi.fn();
        const result = adapter.mapComponent('Select', {
          value: 'option1',
          onValueChange,
          disabled: true,
        });

        expect(result.component).toBe('Select.Root');
        expect(result.props).toEqual({
          value: 'option1',
          onValueChange,
          disabled: true,
        });
      });
    });

    describe('Badge mapping', () => {
      it('should map Badge with variants', () => {
        const result = adapter.mapComponent('Badge', {
          variant: 'secondary',
          children: 'New',
        });

        expect(result.component).toBe('div');
        expect(result.props?.className).toContain('inline-flex items-center rounded-full');
        expect(result.props?.className).toContain('bg-secondary text-secondary-foreground');
      });

      it('should use default variant when not specified', () => {
        const result = adapter.mapComponent('Badge', {
          children: 'Badge',
        });

        expect(result.props?.className).toContain('bg-primary text-primary-foreground');
      });
    });

    describe('Alert mapping', () => {
      it('should map Alert with destructive variant', () => {
        const result = adapter.mapComponent('Alert', {
          variant: 'destructive',
          children: 'Error message',
        });

        expect(result.component).toBe('div');
        expect(result.props?.className).toContain('relative w-full rounded-lg border');
        expect(result.props?.className).toContain('border-destructive/50 text-destructive');
      });
    });

    it('should handle unknown components as fallback', () => {
      const result = adapter.mapComponent('UnknownComponent', {
        prop1: 'value1',
      });

      expect(result).toEqual({
        component: 'UnknownComponent',
        props: { prop1: 'value1' },
        metadata: {
          originalComponent: 'UnknownComponent',
          adapterType: 'shadcn',
          fallback: true,
        },
      });
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new ShadcnAdapter();
      expect(() => 
        uninitializedAdapter.mapComponent('Button', {})
      ).toThrow('Adapter not initialized');
    });
  });

  describe('translateStyles', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('CSS variables mode', () => {
      it('should translate colors to CSS variables', () => {
        const styles = {
          colors: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#007bff',
          },
        };

        const result = adapter.translateStyles(styles);
        expect(result).toEqual({
          '--background': '#ffffff',
          '--foreground': '#000000',
          '--primary': '#007bff',
        });
      });

      it('should translate spacing to CSS variables', () => {
        const styles = {
          spacing: {
            small: '8px',
            medium: '16px',
            large: '24px',
          },
        };

        const result = adapter.translateStyles(styles);
        expect(result).toMatchObject({
          '--spacing-small': '8px',
          '--spacing-medium': '16px',
          '--spacing-large': '24px',
        });
      });

      it('should translate border radius', () => {
        const styles = {
          borders: {
            radius: {
              sm: '4px',
              md: '8px',
              lg: '12px',
            },
          },
        };

        const result = adapter.translateStyles(styles);
        expect(result).toMatchObject({
          '--radius-sm': '4px',
          '--radius-md': '8px',
          '--radius-lg': '12px',
        });
      });
    });

    describe('Utility classes mode', () => {
      let utilityAdapter: ShadcnAdapter;

      beforeEach(async () => {
        utilityAdapter = new ShadcnAdapter({
          options: { styling: { cssVariables: false } }
        });
        await utilityAdapter.initialize();
      });

      it('should translate to Tailwind utility classes', () => {
        const styles = {
          base: {
            padding: '16px',
            margin: '8px',
          },
          colors: {
            backgroundColor: '#007bff',
            color: '#ffffff',
          },
        };

        const result = utilityAdapter.translateStyles(styles);
        expect(result.className).toContain('p-4');
        expect(result.className).toContain('m-2');
        expect(result.className).toContain('bg-primary');
        expect(result.className).toContain('text-primary');
      });
    });
  });

  describe('convertTokens', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should convert color tokens to OKLCH format', () => {
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
            neutral: {
              50: '#fafafa',
              100: '#f5f5f5',
              900: '#212529',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      
      // Should have Shadcn-specific mappings
      expect(result).toHaveProperty('--background');
      expect(result).toHaveProperty('--foreground');
      expect(result).toHaveProperty('--primary');
      expect(result).toHaveProperty('--secondary');
      expect(result).toHaveProperty('--muted');
      expect(result).toHaveProperty('--accent');
      expect(result).toHaveProperty('--destructive');
      expect(result).toHaveProperty('--border');
      expect(result).toHaveProperty('--ring');
    });

    it('should handle border radius tokens', () => {
      const tokens = {
        category: 'borders',
        path: 'borders',
        value: 'all',
        tokens: {
          borders: {
            radius: {
              sm: '4px',
              md: '8px',
              lg: '12px',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result['--radius']).toBe('8px');
    });

    it('should convert to Tailwind config format when not using CSS variables', async () => {
      const utilityAdapter = new ShadcnAdapter({
        options: { styling: { cssVariables: false } }
      });
      await utilityAdapter.initialize();

      const tokens = {
        category: 'colors',
        path: 'colors',
        value: 'all',
        tokens: {
          colors: {
            primary: {
              500: '#2196f3',
            },
            secondary: '#6c757d',
          },
          spacing: {
            1: '4px',
            2: '8px',
          },
        },
      };

      const result = utilityAdapter.convertTokens(tokens);
      expect(result.colors).toEqual({
        primary: { 500: '#2196f3' },
        secondary: { DEFAULT: '#6c757d' },
      });
      expect(result.spacing).toEqual({
        1: '4px',
        2: '8px',
      });
    });
  });

  describe('getComponentClasses', () => {
    it('should return component classes without props', () => {
      const classes = adapter.getComponentClasses('Button');
      expect(classes).toContain('inline-flex items-center');
      expect(classes).toContain('bg-primary'); // default variant
      expect(classes).toContain('h-10 px-4'); // default size
    });

    it('should return component classes with specific props', () => {
      const classes = adapter.getComponentClasses('Button', {
        variant: 'outline',
        size: 'sm',
      });
      expect(classes).toContain('border border-input');
      expect(classes).toContain('h-9 rounded-md px-3');
    });

    it('should return empty string for unknown component', () => {
      const classes = adapter.getComponentClasses('UnknownComponent');
      expect(classes).toBe('');
    });
  });

  describe('getThemeConfig', () => {
    it('should return CSS variables theme config', () => {
      const config = adapter.getThemeConfig();
      expect(config).toEqual({
        mode: 'css-variables',
        darkMode: 'class',
        prefix: '',
      });
    });

    it('should return utility classes theme config', () => {
      const utilityAdapter = new ShadcnAdapter({
        options: { styling: { cssVariables: false, prefix: 'tw-' } }
      });
      const config = utilityAdapter.getThemeConfig();
      expect(config).toEqual({
        mode: 'utility-classes',
        darkMode: 'class',
        prefix: 'tw-',
      });
    });
  });

  describe('getAvailableComponents', () => {
    it('should return all registered components', () => {
      const components = adapter.getAvailableComponents();
      expect(components).toContain('Button');
      expect(components).toContain('Dialog');
      expect(components).toContain('Input');
      expect(components).toContain('Card');
      expect(components).toContain('Select');
      expect(components).toContain('Checkbox');
      expect(components).toContain('Switch');
      expect(components).toContain('Badge');
      expect(components).toContain('Alert');
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = adapter.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about missing Tailwind config', () => {
      const customAdapter = new ShadcnAdapter({
        options: { styling: { tailwindConfig: false } }
      });
      const result = customAdapter.validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_TAILWIND',
          message: 'Tailwind CSS configuration not found',
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
});