/**
 * Ant Design Adapter Implementation
 * 
 * Comprehensive adapter for Ant Design (antd) components with enterprise-focused features.
 * Supports all major antd components including advanced data display, form handling,
 * and navigation patterns commonly used in enterprise applications.
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
 * Ant Design component configuration
 */
interface AntDesignComponentConfig {
  component: string;
  antdImport: string;
  
  // Form integration
  formItem?: boolean;
  formItemProps?: Record<string, any>;
  
  // Configuration provider
  configProvider?: boolean;
  configContext?: string[];
  
  // Component variants
  variants?: Record<string, any>;
  sizes?: string[];
  
  // Styling approaches
  themeToken?: string;
  className?: string;
  style?: boolean;
  
  // Enterprise features
  locale?: boolean;
  responsive?: boolean;
  accessibility?: boolean;
  
  // Configuration
  defaultProps?: Record<string, any>;
  requiredProps?: string[];
  deprecatedProps?: Record<string, string>;
  
  // Component category
  category: 'general' | 'layout' | 'navigation' | 'data-entry' | 'data-display' | 'feedback' | 'other';
}

/**
 * Ant Design theme configuration
 */
interface AntDesignThemeConfig {
  algorithm?: 'default' | 'dark' | 'compact';
  token?: Record<string, any>;
  components?: Record<string, Record<string, any>>;
  cssVar?: boolean;
  hashed?: boolean;
}

/**
 * Ant Design Adapter for handling Ant Design components
 */
export class AntDesignAdapter implements AdapterInstance {
  public readonly id: string;
  public readonly config: AdapterConfig;
  public initialized: boolean = false;
  
