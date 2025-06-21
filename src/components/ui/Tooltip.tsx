'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tooltipContentVariants = cva(
  'absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
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
      side: 'top',
      align: 'center',
    },
  }
);

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentId: string;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip compound components must be used within a Tooltip');
  }
  return context;
}

export interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

export function Tooltip({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 700,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentId = React.useId();
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      clearTimeout(timeoutRef.current);
      
      if (newOpen && delayDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          if (!isControlled) {
            setUncontrolledOpen(true);
          }
          onOpenChange?.(true);
        }, delayDuration);
      } else {
        if (!isControlled) {
          setUncontrolledOpen(newOpen);
        }
        onOpenChange?.(newOpen);
      }
    },
    [isControlled, onOpenChange, delayDuration]
  );

  React.useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentId,
    }),
    [open, setOpen, contentId]
  );

  return <TooltipContext.Provider value={contextValue}>{children}</TooltipContext.Provider>;
}

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ asChild, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const { setOpen, triggerRef, contentId } = useTooltipContext();

    React.useImperativeHandle(ref, () => triggerRef.current!);

    const handleMouseEnter = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseEnter?.(e);
        setOpen(true);
      },
      [onMouseEnter, setOpen]
    );

    const handleMouseLeave = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseLeave?.(e);
        setOpen(false);
      },
      [onMouseLeave, setOpen]
    );

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        onFocus?.(e);
        setOpen(true);
      },
      [onFocus, setOpen]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        onBlur?.(e);
        setOpen(false);
      },
      [onBlur, setOpen]
    );

    const triggerProps = {
      ref: triggerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      'aria-describedby': contentId,
      ...props,
    };

    if (asChild) {
      return React.cloneElement(React.Children.only(props.children as React.ReactElement), triggerProps);
    }

    return <div {...triggerProps} />;
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

export interface TooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tooltipContentVariants> {
  sideOffset?: number;
  collisionBoundary?: Element | null;
  hideWhenDetached?: boolean;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side, align, sideOffset = 4, ...props }, ref) => {
    const { open, triggerRef, contentId } = useTooltipContext();
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

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
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }, [open, triggerRef]);

    if (!open) return null;

    return (
      <div
        ref={ref}
        id={contentId}
        role="tooltip"
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
        }}
        className={cn(tooltipContentVariants({ side, align }), className)}
        {...props}
      />
    );
  }
);
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
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLDivElement>;
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

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
};