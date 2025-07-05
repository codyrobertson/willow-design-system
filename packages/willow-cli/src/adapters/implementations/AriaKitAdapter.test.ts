import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AriaKitAdapter } from './AriaKitAdapter.js';
import { AdapterError } from '../errors/index.js';

describe('AriaKitAdapter', () => {
  let adapter: AriaKitAdapter;

  beforeEach(() => {
    adapter = new AriaKitAdapter();
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

    it('should have AriaKit capabilities', () => {
      expect(adapter.config.capabilities).toContain('accessibility-first');
      expect(adapter.config.capabilities).toContain('headless-components');
      expect(adapter.config.capabilities).toContain('state-management');
      expect(adapter.config.capabilities).toContain('provider-pattern');
      expect(adapter.config.capabilities).toContain('render-props');
      expect(adapter.config.capabilities).toContain('keyboard-navigation');
      expect(adapter.config.capabilities).toContain('focus-management');
      expect(adapter.config.capabilities).toContain('aria-compliance');
    });

    it('should use strict accessibility mode by default', () => {
      expect(adapter.config.options?.accessibility?.strict).toBe(true);
      expect(adapter.config.options?.accessibility?.preserveAria).toBe(true);
      expect(adapter.config.options?.accessibility?.keyboardNavigation).toBe(true);
    });

    it('should allow custom accessibility configuration', () => {
      const customAdapter = new AriaKitAdapter({
        options: { 
          accessibility: { 
            strict: false,
            preserveAria: false,
            keyboardNavigation: false,
          } 
        }
      });
      const config = customAdapter.config;
      expect(config.options?.accessibility?.strict).toBe(false);
      expect(config.options?.accessibility?.preserveAria).toBe(false);
      expect(config.options?.accessibility?.keyboardNavigation).toBe(false);
    });
  });

  describe('mapComponent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('Button mapping', () => {
      it('should map Button component', () => {
        const result = adapter.mapComponent('Button', {
          children: 'Click me',
          onClick: vi.fn(),
        });

        expect(result.component).toBe('Button');
        expect(result.props?.children).toBe('Click me');
        expect(result.props?.onClick).toBeDefined();
        expect(result.props?.type).toBe('button');
        expect(result.metadata?.originalComponent).toBe('Button');
        expect(result.metadata?.adapterType).toBe('ariakit');
        expect(result.metadata?.ariakitImport).toBe('ariakit/button');
        expect(result.metadata?.ariaPattern).toBe('Button Pattern');
        expect(result.metadata?.category).toBe('concrete');
        expect(result.metadata?.headless).toBe(true);
        expect(result.metadata?.accessible).toBe(true);
        expect(result.metadata?.renderPropSupport).toBe(true);
        expect(result.metadata?.keyboardNavigation).toBe(true);
        expect(result.metadata?.focusManagement).toBe(true);
      });

      it('should support render prop pattern', () => {
        const renderFn = vi.fn(() => 'Rendered content');
        const result = adapter.mapComponent('Button', {
          render: renderFn,
          onClick: vi.fn(),
        });

        expect(result.props?.render).toBe(renderFn);
      });
    });

    describe('Checkbox mapping', () => {
      it('should map Checkbox with state management', () => {
        const result = adapter.mapComponent('Checkbox', {
          checked: true,
          onChange: vi.fn(),
        });

        expect(result.component).toBe('Checkbox');
        expect(result.props?.checked).toBe(true);
        expect(result.props?.onChange).toBeDefined();
        expect(result.metadata?.stateManagement).toEqual({
          hook: 'useCheckboxState',
          storeHook: 'useCheckboxStore',
          provider: 'CheckboxProvider',
          options: {
            checked: true,
          },
        });
        expect(result.metadata?.ariaPattern).toBe('Checkbox Pattern');
      });

      it('should extract state options correctly', () => {
        const result = adapter.mapComponent('Checkbox', {
          defaultChecked: false,
          value: 'checkbox-value',
          name: 'test-checkbox',
        });

        expect(result.metadata?.stateManagement?.options).toEqual({
          defaultChecked: false,
          value: 'checkbox-value',
          name: 'test-checkbox',
        });
      });
    });

    describe('Dialog mapping', () => {
      it('should map Dialog with provider pattern', () => {
        const result = adapter.mapComponent('Dialog', {
          open: true,
          onClose: vi.fn(),
          modal: false,
        });

        expect(result.component).toBe('Dialog');
        expect(result.props?.open).toBe(true);
        expect(result.props?.onClose).toBeDefined();
        expect(result.props?.modal).toBe(false); // Overrides default
        expect(result.metadata?.providerPattern).toEqual({
          component: 'DialogProvider',
          childComponents: ['DialogHeading', 'DialogDescription', 'DialogDismiss'],
          required: true,
        });
        expect(result.metadata?.stateManagement).toEqual({
          hook: 'useDialogState',
          storeHook: 'useDialogStore',
          provider: 'DialogProvider',
          options: {
            open: true,
            modal: false,
          },
        });
      });

      it('should use default modal prop', () => {
        const result = adapter.mapComponent('Dialog', {
          open: true,
        });

        expect(result.props?.modal).toBe(true); // Default value
      });
    });

    describe('Combobox mapping', () => {
      it('should map Combobox with complex state options', () => {
        const result = adapter.mapComponent('Combobox', {
          value: 'test-value',
          gutter: 12,
          sameWidth: false,
          onValueChange: vi.fn(),
        });

        expect(result.component).toBe('Combobox');
        expect(result.props?.value).toBe('test-value');
        expect(result.props?.onValueChange).toBeDefined();
        expect(result.metadata?.stateManagement?.options).toEqual({
          gutter: 12,
          sameWidth: false,
          value: 'test-value',
        });
        expect(result.metadata?.providerPattern?.childComponents).toContain('ComboboxPopover');
        expect(result.metadata?.providerPattern?.childComponents).toContain('ComboboxItem');
        expect(result.metadata?.providerPattern?.childComponents).toContain('ComboboxDisclosure');
      });
    });

    describe('Menu mapping', () => {
      it('should map Menu with keyboard navigation', () => {
        const result = adapter.mapComponent('Menu', {
          placement: 'bottom-start',
          gutter: 8,
          onAction: vi.fn(),
        });

        expect(result.component).toBe('Menu');
        expect(result.props?.placement).toBe('bottom-start');
        expect(result.props?.onAction).toBeDefined();
        expect(result.metadata?.keyboardNavigation).toBe(true);
        expect(result.metadata?.focusManagement).toBe(true);
        expect(result.metadata?.ariaPattern).toBe('Menu Button Pattern');
        expect(result.metadata?.stateManagement?.options).toEqual({
          gutter: 8,
          placement: 'bottom-start',
        });
      });
    });

    describe('Form mapping', () => {
      it('should map Form with validation support', () => {
        const result = adapter.mapComponent('Form', {
          onSubmit: vi.fn(),
          defaultValues: { name: '', email: '' },
        });

        expect(result.component).toBe('Form');
        expect(result.props?.onSubmit).toBeDefined();
        expect(result.props?.defaultValues).toEqual({ name: '', email: '' });
        expect(result.metadata?.providerPattern?.childComponents).toContain('FormField');
        expect(result.metadata?.providerPattern?.childComponents).toContain('FormInput');
        expect(result.metadata?.providerPattern?.childComponents).toContain('FormLabel');
        expect(result.metadata?.providerPattern?.childComponents).toContain('FormError');
        expect(result.metadata?.providerPattern?.childComponents).toContain('FormSubmit');
      });
    });

    describe('Tab mapping', () => {
      it('should map Tab with orientation support', () => {
        const result = adapter.mapComponent('Tab', {
          orientation: 'vertical',
          loop: true,
          defaultSelectedId: 'tab-1',
        });

        expect(result.component).toBe('Tab');
        expect(result.props?.orientation).toBe('vertical');
        expect(result.props?.loop).toBe(true);
        expect(result.props?.defaultSelectedId).toBe('tab-1');
        expect(result.metadata?.stateManagement?.options).toEqual({
          orientation: 'vertical',
          loop: true,
          defaultSelectedId: 'tab-1',
        });
        expect(result.metadata?.ariaPattern).toBe('Tabs Pattern');
      });
    });

    describe('Tooltip mapping', () => {
      it('should map Tooltip with positioning', () => {
        const result = adapter.mapComponent('Tooltip', {
          placement: 'top',
          showTimeout: 500,
          hideTimeout: 0,
        });

        expect(result.component).toBe('Tooltip');
        expect(result.props?.placement).toBe('top');
        expect(result.props?.showTimeout).toBe(500);
        expect(result.props?.hideTimeout).toBe(0);
        expect(result.metadata?.providerPattern?.childComponents).toContain('TooltipAnchor');
        expect(result.metadata?.providerPattern?.childComponents).toContain('TooltipArrow');
      });
    });

    describe('Radio mapping', () => {
      it('should map Radio with required props validation', () => {
        expect(() => {
          adapter.mapComponent('Radio', {
            value: 'option-1',
            // Missing required 'name' prop
          });
        }).toThrow('Missing required props for Radio: name');
      });

      it('should map Radio with all required props', () => {
        const result = adapter.mapComponent('Radio', {
          name: 'radio-group',
          value: 'option-1',
          checked: true,
        });

        expect(result.component).toBe('Radio');
        expect(result.props?.name).toBe('radio-group');
        expect(result.props?.value).toBe('option-1');
        expect(result.props?.checked).toBe(true);
      });
    });

    describe('Heading mapping', () => {
      it('should map Heading with level support', () => {
        const result = adapter.mapComponent('Heading', {
          level: 2,
          children: 'Section Title',
        });

        expect(result.component).toBe('Heading');
        expect(result.props?.level).toBe(2);
        expect(result.props?.children).toBe('Section Title');
        expect(result.metadata?.keyboardNavigation).toBe(false);
        expect(result.metadata?.focusManagement).toBe(false);
        expect(result.metadata?.ariaPattern).toBe('Heading Role');
      });

      it('should use default level when not specified', () => {
        const result = adapter.mapComponent('Heading', {
          children: 'Main Title',
        });

        expect(result.props?.level).toBe(1); // Default value
      });
    });

    describe('VisuallyHidden mapping', () => {
      it('should map VisuallyHidden component', () => {
        const result = adapter.mapComponent('VisuallyHidden', {
          children: 'Screen reader only text',
        });

        expect(result.component).toBe('VisuallyHidden');
        expect(result.props?.children).toBe('Screen reader only text');
        expect(result.metadata?.ariaPattern).toBe('Screen Reader Only');
        expect(result.metadata?.keyboardNavigation).toBe(false);
        expect(result.metadata?.focusManagement).toBe(false);
      });
    });

    describe('Abstract components', () => {
      it('should map Collection component', () => {
        const result = adapter.mapComponent('Collection', {
          items: ['item1', 'item2', 'item3'],
        });

        expect(result.component).toBe('Collection');
        expect(result.props?.items).toEqual(['item1', 'item2', 'item3']);
        expect(result.metadata?.category).toBe('abstract');
        expect(result.metadata?.ariaPattern).toBe('Collection Management');
      });

      it('should map Command component', () => {
        const result = adapter.mapComponent('Command', {
          onCommand: vi.fn(),
        });

        expect(result.component).toBe('Command');
        expect(result.props?.onCommand).toBeDefined();
        expect(result.metadata?.category).toBe('abstract');
        expect(result.metadata?.ariaPattern).toBe('Command Pattern');
      });

      it('should map Composite component', () => {
        const result = adapter.mapComponent('Composite', {
          orientation: 'horizontal',
          loop: false,
        });

        expect(result.component).toBe('Composite');
        expect(result.props?.orientation).toBe('horizontal');
        expect(result.props?.loop).toBe(false);
        expect(result.metadata?.category).toBe('abstract');
        expect(result.metadata?.ariaPattern).toBe('Composite Role');
      });

      it('should map Focusable component', () => {
        const result = adapter.mapComponent('Focusable', {
          autoFocus: true,
          onFocus: vi.fn(),
        });

        expect(result.component).toBe('Focusable');
        expect(result.props?.autoFocus).toBe(true);
        expect(result.props?.onFocus).toBeDefined();
        expect(result.metadata?.category).toBe('abstract');
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
          adapterType: 'ariakit',
          fallback: true,
          accessible: false,
        },
      });
    });

    it('should preserve accessibility props', () => {
      const result = adapter.mapComponent('Button', {
        'aria-label': 'Custom button label',
        'aria-describedby': 'description-id',
        'data-testid': 'test-button',
        role: 'button',
        tabIndex: 0,
        id: 'button-id',
      });

      expect(result.props?.['aria-label']).toBe('Custom button label');
      expect(result.props?.['aria-describedby']).toBe('description-id');
      expect(result.props?.['data-testid']).toBe('test-button');
      expect(result.props?.role).toBe('button');
      expect(result.props?.tabIndex).toBe(0);
      expect(result.props?.id).toBe('button-id');
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new AriaKitAdapter();
      expect(() => 
        uninitializedAdapter.mapComponent('Button', {})
      ).toThrow('Adapter not initialized');
    });
  });

  describe('translateStyles', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should translate styles to headless format', () => {
      const styles = {
        base: {
          padding: '16px',
          margin: '8px',
          borderRadius: '8px',
        },
        colors: {
          backgroundColor: '#1976d2',
          color: '#ffffff',
        },
        typography: {
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.5,
        },
        borders: {
          width: '1px',
          style: 'solid',
          color: '#e0e0e0',
        },
        className: 'custom-class',
      };

      const result = adapter.translateStyles(styles);
      
      expect(result).toEqual({
        style: {
          padding: '16px',
          margin: '8px',
          borderRadius: '8px',
          backgroundColor: '#1976d2',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.5,
          width: '1px',
          style: 'solid',
          color: '#e0e0e0',
        },
        className: 'custom-class',
      });
    });

    it('should handle empty styles config', () => {
      const result = adapter.translateStyles({});
      expect(result).toEqual({});
    });

    it('should handle styles with only className', () => {
      const styles = {
        className: 'utility-classes',
      };

      const result = adapter.translateStyles(styles);
      expect(result).toEqual({
        className: 'utility-classes',
      });
    });
  });

  describe('convertTokens', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should convert tokens to CSS custom properties', () => {
      const tokens = {
        category: 'all',
        path: 'tokens',
        value: 'all',
        tokens: {
          colors: {
            primary: {
              100: '#e3f2fd',
              500: '#1976d2',
              900: '#0d47a1',
            },
            neutral: {
              50: '#fafafa',
              500: '#9e9e9e',
              900: '#212121',
            },
          },
          spacing: {
            xs: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: {
              sm: '14px',
              md: '16px',
              lg: '18px',
            },
          },
          borders: {
            radius: {
              sm: '4px',
              md: '8px',
              lg: '12px',
            },
            width: {
              thin: '1px',
              thick: '2px',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      
      expect(result.cssVariables).toEqual({
        '--color-primary-100': '#e3f2fd',
        '--color-primary-500': '#1976d2',
        '--color-primary-900': '#0d47a1',
        '--color-neutral-50': '#fafafa',
        '--color-neutral-500': '#9e9e9e',
        '--color-neutral-900': '#212121',
        '--spacing-xs': '4px',
        '--spacing-sm': '8px',
        '--spacing-md': '16px',
        '--spacing-lg': '24px',
        '--typography-fontFamily': 'Inter, sans-serif',
        '--typography-fontSize-sm': '14px',
        '--typography-fontSize-md': '16px',
        '--typography-fontSize-lg': '18px',
        '--border-radius-sm': '4px',
        '--border-radius-md': '8px',
        '--border-radius-lg': '12px',
        '--border-width-thin': '1px',
        '--border-width-thick': '2px',
      });
    });

    it('should handle simple color tokens', () => {
      const tokens = {
        category: 'colors',
        path: 'colors',
        value: 'all',
        tokens: {
          colors: {
            primary: '#1976d2',
            secondary: '#9c27b0',
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result.cssVariables).toEqual({
        '--color-primary': '#1976d2',
        '--color-secondary': '#9c27b0',
      });
    });
  });

  describe('AriaKit-specific methods', () => {
    it('should get all available components', () => {
      const components = adapter.getAvailableComponents();
      
      // Concrete components
      expect(components).toContain('Button');
      expect(components).toContain('Checkbox');
      expect(components).toContain('Dialog');
      expect(components).toContain('Menu');
      expect(components).toContain('Tab');
      expect(components).toContain('Tooltip');
      
      // Abstract components
      expect(components).toContain('Collection');
      expect(components).toContain('Command');
      expect(components).toContain('Composite');
      expect(components).toContain('Focusable');
      
      expect(components).toHaveLength(25); // Total components
    });

    it('should get components by category', () => {
      const concreteComponents = adapter.getComponentsByCategory('concrete');
      const abstractComponents = adapter.getComponentsByCategory('abstract');
      
      expect(concreteComponents).toHaveLength(17);
      expect(abstractComponents).toHaveLength(8);
      
      expect(concreteComponents).toContain('Button');
      expect(concreteComponents).toContain('Dialog');
      expect(abstractComponents).toContain('Collection');
      expect(abstractComponents).toContain('Command');
    });

    it('should get component import paths', () => {
      expect(adapter.getComponentImport('Button')).toBe('ariakit/button');
      expect(adapter.getComponentImport('Dialog')).toBe('ariakit/dialog');
      expect(adapter.getComponentImport('Collection')).toBe('ariakit/collection');
      expect(adapter.getComponentImport('UnknownComponent')).toBeUndefined();
    });

    it('should get state hooks', () => {
      expect(adapter.getStateHook('Checkbox')).toBe('useCheckboxState');
      expect(adapter.getStateHook('Dialog')).toBe('useDialogState');
      expect(adapter.getStateHook('Button')).toBeUndefined(); // No state hook
      expect(adapter.getStateHook('UnknownComponent')).toBeUndefined();
    });

    it('should get store hooks', () => {
      expect(adapter.getStoreHook('Checkbox')).toBe('useCheckboxStore');
      expect(adapter.getStoreHook('Dialog')).toBe('useDialogStore');
      expect(adapter.getStoreHook('Button')).toBeUndefined(); // No store hook
      expect(adapter.getStoreHook('UnknownComponent')).toBeUndefined();
    });

    it('should get provider components', () => {
      expect(adapter.getProviderComponent('Dialog')).toBe('DialogProvider');
      expect(adapter.getProviderComponent('Menu')).toBe('MenuProvider');
      expect(adapter.getProviderComponent('Button')).toBeUndefined(); // No provider
      expect(adapter.getProviderComponent('UnknownComponent')).toBeUndefined();
    });

    it('should check render prop support', () => {
      expect(adapter.supportsRenderProps('Button')).toBe(true);
      expect(adapter.supportsRenderProps('Dialog')).toBe(true);
      expect(adapter.supportsRenderProps('UnknownComponent')).toBe(false);
    });

    it('should check provider requirements', () => {
      expect(adapter.requiresProvider('Dialog')).toBe(true);
      expect(adapter.requiresProvider('Menu')).toBe(true);
      expect(adapter.requiresProvider('Button')).toBe(false);
      expect(adapter.requiresProvider('UnknownComponent')).toBe(false);
    });

    it('should get accessibility information', () => {
      const buttonA11y = adapter.getAccessibilityInfo('Button');
      expect(buttonA11y).toEqual({
        ariaPattern: 'Button Pattern',
        keyboardNavigation: true,
        focusManagement: true,
        accessible: true,
      });

      const headingA11y = adapter.getAccessibilityInfo('Heading');
      expect(headingA11y).toEqual({
        ariaPattern: 'Heading Role',
        keyboardNavigation: false,
        focusManagement: false,
        accessible: true,
      });

      expect(adapter.getAccessibilityInfo('UnknownComponent')).toBeUndefined();
    });

    it('should get child components', () => {
      expect(adapter.getChildComponents('Dialog')).toEqual([
        'DialogHeading', 'DialogDescription', 'DialogDismiss'
      ]);
      expect(adapter.getChildComponents('Menu')).toEqual([
        'MenuItem', 'MenuButton', 'MenuSeparator', 'MenuArrow'
      ]);
      expect(adapter.getChildComponents('Button')).toEqual([]);
      expect(adapter.getChildComponents('UnknownComponent')).toEqual([]);
    });

    it('should check if component is stateful', () => {
      expect(adapter.isStateful('Checkbox')).toBe(true);
      expect(adapter.isStateful('Dialog')).toBe(true);
      expect(adapter.isStateful('Button')).toBe(false);
      expect(adapter.isStateful('Heading')).toBe(false);
      expect(adapter.isStateful('UnknownComponent')).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = adapter.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing configuration', () => {
      const invalidAdapter = new AriaKitAdapter({ name: '', version: '' });
      const result = invalidAdapter.validateConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_NAME',
          message: 'Adapter name is required',
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_VERSION',
          message: 'Adapter version is required',
        })
      );
    });

    it('should warn about non-strict accessibility mode', () => {
      const nonStrictAdapter = new AriaKitAdapter({
        options: { accessibility: { strict: false } }
      });
      const result = nonStrictAdapter.validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'ACCESSIBILITY_NOT_STRICT',
          message: 'Accessibility strict mode is recommended for AriaKit',
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