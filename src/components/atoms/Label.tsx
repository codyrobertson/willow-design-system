'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { 
  BaseComponentProps, 
  PolymorphicProps,
  StyledComponentProps,
  FormComponentProps
} from '@/components/primitives/types';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        destructive: 'text-destructive',
        muted: 'text-muted-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface LabelProps 
  extends BaseComponentProps,
    StyledComponentProps,
    FormComponentProps,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

type LabelComponent = <C extends React.ElementType = 'label'>(
  props: PolymorphicProps<C, LabelProps>
) => React.ReactElement | null;

/**
 * Label component following Atomic Design principles
 * 
 * @example
 * <Label htmlFor="email">Email</Label>
 * <Label variant="destructive" required>Password</Label>
 */
export const Label: LabelComponent = React.forwardRef(
  <C extends React.ElementType = 'label'>(
    {
      as,
      className,
      variant,
      size,
      required,
      children,
      ...props
    }: PolymorphicProps<C, LabelProps>,
    ref: React.ForwardedRef<any>
  ) => {
    const Component = as || 'label';
    
    return (
      <Component
        ref={ref}
        className={cn(labelVariants({ variant, size }), className)}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Component>
    );
  }
) as LabelComponent;

Label.displayName = 'Label';

export { labelVariants };