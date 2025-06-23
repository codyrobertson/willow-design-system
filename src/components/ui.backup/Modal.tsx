'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from './Button';

const modalOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
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
  'fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] bg-background rounded-lg shadow-lg transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-[90vw] max-h-[90vh]',
      },
      state: {
        open: 'scale-100 opacity-100',
        closed: 'scale-95 opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'closed',
    },
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
}

export function Modal({ open: controlledOpen, defaultOpen = false, onOpenChange, children }: ModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  const modalId = React.useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;

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
      return React.cloneElement(React.Children.only(props.children as React.ReactElement), {
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
}

export const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  (
    {
      className,
      size,
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
          className={cn(modalContentVariants({ size, state: open ? 'open' : 'closed' }), className)}
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

export type ModalHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between p-6 pb-0', className)}
      {...props}
    />
  )
);
ModalHeader.displayName = 'ModalHeader';

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, as: Component = 'h2', ...props }, ref) => {
    const { titleId } = useModalContext();
    return (
      <Component
        ref={ref}
        id={titleId}
        className={cn('text-lg font-semibold', className)}
        {...props}
      />
    );
  }
);
ModalTitle.displayName = 'ModalTitle';

export type ModalDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { descriptionId } = useModalContext();
    return (
      <p
        ref={ref}
        id={descriptionId}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  }
);
ModalDescription.displayName = 'ModalDescription';

export type ModalBodyProps = React.HTMLAttributes<HTMLDivElement>;

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);
ModalBody.displayName = 'ModalBody';

export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2 p-6 pt-0', className)}
      {...props}
    />
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
      return React.cloneElement(React.Children.only(props.children as React.ReactElement), {
        onClick: handleClick,
        ref,
      });
    }

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4"
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

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
};