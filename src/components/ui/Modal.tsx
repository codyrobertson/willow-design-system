'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const modalOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 overscroll-contain',
  {
    variants: {
      state: {
        open: 'opacity-100',
        closed: 'opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      state: 'closed',
    },
  }
);

const modalContentVariants = cva(
  'fixed z-50 bg-white text-card-foreground rounded-lg overflow-hidden transition-all duration-200 flex flex-col max-h-[90vh] md:max-h-[85vh]',
  {
    variants: {
      size: {
        sm: 'w-[95vw] max-w-sm',
        md: 'w-[95vw] max-w-md',
        lg: 'w-[95vw] max-w-lg md:w-[90vw]',
        xl: 'w-[95vw] max-w-xl md:w-[90vw]',
        '2xl': 'w-[95vw] max-w-2xl md:w-[90vw]',
        '3xl': 'w-[95vw] max-w-3xl md:w-[90vw]',
        full: 'w-[100vw] h-[100vh] md:w-[95vw] md:h-[95vh] rounded-none md:rounded-lg',
      },
      position: {
        center: 'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
        top: 'left-[50%] top-8 translate-x-[-50%] md:top-16',
        bottom: 'left-[50%] bottom-8 translate-x-[-50%] md:bottom-16',
      },
      variant: {
        default: 'border border-slate-200 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.12),0px_1px_3px_0px_rgba(37,62,167,0.2),0px_0px_0px_1px_rgba(55,93,251,0.1),0px_1px_2px_0px_rgba(0,0,0,0.05),0px_-2.4px_9.3px_0px_inset_rgba(137,114,250,0.15)]',
        raised: 'border border-slate-200 shadow-[0px_4px_5.8px_10px_rgba(208,208,208,0.05),0px_4px_20px_0px_rgba(0,0,0,0.12),0px_1px_3px_0px_rgba(37,62,167,0.2),0px_0px_0px_1px_rgba(55,93,251,0.1),0px_1px_2px_0px_rgba(0,0,0,0.05),0px_-2.4px_9.3px_0px_inset_rgba(137,114,250,0.15)]',
        flat: 'border border-[#e1dee9] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
        outlined: 'bg-transparent border-2 border-neutral-300 shadow-sm',
        elevated: 'border border-neutral-100 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_10px_10px_-5px_rgba(0,0,0,0.04),0px_-2.4px_9.3px_0px_inset_rgba(137,114,250,0.15)]',
      },
      state: {
        open: 'scale-100 opacity-100',
        closed: 'scale-95 opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      size: 'md',
      position: 'center',
      variant: 'default',
      state: 'closed',
    },
    compoundVariants: [
      {
        size: 'full',
        position: 'center',
        className: 'md:w-[90vw] md:h-[90vh]',
      },
    ],
  }
);

interface ModalContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modalId: string;
  titleId: string;
  descriptionId: string;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(undefined);

function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within a Modal');
  }
  return context;
}

export interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  // Simple mode props
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  /** Visual variant of the modal */
  variant?: 'default' | 'raised' | 'flat' | 'outlined' | 'elevated';
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Position of the modal on screen */
  position?: 'center' | 'top' | 'bottom';
}

export function Modal({ 
  open: controlledOpen, 
  defaultOpen = false, 
  onOpenChange, 
  children,
  // Simple mode props
  isOpen,
  onClose,
  className,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  variant,
  size,
  position
}: ModalProps) {
  // All hooks must be called unconditionally before any early returns
  const modalId = React.useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  
  // Compound component mode hooks - always call these
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  const contextValue = React.useMemo(
    () => ({
      open,
      onOpenChange: handleOpenChange,
      modalId,
      titleId,
      descriptionId,
    }),
    [open, handleOpenChange, modalId, titleId, descriptionId]
  );
  
  // Check if we're in simple mode (using isOpen/onClose) - after all hooks
  const isSimpleMode = isOpen !== undefined || onClose !== undefined;
  
  if (isSimpleMode) {
    // Simple mode - render directly without provider
    return (
      <ModalContext.Provider value={{
        open: isOpen || false,
        onOpenChange: (open) => !open && onClose?.(),
        modalId,
        titleId,
        descriptionId,
      }}>
        <ModalContent 
          className={className}
          variant={variant}
          size={size}
          position={position}
          preventClose={!closeOnOverlayClick || !closeOnEsc}
          onEscapeKeyDown={closeOnEsc ? undefined : (e) => e.preventDefault()}
          onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        >
          {children}
        </ModalContent>
      </ModalContext.Provider>
    );
  }

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

export interface ModalTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const ModalTrigger = React.forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ asChild, onClick, ...props }, ref) => {
    const { onOpenChange } = useModalContext();

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onOpenChange(true);
        }
      },
      [onClick, onOpenChange]
    );

    if (asChild) {
      const child = React.Children.only(props.children as React.ReactElement);
      return React.cloneElement(child as React.ReactElement<any>, {
        onClick: handleClick,
        ref,
      });
    }

    return <button ref={ref} onClick={handleClick} {...props} />;
  }
);
ModalTrigger.displayName = 'ModalTrigger';

