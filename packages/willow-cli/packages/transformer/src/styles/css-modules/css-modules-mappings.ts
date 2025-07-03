import type { CSSClassMapping } from '../../types/style-transformation.types';

/**
 * Common CSS Modules to framework-specific class mappings
 */

/**
 * Bootstrap-style class mappings for CSS Modules
 */
export const cssModulesToBootstrapMappings: CSSClassMapping[] = [
  // Layout utilities
  { sourceClass: 'container', targetClass: 'container' },
  { sourceClass: 'container-fluid', targetClass: 'container-fluid' },
  { sourceClass: 'row', targetClass: 'row' },
  { sourceClass: /^col-(\d+)$/, targetClass: (match) => `col-${match.replace('col-', '')}` },
  
  // Display utilities
  { sourceClass: 'hidden', targetClass: 'd-none' },
  { sourceClass: 'visible', targetClass: 'd-block' },
  { sourceClass: 'flex', targetClass: 'd-flex' },
  { sourceClass: 'inline-flex', targetClass: 'd-inline-flex' },
  
  // Flexbox utilities
  { sourceClass: 'flex-row', targetClass: 'flex-row' },
  { sourceClass: 'flex-column', targetClass: 'flex-column' },
  { sourceClass: 'justify-start', targetClass: 'justify-content-start' },
  { sourceClass: 'justify-center', targetClass: 'justify-content-center' },
  { sourceClass: 'justify-end', targetClass: 'justify-content-end' },
  { sourceClass: 'justify-between', targetClass: 'justify-content-between' },
  { sourceClass: 'items-start', targetClass: 'align-items-start' },
  { sourceClass: 'items-center', targetClass: 'align-items-center' },
  { sourceClass: 'items-end', targetClass: 'align-items-end' },
  
  // Text utilities
  { sourceClass: 'text-left', targetClass: 'text-start' },
  { sourceClass: 'text-center', targetClass: 'text-center' },
  { sourceClass: 'text-right', targetClass: 'text-end' },
  { sourceClass: 'font-bold', targetClass: 'fw-bold' },
  { sourceClass: 'font-normal', targetClass: 'fw-normal' },
  
  // Spacing utilities
  { sourceClass: /^m-(\d+)$/, targetClass: (match) => `m-${Math.min(5, parseInt(match.replace('m-', '')))}` },
  { sourceClass: /^p-(\d+)$/, targetClass: (match) => `p-${Math.min(5, parseInt(match.replace('p-', '')))}` },
  { sourceClass: /^mt-(\d+)$/, targetClass: (match) => `mt-${Math.min(5, parseInt(match.replace('mt-', '')))}` },
  { sourceClass: /^mb-(\d+)$/, targetClass: (match) => `mb-${Math.min(5, parseInt(match.replace('mb-', '')))}` },
  { sourceClass: /^ml-(\d+)$/, targetClass: (match) => `ms-${Math.min(5, parseInt(match.replace('ml-', '')))}` },
  { sourceClass: /^mr-(\d+)$/, targetClass: (match) => `me-${Math.min(5, parseInt(match.replace('mr-', '')))}` },
  
  // Border utilities
  { sourceClass: 'border', targetClass: 'border' },
  { sourceClass: 'border-none', targetClass: 'border-0' },
  { sourceClass: 'rounded', targetClass: 'rounded' },
  { sourceClass: 'rounded-full', targetClass: 'rounded-circle' },
  
  // Color utilities
  { sourceClass: 'text-primary', targetClass: 'text-primary' },
  { sourceClass: 'text-secondary', targetClass: 'text-secondary' },
  { sourceClass: 'text-success', targetClass: 'text-success' },
  { sourceClass: 'text-warning', targetClass: 'text-warning' },
  { sourceClass: 'text-danger', targetClass: 'text-danger' },
  { sourceClass: 'bg-primary', targetClass: 'bg-primary' },
  { sourceClass: 'bg-secondary', targetClass: 'bg-secondary' },
  { sourceClass: 'bg-success', targetClass: 'bg-success' },
  { sourceClass: 'bg-warning', targetClass: 'bg-warning' },
  { sourceClass: 'bg-danger', targetClass: 'bg-danger' },
];

