'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { 
  BaseComponentProps, 
  PolymorphicProps,
  StyledComponentProps 
} from '@/components/primitives/types';

/**
 * Button variants following standardized pattern
 * Maximum 10-15 compound variants allowed
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps 
  extends BaseComponentProps,
    StyledComponentProps,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type ButtonComponent = <C extends React.ElementType = 'button'>(
  props: PolymorphicProps<C, ButtonProps>
) => React.ReactElement | null;

/**
 * Button component following Atomic Design principles
 * 
 * @example
 * <Button variant="primary" size="lg">Click me</Button>
 * <Button as="a" href="/home" variant="link">Go home</Button>
 */
export const Button: ButtonComponent = React.forwardRef(
  <C extends React.ElementType = 'button'>(
    {
      as,
      className,
      variant,
      size,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    }: PolymorphicProps<C, ButtonProps>,
    ref: React.ForwardedRef<any>
  ) => {
    const Component = as || 'button';
    
    return (
      <Component
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Component>
    );
  }
) as ButtonComponent;

Button.displayName = 'Button';

export { buttonVariants };