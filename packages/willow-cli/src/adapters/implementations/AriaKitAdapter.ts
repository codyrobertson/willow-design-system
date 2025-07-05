/**
 * AriaKit Adapter Implementation
 * 
 * Comprehensive adapter for AriaKit's accessibility-first headless components.
 * Supports all 25+ AriaKit components with universal mapping logic, state management,
 * provider patterns, and full accessibility preservation.
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
 * AriaKit component configuration
 */
interface AriaKitComponentConfig {
  component: string;
  ariakitImport: string;
  
  // State management
  stateHook?: string;
  providerComponent?: string;
  storeHook?: string;
  
  // Composition patterns
  renderPropSupport: boolean;
  providerWrapping: boolean;
  childComponents?: string[];
  
  // Accessibility
  ariaPattern: string;
  keyboardNavigation: boolean;
  focusManagement: boolean;
  
  // Configuration
  defaultProps?: Record<string, any>;
  requiredProps?: string[];
  category: 'concrete' | 'abstract';
}

/**
 * AriaKit state configuration
 */
interface AriaKitStateConfig {
  hook: string;
  storeHook: string;
  provider: string;
  defaultOptions?: Record<string, any>;
}

/**
 * AriaKit Adapter for handling all AriaKit components
 */
export class AriaKitAdapter implements AdapterInstance {
  public readonly id: string;
  public readonly config: AdapterConfig;
  public initialized: boolean = false;
  
