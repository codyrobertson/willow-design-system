'use client';

import * as React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-lg p-4 shadow-lg transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        info: 'border-info-200 bg-info-50 text-info-900',
        success: 'border-success/20 bg-state-success-lighter text-success-900',
        warning: 'border-warning/20 bg-state-warning-lighter text-warning-900',
        error: 'border-destructive/20 bg-state-error-lighter text-destructive-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const toastIconVariants = cva('h-5 w-5 shrink-0', {
  variants: {
    variant: {
      default: 'text-foreground',
      info: 'text-info-600',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  onClose?: (id: string) => void;
  icon?: React.ReactNode;
  showIcon?: boolean;
}

const defaultIcons = {
  default: <Info />,
  info: <Info />,
  success: <CheckCircle />,
  warning: <AlertTriangle />,
  error: <AlertCircle />,
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      className,
      variant,
      title,
      description,
      action,
      duration = 5000,
      onClose,
      icon,
      showIcon = true,
      ...props
    },
    ref
  ) => {
    const iconToRender = icon || (showIcon && defaultIcons[variant || 'default']);

    React.useEffect(() => {
      if (duration && duration > 0) {
        const timer = setTimeout(() => {
          onClose?.(id);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, id, onClose]);

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        {iconToRender && (
          <span className={toastIconVariants({ variant })} aria-hidden="true">
            {iconToRender}
          </span>
        )}
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
        {onClose && (
          <button
            type="button"
            onClick={() => onClose(id)}
            className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = 'Toast';

// Toast Container
const toastContainerVariants = cva(
  'pointer-events-none fixed z-50 flex flex-col gap-2 p-4',
  {
    variants: {
      position: {
        'top-left': 'left-0 top-0',
        'top-center': 'left-1/2 top-0 -translate-x-1/2',
        'top-right': 'right-0 top-0',
        'bottom-left': 'bottom-0 left-0',
        'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-0 right-0',
      },
    },
    defaultVariants: {
      position: 'bottom-right',
    },
  }
);

export interface ToastContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastContainerVariants> {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export interface ToastData extends Omit<ToastProps, 'onClose'> {
  id: string;
}

export const ToastContainer = React.forwardRef<HTMLDivElement, ToastContainerProps>(
  ({ className, position, toasts, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(toastContainerVariants({ position }), className)}
        {...props}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} onClose={onClose} {...toast} />
        ))}
      </div>
    );
  }
);
ToastContainer.displayName = 'ToastContainer';

// Toast Context and Provider
interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastContainerProps['position'];
  maxToasts?: number;
}

export function ToastProvider({ children, position = 'bottom-right', maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<ToastData, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => {
        const newToasts = [...prev, { ...toast, id }];
        // Limit the number of toasts
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }
        return newToasts;
      });
      return id;
    },
    [maxToasts]
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearToasts,
    }),
    [toasts, addToast, removeToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

// Helper functions for common toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  return React.useMemo(
    () => ({
      success: (title: string, description?: string) =>
        addToast({ variant: 'success', title, description }),
      error: (title: string, description?: string) =>
        addToast({ variant: 'error', title, description }),
      warning: (title: string, description?: string) =>
        addToast({ variant: 'warning', title, description }),
      info: (title: string, description?: string) =>
        addToast({ variant: 'info', title, description }),
      default: (title: string, description?: string) =>
        addToast({ variant: 'default', title, description }),
    }),
    [addToast]
  );
}

// Components are already exported above