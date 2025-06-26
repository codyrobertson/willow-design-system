/**
 * Shadcn/UI Adapter Implementation
 * 
 * Handles adaptation of Shadcn/UI components which are built on Radix UI primitives
 * with Tailwind CSS styling. Shadcn components are copied into the codebase
 * and use a combination of Radix UI for behavior and Tailwind for styling.
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
} from '../types';
import { AdapterError } from '../errors';
import { AdapterPluginManager } from '../plugins/AdapterPluginManager';

/**
 * Shadcn component configuration
 */
interface ShadcnComponentConfig {
  baseComponent: string;
  radixRoot?: string;
  variants?: Record<string, string[]>;
  sizes?: string[];
  classNames: {
    base: string;
    variants?: Record<string, Record<string, string>>;
    sizes?: Record<string, string>;
    states?: Record<string, string>;
  };
  slots?: Record<string, string>;
  defaultProps?: Record<string, any>;
}

/**
 * Shadcn/UI Adapter for handling Shadcn components
 */
export class ShadcnAdapter implements AdapterInstance {
  public readonly id: string;
  public readonly config: AdapterConfig;
  public initialized: boolean = false;
  
  private pluginManager: AdapterPluginManager;
  private componentRegistry: Map<string, ShadcnComponentConfig>;
  private useCssVariables: boolean;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.id = `shadcn-${Date.now()}`;
    this.config = this.buildConfig(config);
    this.pluginManager = new AdapterPluginManager();
    this.componentRegistry = this.initializeComponentRegistry();
    this.useCssVariables = config.options?.styling?.cssVariables ?? true;
  }

  private buildConfig(partial: Partial<AdapterConfig>): AdapterConfig {
    return {
      name: 'shadcn-ui-adapter',
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
        'tailwind-integration',
      ],
      options: {
        ...partial.options,
        styling: {
          cssVariables: true,
          tailwindConfig: true,
          ...partial.options?.styling,
        },
      },
      metadata: {
        author: 'Shadcn Adapter',
        description: 'Adapter for Shadcn/UI components with Tailwind CSS',
        tags: ['shadcn', 'tailwind', 'radix', 'styled'],
        ...partial.metadata,
      } as AdapterMetadata,
      ...partial,
    };
  }

  private initializeComponentRegistry(): Map<string, ShadcnComponentConfig> {
    const registry = new Map<string, ShadcnComponentConfig>();

    // Button component
    registry.set('Button', {
      baseComponent: 'button',
      variants: {
        variant: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        size: ['default', 'sm', 'lg', 'icon'],
      },
      classNames: {
        base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants: {
          variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
          },
        },
        sizes: {
          default: 'h-10 px-4 py-2',
          sm: 'h-9 rounded-md px-3',
          lg: 'h-11 rounded-md px-8',
          icon: 'h-10 w-10',
        },
      },
      defaultProps: {
        variant: 'default',
        size: 'default',
      },
    });

    // Dialog component (using Radix)
    registry.set('Dialog', {
      baseComponent: 'Dialog',
      radixRoot: 'Dialog.Root',
      slots: {
        trigger: 'Dialog.Trigger',
        content: 'Dialog.Content',
        header: 'Dialog.Header',
        title: 'Dialog.Title',
        description: 'Dialog.Description',
        footer: 'Dialog.Footer',
      },
      classNames: {
        base: '',
        states: {
          overlay: 'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          content: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        },
      },
    });

    // Input component
    registry.set('Input', {
      baseComponent: 'input',
      classNames: {
        base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    });

    // Card component
    registry.set('Card', {
      baseComponent: 'div',
      slots: {
        header: 'CardHeader',
        title: 'CardTitle',
        description: 'CardDescription',
        content: 'CardContent',
        footer: 'CardFooter',
      },
      classNames: {
        base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
        states: {
          header: 'flex flex-col space-y-1.5 p-6',
          title: 'text-2xl font-semibold leading-none tracking-tight',
          description: 'text-sm text-muted-foreground',
          content: 'p-6 pt-0',
          footer: 'flex items-center p-6 pt-0',
        },
      },
    });

    // Select component (using Radix)
    registry.set('Select', {
      baseComponent: 'Select',
      radixRoot: 'Select.Root',
      slots: {
        trigger: 'Select.Trigger',
        content: 'Select.Content',
        item: 'Select.Item',
        value: 'Select.Value',
      },
      classNames: {
        base: '',
        states: {
          trigger: 'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          content: 'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          item: 'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        },
      },
    });

    // Checkbox component (using Radix)
    registry.set('Checkbox', {
      baseComponent: 'Checkbox',
      radixRoot: 'Checkbox.Root',
      classNames: {
        base: 'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      },
    });

    // Switch component (using Radix)
    registry.set('Switch', {
      baseComponent: 'Switch',
      radixRoot: 'Switch.Root',
      classNames: {
        base: 'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        states: {
          thumb: 'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        },
      },
    });

    // Badge component
    registry.set('Badge', {
      baseComponent: 'div',
      variants: {
        variant: ['default', 'secondary', 'destructive', 'outline'],
      },
      classNames: {
        base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants: {
          variant: {
            default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
            secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
            destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
            outline: 'text-foreground',
          },
        },
      },
      defaultProps: {
        variant: 'default',
      },
    });

    // Alert component
    registry.set('Alert', {
      baseComponent: 'div',
      variants: {
        variant: ['default', 'destructive'],
      },
      slots: {
        title: 'AlertTitle',
        description: 'AlertDescription',
      },
      classNames: {
        base: 'relative w-full rounded-lg border p-4',
        variants: {
          variant: {
            default: 'bg-background text-foreground',
            destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
          },
        },
        states: {
          title: 'mb-1 font-medium leading-none tracking-tight',
          description: 'text-sm [&_p]:leading-relaxed',
        },
      },
      defaultProps: {
        variant: 'default',
      },
    });

    return registry;
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

    // Since the plugin manager's executeBeforeComponentMapping is async but mapComponent
    // is expected to be sync, we'll handle transformations directly here for now
    // TODO: Consider making mapComponent async in the future
    const transformedProps = props;

    // Build className from variants and props
    const className = this.buildClassName(componentConfig, transformedProps);

    // Handle Radix-based components
    if (componentConfig.radixRoot) {
      return this.mapRadixComponent(name, componentConfig, transformedProps, className);
    }

    // Handle regular components
    const { className: userClassName, variant, size, ...restProps } = transformedProps;
    
    const mapping: ComponentMapping = {
      component: componentConfig.baseComponent,
      props: {
        ...restProps,
        className: this.mergeClassNames(className, userClassName as string),
      },
      metadata: {
        originalComponent: name,
        adapterType: 'shadcn',
        styled: true,
      },
    };

    return mapping;
  }

  private buildClassName(
    config: ShadcnComponentConfig,
    props: Record<string, unknown>
  ): string {
    const classes: string[] = [config.classNames.base];

    // Add variant classes
    if (config.classNames.variants) {
      Object.entries(config.classNames.variants).forEach(([variantKey, variantOptions]) => {
        const variantValue = props[variantKey] || config.defaultProps?.[variantKey] || 'default';
        if (variantValue && variantOptions[variantValue as string]) {
          classes.push(variantOptions[variantValue as string]);
        }
      });
    }

    // Add size classes
    if (config.classNames.sizes) {
      const size = props.size || config.defaultProps?.size || 'default';
      const sizeClass = config.classNames.sizes[size as string];
      if (sizeClass) {
        classes.push(sizeClass);
      }
    }

    return classes.filter(Boolean).join(' ');
  }

  private mapRadixComponent(
    name: ComponentName,
    config: ShadcnComponentConfig,
    props: Record<string, unknown>,
    className: string
  ): ComponentMapping {
    // Extract Radix props and include any additional props that should be passed through
    const radixProps = this.extractRadixProps(props);
    
    // For Radix-based components, we need to handle the compound structure
    const mapping: ComponentMapping = {
      component: config.radixRoot!,
      props: radixProps,
      children: this.transformRadixChildren(props.children, config, className),
      metadata: {
        originalComponent: name,
        adapterType: 'shadcn',
        radixBased: true,
        styled: true,
      },
    };

    return mapping;
  }

  private extractRadixProps(props: Record<string, unknown>): Record<string, unknown> {
    // Filter out Shadcn-specific props that shouldn't go to Radix
    const { variant, size, className, children, ...radixProps } = props;
    return radixProps;
  }

  private transformRadixChildren(
    children: unknown,
    config: ShadcnComponentConfig,
    className: string
  ): unknown {
    // Apply Shadcn styles to Radix compound components
    // This would need more sophisticated handling in production
    return children;
  }

  private mergeClassNames(...classNames: (string | undefined)[]): string {
    return classNames.filter(Boolean).join(' ');
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
        adapterType: 'shadcn',
        fallback: true,
      },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    if (this.useCssVariables) {
      return this.translateToCssVariables(styles);
    } else {
      return this.translateToUtilityClasses(styles);
    }
  }

  private translateToCssVariables(styles: StyleConfig): Record<string, unknown> {
    const cssVars: Record<string, string> = {};

    // Convert style config to CSS variables
    if (styles.colors) {
      Object.entries(styles.colors).forEach(([key, value]) => {
        if (key === 'background') cssVars['--background'] = value as string;
        else if (key === 'foreground') cssVars['--foreground'] = value as string;
        else cssVars[`--${key}`] = value as string;
      });
    }

    if (styles.spacing) {
      Object.entries(styles.spacing).forEach(([key, value]) => {
        cssVars[`--spacing-${key}`] = value as string;
      });
    }

    if (styles.borders?.radius) {
      Object.entries(styles.borders.radius).forEach(([key, value]) => {
        cssVars[`--radius-${key}`] = value as string;
      });
    }

    return cssVars;
  }

  private translateToUtilityClasses(styles: StyleConfig): Record<string, unknown> {
    const utilities: string[] = [];

    // Convert style config to Tailwind utility classes
    if (styles.base) {
      // This would need a comprehensive mapping system
      if (styles.base.padding) utilities.push(`p-${this.valueToTailwind(styles.base.padding)}`);
      if (styles.base.margin) utilities.push(`m-${this.valueToTailwind(styles.base.margin)}`);
    }

    if (styles.colors) {
      if (styles.colors.backgroundColor) {
        utilities.push(`bg-${this.colorToTailwind(styles.colors.backgroundColor as string)}`);
      }
      if (styles.colors.color) {
        utilities.push(`text-${this.colorToTailwind(styles.colors.color as string)}`);
      }
    }

    return { className: utilities.join(' ') };
  }

  private valueToTailwind(value: string | number): string {
    // Convert px values to Tailwind scale
    if (typeof value === 'string' && value.endsWith('px')) {
      const num = parseInt(value);
      // Simplified mapping - would need comprehensive mapping
      if (num <= 4) return '1';
      if (num <= 8) return '2';
      if (num <= 12) return '3';
      if (num <= 16) return '4';
      return '5';
    }
    return value.toString();
  }

  private colorToTailwind(color: string): string {
    // Map color values to Tailwind color names
    // This would need a comprehensive color mapping system
    if (color.startsWith('#')) {
      // Could map to closest Tailwind color
      return 'primary';
    }
    return color;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    const converted: Record<string, unknown> = {};

    if (this.useCssVariables) {
      // Convert to CSS variables format used by Shadcn
      if (tokens.tokens?.colors) {
        Object.entries(tokens.tokens.colors).forEach(([category, colors]) => {
          if (typeof colors === 'object') {
            Object.entries(colors).forEach(([shade, value]) => {
              const varName = shade === '500' ? `--${category}` : `--${category}-${shade}`;
              converted[varName] = this.colorToOklch(value as string);
            });
          }
        });
      }

      // Add Shadcn-specific token mappings
      converted['--background'] = converted['--neutral-50'] || 'oklch(1 0 0)';
      converted['--foreground'] = converted['--neutral-900'] || 'oklch(0.1 0 0)';
      converted['--primary'] = converted['--primary-500'] || 'oklch(0.5 0.2 250)';
      converted['--primary-foreground'] = 'oklch(1 0 0)';
      converted['--secondary'] = converted['--secondary-500'] || 'oklch(0.8 0.1 250)';
      converted['--secondary-foreground'] = 'oklch(0.1 0 0)';
      converted['--muted'] = converted['--neutral-100'] || 'oklch(0.95 0.02 250)';
      converted['--muted-foreground'] = converted['--neutral-600'] || 'oklch(0.4 0.02 250)';
      converted['--accent'] = converted['--primary-100'] || 'oklch(0.9 0.1 250)';
      converted['--accent-foreground'] = converted['--primary-900'] || 'oklch(0.1 0.1 250)';
      converted['--destructive'] = converted['--error-500'] || 'oklch(0.5 0.3 25)';
      converted['--destructive-foreground'] = 'oklch(1 0 0)';
      converted['--border'] = converted['--neutral-200'] || 'oklch(0.9 0.02 250)';
      converted['--input'] = converted['--neutral-200'] || 'oklch(0.9 0.02 250)';
      converted['--ring'] = converted['--primary-500'] || 'oklch(0.5 0.2 250)';
      converted['--radius'] = tokens.tokens?.borders?.radius?.md || '0.375rem';
    } else {
      // Convert to Tailwind config format
      converted.colors = this.tokensToTailwindColors(tokens);
      converted.spacing = tokens.tokens?.spacing;
      converted.borderRadius = tokens.tokens?.borders?.radius;
    }

    return converted;
  }

  private colorToOklch(color: string): string {
    // Convert hex/rgb to OKLCH format
    // This is a simplified version - would need proper color conversion
    if (color.startsWith('#')) {
      // Convert hex to OKLCH (simplified)
      return 'oklch(0.5 0.2 250)';
    }
    return color;
  }

  private tokensToTailwindColors(tokens: TokenConfig): Record<string, any> {
    const colors: Record<string, any> = {};

    if (tokens.tokens?.colors) {
      Object.entries(tokens.tokens.colors).forEach(([key, value]) => {
        if (typeof value === 'object') {
          colors[key] = value;
        } else {
          colors[key] = { DEFAULT: value };
        }
      });
    }

    return colors;
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

    // Validate Tailwind CSS availability
    if (!this.config.options?.styling?.tailwindConfig) {
      warnings.push({
        code: 'MISSING_TAILWIND',
        message: 'Tailwind CSS configuration not found',
        path: 'options.styling.tailwindConfig',
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

  // Additional Shadcn-specific methods

  /**
   * Get component's Tailwind classes
   */
  getComponentClasses(name: ComponentName, props?: Record<string, unknown>): string {
    const config = this.componentRegistry.get(name);
    if (!config) return '';

    return this.buildClassName(config, props || {});
  }

  /**
   * Check if using CSS variables for theming
   */
  isUsingCssVariables(): boolean {
    return this.useCssVariables;
  }

  /**
   * Get theme configuration
   */
  getThemeConfig(): Record<string, string> {
    return {
      mode: this.useCssVariables ? 'css-variables' : 'utility-classes',
      darkMode: 'class',
      prefix: this.config.options?.styling?.prefix || '',
    };
  }

  /**
   * Get all available Shadcn components
   */
  getAvailableComponents(): string[] {
    return Array.from(this.componentRegistry.keys());
  }
}