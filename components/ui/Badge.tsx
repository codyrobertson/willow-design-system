import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge component styles using class-variance-authority
 * 
 * Variants:
 * - default: Filled background with white text
 * - secondary: Light background with colored text
 * - outline: Border with colored text on white background
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
 * - sm: Small (20px height, 11px text)
 * - md: Medium (24px height, 12px text)
 * - lg: Large (28px height, 14px text)
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 text-xs font-normal transition-all',
  {
    variants: {
      variant: {
        default: '',
        secondary: '',
        outline: '',
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
      // Default variants - using filled backgrounds (previously solid)
      {
        variant: 'default',
        theme: 'primary',
        className: 'bg-willow-primary-950 text-white',
      },
      {
        variant: 'default',
        theme: 'neutral',
        className: 'bg-neutral-700 text-white',
      },
      {
        variant: 'default',
        theme: 'success',
        className: 'bg-success-600 text-white',
      },
      {
        variant: 'default',
        theme: 'warning',
        className: 'bg-warning-600 text-oxford-blue-950',
      },
      {
        variant: 'default',
        theme: 'danger',
        className: 'bg-danger text-white',
      },
      {
        variant: 'default',
        theme: 'info',
        className: 'bg-info-600 text-white',
      },
      // Secondary variants - lighter backgrounds with colored text (previously soft)
      {
        variant: 'secondary',
        theme: 'primary',
        className: 'bg-willow-primary-50 text-willow-primary-800',
      },
      {
        variant: 'secondary',
        theme: 'neutral',
        className: 'bg-neutral-100 text-neutral-700',
      },
      {
        variant: 'secondary',
        theme: 'success',
        className: 'bg-state-success-lighter text-success-700',
      },
      {
        variant: 'secondary',
        theme: 'warning',
        className: 'bg-state-warning-lighter text-warning-700',
      },
      {
        variant: 'secondary',
        theme: 'danger',
        className: 'bg-state-error-lighter text-destructive-700',
      },
      {
        variant: 'secondary',
        theme: 'info',
        className: 'bg-info-100 text-info-700',
      },
      // Outline variants - border with colored text
      {
        variant: 'outline',
        theme: 'primary',
        className: 'border border-willow-primary-300 text-willow-primary-700 bg-white',
      },
      {
        variant: 'outline',
        theme: 'neutral',
        className: 'border border-neutral-300 text-neutral-600 bg-white',
      },
      {
        variant: 'outline',
        theme: 'success',
        className: 'border border-success-300 text-success-700 bg-white',
      },
      {
        variant: 'outline',
        theme: 'warning',
        className: 'border border-warning-300 text-warning-700 bg-white',
      },
      {
        variant: 'outline',
        theme: 'danger',
        className: 'border border-destructive-300 text-destructive-700 bg-white',
      },
      {
        variant: 'outline',
        theme: 'info',
        className: 'border border-info-300 text-info-600 bg-white',
      },
    ],
    defaultVariants: {
      variant: 'default',
      theme: 'primary',
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
 * <Badge icon={<CheckCircle />} theme="success">
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
 * <Badge dot theme="warning">
 *   In Progress
 * </Badge>
 * 
 * Features:
 * - Three visual variants (default, secondary, outline)
 * - Six semantic themes
 * - Icon support with positioning
 * - Closable badges
 * - Dot indicators
 * - Two shape options (rounded-full, rounded-md)
 * 
 * @param {BadgeProps} props - Component props
 * @param {string} [props.variant='default'] - Visual variant
 * @param {string} [props.theme='primary'] - Theme color
 * @param {string} [props.size='md'] - Size variant
 * @param {string} [props.rounded='full'] - Border radius style
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {'left' | 'right'} [props.iconPosition='left'] - Icon position
 * @param {boolean} [props.closable] - Show close button
 * @param {Function} [props.onClose] - Close handler
 * @param {boolean} [props.dot] - Show dot indicator
 * @param {React.ReactNode} props.children - Badge content
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    theme, 
    size, 
    rounded,
    icon,
    iconPosition = 'left',
    closable,
    onClose,
    dot,
    children,
    ...props 
  }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(badgeVariants({ variant, theme, size, rounded }), className)} 
        {...props}
      >
        {dot && (
          <span className={cn(
            "w-[0.375em] h-[0.375em] rounded-full",
            variant === 'default' ? 'bg-white/80' : 
            variant === 'secondary' ? 'bg-current opacity-80' : 
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
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };