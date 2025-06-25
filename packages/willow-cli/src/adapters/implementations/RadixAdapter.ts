/**
 * Radix UI Adapter Implementation
 * 
 * Handles adaptation of Radix UI primitive components to other UI libraries.
 * Radix uses compound component patterns with dot notation (Dialog.Root, Dialog.Trigger, etc.)
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
 * Radix-specific component configuration
 */
interface RadixComponentConfig {
  root: string;
  parts: Record<string, string>;
  props: Record<string, any>;
  dataAttributes?: string[];
  ariaAttributes?: string[];
}

/**
 * Radix UI Adapter for handling Radix primitive components
 */
export class RadixAdapter implements AdapterInstance {
  public readonly id: string;
  public readonly config: AdapterConfig;
  public initialized: boolean = false;
  
  private pluginManager: AdapterPluginManager;
  private componentRegistry: Map<string, RadixComponentConfig>;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.id = `radix-${Date.now()}`;
    this.config = this.buildConfig(config);
    this.pluginManager = new AdapterPluginManager();
    this.componentRegistry = this.initializeComponentRegistry();
  }

  private buildConfig(partial: Partial<AdapterConfig>): AdapterConfig {
    return {
      name: 'radix-ui-adapter',
      version: '1.0.0',
      framework: {
        name: 'react',
        version: '>=16.8.0',
      },
      capabilities: [
        'component-mapping',
        'style-translation',
        'token-conversion',
        'event-handling',
        'ref-forwarding',
        'portal-support',
      ],
      options: {
        ...partial.options,
        development: {
          hotReload: true,
          debugging: true,
          strictMode: true,
          ...partial.options?.development,
        },
      },
      metadata: {
        author: 'Radix Adapter',
        description: 'Adapter for Radix UI primitive components',
        tags: ['radix', 'primitives', 'unstyled', 'accessible'],
        ...partial.metadata,
      } as AdapterMetadata,
      ...partial,
    };
  }

  private initializeComponentRegistry(): Map<string, RadixComponentConfig> {
    const registry = new Map<string, RadixComponentConfig>();

    // Dialog component configuration
    registry.set('Dialog', {
      root: 'Dialog.Root',
      parts: {
        trigger: 'Dialog.Trigger',
        portal: 'Dialog.Portal',
        overlay: 'Dialog.Overlay',
        content: 'Dialog.Content',
        title: 'Dialog.Title',
        description: 'Dialog.Description',
        close: 'Dialog.Close',
      },
      props: {
        open: 'open',
        defaultOpen: 'defaultOpen',
        onOpenChange: 'onOpenChange',
        modal: 'modal',
      },
      dataAttributes: ['state'],
      ariaAttributes: ['labelledby', 'describedby'],
    });

    // Select component configuration
    registry.set('Select', {
      root: 'Select.Root',
      parts: {
        trigger: 'Select.Trigger',
        value: 'Select.Value',
        icon: 'Select.Icon',
        portal: 'Select.Portal',
        content: 'Select.Content',
        viewport: 'Select.Viewport',
        group: 'Select.Group',
        label: 'Select.Label',
        item: 'Select.Item',
        itemText: 'Select.ItemText',
        itemIndicator: 'Select.ItemIndicator',
        separator: 'Select.Separator',
      },
      props: {
        value: 'value',
        defaultValue: 'defaultValue',
        onValueChange: 'onValueChange',
        open: 'open',
        defaultOpen: 'defaultOpen',
        onOpenChange: 'onOpenChange',
        disabled: 'disabled',
        required: 'required',
        name: 'name',
      },
    });

    // Accordion component configuration
    registry.set('Accordion', {
      root: 'Accordion.Root',
      parts: {
        item: 'Accordion.Item',
        trigger: 'Accordion.Trigger',
        content: 'Accordion.Content',
      },
      props: {
        type: 'type', // 'single' | 'multiple'
        value: 'value',
        defaultValue: 'defaultValue',
        onValueChange: 'onValueChange',
        collapsible: 'collapsible',
        disabled: 'disabled',
        asChild: 'asChild',
      },
    });

    // Slider component configuration
    registry.set('Slider', {
      root: 'Slider.Root',
      parts: {
        track: 'Slider.Track',
        range: 'Slider.Range',
        thumb: 'Slider.Thumb',
      },
      props: {
        value: 'value',
        defaultValue: 'defaultValue',
        onValueChange: 'onValueChange',
        min: 'min',
        max: 'max',
        step: 'step',
        disabled: 'disabled',
        orientation: 'orientation',
        inverted: 'inverted',
        minStepsBetweenThumbs: 'minStepsBetweenThumbs',
      },
    });

    // Switch component configuration
    registry.set('Switch', {
      root: 'Switch.Root',
      parts: {
        thumb: 'Switch.Thumb',
      },
      props: {
        checked: 'checked',
        defaultChecked: 'defaultChecked',
        onCheckedChange: 'onCheckedChange',
        disabled: 'disabled',
        required: 'required',
        name: 'name',
        value: 'value',
      },
      dataAttributes: ['state', 'disabled'],
    });

    // Tooltip component configuration
    registry.set('Tooltip', {
      root: 'Tooltip.Root',
      parts: {
        trigger: 'Tooltip.Trigger',
        portal: 'Tooltip.Portal',
        content: 'Tooltip.Content',
        arrow: 'Tooltip.Arrow',
      },
      props: {
        open: 'open',
        defaultOpen: 'defaultOpen',
        onOpenChange: 'onOpenChange',
        delayDuration: 'delayDuration',
      },
    });

    // Popover component configuration
    registry.set('Popover', {
      root: 'Popover.Root',
      parts: {
        trigger: 'Popover.Trigger',
        portal: 'Popover.Portal',
        content: 'Popover.Content',
        arrow: 'Popover.Arrow',
        close: 'Popover.Close',
      },
      props: {
        open: 'open',
        defaultOpen: 'defaultOpen',
        onOpenChange: 'onOpenChange',
        modal: 'modal',
      },
    });

    // Form component configuration
    registry.set('Form', {
      root: 'Form.Root',
      parts: {
        field: 'Form.Field',
        label: 'Form.Label',
        control: 'Form.Control',
        message: 'Form.Message',
        validityState: 'Form.ValidityState',
        submit: 'Form.Submit',
      },
      props: {
        asChild: 'asChild',
        name: 'name',
        serverInvalid: 'serverInvalid',
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
      // Handle unknown components
      return this.mapGenericComponent(name, props);
    }

    // Apply plugin transformations would go here in async version
    const transformedProps = { ...props };

    // Handle Radix-specific patterns
    const mapping: ComponentMapping = {
      component: componentConfig.root,
      props: this.transformRadixProps(transformedProps, componentConfig),
      children: this.transformChildren(transformedProps.children, componentConfig),
      metadata: {
        originalComponent: name,
        adapterType: 'radix',
        compound: true,
        parts: componentConfig.parts,
      },
    };

    // Handle asChild pattern
    if (transformedProps.asChild) {
      mapping.metadata!.asChild = true;
    }

    return mapping;
  }

  private transformRadixProps(
    props: Record<string, unknown>,
    config: RadixComponentConfig
  ): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    // Map known props
    Object.entries(props).forEach(([key, value]) => {
      if (config.props[key]) {
        transformed[config.props[key]] = value;
      } else if (key.startsWith('data-') || key.startsWith('aria-')) {
        // Preserve data and aria attributes
        transformed[key] = value;
      } else if (key === 'className' || key === 'style') {
        // Preserve styling props
        transformed[key] = value;
      } else if (key === 'ref') {
        // Preserve ref
        transformed[key] = value;
      } else if (key === 'children' && !config.props.children) {
        // Skip children as it's handled separately
      } else if (config.props.hasOwnProperty(key)) {
        // Direct prop mapping
        transformed[key] = value;
      }
    });

    return transformed;
  }

  private transformChildren(
    children: unknown,
    config: RadixComponentConfig
  ): unknown {
    // Handle compound component children
    if (React.isValidElement(children)) {
      // Check if child is a known part
      const childType = (children as any).type;
      if (typeof childType === 'string' && childType.includes('.')) {
        // Already a compound component
        return children;
      }
    }

    // For simple children, wrap in appropriate parts if needed
    return children;
  }

  private mapGenericComponent(
    name: ComponentName,
    props: Record<string, unknown>
  ): ComponentMapping {
    // Generic mapping for unknown components
    return {
      component: name,
      props: { ...props },
      metadata: {
        originalComponent: name,
        adapterType: 'radix',
        fallback: true,
      },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Radix components are unstyled, so styles are passed through
    // with minimal transformation
    const translated: Record<string, unknown> = {};

    if (styles.base) {
      Object.assign(translated, styles.base);
    }

    // Handle responsive styles
    if (styles.responsive) {
      // Convert responsive styles to CSS-in-JS media queries
      const mediaQueries: Record<string, any> = {};
      Object.entries(styles.responsive).forEach(([breakpoint, bpStyles]) => {
        mediaQueries[`@media (min-width: ${this.getBreakpointValue(breakpoint)})`] = bpStyles;
      });
      Object.assign(translated, mediaQueries);
    }

    // Handle state styles (hover, focus, etc.)
    if (styles.states) {
      Object.entries(styles.states).forEach(([state, stateStyles]) => {
        translated[`&:${state}`] = stateStyles;
      });
    }

    // Handle dark mode
    if (styles.dark) {
      translated['&[data-theme="dark"]'] = styles.dark;
    }

    return translated;
  }

  private getBreakpointValue(breakpoint: string): string {
    const breakpoints: Record<string, string> = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    };
    return breakpoints[breakpoint] || breakpoint;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Convert design tokens to CSS custom properties
    const cssVars: Record<string, unknown> = {};

    if (tokens.tokens?.colors) {
      Object.entries(tokens.tokens.colors).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([shade, color]) => {
            cssVars[`--color-${key}-${shade}`] = color;
          });
        } else {
          cssVars[`--color-${key}`] = value;
        }
      });
    }

    if (tokens.tokens?.spacing) {
      Object.entries(tokens.tokens.spacing).forEach(([key, value]) => {
        cssVars[`--spacing-${key}`] = value;
      });
    }

    if (tokens.tokens?.typography) {
      const { fontSize, fontWeight, lineHeight, fontFamily } = tokens.tokens.typography;
      
      if (fontSize) {
        Object.entries(fontSize).forEach(([key, value]) => {
          cssVars[`--font-size-${key}`] = value;
        });
      }

      if (fontFamily) {
        Object.entries(fontFamily).forEach(([key, value]) => {
          cssVars[`--font-family-${key}`] = Array.isArray(value) ? value.join(', ') : value;
        });
      }
    }

    return cssVars;
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

    // Validate React compatibility
    if (this.config.framework.name !== 'react') {
      errors.push({
        code: 'INVALID_FRAMEWORK',
        message: 'Radix UI requires React framework',
        path: 'framework.name',
        severity: 'critical',
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

  // Additional Radix-specific methods

  /**
   * Map compound component parts
   */
  mapCompoundComponent(
    name: ComponentName,
    parts: Record<string, Record<string, unknown>>
  ): Record<string, ComponentMapping> {
    const config = this.componentRegistry.get(name);
    if (!config) {
      throw new AdapterError(`Unknown component: ${name}`, 'UNKNOWN_COMPONENT');
    }

    const mappedParts: Record<string, ComponentMapping> = {};

    Object.entries(parts).forEach(([partName, partProps]) => {
      const partComponent = config.parts[partName];
      if (partComponent) {
        mappedParts[partName] = {
          component: partComponent,
          props: partProps,
        };
      }
    });

    return mappedParts;
  }

  /**
   * Handle portal components
   */
  handlePortal(component: ComponentName, container?: HTMLElement): ComponentMapping {
    const portalProps: Record<string, unknown> = {};
    
    if (container) {
      portalProps.container = container;
    }

    return {
      component: `${component}.Portal`,
      props: portalProps,
    };
  }

  /**
   * Get all available Radix components
   */
  getAvailableComponents(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Check if a component supports a specific feature
   */
  supportsFeature(component: ComponentName, feature: string): boolean {
    const config = this.componentRegistry.get(component);
    if (!config) return false;

    switch (feature) {
      case 'portal':
        return 'portal' in config.parts;
      case 'asChild':
        return true; // All Radix components support asChild
      case 'controlled':
        return 'value' in config.props || 'open' in config.props;
      case 'compound':
        return Object.keys(config.parts).length > 0;
      default:
        return false;
    }
  }
}

// React utilities for component checking
const React = {
  isValidElement: (element: unknown): boolean => {
    return element !== null && 
           typeof element === 'object' && 
           'type' in element &&
           'props' in element;
  }
};