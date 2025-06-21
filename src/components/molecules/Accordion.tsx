'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, CompoundComponentContext } from '@/components/primitives/types';

/**
 * Accordion variants - simplified and maintainable
 */
const accordionVariants = cva(
  'w-full rounded-lg overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border bg-card',
        elevated: 'shadow-lg bg-card',
        outline: 'border-2 bg-transparent',
        ghost: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface AccordionContextValue {
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const AccordionContext = React.createContext<CompoundComponentContext<AccordionContextValue>>({
  internal: { expanded: false, onToggle: () => {} }
});

/* ---------------------------- */
/*       Root Component         */
/* ---------------------------- */

export interface AccordionProps 
  extends BaseComponentProps,
    VariantProps<typeof accordionVariants> {
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
}

const AccordionRoot = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ 
    className, 
    variant, 
    expanded: controlledExpanded,
    defaultExpanded = false,
    onExpandedChange,
    disabled = false,
    children,
    ...props 
  }, ref) => {
    const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
    const isControlled = controlledExpanded !== undefined;
    const expanded = isControlled ? controlledExpanded : internalExpanded;
    
    const onToggle = React.useCallback(() => {
      if (disabled) return;
      
      const newExpanded = !expanded;
      if (!isControlled) {
        setInternalExpanded(newExpanded);
      }
      onExpandedChange?.(newExpanded);
    }, [expanded, isControlled, disabled, onExpandedChange]);
    
    const contextValue = React.useMemo(
      () => ({ internal: { expanded, onToggle, disabled } }),
      [expanded, onToggle, disabled]
    );

    return (
      <AccordionContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(accordionVariants({ variant }), className)}
          data-state={expanded ? 'open' : 'closed'}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
AccordionRoot.displayName = 'Accordion';

/* ---------------------------- */
/*      Trigger Component       */
/* ---------------------------- */

const triggerVariants = cva(
  'flex w-full items-center justify-between text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'px-4 py-3 hover:bg-accent',
        padded: 'px-6 py-4',
        minimal: 'px-2 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AccordionTriggerProps 
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    VariantProps<typeof triggerVariants> {
  icon?: React.ReactNode;
  showChevron?: boolean;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, variant, icon, showChevron = true, children, disabled, ...props }, ref) => {
    const { internal } = React.useContext(AccordionContext);
    const { expanded, onToggle, disabled: contextDisabled } = internal;
    const isDisabled = disabled || contextDisabled;
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(triggerVariants({ variant }), className)}
        onClick={onToggle}
        disabled={isDisabled}
        aria-expanded={expanded}
        {...props}
      >
        <span className="flex items-center gap-2">
          {icon}
          {children}
        </span>
        {showChevron && (
          <ChevronDown 
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              expanded && 'rotate-180'
            )} 
          />
        )}
      </button>
    );
  }
);
AccordionTrigger.displayName = 'Accordion.Trigger';

/* ---------------------------- */
/*      Content Component       */
/* ---------------------------- */

export interface AccordionContentProps extends BaseComponentProps {
  forceMount?: boolean;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, forceMount = false, children, ...props }, ref) => {
    const { internal } = React.useContext(AccordionContext);
    const { expanded } = internal;
    
    if (!expanded && !forceMount) return null;
    
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden text-sm transition-all',
          expanded ? 'animate-accordion-down' : 'animate-accordion-up',
          className
        )}
        {...props}
      >
        <div className="p-4 pt-0">{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = 'Accordion.Content';

/* ---------------------------- */
/*     Export as Compound       */
/* ---------------------------- */

export const Accordion = Object.assign(AccordionRoot, {
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});

/* ---------------------------- */
/*    Group for Multiple Items  */
/* ---------------------------- */

interface AccordionGroupContextValue {
  value: string | string[] | undefined;
  onValueChange: (itemValue: string, expanded: boolean) => void;
  type: 'single' | 'multiple';
}

const AccordionGroupContext = React.createContext<CompoundComponentContext<AccordionGroupContextValue>>({
  internal: { 
    value: undefined, 
    onValueChange: () => {},
    type: 'single'
  }
});

export interface AccordionGroupProps extends BaseComponentProps {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export const AccordionGroup = React.forwardRef<HTMLDivElement, AccordionGroupProps>(
  ({ 
    className, 
    type = 'single', 
    value: controlledValue,
    defaultValue,
    onValueChange,
    children,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'single' ? '' : [])
    );
    
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    
    const handleValueChange = React.useCallback((itemValue: string, expanded: boolean) => {
      let newValue: string | string[];
      
      if (type === 'single') {
        newValue = expanded ? itemValue : '';
      } else {
        const currentArray = Array.isArray(value) ? value : [];
        if (expanded) {
          newValue = [...currentArray, itemValue];
        } else {
          newValue = currentArray.filter(v => v !== itemValue);
        }
      }
      
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    }, [type, value, isControlled, onValueChange]);
    
    const contextValue = React.useMemo(
      () => ({ internal: { value, onValueChange: handleValueChange, type } }),
      [value, handleValueChange, type]
    );
    
    return (
      <AccordionGroupContext.Provider value={contextValue}>
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {children}
        </div>
      </AccordionGroupContext.Provider>
    );
  }
);
AccordionGroup.displayName = 'AccordionGroup';

/* ---------------------------- */
/*       Item Component         */
/* ---------------------------- */

export interface AccordionItemProps extends AccordionProps {
  value: string;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, ...props }, ref) => {
    const { internal } = React.useContext(AccordionGroupContext);
    const { value: groupValue, onValueChange, type } = internal;
    
    const isExpanded = React.useMemo(() => {
      if (!groupValue) return false;
      if (type === 'single') {
        return groupValue === value;
      }
      return Array.isArray(groupValue) && groupValue.includes(value);
    }, [groupValue, value, type]);
    
    return (
      <Accordion
        ref={ref}
        expanded={isExpanded}
        onExpandedChange={(expanded) => onValueChange(value, expanded)}
        {...props}
      />
    );
  }
);
AccordionItem.displayName = 'AccordionItem';