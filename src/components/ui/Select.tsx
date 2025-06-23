'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const selectTriggerVariants = cva(
  'flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        error: 'border-destructive focus:ring-destructive/20',
        success: 'border-success focus:ring-success/20',
      },
      size: {
        sm: 'h-9 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-11 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const selectContentVariants = cva(
  'absolute z-50 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
  {
    variants: {
      position: {
        top: 'bottom-full mb-1',
        bottom: 'top-full mt-1',
      },
    },
    defaultVariants: {
      position: 'bottom',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof selectTriggerVariants> {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  name?: string;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className,
      options,
      value: controlledValue,
      defaultValue = '',
      placeholder = 'Select an option',
      onChange,
      disabled,
      variant,
      size,
      error,
      success,
      name,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;
    const computedVariant = error ? 'error' : success ? 'success' : variant;
    
    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption?.label || placeholder;

    const handleSelect = (optionValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(optionValue);
      }
      onChange?.(optionValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    // Handle click outside
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          !triggerRef.current?.contains(target) &&
          !contentRef.current?.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Handle escape key
    React.useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    return (
      <div ref={ref} className="relative" {...props}>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="select-listbox"
          disabled={disabled}
          className={cn(selectTriggerVariants({ variant: computedVariant, size }), className)}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            } else if (e.key === 'ArrowDown' && !isOpen) {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <span className={cn(!selectedOption && 'text-muted-foreground')}>
            {displayValue}
          </span>
          <ChevronDown 
            className={cn(
              'h-4 w-4 opacity-50 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            ref={contentRef}
            id="select-listbox"
            role="listbox"
            className={cn(selectContentVariants())}
            style={{ maxHeight: '300px', overflowY: 'auto' }}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                aria-disabled={option.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  option.disabled && 'pointer-events-none opacity-50',
                  value === option.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => !option.disabled && handleSelect(option.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !option.disabled) {
                    e.preventDefault();
                    handleSelect(option.value);
                  } else if (e.key === 'ArrowDown' && index < options.length - 1) {
                    e.preventDefault();
                    const nextOption = contentRef.current?.querySelector(`[role="option"]:nth-child(${index + 2})`) as HTMLElement;
                    nextOption?.focus();
                  } else if (e.key === 'ArrowUp' && index > 0) {
                    e.preventDefault();
                    const prevOption = contentRef.current?.querySelector(`[role="option"]:nth-child(${index})`) as HTMLElement;
                    prevOption?.focus();
                  }
                }}
                tabIndex={0}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === option.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option.label}
              </div>
            ))}
          </div>
        )}

        {name && (
          <input
            type="hidden"
            name={name}
            value={value}
          />
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select, selectTriggerVariants };