  private pluginManager: AdapterPluginManager;
  private componentRegistry: Map<string, AntDesignComponentConfig>;
  private themeRegistry: Map<string, AntDesignThemeConfig>;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.id = `antd-${Date.now()}`;
    this.config = this.buildConfig(config);
    this.pluginManager = new AdapterPluginManager();
    this.componentRegistry = this.initializeComponentRegistry();
    this.themeRegistry = this.initializeThemeRegistry();
  }

  private buildConfig(partial: Partial<AdapterConfig>): AdapterConfig {
    return {
      name: 'antd-adapter',
      version: '1.0.0',
      framework: {
        name: 'react',
        version: '>=16.8.0',
      },
      capabilities: [
        'component-mapping',
        'enterprise-components',
        'form-integration',
        'config-provider',
        'theme-customization',
        'internationalization',
        'accessibility',
        'responsive-design',
        'css-in-js',
        'design-tokens',
      ],
      options: {
        ...partial.options,
        styling: {
          theme: 'antd',
          cssInJs: true,
          customizable: true,
          ...partial.options?.styling,
        },
        enterprise: {
          formValidation: true,
          dataVisualization: true,
          tableFeatures: true,
          ...partial.options?.enterprise,
        },
      },
      metadata: {
        author: 'Ant Design Adapter',
        description: 'Comprehensive adapter for Ant Design enterprise components',
        tags: ['antd', 'enterprise', 'forms', 'tables', 'data-display', 'react'],
        ...partial.metadata,
      } as AdapterMetadata,
      ...partial,
    };
  }

  private initializeComponentRegistry(): Map<string, AntDesignComponentConfig> {
    const registry = new Map<string, AntDesignComponentConfig>();

    // General Components

    // Button
    registry.set('Button', {
      component: 'Button',
      antdImport: 'antd/es/button',
      variants: {
        type: ['default', 'primary', 'dashed', 'text', 'link'],
        shape: ['default', 'circle', 'round'],
        danger: [true, false],
        ghost: [true, false],
      },
      sizes: ['large', 'middle', 'small'],
      themeToken: 'Button',
      className: 'ant-btn',
      style: true,
      accessibility: true,
      category: 'general',
      defaultProps: {
        type: 'default',
        htmlType: 'button',
        block: false,
        danger: false,
        disabled: false,
        ghost: false,
        loading: false,
        shape: 'default',
        size: 'middle',
      },
    });

    // Icon
    registry.set('Icon', {
      component: 'Icon',
      antdImport: '@ant-design/icons',
      themeToken: 'Icon',
      style: true,
      accessibility: true,
      category: 'general',
      defaultProps: {
        spin: false,
        rotate: 0,
      },
    });

    // Typography
    registry.set('Typography', {
      component: 'Typography',
      antdImport: 'antd/es/typography',
      variants: {
        level: [1, 2, 3, 4, 5],
        type: ['secondary', 'success', 'warning', 'danger'],
      },
      themeToken: 'Typography',
      style: true,
      accessibility: true,
      category: 'general',
    });

    // Layout Components

    // Layout
    registry.set('Layout', {
      component: 'Layout',
      antdImport: 'antd/es/layout',
      themeToken: 'Layout',
      responsive: true,
      category: 'layout',
    });

    // Grid
    registry.set('Grid', {
      component: 'Row',
      antdImport: 'antd/es/grid',
      responsive: true,
      category: 'layout',
      defaultProps: {
        gutter: 0,
        justify: 'start',
        align: 'top',
        wrap: true,
      },
    });

    // Space
    registry.set('Space', {
      component: 'Space',
      antdImport: 'antd/es/space',
      sizes: ['small', 'middle', 'large'],
      responsive: true,
      category: 'layout',
      defaultProps: {
        direction: 'horizontal',
        size: 'small',
        wrap: false,
      },
    });

    // Navigation Components

    // Menu
    registry.set('Menu', {
      component: 'Menu',
      antdImport: 'antd/es/menu',
      variants: {
        mode: ['vertical', 'horizontal', 'inline'],
        theme: ['light', 'dark'],
      },
      themeToken: 'Menu',
      accessibility: true,
      category: 'navigation',
      defaultProps: {
        mode: 'vertical',
        theme: 'light',
        inlineIndent: 24,
        selectable: true,
        multiple: false,
      },
    });

    // Breadcrumb
    registry.set('Breadcrumb', {
      component: 'Breadcrumb',
      antdImport: 'antd/es/breadcrumb',
      themeToken: 'Breadcrumb',
      accessibility: true,
      category: 'navigation',
      defaultProps: {
        separator: '/',
      },
    });

    // Pagination
    registry.set('Pagination', {
      component: 'Pagination',
      antdImport: 'antd/es/pagination',
      sizes: ['default', 'small'],
      locale: true,
      accessibility: true,
      category: 'navigation',
      defaultProps: {
        current: 1,
        defaultCurrent: 1,
        total: 0,
        pageSize: 10,
        showSizeChanger: false,
        showQuickJumper: false,
        showTotal: false,
        simple: false,
        size: 'default',
        responsive: false,
        hideOnSinglePage: false,
      },
    });

    // Steps
    registry.set('Steps', {
      component: 'Steps',
      antdImport: 'antd/es/steps',
      variants: {
        direction: ['horizontal', 'vertical'],
        size: ['default', 'small'],
        status: ['wait', 'process', 'finish', 'error'],
        type: ['default', 'navigation'],
      },
      responsive: true,
      accessibility: true,
      category: 'navigation',
      defaultProps: {
        current: 0,
        direction: 'horizontal',
        size: 'default',
        status: 'process',
        type: 'default',
      },
    });

    // Data Entry Components

    // Form
    registry.set('Form', {
      component: 'Form',
      antdImport: 'antd/es/form',
      formItem: false, // Form itself, not Form.Item
      variants: {
        layout: ['horizontal', 'vertical', 'inline'],
        size: ['large', 'middle', 'small'],
      },
      configProvider: true,
      configContext: ['validateMessages', 'requiredMark'],
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        layout: 'horizontal',
        size: 'middle',
        requiredMark: true,
        colon: true,
        scrollToFirstError: false,
        preserve: true,
        validateTrigger: 'onChange',
      },
    });

    // Input
    registry.set('Input', {
      component: 'Input',
      antdImport: 'antd/es/input',
      formItem: true,
      sizes: ['large', 'middle', 'small'],
      variants: {
        variant: ['outlined', 'borderless', 'filled'],
        status: ['error', 'warning'],
      },
      themeToken: 'Input',
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        size: 'middle',
        variant: 'outlined',
        allowClear: false,
        disabled: false,
        readOnly: false,
      },
    });

    // Select
    registry.set('Select', {
      component: 'Select',
      antdImport: 'antd/es/select',
      formItem: true,
      sizes: ['large', 'middle', 'small'],
      variants: {
        variant: ['outlined', 'borderless', 'filled'],
        mode: ['multiple', 'tags'],
        status: ['error', 'warning'],
      },
      themeToken: 'Select',
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        size: 'middle',
        variant: 'outlined',
        allowClear: false,
        disabled: false,
        loading: false,
        virtual: true,
        showSearch: false,
        filterOption: true,
      },
    });

    // Checkbox
    registry.set('Checkbox', {
      component: 'Checkbox',
      antdImport: 'antd/es/checkbox',
      formItem: true,
      themeToken: 'Checkbox',
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        checked: false,
        defaultChecked: false,
        disabled: false,
        indeterminate: false,
      },
    });

    // Radio
    registry.set('Radio', {
      component: 'Radio',
      antdImport: 'antd/es/radio',
      formItem: true,
      variants: {
        optionType: ['default', 'button'],
        buttonStyle: ['outline', 'solid'],
      },
      sizes: ['large', 'middle', 'small'],
      themeToken: 'Radio',
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        checked: false,
        defaultChecked: false,
        disabled: false,
      },
    });

    // Switch
    registry.set('Switch', {
      component: 'Switch',
      antdImport: 'antd/es/switch',
      formItem: true,
      sizes: ['default', 'small'],
      themeToken: 'Switch',
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        checked: false,
        defaultChecked: false,
        disabled: false,
        loading: false,
        size: 'default',
      },
    });

    // DatePicker
    registry.set('DatePicker', {
      component: 'DatePicker',
      antdImport: 'antd/es/date-picker',
      formItem: true,
      sizes: ['large', 'middle', 'small'],
      variants: {
        variant: ['outlined', 'borderless', 'filled'],
        picker: ['date', 'week', 'month', 'quarter', 'year'],
        status: ['error', 'warning'],
      },
      locale: true,
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        size: 'middle',
        variant: 'outlined',
        picker: 'date',
        allowClear: true,
        autoFocus: false,
        disabled: false,
        inputReadOnly: false,
      },
    });

    // Upload
    registry.set('Upload', {
      component: 'Upload',
      antdImport: 'antd/es/upload',
      formItem: true,
      variants: {
        listType: ['text', 'picture', 'picture-card', 'picture-circle'],
      },
      accessibility: true,
      category: 'data-entry',
      defaultProps: {
        listType: 'text',
        multiple: false,
        disabled: false,
        supportServerRender: true,
        openFileDialogOnClick: true,
        showUploadList: true,
      },
    });

    // Data Display Components

    // Table
    registry.set('Table', {
      component: 'Table',
      antdImport: 'antd/es/table',
      sizes: ['large', 'middle', 'small'],
      responsive: true,
      locale: true,
      accessibility: true,
      category: 'data-display',
      defaultProps: {
        size: 'large',
        bordered: false,
        showHeader: true,
        tableLayout: 'auto',
        pagination: { position: ['bottomRight'] },
        scroll: {},
        sticky: false,
        virtual: false,
      },
    });

    // Tag
    registry.set('Tag', {
      component: 'Tag',
      antdImport: 'antd/es/tag',
      variants: {
        color: ['default', 'primary', 'success', 'processing', 'error', 'warning'],
      },
      themeToken: 'Tag',
      category: 'data-display',
      defaultProps: {
        closable: false,
        closeIcon: undefined,
      },
    });

    // Card
    registry.set('Card', {
      component: 'Card',
      antdImport: 'antd/es/card',
      sizes: ['default', 'small'],
      variants: {
        type: ['default', 'inner'],
      },
      themeToken: 'Card',
      category: 'data-display',
      defaultProps: {
        size: 'default',
        type: 'default',
        bordered: true,
        hoverable: false,
        loading: false,
      },
    });

    // Avatar
    registry.set('Avatar', {
      component: 'Avatar',
      antdImport: 'antd/es/avatar',
      sizes: ['large', 'default', 'small'],
      variants: {
        shape: ['circle', 'square'],
      },
      themeToken: 'Avatar',
      category: 'data-display',
      defaultProps: {
        shape: 'circle',
        size: 'default',
      },
    });

    // Badge
    registry.set('Badge', {
      component: 'Badge',
      antdImport: 'antd/es/badge',
      variants: {
        status: ['success', 'processing', 'default', 'error', 'warning'],
      },
      themeToken: 'Badge',
      category: 'data-display',
      defaultProps: {
        showZero: false,
        dot: false,
      },
    });

    // Descriptions
    registry.set('Descriptions', {
      component: 'Descriptions',
      antdImport: 'antd/es/descriptions',
      sizes: ['default', 'middle', 'small'],
      variants: {
        layout: ['horizontal', 'vertical'],
      },
      responsive: true,
      category: 'data-display',
      defaultProps: {
        size: 'default',
        layout: 'horizontal',
        bordered: false,
        colon: true,
      },
    });

    // List
    registry.set('List', {
      component: 'List',
      antdImport: 'antd/es/list',
      sizes: ['large', 'default', 'small'],
      responsive: true,
      locale: true,
      category: 'data-display',
      defaultProps: {
        size: 'default',
        bordered: false,
        split: true,
      },
    });

    // Tree
    registry.set('Tree', {
      component: 'Tree',
      antdImport: 'antd/es/tree',
      accessibility: true,
      category: 'data-display',
      defaultProps: {
        showLine: false,
        showIcon: false,
        selectable: true,
        multiple: false,
        checkable: false,
        disabled: false,
        draggable: false,
        blockNode: false,
        autoExpandParent: true,
        defaultExpandAll: false,
        defaultExpandParent: true,
      },
    });

    // Feedback Components

    // Alert
    registry.set('Alert', {
      component: 'Alert',
      antdImport: 'antd/es/alert',
      variants: {
        type: ['success', 'info', 'warning', 'error'],
      },
      accessibility: true,
      category: 'feedback',
      defaultProps: {
        type: 'info',
        closable: false,
        showIcon: false,
        banner: false,
      },
    });

    // Modal
    registry.set('Modal', {
      component: 'Modal',
      antdImport: 'antd/es/modal',
      configProvider: true,
      locale: true,
      accessibility: true,
      category: 'feedback',
      defaultProps: {
        centered: false,
        closable: true,
        destroyOnClose: false,
        forceRender: false,
        keyboard: true,
        mask: true,
        maskClosable: true,
        open: false,
        width: 520,
        zIndex: 1000,
      },
    });

    // Message
    registry.set('Message', {
      component: 'message',
      antdImport: 'antd/es/message',
      configProvider: true,
      locale: true,
      category: 'feedback',
      defaultProps: {
        duration: 3,
        maxCount: undefined,
        top: 24,
        rtl: false,
      },
    });

    // Notification
    registry.set('Notification', {
      component: 'notification',
      antdImport: 'antd/es/notification',
      configProvider: true,
      locale: true,
      category: 'feedback',
      defaultProps: {
        bottom: 24,
        top: 24,
        closeIcon: true,
        duration: 4.5,
        maxCount: undefined,
        placement: 'topRight',
        rtl: false,
      },
    });

    // Progress
    registry.set('Progress', {
      component: 'Progress',
      antdImport: 'antd/es/progress',
      variants: {
        type: ['line', 'circle', 'dashboard'],
        status: ['success', 'exception', 'normal', 'active'],
        size: ['default', 'small'],
      },
      themeToken: 'Progress',
      category: 'feedback',
      defaultProps: {
        type: 'line',
        percent: 0,
        showInfo: true,
        status: 'normal',
        strokeLinecap: 'round',
        size: 'default',
      },
    });

    // Spin
    registry.set('Spin', {
      component: 'Spin',
      antdImport: 'antd/es/spin',
      sizes: ['small', 'default', 'large'],
      themeToken: 'Spin',
      category: 'feedback',
      defaultProps: {
        size: 'default',
        spinning: true,
        delay: 0,
      },
    });

    // Skeleton
    registry.set('Skeleton', {
      component: 'Skeleton',
      antdImport: 'antd/es/skeleton',
      themeToken: 'Skeleton',
      category: 'feedback',
      defaultProps: {
        active: false,
        loading: false,
        round: false,
        title: true,
        paragraph: true,
      },
    });

    // Result
    registry.set('Result', {
      component: 'Result',
      antdImport: 'antd/es/result',
      variants: {
        status: ['success', 'error', 'info', 'warning', '403', '404', '500'],
      },
      category: 'feedback',
    });

    // Other Components

    // Anchor
    registry.set('Anchor', {
      component: 'Anchor',
      antdImport: 'antd/es/anchor',
      accessibility: true,
      category: 'other',
      defaultProps: {
        offsetTop: 0,
        bounds: 5,
        showInkInFixed: false,
        targetOffset: 0,
      },
    });

    // BackTop
    registry.set('BackTop', {
      component: 'BackTop',
      antdImport: 'antd/es/back-top',
      accessibility: true,
      category: 'other',
      defaultProps: {
        visibilityHeight: 400,
      },
    });

    // ConfigProvider
    registry.set('ConfigProvider', {
      component: 'ConfigProvider',
      antdImport: 'antd/es/config-provider',
      configProvider: true,
      locale: true,
      category: 'other',
    });

    return registry;
  }

  private initializeThemeRegistry(): Map<string, AntDesignThemeConfig> {
    const registry = new Map<string, AntDesignThemeConfig>();

    // Default theme
    registry.set('default', {
      algorithm: 'default',
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
        wireframe: false,
      },
      cssVar: false,
      hashed: true,
    });

    // Dark theme
    registry.set('dark', {
      algorithm: 'dark',
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
        wireframe: false,
      },
      cssVar: false,
      hashed: true,
    });

    // Compact theme
    registry.set('compact', {
      algorithm: 'compact',
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 4,
        wireframe: false,
      },
      cssVar: false,
      hashed: true,
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

    // Build form integration if needed
    const formInfo = this.buildFormInfo(componentConfig, transformedProps);

    // Handle theme integration
    const themeInfo = this.buildThemeInfo(componentConfig, transformedProps);

    // Build final props with Ant Design patterns
    const finalProps = this.buildAntDesignProps(componentConfig, transformedProps);

    const mapping: ComponentMapping = {
      component: componentConfig.component,
      props: finalProps,
      metadata: {
        originalComponent: name,
        adapterType: 'antd',
        antdImport: componentConfig.antdImport,
        category: componentConfig.category,
        enterprise: true,
        ...(formInfo && { formIntegration: formInfo }),
        ...(themeInfo && { theming: themeInfo }),
        variants: componentConfig.variants,
        sizes: componentConfig.sizes,
        responsive: componentConfig.responsive,
        accessibility: componentConfig.accessibility,
        locale: componentConfig.locale,
      },
    };

    return mapping;
  }

  private buildFormInfo(
    config: AntDesignComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> | undefined {
    if (!config.formItem) return undefined;

    return {
      formItem: true,
      formItemProps: {
        ...config.formItemProps,
        ...this.extractFormItemProps(props),
      },
      validation: this.extractValidationProps(props),
    };
  }

  private buildThemeInfo(
    config: AntDesignComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> | undefined {
    if (!config.themeToken) return undefined;

    return {
      token: config.themeToken,
      customizable: true,
      algorithm: 'default',
      cssVar: false,
    };
  }

  private buildAntDesignProps(
    config: AntDesignComponentConfig,
    props: Record<string, unknown>
  ): Record<string, any> {
    const finalProps: Record<string, any> = {
      ...config.defaultProps,
      ...props,
    };

    // Handle deprecated props
    if (config.deprecatedProps) {
      this.handleDeprecatedProps(config.deprecatedProps, finalProps, config.component);
    }

    // Validate variant props
    if (config.variants) {
      this.validateVariants(config.variants, finalProps, config.component);
    }

    // Validate size props
    if (config.sizes && finalProps.size) {
      this.validateSize(config.sizes, finalProps.size, config.component);
    }

    // Validate required props
    if (config.requiredProps) {
      this.validateRequiredProps(config.requiredProps, finalProps, config.component);
    }

    return finalProps;
  }

  private extractFormItemProps(props: Record<string, unknown>): Record<string, any> {
    const formItemProps: Record<string, any> = {};
    
    // Extract Form.Item specific props
    const formItemKeys = [
      'name', 'label', 'labelCol', 'wrapperCol', 'colon', 'dependencies',
      'extra', 'getValueFromEvent', 'getValueProps', 'hasFeedback', 'help',
      'htmlFor', 'initialValue', 'noStyle', 'preserve', 'required', 'rules',
      'shouldUpdate', 'tooltip', 'trigger', 'validateFirst', 'validateStatus',
      'validateTrigger', 'valuePropName', 'hidden', 'messageVariables',
    ];

    formItemKeys.forEach(key => {
      if (props[key] !== undefined) {
        formItemProps[key] = props[key];
      }
    });

    return formItemProps;
  }

  private extractValidationProps(props: Record<string, unknown>): Record<string, any> {
    const validationProps: Record<string, any> = {};
    
    // Extract validation-related props
    const validationKeys = [
      'required', 'pattern', 'min', 'max', 'len', 'enum', 'whitespace',
      'fields', 'defaultField', 'transform', 'message', 'validator',
      'asyncValidator', 'type', 'warningOnly', 'rules',
    ];

    validationKeys.forEach(key => {
      if (props[key] !== undefined) {
        validationProps[key] = props[key];
      }
    });

    return validationProps;
  }

  private handleDeprecatedProps(
    deprecatedProps: Record<string, string>,
    props: Record<string, any>,
    componentName: string
  ): void {
    Object.entries(deprecatedProps).forEach(([oldProp, newProp]) => {
      if (props[oldProp] !== undefined) {
        console.warn(
          `Warning: "${oldProp}" prop in ${componentName} is deprecated. Use "${newProp}" instead.`
        );
        if (newProp && props[newProp] === undefined) {
          props[newProp] = props[oldProp];
        }
        delete props[oldProp];
      }
    });
  }

  private validateVariants(
    variants: Record<string, any>,
    props: Record<string, any>,
    componentName: string
  ): void {
    Object.entries(variants).forEach(([variantKey, allowedValues]) => {
      if (props[variantKey] !== undefined && Array.isArray(allowedValues)) {
        if (!allowedValues.includes(props[variantKey])) {
          throw new AdapterError(
            `Invalid ${variantKey} "${props[variantKey]}" for ${componentName}. Allowed values: ${allowedValues.join(', ')}`,
            'INVALID_VARIANT'
          );
        }
      }
    });
  }

  private validateSize(
    allowedSizes: string[],
    size: any,
    componentName: string
  ): void {
    if (!allowedSizes.includes(size)) {
      throw new AdapterError(
        `Invalid size "${size}" for ${componentName}. Allowed sizes: ${allowedSizes.join(', ')}`,
        'INVALID_SIZE'
      );
    }
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
        adapterType: 'antd',
        fallback: true,
        enterprise: false,
      },
    };
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Ant Design uses CSS-in-JS and theme tokens
    return this.translateToAntDesignStyles(styles);
  }

  private translateToAntDesignStyles(styles: StyleConfig): Record<string, unknown> {
    const result: Record<string, any> = {};

    // Convert to Ant Design theme token format
    if (styles.base || styles.colors || styles.typography || styles.spacing || styles.borders) {
      result.token = {};
      
      // Map colors to Ant Design color tokens
      if (styles.colors) {
        Object.entries(styles.colors).forEach(([key, value]) => {
          if (key === 'backgroundColor' || key === 'background') {
            result.token.colorBgBase = value;
          } else if (key === 'color' || key === 'textColor') {
            result.token.colorText = value;
          } else if (key.includes('primary')) {
            result.token.colorPrimary = value;
          }
        });
      }

      // Map spacing to Ant Design spacing tokens
      if (styles.spacing) {
        Object.entries(styles.spacing).forEach(([key, value]) => {
          if (key.includes('padding')) {
            result.token.padding = value;
          } else if (key.includes('margin')) {
            result.token.margin = value;
          }
        });
      }

      // Map borders to Ant Design border tokens
      if (styles.borders) {
        Object.entries(styles.borders).forEach(([key, value]) => {
          if (key === 'borderRadius') {
            result.token.borderRadius = value;
          } else if (key === 'borderWidth') {
            result.token.lineWidth = value;
          }
        });
      }

      // Map typography to Ant Design font tokens
      if (styles.typography) {
        Object.entries(styles.typography).forEach(([key, value]) => {
          if (key === 'fontSize') {
            result.token.fontSize = value;
          } else if (key === 'fontFamily') {
            result.token.fontFamily = value;
          } else if (key === 'lineHeight') {
            result.token.lineHeight = value;
          }
        });
      }
    }

    // Handle CSS classes
    if (styles.className) {
      result.className = styles.className;
    }

    // Handle inline styles
    if (styles.base) {
      result.style = { ...styles.base };
    }

    return result;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Convert to Ant Design theme configuration format
    return this.convertToAntDesignTheme(tokens);
  }

  private convertToAntDesignTheme(tokens: TokenConfig): Record<string, unknown> {
    const themeConfig: Record<string, any> = {
      token: {},
      components: {},
    };

    if (tokens.tokens?.colors) {
      this.convertColorTokens(tokens.tokens.colors, themeConfig.token);
    }

    if (tokens.tokens?.spacing) {
      this.convertSpacingTokens(tokens.tokens.spacing, themeConfig.token);
    }

    if (tokens.tokens?.typography) {
      this.convertTypographyTokens(tokens.tokens.typography, themeConfig.token);
    }

    if (tokens.tokens?.borders) {
      this.convertBorderTokens(tokens.tokens.borders, themeConfig.token);
    }

    return { themeConfig };
  }

  private convertColorTokens(colors: any, token: Record<string, any>): void {
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        // Handle color palettes
        Object.entries(value).forEach(([shade, color]) => {
          if (key === 'primary') {
            if (shade === '500' || shade === 'main') {
              token.colorPrimary = color;
            }
          } else if (key === 'error' && (shade === '500' || shade === 'main')) {
            token.colorError = color;
          } else if (key === 'warning' && (shade === '500' || shade === 'main')) {
            token.colorWarning = color;
          } else if (key === 'success' && (shade === '500' || shade === 'main')) {
            token.colorSuccess = color;
          } else if (key === 'info' && (shade === '500' || shade === 'main')) {
            token.colorInfo = color;
          }
        });
      } else {
        // Handle simple color mappings
        if (key === 'primary') {
          token.colorPrimary = value;
        } else if (key === 'error') {
          token.colorError = value;
        } else if (key === 'warning') {
          token.colorWarning = value;
        } else if (key === 'success') {
          token.colorSuccess = value;
        } else if (key === 'info') {
          token.colorInfo = value;
        }
      }
    });
  }

  private convertSpacingTokens(spacing: any, token: Record<string, any>): void {
    Object.entries(spacing).forEach(([key, value]) => {
      if (key === 'xs' || key === 'small') {
        token.paddingXS = value;
        token.marginXS = value;
      } else if (key === 'sm' || key === 'medium') {
        token.paddingSM = value;
        token.marginSM = value;
      } else if (key === 'md' || key === 'base') {
        token.padding = value;
        token.margin = value;
      } else if (key === 'lg' || key === 'large') {
        token.paddingLG = value;
        token.marginLG = value;
      } else if (key === 'xl' || key === 'xlarge') {
        token.paddingXL = value;
        token.marginXL = value;
      }
    });
  }

  private convertTypographyTokens(typography: any, token: Record<string, any>): void {
    Object.entries(typography).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          if (key.includes('heading') || key.includes('h1')) {
            if (prop === 'fontSize') token.fontSizeHeading1 = val;
            if (prop === 'lineHeight') token.lineHeightHeading1 = val;
          } else if (key.includes('body') || key.includes('text')) {
            if (prop === 'fontSize') token.fontSize = val;
            if (prop === 'lineHeight') token.lineHeight = val;
          }
        });
      } else {
        if (key === 'fontFamily') {
          token.fontFamily = value;
        } else if (key === 'fontSize') {
          token.fontSize = value;
        } else if (key === 'lineHeight') {
          token.lineHeight = value;
        }
      }
    });
  }

  private convertBorderTokens(borders: any, token: Record<string, any>): void {
    Object.entries(borders).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          if (prop === 'radius') {
            if (key === 'small') token.borderRadiusSM = val;
            else if (key === 'base') token.borderRadius = val;
            else if (key === 'large') token.borderRadiusLG = val;
          } else if (prop === 'width') {
            token.lineWidth = val;
          }
        });
      } else {
        if (key === 'radius') {
          token.borderRadius = value;
        } else if (key === 'width') {
          token.lineWidth = value;
        }
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

    // Validate Ant Design-specific configuration
    if (!this.config.options?.styling?.cssInJs) {
      warnings.push({
        code: 'CSS_IN_JS_RECOMMENDED',
        message: 'CSS-in-JS is recommended for Ant Design theming',
        path: 'options.styling.cssInJs',
        category: 'styling',
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

  // Ant Design-specific methods

  /**
   * Get all available Ant Design components
   */
  getAvailableComponents(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: AntDesignComponentConfig['category']): string[] {
    return Array.from(this.componentRegistry.entries())
      .filter(([, config]) => config.category === category)
      .map(([name]) => name);
  }

  /**
   * Get component import path
   */
  getComponentImport(name: ComponentName): string | undefined {
    const config = this.componentRegistry.get(name);
    return config?.antdImport;
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): string[] {
    return Array.from(this.themeRegistry.keys());
  }

  /**
   * Get theme configuration
   */
  getThemeConfig(themeName: string): AntDesignThemeConfig | undefined {
    return this.themeRegistry.get(themeName);
  }

  /**
   * Check if component supports Form.Item wrapper
   */
  supportsFormItem(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.formItem ?? false;
  }

  /**
   * Check if component supports ConfigProvider
   */
  supportsConfigProvider(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.configProvider ?? false;
  }

  /**
   * Get component variants
   */
  getComponentVariants(name: ComponentName): Record<string, any> | undefined {
    const config = this.componentRegistry.get(name);
    return config?.variants;
  }

  /**
   * Get component sizes
   */
  getComponentSizes(name: ComponentName): string[] | undefined {
    const config = this.componentRegistry.get(name);
    return config?.sizes;
  }

  /**
   * Check if component supports theming
   */
  supportsTheming(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return !!(config?.themeToken);
  }

  /**
   * Check if component supports internationalization
   */
  supportsLocale(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.locale ?? false;
  }

  /**
   * Check if component is responsive
   */
  isResponsive(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.responsive ?? false;
  }

  /**
   * Check if component supports accessibility features
   */
  supportsAccessibility(name: ComponentName): boolean {
    const config = this.componentRegistry.get(name);
    return config?.accessibility ?? false;
  }
}