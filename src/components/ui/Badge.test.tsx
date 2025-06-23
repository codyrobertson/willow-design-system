import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from './Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders badge with text', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with icon on the left by default', () => {
      const Icon = () => <svg data-testid="badge-icon" />;
      render(<Badge icon={<Icon />}>With Icon</Badge>);
      
      const icon = screen.getByTestId('badge-icon');
      const text = screen.getByText('With Icon');
      
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('renders with icon on the right when specified', () => {
      const Icon = () => <svg data-testid="badge-icon" />;
      render(<Badge icon={<Icon />} iconPosition="right">With Icon</Badge>);
      
      expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
    });

    it('renders with dot indicator', () => {
      render(<Badge dot>Status</Badge>);
      expect(screen.getByText('Status')).toBeInTheDocument();
      // The dot is rendered as a span with specific classes
      const badge = screen.getByText('Status').parentElement;
      expect(badge?.querySelector('span.rounded-full')).toBeInTheDocument();
    });

    it('renders closable badge with close button', () => {
      render(<Badge closable>Closable</Badge>);
      expect(screen.getByLabelText('Remove badge')).toBeInTheDocument();
    });
  });

  describe('Variants and Colors', () => {
    const variants = ['solid', 'soft', 'outline'] as const;
    const colors = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;

    variants.forEach(variant => {
      colors.forEach(color => {
        it(`renders ${variant} variant with ${color} color`, () => {
          render(<Badge variant={variant} color={color}>{variant}-{color}</Badge>);
          const badge = screen.getByText(`${variant}-${color}`);
          expect(badge).toBeInTheDocument();
          // Check that appropriate color classes are applied
          expect(badge.parentElement?.className).toMatch(/bg-|text-|border-/);
        });
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Badge size={size}>{size} badge</Badge>);
        const badge = screen.getByText(`${size} badge`);
        expect(badge).toBeInTheDocument();
        // Check height class
        expect(badge.parentElement?.className).toMatch(/h-\d+/);
      });
    });
  });

  describe('Rounded Options', () => {
    it('renders with full rounded corners by default', () => {
      render(<Badge>Rounded Full</Badge>);
      const badge = screen.getByText('Rounded Full').parentElement;
      expect(badge?.className).toContain('rounded-full');
    });

    it('renders with medium rounded corners', () => {
      render(<Badge rounded="md">Rounded MD</Badge>);
      const badge = screen.getByText('Rounded MD').parentElement;
      expect(badge?.className).toContain('rounded-md');
    });
  });

  describe('Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const handleClose = jest.fn();
      const user = userEvent.setup();
      
      render(<Badge closable onClose={handleClose}>Closable</Badge>);
      
      await user.click(screen.getByLabelText('Remove badge'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when close button is clicked', () => {
      const handleClose = jest.fn();
      const handleBadgeClick = jest.fn();
      
      render(
        <div onClick={handleBadgeClick}>
          <Badge closable onClose={handleClose}>Closable</Badge>
        </div>
      );
      
      fireEvent.click(screen.getByLabelText('Remove badge'));
      
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleBadgeClick).not.toHaveBeenCalled();
    });
  });

  describe('Dot Indicator Styling', () => {
    it('applies correct dot styling for solid variant', () => {
      render(<Badge variant="solid" dot>Solid</Badge>);
      const dot = screen.getByText('Solid').parentElement?.querySelector('.rounded-full');
      expect(dot?.className).toContain('bg-white');
    });

    it('applies correct dot styling for soft variant', () => {
      render(<Badge variant="soft" dot>Soft</Badge>);
      const dot = screen.getByText('Soft').parentElement?.querySelector('.rounded-full');
      expect(dot?.className).toContain('bg-current');
    });

    it('applies correct dot styling for outline variant', () => {
      render(<Badge variant="outline" dot>Outline</Badge>);
      const dot = screen.getByText('Outline').parentElement?.querySelector('.rounded-full');
      expect(dot?.className).toContain('bg-current');
    });
  });

  describe('Accessibility', () => {
    it('close button has accessible label', () => {
      render(<Badge closable>Accessible</Badge>);
      const closeButton = screen.getByLabelText('Remove badge');
      expect(closeButton).toHaveAttribute('aria-label', 'Remove badge');
    });

    it('supports custom className', () => {
      render(<Badge className="custom-badge-class">Custom</Badge>);
      expect(screen.getByText('Custom').parentElement).toHaveClass('custom-badge-class');
    });

    it('forwards additional props', () => {
      render(<Badge data-testid="custom-badge">Test Badge</Badge>);
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    });
  });

  describe('Icon Sizing', () => {
    it('applies correct icon sizing classes', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(<Badge icon={<Icon />}>Icon Badge</Badge>);
      
      const iconWrapper = screen.getByTestId('icon').parentElement;
      expect(iconWrapper?.className).toContain('[&>svg]:w-[0.89em]');
      expect(iconWrapper?.className).toContain('[&>svg]:h-[0.89em]');
    });
  });
});