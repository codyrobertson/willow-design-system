import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

describe('Switch Component', () => {
  describe('Rendering', () => {
    it('renders switch element', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('renders unchecked by default', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders checked when checked prop is true', () => {
      render(<Switch checked onCheckedChange={() => {}} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('renders with defaultChecked', () => {
      render(<Switch defaultChecked />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('renders disabled state', () => {
      render(<Switch disabled />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('renders with hidden checkbox input for form submission', () => {
      render(<Switch name="notifications" />);
      const input = document.querySelector('input[name="notifications"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'checkbox');
      expect(input).toHaveAttribute('aria-hidden', 'true');
      expect(input).toHaveStyle({ opacity: '0' });
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Switch variant={variant} />);
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toBeInTheDocument();
      });
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Switch size="sm" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('h-4 w-7');
    });

    it('renders medium size by default', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('h-5 w-9');
    });

    it('renders large size', () => {
      render(<Switch size="lg" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('h-6 w-11');
    });
  });

  describe('User Interaction', () => {
    it('toggles checked state on click', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('calls onCheckedChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      
      await user.click(switchElement);
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('does not toggle when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Switch disabled onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      
      await user.click(switchElement);
      
      expect(handleChange).not.toHaveBeenCalled();
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('updates hidden input checked state', async () => {
      const user = userEvent.setup();
      render(<Switch name="feature" />);
      
      const switchElement = screen.getByRole('switch');
      const input = document.querySelector('input[name="feature"]') as HTMLInputElement;
      
      expect(input.checked).toBe(false);
      expect(input.value).toBe('on'); // value is always 'on'
      
      await user.click(switchElement);
      expect(input.checked).toBe(true);
      
      await user.click(switchElement);
      expect(input.checked).toBe(false);
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('works as controlled component', async () => {
      const ControlledSwitch = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <Switch 
            checked={checked} 
            onCheckedChange={setChecked}
            data-testid="controlled"
          />
        );
      };
      
      const user = userEvent.setup();
      render(<ControlledSwitch />);
      
      const switchElement = screen.getByTestId('controlled');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('works as uncontrolled component', async () => {
      const user = userEvent.setup();
      render(<Switch data-testid="uncontrolled" />);
      
      const switchElement = screen.getByTestId('uncontrolled');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has switch role', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('supports aria-required', () => {
      render(<Switch required />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-required', 'true');
    });

    it('supports custom aria-label', () => {
      render(<Switch aria-label="Enable notifications" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-label', 'Enable notifications');
    });

    it('supports custom className', () => {
      render(<Switch className="custom-switch" />);
      expect(screen.getByRole('switch')).toHaveClass('custom-switch');
    });

    it('has correct keyboard support', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      
      switchElement.focus();
      expect(switchElement).toHaveFocus();
      
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Styling', () => {
    it('applies focus styles', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('focus-visible:outline-none');
      expect(switchElement).toHaveClass('focus-visible:ring-2');
    });

    it('applies transition classes', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('transition-colors');
    });

    it('applies disabled styles', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('disabled:cursor-not-allowed');
      expect(switchElement).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Switch ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});