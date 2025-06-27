/**
 * Bootstrap 5 Adapter Implementation
 * 
 * Comprehensive adapter for Bootstrap 5 components with full support for:
 * - Component mapping (Button, Card, Modal, Alert, Forms, etc.)
 * - Utility class translation (spacing, colors, display, flexbox, position)
 * - Grid system integration (container, row, col)
 * - CSS variable conversion (Bootstrap CSS custom properties)
 * - JavaScript component lifecycle management
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
 * Bootstrap component configuration
 */
interface BootstrapComponentConfig {
  baseComponent: string;
  bsComponent?: string;
  variants?: Record<string, string[]>;
  sizes?: string[];
  utilities?: Record<string, string>;
  dataAttributes?: Record<string, string>;
  jsComponent?: boolean;
  defaultClasses?: string[];
}

/**
 * Bootstrap utility class mapping
 */
interface BootstrapUtilityMapping {
  spacing: Record<string, string>;
  colors: Record<string, string>;
  display: Record<string, string>;
  flexbox: Record<string, string>;
  position: Record<string, string>;
  grid: Record<string, string>;
  typography: Record<string, string>;
  borders: Record<string, string>;
  sizing: Record<string, string>;
}

/**
 * Bootstrap CSS variable mapping
 */
interface BootstrapCSSVariables {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  borders: Record<string, string>;
  shadows: Record<string, string>;
  breakpoints: Record<string, string>;
}

export class BootstrapAdapter implements AdapterInstance {
  public readonly id = 'bootstrap-adapter';
  public config: AdapterConfig;
  public initialized = false;

  private pluginManager: AdapterPluginManager;
  private componentRegistry: Map<string, BootstrapComponentConfig>;
  private utilityMappings: BootstrapUtilityMapping;
  private cssVariables: BootstrapCSSVariables;

  constructor(config?: Partial<AdapterConfig>) {
    this.config = this.createDefaultConfig(config);
    this.pluginManager = new AdapterPluginManager(this.id);
    this.componentRegistry = this.initializeComponentRegistry();
    this.utilityMappings = this.initializeUtilityMappings();
    this.cssVariables = this.initializeCSSVariables();
  }

  private createDefaultConfig(partial?: Partial<AdapterConfig>): AdapterConfig {
    return {
      name: 'bootstrap-adapter',
      version: '1.0.0',
      displayName: 'Bootstrap 5 Adapter',
      description: 'Comprehensive adapter for Bootstrap 5 components and utilities',
      author: {
        name: 'Willow Design System',
        email: 'support@willow.design',
      },
      capabilities: [
        'component-mapping',
        'style-translation',
        'token-conversion',
        'theme-switching',
        'documentation-generation',
      ] as AdapterCapability[],
      framework: {
        name: 'Bootstrap',
        version: '5.3.0',
        minVersion: '5.0.0',
      },
      options: {
        theme: {
          mode: 'light',
          customThemes: {
            light: {
              name: 'Bootstrap Light',
              type: 'light',
              tokens: {},
            },
            dark: {
              name: 'Bootstrap Dark',
              type: 'dark',
              tokens: {},
            },
          },
        },
        ...partial?.options,
      },
      metadata: {
        author: 'Bootstrap Adapter',
        description: 'Adapter for Bootstrap 5 with comprehensive component and utility support',
        tags: ['bootstrap', 'bootstrap5', 'css-framework', 'utility-classes'],
        ...partial?.metadata,
      } as AdapterMetadata,
      ...partial,
    };
  }

