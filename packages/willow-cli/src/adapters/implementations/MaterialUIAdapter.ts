/**
 * Material-UI (MUI) Adapter Implementation
 * 
 * Handles adaptation of Material-UI components with comprehensive support for
 * MUI's component library, sx prop system, theme integration, and Material Design patterns.
 */

import {
  AdapterInstance,
  AdapterConfig,
  ComponentMapping,
  StyleConfig,
  TokenConfig,
  ValidationResult,
  ComponentName,
  AdapterCapability,
  AdapterMetadata,
} from '../types/index.js';
import { AdapterError } from '../errors/index.js';
import { AdapterPluginManager } from '../plugins/AdapterPluginManager.js';

/**
 * Material-UI component configuration
 */
interface MaterialUIComponentConfig {
  baseComponent: string;
  muiComponent?: string;
  variants?: Record<string, string[]>;
  sizes?: string[];
  sx?: {
    base?: Record<string, any>;
    variants?: Record<string, Record<string, Record<string, any>>>;
    sizes?: Record<string, Record<string, any>>;
  };
  slots?: Record<string, string>;
  defaultProps?: Record<string, any>;
  themeKey?: string;
}

/**
 * Material-UI theme configuration
 */
interface MaterialUITheme {
  palette?: {
    mode?: 'light' | 'dark';
    primary?: any;
    secondary?: any;
    error?: any;
    warning?: any;
    info?: any;
    success?: any;
    background?: any;
    text?: any;
  };
  typography?: any;
  spacing?: any;
  breakpoints?: any;
  shape?: any;
  shadows?: any;
  zIndex?: any;
}

/**
 * Material-UI Adapter for handling MUI components
 */
export class MaterialUIAdapter implements AdapterInstance {
  public readonly id: string;
  public readonly config: AdapterConfig;
  public initialized: boolean = false;
  
