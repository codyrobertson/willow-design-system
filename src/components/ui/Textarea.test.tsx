import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea Component', () => {
  describe('Rendering', () => {
    it('renders textarea element', () => {
      render(<Textarea placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders as textarea element', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders in disabled state', () => {
      render(<Textarea disabled placeholder="Disabled textarea" />);
      expect(screen.getByPlaceholderText('Disabled textarea')).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-input');
      expect(textarea.className).toContain('shadow-input');
    });

    it('renders error variant', () => {
      render(<Textarea variant="error" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-destructive');
      expect(textarea.className).toContain('shadow-input-error');
    });

    it('renders success variant', () => {
      render(<Textarea variant="success" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-success');
    });

    it('renders outline variant', () => {
      render(<Textarea variant="outline" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-primary');
      expect(textarea.className).toContain('bg-transparent');
    });

    it('renders ghost variant', () => {
      render(<Textarea variant="ghost" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-transparent');
      expect(textarea.className).toContain('bg-transparent');
    });

    it('uses error variant when error prop is true', () => {
      render(<Textarea error data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-destructive');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('uses success variant when success prop is true', () => {
      render(<Textarea success data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-success');
    });

    it('error prop overrides variant prop', () => {
      render(<Textarea variant="success" error data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-destructive');
      expect(textarea.className).not.toContain('border-success');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Textarea size="sm" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('min-h-[60px]');
      expect(textarea.className).toContain('text-xs');
    });

    it('renders medium size by default', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('min-h-[80px]');
      expect(textarea.className).toContain('text-sm');
    });

    it('renders large size', () => {
      render(<Textarea size="lg" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('min-h-[100px]');
      expect(textarea.className).toContain('text-base');
    });
  });

  describe('User Interaction', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Type here" />);
      
      const textarea = screen.getByPlaceholderText('Type here');
      await user.type(textarea, 'Hello World');
      
      expect(textarea).toHaveValue('Hello World');
    });

    it('calls onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Textarea onChange={handleChange} />);
      const textarea = screen.getByRole('textbox');
      
      await user.type(textarea, 'Test');
      
      expect(handleChange).toHaveBeenCalled();
      expect(textarea).toHaveValue('Test');
    });

    it('does not accept input when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Textarea disabled onChange={handleChange} />);
      const textarea = screen.getByRole('textbox');
      
      await user.type(textarea, 'Test');
      
      expect(handleChange).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('supports custom className', () => {
      render(<Textarea className="custom-textarea" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-textarea');
    });

    it('supports aria attributes', () => {
      render(
        <Textarea 
          aria-label="Message input"
          aria-describedby="message-error"
          aria-required="true"
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label', 'Message input');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-error');
      expect(textarea).toHaveAttribute('aria-required', 'true');
    });

    it('supports all HTML textarea attributes', () => {
      render(
        <Textarea
          name="message"
          id="message-input"
          required
          maxLength={500}
          placeholder="Enter message"
          rows={5}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('name', 'message');
      expect(textarea).toHaveAttribute('id', 'message-input');
      expect(textarea).toHaveAttribute('required');
      expect(textarea).toHaveAttribute('maxLength', '500');
      expect(textarea).toHaveAttribute('placeholder', 'Enter message');
      expect(textarea).toHaveAttribute('rows', '5');
    });
  });

  describe('Styling', () => {
    it('applies resize-y class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('resize-y');
    });

    it('applies transition classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('transition-all');
      expect(textarea.className).toContain('duration-200');
    });

    it('applies focus styles', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('focus:border-primary');
      expect(textarea.className).toContain('focus-visible:outline-none');
      expect(textarea.className).toContain('focus-visible:ring-2');
    });

    it('applies disabled styles', () => {
      render(<Textarea disabled data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('disabled:cursor-not-allowed');
      expect(textarea.className).toContain('disabled:opacity-50');
    });
  });
});