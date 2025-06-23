import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// List Container
const listVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: '',
        divided: 'divide-y divide-neutral-100',
        spaced: 'space-y-2',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'none',
    },
  }
);

export interface ListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listVariants> {
  enableKeyboardNavigation?: boolean;
}

export const List = React.forwardRef<HTMLDivElement, ListProps>(
  ({ className, variant, padding, enableKeyboardNavigation = false, children, onKeyDown, ...props }, ref) => {
    const listRef = React.useRef<HTMLDivElement>(null);
    const mergedRef = React.useMemo(() => {
      return (node: HTMLDivElement) => {
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
        listRef.current = node;
      };
    }, [ref]);
    
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!enableKeyboardNavigation) {
        onKeyDown?.(e);
        return;
      }
      
      const items = listRef.current?.querySelectorAll('[role="listitem"]:not([aria-disabled="true"])');
      if (!items || items.length === 0) {
        onKeyDown?.(e);
        return;
      }
      
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
          onKeyDown?.(e);
          return;
      }
      
      (items[nextIndex] as HTMLElement).focus();
    }, [enableKeyboardNavigation, onKeyDown]);
    
    return (
      <div
        ref={mergedRef}
        role={enableKeyboardNavigation ? "list" : undefined}
        className={cn(listVariants({ variant, padding }), className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  }
);
List.displayName = 'List';

// List Item
const listItemVariants = cva(
  'flex w-full',
  {
    variants: {
      variant: {
        default: '',
        clickable: 'cursor-pointer transition-colors hover:bg-neutral-50',
        selected: 'bg-willow-primary-50',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'px-0 py-3',
        lg: 'p-5',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      align: 'center',
    },
  }
);

export interface ListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
}

export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({
    className,
    variant,
    padding,
    align,
    leading,
    trailing,
    selected,
    disabled,
    children,
    onClick,
    ...props
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled && onClick) {
        onClick(e);
      }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };
    
    const isClickable = !!onClick && !disabled;

    return (
      <div
        ref={ref}
        role="listitem"
        tabIndex={isClickable ? 0 : undefined}
        className={cn(
          listItemVariants({ variant, padding, align }),
          selected && 'bg-willow-primary-50',
          disabled && 'opacity-50 cursor-not-allowed',
          isClickable && 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          className
        )}
        onClick={handleClick}
        onKeyDown={isClickable ? handleKeyDown : undefined}
        {...props}
      >
        {leading && (
          <div className="shrink-0 mr-3">{leading}</div>
        )}
        
        <div className="flex-1 min-w-0">{children}</div>
        
        {trailing && (
          <div className="shrink-0 ml-3">{trailing}</div>
        )}
      </div>
    );
  }
);
ListItem.displayName = 'ListItem';

// List Item Content
export interface ListItemContentProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  overline?: React.ReactNode;
}

export const ListItemContent = React.forwardRef<HTMLDivElement, ListItemContentProps>(
  ({ className, title, subtitle, description, overline, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col gap-0.5', className)} {...props}>
        {overline && (
          <div className="text-xs text-neutral-600">{overline}</div>
        )}
        {title && (
          <div className="text-sm font-medium text-neutral-950">{title}</div>
        )}
        {subtitle && (
          <div className="text-sm text-neutral-700">{subtitle}</div>
        )}
        {description && (
          <div className="text-xs text-neutral-600">{description}</div>
        )}
        {children}
      </div>
    );
  }
);
ListItemContent.displayName = 'ListItemContent';

// List Item Icon
const listItemIconVariants = cva(
  'flex items-center justify-center shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-neutral-50',
        primary: 'bg-willow-primary-50',
        success: 'bg-state-success-lighter',
        warning: 'bg-state-warning-lighter',
        danger: 'bg-state-error-lighter',
        info: 'bg-info-50',
      },
      size: {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      shape: 'circle',
    },
  }
);

const listItemIconColorVariants = cva(
  '',
  {
    variants: {
      variant: {
        default: 'text-neutral-700',
        primary: 'text-willow-primary-700',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
        info: 'text-info-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ListItemIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemIconVariants> {}

export const ListItemIcon = React.forwardRef<HTMLDivElement, ListItemIconProps>(
  ({ className, variant, size, shape, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          listItemIconVariants({ variant, size, shape }),
          'flex items-center justify-center shadow-[0px_0.727273px_1.45455px_0px_rgba(10,13,20,0.03)]',
          className
        )}
        {...props}
      >
        <div className={cn(listItemIconColorVariants({ variant }), 'text-[0.89em] [&>svg]:w-[1em] [&>svg]:h-[1em]')}>
          {children}
        </div>
      </div>
    );
  }
);
ListItemIcon.displayName = 'ListItemIcon';

// List Divider
export const ListDivider = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn('border-0 h-px bg-neutral-100 my-2', className)}
        {...props}
      />
    );
  }
);
ListDivider.displayName = 'ListDivider';

// List Header (for sections)
export interface ListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const ListHeader = React.forwardRef<HTMLDivElement, ListHeaderProps>(
  ({ className, icon, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between py-2 px-0', className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-neutral-950">{children}</span>
        </div>
        {action}
      </div>
    );
  }
);
ListHeader.displayName = 'ListHeader';

// List Section for grouped items
export interface ListSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export const ListSection = React.forwardRef<HTMLDivElement, ListSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {(title || description) && (
          <div className="px-0 py-2">
            {title && (
              <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-neutral-600 mt-0.5">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    );
  }
);
ListSection.displayName = 'ListSection';