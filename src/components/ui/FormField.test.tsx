import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';
import { Input } from './Input';

describe('FormField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <FormField label="Email">
          <Input />
        </FormField>
      );
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders without label', () => {
      render(
        <FormField>
          <Input placeholder="No label" />
        </FormField>
      );
      expect(screen.getByPlaceholderText('No label')).toBeInTheDocument();
    });

    it('renders with required indicator', () => {
      render(
        <FormField label="Email" required>
          <Input />
        </FormField>
      );
      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveTextContent('*');
      expect(requiredIndicator).toHaveClass('text-destructive');
    });

    it('renders with hint text', () => {
      render(
        <FormField label="Email" hint="We'll never share your email">
          <Input />
        </FormField>
      );
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(
        <FormField label="Email" error="Email is required">
          <Input />
        </FormField>
      );
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Email is required');
      expect(error).toHaveClass('text-destructive');
    });

    it('shows error message instead of hint when both are provided', () => {
      render(
        <FormField 
          label="Email" 
          hint="Enter your email" 
          error="Email is invalid"
        >
          <Input />
        </FormField>
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Email is invalid');
      expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates label with input using htmlFor', () => {
      render(
        <FormField label="Email">
          <Input />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id');
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });

    it('uses custom htmlFor when provided', () => {
      render(
        <FormField label="Email" htmlFor="custom-email-id">
          <Input />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'custom-email-id');
    });

    it('adds aria-describedby for error', () => {
      render(
        <FormField label="Email" error="Invalid email">
          <Input />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      
      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('id', errorId);
    });

    it('adds aria-describedby for hint', () => {
      render(
        <FormField label="Email" hint="Enter your email address">
          <Input />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      const hintId = input.getAttribute('aria-describedby');
      expect(hintId).toBeTruthy();
      
      const hint = screen.getByText('Enter your email address');
      expect(hint).toHaveAttribute('id', hintId);
    });

    it('adds aria-invalid when error is present', () => {
      render(
        <FormField label="Email" error="Invalid email">
          <Input />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('adds aria-required when field is required', () => {
      render(
        <FormField label="Email" required>
          <Input />
        </FormField>
      );
      // Find input by role instead of label text due to the asterisk
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('does not add aria attributes when not needed', () => {
      render(
        <FormField label="Email">
          <Input />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(input).not.toHaveAttribute('aria-required');
      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Child Component Enhancement', () => {
    it('works with Input component', () => {
      render(
        <FormField label="Email" error="Required">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('works with custom input components', () => {
      const CustomInput = React.forwardRef<HTMLInputElement, any>((props, ref) => (
        <input ref={ref} {...props} data-testid="custom-input" />
      ));
      CustomInput.displayName = 'CustomInput';

      render(
        <FormField label="Custom">
          <CustomInput />
        </FormField>
      );
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('id');
    });

    it('preserves existing props on child component', () => {
      render(
        <FormField label="Email">
          <Input 
            placeholder="email@example.com"
            className="custom-class"
            data-testid="email-input"
          />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('placeholder', 'email@example.com');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveAttribute('data-testid', 'email-input');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(
        <FormField className="custom-field-class" label="Email">
          <Input />
        </FormField>
      );
      const field = screen.getByLabelText('Email').closest('div');
      expect(field).toHaveClass('custom-field-class');
      expect(field).toHaveClass('space-y-2');
    });

    it('renders error icon', () => {
      render(
        <FormField label="Email" error="Invalid email">
          <Input />
        </FormField>
      );
      const error = screen.getByRole('alert');
      const icon = error.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-3 w-3');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <FormField ref={ref} label="Email">
          <Input />
        </FormField>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Edge Cases', () => {
    it('throws error for non-React element children', () => {
      // FormField requires a single React element as a child
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(
          <FormField label="Text">
            Plain text content
          </FormField>
        );
      }).toThrow('React.Children.only expected to receive a single React element child.');
      
      consoleError.mockRestore();
    });

    it('generates unique IDs for multiple instances', () => {
      render(
        <>
          <FormField label="Email 1">
            <Input />
          </FormField>
          <FormField label="Email 2">
            <Input />
          </FormField>
        </>
      );
      const input1 = screen.getByLabelText('Email 1');
      const input2 = screen.getByLabelText('Email 2');
      expect(input1.getAttribute('id')).not.toBe(input2.getAttribute('id'));
    });

    it('combines multiple aria-describedby IDs when both error and hint would apply', () => {
      render(
        <FormField label="Email" error="Invalid" hint="Won't show">
          <Input />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      const ariaDescribedby = input.getAttribute('aria-describedby');
      expect(ariaDescribedby).toBeTruthy();
      expect(ariaDescribedby?.split(' ')).toHaveLength(1); // Only error ID
    });
  });
});