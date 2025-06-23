'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Chip component styles using class-variance-authority
 * 
 * Variants:
 * - normal: Rounded corners with standard shadows
 * - fancy: Fully rounded with layered shadows
 * 
 * Themes:
 * - primary: Willow brand colors
 * - neutral: Gray colors
 * - success: Green colors
 * - warning: Orange colors
 * - danger: Red colors
 * - info: Blue colors
 * 
 * Sizes:
 * - sm: Small (28px height)
 * - md: Medium (36px height)
 * - lg: Large (44px height)
 * 
 * States:
 * - selected: Changes background to theme color with white text
 * - unselected: Light background with colored text
 */
const chipVariants = cva(
  'inline-flex items-center justify-center gap-2 font-normal transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        normal: 'rounded-lg',
        fancy: 'rounded-full',
      },
      theme: {
        primary: '',
        neutral: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      size: {
        sm: 'h-7 px-3 text-sm',
        md: 'h-9 px-4 text-base',
        lg: 'h-11 px-5 text-lg',
      },
      selected: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Normal variant styles - using token shadows
      {
        variant: 'normal',
        theme: 'primary',
        selected: false,
        className: 'bg-white text-oxford-blue-900 border border-willow-primary-200 shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'primary',
        selected: true,
        className: 'bg-willow-primary-950 text-white shadow-chip-primary-selected',
      },
      {
        variant: 'normal',
        theme: 'neutral',
        selected: false,
        className: 'bg-neutral-50 text-neutral-700 border border-neutral-300 shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'neutral',
        selected: true,
        className: 'bg-neutral-700 text-white shadow-chip-neutral-selected',
      },
      {
        variant: 'normal',
        theme: 'success',
        selected: false,
        className: 'bg-state-success-lighter text-success-700 border border-success-300 shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'success',
        selected: true,
        className: 'bg-success-600 text-white shadow-chip-success-selected',
      },
      {
        variant: 'normal',
        theme: 'warning',
        selected: false,
        className: 'bg-state-warning-lighter text-warning-700 border border-warning-300 shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'warning',
        selected: true,
        className: 'bg-warning-600 text-oxford-blue-950 shadow-chip-warning-selected',
      },
      {
        variant: 'normal',
        theme: 'danger',
        selected: false,
        className: 'bg-state-error-lighter text-danger border border-error-300 shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'danger',
        selected: true,
        className: 'bg-danger text-white shadow-chip-danger-selected',
      },
      {
        variant: 'normal',
        theme: 'info',
        selected: false,
        className: 'bg-info-50 text-info-700 border border-info-300 shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'info',
        selected: true,
        className: 'bg-info-600 text-white shadow-chip-info-selected',
      },
      // Fancy variant styles with layered shadows - using token shadows
      {
        variant: 'fancy',
        theme: 'primary',
        selected: false,
        className: 'bg-white text-oxford-blue-800 border border-willow-primary-200 shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'primary',
        selected: true,
        className: 'bg-willow-primary-950 text-white shadow-chip-primary-fancy-selected',
      },
      {
        variant: 'fancy',
        theme: 'neutral',
        selected: false,
        className: 'bg-neutral-50 text-neutral-700 border border-neutral-300 shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'neutral',
        selected: true,
        className: 'bg-neutral-700 text-white shadow-chip-neutral-fancy-selected',
      },
      {
        variant: 'fancy',
        theme: 'success',
        selected: false,
        className: 'bg-state-success-lighter text-success-700 border border-success-300 shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'success',
        selected: true,
        className: 'bg-success-600 text-white shadow-chip-success-fancy-selected',
      },
      {
        variant: 'fancy',
        theme: 'warning',
        selected: false,
        className: 'bg-state-warning-lighter text-warning-700 border border-warning-300 shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'warning',
        selected: true,
        className: 'bg-warning-600 text-oxford-blue-950 shadow-chip-warning-fancy-selected',
      },
      {
        variant: 'fancy',
        theme: 'danger',
        selected: false,
        className: 'bg-state-error-lighter text-danger border border-error-300 shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'danger',
        selected: true,
        className: 'bg-danger text-white shadow-chip-danger-fancy-selected',
      },
      {
        variant: 'fancy',
        theme: 'info',
        selected: false,
        className: 'bg-info-50 text-info-700 border border-info-300 shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'info',
        selected: true,
        className: 'bg-info-600 text-white shadow-chip-info-fancy-selected',
      },
    ],
    defaultVariants: {
      variant: 'normal',
      theme: 'primary',
      size: 'md',
      selected: false,
    },
  }
);

/**
 * ChipProps interface for the Chip component
 * 
 * @property {Function} [onRemove] - Callback when remove button is clicked
 * @property {React.ReactNode} [icon] - Optional icon to display
 * @property {boolean} [selected=false] - Selected state
 * @property {Function} [onClick] - Click handler (makes chip clickable)
 */
export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Chip component - Interactive or static tag for selections and filters
 * 
 * @component
 * @example
 * // Basic chip
 * <Chip>React</Chip>
 * 
 * @example
 * // Clickable chip with selection
 * <Chip 
 *   onClick={() => setSelected(!selected)}
 *   selected={selected}
 * >
 *   TypeScript
 * </Chip>
 * 
 * @example
 * // Removable chip with icon
 * <Chip 
 *   icon={<Tag />}
 *   onRemove={() => handleRemove()}
 *   theme="info"
 * >
 *   Frontend
 * </Chip>
 * 
 * @example
 * // Fancy variant chip
 * <Chip variant="fancy" theme="success" selected>
 *   Active
 * </Chip>
 * 
 * Features:
 * - Two visual variants (normal, fancy)
 * - Six semantic themes
 * - Selectable state
 * - Removable with X button
 * - Icon support
 * - Clickable or static
 * - Focus management
 * 
 * @param {ChipProps} props - Component props
 * @param {string} [props.variant='normal'] - Visual variant
 * @param {string} [props.theme='primary'] - Color theme
 * @param {string} [props.size='md'] - Size variant
 * @param {boolean} [props.selected=false] - Selected state
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {Function} [props.onClick] - Click handler
 * @param {Function} [props.onRemove] - Remove handler
 * @param {React.ReactNode} props.children - Chip content
 */
const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, theme, size, selected = false, onRemove, icon, children, onClick, ...props }, ref) => {
    const isClickable = onClick !== undefined;

    if (isClickable) {
      const { role, ...buttonProps } = props as React.HTMLAttributes<HTMLButtonElement>;
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          aria-selected={selected || undefined}
          aria-pressed={selected}
          role={role || 'button'}
          className={cn(
            chipVariants({ variant, theme, size, selected }),
            'cursor-pointer',
            className
          )}
          {...buttonProps}
        >
          {icon && <span className="flex-shrink-0 [&>svg]:w-[0.89em] [&>svg]:h-[0.89em]" aria-hidden="true">{icon}</span>}
          <span>{children}</span>
          {onRemove && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Remove"
              className={cn(
                "flex-shrink-0 ml-2 hover:opacity-75 focus:outline-none transition-opacity cursor-pointer",
                size === 'sm' && '-mr-1',
                size === 'md' && '-mr-1',
                size === 'lg' && '-mr-1.5'
              )}
            >
              <X className="opacity-70 w-[0.89em] h-[0.89em]" aria-hidden="true" />
            </span>
          )}
        </button>
      );
    }

    return (
      <div
        ref={ref}
        aria-selected={selected || undefined}
        role={props.role}
        className={cn(
          chipVariants({ variant, theme, size, selected }),
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0 [&>svg]:w-[0.89em] [&>svg]:h-[0.89em]" aria-hidden="true">{icon}</span>}
        <span>{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove"
            className={cn(
              "flex-shrink-0 ml-2 hover:opacity-75 focus:outline-none transition-opacity",
              size === 'sm' && '-mr-1',
              size === 'md' && '-mr-1',
              size === 'lg' && '-mr-1.5'
            )}
          >
            <X className="opacity-70 w-[0.89em] h-[0.89em]" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);
Chip.displayName = 'Chip';

export { Chip, chipVariants };