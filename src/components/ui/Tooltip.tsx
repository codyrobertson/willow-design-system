'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const tooltipVariants = cva(
  'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-popover text-popover-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Simple Tooltip wrapper component for convenience
export interface TooltipWrapperProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
}

export function TooltipWrapper({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 0,
  className,
}: TooltipWrapperProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  const handleFocus = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleBlur = () => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-block"
      >
        {children}
      </div>
      {open && (
        <div
          role="tooltip"
          className={cn(
            tooltipVariants(),
            'fixed pointer-events-none',
            className
          )}
          style={{
            position: 'fixed',
            zIndex: 50,
            ...(triggerRef.current && (() => {
              const rect = triggerRef.current.getBoundingClientRect();
              const tooltipWidth = 200; // Approximate width
              const tooltipHeight = 40; // Approximate height
              
              let top = 0;
              let left = 0;
              
              // Calculate position based on side
              switch (side) {
                case 'top':
                  top = rect.top - tooltipHeight - 8;
                  left = rect.left + rect.width / 2;
                  break;
                case 'bottom':
                  top = rect.bottom + 8;
                  left = rect.left + rect.width / 2;
                  break;
                case 'left':
                  top = rect.top + rect.height / 2;
                  left = rect.left - tooltipWidth - 8;
                  break;
                case 'right':
                  top = rect.top + rect.height / 2;
                  left = rect.right + 8;
                  break;
              }
              
              // Apply alignment
              if (side === 'top' || side === 'bottom') {
                if (align === 'start') {
                  left = rect.left;
                } else if (align === 'end') {
                  left = rect.right;
                }
              } else {
                if (align === 'start') {
                  top = rect.top;
                } else if (align === 'end') {
                  top = rect.bottom;
                }
              }
              
              return {
                top: `${top}px`,
                left: `${left}px`,
                transform: side === 'top' || side === 'bottom' 
                  ? align === 'center' ? 'translateX(-50%)' : ''
                  : align === 'center' ? 'translateY(-50%)' : ''
              };
            })())
          }}
          data-state={open ? 'open' : 'closed'}
          data-side={side}
        >
          {content}
        </div>
      )}
    </>
  );
}

// For backward compatibility, create simple wrapper components
export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

Tooltip.displayName = 'Tooltip';

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, { ref, ...props });
  }
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: string; align?: string }
>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});
TooltipContent.displayName = 'TooltipContent';

// Popover component - similar to Tooltip but with click trigger
const popoverContentVariants = cva(
  'absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      side: {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2',
      },
      align: {
        start: '',
        center: '',
        end: '',
      },
    },
    compoundVariants: [
      {
        side: ['top', 'bottom'],
        align: 'center',
        className: 'left-1/2 -translate-x-1/2',
      },
      {
        side: ['top', 'bottom'],
        align: 'start',
        className: 'left-0',
      },
      {
        side: ['top', 'bottom'],
        align: 'end',
        className: 'right-0',
      },
      {
        side: ['left', 'right'],
        align: 'center',
        className: 'top-1/2 -translate-y-1/2',
      },
      {
        side: ['left', 'right'],
        align: 'start',
        className: 'top-0',
      },
      {
        side: ['left', 'right'],
        align: 'end',
        className: 'bottom-0',
      },
    ],
    defaultVariants: {
      side: 'bottom',
      align: 'center',
    },
  }
);

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentId: string;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined);

function usePopoverContext() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover compound components must be used within a Popover');
  }
  return context;
}

export interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const contentId = React.useId();

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  // Handle click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, setOpen]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentRef,
      contentId,
    }),
    [open, setOpen, contentId]
  );

  return <PopoverContext.Provider value={contextValue}>{children}</PopoverContext.Provider>;
}

export interface PopoverTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, onClick, ...props }, ref) => {
    const { open, setOpen, triggerRef, contentId } = usePopoverContext();

    React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          setOpen(!open);
        }
      },
      [onClick, open, setOpen]
    );

    const triggerProps = {
      ref: triggerRef as React.RefObject<HTMLButtonElement>,
      onClick: handleClick,
      'aria-expanded': open,
      'aria-controls': contentId,
      ...props,
    };

    if (asChild) {
      return React.cloneElement(React.Children.only(props.children as React.ReactElement), triggerProps);
    }

    return <button type="button" {...triggerProps} />;
  }
);
PopoverTrigger.displayName = 'PopoverTrigger';

export interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof popoverContentVariants> {}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, side, align, ...props }, ref) => {
    const { open, triggerRef, contentRef, contentId } = usePopoverContext();
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    React.useImperativeHandle(ref, () => contentRef.current!);

    React.useLayoutEffect(() => {
      if (!open || !triggerRef.current) return;

      const updatePosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        });
      };

      updatePosition();
    }, [open, triggerRef]);

    if (!open) return null;

    return (
      <div
        ref={contentRef}
        id={contentId}
        role="dialog"
        aria-modal="false"
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
        }}
        className={cn(popoverContentVariants({ side, align }), className)}
        {...props}
      />
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

// Components are already exported above