/**
 * Tailwind-style class mappings for CSS Modules
 */
export const cssModulesToTailwindMappings: CSSClassMapping[] = [
  // Layout utilities
  { sourceClass: 'container', targetClass: 'container' },
  { sourceClass: 'flex', targetClass: 'flex' },
  { sourceClass: 'inline-flex', targetClass: 'inline-flex' },
  { sourceClass: 'grid', targetClass: 'grid' },
  { sourceClass: 'hidden', targetClass: 'hidden' },
  { sourceClass: 'block', targetClass: 'block' },
  
  // Flexbox utilities
  { sourceClass: 'flex-row', targetClass: 'flex-row' },
  { sourceClass: 'flex-col', targetClass: 'flex-col' },
  { sourceClass: 'flex-wrap', targetClass: 'flex-wrap' },
  { sourceClass: 'justify-start', targetClass: 'justify-start' },
  { sourceClass: 'justify-center', targetClass: 'justify-center' },
  { sourceClass: 'justify-end', targetClass: 'justify-end' },
  { sourceClass: 'justify-between', targetClass: 'justify-between' },
  { sourceClass: 'items-start', targetClass: 'items-start' },
  { sourceClass: 'items-center', targetClass: 'items-center' },
  { sourceClass: 'items-end', targetClass: 'items-end' },
  
  // Spacing utilities (convert numbered to Tailwind scale)
  { sourceClass: /^m-(\d+)$/, targetClass: (match) => {
    const value = parseInt(match.replace('m-', ''));
    const tailwindValue = [0, 1, 2, 4, 8, 16, 32][Math.min(6, value)] || value;
    return `m-${tailwindValue}`;
  }},
  { sourceClass: /^p-(\d+)$/, targetClass: (match) => {
    const value = parseInt(match.replace('p-', ''));
    const tailwindValue = [0, 1, 2, 4, 8, 16, 32][Math.min(6, value)] || value;
    return `p-${tailwindValue}`;
  }},
  
  // Text utilities
  { sourceClass: 'text-left', targetClass: 'text-left' },
  { sourceClass: 'text-center', targetClass: 'text-center' },
  { sourceClass: 'text-right', targetClass: 'text-right' },
  { sourceClass: 'font-bold', targetClass: 'font-bold' },
  { sourceClass: 'font-normal', targetClass: 'font-normal' },
  { sourceClass: 'text-xs', targetClass: 'text-xs' },
  { sourceClass: 'text-sm', targetClass: 'text-sm' },
  { sourceClass: 'text-base', targetClass: 'text-base' },
  { sourceClass: 'text-lg', targetClass: 'text-lg' },
  { sourceClass: 'text-xl', targetClass: 'text-xl' },
  
  // Border utilities
  { sourceClass: 'border', targetClass: 'border' },
  { sourceClass: 'border-none', targetClass: 'border-0' },
  { sourceClass: 'rounded', targetClass: 'rounded' },
  { sourceClass: 'rounded-full', targetClass: 'rounded-full' },
  { sourceClass: 'rounded-lg', targetClass: 'rounded-lg' },
  
  // Color utilities (semantic to Tailwind)
  { sourceClass: 'text-primary', targetClass: 'text-blue-600' },
  { sourceClass: 'text-secondary', targetClass: 'text-gray-600' },
  { sourceClass: 'text-success', targetClass: 'text-green-600' },
  { sourceClass: 'text-warning', targetClass: 'text-yellow-600' },
  { sourceClass: 'text-danger', targetClass: 'text-red-600' },
  { sourceClass: 'bg-primary', targetClass: 'bg-blue-600' },
  { sourceClass: 'bg-secondary', targetClass: 'bg-gray-600' },
  { sourceClass: 'bg-success', targetClass: 'bg-green-600' },
  { sourceClass: 'bg-warning', targetClass: 'bg-yellow-600' },
  { sourceClass: 'bg-danger', targetClass: 'bg-red-600' },
];

/**
 * Material-UI style class mappings
 */