export interface ModalContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalContentVariants> {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: MouseEvent) => void;
  preventClose?: boolean;
  /** Visual variant of the modal */
  variant?: 'default' | 'raised' | 'flat' | 'outlined' | 'elevated';
  /** Position of the modal on screen */
  position?: 'center' | 'top' | 'bottom';
}

export const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  (
    {
      className,
      size,
      variant,
      position,
      children,
      onEscapeKeyDown,
      onPointerDownOutside,
      preventClose = false,
      ...props
    },
    ref
  ) => {
    const { open, onOpenChange, modalId, titleId, descriptionId } = useModalContext();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => contentRef.current!);

    // Handle escape key
    React.useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onEscapeKeyDown?.(e);
          if (!preventClose && !e.defaultPrevented) {
            onOpenChange(false);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onOpenChange, onEscapeKeyDown, preventClose]);

    // Handle click outside
    const handlePointerDownOutside = React.useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!contentRef.current?.contains(target)) {
          onPointerDownOutside?.(e.nativeEvent);
          if (!preventClose && !e.defaultPrevented) {
            onOpenChange(false);
          }
        }
      },
      [onOpenChange, onPointerDownOutside, preventClose]
    );

    // Prevent body scroll when modal is open
    React.useLayoutEffect(() => {
      if (!open) return;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }, [open]);

    if (!open) return null;

    return (
      <>
        <div
          className={modalOverlayVariants({ state: open ? 'open' : 'closed' })}
          onClick={handlePointerDownOutside}
          aria-hidden="true"
        />
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          id={modalId}
          className={cn(modalContentVariants({ size, variant, position, state: open ? 'open' : 'closed' }), className)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              const focusableElements = contentRef.current?.querySelectorAll(
                'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
              );
              if (focusableElements && focusableElements.length > 0) {
                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
                
                if (e.shiftKey && document.activeElement === firstElement) {
                  e.preventDefault();
                  lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                  e.preventDefault();
                  firstElement.focus();
                }
              }
            }
          }}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
ModalContent.displayName = 'ModalContent';

const modalHeaderVariants = cva('flex flex-col gap-2', {
  variants: {
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    variant: {
      default: 'p-4 pb-0 md:p-6 md:pb-0',
      colored: 'relative',
    },
  },
  defaultVariants: {
    align: 'left',
    variant: 'default',
  },
});

const modalHeaderColorVariants = cva(
  'relative shrink-0 w-full',
  {
    variants: {
      theme: {
        neutral: 'bg-neutral-50',
        primary: 'bg-willow-primary-50',
        info: 'bg-info-50',
        success: 'bg-state-success-lighter',
        warning: 'bg-state-warning-lighter',
        danger: 'bg-state-error-lighter',
      },
    },
    defaultVariants: {
      theme: 'neutral',
    },
  }
);

const modalHeaderColorOverlayVariants = cva(
  'absolute border-solid inset-0 pointer-events-none',
  {
    variants: {
      theme: {
        neutral: 'border-neutral-200 border-[0px_0px_1px]',
        primary: 'border-willow-primary-200 border-[0px_0px_1px]',
        info: 'border-info-200 border-[0px_0px_1px]',
        success: 'border-success/20 border-[0px_0px_1px]',
        warning: 'border-warning/20 border-[0px_0px_1px]',
        danger: 'border-destructive-200 border-[0px_0px_1px]',
      },
    },
    defaultVariants: {
      theme: 'neutral',
    },
  }
);

