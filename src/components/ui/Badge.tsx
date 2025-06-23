import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Badge component styles using class-variance-authority
 * 
 * Variants:
 * - solid: Filled background with white text
 * - soft: Light background with colored text
 * - outline: Border with colored text on white background
 * 
 * Colors:
 * - primary: Willow brand colors
 * - neutral: Gray colors
 * - success: Green colors
 * - warning: Orange colors
 * - danger: Red colors
 * - info: Blue colors
 * 
 * Sizes:
 * - sm: Small (20px height, 11px text)
 * - md: Medium (24px height, 12px text)
 * - lg: Large (28px height, 14px text)
 */
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
        className: 'bg-success-600 text-white',
      },
      {
        variant: 'solid',
        color: 'warning',
        className: 'bg-warning-600 text-oxford-blue-950',
      },
      {
        variant: 'solid',
        color: 'danger',
        className: 'bg-danger text-white',
      },
      {
        variant: 'solid',
        color: 'info',
        className: 'bg-info-600 text-white',
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
        className: 'bg-state-success-lighter text-success-700',
      },
      {
        variant: 'soft',
        color: 'warning',
        className: 'bg-state-warning-lighter text-warning-700',
      },
      {
        variant: 'soft',
        color: 'danger',
        className: 'bg-state-error-lighter text-destructive-700',
      },
      {
        variant: 'soft',
        color: 'info',
        className: 'bg-info-100 text-info-700',
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
        className: 'border border-success-300 text-success-700 bg-white',
      },
      {
        variant: 'outline',
        color: 'warning',
        className: 'border border-warning-300 text-warning-700 bg-white',
      },
      {
        variant: 'outline',
        color: 'danger',
        className: 'border border-destructive-300 text-destructive-700 bg-white',
      },
      {
        variant: 'outline',
        color: 'info',
        className: 'border border-info-300 text-info-600 bg-white',
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

/**
 * BadgeProps interface for the Badge component
 * 
 * @property {React.ReactNode} [icon] - Optional icon to display
 * @property {'left' | 'right'} [iconPosition='left'] - Position of the icon
 * @property {boolean} [closable] - Whether the badge can be closed
 * @property {Function} [onClose] - Callback when close button is clicked
 * @property {boolean} [dot] - Show a dot indicator
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  closable?: boolean;
  onClose?: () => void;
  dot?: boolean;
}

/**
 * Badge component - Small status indicator for labels and counts
 * 
 * @component
 * @example
 * // Basic badge
 * <Badge>New</Badge>
 * 
 * @example
 * // Badge with icon
 * <Badge icon={<CheckCircle />} color="success">
 *   Verified
 * </Badge>
 * 
 * @example
 * // Closable badge
 * <Badge closable onClose={() => console.log('closed')}>
 *   Tag
 * </Badge>
 * 
 * @example
 * // Badge with dot indicator
 * <Badge dot color="warning">
 *   In Progress
 * </Badge>
 * 
 * Features:
 * - Three visual variants (solid, soft, outline)
 * - Six semantic colors
 * - Icon support with positioning
 * - Closable badges
 * - Dot indicators
 * - Two shape options (rounded-full, rounded-md)
 * 
 * @param {BadgeProps} props - Component props
 * @param {string} [props.variant='solid'] - Visual variant
 * @param {string} [props.color='primary'] - Color scheme
 * @param {string} [props.size='md'] - Size variant
 * @param {string} [props.rounded='full'] - Border radius style
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {'left' | 'right'} [props.iconPosition='left'] - Icon position
 * @param {boolean} [props.closable] - Show close button
 * @param {Function} [props.onClose] - Close handler
 * @param {boolean} [props.dot] - Show dot indicator
 * @param {React.ReactNode} props.children - Badge content
 */
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