export const cssModulesToMuiMappings: CSSClassMapping[] = [
  // Component mappings
  { sourceClass: 'button', targetClass: 'MuiButton-root' },
  { sourceClass: 'button-primary', targetClass: 'MuiButton-containedPrimary' },
  { sourceClass: 'button-secondary', targetClass: 'MuiButton-containedSecondary' },
  { sourceClass: 'button-outlined', targetClass: 'MuiButton-outlined' },
  { sourceClass: 'button-text', targetClass: 'MuiButton-text' },
  
  // Card components
  { sourceClass: 'card', targetClass: 'MuiCard-root' },
  { sourceClass: 'card-header', targetClass: 'MuiCardHeader-root' },
  { sourceClass: 'card-content', targetClass: 'MuiCardContent-root' },
  { sourceClass: 'card-actions', targetClass: 'MuiCardActions-root' },
  
  // Input components
  { sourceClass: 'input', targetClass: 'MuiInputBase-root' },
  { sourceClass: 'input-outlined', targetClass: 'MuiOutlinedInput-root' },
  { sourceClass: 'input-filled', targetClass: 'MuiFilledInput-root' },
  { sourceClass: 'input-error', targetClass: 'Mui-error' },
  { sourceClass: 'input-disabled', targetClass: 'Mui-disabled' },
  
  // Typography
  { sourceClass: 'text-h1', targetClass: 'MuiTypography-h1' },
  { sourceClass: 'text-h2', targetClass: 'MuiTypography-h2' },
  { sourceClass: 'text-h3', targetClass: 'MuiTypography-h3' },
  { sourceClass: 'text-h4', targetClass: 'MuiTypography-h4' },
  { sourceClass: 'text-h5', targetClass: 'MuiTypography-h5' },
  { sourceClass: 'text-h6', targetClass: 'MuiTypography-h6' },
  { sourceClass: 'text-body1', targetClass: 'MuiTypography-body1' },
  { sourceClass: 'text-body2', targetClass: 'MuiTypography-body2' },
  { sourceClass: 'text-caption', targetClass: 'MuiTypography-caption' },
  
  // Layout utilities
  { sourceClass: 'container', targetClass: 'MuiContainer-root' },
  { sourceClass: 'grid-container', targetClass: 'MuiGrid-container' },
  { sourceClass: 'grid-item', targetClass: 'MuiGrid-item' },
  
  // Paper and surfaces
  { sourceClass: 'paper', targetClass: 'MuiPaper-root' },
  { sourceClass: 'surface', targetClass: 'MuiPaper-root' },
  { sourceClass: 'elevation-1', targetClass: 'MuiPaper-elevation1' },
  { sourceClass: 'elevation-2', targetClass: 'MuiPaper-elevation2' },
  { sourceClass: 'elevation-3', targetClass: 'MuiPaper-elevation3' },
];

/**
 * Ant Design class mappings
 */
