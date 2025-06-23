import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 text-xs font-normal transition-all',
  {
    variants: {
      variant: {
        solid: '',
        soft: '',
        outline: '',
      },
      color: {
        primary: '',
        neutral: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      size: {
        sm: 'h-5 px-2 text-[11px]',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-7 px-3 text-sm',
      },
      rounded: {
        full: 'rounded-full',
        md: 'rounded-md',
      },
    },
    compoundVariants: [
      // Solid variants - using Willow brand colors
      {
        variant: 'solid',
        color: 'primary',
        className: 'bg-willow-primary-950 text-white',
      },
      {
        variant: 'solid',
        color: 'neutral',
        className: 'bg-neutral-700 text-white',
      },
      {
        variant: 'solid',
        color: 'success',
        className: 'bg-success text-white',
      },
      {
        variant: 'solid',
        color: 'warning',
        className: 'bg-warning text-white',
      },
      {
        variant: 'solid',
        color: 'danger',
        className: 'bg-danger text-white',
      },
      {
        variant: 'solid',
        color: 'info',
        className: 'bg-willow-primary-600 text-white',
      },
      // Soft variants - lighter backgrounds with colored text
      {
        variant: 'soft',
        color: 'primary',
        className: 'bg-willow-primary-50 text-willow-primary-800',
      },
      {
        variant: 'soft',
        color: 'neutral',
        className: 'bg-neutral-100 text-neutral-700',
      },
      {
        variant: 'soft',
        color: 'success',
        className: 'bg-state-success-lighter text-green-800',
      },
      {
        variant: 'soft',
        color: 'warning',
        className: 'bg-state-warning-lighter text-orange-800',
      },
      {
        variant: 'soft',
        color: 'danger',
        className: 'bg-state-error-lighter text-red-800',
      },
      {
        variant: 'soft',
        color: 'info',
        className: 'bg-willow-primary-100 text-willow-primary-700',
      },
      // Outline variants - border with colored text
      {
        variant: 'outline',
        color: 'primary',
        className: 'border border-willow-primary-300 text-willow-primary-700 bg-white',
      },
      {
        variant: 'outline',
        color: 'neutral',
        className: 'border border-neutral-300 text-neutral-600 bg-white',
      },
      {
        variant: 'outline',
        color: 'success',
        className: 'border border-green-300 text-green-700 bg-white',
      },
      {
        variant: 'outline',
        color: 'warning',
        className: 'border border-orange-300 text-orange-700 bg-white',
      },
      {
        variant: 'outline',
        color: 'danger',
        className: 'border border-red-300 text-red-700 bg-white',
      },
      {
        variant: 'outline',
        color: 'info',
        className: 'border border-willow-primary-300 text-willow-primary-600 bg-white',
      },
    ],
    defaultVariants: {
      variant: 'solid',
      color: 'primary',
      size: 'md',
      rounded: 'full',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  closable?: boolean;
  onClose?: () => void;
  dot?: boolean;
}

function Badge({ 
  className, 
  variant, 
  color, 
  size, 
  rounded,
  icon,
  iconPosition = 'left',
  closable,
  onClose,
  dot,
  children,
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant, color, size, rounded }), className)} 
      {...props}
    >
      {dot && (
        <span className={cn(
          "w-[0.375em] h-[0.375em] rounded-full",
          variant === 'solid' ? 'bg-white/80' : 
          variant === 'soft' ? 'bg-current opacity-80' : 
          'bg-current'
        )} />
      )}
      {icon && iconPosition === 'left' && (
        <span className={cn(
          "flex-shrink-0 [&>svg]:w-[0.89em] [&>svg]:h-[0.89em]"
        )}>{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className={cn(
          "flex-shrink-0 [&>svg]:w-[0.89em] [&>svg]:h-[0.89em]"
        )}>{icon}</span>
      )}
      {closable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          aria-label="Remove badge"
          className={cn(
            "flex-shrink-0 ml-1 hover:opacity-70 focus:outline-none transition-opacity",
            size === 'sm' && '-mr-0.5',
            size === 'md' && '-mr-0.5',
            size === 'lg' && '-mr-1'
          )}
        >
          <X className="opacity-60 w-[0.89em] h-[0.89em]" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };