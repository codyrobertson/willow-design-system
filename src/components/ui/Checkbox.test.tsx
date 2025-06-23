import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('renders checkbox input', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders unchecked by default', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('renders checked when checked prop is true', () => {
      render(<Checkbox checked onChange={() => {}} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('renders disabled state', () => {
      render(<Checkbox disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('renders with check icon container', () => {
      render(<Checkbox />);
      // Check icon is rendered but hidden by default
      const checkIcon = document.querySelector('.lucide-check');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveClass('opacity-0');
    });

    it('renders with minus icon container for indeterminate', () => {
      render(<Checkbox />);
      // Minus icon is rendered but hidden by default
      const minusIcon = document.querySelector('.lucide-minus');
      expect(minusIcon).toBeInTheDocument();
      expect(minusIcon).toHaveClass('opacity-0');
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Checkbox variant={variant} data-testid="checkbox" />);
        const checkbox = screen.getByTestId('checkbox');
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Checkbox size="sm" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('h-3 w-3');
    });

    it('renders medium size by default', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('h-4 w-4');
    });

    it('renders large size', () => {
      render(<Checkbox size="lg" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('h-5 w-5');
    });
  });

  describe('Shapes', () => {
    it('renders square shape by default', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('rounded-sm');
    });

    it('renders rounded shape', () => {
      render(<Checkbox shape="rounded" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('rounded-md');
    });

    it('renders circle shape', () => {
      render(<Checkbox shape="circle" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('rounded-full');
    });
  });

  describe('User Interaction', () => {
    it('toggles checked state on click', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('calls onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      await user.click(checkbox);
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            checked: true
          })
        })
      );
    });

    it('calls onCheckedChange handler', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      await user.click(checkbox);
      
      expect(handleCheckedChange).toHaveBeenCalledTimes(1);
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('does not toggle when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox disabled onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      await user.click(checkbox);
      
      expect(handleChange).not.toHaveBeenCalled();
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Indeterminate State', () => {
    it('sets indeterminate state', () => {
      render(<Checkbox indeterminate />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('has mixed aria-checked when indeterminate', () => {
      render(<Checkbox indeterminate />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });

    it('has data-state attribute when indeterminate', () => {
      render(<Checkbox indeterminate />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });

    it('calls onCheckedChange with indeterminate', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox indeterminate onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      await user.click(checkbox);
      
      expect(handleCheckedChange).toHaveBeenCalledWith('indeterminate');
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms');
    });

    it('supports aria-describedby', () => {
      render(<Checkbox aria-describedby="terms-description" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-describedby', 'terms-description');
    });

    it('supports id attribute', () => {
      render(<Checkbox id="terms-checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'terms-checkbox');
    });

    it('supports name attribute', () => {
      render(<Checkbox name="terms" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('name', 'terms');
    });

    it('supports required attribute', () => {
      render(<Checkbox required />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('required');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<Checkbox className="custom-checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-checkbox');
    });

    it('applies focus styles', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('focus-visible:outline-none');
      expect(checkbox).toHaveClass('focus-visible:ring-2');
    });

    it('applies transition classes', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('transition-all');
      expect(checkbox).toHaveClass('duration-200');
    });

    it('has appearance-none class', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('appearance-none');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Checkbox ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('ref can access checkbox methods', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Checkbox ref={ref} />);
      
      expect(ref.current?.checked).toBe(false);
      if (ref.current) {
        ref.current.checked = true;
        expect(ref.current.checked).toBe(true);
      }
    });
  });
});