// Context for Modal header color
const ModalHeaderContext = React.createContext<{ isColored: boolean }>({ isColored: false });

export interface ModalHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalHeaderVariants> {
  /** Background theme for colored variant */
  theme?: 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger';
  /** Text alignment within the header */
  align?: 'left' | 'center' | 'right';
  /** Visual variant of the header */
  variant?: 'default' | 'colored';
}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, align, variant, theme, children, ...props }, ref) => {
    const isColored = variant === 'colored' || !!theme;
    
    if (isColored) {
      return (
        <ModalHeaderContext.Provider value={{ isColored: true }}>
          <div
            ref={ref}
            className={cn(modalHeaderColorVariants({ theme }))}
            {...props}
          >
            <div className="flex flex-row items-center overflow-clip relative size-full">
              <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start pl-3 pr-2.5 py-1.5 relative w-full">
                <div className={cn(modalHeaderVariants({ align, variant: 'colored', className }))}>
                  {children}
                </div>
              </div>
            </div>
            <div className={cn(modalHeaderColorOverlayVariants({ theme }))} />
          </div>
        </ModalHeaderContext.Provider>
      );
    }
    
    return (
      <ModalHeaderContext.Provider value={{ isColored: false }}>
        <div
          ref={ref}
          className={cn(modalHeaderVariants({ align, variant, className }))}
          {...props}
        >
          {children}
        </div>
      </ModalHeaderContext.Provider>
    );
  }
);
ModalHeader.displayName = 'ModalHeader';

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, as: Component = 'h2', ...props }, ref) => {
    const { titleId } = useModalContext();
    const { isColored } = React.useContext(ModalHeaderContext);
    
    return (
      <Component
        ref={ref}
        id={titleId}
        className={cn(
          isColored 
            ? 'text-neutral-950 text-sm font-bold tracking-tight leading-5'
            : 'text-card-foreground text-xl font-normal tracking-tight leading-relaxed text-shadow-sm',
          className
        )}
        {...props}
      />
    );
  }
);
ModalTitle.displayName = 'ModalTitle';

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { descriptionId } = useModalContext();
    return (
      <p
        ref={ref}
        id={descriptionId}
        className={cn('text-muted-foreground text-base font-normal leading-6', className)}
        {...props}
      />
    );
  }
);
ModalDescription.displayName = 'ModalDescription';

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-3 md:p-6 md:pt-4 flex-1 overflow-y-auto overscroll-contain', className)} {...props} />
  )
);
ModalBody.displayName = 'ModalBody';

const modalFooterVariants = cva('flex items-center p-4 pt-0 md:p-6 md:pt-0', {
  variants: {
    align: {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    },
  },
  defaultVariants: {
    align: 'right',
  },
});

export interface ModalFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalFooterVariants> {
  /** Alignment of footer content */
  align?: 'left' | 'center' | 'right' | 'between';
}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, align, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(modalFooterVariants({ align, className }))}
      {...props}
    >
      {align === 'between' ? children : <div className="flex gap-2">{children}</div>}
    </div>
  )
);
ModalFooter.displayName = 'ModalFooter';

export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ asChild, onClick, ...props }, ref) => {
    const { onOpenChange } = useModalContext();

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onOpenChange(false);
        }
      },
      [onClick, onOpenChange]
    );

    if (asChild) {
      const child = React.Children.only(props.children as React.ReactElement);
      return React.cloneElement(child as React.ReactElement<any>, {
        onClick: handleClick,
        ref,
      });
    }

    return (
      <Button
        ref={ref}
        variant="ghost"
size="compact"
        className="absolute right-2 top-2 md:right-4 md:top-4 rounded-full hover:bg-neutral-100"
        onClick={handleClick}
        {...props}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    );
  }
);
ModalClose.displayName = 'ModalClose';

// Dialog is an alias for Modal for compatibility
export const Dialog = Modal;
export const DialogTrigger = ModalTrigger;
export const DialogContent = ModalContent;
export const DialogHeader = ModalHeader;
export const DialogTitle = ModalTitle;
export const DialogDescription = ModalDescription;
export const DialogBody = ModalBody;
export const DialogFooter = ModalFooter;
export const DialogClose = ModalClose;