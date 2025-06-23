'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Tabs context for managing state
 */
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

/**
 * Tabs list variants using class-variance-authority
 */
const tabsListVariants = cva(
  'inline-flex items-center justify-center rounded-lg bg-neutral-100 p-1',
  {
    variants: {
      orientation: {
        horizontal: 'h-10 flex-row',
        vertical: 'flex-col w-full',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  }
);

/**
 * Tab trigger variants
 */
const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      state: {
        active: 'bg-white text-foreground shadow-sm',
        inactive: 'text-muted-foreground hover:text-foreground',
      },
      orientation: {
        horizontal: '',
        vertical: 'w-full justify-start',
      },
    },
    defaultVariants: {
      state: 'inactive',
      orientation: 'horizontal',
    },
  }
);

/**
 * Tab content variants
 */
const tabsContentVariants = cva(
  'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      orientation: {
        horizontal: '',
        vertical: 'ml-2 mt-0',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  }
);

/**
 * TabsProps interface
 */
export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

/**
 * Tabs component - Container for tabbed content
 * 
 * @component
 * @example
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 */
const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ 
    value: controlledValue, 
    defaultValue, 
    onValueChange, 
    orientation = 'horizontal',
    className,
    children,
    ...props 
  }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '');
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
    
    const handleValueChange = (newValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    };
    
    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange, orientation }}>
        <div
          ref={ref}
          className={cn(
            orientation === 'vertical' && 'flex gap-4',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

/**
 * TabsList component - Container for tab triggers
 */
export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    const { orientation } = useTabsContext();
    
    return (
      <div
        ref={ref}
        className={cn(tabsListVariants({ orientation }), className)}
        {...props}
      />
    );
  }
);

TabsList.displayName = 'TabsList';

/**
 * TabsTrigger component - Interactive tab button
 */
export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, orientation } = useTabsContext();
    const isActive = selectedValue === value;
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          tabsTriggerVariants({ 
            state: isActive ? 'active' : 'inactive',
            orientation,
          }),
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

/**
 * TabsContent component - Container for tab panel content
 */
export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, orientation } = useTabsContext();
    const isActive = selectedValue === value;
    
    if (!isActive) return null;
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          tabsContentVariants({ orientation }),
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

/**
 * Alternative styled tabs variants
 */
const styledTabsListVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      variant: {
        default: 'h-10 rounded-lg bg-neutral-100 p-1',
        underline: 'h-10 border-b',
        pills: 'gap-1',
      },
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
    },
    compoundVariants: [
      {
        variant: 'underline',
        orientation: 'vertical',
        className: 'border-b-0 border-l h-auto',
      },
    ],
    defaultVariants: {
      variant: 'default',
      orientation: 'horizontal',
    },
  }
);

const styledTabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-md px-3 py-1.5 text-sm',
        underline: 'px-4 py-2 text-sm border-b-2 border-transparent',
        pills: 'rounded-full px-4 py-2 text-sm',
      },
      state: {
        active: '',
        inactive: '',
      },
      orientation: {
        horizontal: '',
        vertical: '',
      },
    },
    compoundVariants: [
      // Default variant
      {
        variant: 'default',
        state: 'active',
        className: 'bg-white text-foreground shadow-sm',
      },
      {
        variant: 'default',
        state: 'inactive',
        className: 'text-muted-foreground hover:text-foreground',
      },
      // Underline variant
      {
        variant: 'underline',
        state: 'active',
        className: 'text-primary border-primary',
      },
      {
        variant: 'underline',
        state: 'inactive',
        className: 'text-muted-foreground hover:text-foreground hover:border-neutral-300',
      },
      // Pills variant
      {
        variant: 'pills',
        state: 'active',
        className: 'bg-primary text-primary-foreground',
      },
      {
        variant: 'pills',
        state: 'inactive',
        className: 'text-muted-foreground hover:text-foreground hover:bg-neutral-100',
      },
      // Vertical adjustments
      {
        variant: ['default', 'pills'],
        orientation: 'vertical',
        className: 'w-full justify-start',
      },
      {
        variant: 'underline',
        orientation: 'vertical',
        className: 'w-full justify-start border-b-0 border-l-2',
      },
    ],
    defaultVariants: {
      variant: 'default',
      state: 'inactive',
      orientation: 'horizontal',
    },
  }
);

/**
 * StyledTabsList - Alternative styled tabs list
 */
export interface StyledTabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof styledTabsListVariants> {}

const StyledTabsList = React.forwardRef<HTMLDivElement, StyledTabsListProps>(
  ({ className, variant, ...props }, ref) => {
    const { orientation } = useTabsContext();
    
    return (
      <div
        ref={ref}
        className={cn(styledTabsListVariants({ variant, orientation }), className)}
        {...props}
      />
    );
  }
);

StyledTabsList.displayName = 'StyledTabsList';

/**
 * StyledTabsTrigger - Alternative styled tab trigger
 */
export interface StyledTabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof styledTabsTriggerVariants> {
  value: string;
}

const StyledTabsTrigger = React.forwardRef<HTMLButtonElement, StyledTabsTriggerProps>(
  ({ className, value, variant, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, orientation } = useTabsContext();
    const isActive = selectedValue === value;
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          styledTabsTriggerVariants({ 
            variant,
            state: isActive ? 'active' : 'inactive',
            orientation,
          }),
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

StyledTabsTrigger.displayName = 'StyledTabsTrigger';

export { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  StyledTabsList,
  StyledTabsTrigger,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
  styledTabsListVariants,
  styledTabsTriggerVariants,
};