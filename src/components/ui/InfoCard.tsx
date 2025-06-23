import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// InfoCard component - a small card for displaying info/warnings
const infoCardVariants = cva(
  'flex items-center gap-2 p-2 rounded-lg border',
  {
    variants: {
      variant: {
        default: 'bg-white border-neutral-200',
        info: 'bg-info-50 border-info-200 text-info-900',
        success: 'bg-state-success-lighter border-green-200 text-green-900',
        warning: 'bg-state-warning-lighter border-orange-200 text-orange-900',
        danger: 'bg-state-error-lighter border-red-200 text-red-900',
      },
      size: {
        sm: 'text-xs p-1.5',
        md: 'text-sm p-2',
        lg: 'text-base p-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const infoCardIconVariants = cva(
  'shrink-0',
  {
    variants: {
      variant: {
        default: 'text-neutral-600',
        info: 'text-info-600',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
      },
      size: {
        sm: 'w-[0.89em] h-[0.89em]',
        md: 'w-[0.89em] h-[0.89em]',
        lg: 'w-[0.89em] h-[0.89em]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InfoCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof infoCardVariants> {
  icon?: React.ReactNode;
  showIcon?: boolean;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}

export const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ className, variant, size, icon, showIcon = true, live, atomic, children, ...props }, ref) => {
    const defaultIcons = {
      default: <Info />,
      info: <Info />,
      success: <CheckCircle />,
      warning: <AlertTriangle />,
      danger: <XCircle />,
    };

    const iconToRender = icon || (showIcon && defaultIcons[variant || 'default']);
    
    // Determine aria-live based on variant if not explicitly set
    const ariaLive = live || (variant === 'danger' || variant === 'warning' ? 'assertive' : 
                              variant === 'success' || variant === 'info' ? 'polite' : undefined);

    return (
      <div
        ref={ref}
        className={cn(infoCardVariants({ variant, size }), className)}
        role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
        aria-live={ariaLive}
        aria-atomic={atomic}
        {...props}
      >
        {iconToRender && (
          <span className={cn(infoCardIconVariants({ variant, size }), 'flex-shrink-0 [&>svg]:w-full [&>svg]:h-full')} aria-hidden="true">
            {iconToRender}
          </span>
        )}
        <div className="flex-1">{children}</div>
      </div>
    );
  }
);
InfoCard.displayName = 'InfoCard';

// Alert Banner - for full-width alerts like "Call 911"
const alertBannerVariants = cva(
  'px-4 py-1 text-center font-bold',
  {
    variants: {
      variant: {
        danger: 'bg-danger text-white',
        warning: 'bg-warning text-white',
        info: 'bg-info-600 text-white',
        success: 'bg-success text-white',
      },
      size: {
        sm: 'text-xs py-0.5',
        md: 'text-sm py-1',
        lg: 'text-base py-1.5',
      },
    },
    defaultVariants: {
      variant: 'danger',
      size: 'md',
    },
  }
);

export interface AlertBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertBannerVariants> {}

export const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(alertBannerVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
AlertBanner.displayName = 'AlertBanner';