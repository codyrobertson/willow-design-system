'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        className: 'bg-white text-oxford-blue-900 shadow-chip hover:shadow-chip-hover',
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
        className: 'bg-neutral-50 text-neutral-700 shadow-chip hover:shadow-chip-hover',
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
        className: 'bg-state-success-lighter text-success shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'success',
        selected: true,
        className: 'bg-success text-white shadow-chip-success-selected',
      },
      {
        variant: 'normal',
        theme: 'warning',
        selected: false,
        className: 'bg-state-warning-lighter text-warning shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'warning',
        selected: true,
        className: 'bg-warning text-white shadow-chip-warning-selected',
      },
      {
        variant: 'normal',
        theme: 'danger',
        selected: false,
        className: 'bg-state-error-lighter text-danger shadow-chip hover:shadow-chip-hover',
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
        className: 'bg-willow-primary-50 text-willow-primary-700 shadow-chip hover:shadow-chip-hover',
      },
      {
        variant: 'normal',
        theme: 'info',
        selected: true,
        className: 'bg-willow-primary-600 text-white shadow-chip-info-selected',
      },
      // Fancy variant styles with layered shadows - using token shadows
      {
        variant: 'fancy',
        theme: 'primary',
        selected: false,
        className: 'bg-white text-oxford-blue-800 shadow-chip-fancy hover:shadow-chip-fancy-hover',
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
        className: 'bg-neutral-50 text-neutral-700 shadow-chip-fancy hover:shadow-chip-fancy-hover',
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
        className: 'bg-state-success-lighter text-success shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'success',
        selected: true,
        className: 'bg-success text-white shadow-chip-success-fancy-selected',
      },
      {
        variant: 'fancy',
        theme: 'warning',
        selected: false,
        className: 'bg-state-warning-lighter text-warning shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'warning',
        selected: true,
        className: 'bg-warning text-white shadow-chip-warning-fancy-selected',
      },
      {
        variant: 'fancy',
        theme: 'danger',
        selected: false,
        className: 'bg-state-error-lighter text-danger shadow-chip-fancy hover:shadow-chip-fancy-hover',
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
        className: 'bg-willow-primary-50 text-willow-primary-700 shadow-chip-fancy hover:shadow-chip-fancy-hover',
      },
      {
        variant: 'fancy',
        theme: 'info',
        selected: true,
        className: 'bg-willow-primary-600 text-white shadow-chip-info-fancy-selected',
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

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, theme, size, selected = false, onRemove, icon, children, onClick, ...props }, ref) => {
    const isClickable = onClick !== undefined;

    if (isClickable) {
      return (
        <button
          ref={ref as React.RefObject<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          aria-selected={selected || undefined}
          aria-pressed={selected}
          role={props.role || 'button'}
          className={cn(
            chipVariants({ variant, theme, size, selected }),
            'cursor-pointer',
            className
          )}
          {...props}
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