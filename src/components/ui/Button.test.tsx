import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  describe('Edge Cases', () => {
    it('handles undefined children gracefully', () => {
      const { container } = render(<Button>{undefined}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
      // Button has internal structure, check that no visible text is rendered
      expect(screen.getByRole('button')).toHaveTextContent('');
    });

    it('handles null children gracefully', () => {
      const { container } = render(<Button>{null}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
      // Button has internal structure, check that no visible text is rendered
      expect(screen.getByRole('button')).toHaveTextContent('');
    });

    it('handles empty string children', () => {
      render(<Button>{''}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('handles undefined onClick', () => {
      const { container } = render(<Button onClick={undefined}>Click</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      // Should not crash
      expect(button).toBeInTheDocument();
    });

    it('handles null onClick', () => {
      const { container } = render(<Button onClick={null as any}>Click</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      // Should not crash
      expect(button).toBeInTheDocument();
    });

    it('handles undefined leftIcon', () => {
      render(<Button leftIcon={undefined}>Button</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Button');
    });

    it('handles null leftIcon', () => {
      render(<Button leftIcon={null as any}>Button</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Button');
    });

    it('handles undefined rightIcon', () => {
      render(<Button rightIcon={undefined}>Button</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Button');
    });

    it('handles null rightIcon', () => {
      render(<Button rightIcon={null as any}>Button</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Button');
    });

    it('handles invalid variant', () => {
      render(<Button variant={'invalid' as any}>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles invalid theme', () => {
      render(<Button theme={'invalid' as any}>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles invalid size', () => {
      render(<Button size={'invalid' as any}>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<Button>{longText}</Button>);
      expect(screen.getByRole('button')).toHaveTextContent(longText);
    });

    it('handles multiple children including null', () => {
      render(
        <Button>
          Text
          {null}
          {undefined}
          More text
        </Button>
      );
      expect(screen.getByRole('button')).toHaveTextContent('TextMore text');
    });

    it('handles React node children', () => {
      render(
        <Button>
          <span>Span text</span>
          <strong>Bold text</strong>
        </Button>
      );
      expect(screen.getByText('Span text')).toBeInTheDocument();
      expect(screen.getByText('Bold text')).toBeInTheDocument();
    });

    it('handles both icons and loading state', () => {
      const LeftIcon = () => <svg data-testid="left-icon" />;
      const RightIcon = () => <svg data-testid="right-icon" />;
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />} loading>
          Button
        </Button>
      );
      // Loading state should take precedence
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('handles disabled and loading states together', () => {
      render(<Button disabled loading>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('handles className as undefined', () => {
      render(<Button className={undefined}>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles className as null', () => {
      render(<Button className={null as any}>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles asChild with invalid children', () => {
      // This should log a warning but not crash
      const originalError = console.error;
      console.error = jest.fn();
      
      expect(() => {
        render(
          <Button asChild>
            <div>Multiple</div>
            <div>Children</div>
          </Button>
        );
      }).toThrow();
      
      console.error = originalError;
    });
  });

  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders with left icon', () => {
      const Icon = () => <svg data-testid="left-icon" />;
      render(<Button leftIcon={<Icon />}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const Icon = () => <svg data-testid="right-icon" />;
      render(<Button rightIcon={<Icon />}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('renders disabled state', () => {
      render(<Button disabled>Disabled Button</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'secondary', 'ghost', 'outline', 'link', 'fancy'] as const;
    const themes = ['primary', 'danger', 'warning', 'success', 'info', 'dark', 'neutral'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        // Check that the button has appropriate classes
        expect(button.className).toBeTruthy();
      });
    });

    themes.forEach(theme => {
      it(`renders ${theme} theme correctly`, () => {
        render(<Button theme={theme}>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'compact'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        // Check that the button has height class
        expect(button.className).toMatch(/h-\d+/);
      });
    });
  });

  describe('Interaction', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button loading onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Full Width', () => {
    it('renders full width button', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Submit</Button>);
      // Look for the loading spinner (Loader2 icon with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides original text when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('supports custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('supports other HTML button attributes', () => {
      render(
        <Button 
          type="submit" 
          form="test-form"
          aria-label="Submit form"
        >
          Submit
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });
  });
});