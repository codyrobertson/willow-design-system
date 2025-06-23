'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
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
        className: 'text-willow-primary-700 bg-willow-primary-200 hover:bg-willow-primary-300 active:bg-willow-primary-400' 
      },
      { 
        theme: 'primary', 
        variant: 'outline', 
        className: 'text-willow-primary-700 border border-willow-primary-700 hover:bg-willow-primary-50 active:bg-willow-primary-100' 
      },
      { 
        theme: 'primary', 
        variant: 'ghost', 
        className: 'text-willow-primary-700 hover:bg-willow-primary-50 active:bg-willow-primary-100' 
      },
      { 
        theme: 'primary', 
        variant: 'fancy', 
        className: 'bg-willow-primary-900 text-white font-semibold shadow-[0px_1px_3px_0px_rgba(37,62,167,0.2)] hover:bg-willow-primary-800 hover:shadow-[0px_2px_5px_0px_rgba(37,62,167,0.3)] active:bg-willow-primary-950 active:shadow-none'
      },
      
      // Danger Theme
      { 
        theme: 'danger', 
        variant: 'default', 
        className: 'bg-white text-red-600 border border-red-200 shadow-button-secondary hover:bg-red-50 hover:shadow-button-secondary-hover active:bg-red-100 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'danger', 
        variant: 'secondary', 
        className: 'text-red-600 bg-red-100 hover:bg-red-200 active:bg-red-300' 
      },
      { 
        theme: 'danger', 
        variant: 'outline', 
        className: 'text-red-600 border border-red-600 hover:bg-red-50 active:bg-red-100' 
      },
      { 
        theme: 'danger', 
        variant: 'ghost', 
        className: 'text-red-600 hover:bg-red-50 active:bg-red-100' 
      },
      { 
        theme: 'danger', 
        variant: 'fancy', 
        className: 'bg-destructive-600 text-white font-semibold shadow-[0px_1px_3px_0px_rgba(183,55,55,0.4)] hover:bg-destructive-500 hover:shadow-[0px_2px_5px_0px_rgba(183,55,55,0.5)] active:bg-destructive-700 active:shadow-none' 
      },
      
      // Warning Theme
      { 
        theme: 'warning', 
        variant: 'default', 
        className: 'bg-white text-warning-800 border border-warning-200 shadow-button-secondary hover:bg-state-warning-lighter hover:shadow-button-secondary-hover active:bg-warning/10 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'warning', 
        variant: 'secondary', 
        className: 'text-warning-800 bg-warning-100 hover:bg-warning-200 active:bg-warning-300' 
      },
      { 
        theme: 'warning', 
        variant: 'outline', 
        className: 'text-warning-800 border border-warning-800 hover:bg-state-warning-lighter active:bg-warning/10' 
      },
      { 
        theme: 'warning', 
        variant: 'ghost', 
        className: 'text-warning-800 hover:bg-state-warning-lighter active:bg-warning/10' 
      },
      { 
        theme: 'warning', 
        variant: 'fancy', 
        className: 'bg-warning-600 text-white font-semibold shadow-[0px_1px_3px_0px_rgba(255,132,71,0.3)] hover:bg-warning-500 hover:shadow-[0px_2px_5px_0px_rgba(255,132,71,0.4)] active:bg-warning-700 active:shadow-none' 
      },
      
      // Info Theme
      { 
        theme: 'info', 
        variant: 'default', 
        className: 'bg-white text-info-600 border border-info-200 shadow-button-secondary hover:bg-info-50 hover:shadow-button-secondary-hover active:bg-info-100 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'info', 
        variant: 'secondary', 
        className: 'text-info-600 bg-info-100 hover:bg-info-200 active:bg-info-300' 
      },
      { 
        theme: 'info', 
        variant: 'outline', 
        className: 'text-info-600 border border-info-600 hover:bg-info-50 active:bg-info-100' 
      },
      { 
        theme: 'info', 
        variant: 'ghost', 
        className: 'text-info-600 hover:bg-info-50 active:bg-info-100' 
      },
      { 
        theme: 'info', 
        variant: 'fancy', 
        className: 'bg-info-600 text-white font-semibold shadow-[0px_1px_3px_0px_rgba(118,102,255,0.2)] hover:bg-info-500 hover:shadow-[0px_2px_5px_0px_rgba(118,102,255,0.3)] active:bg-info-700 active:shadow-none' 
      },
      
      // Dark Theme (inverse - dark backgrounds with light text)
      { 
        theme: 'dark', 
        variant: 'default', 
        className: 'bg-neutral-900 text-white border border-neutral-700 shadow-button-secondary hover:bg-neutral-800 hover:shadow-button-secondary-hover active:bg-neutral-950 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'dark', 
        variant: 'secondary', 
        className: 'text-white bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-800' 
      },
      { 
        theme: 'dark', 
        variant: 'outline', 
        className: 'text-neutral-900 border border-neutral-900 hover:bg-neutral-50 active:bg-neutral-100' 
      },
      { 
        theme: 'dark', 
        variant: 'ghost', 
        className: 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200' 
      },
      { 
        theme: 'dark', 
        variant: 'link', 
        className: 'text-neutral-900' 
      },
      { 
        theme: 'dark', 
        variant: 'fancy', 
        className: 'bg-neutral-900 text-white font-semibold shadow-[0px_1px_3px_0px_rgba(69,96,117,0.2)] hover:bg-neutral-800 hover:shadow-[0px_2px_5px_0px_rgba(69,96,117,0.3)] active:bg-neutral-950 active:shadow-none' 
      },
      
      // Success Theme
      { 
        theme: 'success', 
        variant: 'default', 
        className: 'bg-white text-success-800 border border-success-200 shadow-button-secondary hover:bg-state-success-lighter hover:shadow-button-secondary-hover active:bg-success/10 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'success', 
        variant: 'secondary', 
        className: 'text-success-800 bg-state-success-lighter hover:bg-success/20 active:bg-success/30' 
      },
      { 
        theme: 'success', 
        variant: 'outline', 
        className: 'text-success-800 border border-success-800 hover:bg-state-success-lighter active:bg-success/10' 
      },
      { 
        theme: 'success', 
        variant: 'ghost', 
        className: 'text-success-800 hover:bg-state-success-lighter active:bg-success/10' 
      },
      { 
        theme: 'success', 
        variant: 'fancy', 
        className: 'bg-success-600 text-white font-semibold shadow-[0px_1px_3px_0px_rgba(31,193,107,0.2)] hover:bg-success-500 hover:shadow-[0px_2px_5px_0px_rgba(31,193,107,0.3)] active:bg-success-700 active:shadow-none' 
      },
      
      // Neutral Theme
      { 
        theme: 'neutral', 
        variant: 'default', 
        className: 'bg-white text-neutral-700 border border-neutral-300 shadow-button-secondary hover:bg-neutral-50 hover:shadow-button-secondary-hover active:bg-neutral-100 active:shadow-button-secondary-active' 
      },
      { 
        theme: 'neutral', 
        variant: 'secondary', 
        className: 'text-neutral-600 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300' 
      },
      { 
        theme: 'neutral', 
        variant: 'outline', 
        className: 'text-neutral-700 border border-neutral-700 hover:bg-neutral-50 active:bg-neutral-100' 
      },
      { 
        theme: 'neutral', 
        variant: 'ghost', 
        className: 'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200' 
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
        outline: '',
        ghost: '',
        link: '',
        fancy: '',
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
  compoundVariants: [
    // Default variant inner shadows - enhanced hover (grows slightly) and smaller press effect
    { theme: 'primary', variant: 'default', className: 'shadow-[inset_0px_-2px_0px_0px_rgba(35,14,103,0.08)] group-hover:shadow-[inset_0px_-3px_0px_0px_rgba(35,14,103,0.15)] group-active:shadow-[inset_0px_-1px_0px_0px_rgba(35,14,103,0.3)]' },
    { theme: 'danger', variant: 'default', className: 'shadow-[inset_0px_-2px_0px_0px_rgba(235,87,87,0.08)] group-hover:shadow-[inset_0px_-3px_0px_0px_rgba(235,87,87,0.15)] group-active:shadow-[inset_0px_-1px_0px_0px_rgba(235,87,87,0.3)]' },
    { theme: 'warning', variant: 'default', className: 'shadow-[inset_0px_-2px_0px_0px_rgba(255,132,71,0.08)] group-hover:shadow-[inset_0px_-3px_0px_0px_rgba(255,132,71,0.15)] group-active:shadow-[inset_0px_-1px_0px_0px_rgba(255,132,71,0.3)]' },
    { theme: 'info', variant: 'default', className: 'shadow-[inset_0px_-2px_0px_0px_rgba(118,102,255,0.08)] group-hover:shadow-[inset_0px_-3px_0px_0px_rgba(118,102,255,0.15)] group-active:shadow-[inset_0px_-1px_0px_0px_rgba(118,102,255,0.3)]' },
    { theme: 'dark', variant: 'default', className: 'shadow-[inset_0px_-2px_0px_0px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_0px_-3px_0px_0px_rgba(255,255,255,0.15)] group-active:shadow-[inset_0px_-1px_0px_0px_rgba(255,255,255,0.25)]' },
    { theme: 'neutral', variant: 'default', className: 'shadow-[inset_0px_-2px_0px_0px_rgba(108,137,152,0.08)] group-hover:shadow-[inset_0px_-3px_0px_0px_rgba(108,137,152,0.15)] group-active:shadow-[inset_0px_-1px_0px_0px_rgba(108,137,152,0.3)]' },
    { theme: 'success', variant: 'default', className: 'shadow-[inset_0px_-2px_0px_0px_rgba(31,193,107,0.08)] group-hover:shadow-[inset_0px_-3px_0px_0px_rgba(31,193,107,0.15)] group-active:shadow-[inset_0px_-1px_0px_0px_rgba(31,193,107,0.3)]' },
    
    // Fancy variant theme-aware inner shadows - enhanced hover (grows slightly) and smaller press effect
    { theme: 'primary', variant: 'fancy', className: 'shadow-[inset_0px_-2.4px_7.5px_0px_rgba(122,196,230,0.46)] group-hover:shadow-[inset_0px_-3px_8px_0px_rgba(122,196,230,0.55)] group-active:shadow-[inset_0px_1px_3px_0px_rgba(37,62,167,0.4)]' },
    { theme: 'danger', variant: 'fancy', className: 'shadow-[inset_0px_-2.4px_7.5px_0px_rgba(255,150,150,0.5)] group-hover:shadow-[inset_0px_-3px_8px_0px_rgba(255,150,150,0.65)] group-active:shadow-[inset_0px_1px_3px_0px_rgba(183,55,55,0.6)]' },
    { theme: 'warning', variant: 'fancy', className: 'shadow-[inset_0px_-2.4px_7.5px_0px_rgba(255,200,122,0.46)] group-hover:shadow-[inset_0px_-3px_8px_0px_rgba(255,200,122,0.55)] group-active:shadow-[inset_0px_1px_3px_0px_rgba(255,132,71,0.4)]' },
    { theme: 'info', variant: 'fancy', className: 'shadow-[inset_0px_-2.4px_7.5px_0px_rgba(150,180,255,0.46)] group-hover:shadow-[inset_0px_-3px_8px_0px_rgba(150,180,255,0.55)] group-active:shadow-[inset_0px_1px_3px_0px_rgba(118,102,255,0.4)]' },
    { theme: 'dark', variant: 'fancy', className: 'shadow-[inset_0px_-2.4px_7.5px_0px_rgba(255,255,255,0.2)] group-hover:shadow-[inset_0px_-3px_8px_0px_rgba(255,255,255,0.25)] group-active:shadow-[inset_0px_1px_3px_0px_rgba(0,0,0,0.4)]' },
    { theme: 'success', variant: 'fancy', className: 'shadow-[inset_0px_-2.4px_7.5px_0px_rgba(150,255,180,0.46)] group-hover:shadow-[inset_0px_-3px_8px_0px_rgba(150,255,180,0.55)] group-active:shadow-[inset_0px_1px_3px_0px_rgba(31,193,107,0.4)]' },
  ],
  defaultVariants: {
    theme: 'primary',
    variant: 'default',
    radius: 'md'
  },
});

// Note: linkVariants is defined but not currently used.
// It's available for future link-specific styling implementation.
// const linkVariants = cva(
//   'bg-transparent underline-offset-4 hover:underline',
//   {
//       variants: {
//           theme: {
//               primary: 'text-willow-primary-600',
//               danger: 'text-destructive-500',
//               warning: 'text-warning',
//               info: 'text-info-600',
//               dark: 'text-neutral-900',
//               neutral: 'text-neutral-500',
//               success: 'text-success',
//           }
//       },
//       defaultVariants: {
//           theme: 'primary',
//       },
//   }
// );

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
    // Note: isFancy is available for future fancy-specific styling
    // const isFancy = variant === 'fancy';


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