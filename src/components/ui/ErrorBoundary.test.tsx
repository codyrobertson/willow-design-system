import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, ErrorFallbackProps } from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Custom error fallback
const CustomErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div>
      <h1>Custom Error</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Reset</button>
    </div>
  );
};

describe('ErrorBoundary Component', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches errors and displays default fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('displays custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('logs error to console when no onError callback', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('Error Recovery', () => {
    it('resets error state when reset button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Fix the error
      shouldThrow = false;
      
      // Click reset
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      
      // Rerender with fixed component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('resets when resetKeys change', () => {
      let shouldThrow = true;
      
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Fix error and change reset key
      shouldThrow = false;
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('resets when resetOnPropsChange is true and props change', () => {
      let shouldThrow = true;
      
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange resetKeys={['key1']}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Fix error and change props
      shouldThrow = false;
      rerender(
        <ErrorBoundary resetOnPropsChange resetKeys={['key1', 'key2']}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('shows error details in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Error details (Development only)')).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('can toggle error details', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const details = screen.getByText('Error details (Development only)');
      await user.click(details);
      
      // Error stack should be visible
      const errorDetails = screen.getByText(/Test error message/);
      expect(errorDetails).toBeInTheDocument();
    });
  });

  describe('Production Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('does not show error details in production', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.queryByText('Error details (Development only)')).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary Hook', () => {
    it('provides error and resetError to fallback component', () => {
      const error = new Error('Custom error');
      
      render(
        <ErrorBoundary fallback={({ error, resetError }) => (
          <div>
            <p>Error: {error.message}</p>
            <button onClick={resetError}>Custom Reset</button>
          </div>
        )}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Reset' })).toBeInTheDocument();
    });
  });

  describe('Multiple Error Boundaries', () => {
    it('nested error boundaries work correctly', () => {
      render(
        <ErrorBoundary fallback={() => <div>Outer Error</div>}>
          <div>
            <ErrorBoundary fallback={() => <div>Inner Error</div>}>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );
      
      // Inner boundary should catch the error
      expect(screen.getByText('Inner Error')).toBeInTheDocument();
      expect(screen.queryByText('Outer Error')).not.toBeInTheDocument();
    });
  });
});