/**
 * BaseUI Adapter Implementation
 * 
 * Handles adaptation of MUI's BaseUI headless components with comprehensive support for
 * BaseUI's hook-based architecture, accessibility patterns, and unstyled component approach.
 * BaseUI provides the foundational building blocks for accessible UI components without
 * any built-in styling, making it perfect for custom design systems.
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
 * BaseUI component configuration
 */
interface BaseUIComponentConfig {
  component: string;
  baseUIImport: string;
  
  // Hook-based architecture
  useHook?: string;
  hookOptions?: Record<string, any>;
  
  // Component composition
  slots?: Record<string, string>;
  slotProps?: Record<string, Record<string, any>>;
  renderProps?: boolean;
  
  // Accessibility
  ariaRole: string;
  keyboardSupport: boolean;
  focusManagement: boolean;
  
  // Configuration
  defaultProps?: Record<string, any>;
  requiredProps?: string[];
  
  // BaseUI specific patterns
  unstyled: boolean;
  customizable: boolean;
}

/**
 * BaseUI hook configuration
 */
interface BaseUIHookConfig {
  hookName: string;
  hookImport: string;
  parameters?: Record<string, any>;
  returnType: 'props' | 'state' | 'both';
  dependencies?: string[];
}

/**
 * BaseUI Adapter for handling MUI's BaseUI headless components
 */
export class BaseUIAdapter implements AdapterInstance {
  public readonly id: string;
  public readonly config: AdapterConfig;
  public initialized: boolean = false;
  
