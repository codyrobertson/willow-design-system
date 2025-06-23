'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tag component styles using class-variance-authority
 * 
 * Variants:
 * - primary: Willow brand colors
 * - neutral: Gray colors
 * - success: Green colors
 * - warning: Orange colors
 * - danger: Red colors
 * - info: Blue colors
 * 
 * All variants use soft backgrounds with hover states
 * 
 * Sizes:
 * - sm: Small (extra small text)
 * - md: Medium (small text)
 * - lg: Large (base text)
 */
const tagVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-normal transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-willow-primary-100 text-willow-primary-800 hover:bg-willow-primary-200',
        neutral: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
        success: 'bg-state-success-lighter text-green-800 hover:bg-green-100',
        warning: 'bg-state-warning-lighter text-orange-800 hover:bg-orange-100',
        danger: 'bg-state-error-lighter text-red-800 hover:bg-red-100',
        info: 'bg-willow-primary-50 text-willow-primary-700 hover:bg-willow-primary-100',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

/**
 * TagProps interface for the Tag component
 * 
 * @property {Function} [onRemove] - Callback when remove button is clicked
 * @property {React.ReactNode} [icon] - Optional icon to display
 */
export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  onRemove?: () => void;
  icon?: React.ReactNode;
}

/**
 * Tag component - Simple label for categorization and metadata
 * 
 * @component
 * @example
 * // Basic tag
 * <Tag>Category</Tag>
 * 
 * @example
 * // Tag with icon
 * <Tag icon={<Hash />} variant="info">
 *   trending
 * </Tag>
 * 
 * @example
 * // Removable tag
 * <Tag 
 *   onRemove={() => removeTag()}
 *   variant="success"
 * >
 *   Completed
 * </Tag>
 * 
 * @example
 * // Different sizes
 * <Tag size="sm">Small</Tag>
 * <Tag size="md">Medium</Tag>
 * <Tag size="lg">Large</Tag>
 * 
 * Features:
 * - Six semantic color variants
 * - Three size options
 * - Optional icon support
 * - Removable with X button
 * - Hover states
 * - Focus states for accessibility
 * 
 * Use cases:
 * - Article tags
 * - Category labels
 * - Status indicators
 * - Filter tags
 * - Metadata display
 * 
 * @param {TagProps} props - Component props
 * @param {string} [props.variant='primary'] - Color variant
 * @param {string} [props.size='md'] - Size variant
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {Function} [props.onRemove] - Remove handler
 * @param {React.ReactNode} props.children - Tag content
 */
const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, size, onRemove, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(tagVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="flex-shrink-0 [&>svg]:w-[0.89em] [&>svg]:h-[0.89em]" aria-hidden="true">{icon}</span>}
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove tag"
            className={cn(
              "flex-shrink-0 ml-1 -mr-0.5 hover:opacity-75 focus:outline-none transition-opacity"
            )}
          >
            <X className="opacity-70 w-[0.89em] h-[0.89em]" aria-hidden="true" />
          </button>
        )}
      </span>
    );
  }
);
Tag.displayName = 'Tag';

export { Tag, tagVariants };