  private pluginManager: AdapterPluginManager;
  private componentRegistry: Map<string, MaterialUIComponentConfig>;
  private theme: MaterialUITheme;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.id = `material-ui-${Date.now()}`;
    this.config = this.buildConfig(config);
    this.pluginManager = new AdapterPluginManager();
    this.componentRegistry = this.initializeComponentRegistry();
    this.theme = this.initializeTheme();
  }

  private buildConfig(partial: Partial<AdapterConfig>): AdapterConfig {
    return {
      name: 'material-ui-adapter',
      version: '1.0.0',
      framework: {
        name: 'react',
        version: '>=18.0.0',
      },
      capabilities: [
        'component-mapping',
        'style-translation',
        'token-conversion',
        'variant-support',
        'theme-support',
        'sx-prop-support',
        'slot-support',
      ],
      options: {
        ...partial.options,
        theming: {
          mode: 'light',
          customTheme: false,
          ...partial.options?.theming,
        },
      },
      metadata: {
        author: 'Material-UI Adapter',
        description: 'Adapter for Material-UI components with comprehensive theme support',
        tags: ['material-ui', 'mui', 'material-design', 'theme', 'sx'],
        ...partial.metadata,
      } as AdapterMetadata,
      ...partial,
    };
  }

  private initializeComponentRegistry(): Map<string, MaterialUIComponentConfig> {
    const registry = new Map<string, MaterialUIComponentConfig>();

    // Button component
    registry.set('Button', {
      baseComponent: 'Button',
      muiComponent: '@mui/material/Button',
      variants: {
        variant: ['text', 'outlined', 'contained'],
        color: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
      },
      sizes: ['small', 'medium', 'large'],
      sx: {
        base: {
          textTransform: 'none', // Common MUI customization
        },
        variants: {
          variant: {
            contained: {
              boxShadow: 1,
              '&:hover': {
                boxShadow: 2,
              },
            },
            outlined: {
              borderWidth: '1px',
              borderStyle: 'solid',
            },
          },
        },
        sizes: {
          small: {
            fontSize: '0.8125rem',
            padding: '4px 10px',
          },
          medium: {
            fontSize: '0.875rem',
            padding: '6px 16px',
          },
          large: {
            fontSize: '0.9375rem',
            padding: '8px 22px',
          },
        },
      },
      defaultProps: {
        variant: 'contained',
        color: 'primary',
        size: 'medium',
      },
      themeKey: 'MuiButton',
    });

    // TextField component
    registry.set('TextField', {
      baseComponent: 'TextField',
      muiComponent: '@mui/material/TextField',
      variants: {
        variant: ['outlined', 'filled', 'standard'],
        color: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
        size: ['small', 'medium'],
      },
      sx: {
        base: {
          width: '100%',
        },
        variants: {
          variant: {
            outlined: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              },
            },
            filled: {
              '& .MuiFilledInput-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
              },
            },
          },
        },
      },
      defaultProps: {
        variant: 'outlined',
        color: 'primary',
        size: 'medium',
      },
      themeKey: 'MuiTextField',
    });

    // Paper component
    registry.set('Paper', {
      baseComponent: 'Paper',
      muiComponent: '@mui/material/Paper',
      variants: {
        variant: ['elevation', 'outlined'],
      },
      sx: {
        base: {
          borderRadius: 1,
        },
        variants: {
          variant: {
            elevation: {
              boxShadow: 1,
            },
            outlined: {
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 0,
            },
          },
        },
      },
      defaultProps: {
        variant: 'elevation',
        elevation: 1,
      },
      themeKey: 'MuiPaper',
    });

    // Typography component
    registry.set('Typography', {
      baseComponent: 'Typography',
      muiComponent: '@mui/material/Typography',
      variants: {
        variant: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'subtitle1', 'subtitle2',
          'body1', 'body2',
          'caption', 'overline',
          'inherit',
        ],
        color: ['primary', 'secondary', 'textPrimary', 'textSecondary', 'error'],
      },
      sx: {
        variants: {
          variant: {
            h1: { fontSize: '2.125rem', fontWeight: 300 },
            h2: { fontSize: '1.5rem', fontWeight: 400 },
            h3: { fontSize: '1.25rem', fontWeight: 400 },
            h4: { fontSize: '1.125rem', fontWeight: 400 },
            h5: { fontSize: '1rem', fontWeight: 400 },
            h6: { fontSize: '0.875rem', fontWeight: 500 },
            body1: { fontSize: '1rem', fontWeight: 400 },
            body2: { fontSize: '0.875rem', fontWeight: 400 },
          },
        },
      },
      defaultProps: {
        variant: 'body1',
      },
      themeKey: 'MuiTypography',
    });

    // Card component
    registry.set('Card', {
      baseComponent: 'Card',
      muiComponent: '@mui/material/Card',
      slots: {
        header: 'CardHeader',
        content: 'CardContent',
        actions: 'CardActions',
        media: 'CardMedia',
      },
      sx: {
        base: {
          borderRadius: 1,
          boxShadow: 1,
        },
      },
      defaultProps: {
        variant: 'elevation',
      },
      themeKey: 'MuiCard',
    });

    // Dialog component
    registry.set('Dialog', {
      baseComponent: 'Dialog',
      muiComponent: '@mui/material/Dialog',
      variants: {
        maxWidth: ['xs', 'sm', 'md', 'lg', 'xl'],
      },
      slots: {
        title: 'DialogTitle',
        content: 'DialogContent',
        actions: 'DialogActions',
      },
      sx: {
        base: {
          '& .MuiDialog-paper': {
            borderRadius: 2,
          },
        },
      },
      defaultProps: {
        maxWidth: 'sm',
        fullWidth: true,
      },
      themeKey: 'MuiDialog',
    });

    // Chip component
    registry.set('Chip', {
      baseComponent: 'Chip',
      muiComponent: '@mui/material/Chip',
      variants: {
        variant: ['filled', 'outlined'],
        color: ['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'],
        size: ['small', 'medium'],
      },
      sx: {
        variants: {
          variant: {
            filled: {
              backgroundColor: 'action.selected',
            },
            outlined: {
              borderColor: 'divider',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
        color: 'default',
        size: 'medium',
      },
      themeKey: 'MuiChip',
    });

    // Alert component
    registry.set('Alert', {
      baseComponent: 'Alert',
      muiComponent: '@mui/material/Alert',
      variants: {
        severity: ['error', 'warning', 'info', 'success'],
        variant: ['standard', 'filled', 'outlined'],
      },
      sx: {
        base: {
          borderRadius: 1,
        },
        variants: {
          severity: {
            error: { color: 'error.main' },
            warning: { color: 'warning.main' },
            info: { color: 'info.main' },
            success: { color: 'success.main' },
          },
        },
      },
      defaultProps: {
        severity: 'info',
        variant: 'standard',
      },
      themeKey: 'MuiAlert',
    });

    // Switch component
    registry.set('Switch', {
      baseComponent: 'Switch',
      muiComponent: '@mui/material/Switch',
      variants: {
        color: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
        size: ['small', 'medium'],
      },
      sx: {
        variants: {
          size: {
            small: {
              width: 40,
              height: 24,
              padding: 0,
            },
            medium: {
              width: 58,
              height: 38,
              padding: 12,
            },
          },
        },
      },
      defaultProps: {
        color: 'primary',
        size: 'medium',
      },
      themeKey: 'MuiSwitch',
    });

    return registry;
  }

  private initializeTheme(): MaterialUITheme {
    return {
      palette: {
        mode: this.config.options?.theming?.mode || 'light',
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
        },
        secondary: {
          main: '#9c27b0',
          light: '#ba68c8',
          dark: '#7b1fa2',
        },
        error: {
          main: '#d32f2f',
          light: '#ef5350',
          dark: '#c62828',
        },
        warning: {
          main: '#ed6c02',
          light: '#ff9800',
          dark: '#e65100',
        },
        info: {
          main: '#0288d1',
          light: '#03a9f4',
          dark: '#01579b',
        },
        success: {
          main: '#2e7d32',
          light: '#4caf50',
          dark: '#1b5e20',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2.125rem' },
        h2: { fontSize: '1.5rem' },
        h3: { fontSize: '1.25rem' },
        h4: { fontSize: '1.125rem' },
        h5: { fontSize: '1rem' },
        h6: { fontSize: '0.875rem' },
        body1: { fontSize: '1rem' },
        body2: { fontSize: '0.875rem' },
      },
      spacing: 8,
      shape: {
        borderRadius: 4,
      },
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new AdapterError('Adapter already initialized', 'ALREADY_INITIALIZED');
    }

    await this.pluginManager.initializePlugins(this);
    this.initialized = true;
  }

  mapComponent(
    name: ComponentName,
    props: Record<string, unknown>
  ): ComponentMapping {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    const componentConfig = this.componentRegistry.get(name);
    if (!componentConfig) {
      return this.mapGenericComponent(name, props);
    }

    // Use props directly (no async plugin transformations for sync method)
    const transformedProps = props;

    // Build sx prop from variants and props
    const sx = this.buildSxProp(componentConfig, transformedProps);

    // Handle regular components
    const { sx: userSx, variant, size, color, ...restProps } = transformedProps;
    
    // Apply default props from config
    const finalProps: Record<string, any> = {
      ...componentConfig.defaultProps,
      ...restProps,
      sx: this.mergeSxProp(sx, userSx),
    };

    // Override with explicit props if provided
    if (variant !== undefined) finalProps.variant = variant;
    if (size !== undefined) finalProps.size = size;
    if (color !== undefined) finalProps.color = color;
    
    const mapping: ComponentMapping = {
      component: componentConfig.baseComponent,
      props: finalProps,
      metadata: {
        originalComponent: name,
        adapterType: 'material-ui',
        muiComponent: componentConfig.muiComponent,
        themeKey: componentConfig.themeKey,
        styled: true,
      },
    };

    return mapping;
  }

  private buildSxProp(
    config: MaterialUIComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> {
    const sx: Record<string, any> = {};

    // Add base styles
    if (config.sx?.base) {
      Object.assign(sx, config.sx.base);
    }

    // Add variant styles
    if (config.sx?.variants) {
      Object.entries(config.sx.variants).forEach(([variantKey, variantOptions]) => {
        const variantValue = props[variantKey] || config.defaultProps?.[variantKey];
        if (variantValue && variantOptions[variantValue as string]) {
          Object.assign(sx, variantOptions[variantValue as string]);
        }
      });
    }

    // Add size styles
    if (config.sx?.sizes) {
      const size = props.size || config.defaultProps?.size;
      if (size && config.sx.sizes[size as string]) {
        Object.assign(sx, config.sx.sizes[size as string]);
      }
    }

    return sx;
  }

  private mergeSxProp(
    generatedSx: Record<string, any>,
    userSx: unknown
  ): Record<string, any> {
    if (!userSx) {
      return generatedSx;
    }

    if (typeof userSx === 'object' && userSx !== null) {
      return { ...generatedSx, ...userSx };
    }

    // If userSx is a function (theme-based), we can't merge easily
    // Return user sx with precedence
    return userSx as Record<string, any>;
  }

  private mapGenericComponent(
    name: ComponentName,
    props: Record<string, unknown>
  ): ComponentMapping {
    return {
      component: name,
      props: { ...props },
      metadata: {
        originalComponent: name,
        adapterType: 'material-ui',
        fallback: true,
      },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    return this.translateToSxProp(styles);
  }

  private translateToSxProp(styles: StyleConfig): Record<string, unknown> {
    const sx: Record<string, any> = {};

    // Convert basic styles
    if (styles.base) {
      if (styles.base.padding) {
        sx.p = this.convertSpacing(styles.base.padding);
      }
      if (styles.base.margin) {
        sx.m = this.convertSpacing(styles.base.margin);
      }
      if (styles.base.borderRadius) {
        sx.borderRadius = this.convertBorderRadius(styles.base.borderRadius);
      }
    }

    // Convert colors
    if (styles.colors) {
      if (styles.colors.backgroundColor) {
        sx.backgroundColor = styles.colors.backgroundColor;
      }
      if (styles.colors.color) {
        sx.color = styles.colors.color;
      }
    }

    // Convert typography
    if (styles.typography) {
      if (styles.typography.fontSize) {
        sx.fontSize = styles.typography.fontSize;
      }
      if (styles.typography.fontWeight) {
        sx.fontWeight = styles.typography.fontWeight;
      }
      if (styles.typography.lineHeight) {
        sx.lineHeight = styles.typography.lineHeight;
      }
    }

    // Convert borders
    if (styles.borders) {
      if (styles.borders.width) {
        sx.borderWidth = styles.borders.width;
      }
      if (styles.borders.style) {
        sx.borderStyle = styles.borders.style;
      }
      if (styles.borders.color) {
        sx.borderColor = styles.borders.color;
      }
    }

    return { sx };
  }

  private convertSpacing(value: string | number): number {
    if (typeof value === 'number') {
      return value / 8; // MUI spacing units (8px base)
    }
    
    if (typeof value === 'string' && value.endsWith('px')) {
      return parseInt(value) / 8;
    }
    
    return value;
  }

  private convertBorderRadius(value: string | number): number {
    if (typeof value === 'number') {
      return value / 4; // MUI shape.borderRadius units
    }
    
    if (typeof value === 'string' && value.endsWith('px')) {
      return parseInt(value) / 4;
    }
    
    return value;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    const muiTheme: Record<string, any> = {
      palette: {},
      typography: {},
      spacing: 8,
      shape: { borderRadius: 4 },
    };

    // Convert color tokens
    if (tokens.tokens?.colors) {
      Object.entries(tokens.tokens.colors).forEach(([category, colors]) => {
        if (typeof colors === 'object') {
          // Map to MUI palette structure
          if (category === 'primary' || category === 'secondary' || category === 'error' || 
              category === 'warning' || category === 'info' || category === 'success') {
            muiTheme.palette[category] = {
              main: colors['500'] || colors['DEFAULT'] || Object.values(colors)[0],
              light: colors['300'] || colors['light'],
              dark: colors['700'] || colors['dark'],
            };
          } else if (category === 'neutral' || category === 'gray') {
            muiTheme.palette.text = {
              primary: colors['900'] || colors['DEFAULT'],
              secondary: colors['600'],
            };
            muiTheme.palette.background = {
              default: colors['50'] || '#ffffff',
              paper: colors['100'] || '#f5f5f5',
            };
          }
        }
      });
    }

    // Convert typography tokens
    if (tokens.tokens?.typography) {
      muiTheme.typography = {
        ...muiTheme.typography,
        ...tokens.tokens.typography,
      };
    }

    // Convert spacing tokens
    if (tokens.tokens?.spacing) {
      const spacingValue = tokens.tokens.spacing['1'] || tokens.tokens.spacing['base'] || '8px';
      muiTheme.spacing = parseInt(spacingValue.replace('px', ''));
    }

    // Convert border radius tokens
    if (tokens.tokens?.borders?.radius) {
      muiTheme.shape.borderRadius = parseInt(
        tokens.tokens.borders.radius.md?.replace('px', '') || '4'
      );
    }

    return { theme: muiTheme };
  }

  validateConfig(): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    if (!this.config.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Adapter name is required',
        path: 'name',
        severity: 'critical',
      });
    }

    if (!this.config.version) {
      errors.push({
        code: 'MISSING_VERSION',
        message: 'Adapter version is required',
        path: 'version',
        severity: 'critical',
      });
    }

    // Validate Material-UI theme configuration
    if (!this.theme.palette) {
      warnings.push({
        code: 'MISSING_THEME_PALETTE',
        message: 'Material-UI theme palette not configured',
        path: 'theme.palette',
        category: 'configuration',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async cleanup(): Promise<void> {
    await this.pluginManager.cleanupPlugins(this);
    this.initialized = false;
  }

  // Material-UI specific methods

  /**
   * Get Material-UI theme object
   */
  getTheme(): MaterialUITheme {
    return this.theme;
  }

  /**
   * Update theme configuration
   */
  updateTheme(themeUpdate: Partial<MaterialUITheme>): void {
    this.theme = { ...this.theme, ...themeUpdate };
  }

  /**
   * Get component's sx prop styles
   */
  getComponentSx(name: ComponentName, props?: Record<string, unknown>): Record<string, any> {
    const config = this.componentRegistry.get(name);
    if (!config) return {};

    return this.buildSxProp(config, props || {});
  }

  /**
   * Get all available Material-UI components
   */
  getAvailableComponents(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Get Material-UI component import path
   */
  getComponentImport(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.muiComponent;
  }

  /**
   * Create Material-UI theme provider configuration
   */
  getThemeProviderConfig(): Record<string, any> {
    return {
      theme: this.theme,
      mode: this.theme.palette?.mode || 'light',
    };
  }
}