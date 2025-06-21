import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo: React.ErrorInfo | null;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
              <summary className="cursor-pointer text-sm font-medium text-destructive">
                Error details (Development only)
              </summary>
              <pre className="mt-2 overflow-auto text-xs text-destructive/80">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
          <Button onClick={resetError} variant="default" className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetError();
      } else if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): React.ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { fallback: Fallback = DefaultErrorFallback, children } = this.props;

    if (hasError && error) {
      return <Fallback error={error} resetError={this.resetError} errorInfo={errorInfo} />;
    }

    return children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

// Hook for imperatively throwing errors to nearest error boundary
export function useErrorHandler(): (error: Error) => void {
  return React.useCallback((error: Error) => {
    throw error;
  }, []);
}