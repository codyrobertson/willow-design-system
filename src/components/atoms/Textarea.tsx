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

const textareaVariants = cva(
  'flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
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
        sm: 'min-h-[60px] text-xs py-1.5',
        md: 'min-h-[80px]',
        lg: 'min-h-[100px] text-base py-3',
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

export interface TextareaProps 
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>,
    BaseComponentProps,
    FormComponentProps,
    StyledComponentProps,
    VariantProps<typeof textareaVariants> {
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

// Properly typed controlled/uncontrolled textarea
export type ControlledTextareaProps = TextareaProps & ControlledState<string>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, ControlledTextareaProps>(
  ({ 
    className, 
    variant, 
    size,
    status,
    resize = 'vertical',
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
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      if (!isControlled) {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue);
    };
    
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];
    
    return (
      <textarea
        ref={ref}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          textareaVariants({ variant, size, status }),
          resizeClass,
          className
        )}
        aria-invalid={status === 'error' || undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { textareaVariants };