  private initializeComponentRegistry(): Map<string, BootstrapComponentConfig> {
    const registry = new Map<string, BootstrapComponentConfig>();

    // Button component
    registry.set('Button', {
      baseComponent: 'button',
      bsComponent: 'btn',
      variants: {
        variant: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'link'],
        outline: ['outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 'outline-warning', 'outline-info', 'outline-light', 'outline-dark'],
      },
      sizes: ['sm', 'lg'],
      defaultClasses: ['btn'],
      dataAttributes: {
        toggle: 'data-bs-toggle',
        target: 'data-bs-target',
        dismiss: 'data-bs-dismiss',
      },
    });

    // Card component
    registry.set('Card', {
      baseComponent: 'div',
      bsComponent: 'card',
      defaultClasses: ['card'],
      utilities: {
        header: 'card-header',
        body: 'card-body',
        footer: 'card-footer',
        title: 'card-title',
        subtitle: 'card-subtitle',
        text: 'card-text',
        link: 'card-link',
        imgTop: 'card-img-top',
        imgBottom: 'card-img-bottom',
      },
    });

    // Modal component
    registry.set('Modal', {
      baseComponent: 'div',
      bsComponent: 'modal',
      jsComponent: true,
      defaultClasses: ['modal', 'fade'],
      utilities: {
        dialog: 'modal-dialog',
        content: 'modal-content',
        header: 'modal-header',
        title: 'modal-title',
        body: 'modal-body',
        footer: 'modal-footer',
      },
      dataAttributes: {
        backdrop: 'data-bs-backdrop',
        keyboard: 'data-bs-keyboard',
        focus: 'data-bs-focus',
      },
      sizes: ['sm', 'lg', 'xl'],
    });

    // Alert component
    registry.set('Alert', {
      baseComponent: 'div',
      bsComponent: 'alert',
      variants: {
        variant: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
      },
      defaultClasses: ['alert'],
      utilities: {
        dismissible: 'alert-dismissible',
        fade: 'fade',
        show: 'show',
      },
      dataAttributes: {
        dismiss: 'data-bs-dismiss',
      },
    });

    // Form controls
    registry.set('Input', {
      baseComponent: 'input',
      bsComponent: 'form-control',
      defaultClasses: ['form-control'],
      sizes: ['sm', 'lg'],
      utilities: {
        plaintext: 'form-control-plaintext',
        color: 'form-control-color',
      },
    });

    registry.set('Select', {
      baseComponent: 'select',
      bsComponent: 'form-select',
      defaultClasses: ['form-select'],
      sizes: ['sm', 'lg'],
    });

    registry.set('Checkbox', {
      baseComponent: 'input',
      bsComponent: 'form-check-input',
      defaultClasses: ['form-check-input'],
      utilities: {
        wrapper: 'form-check',
        label: 'form-check-label',
        inline: 'form-check-inline',
      },
    });

    registry.set('Switch', {
      baseComponent: 'input',
      bsComponent: 'form-switch',
      defaultClasses: ['form-check-input'],
      utilities: {
        wrapper: 'form-check form-switch',
        label: 'form-check-label',
      },
    });

    // Navigation components
    registry.set('Nav', {
      baseComponent: 'nav',
      bsComponent: 'nav',
      defaultClasses: ['nav'],
      variants: {
        style: ['nav-tabs', 'nav-pills', 'nav-fill', 'nav-justified'],
      },
      utilities: {
        item: 'nav-item',
        link: 'nav-link',
        active: 'active',
        disabled: 'disabled',
      },
    });

    registry.set('Navbar', {
      baseComponent: 'nav',
      bsComponent: 'navbar',
      defaultClasses: ['navbar'],
      variants: {
        expand: ['navbar-expand-sm', 'navbar-expand-md', 'navbar-expand-lg', 'navbar-expand-xl', 'navbar-expand-xxl'],
        color: ['navbar-light', 'navbar-dark'],
      },
      utilities: {
        brand: 'navbar-brand',
        nav: 'navbar-nav',
        text: 'navbar-text',
        toggler: 'navbar-toggler',
        collapse: 'navbar-collapse',
      },
    });

    // Dropdown component
    registry.set('Dropdown', {
      baseComponent: 'div',
      bsComponent: 'dropdown',
      jsComponent: true,
      defaultClasses: ['dropdown'],
      utilities: {
        toggle: 'dropdown-toggle',
        menu: 'dropdown-menu',
        item: 'dropdown-item',
        divider: 'dropdown-divider',
        header: 'dropdown-header',
      },
      dataAttributes: {
        toggle: 'data-bs-toggle',
        autoClose: 'data-bs-auto-close',
        display: 'data-bs-display',
      },
    });

    // Tooltip component
    registry.set('Tooltip', {
      baseComponent: 'span',
      bsComponent: 'tooltip',
      jsComponent: true,
      dataAttributes: {
        toggle: 'data-bs-toggle',
        placement: 'data-bs-placement',
        title: 'data-bs-title',
        customClass: 'data-bs-custom-class',
        delay: 'data-bs-delay',
      },
    });

    // Popover component
    registry.set('Popover', {
      baseComponent: 'span',
      bsComponent: 'popover',
      jsComponent: true,
      dataAttributes: {
        toggle: 'data-bs-toggle',
        placement: 'data-bs-placement',
        title: 'data-bs-title',
        content: 'data-bs-content',
        trigger: 'data-bs-trigger',
      },
    });

    // Collapse component
    registry.set('Collapse', {
      baseComponent: 'div',
      bsComponent: 'collapse',
      jsComponent: true,
      defaultClasses: ['collapse'],
      utilities: {
        show: 'show',
        collapsing: 'collapsing',
      },
      dataAttributes: {
        toggle: 'data-bs-toggle',
        target: 'data-bs-target',
        parent: 'data-bs-parent',
      },
    });

    return registry;
  }

