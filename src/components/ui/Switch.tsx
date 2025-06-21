'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        secondary: 'data-[state=checked]:bg-secondary data-[state=unchecked]:bg-input',
        destructive: 'data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input',
        outline: 'border-input data-[state=checked]:border-primary data-[state=unchecked]:border-input',
        success: 'data-[state=checked]:bg-success data-[state=unchecked]:bg-input',
        warning: 'data-[state=checked]:bg-warning data-[state=unchecked]:bg-input',
      },
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
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
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>,
    VariantProps<typeof switchVariants> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
  name?: string;
  value?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      variant,
      size,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      required,
      name,
      value = 'on',
      ...props
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleClick = React.useCallback(() => {
      const newChecked = !checked;
      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    }, [checked, isControlled, onCheckedChange]);

    return (
      <>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-required={required}
          data-state={checked ? 'checked' : 'unchecked'}
          disabled={disabled}
          className={cn(switchVariants({ variant, size }), className)}
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
const Toggle = Switch;

// Labeled Switch component
export interface LabeledSwitchProps extends SwitchProps {
  label: string;
  description?: string;
  labelPosition?: 'left' | 'right';
}

const LabeledSwitch = React.forwardRef<HTMLButtonElement, LabeledSwitchProps>(
  ({ label, description, labelPosition = 'right', className, ...props }, ref) => {
    const id = React.useId();

    if (labelPosition === 'left') {
      return (
        <div className={cn('flex items-center gap-3', className)}>
          <div className="flex-1">
            <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </label>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Switch ref={ref} id={id} {...props} />
        </div>
      );
    }

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Switch ref={ref} id={id} {...props} />
        <div className="flex-1">
          <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    );
  }
);
LabeledSwitch.displayName = 'LabeledSwitch';

export {
  Switch,
  Toggle,
  LabeledSwitch,
  switchVariants,
};