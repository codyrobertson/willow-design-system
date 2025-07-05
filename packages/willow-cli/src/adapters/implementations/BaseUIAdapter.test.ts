import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseUIAdapter } from './BaseUIAdapter.js';
import { AdapterError } from '../errors/index.js';

describe('BaseUIAdapter', () => {
  let adapter: BaseUIAdapter;

  beforeEach(() => {
    adapter = new BaseUIAdapter();
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

    it('should have BaseUI capabilities', () => {
      expect(adapter.config.capabilities).toContain('headless-components');
      expect(adapter.config.capabilities).toContain('hook-based-architecture');
      expect(adapter.config.capabilities).toContain('slot-composition');
      expect(adapter.config.capabilities).toContain('unstyled-components');
      expect(adapter.config.capabilities).toContain('custom-styling');
      expect(adapter.config.capabilities).toContain('focus-management');
      expect(adapter.config.capabilities).toContain('keyboard-navigation');
    });

    it('should use headless styling by default', () => {
      expect(adapter.config.options?.styling?.headless).toBe(true);
      expect(adapter.config.options?.styling?.customizable).toBe(true);
    });

    it('should allow custom styling configuration', () => {
      const customAdapter = new BaseUIAdapter({
        options: { 
          styling: { 
            headless: false,
            customizable: false,
          } 
        }
      });
      const config = customAdapter.config;
      expect(config.options?.styling?.headless).toBe(false);
      expect(config.options?.styling?.customizable).toBe(false);
    });
  });

  describe('mapComponent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('Button mapping', () => {
      it('should map Button component with hook integration', () => {
        const result = adapter.mapComponent('Button', {
          children: 'Click me',
          onClick: vi.fn(),
          disabled: false,
        });

        expect(result.component).toBe('Button');
        expect(result.props?.children).toBe('Click me');
        expect(result.props?.onClick).toBeDefined();
        expect(result.props?.disabled).toBe(false);
        expect(result.props?.type).toBe('button');
        expect(result.metadata?.originalComponent).toBe('Button');
        expect(result.metadata?.adapterType).toBe('base-ui');
        expect(result.metadata?.baseUIImport).toBe('@mui/base/Button');
        expect(result.metadata?.ariaRole).toBe('button');
        expect(result.metadata?.headless).toBe(true);
        expect(result.metadata?.unstyled).toBe(true);
        expect(result.metadata?.customizable).toBe(true);
        expect(result.metadata?.renderProps).toBe(true);
        expect(result.metadata?.keyboardSupport).toBe(true);
        expect(result.metadata?.focusManagement).toBe(true);
      });

      it('should include hook information', () => {
        const result = adapter.mapComponent('Button', {
          disabled: true,
          focusableWhenDisabled: false,
          tabIndex: -1,
        });

        expect(result.metadata?.hookBased).toEqual({
          hookName: 'useButton',
          hookImport: '@mui/base/useButton',
          returnType: 'props',
          parameters: {
            disabled: true,
            focusableWhenDisabled: false,
            tabIndex: -1,
          },
        });
      });
    });

    describe('Switch mapping', () => {
      it('should map Switch with slot composition', () => {
        const result = adapter.mapComponent('Switch', {
          checked: true,
          onChange: vi.fn(),
        });

        expect(result.component).toBe('Switch');
        expect(result.props?.checked).toBe(true);
        expect(result.props?.onChange).toBeDefined();
        expect(result.metadata?.slotComposition).toEqual({
          slots: {
            root: 'SwitchRoot',
            thumb: 'SwitchThumb',
            input: 'SwitchInput',
            track: 'SwitchTrack',
          },
          slotProps: {
            root: { 'data-state': 'checked' },
            thumb: { className: 'switch-thumb' },
            input: { type: 'checkbox' },
          },
        });
        expect(result.metadata?.ariaRole).toBe('switch');
      });

      it('should handle custom slot props', () => {
        const result = adapter.mapComponent('Switch', {
          checked: false,
          slotProps: {
            root: { className: 'custom-root' },
            thumb: { style: { backgroundColor: 'red' } },
          },
        });

        expect(result.props?.slotProps).toEqual({
          root: { 
            'data-state': 'checked',
            className: 'custom-root',
          },
          thumb: { 
            className: 'switch-thumb',
            style: { backgroundColor: 'red' },
          },
          input: { type: 'checkbox' },
        });
      });
    });

    describe('Slider mapping', () => {
      it('should map Slider with comprehensive slot system', () => {
        const result = adapter.mapComponent('Slider', {
          value: 50,
          min: 0,
          max: 100,
          step: 5,
          onChange: vi.fn(),
        });

        expect(result.component).toBe('Slider');
        expect(result.props?.value).toBe(50);
        expect(result.props?.min).toBe(0);
        expect(result.props?.max).toBe(100);
        expect(result.props?.step).toBe(5);
        expect(result.metadata?.slotComposition?.slots).toEqual({
          root: 'SliderRoot',
          rail: 'SliderRail',
          track: 'SliderTrack',
          thumb: 'SliderThumb',
          mark: 'SliderMark',
          markLabel: 'SliderMarkLabel',
          valueLabel: 'SliderValueLabel',
          input: 'SliderInput',
        });
        expect(result.metadata?.ariaRole).toBe('slider');
      });

      it('should use default values', () => {
        const result = adapter.mapComponent('Slider', {
          onChange: vi.fn(),
        });

        expect(result.props?.min).toBe(0);
        expect(result.props?.max).toBe(100);
        expect(result.props?.step).toBe(1);
      });
    });

    describe('Input mapping', () => {
      it('should map Input component', () => {
        const result = adapter.mapComponent('Input', {
          value: 'test input',
          placeholder: 'Enter text',
          onChange: vi.fn(),
        });

        expect(result.component).toBe('Input');
        expect(result.props?.value).toBe('test input');
        expect(result.props?.placeholder).toBe('Enter text');
        expect(result.props?.onChange).toBeDefined();
        expect(result.metadata?.baseUIImport).toBe('@mui/base/Input');
        expect(result.metadata?.ariaRole).toBe('textbox');
        expect(result.metadata?.hookBased?.hookName).toBe('useInput');
      });
    });

    describe('Select and Option mapping', () => {
      it('should map Select component', () => {
        const result = adapter.mapComponent('Select', {
          value: 'option1',
          onChange: vi.fn(),
        });

        expect(result.component).toBe('Select');
        expect(result.props?.value).toBe('option1');
        expect(result.metadata?.ariaRole).toBe('combobox');
        expect(result.metadata?.slotComposition?.slots).toEqual({
          root: 'SelectRoot',
          button: 'SelectButton',
          listbox: 'SelectListbox',
          option: 'SelectOption',
          popper: 'SelectPopper',
        });
      });

      it('should map Option component with required props validation', () => {
        expect(() => {
          adapter.mapComponent('Option', {
            children: 'Option 1',
            // Missing required 'value' prop
          });
        }).toThrow('Missing required props for Option: value');
      });

      it('should map Option with all required props', () => {
        const result = adapter.mapComponent('Option', {
          value: 'option1',
          children: 'Option 1',
        });

        expect(result.component).toBe('Option');
        expect(result.props?.value).toBe('option1');
        expect(result.props?.children).toBe('Option 1');
        expect(result.metadata?.ariaRole).toBe('option');
      });
    });

    describe('Modal mapping', () => {
      it('should map Modal with comprehensive default props', () => {
        const result = adapter.mapComponent('Modal', {
          open: true,
          onClose: vi.fn(),
          children: 'Modal content',
        });

        expect(result.component).toBe('Modal');
        expect(result.props?.open).toBe(true);
        expect(result.props?.onClose).toBeDefined();
        expect(result.props?.children).toBe('Modal content');
        expect(result.props?.keepMounted).toBe(false);
        expect(result.props?.disableAutoFocus).toBe(false);
        expect(result.props?.disableEnforceFocus).toBe(false);
        expect(result.props?.disableEscapeKeyDown).toBe(false);
        expect(result.props?.disablePortal).toBe(false);
        expect(result.props?.disableRestoreFocus).toBe(false);
        expect(result.props?.disableScrollLock).toBe(false);
        expect(result.metadata?.ariaRole).toBe('dialog');
      });
    });

    describe('Popper mapping', () => {
      it('should map Popper component', () => {
        const result = adapter.mapComponent('Popper', {
          open: true,
          anchorEl: null,
        });

        expect(result.component).toBe('Popper');
        expect(result.props?.open).toBe(true);
        expect(result.props?.anchorEl).toBe(null);
        expect(result.props?.placement).toBe('bottom');
        expect(result.props?.disablePortal).toBe(false);
        expect(result.props?.keepMounted).toBe(false);
        expect(result.metadata?.ariaRole).toBe('tooltip');
        expect(result.metadata?.keyboardSupport).toBe(false);
        expect(result.metadata?.focusManagement).toBe(false);
      });
    });

    describe('Utility components', () => {
      it('should map ClickAwayListener with required props validation', () => {
        expect(() => {
          adapter.mapComponent('ClickAwayListener', {
            children: 'Content',
            // Missing required 'onClickAway' prop
          });
        }).toThrow('Missing required props for ClickAwayListener: onClickAway');
      });

      it('should map ClickAwayListener with proper props', () => {
        const onClickAway = vi.fn();
        const result = adapter.mapComponent('ClickAwayListener', {
          onClickAway,
          children: 'Content',
        });

        expect(result.component).toBe('ClickAwayListener');
        expect(result.props?.onClickAway).toBe(onClickAway);
        expect(result.props?.mouseEvent).toBe('onClick');
        expect(result.props?.touchEvent).toBe('onTouchEnd');
        expect(result.props?.disableReactTree).toBe(false);
      });

      it('should map FocusTrap component', () => {
        const result = adapter.mapComponent('FocusTrap', {
          children: 'Trapped content',
        });

        expect(result.component).toBe('FocusTrap');
        expect(result.props?.children).toBe('Trapped content');
        expect(result.props?.open).toBe(true);
        expect(result.props?.disableAutoFocus).toBe(false);
        expect(result.metadata?.focusManagement).toBe(true);
      });

      it('should map Portal component', () => {
        const result = adapter.mapComponent('Portal', {
          children: 'Portal content',
        });

        expect(result.component).toBe('Portal');
        expect(result.props?.children).toBe('Portal content');
        expect(result.props?.disablePortal).toBe(false);
      });

      it('should map NoSsr component', () => {
        const result = adapter.mapComponent('NoSsr', {
          children: 'SSR content',
        });

        expect(result.component).toBe('NoSsr');
        expect(result.props?.children).toBe('SSR content');
        expect(result.props?.defer).toBe(false);
        expect(result.props?.fallback).toBe(null);
      });

      it('should map TextareaAutosize component', () => {
        const result = adapter.mapComponent('TextareaAutosize', {
          value: 'Multi-line text',
          onChange: vi.fn(),
        });

        expect(result.component).toBe('TextareaAutosize');
        expect(result.props?.value).toBe('Multi-line text');
        expect(result.props?.minRows).toBe(1);
        expect(result.props?.maxRows).toBe(Infinity);
        expect(result.metadata?.ariaRole).toBe('textbox');
      });
    });

    describe('Popup mapping', () => {
      it('should map Popup with required props validation', () => {
        expect(() => {
          adapter.mapComponent('Popup', {
            open: true,
            // Missing required 'anchor' prop
          });
        }).toThrow('Missing required props for Popup: anchor');
      });

      it('should map Popup with proper props', () => {
        const anchor = document.createElement('div');
        const result = adapter.mapComponent('Popup', {
          anchor,
          open: true,
        });

        expect(result.component).toBe('Popup');
        expect(result.props?.anchor).toBe(anchor);
        expect(result.props?.open).toBe(true);
        expect(result.metadata?.baseUIImport).toBe('@mui/base/Unstable_Popup');
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
          adapterType: 'base-ui',
          fallback: true,
          headless: false,
          unstyled: false,
          customizable: false,
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
        title: 'Button title',
      });

      expect(result.props?.['aria-label']).toBe('Custom button label');
      expect(result.props?.['aria-describedby']).toBe('description-id');
      expect(result.props?.['data-testid']).toBe('test-button');
      expect(result.props?.role).toBe('button');
      expect(result.props?.tabIndex).toBe(0);
      expect(result.props?.id).toBe('button-id');
      expect(result.props?.title).toBe('Button title');
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new BaseUIAdapter();
      expect(() => 
        uninitializedAdapter.mapComponent('Button', {})
      ).toThrow('Adapter not initialized');
    });
  });

  describe('translateStyles', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should translate styles to headless format with slot props', () => {
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
        spacing: {
          paddingTop: '8px',
          marginBottom: '4px',
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
          paddingTop: '8px',
          marginBottom: '4px',
        },
        className: 'custom-class',
        slotProps: {
          root: {
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
              paddingTop: '8px',
              marginBottom: '4px',
            },
            className: 'custom-class',
          },
        },
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

    it('should convert tokens to CSS custom properties and theme styles', () => {
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

      expect(result.themeStyles.colors).toEqual({
        'primary-100': 'var(--color-primary-100)',
        'primary-500': 'var(--color-primary-500)',
        'primary-900': 'var(--color-primary-900)',
        'neutral-50': 'var(--color-neutral-50)',
        'neutral-500': 'var(--color-neutral-500)',
        'neutral-900': 'var(--color-neutral-900)',
      });

      expect(result.slotProps).toEqual({
        root: {
          style: result.themeStyles,
        },
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
      expect(result.themeStyles.colors).toEqual({
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      });
    });
  });

  describe('BaseUI-specific methods', () => {
    it('should get all available components', () => {
      const components = adapter.getAvailableComponents();
      
      expect(components).toContain('Button');
      expect(components).toContain('Switch');
      expect(components).toContain('Slider');
      expect(components).toContain('Input');
      expect(components).toContain('Select');
      expect(components).toContain('Option');
      expect(components).toContain('Modal');
      expect(components).toContain('Popper');
      expect(components).toContain('ClickAwayListener');
      expect(components).toContain('FocusTrap');
      expect(components).toContain('Portal');
      expect(components).toContain('NoSsr');
      expect(components).toContain('TextareaAutosize');
      expect(components).toContain('Popup');
      
      expect(components).toHaveLength(14);
    });

    it('should get components by type', () => {
      const headlessComponents = adapter.getComponentsByType('headless');
      const styledComponents = adapter.getComponentsByType('styled');
      
      expect(headlessComponents).toHaveLength(14); // All BaseUI components are headless
      expect(styledComponents).toHaveLength(0);
    });

    it('should get component import paths', () => {
      expect(adapter.getComponentImport('Button')).toBe('@mui/base/Button');
      expect(adapter.getComponentImport('Switch')).toBe('@mui/base/Switch');
      expect(adapter.getComponentImport('Popup')).toBe('@mui/base/Unstable_Popup');
      expect(adapter.getComponentImport('UnknownComponent')).toBeUndefined();
    });

    it('should get component hooks', () => {
      expect(adapter.getComponentHook('Button')).toBe('useButton');
      expect(adapter.getComponentHook('Switch')).toBe('useSwitch');
      expect(adapter.getComponentHook('Portal')).toBeUndefined(); // No hook
      expect(adapter.getComponentHook('UnknownComponent')).toBeUndefined();
    });

    it('should get component slots', () => {
      const buttonSlots = adapter.getComponentSlots('Button');
      expect(buttonSlots).toEqual({ root: 'ButtonRoot' });

      const switchSlots = adapter.getComponentSlots('Switch');
      expect(switchSlots).toEqual({
        root: 'SwitchRoot',
        thumb: 'SwitchThumb',
        input: 'SwitchInput',
        track: 'SwitchTrack',
      });

      expect(adapter.getComponentSlots('Portal')).toBeUndefined();
    });

    it('should check render prop support', () => {
      expect(adapter.supportsRenderProps('Button')).toBe(true);
      expect(adapter.supportsRenderProps('Switch')).toBe(true);
      expect(adapter.supportsRenderProps('Portal')).toBe(false);
      expect(adapter.supportsRenderProps('UnknownComponent')).toBe(false);
    });

    it('should check if component is customizable', () => {
      expect(adapter.isCustomizable('Button')).toBe(true);
      expect(adapter.isCustomizable('Switch')).toBe(true);
      expect(adapter.isCustomizable('ClickAwayListener')).toBe(false);
      expect(adapter.isCustomizable('UnknownComponent')).toBe(false);
    });

    it('should get accessibility information', () => {
      const buttonA11y = adapter.getAccessibilityInfo('Button');
      expect(buttonA11y).toEqual({
        ariaRole: 'button',
        keyboardSupport: true,
        focusManagement: true,
        accessible: true,
      });

      const popperA11y = adapter.getAccessibilityInfo('Popper');
      expect(popperA11y).toEqual({
        ariaRole: 'tooltip',
        keyboardSupport: false,
        focusManagement: false,
        accessible: false,
      });

      expect(adapter.getAccessibilityInfo('UnknownComponent')).toBeUndefined();
    });

    it('should get available hooks', () => {
      const hooks = adapter.getAvailableHooks();
      
      expect(hooks).toContain('useButton');
      expect(hooks).toContain('useSwitch');
      expect(hooks).toContain('useSlider');
      expect(hooks).toContain('useInput');
      expect(hooks).toContain('useSelect');
      expect(hooks).toContain('useOption');
      expect(hooks).toContain('useModal');
      expect(hooks).toContain('usePopper');
      expect(hooks).toContain('usePopup');
      
      expect(hooks).toHaveLength(9);
    });

    it('should get hook configuration', () => {
      const buttonHook = adapter.getHookConfig('useButton');
      expect(buttonHook).toEqual({
        hookName: 'useButton',
        hookImport: '@mui/base/useButton',
        returnType: 'props',
        parameters: {
          disabled: 'boolean',
          focusableWhenDisabled: 'boolean',
          href: 'string',
          onFocusVisible: 'function',
          tabIndex: 'number',
        },
      });

      expect(adapter.getHookConfig('unknownHook')).toBeUndefined();
    });

    it('should check if component is hook-based', () => {
      expect(adapter.isHookBased('Button')).toBe(true);
      expect(adapter.isHookBased('Switch')).toBe(true);
      expect(adapter.isHookBased('Portal')).toBe(false);
      expect(adapter.isHookBased('UnknownComponent')).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = adapter.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing configuration', () => {
      const invalidAdapter = new BaseUIAdapter({ name: '', version: '' });
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

    it('should warn about non-headless mode', () => {
      const nonHeadlessAdapter = new BaseUIAdapter({
        options: { styling: { headless: false } }
      });
      const result = nonHeadlessAdapter.validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'NOT_HEADLESS',
          message: 'BaseUI is designed for headless components',
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