  private initializeUtilityMappings(): BootstrapUtilityMapping {
    return {
      spacing: {
        // Margin utilities
        'm-0': 'margin: 0',
        'm-1': 'margin: 0.25rem',
        'm-2': 'margin: 0.5rem',
        'm-3': 'margin: 1rem',
        'm-4': 'margin: 1.5rem',
        'm-5': 'margin: 3rem',
        'mt-0': 'margin-top: 0',
        'mt-1': 'margin-top: 0.25rem',
        'mt-2': 'margin-top: 0.5rem',
        'mt-3': 'margin-top: 1rem',
        'mt-4': 'margin-top: 1.5rem',
        'mt-5': 'margin-top: 3rem',
        'mb-0': 'margin-bottom: 0',
        'mb-1': 'margin-bottom: 0.25rem',
        'mb-2': 'margin-bottom: 0.5rem',
        'mb-3': 'margin-bottom: 1rem',
        'mb-4': 'margin-bottom: 1.5rem',
        'mb-5': 'margin-bottom: 3rem',
        'ms-0': 'margin-left: 0',
        'ms-1': 'margin-left: 0.25rem',
        'ms-2': 'margin-left: 0.5rem',
        'ms-3': 'margin-left: 1rem',
        'ms-4': 'margin-left: 1.5rem',
        'ms-5': 'margin-left: 3rem',
        'me-0': 'margin-right: 0',
        'me-1': 'margin-right: 0.25rem',
        'me-2': 'margin-right: 0.5rem',
        'me-3': 'margin-right: 1rem',
        'me-4': 'margin-right: 1.5rem',
        'me-5': 'margin-right: 3rem',
        'mx-0': 'margin-left: 0; margin-right: 0',
        'mx-1': 'margin-left: 0.25rem; margin-right: 0.25rem',
        'mx-2': 'margin-left: 0.5rem; margin-right: 0.5rem',
        'mx-3': 'margin-left: 1rem; margin-right: 1rem',
        'mx-4': 'margin-left: 1.5rem; margin-right: 1.5rem',
        'mx-5': 'margin-left: 3rem; margin-right: 3rem',
        'my-0': 'margin-top: 0; margin-bottom: 0',
        'my-1': 'margin-top: 0.25rem; margin-bottom: 0.25rem',
        'my-2': 'margin-top: 0.5rem; margin-bottom: 0.5rem',
        'my-3': 'margin-top: 1rem; margin-bottom: 1rem',
        'my-4': 'margin-top: 1.5rem; margin-bottom: 1.5rem',
        'my-5': 'margin-top: 3rem; margin-bottom: 3rem',
        // Padding utilities
        'p-0': 'padding: 0',
        'p-1': 'padding: 0.25rem',
        'p-2': 'padding: 0.5rem',
        'p-3': 'padding: 1rem',
        'p-4': 'padding: 1.5rem',
        'p-5': 'padding: 3rem',
        'pt-0': 'padding-top: 0',
        'pt-1': 'padding-top: 0.25rem',
        'pt-2': 'padding-top: 0.5rem',
        'pt-3': 'padding-top: 1rem',
        'pt-4': 'padding-top: 1.5rem',
        'pt-5': 'padding-top: 3rem',
        'pb-0': 'padding-bottom: 0',
        'pb-1': 'padding-bottom: 0.25rem',
        'pb-2': 'padding-bottom: 0.5rem',
        'pb-3': 'padding-bottom: 1rem',
        'pb-4': 'padding-bottom: 1.5rem',
        'pb-5': 'padding-bottom: 3rem',
        'ps-0': 'padding-left: 0',
        'ps-1': 'padding-left: 0.25rem',
        'ps-2': 'padding-left: 0.5rem',
        'ps-3': 'padding-left: 1rem',
        'ps-4': 'padding-left: 1.5rem',
        'ps-5': 'padding-left: 3rem',
        'pe-0': 'padding-right: 0',
        'pe-1': 'padding-right: 0.25rem',
        'pe-2': 'padding-right: 0.5rem',
        'pe-3': 'padding-right: 1rem',
        'pe-4': 'padding-right: 1.5rem',
        'pe-5': 'padding-right: 3rem',
        'px-0': 'padding-left: 0; padding-right: 0',
        'px-1': 'padding-left: 0.25rem; padding-right: 0.25rem',
        'px-2': 'padding-left: 0.5rem; padding-right: 0.5rem',
        'px-3': 'padding-left: 1rem; padding-right: 1rem',
        'px-4': 'padding-left: 1.5rem; padding-right: 1.5rem',
        'px-5': 'padding-left: 3rem; padding-right: 3rem',
        'py-0': 'padding-top: 0; padding-bottom: 0',
        'py-1': 'padding-top: 0.25rem; padding-bottom: 0.25rem',
        'py-2': 'padding-top: 0.5rem; padding-bottom: 0.5rem',
        'py-3': 'padding-top: 1rem; padding-bottom: 1rem',
        'py-4': 'padding-top: 1.5rem; padding-bottom: 1.5rem',
        'py-5': 'padding-top: 3rem; padding-bottom: 3rem',
      },
      colors: {
        // Text colors
        'text-primary': 'color: var(--bs-primary)',
        'text-secondary': 'color: var(--bs-secondary)',
        'text-success': 'color: var(--bs-success)',
        'text-danger': 'color: var(--bs-danger)',
        'text-warning': 'color: var(--bs-warning)',
        'text-info': 'color: var(--bs-info)',
        'text-light': 'color: var(--bs-light)',
        'text-dark': 'color: var(--bs-dark)',
        'text-body': 'color: var(--bs-body-color)',
        'text-muted': 'color: var(--bs-secondary-color)',
        'text-white': 'color: #fff',
        'text-black-50': 'color: rgba(0,0,0,.5)',
        'text-white-50': 'color: rgba(255,255,255,.5)',
        // Background colors
        'bg-primary': 'background-color: var(--bs-primary)',
        'bg-secondary': 'background-color: var(--bs-secondary)',
        'bg-success': 'background-color: var(--bs-success)',
        'bg-danger': 'background-color: var(--bs-danger)',
        'bg-warning': 'background-color: var(--bs-warning)',
        'bg-info': 'background-color: var(--bs-info)',
        'bg-light': 'background-color: var(--bs-light)',
        'bg-dark': 'background-color: var(--bs-dark)',
        'bg-body': 'background-color: var(--bs-body-bg)',
        'bg-white': 'background-color: #fff',
        'bg-transparent': 'background-color: transparent',
      },
      display: {
        'd-none': 'display: none',
        'd-inline': 'display: inline',
        'd-inline-block': 'display: inline-block',
        'd-block': 'display: block',
        'd-table': 'display: table',
        'd-table-row': 'display: table-row',
        'd-table-cell': 'display: table-cell',
        'd-flex': 'display: flex',
        'd-inline-flex': 'display: inline-flex',
        'd-grid': 'display: grid',
      },
      flexbox: {
        // Flex direction
        'flex-row': 'flex-direction: row',
        'flex-row-reverse': 'flex-direction: row-reverse',
        'flex-column': 'flex-direction: column',
        'flex-column-reverse': 'flex-direction: column-reverse',
        // Flex wrap
        'flex-wrap': 'flex-wrap: wrap',
        'flex-nowrap': 'flex-wrap: nowrap',
        'flex-wrap-reverse': 'flex-wrap: wrap-reverse',
        // Justify content
        'justify-content-start': 'justify-content: flex-start',
        'justify-content-end': 'justify-content: flex-end',
        'justify-content-center': 'justify-content: center',
        'justify-content-between': 'justify-content: space-between',
        'justify-content-around': 'justify-content: space-around',
        'justify-content-evenly': 'justify-content: space-evenly',
        // Align items
        'align-items-start': 'align-items: flex-start',
        'align-items-end': 'align-items: flex-end',
        'align-items-center': 'align-items: center',
        'align-items-baseline': 'align-items: baseline',
        'align-items-stretch': 'align-items: stretch',
        // Align self
        'align-self-auto': 'align-self: auto',
        'align-self-start': 'align-self: flex-start',
        'align-self-end': 'align-self: flex-end',
        'align-self-center': 'align-self: center',
        'align-self-baseline': 'align-self: baseline',
        'align-self-stretch': 'align-self: stretch',
        // Flex
        'flex-fill': 'flex: 1 1 auto',
        'flex-grow-0': 'flex-grow: 0',
        'flex-grow-1': 'flex-grow: 1',
        'flex-shrink-0': 'flex-shrink: 0',
        'flex-shrink-1': 'flex-shrink: 1',
      },
      position: {
        'position-static': 'position: static',
        'position-relative': 'position: relative',
        'position-absolute': 'position: absolute',
        'position-fixed': 'position: fixed',
        'position-sticky': 'position: sticky',
        'top-0': 'top: 0',
        'top-50': 'top: 50%',
        'top-100': 'top: 100%',
        'bottom-0': 'bottom: 0',
        'bottom-50': 'bottom: 50%',
        'bottom-100': 'bottom: 100%',
        'start-0': 'left: 0',
        'start-50': 'left: 50%',
        'start-100': 'left: 100%',
        'end-0': 'right: 0',
        'end-50': 'right: 50%',
        'end-100': 'right: 100%',
        'translate-middle': 'transform: translate(-50%, -50%)',
      },
      grid: {
        'container': 'width: 100%; padding-right: var(--bs-gutter-x, 0.75rem); padding-left: var(--bs-gutter-x, 0.75rem); margin-right: auto; margin-left: auto',
        'container-fluid': 'width: 100%; padding-right: var(--bs-gutter-x, 0.75rem); padding-left: var(--bs-gutter-x, 0.75rem); margin-right: auto; margin-left: auto',
        'row': 'display: flex; flex-wrap: wrap; margin-top: calc(-1 * var(--bs-gutter-y)); margin-right: calc(-0.5 * var(--bs-gutter-x)); margin-left: calc(-0.5 * var(--bs-gutter-x))',
        'col': 'flex: 1 0 0%',
        'col-1': 'flex: 0 0 auto; width: 8.33333333%',
        'col-2': 'flex: 0 0 auto; width: 16.66666667%',
        'col-3': 'flex: 0 0 auto; width: 25%',
        'col-4': 'flex: 0 0 auto; width: 33.33333333%',
        'col-5': 'flex: 0 0 auto; width: 41.66666667%',
        'col-6': 'flex: 0 0 auto; width: 50%',
        'col-7': 'flex: 0 0 auto; width: 58.33333333%',
        'col-8': 'flex: 0 0 auto; width: 66.66666667%',
        'col-9': 'flex: 0 0 auto; width: 75%',
        'col-10': 'flex: 0 0 auto; width: 83.33333333%',
        'col-11': 'flex: 0 0 auto; width: 91.66666667%',
        'col-12': 'flex: 0 0 auto; width: 100%',
        'col-auto': 'flex: 0 0 auto; width: auto',
        'g-0': '--bs-gutter-x: 0; --bs-gutter-y: 0',
        'g-1': '--bs-gutter-x: 0.25rem; --bs-gutter-y: 0.25rem',
        'g-2': '--bs-gutter-x: 0.5rem; --bs-gutter-y: 0.5rem',
        'g-3': '--bs-gutter-x: 1rem; --bs-gutter-y: 1rem',
        'g-4': '--bs-gutter-x: 1.5rem; --bs-gutter-y: 1.5rem',
        'g-5': '--bs-gutter-x: 3rem; --bs-gutter-y: 3rem',
      },
      typography: {
        'fs-1': 'font-size: calc(1.375rem + 1.5vw)',
        'fs-2': 'font-size: calc(1.325rem + .9vw)',
        'fs-3': 'font-size: calc(1.3rem + .6vw)',
        'fs-4': 'font-size: calc(1.275rem + .3vw)',
        'fs-5': 'font-size: 1.25rem',
        'fs-6': 'font-size: 1rem',
        'fw-light': 'font-weight: 300',
        'fw-lighter': 'font-weight: lighter',
        'fw-normal': 'font-weight: 400',
        'fw-bold': 'font-weight: 700',
        'fw-bolder': 'font-weight: bolder',
        'fst-italic': 'font-style: italic',
        'fst-normal': 'font-style: normal',
        'text-start': 'text-align: left',
        'text-end': 'text-align: right',
        'text-center': 'text-align: center',
        'text-decoration-none': 'text-decoration: none',
        'text-decoration-underline': 'text-decoration: underline',
        'text-decoration-line-through': 'text-decoration: line-through',
        'text-lowercase': 'text-transform: lowercase',
        'text-uppercase': 'text-transform: uppercase',
        'text-capitalize': 'text-transform: capitalize',
      },
      borders: {
        'border': 'border: 1px solid var(--bs-border-color)',
        'border-0': 'border: 0',
        'border-top': 'border-top: 1px solid var(--bs-border-color)',
        'border-top-0': 'border-top: 0',
        'border-end': 'border-right: 1px solid var(--bs-border-color)',
        'border-end-0': 'border-right: 0',
        'border-bottom': 'border-bottom: 1px solid var(--bs-border-color)',
        'border-bottom-0': 'border-bottom: 0',
        'border-start': 'border-left: 1px solid var(--bs-border-color)',
        'border-start-0': 'border-left: 0',
        'border-primary': 'border-color: var(--bs-primary)',
        'border-secondary': 'border-color: var(--bs-secondary)',
        'border-success': 'border-color: var(--bs-success)',
        'border-danger': 'border-color: var(--bs-danger)',
        'border-warning': 'border-color: var(--bs-warning)',
        'border-info': 'border-color: var(--bs-info)',
        'border-light': 'border-color: var(--bs-light)',
        'border-dark': 'border-color: var(--bs-dark)',
        'border-white': 'border-color: white',
        'rounded': 'border-radius: var(--bs-border-radius)',
        'rounded-0': 'border-radius: 0',
        'rounded-1': 'border-radius: var(--bs-border-radius-sm)',
        'rounded-2': 'border-radius: var(--bs-border-radius)',
        'rounded-3': 'border-radius: var(--bs-border-radius-lg)',
        'rounded-circle': 'border-radius: 50%',
        'rounded-pill': 'border-radius: var(--bs-border-radius-pill)',
      },
      sizing: {
        'w-25': 'width: 25%',
        'w-50': 'width: 50%',
        'w-75': 'width: 75%',
        'w-100': 'width: 100%',
        'w-auto': 'width: auto',
        'h-25': 'height: 25%',
        'h-50': 'height: 50%',
        'h-75': 'height: 75%',
        'h-100': 'height: 100%',
        'h-auto': 'height: auto',
        'mw-100': 'max-width: 100%',
        'mh-100': 'max-height: 100%',
        'min-vw-100': 'min-width: 100vw',
        'min-vh-100': 'min-height: 100vh',
        'vw-100': 'width: 100vw',
        'vh-100': 'height: 100vh',
      },
    };
  }

