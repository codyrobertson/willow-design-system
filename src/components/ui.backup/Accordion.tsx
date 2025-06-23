import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Accordion Component System
 * 
 * A flexible, composable accordion component for creating collapsible content sections.
 * Supports single or multiple expanded items, custom styling, and full keyboard navigation.
 * 
 * @example
 * ```tsx
 * // Single accordion
 * <Accordion defaultExpanded>
 *   <AccordionTrigger>Section Title</AccordionTrigger>
 *   <AccordionContent>Content goes here</AccordionContent>
 * </Accordion>
 * 
 * // Multiple accordions with single expansion
 * <AccordionGroup type="single" defaultValue="item-1">
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>First Section</AccordionTrigger>
 *     <AccordionContent>First content</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>Second Section</AccordionTrigger>
 *     <AccordionContent>Second content</AccordionContent>
 *   </AccordionItem>
 * </AccordionGroup>
 * ```
 */

// Pure Accordion Container
const accordionVariants = cva(
  'w-full bg-white rounded-[10px] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border border-neutral-100 shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]',
        card: 'shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]',
        ghost: '',
        minimal: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AccordionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionVariants> {
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  collapsible?: boolean;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({
    className,
    variant,
    expanded: controlledExpanded,
    defaultExpanded = false,
    onExpandedChange,
    collapsible = true,
    children,
    ...props
  }, ref) => {
    const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
    
    // Use controlled state if provided, otherwise use internal state
    const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
    
    const handleToggle = React.useCallback(() => {
      if (!collapsible) return;
      
      const newExpanded = !isExpanded;
      if (controlledExpanded === undefined) {
        setInternalExpanded(newExpanded);
      }
      onExpandedChange?.(newExpanded);
    }, [isExpanded, collapsible, controlledExpanded, onExpandedChange]);

    return (
      <div
        ref={ref}
        className={cn(accordionVariants({ variant }), className)}
        data-state={isExpanded ? 'open' : 'closed'}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              'data-state': isExpanded ? 'open' : 'closed',
              onClick: child.type === AccordionTrigger ? handleToggle : child.props.onClick,
            });
          }
          return child;
        })}
      </div>
    );
  }
);
Accordion.displayName = 'Accordion';

// Accordion Trigger
const accordionTriggerVariants = cva(
  'flex w-full items-center justify-between bg-neutral-50 border-b border-neutral-200 relative',
  {
    variants: {
      variant: {
        default: 'px-3 py-1.5',
        ghost: 'bg-transparent border-0 px-0 py-2',
        padded: 'px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accordionTriggerVariants> {
  icon?: React.ReactNode;
  chevron?: boolean;
  chevronIcon?: React.ReactNode;
  asChild?: boolean;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({
    className,
    variant,
    icon,
    chevron = true,
    chevronIcon,
    children,
    asChild,
    ...props
  }, ref) => {
    const isExpanded = props['data-state'] === 'open';
    
    if (asChild) {
      return (
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={cn(accordionTriggerVariants({ variant }), className)}
          {...props}
        >
          <div className="flex items-center gap-2">
            {icon}
            {children}
          </div>
          {chevron && (
            <span className={cn(
              "chevron transition-transform duration-200",
              isExpanded && "rotate-180"
            )}>
              {chevronIcon || <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      );
    }
    
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isExpanded}
        className={cn(accordionTriggerVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon}
          {children}
        </div>
        {chevron && (
          <span className={cn(
            "chevron transition-transform duration-200",
            isExpanded && "rotate-180"
          )}>
            {chevronIcon || <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

// Accordion Content
const accordionContentVariants = cva(
  'overflow-hidden bg-white',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionContentVariants> {
  forceMount?: boolean;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, padding, forceMount, children, ...props }, ref) => {
    const isOpen = props['data-state'] === 'open';
    
    return (
      <div
        ref={ref}
        className={cn(
          accordionContentVariants({ padding }),
          !isOpen && !forceMount && 'hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';

// Multiple Accordions Container
export interface AccordionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export const AccordionGroup = React.forwardRef<HTMLDivElement, AccordionGroupProps>(
  ({ className, type = 'single', value, defaultValue, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'single' ? '' : [])
    );
    
    const currentValue = value !== undefined ? value : internalValue;
    
    const handleValueChange = React.useCallback((itemValue: string, expanded: boolean) => {
      let newValue: string | string[];
      
      if (type === 'single') {
        newValue = expanded ? itemValue : '';
      } else {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        if (expanded) {
          newValue = [...currentArray, itemValue];
        } else {
          newValue = currentArray.filter(v => v !== itemValue);
        }
      }
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    }, [type, currentValue, value, onValueChange]);
    
    const isItemExpanded = (itemValue: string) => {
      if (type === 'single') {
        return currentValue === itemValue;
      }
      return Array.isArray(currentValue) && currentValue.includes(itemValue);
    };
    
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.props.value) {
            const itemValue = child.props.value;
            return React.cloneElement(child, {
              expanded: isItemExpanded(itemValue),
              onExpandedChange: (expanded: boolean) => handleValueChange(itemValue, expanded),
            });
          }
          return child;
        })}
      </div>
    );
  }
);
AccordionGroup.displayName = 'AccordionGroup';

// Accordion Item for use in AccordionGroup
export interface AccordionItemProps extends AccordionProps {
  value: string;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ ...props }, ref) => {
    return <Accordion ref={ref} {...props} />;
  }
);
AccordionItem.displayName = 'AccordionItem';