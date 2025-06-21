'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  BaseComponentProps, 
  FormComponentProps,
  StyledComponentProps,
  ControlledState
} from '@/components/primitives/types';

const checkboxVariants = cva(
  'peer shrink-0 rounded border ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
  {
    variants: {
      variant: {
        default: 'border-input bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary',
        primary: 'border-primary bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary',
        secondary: 'border-input bg-background data-[state=checked]:bg-secondary data-[state=checked]:border-secondary',
        destructive: 'border-input bg-background data-[state=checked]:bg-destructive data-[state=checked]:border-destructive',
        outline: 'border-primary bg-background data-[state=checked]:bg-background data-[state=checked]:border-primary',
        ghost: 'border-transparent bg-transparent data-[state=checked]:bg-accent data-[state=checked]:border-accent',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const checkIconVariants = cva(
  'absolute left-0 top-0 pointer-events-none',
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        primary: 'text-primary-foreground',
        secondary: 'text-secondary-foreground',
        destructive: 'text-destructive-foreground',
        outline: 'text-primary',
        ghost: 'text-accent-foreground',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type CheckedState = boolean | 'indeterminate';

export interface CheckboxProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange' | 'checked' | 'defaultChecked'>,
    BaseComponentProps,
    FormComponentProps,
    StyledComponentProps,
    VariantProps<typeof checkboxVariants> {
  indeterminate?: boolean;
  onCheckedChange?: (checked: CheckedState) => void;
}

export type ControlledCheckboxProps = CheckboxProps & ControlledState<CheckedState>;

export const Checkbox = React.forwardRef<HTMLInputElement, ControlledCheckboxProps>(
  ({ 
    className, 
    variant, 
    size,
    checked: controlledChecked,
    defaultChecked = false,
    indeterminate = false,
    onCheckedChange,
    disabled,
    id,
    name,
    required,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    ...props 
  }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    
    // Handle indeterminate state
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);
    
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked === true : internalChecked;
    const checkState: CheckedState = indeterminate ? 'indeterminate' : checked;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      
      onCheckedChange?.(indeterminate ? 'indeterminate' : newChecked);
    };
    
    return (
      <div className="relative inline-flex">
        <input
          ref={inputRef}
          type="checkbox"
          className={cn(checkboxVariants({ variant, size }), className)}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          id={id}
          name={name}
          required={required}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-describedby={ariaDescribedby}
          aria-checked={indeterminate ? 'mixed' : checked}
          data-state={checkState === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
          {...props}
        />
        {checkState === 'indeterminate' ? (
          <Minus className={cn(checkIconVariants({ variant, size }), 'p-0.5')} />
        ) : checked ? (
          <Check className={cn(checkIconVariants({ variant, size }))} />
        ) : null}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { checkboxVariants };