  private initializeCSSVariables(): BootstrapCSSVariables {
    return {
      colors: {
        '--bs-primary': 'var(--willow-primary)',
        '--bs-secondary': 'var(--willow-secondary)',
        '--bs-success': 'var(--willow-success)',
        '--bs-danger': 'var(--willow-danger)',
        '--bs-warning': 'var(--willow-warning)',
        '--bs-info': 'var(--willow-info)',
        '--bs-light': 'var(--willow-light)',
        '--bs-dark': 'var(--willow-dark)',
        '--bs-body-color': 'var(--willow-text-primary)',
        '--bs-body-bg': 'var(--willow-bg-primary)',
        '--bs-secondary-color': 'var(--willow-text-secondary)',
        '--bs-secondary-bg': 'var(--willow-bg-secondary)',
        '--bs-tertiary-color': 'var(--willow-text-tertiary)',
        '--bs-tertiary-bg': 'var(--willow-bg-tertiary)',
        '--bs-emphasis-color': 'var(--willow-text-emphasis)',
        '--bs-border-color': 'var(--willow-border-primary)',
        '--bs-border-color-translucent': 'var(--willow-border-translucent)',
        '--bs-primary-rgb': 'var(--willow-primary-rgb)',
        '--bs-secondary-rgb': 'var(--willow-secondary-rgb)',
        '--bs-success-rgb': 'var(--willow-success-rgb)',
        '--bs-danger-rgb': 'var(--willow-danger-rgb)',
        '--bs-warning-rgb': 'var(--willow-warning-rgb)',
        '--bs-info-rgb': 'var(--willow-info-rgb)',
        '--bs-light-rgb': 'var(--willow-light-rgb)',
        '--bs-dark-rgb': 'var(--willow-dark-rgb)',
      },
      typography: {
        '--bs-font-family-base': 'var(--willow-font-family-base)',
        '--bs-font-family-code': 'var(--willow-font-family-mono)',
        '--bs-font-size-base': 'var(--willow-font-size-base)',
        '--bs-font-size-sm': 'var(--willow-font-size-sm)',
        '--bs-font-size-lg': 'var(--willow-font-size-lg)',
        '--bs-font-weight-lighter': 'var(--willow-font-weight-light)',
        '--bs-font-weight-light': 'var(--willow-font-weight-light)',
        '--bs-font-weight-normal': 'var(--willow-font-weight-normal)',
        '--bs-font-weight-bold': 'var(--willow-font-weight-bold)',
        '--bs-font-weight-bolder': 'var(--willow-font-weight-bold)',
        '--bs-line-height-base': 'var(--willow-line-height-base)',
        '--bs-line-height-sm': 'var(--willow-line-height-sm)',
        '--bs-line-height-lg': 'var(--willow-line-height-lg)',
      },
      spacing: {
        '--bs-gutter-x': 'var(--willow-spacing-4)',
        '--bs-gutter-y': 'var(--willow-spacing-0)',
        '--bs-spacing-1': 'var(--willow-spacing-1)',
        '--bs-spacing-2': 'var(--willow-spacing-2)',
        '--bs-spacing-3': 'var(--willow-spacing-3)',
        '--bs-spacing-4': 'var(--willow-spacing-4)',
        '--bs-spacing-5': 'var(--willow-spacing-5)',
      },
      borders: {
        '--bs-border-width': 'var(--willow-border-width)',
        '--bs-border-style': 'var(--willow-border-style)',
        '--bs-border-radius': 'var(--willow-radius-md)',
        '--bs-border-radius-sm': 'var(--willow-radius-sm)',
        '--bs-border-radius-lg': 'var(--willow-radius-lg)',
        '--bs-border-radius-xl': 'var(--willow-radius-xl)',
        '--bs-border-radius-pill': 'var(--willow-radius-pill)',
      },
      shadows: {
        '--bs-box-shadow': 'var(--willow-shadow-md)',
        '--bs-box-shadow-sm': 'var(--willow-shadow-sm)',
        '--bs-box-shadow-lg': 'var(--willow-shadow-lg)',
        '--bs-box-shadow-inset': 'var(--willow-shadow-inset)',
      },
      breakpoints: {
        '--bs-breakpoint-xs': '0',
        '--bs-breakpoint-sm': '576px',
        '--bs-breakpoint-md': '768px',
        '--bs-breakpoint-lg': '992px',
        '--bs-breakpoint-xl': '1200px',
        '--bs-breakpoint-xxl': '1400px',
      },
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize plugin manager
      await this.pluginManager.initialize();

      // Validate configuration
      const validation = this.validateConfig();
      if (!validation.valid) {
        throw new AdapterError(
          'Invalid adapter configuration',
          'INVALID_CONFIG',
          validation.errors
        );
      }

      // Set initialized flag
      this.initialized = true;
    } catch (error) {
      throw new AdapterError(
        'Failed to initialize Bootstrap adapter',
        'INIT_ERROR',
        error
      );
    }
  }

