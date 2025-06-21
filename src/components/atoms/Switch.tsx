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

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        primary: 'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        secondary: 'data-[state=checked]:bg-secondary data-[state=unchecked]:bg-input',
        destructive: 'data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input',
        outline: 'border-input data-[state=checked]:border-primary data-[state=unchecked]:border-input',
        ghost: 'data-[state=checked]:bg-accent data-[state=unchecked]:bg-transparent',
      },
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
      status: {
        default: '',
        success: 'data-[state=checked]:bg-success data-[state=unchecked]:bg-input',
        warning: 'data-[state=checked]:bg-warning data-[state=unchecked]:bg-input',
        error: 'data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input',
        info: 'data-[state=checked]:bg-info data-[state=unchecked]:bg-input',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      status: 'default',
    },
  }
);

const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform',
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
        md: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        lg: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SwitchProps 
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'>,
    BaseComponentProps,
    FormComponentProps,
    StyledComponentProps,
    VariantProps<typeof switchVariants> {
  value?: string;
  onCheckedChange?: (checked: boolean) => void;
}

// Properly typed controlled/uncontrolled switch
export type ControlledSwitchProps = SwitchProps & ControlledState<boolean>;

export const Switch = React.forwardRef<HTMLButtonElement, ControlledSwitchProps>(
  ({ 
    className, 
    variant, 
    size,
    status,
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    disabled,
    id,
    name,
    value = 'on',
    required,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    ...props 
  }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : internalChecked;
    
    const handleClick = () => {
      const newChecked = !checked;
      
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      
      onCheckedChange?.(newChecked);
    };
    
    return (
      <>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-required={required}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-describedby={ariaDescribedby}
          data-state={checked ? 'checked' : 'unchecked'}
          disabled={disabled}
          id={id}
          className={cn(switchVariants({ variant, size, status }), className)}
          onClick={handleClick}
          {...props}
        >
          <span
            data-state={checked ? 'checked' : 'unchecked'}
            className={switchThumbVariants({ size })}
          />
        </button>
        {name && (
          <input
            type="checkbox"
            aria-hidden="true"
            tabIndex={-1}
            name={name}
            value={value}
            checked={checked}
            onChange={() => {}} // Controlled by button
            style={{ position: 'absolute', pointerEvents: 'none', opacity: 0 }}
          />
        )}
      </>
    );
  }
);
Switch.displayName = 'Switch';

// Toggle is an alias for Switch
export const Toggle = Switch;

export { switchVariants };