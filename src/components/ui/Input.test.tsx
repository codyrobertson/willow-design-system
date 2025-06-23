import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders input without explicit type', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      // HTML inputs default to type="text" when type is not specified
    });

    it('renders with specified type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders in disabled state', () => {
      render(<Input disabled placeholder="Disabled input" />);
      expect(screen.getByPlaceholderText('Disabled input')).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-input');
      expect(input.className).toContain('shadow-input');
    });

    it('renders error variant', () => {
      render(<Input variant="error" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-destructive');
      expect(input.className).toContain('shadow-input-error');
    });

    it('renders success variant', () => {
      render(<Input variant="success" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-success');
    });

    it('uses error variant when error prop is true', () => {
      render(<Input error data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-destructive');
    });

    it('uses success variant when success prop is true', () => {
      render(<Input success data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-success');
    });

    it('error prop overrides variant prop', () => {
      render(<Input variant="success" error data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-destructive');
      expect(input.className).not.toContain('border-success');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Input size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('h-9');
      expect(input.className).toContain('text-xs');
    });

    it('renders medium size by default', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('h-11');
      expect(input.className).toContain('text-sm');
    });

    it('renders large size', () => {
      render(<Input size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('h-12');
      expect(input.className).toContain('text-base');
    });
  });

  describe('User Interaction', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      
      const input = screen.getByPlaceholderText('Type here');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('calls onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Test');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Test');
    });

    it('does not accept input when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input disabled onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Test');
      
      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  describe('File Input', () => {
    it('renders file input correctly', () => {
      render(<Input type="file" data-testid="file-input" />);
      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('type', 'file');
      expect(input.className).toContain('file:border-0');
      expect(input.className).toContain('file:bg-transparent');
    });
  });

  describe('Accessibility', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('supports custom className', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('supports aria attributes', () => {
      render(
        <Input 
          aria-label="Email input"
          aria-describedby="email-error"
          aria-invalid="true"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Email input');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports all HTML input attributes', () => {
      render(
        <Input
          name="email"
          id="email-input"
          required
          maxLength={100}
          placeholder="Enter email"
          autoComplete="email"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
      expect(input).toHaveAttribute('id', 'email-input');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('maxLength', '100');
      expect(input).toHaveAttribute('placeholder', 'Enter email');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });
  });

  describe('Styling', () => {
    it('applies transition classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('transition-all');
      expect(input.className).toContain('duration-200');
    });

    it('applies focus styles', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('focus:border-primary');
      expect(input.className).toContain('focus:outline-none');
      expect(input.className).toContain('focus:ring-2');
    });

    it('applies disabled styles', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('disabled:cursor-not-allowed');
      expect(input.className).toContain('disabled:opacity-50');
    });
  });
});