export const cssModulesToAntdMappings: CSSClassMapping[] = [
  // Component mappings
  { sourceClass: 'button', targetClass: 'ant-btn' },
  { sourceClass: 'button-primary', targetClass: 'ant-btn-primary' },
  { sourceClass: 'button-secondary', targetClass: 'ant-btn-default' },
  { sourceClass: 'button-danger', targetClass: 'ant-btn-danger' },
  { sourceClass: 'button-ghost', targetClass: 'ant-btn-ghost' },
  { sourceClass: 'button-link', targetClass: 'ant-btn-link' },
  
  // Form components
  { sourceClass: 'form', targetClass: 'ant-form' },
  { sourceClass: 'form-item', targetClass: 'ant-form-item' },
  { sourceClass: 'input', targetClass: 'ant-input' },
  { sourceClass: 'input-group', targetClass: 'ant-input-group' },
  { sourceClass: 'select', targetClass: 'ant-select' },
  { sourceClass: 'checkbox', targetClass: 'ant-checkbox' },
  { sourceClass: 'radio', targetClass: 'ant-radio' },
  
  // Layout components
  { sourceClass: 'layout', targetClass: 'ant-layout' },
  { sourceClass: 'header', targetClass: 'ant-layout-header' },
  { sourceClass: 'content', targetClass: 'ant-layout-content' },
  { sourceClass: 'footer', targetClass: 'ant-layout-footer' },
  { sourceClass: 'sider', targetClass: 'ant-layout-sider' },
  
  // Grid system
  { sourceClass: 'row', targetClass: 'ant-row' },
  { sourceClass: /^col-(\d+)$/, targetClass: (match) => `ant-col-${match.replace('col-', '')}` },
  { sourceClass: /^col-xs-(\d+)$/, targetClass: (match) => `ant-col-xs-${match.replace('col-xs-', '')}` },
  { sourceClass: /^col-sm-(\d+)$/, targetClass: (match) => `ant-col-sm-${match.replace('col-sm-', '')}` },
  { sourceClass: /^col-md-(\d+)$/, targetClass: (match) => `ant-col-md-${match.replace('col-md-', '')}` },
  { sourceClass: /^col-lg-(\d+)$/, targetClass: (match) => `ant-col-lg-${match.replace('col-lg-', '')}` },
  
  // Typography
  { sourceClass: 'title', targetClass: 'ant-typography-title' },
  { sourceClass: 'paragraph', targetClass: 'ant-typography-paragraph' },
  { sourceClass: 'text', targetClass: 'ant-typography' },
  
  // Card and surfaces
  { sourceClass: 'card', targetClass: 'ant-card' },
  { sourceClass: 'card-head', targetClass: 'ant-card-head' },
  { sourceClass: 'card-body', targetClass: 'ant-card-body' },
  
  // Navigation
  { sourceClass: 'menu', targetClass: 'ant-menu' },
  { sourceClass: 'menu-item', targetClass: 'ant-menu-item' },
  { sourceClass: 'menu-submenu', targetClass: 'ant-menu-submenu' },
];

/**
 * Create custom CSS module mappings
 */
export function createCSSModuleMappings(
  mappings: Array<{
    source: string | RegExp;
    target: string | ((match: string) => string);
    priority?: number;
  }>
): CSSClassMapping[] {
  return mappings.map(({ source, target, priority }) => ({
    sourceClass: source,
    targetClass: target,
    priority: priority || 0,
  }));
}

/**
 * Merge multiple CSS module mapping sets
 */
export function mergeCSSModuleMappings(
  ...mappingSets: CSSClassMapping[][]
): CSSClassMapping[] {
  const merged = mappingSets.flat();
  
  // Sort by priority (higher priority first)
  return merged.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * CSS Modules semantic color mappings
 */
export const semanticColorMappings: CSSClassMapping[] = [
  // Semantic to specific framework colors
  { sourceClass: 'primary', targetClass: 'blue' },
  { sourceClass: 'secondary', targetClass: 'gray' },
  { sourceClass: 'success', targetClass: 'green' },
  { sourceClass: 'warning', targetClass: 'yellow' },
  { sourceClass: 'danger', targetClass: 'red' },
  { sourceClass: 'info', targetClass: 'cyan' },
  { sourceClass: 'light', targetClass: 'gray-100' },
  { sourceClass: 'dark', targetClass: 'gray-900' },
];

/**
 * CSS Modules responsive utilities mappings
 */
export const responsiveMappings: CSSClassMapping[] = [
  // Responsive prefixes
  { sourceClass: /^xs:(.+)$/, targetClass: (match) => `${match.replace('xs:', '')}` },
  { sourceClass: /^sm:(.+)$/, targetClass: (match) => `sm:${match.replace('sm:', '')}` },
  { sourceClass: /^md:(.+)$/, targetClass: (match) => `md:${match.replace('md:', '')}` },
  { sourceClass: /^lg:(.+)$/, targetClass: (match) => `lg:${match.replace('lg:', '')}` },
  { sourceClass: /^xl:(.+)$/, targetClass: (match) => `xl:${match.replace('xl:', '')}` },
  
  // State modifiers
  { sourceClass: /^hover:(.+)$/, targetClass: (match) => `hover:${match.replace('hover:', '')}` },
  { sourceClass: /^focus:(.+)$/, targetClass: (match) => `focus:${match.replace('focus:', '')}` },
  { sourceClass: /^active:(.+)$/, targetClass: (match) => `active:${match.replace('active:', '')}` },
  { sourceClass: /^disabled:(.+)$/, targetClass: (match) => `disabled:${match.replace('disabled:', '')}` },
];