  private pluginManager: AdapterPluginManager;
  private componentRegistry: Map<string, AriaKitComponentConfig>;
  private stateRegistry: Map<string, AriaKitStateConfig>;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.id = `ariakit-${Date.now()}`;
    this.config = this.buildConfig(config);
    this.pluginManager = new AdapterPluginManager();
    this.componentRegistry = this.initializeComponentRegistry();
    this.stateRegistry = this.initializeStateRegistry();
  }

  private buildConfig(partial: Partial<AdapterConfig>): AdapterConfig {
    return {
      name: 'ariakit-adapter',
      version: '1.0.0',
      framework: {
        name: 'react',
        version: '>=18.0.0',
      },
      capabilities: [
        'component-mapping',
        'accessibility-first',
        'headless-components',
        'state-management',
        'provider-pattern',
        'render-props',
        'keyboard-navigation',
        'focus-management',
        'aria-compliance',
      ],
      options: {
        ...partial.options,
        accessibility: {
          strict: true,
          preserveAria: true,
          keyboardNavigation: true,
          ...partial.options?.accessibility,
        },
      },
      metadata: {
        author: 'AriaKit Adapter',
        description: 'Comprehensive adapter for AriaKit accessibility-first headless components',
        tags: ['ariakit', 'accessibility', 'headless', 'a11y', 'WAI-ARIA'],
        ...partial.metadata,
      } as AdapterMetadata,
      ...partial,
    };
  }

  private initializeComponentRegistry(): Map<string, AriaKitComponentConfig> {
    const registry = new Map<string, AriaKitComponentConfig>();

    // Concrete Components (17)
    
    // Button
    registry.set('Button', {
      component: 'Button',
      ariakitImport: 'ariakit/button',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Button Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
      defaultProps: {
        type: 'button',
      },
    });

    // Checkbox
    registry.set('Checkbox', {
      component: 'Checkbox',
      ariakitImport: 'ariakit/checkbox',
      stateHook: 'useCheckboxState',
      storeHook: 'useCheckboxStore',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Checkbox Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Combobox
    registry.set('Combobox', {
      component: 'Combobox',
      ariakitImport: 'ariakit/combobox',
      stateHook: 'useComboboxState',
      storeHook: 'useComboboxStore',
      providerComponent: 'ComboboxProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['ComboboxPopover', 'ComboboxItem', 'ComboboxDisclosure'],
      ariaPattern: 'Combobox Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Dialog
    registry.set('Dialog', {
      component: 'Dialog',
      ariakitImport: 'ariakit/dialog',
      stateHook: 'useDialogState',
      storeHook: 'useDialogStore',
      providerComponent: 'DialogProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['DialogHeading', 'DialogDescription', 'DialogDismiss'],
      ariaPattern: 'Dialog Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
      defaultProps: {
        modal: true,
      },
    });

    // Disclosure
    registry.set('Disclosure', {
      component: 'Disclosure',
      ariakitImport: 'ariakit/disclosure',
      stateHook: 'useDisclosureState',
      storeHook: 'useDisclosureStore',
      providerComponent: 'DisclosureProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['DisclosureContent'],
      ariaPattern: 'Disclosure Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Form
    registry.set('Form', {
      component: 'Form',
      ariakitImport: 'ariakit/form',
      stateHook: 'useFormState',
      storeHook: 'useFormStore',
      providerComponent: 'FormProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['FormField', 'FormInput', 'FormLabel', 'FormError', 'FormSubmit'],
      ariaPattern: 'Form Role',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Heading
    registry.set('Heading', {
      component: 'Heading',
      ariakitImport: 'ariakit/heading',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Heading Role',
      keyboardNavigation: false,
      focusManagement: false,
      category: 'concrete',
      defaultProps: {
        level: 1,
      },
    });

    // Hovercard
    registry.set('Hovercard', {
      component: 'Hovercard',
      ariakitImport: 'ariakit/hovercard',
      stateHook: 'useHovercardState',
      storeHook: 'useHovercardStore',
      providerComponent: 'HovercardProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['HovercardAnchor', 'HovercardArrow', 'HovercardDismiss'],
      ariaPattern: 'Popover Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Menu
    registry.set('Menu', {
      component: 'Menu',
      ariakitImport: 'ariakit/menu',
      stateHook: 'useMenuState',
      storeHook: 'useMenuStore',
      providerComponent: 'MenuProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['MenuItem', 'MenuButton', 'MenuSeparator', 'MenuArrow'],
      ariaPattern: 'Menu Button Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Menubar
    registry.set('Menubar', {
      component: 'Menubar',
      ariakitImport: 'ariakit/menubar',
      stateHook: 'useMenubarState',
      storeHook: 'useMenubarStore',
      providerComponent: 'MenubarProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['MenubarItem'],
      ariaPattern: 'Menubar Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Popover
    registry.set('Popover', {
      component: 'Popover',
      ariakitImport: 'ariakit/popover',
      stateHook: 'usePopoverState',
      storeHook: 'usePopoverStore',
      providerComponent: 'PopoverProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['PopoverAnchor', 'PopoverArrow', 'PopoverDismiss', 'PopoverHeading', 'PopoverDescription'],
      ariaPattern: 'Popover Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Radio
    registry.set('Radio', {
      component: 'Radio',
      ariakitImport: 'ariakit/radio',
      stateHook: 'useRadioState',
      storeHook: 'useRadioStore',
      providerComponent: 'RadioProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['RadioGroup'],
      ariaPattern: 'Radio Group Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
      requiredProps: ['name'],
    });

    // Select
    registry.set('Select', {
      component: 'Select',
      ariakitImport: 'ariakit/select',
      stateHook: 'useSelectState',
      storeHook: 'useSelectStore',
      providerComponent: 'SelectProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['SelectItem', 'SelectPopover', 'SelectArrow'],
      ariaPattern: 'Combobox Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Tab
    registry.set('Tab', {
      component: 'Tab',
      ariakitImport: 'ariakit/tab',
      stateHook: 'useTabState',
      storeHook: 'useTabStore',
      providerComponent: 'TabProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['TabList', 'TabPanel'],
      ariaPattern: 'Tabs Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Toolbar
    registry.set('Toolbar', {
      component: 'Toolbar',
      ariakitImport: 'ariakit/toolbar',
      stateHook: 'useToolbarState',
      storeHook: 'useToolbarStore',
      providerComponent: 'ToolbarProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['ToolbarItem', 'ToolbarSeparator'],
      ariaPattern: 'Toolbar Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // Tooltip
    registry.set('Tooltip', {
      component: 'Tooltip',
      ariakitImport: 'ariakit/tooltip',
      stateHook: 'useTooltipState',
      storeHook: 'useTooltipStore',
      providerComponent: 'TooltipProvider',
      renderPropSupport: true,
      providerWrapping: true,
      childComponents: ['TooltipAnchor', 'TooltipArrow'],
      ariaPattern: 'Tooltip Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'concrete',
    });

    // VisuallyHidden
    registry.set('VisuallyHidden', {
      component: 'VisuallyHidden',
      ariakitImport: 'ariakit/visually-hidden',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Screen Reader Only',
      keyboardNavigation: false,
      focusManagement: false,
      category: 'concrete',
    });

    // Abstract Components (8)

    // Collection
    registry.set('Collection', {
      component: 'Collection',
      ariakitImport: 'ariakit/collection',
      stateHook: 'useCollectionState',
      storeHook: 'useCollectionStore',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Collection Management',
      keyboardNavigation: false,
      focusManagement: false,
      category: 'abstract',
    });

    // Command
    registry.set('Command', {
      component: 'Command',
      ariakitImport: 'ariakit/command',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Command Pattern',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'abstract',
    });

    // Composite
    registry.set('Composite', {
      component: 'Composite',
      ariakitImport: 'ariakit/composite',
      stateHook: 'useCompositeState',
      storeHook: 'useCompositeStore',
      renderPropSupport: true,
      providerWrapping: false,
      childComponents: ['CompositeItem'],
      ariaPattern: 'Composite Role',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'abstract',
    });

    // Focusable
    registry.set('Focusable', {
      component: 'Focusable',
      ariakitImport: 'ariakit/focusable',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Focus Management',
      keyboardNavigation: true,
      focusManagement: true,
      category: 'abstract',
    });

    // Group
    registry.set('Group', {
      component: 'Group',
      ariakitImport: 'ariakit/group',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Group Role',
      keyboardNavigation: false,
      focusManagement: false,
      category: 'abstract',
    });

    // Portal
    registry.set('Portal', {
      component: 'Portal',
      ariakitImport: 'ariakit/portal',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Portal Pattern',
      keyboardNavigation: false,
      focusManagement: false,
      category: 'abstract',
    });

    // Role
    registry.set('Role', {
      component: 'Role',
      ariakitImport: 'ariakit/role',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'RoleType Role',
      keyboardNavigation: false,
      focusManagement: false,
      category: 'abstract',
    });

    // Separator
    registry.set('Separator', {
      component: 'Separator',
      ariakitImport: 'ariakit/separator',
      renderPropSupport: true,
      providerWrapping: false,
      ariaPattern: 'Separator Role',
      keyboardNavigation: false,
      focusManagement: false,
      category: 'abstract',
    });

    return registry;
  }

  private initializeStateRegistry(): Map<string, AriaKitStateConfig> {
    const registry = new Map<string, AriaKitStateConfig>();

    // State configurations for stateful components
    const stateConfigs: Record<string, AriaKitStateConfig> = {
      Checkbox: {
        hook: 'useCheckboxState',
        storeHook: 'useCheckboxStore',
        provider: 'CheckboxProvider',
      },
      Combobox: {
        hook: 'useComboboxState',
        storeHook: 'useComboboxStore',
        provider: 'ComboboxProvider',
        defaultOptions: { gutter: 8, sameWidth: true },
      },
      Dialog: {
        hook: 'useDialogState',
        storeHook: 'useDialogStore',
        provider: 'DialogProvider',
      },
      Disclosure: {
        hook: 'useDisclosureState',
        storeHook: 'useDisclosureStore',
        provider: 'DisclosureProvider',
      },
      Form: {
        hook: 'useFormState',
        storeHook: 'useFormStore',
        provider: 'FormProvider',
      },
      Hovercard: {
        hook: 'useHovercardState',
        storeHook: 'useHovercardStore',
        provider: 'HovercardProvider',
      },
      Menu: {
        hook: 'useMenuState',
        storeHook: 'useMenuStore',
        provider: 'MenuProvider',
      },
      Menubar: {
        hook: 'useMenubarState',
        storeHook: 'useMenubarStore',
        provider: 'MenubarProvider',
      },
      Popover: {
        hook: 'usePopoverState',
        storeHook: 'usePopoverStore',
        provider: 'PopoverProvider',
      },
      Radio: {
        hook: 'useRadioState',
        storeHook: 'useRadioStore',
        provider: 'RadioProvider',
      },
      Select: {
        hook: 'useSelectState',
        storeHook: 'useSelectStore',
        provider: 'SelectProvider',
      },
      Tab: {
        hook: 'useTabState',
        storeHook: 'useTabStore',
        provider: 'TabProvider',
      },
      Toolbar: {
        hook: 'useToolbarState',
        storeHook: 'useToolbarStore',
        provider: 'ToolbarProvider',
      },
      Tooltip: {
        hook: 'useTooltipState',
        storeHook: 'useTooltipStore',
        provider: 'TooltipProvider',
      },
      Collection: {
        hook: 'useCollectionState',
        storeHook: 'useCollectionStore',
        provider: 'CollectionProvider',
      },
      Composite: {
        hook: 'useCompositeState',
        storeHook: 'useCompositeStore',
        provider: 'CompositeProvider',
      },
    };

    Object.entries(stateConfigs).forEach(([component, config]) => {
      registry.set(component, config);
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

    // Use props directly (no async plugin transformations for sync method)
    const transformedProps = props;

    // Build state configuration if needed
    const stateInfo = this.buildStateInfo(componentConfig, transformedProps);

    // Handle provider wrapping if needed
    const providerInfo = this.buildProviderInfo(componentConfig, transformedProps);

    // Build final props with AriaKit patterns
    const finalProps = this.buildAriaKitProps(componentConfig, transformedProps);

    const mapping: ComponentMapping = {
      component: componentConfig.component,
      props: finalProps,
      metadata: {
        originalComponent: name,
        adapterType: 'ariakit',
        ariakitImport: componentConfig.ariakitImport,
        ariaPattern: componentConfig.ariaPattern,
        category: componentConfig.category,
        headless: true,
        accessible: true,
        ...(stateInfo && { stateManagement: stateInfo }),
        ...(providerInfo && { providerPattern: providerInfo }),
        renderPropSupport: componentConfig.renderPropSupport,
        keyboardNavigation: componentConfig.keyboardNavigation,
        focusManagement: componentConfig.focusManagement,
      },
    };

    return mapping;
  }

  private buildStateInfo(
    config: AriaKitComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> | undefined {
    const stateConfig = this.stateRegistry.get(config.component);
    if (!stateConfig) return undefined;

    return {
      hook: stateConfig.hook,
      storeHook: stateConfig.storeHook,
      provider: stateConfig.provider,
      options: {
        ...stateConfig.defaultOptions,
        ...this.extractStateOptions(props),
      },
    };
  }

  private buildProviderInfo(
    config: AriaKitComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> | undefined {
    if (!config.providerWrapping || !config.providerComponent) {
      return undefined;
    }

    return {
      component: config.providerComponent,
      childComponents: config.childComponents || [],
      required: true,
    };
  }

  private buildAriaKitProps(
    config: AriaKitComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> {
    const finalProps: Record<string, any> = {
      ...config.defaultProps,
      ...props,
    };

    // Preserve accessibility props
    this.preserveAccessibilityProps(finalProps);

    // Handle render prop if present
    if (config.renderPropSupport && props.render) {
      finalProps.render = props.render;
    }

    // Validate required props
    if (config.requiredProps) {
      this.validateRequiredProps(config.requiredProps, finalProps, config.component);
    }

    return finalProps;
  }

  private extractStateOptions(props: Record<string, unknown>): Record<string, any> {
    const stateOptions: Record<string, any> = {};
    
    // Common state option patterns in AriaKit
    const stateOptionKeys = [
      'defaultValue', 'value', 'defaultOpen', 'open',
      'defaultSelected', 'selected', 'defaultChecked', 'checked',
      'defaultExpanded', 'expanded', 'defaultActive', 'active',
      'gutter', 'sameWidth', 'flip', 'shift', 'slide',
      'modal', 'backdrop', 'preventBodyScroll', 'restoreFocus',
      'orientation', 'loop', 'wrap', 'includesBaseElement',
      'placement', 'showTimeout', 'hideTimeout', 'defaultSelectedId',
      'selectedId', 'defaultValues', 'autoFocus', 'name',
    ];

    stateOptionKeys.forEach(key => {
      if (props[key] !== undefined) {
        stateOptions[key] = props[key];
      }
    });

    return stateOptions;
  }

  private preserveAccessibilityProps(props: Record<string, any>): void {
    // AriaKit automatically handles most ARIA attributes, but we preserve
    // any custom ones that might be passed
    const ariaProps = Object.keys(props).filter(key => 
      key.startsWith('aria-') || 
      key.startsWith('data-') ||
      ['role', 'tabIndex', 'id'].includes(key)
    );

    // AriaKit handles these automatically, so we don't need to do anything special
    // They're preserved naturally in the props spreading
  }

  private validateRequiredProps(
    requiredProps: string[],
    props: Record<string, any>,
    componentName: string
  ): void {
    const missingProps = requiredProps.filter(prop => props[prop] === undefined);
    if (missingProps.length > 0) {
      throw new AdapterError(
        `Missing required props for ${componentName}: ${missingProps.join(', ')}`,
        'MISSING_REQUIRED_PROPS'
      );
    }
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
        adapterType: 'ariakit',
        fallback: true,
        accessible: false, // Unknown components can't guarantee accessibility
      },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // AriaKit is headless, so we return styles as className/style props
    return this.translateToHeadlessStyles(styles);
  }

  private translateToHeadlessStyles(styles: StyleConfig): Record<string, unknown> {
    const result: Record<string, any> = {};

    // Convert to style object for headless components
    if (styles.base) {
      result.style = { ...styles.base };
    }

    // Add colors to style object
    if (styles.colors) {
      result.style = { ...result.style, ...styles.colors };
    }

    // Add typography to style object
    if (styles.typography) {
      result.style = { ...result.style, ...styles.typography };
    }

    // Add borders to style object
    if (styles.borders) {
      result.style = { ...result.style, ...styles.borders };
    }

    // Generate className if needed
    if (styles.className) {
      result.className = styles.className;
    }

    return result;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // AriaKit doesn't have a built-in theming system, so we return
    // tokens in a format suitable for CSS custom properties
    return this.convertToCSSCustomProperties(tokens);
  }

  private convertToCSSCustomProperties(tokens: TokenConfig): Record<string, unknown> {
    const cssVars: Record<string, string> = {};

    if (tokens.tokens?.colors) {
      this.convertColorTokens(tokens.tokens.colors, cssVars);
    }

    if (tokens.tokens?.spacing) {
      this.convertSpacingTokens(tokens.tokens.spacing, cssVars);
    }

    if (tokens.tokens?.typography) {
      this.convertTypographyTokens(tokens.tokens.typography, cssVars);
    }

    if (tokens.tokens?.borders) {
      this.convertBorderTokens(tokens.tokens.borders, cssVars);
    }

    return { cssVariables: cssVars };
  }

  private convertColorTokens(colors: any, cssVars: Record<string, string>): void {
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([shade, color]) => {
          cssVars[`--color-${key}-${shade}`] = color as string;
        });
      } else {
        cssVars[`--color-${key}`] = value as string;
      }
    });
  }

  private convertSpacingTokens(spacing: any, cssVars: Record<string, string>): void {
    Object.entries(spacing).forEach(([key, value]) => {
      cssVars[`--spacing-${key}`] = value as string;
    });
  }

  private convertTypographyTokens(typography: any, cssVars: Record<string, string>): void {
    Object.entries(typography).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          cssVars[`--typography-${key}-${prop}`] = val as string;
        });
      } else {
        cssVars[`--typography-${key}`] = value as string;
      }
    });
  }

  private convertBorderTokens(borders: any, cssVars: Record<string, string>): void {
    Object.entries(borders).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          cssVars[`--border-${key}-${prop}`] = val as string;
        });
      } else {
        cssVars[`--border-${key}`] = value as string;
      }
    });
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

    // Validate accessibility configuration
    if (!this.config.options?.accessibility?.strict) {
      warnings.push({
        code: 'ACCESSIBILITY_NOT_STRICT',
        message: 'Accessibility strict mode is recommended for AriaKit',
        path: 'options.accessibility.strict',
        category: 'accessibility',
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

  // AriaKit-specific methods

  /**
   * Get all available AriaKit components
   */
  getAvailableComponents(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: 'concrete' | 'abstract'): string[] {
    return Array.from(this.componentRegistry.entries())
      .filter(([, config]) => config.category === category)
      .map(([name]) => name);
  }

  /**
   * Get component import path
   */
  getComponentImport(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.ariakitImport;
  }

  /**
   * Get state hook for component
   */
  getStateHook(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.stateHook;
  }

  /**
   * Get store hook for component (modern API)
   */
  getStoreHook(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.storeHook;
  }

  /**
   * Get provider component for component
   */
  getProviderComponent(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.providerComponent;
  }

  /**
   * Check if component supports render props
   */
  supportsRenderProps(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.renderPropSupport ?? false;
  }

  /**
   * Check if component requires provider wrapping
   */
  requiresProvider(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.providerWrapping ?? false;
  }

  /**
   * Get accessibility information for component
   */
  getAccessibilityInfo(name: ComponentName): Record<string, any> | undefined {
    const config = this.componentRegistry.get(name);
    if (!config) return undefined;

    return {
      ariaPattern: config.ariaPattern,
      keyboardNavigation: config.keyboardNavigation,
      focusManagement: config.focusManagement,
      accessible: true,
    };
  }

  /**
   * Get child components for a component
   */
  getChildComponents(name: ComponentName): string[] {
    const config = this.componentRegistry.get(name);
    return config?.childComponents ?? [];
  }

  /**
   * Check if component is stateful
   */
  isStateful(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return !!(config?.stateHook || config?.storeHook);
  }
}