  private pluginManager: AdapterPluginManager;
  private componentRegistry: Map<string, BaseUIComponentConfig>;
  private hookRegistry: Map<string, BaseUIHookConfig>;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.id = `base-ui-${Date.now()}`;
    this.config = this.buildConfig(config);
    this.pluginManager = new AdapterPluginManager();
    this.componentRegistry = this.initializeComponentRegistry();
    this.hookRegistry = this.initializeHookRegistry();
  }

  private buildConfig(partial: Partial<AdapterConfig>): AdapterConfig {
    return {
      name: 'base-ui-adapter',
      version: '1.0.0',
      framework: {
        name: 'react',
        version: '>=18.0.0',
      },
      capabilities: [
        'component-mapping',
        'accessibility-first',
        'headless-components',
        'hook-based-architecture',
        'slot-composition',
        'unstyled-components',
        'custom-styling',
        'focus-management',
        'keyboard-navigation',
      ],
      options: {
        ...partial.options,
        accessibility: {
          strict: true,
          preserveAria: true,
          keyboardNavigation: true,
          ...partial.options?.accessibility,
        },
        styling: {
          headless: true,
          customizable: true,
          ...partial.options?.styling,
        },
      },
      metadata: {
        author: 'BaseUI Adapter',
        description: 'Adapter for MUI BaseUI headless components with hook-based architecture',
        tags: ['base-ui', 'mui', 'headless', 'accessibility', 'hooks', 'unstyled'],
        ...partial.metadata,
      } as AdapterMetadata,
      ...partial,
    };
  }

  private initializeComponentRegistry(): Map<string, BaseUIComponentConfig> {
    const registry = new Map<string, BaseUIComponentConfig>();

    // Button component
    registry.set('Button', {
      component: 'Button',
      baseUIImport: '@mui/base/Button',
      useHook: 'useButton',
      slots: {
        root: 'ButtonRoot',
      },
      renderProps: true,
      ariaRole: 'button',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
      defaultProps: {
        type: 'button',
      },
    });

    // Switch component
    registry.set('Switch', {
      component: 'Switch',
      baseUIImport: '@mui/base/Switch',
      useHook: 'useSwitch',
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
      renderProps: true,
      ariaRole: 'switch',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
    });

    // Slider component
    registry.set('Slider', {
      component: 'Slider',
      baseUIImport: '@mui/base/Slider',
      useHook: 'useSlider',
      slots: {
        root: 'SliderRoot',
        rail: 'SliderRail',
        track: 'SliderTrack',
        thumb: 'SliderThumb',
        mark: 'SliderMark',
        markLabel: 'SliderMarkLabel',
        valueLabel: 'SliderValueLabel',
        input: 'SliderInput',
      },
      renderProps: true,
      ariaRole: 'slider',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
      defaultProps: {
        min: 0,
        max: 100,
        step: 1,
      },
    });

    // Input component
    registry.set('Input', {
      component: 'Input',
      baseUIImport: '@mui/base/Input',
      useHook: 'useInput',
      slots: {
        root: 'InputRoot',
        input: 'InputInput',
        textarea: 'InputTextarea',
      },
      renderProps: true,
      ariaRole: 'textbox',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
    });

    // Select component
    registry.set('Select', {
      component: 'Select',
      baseUIImport: '@mui/base/Select',
      useHook: 'useSelect',
      slots: {
        root: 'SelectRoot',
        button: 'SelectButton',
        listbox: 'SelectListbox',
        option: 'SelectOption',
        popper: 'SelectPopper',
      },
      renderProps: true,
      ariaRole: 'combobox',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
    });

    // Option component
    registry.set('Option', {
      component: 'Option',
      baseUIImport: '@mui/base/Option',
      useHook: 'useOption',
      renderProps: true,
      ariaRole: 'option',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
      requiredProps: ['value'],
    });

    // Modal component
    registry.set('Modal', {
      component: 'Modal',
      baseUIImport: '@mui/base/Modal',
      useHook: 'useModal',
      slots: {
        root: 'ModalRoot',
        backdrop: 'ModalBackdrop',
      },
      renderProps: true,
      ariaRole: 'dialog',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
      defaultProps: {
        keepMounted: false,
        disableAutoFocus: false,
        disableEnforceFocus: false,
        disableEscapeKeyDown: false,
        disablePortal: false,
        disableRestoreFocus: false,
        disableScrollLock: false,
      },
    });

    // Popper component
    registry.set('Popper', {
      component: 'Popper',
      baseUIImport: '@mui/base/Popper',
      useHook: 'usePopper',
      renderProps: true,
      ariaRole: 'tooltip',
      keyboardSupport: false,
      focusManagement: false,
      unstyled: true,
      customizable: true,
      defaultProps: {
        placement: 'bottom',
        disablePortal: false,
        keepMounted: false,
      },
    });

    // ClickAwayListener component
    registry.set('ClickAwayListener', {
      component: 'ClickAwayListener',
      baseUIImport: '@mui/base/ClickAwayListener',
      renderProps: false,
      ariaRole: 'none',
      keyboardSupport: false,
      focusManagement: false,
      unstyled: true,
      customizable: false,
      requiredProps: ['onClickAway'],
      defaultProps: {
        mouseEvent: 'onClick',
        touchEvent: 'onTouchEnd',
        disableReactTree: false,
      },
    });

    // FocusTrap component
    registry.set('FocusTrap', {
      component: 'FocusTrap',
      baseUIImport: '@mui/base/FocusTrap',
      renderProps: false,
      ariaRole: 'none',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: false,
      defaultProps: {
        open: true,
        disableAutoFocus: false,
        disableEnforceFocus: false,
        disableRestoreFocus: false,
      },
    });

    // Portal component
    registry.set('Portal', {
      component: 'Portal',
      baseUIImport: '@mui/base/Portal',
      renderProps: false,
      ariaRole: 'none',
      keyboardSupport: false,
      focusManagement: false,
      unstyled: true,
      customizable: false,
      defaultProps: {
        disablePortal: false,
      },
    });

    // NoSsr component
    registry.set('NoSsr', {
      component: 'NoSsr',
      baseUIImport: '@mui/base/NoSsr',
      renderProps: false,
      ariaRole: 'none',
      keyboardSupport: false,
      focusManagement: false,
      unstyled: true,
      customizable: false,
      defaultProps: {
        defer: false,
        fallback: null,
      },
    });

    // TextareaAutosize component
    registry.set('TextareaAutosize', {
      component: 'TextareaAutosize',
      baseUIImport: '@mui/base/TextareaAutosize',
      renderProps: false,
      ariaRole: 'textbox',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
      defaultProps: {
        minRows: 1,
        maxRows: Infinity,
      },
    });

    // Unstable_Popup component
    registry.set('Popup', {
      component: 'Popup',
      baseUIImport: '@mui/base/Unstable_Popup',
      useHook: 'usePopup',
      slots: {
        root: 'PopupRoot',
      },
      renderProps: true,
      ariaRole: 'dialog',
      keyboardSupport: true,
      focusManagement: true,
      unstyled: true,
      customizable: true,
      requiredProps: ['anchor'],
    });

    return registry;
  }

  private initializeHookRegistry(): Map<string, BaseUIHookConfig> {
    const registry = new Map<string, BaseUIHookConfig>();

    // Component hooks
    const hookConfigs: Record<string, BaseUIHookConfig> = {
      useButton: {
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
      },
      useSwitch: {
        hookName: 'useSwitch',
        hookImport: '@mui/base/useSwitch',
        returnType: 'both',
        parameters: {
          checked: 'boolean',
          defaultChecked: 'boolean',
          disabled: 'boolean',
          onChange: 'function',
          readOnly: 'boolean',
          required: 'boolean',
        },
      },
      useSlider: {
        hookName: 'useSlider',
        hookImport: '@mui/base/useSlider',
        returnType: 'both',
        parameters: {
          'aria-label': 'string',
          'aria-labelledby': 'string',
          'aria-valuetext': 'string',
          defaultValue: 'number | number[]',
          disabled: 'boolean',
          disableSwap: 'boolean',
          isRtl: 'boolean',
          marks: 'boolean | Mark[]',
          max: 'number',
          min: 'number',
          name: 'string',
          onChange: 'function',
          onChangeCommitted: 'function',
          orientation: 'horizontal | vertical',
          scale: 'function',
          step: 'number',
          tabIndex: 'number',
          value: 'number | number[]',
        },
      },
      useInput: {
        hookName: 'useInput',
        hookImport: '@mui/base/useInput',
        returnType: 'both',
        parameters: {
          autoComplete: 'string',
          autoFocus: 'boolean',
          defaultValue: 'string',
          disabled: 'boolean',
          error: 'boolean',
          id: 'string',
          multiline: 'boolean',
          name: 'string',
          onChange: 'function',
          placeholder: 'string',
          readOnly: 'boolean',
          required: 'boolean',
          rows: 'number',
          type: 'string',
          value: 'string',
        },
      },
      useSelect: {
        hookName: 'useSelect',
        hookImport: '@mui/base/useSelect',
        returnType: 'both',
        parameters: {
          autoFocus: 'boolean',
          defaultListboxOpen: 'boolean',
          defaultValue: 'any',
          disabled: 'boolean',
          listboxId: 'string',
          listboxOpen: 'boolean',
          multiple: 'boolean',
          name: 'string',
          onChange: 'function',
          onListboxOpenChange: 'function',
          required: 'boolean',
          value: 'any',
        },
      },
      useOption: {
        hookName: 'useOption',
        hookImport: '@mui/base/useOption',
        returnType: 'both',
        parameters: {
          disabled: 'boolean',
          label: 'string',
          value: 'any',
        },
      },
      useModal: {
        hookName: 'useModal',
        hookImport: '@mui/base/useModal',
        returnType: 'both',
        parameters: {
          open: 'boolean',
          onClose: 'function',
          disableAutoFocus: 'boolean',
          disableEnforceFocus: 'boolean',
          disableEscapeKeyDown: 'boolean',
          disableRestoreFocus: 'boolean',
          disableScrollLock: 'boolean',
        },
      },
      usePopper: {
        hookName: 'usePopper',
        hookImport: '@mui/base/usePopper',
        returnType: 'both',
        parameters: {
          anchorEl: 'Element | null',
          container: 'Element | null',
          disablePortal: 'boolean',
          keepMounted: 'boolean',
          modifiers: 'Array',
          open: 'boolean',
          placement: 'string',
          popperOptions: 'object',
          popperRef: 'React.Ref',
          transition: 'boolean',
        },
      },
      usePopup: {
        hookName: 'usePopup',
        hookImport: '@mui/base/Unstable_Popup',
        returnType: 'both',
        parameters: {
          anchor: 'Element | null',
          open: 'boolean',
          placement: 'string',
          offset: 'number | { mainAxis?: number; crossAxis?: number; alignmentAxis?: number }',
          disablePortal: 'boolean',
          keepMounted: 'boolean',
        },
      },
    };

    Object.entries(hookConfigs).forEach(([hookName, config]) => {
      registry.set(hookName, config);
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

    // Build hook information if component uses hooks
    const hookInfo = this.buildHookInfo(componentConfig, transformedProps);

    // Handle slot composition if component uses slots
    const slotInfo = this.buildSlotInfo(componentConfig, transformedProps);

    // Build final props with BaseUI patterns
    const finalProps = this.buildBaseUIProps(componentConfig, transformedProps);

    const mapping: ComponentMapping = {
      component: componentConfig.component,
      props: finalProps,
      metadata: {
        originalComponent: name,
        adapterType: 'base-ui',
        baseUIImport: componentConfig.baseUIImport,
        ariaRole: componentConfig.ariaRole,
        headless: true,
        unstyled: componentConfig.unstyled,
        customizable: componentConfig.customizable,
        ...(hookInfo && { hookBased: hookInfo }),
        ...(slotInfo && { slotComposition: slotInfo }),
        renderProps: componentConfig.renderProps,
        keyboardSupport: componentConfig.keyboardSupport,
        focusManagement: componentConfig.focusManagement,
      },
    };

    return mapping;
  }

  private buildHookInfo(
    config: BaseUIComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> | undefined {
    if (!config.useHook) return undefined;

    const hookConfig = this.hookRegistry.get(config.useHook);
    if (!hookConfig) return undefined;

    return {
      hookName: hookConfig.hookName,
      hookImport: hookConfig.hookImport,
      returnType: hookConfig.returnType,
      parameters: this.extractHookParameters(hookConfig, props),
    };
  }

  private buildSlotInfo(
    config: BaseUIComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> | undefined {
    if (!config.slots) return undefined;

    return {
      slots: config.slots,
      slotProps: {
        ...config.slotProps,
        ...this.extractSlotProps(props),
      },
    };
  }

  private buildBaseUIProps(
    config: BaseUIComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> {
    const finalProps: Record<string, any> = {
      ...config.defaultProps,
      ...props,
    };

    // Preserve accessibility props (BaseUI handles ARIA automatically but allows customization)
    this.preserveAccessibilityProps(finalProps);

    // Handle slot props if present
    if (config.slots && props.slotProps) {
      finalProps.slotProps = this.mergeSlotProps(config.slotProps, props.slotProps as Record<string, any>);
    }

    // Handle component slots if present
    if (config.slots && props.slots) {
      finalProps.slots = {
        ...config.slots,
        ...props.slots,
      };
    }

    // Validate required props
    if (config.requiredProps) {
      this.validateRequiredProps(config.requiredProps, finalProps, config.component);
    }

    return finalProps;
  }

  private extractHookParameters(
    hookConfig: BaseUIHookConfig,
    props: Record<string, unknown>
  ): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    if (!hookConfig.parameters) return parameters;

    Object.keys(hookConfig.parameters).forEach(paramKey => {
      if (props[paramKey] !== undefined) {
        parameters[paramKey] = props[paramKey];
      }
    });

    return parameters;
  }

  private extractSlotProps(props: Record<string, unknown>): Record<string, any> {
    const slotProps: Record<string, any> = {};
    
    // Extract props that are specifically for slots
    Object.keys(props).forEach(key => {
      if (key.startsWith('slot') && key !== 'slots' && key !== 'slotProps') {
        const slotName = key.replace(/^slot([A-Z])/, (_, letter) => letter.toLowerCase());
        slotProps[slotName] = props[key];
      }
    });

    return slotProps;
  }

  private preserveAccessibilityProps(props: Record<string, any>): void {
    // BaseUI components automatically handle ARIA attributes but allow customization
    // We preserve all ARIA and data attributes
    const preservedProps = Object.keys(props).filter(key => 
      key.startsWith('aria-') || 
      key.startsWith('data-') ||
      ['role', 'tabIndex', 'id', 'title'].includes(key)
    );

    // Props are preserved naturally through spreading
  }

  private mergeSlotProps(
    configSlotProps: Record<string, Record<string, any>> = {},
    userSlotProps: Record<string, any> = {}
  ): Record<string, any> {
    const merged: Record<string, any> = {};
    
    // Start with config slot props
    Object.keys(configSlotProps).forEach(slotName => {
      merged[slotName] = { ...configSlotProps[slotName] };
    });
    
    // Merge user slot props on top, doing deep merge for each slot
    Object.keys(userSlotProps).forEach(slotName => {
      if (merged[slotName]) {
        merged[slotName] = { ...merged[slotName], ...userSlotProps[slotName] };
      } else {
        merged[slotName] = { ...userSlotProps[slotName] };
      }
    });
    
    return merged;
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
        adapterType: 'base-ui',
        fallback: true,
        headless: false,
        unstyled: false,
        customizable: false,
      },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // BaseUI is headless/unstyled, so we translate styles to inline styles and CSS classes
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

    // Add spacing to style object
    if (styles.spacing) {
      result.style = { ...result.style, ...styles.spacing };
    }

    // Generate className if needed
    if (styles.className) {
      result.className = styles.className;
    }

    // BaseUI specific: convert to slot props for styling
    if (styles.base || styles.colors || styles.typography || styles.borders || styles.spacing) {
      result.slotProps = {
        root: {
          style: result.style,
          className: result.className,
        },
      };
    }

    return result;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // BaseUI doesn't have a built-in theming system, so we convert
    // tokens to CSS custom properties and style objects
    return this.convertToCustomProperties(tokens);
  }

  private convertToCustomProperties(tokens: TokenConfig): Record<string, unknown> {
    const cssVars: Record<string, string> = {};
    const themeStyles: Record<string, any> = {};

    if (tokens.tokens?.colors) {
      this.convertColorTokens(tokens.tokens.colors, cssVars, themeStyles);
    }

    if (tokens.tokens?.spacing) {
      this.convertSpacingTokens(tokens.tokens.spacing, cssVars, themeStyles);
    }

    if (tokens.tokens?.typography) {
      this.convertTypographyTokens(tokens.tokens.typography, cssVars, themeStyles);
    }

    if (tokens.tokens?.borders) {
      this.convertBorderTokens(tokens.tokens.borders, cssVars, themeStyles);
    }

    return { 
      cssVariables: cssVars,
      themeStyles,
      slotProps: {
        root: {
          style: themeStyles,
        },
      },
    };
  }

  private convertColorTokens(colors: any, cssVars: Record<string, string>, themeStyles: Record<string, any>): void {
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([shade, color]) => {
          const varName = `--color-${key}-${shade}`;
          cssVars[varName] = color as string;
          if (!themeStyles.colors) themeStyles.colors = {};
          themeStyles.colors[`${key}-${shade}`] = `var(${varName})`;
        });
      } else {
        const varName = `--color-${key}`;
        cssVars[varName] = value as string;
        if (!themeStyles.colors) themeStyles.colors = {};
        themeStyles.colors[key] = `var(${varName})`;
      }
    });
  }

  private convertSpacingTokens(spacing: any, cssVars: Record<string, string>, themeStyles: Record<string, any>): void {
    Object.entries(spacing).forEach(([key, value]) => {
      const varName = `--spacing-${key}`;
      cssVars[varName] = value as string;
      if (!themeStyles.spacing) themeStyles.spacing = {};
      themeStyles.spacing[key] = `var(${varName})`;
    });
  }

  private convertTypographyTokens(typography: any, cssVars: Record<string, string>, themeStyles: Record<string, any>): void {
    Object.entries(typography).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          const varName = `--typography-${key}-${prop}`;
          cssVars[varName] = val as string;
          if (!themeStyles.typography) themeStyles.typography = {};
          if (!themeStyles.typography[key]) themeStyles.typography[key] = {};
          themeStyles.typography[key][prop] = `var(${varName})`;
        });
      } else {
        const varName = `--typography-${key}`;
        cssVars[varName] = value as string;
        if (!themeStyles.typography) themeStyles.typography = {};
        themeStyles.typography[key] = `var(${varName})`;
      }
    });
  }

  private convertBorderTokens(borders: any, cssVars: Record<string, string>, themeStyles: Record<string, any>): void {
    Object.entries(borders).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          const varName = `--border-${key}-${prop}`;
          cssVars[varName] = val as string;
          if (!themeStyles.borders) themeStyles.borders = {};
          if (!themeStyles.borders[key]) themeStyles.borders[key] = {};
          themeStyles.borders[key][prop] = `var(${varName})`;
        });
      } else {
        const varName = `--border-${key}`;
        cssVars[varName] = value as string;
        if (!themeStyles.borders) themeStyles.borders = {};
        themeStyles.borders[key] = `var(${varName})`;
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

    // Validate BaseUI-specific configuration
    if (!this.config.options?.styling?.headless) {
      warnings.push({
        code: 'NOT_HEADLESS',
        message: 'BaseUI is designed for headless components',
        path: 'options.styling.headless',
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

  // BaseUI-specific methods

  /**
   * Get all available BaseUI components
   */
  getAvailableComponents(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Get components by their headless/styled nature
   */
  getComponentsByType(type: 'headless' | 'styled'): string[] {
    return Array.from(this.componentRegistry.entries())
      .filter(([, config]) => type === 'headless' ? config.unstyled : !config.unstyled)
      .map(([name]) => name);
  }

  /**
   * Get BaseUI component import path
   */
  getComponentImport(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.baseUIImport;
  }

  /**
   * Get hook name for component
   */
  getComponentHook(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.useHook;
  }

  /**
   * Get available slots for component
   */
  getComponentSlots(name: ComponentName): Record<string, string> | undefined {
    const config = this.componentRegistry.get(name);
    return config?.slots;
  }

  /**
   * Check if component supports render props
   */
  supportsRenderProps(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.renderProps ?? false;
  }

  /**
   * Check if component is customizable
   */
  isCustomizable(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.customizable ?? false;
  }

  /**
   * Get accessibility information for component
   */
  getAccessibilityInfo(name: ComponentName): Record<string, any> | undefined {
    const config = this.componentRegistry.get(name);
    if (!config) return undefined;

    return {
      ariaRole: config.ariaRole,
      keyboardSupport: config.keyboardSupport,
      focusManagement: config.focusManagement,
      accessible: config.keyboardSupport || config.focusManagement,
    };
  }

  /**
   * Get available hooks
   */
  getAvailableHooks(): string[] {
    return Array.from(this.hookRegistry.keys());
  }

  /**
   * Get hook configuration
   */
  getHookConfig(hookName: string): BaseUIHookConfig | undefined {
    return this.hookRegistry.get(hookName);
  }

  /**
   * Check if component uses hooks
   */
  isHookBased(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return !!(config?.useHook);
  }
}