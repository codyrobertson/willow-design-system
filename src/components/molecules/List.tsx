'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, CompoundComponentContext } from '@/components/primitives/types';

/**
 * List variants - simplified and maintainable
 */
const listVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: '',
        divided: 'divide-y divide-border',
        spaced: 'space-y-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ListContextValue {
  interactive?: boolean;
  selectedValue?: string | string[];
  onSelectionChange?: (value: string) => void;
}

const ListContext = React.createContext<CompoundComponentContext<ListContextValue>>({
  internal: {}
});

/* ---------------------------- */
/*       Root Component         */
/* ---------------------------- */

export interface ListProps 
  extends BaseComponentProps,
    VariantProps<typeof listVariants> {
  interactive?: boolean;
  selectedValue?: string | string[];
  onSelectionChange?: (value: string | string[]) => void;
  selectionMode?: 'single' | 'multiple';
}

const ListRoot = React.forwardRef<HTMLDivElement, ListProps>(
  ({ 
    className, 
    variant,
    interactive = false,
    selectedValue,
    onSelectionChange,
    selectionMode = 'single',
    children,
    ...props 
  }, ref) => {
    const listRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => listRef.current as HTMLDivElement);
    
    const handleSelectionChange = React.useCallback((value: string) => {
      if (!onSelectionChange) return;
      
      if (selectionMode === 'single') {
        onSelectionChange(value);
      } else {
        const currentArray = Array.isArray(selectedValue) ? selectedValue : [];
        const isSelected = currentArray.includes(value);
        const newValue = isSelected 
          ? currentArray.filter(v => v !== value)
          : [...currentArray, value];
        onSelectionChange(newValue);
      }
    }, [selectedValue, onSelectionChange, selectionMode]);
    
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!interactive) return;
      
      const items = listRef.current?.querySelectorAll('[role="listitem"]:not([aria-disabled="true"])');
      if (!items || items.length === 0) return;
      
      const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
      let nextIndex = currentIndex;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex === -1 ? items.length - 1 : Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }
      
      (items[nextIndex] as HTMLElement).focus();
    }, [interactive]);
    
    const contextValue = React.useMemo(
      () => ({ 
        internal: { 
          interactive, 
          selectedValue, 
          onSelectionChange: handleSelectionChange 
        } 
      }),
      [interactive, selectedValue, handleSelectionChange]
    );

    return (
      <ListContext.Provider value={contextValue}>
        <div
          ref={listRef}
          role={interactive ? 'list' : undefined}
          className={cn(listVariants({ variant }), className)}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </div>
      </ListContext.Provider>
    );
  }
);
ListRoot.displayName = 'List';

/* ---------------------------- */
/*       Item Component         */
/* ---------------------------- */

const itemVariants = cva(
  'flex w-full items-center transition-colors',
  {
    variants: {
      variant: {
        default: '',
        interactive: 'cursor-pointer hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      },
      size: {
        sm: 'p-2 gap-2',
        md: 'p-3 gap-3',
        lg: 'p-4 gap-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ListItemProps 
  extends BaseComponentProps,
    VariantProps<typeof itemVariants> {
  value?: string;
  disabled?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({ 
    className,
    variant: itemVariant,
    size,
    value,
    disabled = false,
    leading,
    trailing,
    children,
    onClick,
    ...props 
  }, ref) => {
    const { internal } = React.useContext(ListContext);
    const { interactive, selectedValue, onSelectionChange } = internal;
    
    const isSelected = React.useMemo(() => {
      if (!value || !selectedValue) return false;
      return Array.isArray(selectedValue) 
        ? selectedValue.includes(value)
        : selectedValue === value;
    }, [value, selectedValue]);
    
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      if (value && onSelectionChange) {
        onSelectionChange(value);
      }
      onClick?.(e);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      if ((e.key === 'Enter' || e.key === ' ') && (value || onClick)) {
        e.preventDefault();
        if (value && onSelectionChange) {
          onSelectionChange(value);
        }
        onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };
    
    const isInteractive = interactive || !!onClick;
    
    return (
      <div
        ref={ref}
        role="listitem"
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        className={cn(
          itemVariants({ 
            variant: isInteractive ? 'interactive' : itemVariant || 'default', 
            size 
          }),
          isSelected && 'bg-accent',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        aria-selected={isSelected || undefined}
        aria-disabled={disabled || undefined}
        {...props}
      >
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="flex-1 min-w-0">{children}</div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    );
  }
);
ListItem.displayName = 'List.Item';

/* ---------------------------- */
/*     Content Component        */
/* ---------------------------- */

export interface ListContentProps extends BaseComponentProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
}

const ListContent = React.forwardRef<HTMLDivElement, ListContentProps>(
  ({ className, title, subtitle, description, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        {title && (
          <div className="text-sm font-medium">{title}</div>
        )}
        {subtitle && (
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        )}
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
        {children}
      </div>
    );
  }
);
ListContent.displayName = 'List.Content';

/* ---------------------------- */
/*      Icon Component          */
/* ---------------------------- */

const iconVariants = cva(
  'flex items-center justify-center shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border-2 bg-background',
        ghost: 'bg-transparent',
      },
      size: {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10',
        lg: 'w-12 h-12 text-lg',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'circle',
    },
  }
);

export interface ListIconProps 
  extends BaseComponentProps,
    VariantProps<typeof iconVariants> {}

const ListIcon = React.forwardRef<HTMLDivElement, ListIconProps>(
  ({ className, variant, size, shape, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(iconVariants({ variant, size, shape }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ListIcon.displayName = 'List.Icon';

/* ---------------------------- */
/*    Divider Component         */
/* ---------------------------- */

const ListDivider = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn('border-0 h-px bg-border my-2', className)}
        {...props}
      />
    );
  }
);
ListDivider.displayName = 'List.Divider';

/* ---------------------------- */
/*     Export as Compound       */
/* ---------------------------- */

export const List = Object.assign(ListRoot, {
  Item: ListItem,
  Content: ListContent,
  Icon: ListIcon,
  Divider: ListDivider,
});