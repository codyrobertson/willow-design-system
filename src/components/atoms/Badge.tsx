'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, StyledComponentProps } from '@/components/primitives/types';

/**
 * Badge variants following standardized pattern
 * Consolidated from Badge, Chip, and Tag components
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input',
        ghost: 'bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      status: {
        default: '',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        error: 'bg-destructive text-destructive-foreground',
        info: 'bg-info text-info-foreground',
      },
    },
    compoundVariants: [
      // Maximum 10-15 compound variants
      {
        variant: 'outline',
        status: 'success',
        className: 'border-success text-success',
      },
      {
        variant: 'outline',
        status: 'warning',
        className: 'border-warning text-warning',
      },
      {
        variant: 'outline',
        status: 'error',
        className: 'border-destructive text-destructive',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      status: 'default',
    },
  }
);

export interface BadgeProps 
  extends BaseComponentProps,
    StyledComponentProps,
    VariantProps<typeof badgeVariants> {
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
}

/**
 * Badge component - unified from Badge, Chip, and Tag
 * 
 * @example
 * <Badge variant="primary">New</Badge>
 * <Badge status="success" removable onRemove={() => {}}>Success</Badge>
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size,
    status,
    removable,
    onRemove,
    icon,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, status }), className)}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

// Aliases for backward compatibility
export const Chip = Badge;
export const Tag = Badge;

export { badgeVariants };