  mapComponent(name: ComponentName, props: Record<string, unknown>): ComponentMapping {
    const config = this.componentRegistry.get(name);
    if (!config) {
      throw new AdapterError(
        `Component "${name}" not found in Bootstrap adapter`,
        'COMPONENT_NOT_FOUND'
      );
    }

    const mapping: ComponentMapping = {
      source: name,
      target: config.bsComponent || config.baseComponent,
      props: this.mapComponentProps(config, props),
      children: props.children as any,
      metadata: {
        framework: 'Bootstrap',
        version: '5.3.0',
        jsComponent: config.jsComponent || false,
      },
    };

    return mapping;
  }

  private mapComponentProps(
    config: BootstrapComponentConfig,
    props: Record<string, unknown>
  ): Record<string, unknown> {
    const mappedProps: Record<string, unknown> = { ...props };
    const classes: string[] = [...(config.defaultClasses || [])];

    // Map variant prop to Bootstrap classes
    if (props.variant && config.variants?.variant) {
      const variant = props.variant as string;
      if (config.variants.variant.includes(variant)) {
        classes.push(`${config.bsComponent}-${variant}`);
      }
      delete mappedProps.variant;
    }

    // Map outline variant
    if (props.outline && config.variants?.outline) {
      const outline = props.outline as string;
      if (config.variants.outline.includes(`outline-${outline}`)) {
        classes.push(`${config.bsComponent}-outline-${outline}`);
      }
      delete mappedProps.outline;
    }

    // Map size prop
    if (props.size && config.sizes) {
      const size = props.size as string;
      if (config.sizes.includes(size)) {
        classes.push(`${config.bsComponent}-${size}`);
      }
      delete mappedProps.size;
    }

    // Map dismissible for alerts
    if (props.dismissible && config.utilities?.dismissible) {
      classes.push(config.utilities.dismissible);
      if (config.utilities.fade) classes.push(config.utilities.fade);
      if (config.utilities.show) classes.push(config.utilities.show);
      delete mappedProps.dismissible;
    }

    // Map data attributes
    if (config.dataAttributes) {
      Object.entries(config.dataAttributes).forEach(([prop, dataAttr]) => {
        if (props[prop] !== undefined) {
          mappedProps[dataAttr] = props[prop];
          delete mappedProps[prop];
        }
      });
    }

    // Handle JavaScript component initialization
    if (config.jsComponent) {
      mappedProps['data-bs-component'] = config.bsComponent;
    }

    // Add utility classes
    if (props.className) {
      classes.push(props.className as string);
    }

    // Set final className
    if (classes.length > 0) {
      mappedProps.className = classes.join(' ');
    }

    return mappedProps;
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    const translated: Record<string, unknown> = {};

    // Translate layout styles
    if (styles.layout) {
      Object.assign(translated, this.translateLayoutStyles(styles.layout));
    }

    // Translate typography styles
    if (styles.typography) {
      Object.assign(translated, this.translateTypographyStyles(styles.typography));
    }

    // Translate color styles
    if (styles.colors) {
      Object.assign(translated, this.translateColorStyles(styles.colors));
    }

    // Translate spacing styles
    if (styles.spacing) {
      Object.assign(translated, this.translateSpacingStyles(styles.spacing));
    }

    // Translate border styles
    if (styles.borders) {
      Object.assign(translated, this.translateBorderStyles(styles.borders));
    }

    // Translate effects
    if (styles.effects) {
      Object.assign(translated, this.translateEffectStyles(styles.effects));
    }

    // Handle responsive styles
    if (styles.responsive) {
      translated.responsive = this.translateResponsiveStyles(styles.responsive);
    }

    return translated;
  }

