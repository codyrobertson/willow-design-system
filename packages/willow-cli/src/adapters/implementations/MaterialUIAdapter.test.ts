import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaterialUIAdapter } from './MaterialUIAdapter';
import { AdapterError } from '../errors';

describe('MaterialUIAdapter', () => {
  let adapter: MaterialUIAdapter;

  beforeEach(() => {
    adapter = new MaterialUIAdapter();
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

    it('should have Material-UI capabilities', () => {
      expect(adapter.config.capabilities).toContain('sx-prop-support');
      expect(adapter.config.capabilities).toContain('theme-support');
      expect(adapter.config.capabilities).toContain('slot-support');
    });

    it('should use light theme mode by default', () => {
      const theme = adapter.getTheme();
      expect(theme.palette?.mode).toBe('light');
    });

    it('should allow custom theme mode', () => {
      const darkAdapter = new MaterialUIAdapter({
        options: { theming: { mode: 'dark' } }
      });
      const theme = darkAdapter.getTheme();
      expect(theme.palette?.mode).toBe('dark');
    });
  });

  describe('mapComponent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('Button mapping', () => {
      it('should map Button with default props', () => {
        const result = adapter.mapComponent('Button', {
          children: 'Click me',
          onClick: vi.fn(),
        });

        expect(result.component).toBe('Button');
        expect(result.props?.children).toBe('Click me');
        expect(result.props?.onClick).toBeDefined();
        expect(result.props?.variant).toBe('contained');
        expect(result.props?.color).toBe('primary');
        expect(result.props?.size).toBe('medium');
        expect(result.props?.sx).toEqual({
          textTransform: 'none',
          boxShadow: 1,
          '&:hover': { boxShadow: 2 },
          fontSize: '0.875rem',
          padding: '6px 16px',
        });
        expect(result.metadata?.muiComponent).toBe('@mui/material/Button');
        expect(result.metadata?.themeKey).toBe('MuiButton');
      });

      it('should map Button with outlined variant', () => {
        const result = adapter.mapComponent('Button', {
          variant: 'outlined',
          children: 'Outlined Button',
        });

        expect(result.props?.variant).toBe('outlined');
        expect(result.props?.sx).toEqual({
          textTransform: 'none',
          borderWidth: '1px',
          borderStyle: 'solid',
          fontSize: '0.875rem',
          padding: '6px 16px',
        });
      });

      it('should map Button with small size', () => {
        const result = adapter.mapComponent('Button', {
          size: 'small',
          children: 'Small Button',
        });

        expect(result.props?.size).toBe('small');
        expect(result.props?.sx?.fontSize).toBe('0.8125rem');
        expect(result.props?.sx?.padding).toBe('4px 10px');
      });

      it('should merge custom sx prop', () => {
        const result = adapter.mapComponent('Button', {
          sx: { backgroundColor: 'red', marginTop: 2 },
          children: 'Custom Button',
        });

        expect(result.props?.sx).toEqual({
          textTransform: 'none',
          boxShadow: 1,
          '&:hover': { boxShadow: 2 },
          fontSize: '0.875rem',
          padding: '6px 16px',
          backgroundColor: 'red',
          marginTop: 2,
        });
      });
    });

    describe('TextField mapping', () => {
      it('should map TextField with default props', () => {
        const result = adapter.mapComponent('TextField', {
          label: 'Email',
          placeholder: 'Enter email',
        });

        expect(result.component).toBe('TextField');
        expect(result.props?.label).toBe('Email');
        expect(result.props?.placeholder).toBe('Enter email');
        expect(result.props?.variant).toBe('outlined');
        expect(result.props?.color).toBe('primary');
        expect(result.props?.size).toBe('medium');
        expect(result.props?.sx).toEqual({
          width: '100%',
          '& .MuiOutlinedInput-root': { borderRadius: 1 },
        });
      });

      it('should map TextField with filled variant', () => {
        const result = adapter.mapComponent('TextField', {
          variant: 'filled',
          label: 'Name',
        });

        expect(result.props?.variant).toBe('filled');
        expect(result.props?.sx).toEqual({
          width: '100%',
          '& .MuiFilledInput-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
          },
        });
      });
    });

    describe('Typography mapping', () => {
      it('should map Typography with h1 variant', () => {
        const result = adapter.mapComponent('Typography', {
          variant: 'h1',
          children: 'Main Title',
        });

        expect(result.component).toBe('Typography');
        expect(result.props?.variant).toBe('h1');
        expect(result.props?.children).toBe('Main Title');
        expect(result.props?.sx).toEqual({
          fontSize: '2.125rem',
          fontWeight: 300,
        });
      });

      it('should map Typography with color', () => {
        const result = adapter.mapComponent('Typography', {
          variant: 'body1',
          color: 'primary',
          children: 'Primary text',
        });

        expect(result.props?.color).toBe('primary');
        expect(result.props?.sx).toEqual({
          fontSize: '1rem',
          fontWeight: 400,
        });
      });
    });

    describe('Card mapping', () => {
      it('should map Card component', () => {
        const result = adapter.mapComponent('Card', {
          children: 'Card content',
        });

        expect(result.component).toBe('Card');
        expect(result.props?.children).toBe('Card content');
        expect(result.props?.variant).toBe('elevation');
        expect(result.props?.sx).toEqual({
          borderRadius: 1,
          boxShadow: 1,
        });
        expect(result.metadata?.themeKey).toBe('MuiCard');
      });
    });

    describe('Dialog mapping', () => {
      it('should map Dialog with default props', () => {
        const result = adapter.mapComponent('Dialog', {
          open: true,
          onClose: vi.fn(),
        });

        expect(result.component).toBe('Dialog');
        expect(result.props?.open).toBe(true);
        expect(result.props?.onClose).toBeDefined();
        expect(result.props?.maxWidth).toBe('sm');
        expect(result.props?.fullWidth).toBe(true);
        expect(result.props?.sx).toEqual({
          '& .MuiDialog-paper': { borderRadius: 2 },
        });
      });
    });

    describe('Chip mapping', () => {
      it('should map Chip with default variant', () => {
        const result = adapter.mapComponent('Chip', {
          label: 'Tag',
        });

        expect(result.component).toBe('Chip');
        expect(result.props?.label).toBe('Tag');
        expect(result.props?.variant).toBe('filled');
        expect(result.props?.color).toBe('default');
        expect(result.props?.size).toBe('medium');
        expect(result.props?.sx).toEqual({
          backgroundColor: 'action.selected',
        });
      });

      it('should map Chip with outlined variant', () => {
        const result = adapter.mapComponent('Chip', {
          variant: 'outlined',
          label: 'Outlined Tag',
        });

        expect(result.props?.variant).toBe('outlined');
        expect(result.props?.sx).toEqual({
          borderColor: 'divider',
        });
      });
    });

    describe('Alert mapping', () => {
      it('should map Alert with error severity', () => {
        const result = adapter.mapComponent('Alert', {
          severity: 'error',
          children: 'Error message',
        });

        expect(result.component).toBe('Alert');
        expect(result.props?.severity).toBe('error');
        expect(result.props?.variant).toBe('standard');
        expect(result.props?.children).toBe('Error message');
        expect(result.props?.sx).toEqual({
          borderRadius: 1,
          color: 'error.main',
        });
      });
    });

    describe('Switch mapping', () => {
      it('should map Switch with default props', () => {
        const result = adapter.mapComponent('Switch', {
          checked: true,
          onChange: vi.fn(),
        });

        expect(result.component).toBe('Switch');
        expect(result.props?.checked).toBe(true);
        expect(result.props?.onChange).toBeDefined();
        expect(result.props?.color).toBe('primary');
        expect(result.props?.size).toBe('medium');
        expect(result.props?.sx).toEqual({
          width: 58,
          height: 38,
          padding: 12,
        });
      });

      it('should map Switch with small size', () => {
        const result = adapter.mapComponent('Switch', {
          size: 'small',
        });

        expect(result.props?.size).toBe('small');
        expect(result.props?.sx).toEqual({
          width: 40,
          height: 24,
          padding: 0,
        });
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
          adapterType: 'material-ui',
          fallback: true,
        },
      });
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new MaterialUIAdapter();
      expect(() => 
        uninitializedAdapter.mapComponent('Button', {})
      ).toThrow('Adapter not initialized');
    });
  });

  describe('translateStyles', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should translate basic styles to sx prop', () => {
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
      };

      const result = adapter.translateStyles(styles);
      expect(result.sx).toEqual({
        p: 2, // 16px / 8
        m: 1, // 8px / 8
        borderRadius: 2, // 8px / 4
        backgroundColor: '#1976d2',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.5,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e0e0e0',
      });
    });

    it('should handle numeric values correctly', () => {
      const styles = {
        base: {
          padding: 24,
          borderRadius: 12,
        },
      };

      const result = adapter.translateStyles(styles);
      expect(result.sx).toEqual({
        p: 3, // 24 / 8
        borderRadius: 3, // 12 / 4
      });
    });
  });

  describe('convertTokens', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should convert color tokens to MUI theme format', () => {
      const tokens = {
        category: 'colors',
        path: 'colors',
        value: 'all',
        tokens: {
          colors: {
            primary: {
              300: '#64b5f6',
              500: '#1976d2',
              700: '#1565c0',
            },
            secondary: {
              300: '#ba68c8',
              500: '#9c27b0',
              700: '#7b1fa2',
            },
            neutral: {
              50: '#fafafa',
              100: '#f5f5f5',
              600: '#757575',
              900: '#212121',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      
      expect(result.theme.palette.primary).toEqual({
        main: '#1976d2',
        light: '#64b5f6',
        dark: '#1565c0',
      });
      
      expect(result.theme.palette.secondary).toEqual({
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#7b1fa2',
      });
      
      expect(result.theme.palette.text).toEqual({
        primary: '#212121',
        secondary: '#757575',
      });
      
      expect(result.theme.palette.background).toEqual({
        default: '#fafafa',
        paper: '#f5f5f5',
      });
    });

    it('should convert typography tokens', () => {
      const tokens = {
        category: 'typography',
        path: 'typography',
        value: 'all',
        tokens: {
          typography: {
            fontFamily: 'Inter, sans-serif',
            h1: { fontSize: '2rem', fontWeight: 700 },
            body1: { fontSize: '1rem', fontWeight: 400 },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result.theme.typography).toMatchObject({
        fontFamily: 'Inter, sans-serif',
        h1: { fontSize: '2rem', fontWeight: 700 },
        body1: { fontSize: '1rem', fontWeight: 400 },
      });
    });

    it('should convert spacing tokens', () => {
      const tokens = {
        category: 'spacing',
        path: 'spacing',
        value: 'all',
        tokens: {
          spacing: {
            1: '4px',
            base: '8px',
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result.theme.spacing).toBe(4); // Uses spacing.1 value
    });

    it('should convert border radius tokens', () => {
      const tokens = {
        category: 'borders',
        path: 'borders',
        value: 'all',
        tokens: {
          borders: {
            radius: {
              sm: '2px',
              md: '8px',
              lg: '12px',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result.theme.shape.borderRadius).toBe(8); // Uses md value
    });
  });

  describe('getComponentSx', () => {
    it('should return component sx styles', () => {
      const sx = adapter.getComponentSx('Button', {
        variant: 'outlined',
        size: 'large',
      });

      expect(sx).toEqual({
        textTransform: 'none',
        borderWidth: '1px',
        borderStyle: 'solid',
        fontSize: '0.9375rem',
        padding: '8px 22px',
      });
    });

    it('should return empty object for unknown component', () => {
      const sx = adapter.getComponentSx('UnknownComponent');
      expect(sx).toEqual({});
    });
  });

  describe('getAvailableComponents', () => {
    it('should return all registered components', () => {
      const components = adapter.getAvailableComponents();
      expect(components).toContain('Button');
      expect(components).toContain('TextField');
      expect(components).toContain('Typography');
      expect(components).toContain('Card');
      expect(components).toContain('Dialog');
      expect(components).toContain('Chip');
      expect(components).toContain('Alert');
      expect(components).toContain('Switch');
      expect(components).toContain('Paper');
    });
  });

  describe('getComponentImport', () => {
    it('should return MUI import path for known components', () => {
      expect(adapter.getComponentImport('Button')).toBe('@mui/material/Button');
      expect(adapter.getComponentImport('TextField')).toBe('@mui/material/TextField');
      expect(adapter.getComponentImport('Typography')).toBe('@mui/material/Typography');
    });

    it('should return undefined for unknown components', () => {
      expect(adapter.getComponentImport('UnknownComponent')).toBeUndefined();
    });
  });

  describe('theme management', () => {
    it('should get current theme', () => {
      const theme = adapter.getTheme();
      expect(theme.palette?.mode).toBe('light');
      expect(theme.palette?.primary?.main).toBe('#1976d2');
      expect(theme.typography?.fontFamily).toContain('Roboto');
    });

    it('should update theme', () => {
      adapter.updateTheme({
        palette: {
          mode: 'dark',
          primary: { main: '#90caf9' },
        },
      });

      const theme = adapter.getTheme();
      expect(theme.palette?.mode).toBe('dark');
      expect(theme.palette?.primary?.main).toBe('#90caf9');
    });

    it('should get theme provider config', () => {
      const config = adapter.getThemeProviderConfig();
      expect(config.theme).toBeDefined();
      expect(config.mode).toBe('light');
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = adapter.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing configuration', () => {
      const invalidAdapter = new MaterialUIAdapter({ name: '', version: '' });
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