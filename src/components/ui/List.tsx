import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * List component styles using class-variance-authority
 * 
 * Variants:
 * - default: Basic list with no dividers
 * - divided: Adds dividers between items
 * - spaced: Adds vertical spacing between items
 * 
 * Padding:
 * - none: No padding
 * - sm: Small padding (12px)
 * - md: Medium padding (16px)
 * - lg: Large padding (24px)
 */
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

/**
 * ListProps interface for the List component
 * 
 * @property {boolean} [enableKeyboardNavigation] - Enable keyboard navigation with arrow keys
 */
export interface ListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listVariants> {
  enableKeyboardNavigation?: boolean;
}

/**
 * List component - A flexible container for displaying lists of content
 * 
 * @component
 * @example
 * // Basic list
 * <List>
 *   <ListItem>Item 1</ListItem>
 *   <ListItem>Item 2</ListItem>
 * </List>
 * 
 * @example
 * // Divided list with padding
 * <List variant="divided" padding="md">
 *   <ListItem>
 *     <ListItemContent title="Title" subtitle="Subtitle" />
 *   </ListItem>
 * </List>
 * 
 * @example
 * // With keyboard navigation
 * <List enableKeyboardNavigation>
 *   <ListItem>Navigate with arrow keys</ListItem>
 * </List>
 * 
 * @param {ListProps} props - Component props
 * @param {string} [props.variant="default"] - Visual variant of the list
 * @param {string} [props.padding="none"] - Padding size
 * @param {boolean} [props.enableKeyboardNavigation=false] - Enable keyboard navigation
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - List items
 */
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

/**
 * ListItem component styles using class-variance-authority
 * 
 * Variants:
 * - default: Basic list item
 * - clickable: Adds hover state and cursor pointer
 * - selected: Shows selected state with background color
 * 
 * Padding:
 * - none: No padding
 * - sm: Small padding (12px)
 * - md: Medium padding (12px vertical, no horizontal)
 * - lg: Large padding (20px)
 * 
 * Align:
 * - start: Align items to the start
 * - center: Center align items
 * - end: Align items to the end
 * - stretch: Stretch items to full height
 */
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

/**
 * ListItemProps interface for the ListItem component
 * 
 * @property {React.ReactNode} [leading] - Content to display at the start of the item
 * @property {React.ReactNode} [trailing] - Content to display at the end of the item
 * @property {boolean} [selected] - Whether the item is selected
 * @property {boolean} [disabled] - Whether the item is disabled
 */
export interface ListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
}

/**
 * ListItem component - Individual item within a List
 * 
 * @component
 * @example
 * // Basic list item
 * <ListItem>Simple item</ListItem>
 * 
 * @example
 * // With leading and trailing content
 * <ListItem
 *   leading={<ListItemIcon><User /></ListItemIcon>}
 *   trailing={<ChevronRight />}
 * >
 *   User profile
 * </ListItem>
 * 
 * @example
 * // Clickable with selection
 * <ListItem
 *   variant="clickable"
 *   selected={isSelected}
 *   onClick={() => setSelected(!isSelected)}
 * >
 *   Click me
 * </ListItem>
 * 
 * @param {ListItemProps} props - Component props
 * @param {React.ReactNode} [props.leading] - Content at the start of the item
 * @param {React.ReactNode} [props.trailing] - Content at the end of the item
 * @param {boolean} [props.selected] - Selected state
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.variant="default"] - Visual variant
 * @param {string} [props.padding="md"] - Padding size
 * @param {string} [props.align="center"] - Vertical alignment
 * @param {Function} [props.onClick] - Click handler
 */
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
        aria-selected={selected}
        aria-disabled={disabled}
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

/**
 * ListItemContentProps interface for structured content within list items
 * 
 * @property {React.ReactNode} [title] - Main title text
 * @property {React.ReactNode} [subtitle] - Secondary subtitle text
 * @property {React.ReactNode} [description] - Additional description text
 * @property {React.ReactNode} [overline] - Text that appears above the title
 */
export interface ListItemContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  overline?: React.ReactNode;
}

/**
 * ListItemContent component - Structured content for list items
 * 
 * @component
 * @example
 * // Basic content
 * <ListItemContent
 *   title="Meeting with team"
 *   subtitle="Engineering sync"
 * />
 * 
 * @example
 * // Full content structure
 * <ListItemContent
 *   overline="TODAY"
 *   title="Product Review"
 *   subtitle="Q4 Planning Session"
 *   description="Conference Room B, 2nd Floor"
 * />
 * 
 * @param {ListItemContentProps} props - Component props
 * @param {React.ReactNode} [props.overline] - Overline text (smallest, above title)
 * @param {React.ReactNode} [props.title] - Main title
 * @param {React.ReactNode} [props.subtitle] - Subtitle
 * @param {React.ReactNode} [props.description] - Description text
 * @param {React.ReactNode} [props.children] - Additional content
 */
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

/**
 * ListItemIcon component styles
 * 
 * Background variants match semantic color system
 */
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

/**
 * Icon color variants to match background variants
 */
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

/**
 * ListItemIconProps interface
 */
export interface ListItemIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemIconVariants> {}

/**
 * ListItemIcon component - Icon container for list items
 * 
 * @component
 * @example
 * // Basic icon
 * <ListItemIcon>
 *   <User className="w-4 h-4" />
 * </ListItemIcon>
 * 
 * @example
 * // Colored icon with size
 * <ListItemIcon variant="primary" size="md">
 *   <Calendar />
 * </ListItemIcon>
 * 
 * @example
 * // Square shape icon
 * <ListItemIcon shape="square" variant="success">
 *   <Check />
 * </ListItemIcon>
 * 
 * @param {ListItemIconProps} props - Component props
 * @param {string} [props.variant="default"] - Color variant
 * @param {string} [props.size="sm"] - Icon container size
 * @param {string} [props.shape="circle"] - Container shape
 * @param {React.ReactNode} props.children - Icon content
 */
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

/**
 * ListDivider component - Horizontal separator for list sections
 * 
 * @component
 * @example
 * <List>
 *   <ListItem>First section</ListItem>
 *   <ListDivider />
 *   <ListItem>Second section</ListItem>
 * </List>
 */
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

/**
 * ListHeaderProps interface
 * 
 * @property {React.ReactNode} [icon] - Optional icon to display
 * @property {React.ReactNode} [action] - Optional action element (button, badge, etc.)
 */
export interface ListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * ListHeader component - Header for list sections
 * 
 * @component
 * @example
 * <ListHeader
 *   icon={<Calendar className="w-4 h-4" />}
 *   action={<Badge>3 items</Badge>}
 * >
 *   Today's Tasks
 * </ListHeader>
 * 
 * @param {ListHeaderProps} props - Component props
 * @param {React.ReactNode} [props.icon] - Optional leading icon
 * @param {React.ReactNode} [props.action] - Optional trailing action
 * @param {React.ReactNode} props.children - Header text
 */
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

/**
 * ListSectionProps interface
 * 
 * @property {React.ReactNode} [title] - Section title
 * @property {React.ReactNode} [description] - Section description
 */
export interface ListSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * ListSection component - Groups related list items
 * 
 * @component
 * @example
 * <ListSection
 *   title="Upcoming"
 *   description="Next 7 days"
 * >
 *   <ListItem>Task 1</ListItem>
 *   <ListItem>Task 2</ListItem>
 * </ListSection>
 * 
 * @param {ListSectionProps} props - Component props
 * @param {React.ReactNode} [props.title] - Section title
 * @param {React.ReactNode} [props.description] - Section description
 * @param {React.ReactNode} props.children - List items in this section
 */
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