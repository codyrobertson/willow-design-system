'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * 
 * A flexible, themeable button component with multiple variants, sizes, and states.
 * Supports icons, loading states, and can be rendered as different HTML elements.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * // With theme and variant
 * <Button theme="primary" variant="fancy">Get Started</Button>
 * 
 * // With icons
 * <Button leftIcon={<Icon name="rocket" />} rightIcon={<Icon name="arrow-right" />}>
 *   Launch
 * </Button>
 * 
 * // Loading state
 * <Button loading>Processing...</Button>
 * 
 * // As a link
 * <Button asChild>
 *   <a href="/home">Go Home</a>
 * </Button>
 * ```
 */

const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-normal outline-none transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-60 group',
  {
    variants: {
      theme: {
        primary: '',
        danger: '',
        warning: '',
        info: '',
        dark: '',
        neutral: '',
        success: '',
      },
      variant: {
        default: '',
        secondary: '',
        outline: 'bg-transparent',
        ghost: 'bg-transparent',
        link: 'bg-transparent underline-offset-4 hover:underline',
        fancy: '',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        compact: 'h-9 w-9',
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
        full: 'rounded-full',
      },
    },
    compoundVariants: [
      // Primary Theme
      { 
        theme: 'primary', 
        variant: 'default', 
        className: 'bg-white text-willow-primary-950 border border-willow-primary-200 shadow-button-secondary hover:bg-neutral-50 hover:shadow-button-secondary-hover active:bg-neutral-100 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'primary', 
        variant: 'secondary', 
        className: 'text-willow-primary-950 bg-willow-primary-200 hover:bg-willow-primary-300 active:bg-willow-primary-400' 
      },
      { 
        theme: 'primary', 
        variant: 'outline', 
        className: 'text-willow-primary-950 border border-willow-primary-950 hover:bg-willow-primary-50 active:bg-willow-primary-100' 
      },
      { 
        theme: 'primary', 
        variant: 'ghost', 
        className: 'text-willow-primary-700 hover:bg-willow-primary-50 active:bg-willow-primary-100' 
      },
      { 
        theme: 'primary', 
        variant: 'fancy', 
        className: 'bg-gradient-to-b from-willow-primary-800 to-willow-primary-950 text-white font-medium shadow-button-fancy hover:from-willow-primary-700 hover:to-willow-primary-900 active:from-willow-primary-900 active:to-willow-primary-950'
      },
      
      // Danger Theme
      { 
        theme: 'danger', 
        variant: 'default', 
        className: 'bg-white text-destructive-500 border border-destructive-200 shadow-button-secondary hover:bg-destructive-50 hover:shadow-button-secondary-hover active:bg-destructive-100 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'danger', 
        variant: 'secondary', 
        className: 'text-destructive-500 bg-destructive-100 hover:bg-destructive-200 active:bg-destructive-300' 
      },
      { 
        theme: 'danger', 
        variant: 'outline', 
        className: 'text-destructive-500 border border-destructive-500 hover:bg-destructive-50 active:bg-destructive-100' 
      },
      { 
        theme: 'danger', 
        variant: 'ghost', 
        className: 'text-destructive-500 hover:bg-state-error-lighter active:bg-destructive-100' 
      },
      { 
        theme: 'danger', 
        variant: 'fancy', 
        className: 'bg-gradient-to-b from-destructive-800 to-destructive-950 text-white font-medium shadow-button-fancy hover:from-destructive-700 hover:to-destructive-900 active:from-destructive-900 active:to-destructive-950' 
      },
      
      // Warning Theme
      { 
        theme: 'warning', 
        variant: 'default', 
        className: 'bg-white text-warning border border-warning/30 shadow-button-secondary hover:bg-state-warning-lighter hover:shadow-button-secondary-hover active:bg-warning/10 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'warning', 
        variant: 'secondary', 
        className: 'text-warning bg-warning/10 hover:bg-warning/20 active:bg-warning/30' 
      },
      { 
        theme: 'warning', 
        variant: 'outline', 
        className: 'text-warning border border-warning hover:bg-state-warning-lighter active:bg-warning/10' 
      },
      { 
        theme: 'warning', 
        variant: 'ghost', 
        className: 'text-warning hover:bg-state-warning-lighter active:bg-warning/10' 
      },
      { 
        theme: 'warning', 
        variant: 'fancy', 
        className: 'bg-gradient-to-b from-warning-800 to-warning-900 text-white font-medium shadow-button-fancy hover:from-warning-700 hover:to-warning-800 active:from-warning-900 active:to-warning-900' 
      },
      
      // Info Theme
      { 
        theme: 'info', 
        variant: 'default', 
        className: 'bg-white text-info-950 border border-info-200 shadow-button-secondary hover:bg-info-50 hover:shadow-button-secondary-hover active:bg-info-100 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'info', 
        variant: 'secondary', 
        className: 'text-info-950 bg-info-100 hover:bg-info-200 active:bg-info-300' 
      },
      { 
        theme: 'info', 
        variant: 'outline', 
        className: 'text-info-800 border border-info-500 hover:bg-info-50 active:bg-info-100' 
      },
      { 
        theme: 'info', 
        variant: 'ghost', 
        className: 'text-info-600 hover:bg-info-50 active:bg-info-100' 
      },
      { 
        theme: 'info', 
        variant: 'fancy', 
        className: 'bg-gradient-to-b from-info-800 to-info-950 text-white font-medium shadow-button-fancy hover:from-info-700 hover:to-info-900 active:from-info-900 active:to-info-950' 
      },
      
      // Dark Theme
      { 
        theme: 'dark', 
        variant: 'default', 
        className: 'bg-white text-neutral-950 border border-neutral-300 shadow-button-secondary hover:bg-neutral-50 hover:shadow-button-secondary-hover active:bg-neutral-100 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'dark', 
        variant: 'secondary', 
        className: 'text-neutral-950 bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400' 
      },
      { 
        theme: 'dark', 
        variant: 'outline', 
        className: 'text-neutral-950 border border-neutral-950 hover:bg-neutral-50 active:bg-neutral-100' 
      },
      { 
        theme: 'dark', 
        variant: 'ghost', 
        className: 'text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300' 
      },
      { 
        theme: 'dark', 
        variant: 'link', 
        className: 'text-neutral-900' 
      },
      { 
        theme: 'dark', 
        variant: 'fancy', 
        className: 'bg-gradient-to-b from-neutral-800 to-neutral-950 text-white font-medium shadow-button-fancy hover:from-neutral-700 hover:to-neutral-900 active:from-neutral-900 active:to-neutral-950' 
      },
      
      // Success Theme
      { 
        theme: 'success', 
        variant: 'default', 
        className: 'bg-white text-success border border-success/30 shadow-button-secondary hover:bg-state-success-lighter hover:shadow-button-secondary-hover active:bg-success/10 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'success', 
        variant: 'secondary', 
        className: 'text-success bg-state-success-lighter hover:bg-success/20 active:bg-success/30' 
      },
      { 
        theme: 'success', 
        variant: 'outline', 
        className: 'text-success border border-success hover:bg-state-success-lighter active:bg-success/10' 
      },
      { 
        theme: 'success', 
        variant: 'ghost', 
        className: 'text-success hover:bg-state-success-lighter active:bg-success/10' 
      },
      { 
        theme: 'success', 
        variant: 'fancy', 
        className: 'bg-gradient-to-b from-success-800 to-success-900 text-white font-medium shadow-button-fancy hover:from-success-700 hover:to-success-800 active:from-success-900 active:to-success-900' 
      },
      
      // Neutral Theme
      { 
        theme: 'neutral', 
        variant: 'secondary', 
        className: 'text-neutral-600 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300' 
      },
    ],
    defaultVariants: {
      theme: 'primary',
      variant: 'default',
      size: 'md',
      radius: 'md',
    },
  }
);

const innerShadowVariants = cva('absolute inset-0 pointer-events-none transition-all duration-200', {
  variants: {
    theme: {
      primary: 'shadow-[inset_0px_-2px_0px_0px_rgba(35,14,103,0.08)] group-hover:shadow-[inset_0px_-2.4px_0px_0px_rgba(35,14,103,0.12)] group-active:shadow-[inset_0px_-4px_0px_0px_rgba(35,14,103,0.25)]',
      danger: 'shadow-[inset_0px_-2px_0px_0px_rgba(235,87,87,0.08)] group-hover:shadow-[inset_0px_-2.4px_0px_0px_rgba(235,87,87,0.12)] group-active:shadow-[inset_0px_-4px_0px_0px_rgba(235,87,87,0.25)]',
      warning: 'shadow-[inset_0px_-2px_0px_0px_rgba(255,132,71,0.08)] group-hover:shadow-[inset_0px_-2.4px_0px_0px_rgba(255,132,71,0.12)] group-active:shadow-[inset_0px_-4px_0px_0px_rgba(255,132,71,0.25)]',
      info: 'shadow-[inset_0px_-2px_0px_0px_rgba(118,102,255,0.08)] group-hover:shadow-[inset_0px_-2.4px_0px_0px_rgba(118,102,255,0.12)] group-active:shadow-[inset_0px_-4px_0px_0px_rgba(118,102,255,0.25)]',
      dark: 'shadow-[inset_0px_-2px_0px_0px_rgba(69,96,117,0.08)] group-hover:shadow-[inset_0px_-2.4px_0px_0px_rgba(69,96,117,0.12)] group-active:shadow-[inset_0px_-4px_0px_0px_rgba(69,96,117,0.25)]',
      neutral: 'shadow-[inset_0px_-2px_0px_0px_rgba(108,137,152,0.08)] group-hover:shadow-[inset_0px_-2.4px_0px_0px_rgba(108,137,152,0.12)] group-active:shadow-[inset_0px_-4px_0px_0px_rgba(108,137,152,0.25)]',
      success: 'shadow-[inset_0px_-2px_0px_0px_rgba(31,193,107,0.08)] group-hover:shadow-[inset_0px_-2.4px_0px_0px_rgba(31,193,107,0.12)] group-active:shadow-[inset_0px_-4px_0px_0px_rgba(31,193,107,0.25)]',
    },
    variant: {
        default: '',
        secondary: 'opacity-0',
        outline: 'opacity-0',
        ghost: 'opacity-0',
        link: 'opacity-0',
        fancy: 'opacity-0',
    },
    radius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      full: 'rounded-full',
    }
  },
  defaultVariants: {
    theme: 'primary',
    variant: 'default',
    radius: 'md'
  },
});

const linkVariants = cva(
  'bg-transparent underline-offset-4 hover:underline',
  {
      variants: {
          theme: {
              primary: 'text-willow-primary-600',
              danger: 'text-destructive-500',
              warning: 'text-warning',
              info: 'text-info-600',
              dark: 'text-neutral-900',
              neutral: 'text-neutral-500',
              success: 'text-success',
          }
      },
      defaultVariants: {
          theme: 'primary',
      },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component (using Radix Slot) */
  asChild?: boolean;
  /** Show loading spinner and disable interactions */
  loading?: boolean;
  /** Icon to display on the left side of the button */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side of the button */
  rightIcon?: React.ReactNode;
  /** Border radius preset */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Make button take full width of its container */
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      theme,
      variant,
      size,
      radius,
      asChild = false,
      loading,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const iconOnly = !children && (leftIcon || rightIcon);
    const buttonClassName = cn(
      buttonVariants({ theme, variant, size, radius, className }), 
      iconOnly && 'px-0',
      fullWidth && 'w-full'
    );
    const isFancy = variant === 'fancy';


    if (asChild) {
      return (
        <Slot
          className={buttonClassName}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={buttonClassName}
        ref={ref}
        {...props}
        disabled={props.disabled || loading}
        aria-busy={loading || undefined}
      >
        <div className={cn(innerShadowVariants({theme: theme || 'primary', variant, radius}))} />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className={cn(
            'relative z-10 flex items-center gap-2',
            iconOnly ? 'justify-center' : ''
          )}>
            {leftIcon && <span className="flex-shrink-0 [&>svg]:w-[1em] [&>svg]:h-[1em]">{leftIcon}</span>}
            {!iconOnly && children}
            {rightIcon && <span className="flex-shrink-0 [&>svg]:w-[1em] [&>svg]:h-[1em]">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };