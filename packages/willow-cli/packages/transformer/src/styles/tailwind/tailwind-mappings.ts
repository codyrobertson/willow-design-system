import type { CSSClassMapping } from '../../types/style-transformation.types';

/**
 * Common Tailwind to Willow Design System mappings
 */
export const tailwindToWillowMappings: CSSClassMapping[] = [
  // Color mappings
  { sourceClass: /^text-blue-(\d+)$/, targetClass: (match) => `text-brand-${match.replace('text-blue-', '')}` },
  { sourceClass: /^bg-blue-(\d+)$/, targetClass: (match) => `bg-brand-${match.replace('bg-blue-', '')}` },
  { sourceClass: /^border-blue-(\d+)$/, targetClass: (match) => `border-brand-${match.replace('border-blue-', '')}` },
  
  // Semantic color mappings
  { sourceClass: 'text-red-500', targetClass: 'text-error' },
  { sourceClass: 'text-green-500', targetClass: 'text-success' },
  { sourceClass: 'text-yellow-500', targetClass: 'text-warning' },
  { sourceClass: 'text-blue-500', targetClass: 'text-info' },
  
  { sourceClass: 'bg-red-50', targetClass: 'bg-error-light' },
  { sourceClass: 'bg-green-50', targetClass: 'bg-success-light' },
  { sourceClass: 'bg-yellow-50', targetClass: 'bg-warning-light' },
  { sourceClass: 'bg-blue-50', targetClass: 'bg-info-light' },
  
  // Spacing mappings (if using different scale)
  { sourceClass: 'p-1', targetClass: 'p-xs' },
  { sourceClass: 'p-2', targetClass: 'p-sm' },
  { sourceClass: 'p-4', targetClass: 'p-md' },
  { sourceClass: 'p-6', targetClass: 'p-lg' },
  { sourceClass: 'p-8', targetClass: 'p-xl' },
  
  // Component-specific mappings
  { sourceClass: 'rounded-lg', targetClass: 'rounded-button' },
  { sourceClass: 'shadow-md', targetClass: 'shadow-card' },
  { sourceClass: 'shadow-lg', targetClass: 'shadow-modal' },
  
  // Typography mappings
  { sourceClass: 'text-xs', targetClass: 'text-caption' },
  { sourceClass: 'text-sm', targetClass: 'text-body-sm' },
  { sourceClass: 'text-base', targetClass: 'text-body' },
  { sourceClass: 'text-lg', targetClass: 'text-body-lg' },
  { sourceClass: 'text-xl', targetClass: 'text-h6' },
  { sourceClass: 'text-2xl', targetClass: 'text-h5' },
  { sourceClass: 'text-3xl', targetClass: 'text-h4' },
  { sourceClass: 'text-4xl', targetClass: 'text-h3' },
  { sourceClass: 'text-5xl', targetClass: 'text-h2' },
  { sourceClass: 'text-6xl', targetClass: 'text-h1' },
  
  // Layout mappings
  { sourceClass: 'flex-center', targetClass: 'flex items-center justify-center' },
  { sourceClass: 'stack', targetClass: 'flex flex-col space-y-4' },
];

/**
 * Tailwind to Bootstrap mappings
 */
export const tailwindToBootstrapMappings: CSSClassMapping[] = [
  // Display utilities
  { sourceClass: 'hidden', targetClass: 'd-none' },
  { sourceClass: 'block', targetClass: 'd-block' },
  { sourceClass: 'inline-block', targetClass: 'd-inline-block' },
  { sourceClass: 'inline', targetClass: 'd-inline' },
  { sourceClass: 'flex', targetClass: 'd-flex' },
  { sourceClass: 'inline-flex', targetClass: 'd-inline-flex' },
  
  // Flexbox utilities
  { sourceClass: 'flex-row', targetClass: 'flex-row' },
  { sourceClass: 'flex-col', targetClass: 'flex-column' },
  { sourceClass: 'justify-start', targetClass: 'justify-content-start' },
  { sourceClass: 'justify-end', targetClass: 'justify-content-end' },
  { sourceClass: 'justify-center', targetClass: 'justify-content-center' },
  { sourceClass: 'justify-between', targetClass: 'justify-content-between' },
  { sourceClass: 'items-start', targetClass: 'align-items-start' },
  { sourceClass: 'items-end', targetClass: 'align-items-end' },
  { sourceClass: 'items-center', targetClass: 'align-items-center' },
  
  // Spacing utilities
  { sourceClass: /^m-(\d+)$/, targetClass: (match) => `m-${Math.min(5, parseInt(match.replace('m-', '')))}` },
  { sourceClass: /^p-(\d+)$/, targetClass: (match) => `p-${Math.min(5, parseInt(match.replace('p-', '')))}` },
  
  // Text utilities
  { sourceClass: 'text-left', targetClass: 'text-start' },
  { sourceClass: 'text-right', targetClass: 'text-end' },
  { sourceClass: 'text-center', targetClass: 'text-center' },
  { sourceClass: 'font-bold', targetClass: 'fw-bold' },
  { sourceClass: 'font-normal', targetClass: 'fw-normal' },
  
  // Color utilities
  { sourceClass: 'text-red-500', targetClass: 'text-danger' },
  { sourceClass: 'text-green-500', targetClass: 'text-success' },
  { sourceClass: 'text-blue-500', targetClass: 'text-primary' },
  { sourceClass: 'text-yellow-500', targetClass: 'text-warning' },
  { sourceClass: 'bg-red-500', targetClass: 'bg-danger' },
  { sourceClass: 'bg-green-500', targetClass: 'bg-success' },
  { sourceClass: 'bg-blue-500', targetClass: 'bg-primary' },
  { sourceClass: 'bg-yellow-500', targetClass: 'bg-warning' },
];

/**
 * Create custom Tailwind mappings
 */
export function createTailwindMappings(
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
 * Utility to merge multiple mapping sets
 */
export function mergeTailwindMappings(
  ...mappingSets: CSSClassMapping[][]
): CSSClassMapping[] {
  const merged = mappingSets.flat();
  
  // Sort by priority (higher priority first)
  return merged.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}