  private translateLayoutStyles(layout: any): Record<string, unknown> {
    const classes: string[] = [];
    const styles: Record<string, any> = {};

    // Display utilities
    if (layout.display) {
      const displayClass = `d-${layout.display}`;
      if (this.utilityMappings.display[displayClass]) {
        classes.push(displayClass);
      } else {
        styles.display = layout.display;
      }
    }

    // Position utilities
    if (layout.position) {
      const positionClass = `position-${layout.position}`;
      if (this.utilityMappings.position[positionClass]) {
        classes.push(positionClass);
      } else {
        styles.position = layout.position;
      }
    }

    // Flexbox utilities
    if (layout.flexDirection) {
      const flexClass = `flex-${layout.flexDirection}`;
      if (this.utilityMappings.flexbox[flexClass]) {
        classes.push(flexClass);
      }
    }

    if (layout.justifyContent) {
      const justifyClass = `justify-content-${layout.justifyContent}`;
      if (this.utilityMappings.flexbox[justifyClass]) {
        classes.push(justifyClass);
      }
    }

    if (layout.alignItems) {
      const alignClass = `align-items-${layout.alignItems}`;
      if (this.utilityMappings.flexbox[alignClass]) {
        classes.push(alignClass);
      }
    }

    // Width/Height utilities
    if (layout.width) {
      const widthClass = `w-${layout.width}`;
      if (this.utilityMappings.sizing[widthClass]) {
        classes.push(widthClass);
      } else {
        styles.width = layout.width;
      }
    }

    if (layout.height) {
      const heightClass = `h-${layout.height}`;
      if (this.utilityMappings.sizing[heightClass]) {
        classes.push(heightClass);
      } else {
        styles.height = layout.height;
      }
    }

    return {
      className: classes.join(' '),
      style: styles,
    };
  }

  private translateTypographyStyles(typography: any): Record<string, unknown> {
    const classes: string[] = [];
    const styles: Record<string, any> = {};

    // Font size
    if (typography.fontSize) {
      const sizeClass = `fs-${typography.fontSize}`;
      if (this.utilityMappings.typography[sizeClass]) {
        classes.push(sizeClass);
      } else {
        styles.fontSize = typography.fontSize;
      }
    }

    // Font weight
    if (typography.fontWeight) {
      const weightClass = `fw-${typography.fontWeight}`;
      if (this.utilityMappings.typography[weightClass]) {
        classes.push(weightClass);
      } else {
        styles.fontWeight = typography.fontWeight;
      }
    }

    // Text alignment
    if (typography.textAlign) {
      const alignClass = `text-${typography.textAlign}`;
      if (this.utilityMappings.typography[alignClass]) {
        classes.push(alignClass);
      } else {
        styles.textAlign = typography.textAlign;
      }
    }

    // Text decoration
    if (typography.textDecoration) {
      const decorationClass = `text-decoration-${typography.textDecoration}`;
      if (this.utilityMappings.typography[decorationClass]) {
        classes.push(decorationClass);
      } else {
        styles.textDecoration = typography.textDecoration;
      }
    }

    // Text transform
    if (typography.textTransform) {
      const transformClass = `text-${typography.textTransform}`;
      if (this.utilityMappings.typography[transformClass]) {
        classes.push(transformClass);
      } else {
        styles.textTransform = typography.textTransform;
      }
    }

    return {
      className: classes.join(' '),
      style: styles,
    };
  }

