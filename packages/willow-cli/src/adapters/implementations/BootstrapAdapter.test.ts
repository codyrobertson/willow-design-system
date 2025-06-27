/**
 * Bootstrap Adapter Test Suite
 * 
 * Comprehensive tests for Bootstrap 5 adapter implementation covering:
 * - Component mapping
 * - Utility class translation
 * - Style transformation
 * - Token conversion
 * - JavaScript component handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BootstrapAdapter, createBootstrapAdapter } from './BootstrapAdapter';
import type {
  AdapterConfig,
  ComponentMapping,
  StyleConfig,
  TokenConfig,
  ValidationResult,
} from '../types';

describe('BootstrapAdapter', () => {
  let adapter: BootstrapAdapter;

  beforeEach(async () => {
    adapter = new BootstrapAdapter();
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(adapter.id).toBe('bootstrap-adapter');
      expect(adapter.config.name).toBe('bootstrap-adapter');
      expect(adapter.config.framework.name).toBe('Bootstrap');
      expect(adapter.config.framework.version).toBe('5.3.0');
      expect(adapter.initialized).toBe(true);
    });

    it('should accept custom configuration', async () => {
      const customConfig: Partial<AdapterConfig> = {
        displayName: 'Custom Bootstrap Adapter',
        options: {
          theme: {
            mode: 'dark',
          },
        },
      };

      const customAdapter = createBootstrapAdapter(customConfig);
      await customAdapter.initialize();

      expect(customAdapter.config.displayName).toBe('Custom Bootstrap Adapter');
      expect(customAdapter.config.options.theme?.mode).toBe('dark');

      await customAdapter.cleanup();
    });

    it('should validate configuration on initialization', async () => {
      const invalidAdapter = new BootstrapAdapter({
        name: '',
        version: '',
      });

      await expect(invalidAdapter.initialize()).rejects.toThrow('Invalid adapter configuration');
    });

    it('should include expected capabilities', () => {
      expect(adapter.config.capabilities).toContain('component-mapping');
      expect(adapter.config.capabilities).toContain('style-translation');
      expect(adapter.config.capabilities).toContain('token-conversion');
      expect(adapter.config.capabilities).toContain('theme-switching');
      expect(adapter.config.capabilities).toContain('documentation-generation');
    });
  });

  describe('Component Mapping', () => {
    describe('Button Component', () => {
      it('should map basic button', () => {
        const mapping = adapter.mapComponent('Button', {
          children: 'Click me',
        });

        expect(mapping.source).toBe('Button');
        expect(mapping.target).toBe('btn');
        expect(mapping.props.className).toBe('btn');
        expect(mapping.children).toBe('Click me');
      });

      it('should map button variants', () => {
        const variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'link'];
        
        variants.forEach(variant => {
          const mapping = adapter.mapComponent('Button', { variant });
          expect(mapping.props.className).toContain(`btn-${variant}`);
        });
      });

      it('should map outline button variants', () => {
        const outlineVariants = ['primary', 'secondary', 'success', 'danger'];
        
        outlineVariants.forEach(variant => {
          const mapping = adapter.mapComponent('Button', { outline: variant });
          expect(mapping.props.className).toContain(`btn-outline-${variant}`);
        });
      });

      it('should map button sizes', () => {
        const mapping_sm = adapter.mapComponent('Button', { size: 'sm' });
        expect(mapping_sm.props.className).toContain('btn-sm');

        const mapping_lg = adapter.mapComponent('Button', { size: 'lg' });
        expect(mapping_lg.props.className).toContain('btn-lg');
      });

      it('should preserve custom className', () => {
        const mapping = adapter.mapComponent('Button', {
          variant: 'primary',
          className: 'custom-class',
        });
        
        expect(mapping.props.className).toContain('btn');
        expect(mapping.props.className).toContain('btn-primary');
        expect(mapping.props.className).toContain('custom-class');
      });

      it('should map data attributes', () => {
        const mapping = adapter.mapComponent('Button', {
          toggle: 'modal',
          target: '#myModal',
          dismiss: 'modal',
        });

        expect(mapping.props['data-bs-toggle']).toBe('modal');
        expect(mapping.props['data-bs-target']).toBe('#myModal');
        expect(mapping.props['data-bs-dismiss']).toBe('modal');
      });
    });

    describe('Card Component', () => {
      it('should map basic card', () => {
        const mapping = adapter.mapComponent('Card', {});
        
        expect(mapping.source).toBe('Card');
        expect(mapping.target).toBe('card');
        expect(mapping.props.className).toBe('card');
      });

      it('should handle card with custom classes', () => {
        const mapping = adapter.mapComponent('Card', {
          className: 'shadow-lg',
        });
        
        expect(mapping.props.className).toContain('card');
        expect(mapping.props.className).toContain('shadow-lg');
      });
    });

    describe('Modal Component', () => {
      it('should map modal with JS component flag', () => {
        const mapping = adapter.mapComponent('Modal', {});
        
        expect(mapping.source).toBe('Modal');
        expect(mapping.target).toBe('modal');
        expect(mapping.props.className).toContain('modal');
        expect(mapping.props.className).toContain('fade');
        expect(mapping.metadata.jsComponent).toBe(true);
        expect(mapping.props['data-bs-component']).toBe('modal');
      });

      it('should map modal data attributes', () => {
        const mapping = adapter.mapComponent('Modal', {
          backdrop: 'static',
          keyboard: false,
          focus: true,
        });

        expect(mapping.props['data-bs-backdrop']).toBe('static');
        expect(mapping.props['data-bs-keyboard']).toBe(false);
        expect(mapping.props['data-bs-focus']).toBe(true);
      });

      it('should map modal sizes', () => {
        const sizes = ['sm', 'lg', 'xl'];
        
        sizes.forEach(size => {
          const mapping = adapter.mapComponent('Modal', { size });
          expect(mapping.props.className).toContain(`modal-${size}`);
        });
      });
    });

    describe('Alert Component', () => {
      it('should map alert variants', () => {
        const variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        
        variants.forEach(variant => {
          const mapping = adapter.mapComponent('Alert', { variant });
          expect(mapping.props.className).toContain('alert');
          expect(mapping.props.className).toContain(`alert-${variant}`);
        });
      });

      it('should map dismissible alert', () => {
        const mapping = adapter.mapComponent('Alert', {
          variant: 'warning',
          dismissible: true,
        });

        expect(mapping.props.className).toContain('alert');
        expect(mapping.props.className).toContain('alert-warning');
        expect(mapping.props.className).toContain('alert-dismissible');
        expect(mapping.props.className).toContain('fade');
        expect(mapping.props.className).toContain('show');
      });
    });

    describe('Form Components', () => {
      it('should map input component', () => {
        const mapping = adapter.mapComponent('Input', {
          type: 'text',
          placeholder: 'Enter text',
        });

        expect(mapping.target).toBe('form-control');
        expect(mapping.props.className).toBe('form-control');
        expect(mapping.props.type).toBe('text');
        expect(mapping.props.placeholder).toBe('Enter text');
      });

      it('should map input sizes', () => {
        const mapping_sm = adapter.mapComponent('Input', { size: 'sm' });
        expect(mapping_sm.props.className).toContain('form-control-sm');

        const mapping_lg = adapter.mapComponent('Input', { size: 'lg' });
        expect(mapping_lg.props.className).toContain('form-control-lg');
      });

      it('should map select component', () => {
        const mapping = adapter.mapComponent('Select', {});
        expect(mapping.target).toBe('form-select');
        expect(mapping.props.className).toBe('form-select');
      });

      it('should map checkbox component', () => {
        const mapping = adapter.mapComponent('Checkbox', {});
        expect(mapping.target).toBe('form-check-input');
        expect(mapping.props.className).toBe('form-check-input');
      });

      it('should map switch component', () => {
        const mapping = adapter.mapComponent('Switch', {});
        expect(mapping.target).toBe('form-switch');
        expect(mapping.props.className).toBe('form-check-input');
      });
    });

    describe('Navigation Components', () => {
      it('should map nav component', () => {
        const mapping = adapter.mapComponent('Nav', {});
        expect(mapping.target).toBe('nav');
        expect(mapping.props.className).toBe('nav');
      });

      it('should map nav styles', () => {
        const styles = ['nav-tabs', 'nav-pills', 'nav-fill'];
        
        styles.forEach(style => {
          const mapping = adapter.mapComponent('Nav', { style });
          expect(mapping.props.className).toContain('nav');
          expect(mapping.props.className).toContain(style);
        });
      });

      it('should map navbar component', () => {
        const mapping = adapter.mapComponent('Navbar', {
          expand: 'lg',
          color: 'dark',
        });

        expect(mapping.target).toBe('navbar');
        expect(mapping.props.className).toContain('navbar');
        expect(mapping.props.className).toContain('navbar-expand-lg');
        expect(mapping.props.className).toContain('navbar-dark');
      });
    });

    describe('JavaScript Components', () => {
      it('should map dropdown component', () => {
        const mapping = adapter.mapComponent('Dropdown', {
          autoClose: 'outside',
        });

        expect(mapping.target).toBe('dropdown');
        expect(mapping.props.className).toBe('dropdown');
        expect(mapping.metadata.jsComponent).toBe(true);
        expect(mapping.props['data-bs-auto-close']).toBe('outside');
      });

      it('should map tooltip component', () => {
        const mapping = adapter.mapComponent('Tooltip', {
          toggle: 'tooltip',
          placement: 'top',
          title: 'Tooltip text',
        });

        expect(mapping.target).toBe('tooltip');
        expect(mapping.metadata.jsComponent).toBe(true);
        expect(mapping.props['data-bs-toggle']).toBe('tooltip');
        expect(mapping.props['data-bs-placement']).toBe('top');
        expect(mapping.props['data-bs-title']).toBe('Tooltip text');
      });

      it('should map popover component', () => {
        const mapping = adapter.mapComponent('Popover', {
          toggle: 'popover',
          placement: 'right',
          title: 'Popover Title',
          content: 'Popover content',
          trigger: 'hover',
        });

        expect(mapping.target).toBe('popover');
        expect(mapping.metadata.jsComponent).toBe(true);
        expect(mapping.props['data-bs-toggle']).toBe('popover');
        expect(mapping.props['data-bs-placement']).toBe('right');
        expect(mapping.props['data-bs-title']).toBe('Popover Title');
        expect(mapping.props['data-bs-content']).toBe('Popover content');
        expect(mapping.props['data-bs-trigger']).toBe('hover');
      });

      it('should map collapse component', () => {
        const mapping = adapter.mapComponent('Collapse', {
          toggle: 'collapse',
          target: '#collapseExample',
        });

        expect(mapping.target).toBe('collapse');
        expect(mapping.props.className).toBe('collapse');
        expect(mapping.metadata.jsComponent).toBe(true);
        expect(mapping.props['data-bs-toggle']).toBe('collapse');
        expect(mapping.props['data-bs-target']).toBe('#collapseExample');
      });
    });

    it('should throw error for unknown component', () => {
      expect(() => adapter.mapComponent('UnknownComponent', {})).toThrow(
        'Component "UnknownComponent" not found in Bootstrap adapter'
      );
    });
  });

  describe('Style Translation', () => {
    describe('Layout Styles', () => {
      it('should translate display utilities', () => {
        const styles: StyleConfig = {
          layout: {
            display: 'none',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('d-none');
      });

      it('should translate flexbox utilities', () => {
        const styles: StyleConfig = {
          layout: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'start',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('d-flex');
        expect(translated.className).toContain('flex-column');
        expect(translated.className).toContain('justify-content-center');
        expect(translated.className).toContain('align-items-start');
      });

      it('should translate position utilities', () => {
        const styles: StyleConfig = {
          layout: {
            position: 'absolute',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('position-absolute');
      });

      it('should fall back to inline styles for unsupported values', () => {
        const styles: StyleConfig = {
          layout: {
            display: 'contents',
            width: '250px',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect((translated.style as any).display).toBe('contents');
        expect((translated.style as any).width).toBe('250px');
      });
    });

    describe('Typography Styles', () => {
      it('should translate font size utilities', () => {
        const styles: StyleConfig = {
          typography: {
            fontSize: '1',
            fontWeight: 'bold',
            textAlign: 'center',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('fs-1');
        expect(translated.className).toContain('fw-bold');
        expect(translated.className).toContain('text-center');
      });

      it('should translate text decoration utilities', () => {
        const styles: StyleConfig = {
          typography: {
            textDecoration: 'underline',
            textTransform: 'uppercase',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('text-decoration-underline');
        expect(translated.className).toContain('text-uppercase');
      });
    });

    describe('Color Styles', () => {
      it('should translate text color utilities', () => {
        const styles: StyleConfig = {
          colors: {
            color: 'primary',
            backgroundColor: 'light',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('text-primary');
        expect(translated.className).toContain('bg-light');
      });

      it('should translate border color utilities', () => {
        const styles: StyleConfig = {
          colors: {
            borderColor: 'danger',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('border-danger');
      });
    });

    describe('Spacing Styles', () => {
      it('should translate margin utilities', () => {
        const styles: StyleConfig = {
          spacing: {
            margin: '3',
            marginTop: '2',
            marginBottom: '4',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('m-3');
        expect(translated.className).toContain('mt-2');
        expect(translated.className).toContain('mb-4');
      });

      it('should translate padding utilities', () => {
        const styles: StyleConfig = {
          spacing: {
            padding: '2',
            paddingLeft: '3',
            paddingRight: '3',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('p-2');
        expect(translated.className).toContain('ps-3');
        expect(translated.className).toContain('pe-3');
      });

      it('should handle custom spacing values', () => {
        const styles: StyleConfig = {
          spacing: {
            margin: '24px',
            padding: '1.5rem',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect((translated.style as any).margin).toBe('24px');
        expect((translated.style as any).padding).toBe('1.5rem');
      });
    });

    describe('Border Styles', () => {
      it('should translate border utilities', () => {
        const styles: StyleConfig = {
          borders: {
            border: '1px solid',
            borderRadius: 'lg',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('border');
        expect(translated.className).toContain('rounded-3');
      });

      it('should translate special border radius values', () => {
        const styles: StyleConfig = {
          borders: {
            borderRadius: '50%',
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('rounded-circle');
      });
    });

    describe('Responsive Styles', () => {
      it('should translate responsive display utilities', () => {
        const styles: StyleConfig = {
          responsive: {
            sm: { display: 'none' },
            md: { display: 'block' },
            lg: { display: 'flex' },
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('d-sm-none');
        expect(translated.className).toContain('d-md-block');
        expect(translated.className).toContain('d-lg-flex');
      });

      it('should translate responsive column utilities', () => {
        const styles: StyleConfig = {
          responsive: {
            sm: { col: '12' },
            md: { col: '6' },
            lg: { col: '4' },
          },
        };

        const translated = adapter.translateStyles(styles);
        expect(translated.className).toContain('col-sm-12');
        expect(translated.className).toContain('col-md-6');
        expect(translated.className).toContain('col-lg-4');
      });

      it('should create media queries for other responsive styles', () => {
        const styles: StyleConfig = {
          responsive: {
            md: { 
              padding: '2rem',
              margin: '1rem',
            },
          },
        };

        const translated = adapter.translateStyles(styles);
        const mediaQuery = '@media (min-width: 768px)';
        expect((translated.style as any)[mediaQuery]).toBeDefined();
        expect((translated.style as any)[mediaQuery].padding).toBe('2rem');
        expect((translated.style as any)[mediaQuery].margin).toBe('1rem');
      });
    });
  });

  describe('Token Conversion', () => {
    it('should convert color tokens', () => {
      const tokens: TokenConfig = {
        category: 'colors',
        path: 'colors',
        value: {},
        tokens: {
          colors: {
            primary: { value: '#007bff' },
            secondary: { value: '#6c757d' },
            success: { value: '#28a745' },
            danger: { value: '#dc3545' },
            warning: { value: '#ffc107' },
            info: { value: '#17a2b8' },
            light: { value: '#f8f9fa' },
            dark: { value: '#343a40' },
          },
        },
      };

      const converted = adapter.convertTokens(tokens);
      expect(converted.colors).toMatchObject({
        '--bs-primary': { value: '#007bff' },
        '--bs-secondary': { value: '#6c757d' },
        '--bs-success': { value: '#28a745' },
        '--bs-danger': { value: '#dc3545' },
        '--bs-warning': { value: '#ffc107' },
        '--bs-info': { value: '#17a2b8' },
        '--bs-light': { value: '#f8f9fa' },
        '--bs-dark': { value: '#343a40' },
      });
    });

    it('should convert typography tokens', () => {
      const tokens: TokenConfig = {
        category: 'typography',
        path: 'typography',
        value: {},
        tokens: {
          typography: {
            fontfamilybase: 'Arial, sans-serif',
            fontsizebase: '1rem',
            fontweightnormal: '400',
            fontweightbold: '700',
            lineheightbase: '1.5',
          },
        },
      };

      const converted = adapter.convertTokens(tokens);
      expect((converted.typography as any)['--bs-font-family-base']).toBe('Arial, sans-serif');
      expect((converted.typography as any)['--bs-font-size-base']).toBe('1rem');
      expect((converted.typography as any)['--bs-font-weight-normal']).toBe('400');
      expect((converted.typography as any)['--bs-font-weight-bold']).toBe('700');
      expect((converted.typography as any)['--bs-line-height-base']).toBe('1.5');
    });

    it('should convert spacing tokens', () => {
      const tokens: TokenConfig = {
        category: 'spacing',
        path: 'spacing',
        value: {},
        tokens: {
          spacing: {
            '0': '0',
            '1': '0.25rem',
            '2': '0.5rem',
            '3': '1rem',
            '4': '1.5rem',
            '5': '3rem',
          },
        },
      };

      const converted = adapter.convertTokens(tokens);
      expect((converted.spacing as any)['--bs-spacing-0']).toBe('0');
      expect((converted.spacing as any)['--bs-spacing-1']).toBe('0.25rem');
      expect((converted.spacing as any)['--bs-spacing-2']).toBe('0.5rem');
      expect((converted.spacing as any)['--bs-spacing-3']).toBe('1rem');
      expect((converted.spacing as any)['--bs-spacing-4']).toBe('1.5rem');
      expect((converted.spacing as any)['--bs-spacing-5']).toBe('3rem');
    });

    it('should convert border tokens', () => {
      const tokens: TokenConfig = {
        category: 'borders',
        path: 'borders',
        value: {},
        tokens: {
          borders: {
            width: {
              '1': '1px',
              default: '1px',
            },
            radius: {
              sm: '0.25rem',
              md: '0.375rem',
              lg: '0.5rem',
              xl: '1rem',
              full: '9999px',
              default: '0.375rem',
            },
          },
        },
      };

      const converted = adapter.convertTokens(tokens);
      expect((converted.borders as any)['--bs-border-width']).toBe('1px');
      expect((converted.borders as any)['--bs-border-radius']).toBe('0.375rem');
      expect((converted.borders as any)['--bs-border-radius-sm']).toBe('0.25rem');
      expect((converted.borders as any)['--bs-border-radius-lg']).toBe('0.5rem');
      expect((converted.borders as any)['--bs-border-radius-xl']).toBe('1rem');
      expect((converted.borders as any)['--bs-border-radius-pill']).toBe('9999px');
    });

    it('should convert shadow tokens', () => {
      const tokens: TokenConfig = {
        category: 'shadows',
        path: 'shadows',
        value: {},
        tokens: {
          shadows: {
            sm: '0 .125rem .25rem rgba(0,0,0,.075)',
            md: '0 .5rem 1rem rgba(0,0,0,.15)',
            lg: '0 1rem 3rem rgba(0,0,0,.175)',
            inner: 'inset 0 1px 2px rgba(0,0,0,.075)',
          },
        },
      };

      const converted = adapter.convertTokens(tokens);
      expect((converted.shadows as any)['--bs-box-shadow-sm']).toBe('0 .125rem .25rem rgba(0,0,0,.075)');
      expect((converted.shadows as any)['--bs-box-shadow']).toBe('0 .5rem 1rem rgba(0,0,0,.15)');
      expect((converted.shadows as any)['--bs-box-shadow-lg']).toBe('0 1rem 3rem rgba(0,0,0,.175)');
      expect((converted.shadows as any)['--bs-box-shadow-inset']).toBe('inset 0 1px 2px rgba(0,0,0,.075)');
    });

    it('should convert breakpoint tokens', () => {
      const tokens: TokenConfig = {
        category: 'breakpoints',
        path: 'breakpoints',
        value: {},
        tokens: {
          breakpoints: {
            xs: '0',
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1400px',
          },
        },
      };

      const converted = adapter.convertTokens(tokens);
      expect((converted.breakpoints as any)['--bs-breakpoint-xs']).toBe('0');
      expect((converted.breakpoints as any)['--bs-breakpoint-sm']).toBe('576px');
      expect((converted.breakpoints as any)['--bs-breakpoint-md']).toBe('768px');
      expect((converted.breakpoints as any)['--bs-breakpoint-lg']).toBe('992px');
      expect((converted.breakpoints as any)['--bs-breakpoint-xl']).toBe('1200px');
      expect((converted.breakpoints as any)['--bs-breakpoint-xxl']).toBe('1400px');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const result = adapter.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidAdapter = new BootstrapAdapter({
        name: '',
        version: '',
        framework: undefined as any,
      });

      const result = invalidAdapter.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].code).toBe('MISSING_NAME');
      expect(result.errors[1].code).toBe('MISSING_VERSION');
      expect(result.errors[2].code).toBe('MISSING_FRAMEWORK');
    });

    it('should validate framework compatibility', () => {
      const invalidAdapter = new BootstrapAdapter({
        framework: {
          name: 'React',
          version: '18.0.0',
        },
      });

      const result = invalidAdapter.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_FRAMEWORK',
          expected: 'Bootstrap',
          actual: 'React',
        })
      );
    });

    it('should warn about missing capabilities', () => {
      const adapterWithoutCapabilities = new BootstrapAdapter({
        capabilities: [],
      });

      const result = adapterWithoutCapabilities.validateConfig();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('NO_CAPABILITIES');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      const cleanupAdapter = new BootstrapAdapter();
      await cleanupAdapter.initialize();
      
      expect(cleanupAdapter.initialized).toBe(true);
      
      await cleanupAdapter.cleanup();
      
      expect(cleanupAdapter.initialized).toBe(false);
    });

    it('should handle cleanup errors gracefully', async () => {
      const errorAdapter = new BootstrapAdapter();
      await errorAdapter.initialize();

      // Mock plugin manager cleanup to throw
      vi.spyOn(errorAdapter['pluginManager'], 'cleanup').mockRejectedValue(
        new Error('Cleanup failed')
      );

      await expect(errorAdapter.cleanup()).rejects.toThrow('Failed to cleanup Bootstrap adapter');
    });
  });

  describe('Factory Function', () => {
    it('should create adapter instance using factory', async () => {
      const factoryAdapter = createBootstrapAdapter({
        displayName: 'Factory Bootstrap Adapter',
      });

      await factoryAdapter.initialize();
      
      expect(factoryAdapter).toBeInstanceOf(BootstrapAdapter);
      expect(factoryAdapter.config.displayName).toBe('Factory Bootstrap Adapter');
      
      await factoryAdapter.cleanup();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty props gracefully', () => {
      const mapping = adapter.mapComponent('Button', {});
      expect(mapping.props.className).toBe('btn');
      expect(mapping.target).toBe('btn');
    });

    it('should handle null/undefined values in styles', () => {
      const styles: StyleConfig = {
        layout: {
          display: undefined,
          width: null,
        } as any,
      };

      const translated = adapter.translateStyles(styles);
      expect(translated).toBeDefined();
    });

    it('should handle missing token categories', () => {
      const tokens: TokenConfig = {
        category: 'test',
        path: 'test',
        value: {},
        tokens: {
          nonexistent: {},
        } as any,
      };

      const converted = adapter.convertTokens(tokens);
      expect(converted).toBeDefined();
    });

    it('should preserve non-Bootstrap props', () => {
      const mapping = adapter.mapComponent('Button', {
        variant: 'primary',
        customProp: 'value',
        'aria-label': 'Test button',
        onClick: () => {},
      });

      expect(mapping.props.customProp).toBe('value');
      expect(mapping.props['aria-label']).toBe('Test button');
      expect(typeof mapping.props.onClick).toBe('function');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple utility classes combination', () => {
      const styles: StyleConfig = {
        layout: {
          display: 'flex',
          position: 'relative',
        },
        spacing: {
          margin: '3',
          padding: '2',
        },
        colors: {
          backgroundColor: 'primary',
          color: 'white',
        },
        borders: {
          border: '1px solid',
          borderRadius: 'lg',
        },
      };

      const translated = adapter.translateStyles(styles);
      const classes = (translated.className as string).split(' ');
      
      expect(classes).toContain('d-flex');
      expect(classes).toContain('position-relative');
      expect(classes).toContain('m-3');
      expect(classes).toContain('p-2');
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-white');
      expect(classes).toContain('border');
      expect(classes).toContain('rounded-3');
    });

    it('should handle nested component structures', () => {
      // Card with header, body, and footer
      const cardMapping = adapter.mapComponent('Card', {
        className: 'shadow',
      });

      expect(cardMapping.props.className).toContain('card');
      expect(cardMapping.props.className).toContain('shadow');

      // Modal with all parts
      const modalMapping = adapter.mapComponent('Modal', {
        size: 'lg',
        backdrop: 'static',
      });

      expect(modalMapping.props.className).toContain('modal');
      expect(modalMapping.props.className).toContain('fade');
      expect(modalMapping.props.className).toContain('modal-lg');
      expect(modalMapping.props['data-bs-backdrop']).toBe('static');
    });

    it('should handle form with validation states', () => {
      const inputValid = adapter.mapComponent('Input', {
        className: 'is-valid',
      });

      expect(inputValid.props.className).toContain('form-control');
      expect(inputValid.props.className).toContain('is-valid');

      const inputInvalid = adapter.mapComponent('Input', {
        className: 'is-invalid',
      });

      expect(inputInvalid.props.className).toContain('form-control');
      expect(inputInvalid.props.className).toContain('is-invalid');
    });
  });
});