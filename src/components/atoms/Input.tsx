'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { 
  BaseComponentProps, 
  FormComponentProps,
  StyledComponentProps,
  ControlledState 
} from '@/components/primitives/types';

const inputVariants = cva(
  'flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        primary: 'border-primary focus-visible:ring-primary',
        secondary: 'border-secondary focus-visible:ring-secondary',
        destructive: 'border-destructive focus-visible:ring-destructive',
        outline: 'border-2',
        ghost: 'border-0 bg-transparent',
      },
      size: {
        sm: 'h-9 text-xs',
        md: 'h-10',
        lg: 'h-11 text-base',
      },
      status: {
        default: '',
        success: 'border-success focus-visible:ring-success',
        warning: 'border-warning focus-visible:ring-warning',
        error: 'border-destructive focus-visible:ring-destructive',
        info: 'border-info focus-visible:ring-info',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      status: 'default',
    },
  }
);

export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'>,
    BaseComponentProps,
    FormComponentProps,
    StyledComponentProps,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Properly typed controlled/uncontrolled input
export type ControlledInputProps = InputProps & ControlledState<string>;

export const Input = React.forwardRef<HTMLInputElement, ControlledInputProps>(
  ({ 
    className, 
    variant, 
    size,
    status,
    leftIcon,
    rightIcon,
    value,
    defaultValue,
    onChange,
    ...props 
  }, ref) => {
    // Internal state for uncontrolled mode
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    
    // Determine if controlled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (!isControlled) {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue);
    };
    
    const inputElement = (
      <input
        ref={ref}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          inputVariants({ variant, size, status }),
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className
        )}
        {...props}
      />
    );
    
    if (!leftIcon && !rightIcon) {
      return inputElement;
    }
    
    return (
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </span>
        )}
        {inputElement}
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { inputVariants };