  private translateColorStyles(colors: any): Record<string, unknown> {
    const classes: string[] = [];
    const styles: Record<string, any> = {};

    // Text color
    if (colors.color) {
      const colorClass = `text-${colors.color}`;
      if (this.utilityMappings.colors[colorClass]) {
        classes.push(colorClass);
      } else {
        styles.color = colors.color;
      }
    }

    // Background color
    if (colors.backgroundColor) {
      const bgClass = `bg-${colors.backgroundColor}`;
      if (this.utilityMappings.colors[bgClass]) {
        classes.push(bgClass);
      } else {
        styles.backgroundColor = colors.backgroundColor;
      }
    }

    // Border color
    if (colors.borderColor) {
      const borderClass = `border-${colors.borderColor}`;
      if (this.utilityMappings.borders[borderClass]) {
        classes.push(borderClass);
      } else {
        styles.borderColor = colors.borderColor;
      }
    }

    return {
      className: classes.join(' '),
      style: styles,
    };
  }

  private translateSpacingStyles(spacing: any): Record<string, unknown> {
    const classes: string[] = [];
    const styles: Record<string, any> = {};

    // Margin utilities
    ['margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'].forEach(prop => {
      if (spacing[prop] !== undefined) {
        const value = spacing[prop];
        const prefix = this.getSpacingPrefix(prop);
        const spacingClass = `${prefix}-${value}`;
        
        if (this.utilityMappings.spacing[spacingClass]) {
          classes.push(spacingClass);
        } else {
          styles[prop] = spacing[prop];
        }
      }
    });

    // Padding utilities
    ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'].forEach(prop => {
      if (spacing[prop] !== undefined) {
        const value = spacing[prop];
        const prefix = this.getSpacingPrefix(prop);
        const spacingClass = `${prefix}-${value}`;
        
        if (this.utilityMappings.spacing[spacingClass]) {
          classes.push(spacingClass);
        } else {
          styles[prop] = spacing[prop];
        }
      }
    });

    return {
      className: classes.join(' '),
      style: styles,
    };
  }

  private getSpacingPrefix(prop: string): string {
    const prefixMap: Record<string, string> = {
      margin: 'm',
      marginTop: 'mt',
      marginBottom: 'mb',
      marginLeft: 'ms',
      marginRight: 'me',
      padding: 'p',
      paddingTop: 'pt',
      paddingBottom: 'pb',
      paddingLeft: 'ps',
      paddingRight: 'pe',
    };
    return prefixMap[prop] || '';
  }

  private translateBorderStyles(borders: any): Record<string, unknown> {
    const classes: string[] = [];
    const styles: Record<string, any> = {};

    // Border
    if (borders.border) {
      if (borders.border === '1px solid') {
        classes.push('border');
      } else if (borders.border === '0' || borders.border === 'none') {
        classes.push('border-0');
      } else {
        styles.border = borders.border;
      }
    }

    // Border radius
    if (borders.borderRadius !== undefined) {
      const radiusMap: Record<string, string> = {
        '0': 'rounded-0',
        'sm': 'rounded-1',
        'md': 'rounded-2',
        'lg': 'rounded-3',
        '50%': 'rounded-circle',
        'pill': 'rounded-pill',
      };
      
      const radiusClass = radiusMap[borders.borderRadius] || `rounded`;
      if (this.utilityMappings.borders[radiusClass]) {
        classes.push(radiusClass);
      } else {
        styles.borderRadius = borders.borderRadius;
      }
    }

    return {
      className: classes.join(' '),
      style: styles,
    };
  }

  private translateEffectStyles(effects: any): Record<string, unknown> {
    const styles: Record<string, any> = {};

    // Bootstrap doesn't have many built-in effect utilities, so most will be inline styles
    if (effects.boxShadow) {
      styles.boxShadow = effects.boxShadow;
    }

    if (effects.transform) {
      styles.transform = effects.transform;
    }

    if (effects.filter) {
      styles.filter = effects.filter;
    }

    return { style: styles };
  }

  private translateResponsiveStyles(responsive: any): Record<string, unknown> {
    const breakpointMap: Record<string, string> = {
      xs: '',
      sm: 'sm',
      md: 'md',
      lg: 'lg',
      xl: 'xl',
      '2xl': 'xxl',
    };

    const responsiveClasses: string[] = [];
    const responsiveStyles: Record<string, any> = {};

    Object.entries(responsive).forEach(([breakpoint, styles]) => {
      const bpPrefix = breakpointMap[breakpoint];
      if (bpPrefix && styles && typeof styles === 'object') {
        // Handle display utilities
        if ((styles as any).display) {
          responsiveClasses.push(`d-${bpPrefix}-${(styles as any).display}`);
        }

        // Handle column utilities
        if ((styles as any).col) {
          responsiveClasses.push(`col-${bpPrefix}-${(styles as any).col}`);
        }

        // Other responsive styles would need media queries
        Object.entries(styles as any).forEach(([prop, value]) => {
          if (!['display', 'col'].includes(prop)) {
            if (!responsiveStyles[`@media (min-width: ${this.cssVariables.breakpoints[`--bs-breakpoint-${bpPrefix}`]})`]) {
              responsiveStyles[`@media (min-width: ${this.cssVariables.breakpoints[`--bs-breakpoint-${bpPrefix}`]})`] = {};
            }
            responsiveStyles[`@media (min-width: ${this.cssVariables.breakpoints[`--bs-breakpoint-${bpPrefix}`]})`][prop] = value;
          }
        });
      }
    });

    return {
      className: responsiveClasses.join(' '),
      style: responsiveStyles,
    };
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    const converted: Record<string, unknown> = {};

    // Convert color tokens
    if (tokens.tokens?.colors) {
      converted.colors = this.convertColorTokens(tokens.tokens.colors);
    }

    // Convert typography tokens
    if (tokens.tokens?.typography) {
      converted.typography = this.convertTypographyTokens(tokens.tokens.typography);
    }

    // Convert spacing tokens
    if (tokens.tokens?.spacing) {
      converted.spacing = this.convertSpacingTokens(tokens.tokens.spacing);
    }

    // Convert border tokens
    if (tokens.tokens?.borders) {
      converted.borders = this.convertBorderTokens(tokens.tokens.borders);
    }

    // Convert shadow tokens
    if (tokens.tokens?.shadows) {
      converted.shadows = this.convertShadowTokens(tokens.tokens.shadows);
    }

    // Convert breakpoint tokens
    if (tokens.tokens?.breakpoints) {
      converted.breakpoints = this.convertBreakpointTokens(tokens.tokens.breakpoints);
    }

    return converted;
  }

  private convertColorTokens(colors: any): Record<string, unknown> {
    const converted: Record<string, unknown> = {};

    Object.entries(this.cssVariables.colors).forEach(([bsVar, willowVar]) => {
      const tokenName = bsVar.replace('--bs-', '');
      if (colors[tokenName]) {
        converted[bsVar] = colors[tokenName];
      }
    });

    return converted;
  }

  private convertTypographyTokens(typography: any): Record<string, unknown> {
    const converted: Record<string, unknown> = {};

    Object.entries(this.cssVariables.typography).forEach(([bsVar, willowVar]) => {
      const tokenName = bsVar.replace('--bs-', '').replace(/-/g, '');
      if (typography[tokenName]) {
        converted[bsVar] = typography[tokenName];
      }
    });

    return converted;
  }

  private convertSpacingTokens(spacing: any): Record<string, unknown> {
    const converted: Record<string, unknown> = {};

    // Bootstrap uses a 0-5 scale for spacing
    const spacingScale = ['0', '1', '2', '3', '4', '5'];
    spacingScale.forEach(scale => {
      if (spacing[scale]) {
        converted[`--bs-spacing-${scale}`] = spacing[scale];
      }
    });

    return converted;
  }

  private convertBorderTokens(borders: any): Record<string, unknown> {
    const converted: Record<string, unknown> = {};

    if (borders.width) {
      converted['--bs-border-width'] = borders.width['1'] || borders.width.default;
    }

    if (borders.radius) {
      converted['--bs-border-radius'] = borders.radius.md || borders.radius.default;
      converted['--bs-border-radius-sm'] = borders.radius.sm;
      converted['--bs-border-radius-lg'] = borders.radius.lg;
      converted['--bs-border-radius-xl'] = borders.radius.xl;
      converted['--bs-border-radius-pill'] = borders.radius.full || '50rem';
    }

    return converted;
  }

  private convertShadowTokens(shadows: any): Record<string, unknown> {
    const converted: Record<string, unknown> = {};

    if (shadows.sm) converted['--bs-box-shadow-sm'] = shadows.sm;
    if (shadows.md) converted['--bs-box-shadow'] = shadows.md;
    if (shadows.lg) converted['--bs-box-shadow-lg'] = shadows.lg;
    if (shadows.inner) converted['--bs-box-shadow-inset'] = shadows.inner;

    return converted;
  }

  private convertBreakpointTokens(breakpoints: any): Record<string, unknown> {
    const converted: Record<string, unknown> = {};

    const bpMap: Record<string, string> = {
      xs: '--bs-breakpoint-xs',
      sm: '--bs-breakpoint-sm',
      md: '--bs-breakpoint-md',
      lg: '--bs-breakpoint-lg',
      xl: '--bs-breakpoint-xl',
      '2xl': '--bs-breakpoint-xxl',
    };

    Object.entries(bpMap).forEach(([key, cssVar]) => {
      if (breakpoints[key]) {
        converted[cssVar] = breakpoints[key];
      }
    });

    return converted;
  }

  validateConfig(): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate required fields
    if (!this.config.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Adapter name is required',
        path: 'config.name',
        severity: 'critical',
      });
    }

    if (!this.config.version) {
      errors.push({
        code: 'MISSING_VERSION',
        message: 'Adapter version is required',
        path: 'config.version',
        severity: 'critical',
      });
    }

    if (!this.config.framework) {
      errors.push({
        code: 'MISSING_FRAMEWORK',
        message: 'Target framework is required',
        path: 'config.framework',
        severity: 'critical',
      });
    }

    // Validate framework version
    if (this.config.framework?.name !== 'Bootstrap') {
      errors.push({
        code: 'INVALID_FRAMEWORK',
        message: 'This adapter only supports Bootstrap framework',
        path: 'config.framework.name',
        expected: 'Bootstrap',
        actual: this.config.framework?.name,
        severity: 'critical',
      });
    }

    // Validate capabilities
    if (!this.config.capabilities || this.config.capabilities.length === 0) {
      warnings.push({
        code: 'NO_CAPABILITIES',
        message: 'No capabilities defined for adapter',
        path: 'config.capabilities',
        severity: 'medium',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async cleanup(): Promise<void> {
    try {
      // Cleanup plugin manager
      await this.pluginManager.cleanup();

      // Clear registries
      this.componentRegistry.clear();

      // Reset initialization state
      this.initialized = false;
    } catch (error) {
      throw new AdapterError(
        'Failed to cleanup Bootstrap adapter',
        'CLEANUP_ERROR',
        error
      );
    }
  }
}

// Export factory function
export function createBootstrapAdapter(config?: Partial<AdapterConfig>): BootstrapAdapter {
  return new BootstrapAdapter(config);
}

// Export default instance
export default new BootstrapAdapter();