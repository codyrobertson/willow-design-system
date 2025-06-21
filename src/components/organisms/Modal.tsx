'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import type { BaseComponentProps, CompoundComponentContext } from '@/components/primitives/types';

/**
 * Modal variants - simplified and maintainable
 */
const modalOverlayVariants = cva(
  'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity',
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
  'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg transition-all',
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
  onClose: () => void;
  modalId: string;
}

const ModalContext = React.createContext<CompoundComponentContext<ModalContextValue>>({
  internal: { 
    open: false, 
    onClose: () => {},
    modalId: ''
  }
});

/* ---------------------------- */
/*       Root Component         */
/* ---------------------------- */

export interface ModalProps 
  extends BaseComponentProps,
    VariantProps<typeof modalContentVariants> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean; // Whether to trap focus
}

const ModalRoot = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    children,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    modal = true,
    ...props 
  }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const modalId = React.useId();
    
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    
    const onClose = React.useCallback(() => {
      if (!isControlled) {
        setInternalOpen(false);
      }
      onOpenChange?.(false);
    }, [isControlled, onOpenChange]);
    
    // Handle escape key
    React.useEffect(() => {
      if (!open || !modal) return;
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, modal, onClose]);
    
    // Handle focus trap
    React.useEffect(() => {
      if (!open || !modal) return;
      
      const previouslyFocused = document.activeElement as HTMLElement;
      const modalElement = document.getElementById(modalId);
      
      if (modalElement) {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0] as HTMLElement;
        const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        // Focus first element
        firstFocusable?.focus();
        
        const handleTab = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;
          
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable?.focus();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable?.focus();
            }
          }
        };
        
        document.addEventListener('keydown', handleTab);
        
        return () => {
          document.removeEventListener('keydown', handleTab);
          previouslyFocused?.focus();
        };
      }
    }, [open, modal, modalId]);
    
    const contextValue = React.useMemo(
      () => ({ internal: { open, onClose, modalId } }),
      [open, onClose, modalId]
    );
    
    return (
      <ModalContext.Provider value={contextValue}>
        {children}
      </ModalContext.Provider>
    );
  }
);
ModalRoot.displayName = 'Modal';

/* ---------------------------- */
/*      Trigger Component       */
/* ---------------------------- */

export interface ModalTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const ModalTrigger = React.forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { internal } = React.useContext(ModalContext);
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      internal.onClose(); // This will open if closed
      onClick?.(e);
    };
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: handleClick,
      });
    }
    
    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
ModalTrigger.displayName = 'Modal.Trigger';

/* ---------------------------- */
/*      Portal Component        */
/* ---------------------------- */

export interface ModalPortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

const ModalPortal: React.FC<ModalPortalProps> = ({ children, container }) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return React.createPortal(
    children,
    container || document.body
  );
};

/* ---------------------------- */
/*     Overlay Component        */
/* ---------------------------- */

export interface ModalOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalOverlay = React.forwardRef<HTMLDivElement, ModalOverlayProps>(
  ({ className, onClick, ...props }, ref) => {
    const { internal } = React.useContext(ModalContext);
    const { open, onClose } = internal;
    
    return (
      <div
        ref={ref}
        className={cn(
          modalOverlayVariants({ state: open ? 'open' : 'closed' }),
          className
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
          onClick?.(e);
        }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
ModalOverlay.displayName = 'Modal.Overlay';

/* ---------------------------- */
/*     Content Component        */
/* ---------------------------- */

export interface ModalContentProps 
  extends BaseComponentProps,
    VariantProps<typeof modalContentVariants> {
  showClose?: boolean;
  onInteractOutside?: (event: MouseEvent) => void;
}

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ 
    className, 
    size,
    showClose = true,
    onInteractOutside,
    children,
    ...props 
  }, ref) => {
    const { internal } = React.useContext(ModalContext);
    const { open, onClose, modalId } = internal;
    
    return (
      <ModalPortal>
        <ModalOverlay />
        <div
          ref={ref}
          id={modalId}
          role="dialog"
          aria-modal="true"
          className={cn(
            modalContentVariants({ size, state: open ? 'open' : 'closed' }),
            'rounded-lg',
            className
          )}
          {...props}
        >
          {children}
          {showClose && (
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </ModalPortal>
    );
  }
);
ModalContent.displayName = 'Modal.Content';

/* ---------------------------- */
/*      Header Component        */
/* ---------------------------- */

const ModalHeader = React.forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  )
);
ModalHeader.displayName = 'Modal.Header';

/* ---------------------------- */
/*       Title Component        */
/* ---------------------------- */

const ModalTitle = React.forwardRef<HTMLHeadingElement, BaseComponentProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
ModalTitle.displayName = 'Modal.Title';

/* ---------------------------- */
/*   Description Component      */
/* ---------------------------- */

const ModalDescription = React.forwardRef<HTMLParagraphElement, BaseComponentProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
ModalDescription.displayName = 'Modal.Description';

/* ---------------------------- */
/*      Footer Component        */
/* ---------------------------- */

const ModalFooter = React.forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  )
);
ModalFooter.displayName = 'Modal.Footer';

/* ---------------------------- */
/*     Export as Compound       */
/* ---------------------------- */

export const Modal = Object.assign(ModalRoot, {
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Footer: ModalFooter,
});