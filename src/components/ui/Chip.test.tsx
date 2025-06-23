import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';

describe('Chip Component', () => {
  describe('Rendering', () => {
    it('renders chip with text', () => {
      render(<Chip>React</Chip>);
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      const Icon = () => <svg data-testid="chip-icon" />;
      render(<Chip icon={<Icon />}>With Icon</Chip>);
      
      expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders with remove button when onRemove is provided', () => {
      render(<Chip onRemove={() => {}}>Removable</Chip>);
      expect(screen.getByLabelText('Remove')).toBeInTheDocument();
    });

    it('renders as button when onClick is provided', () => {
      render(<Chip onClick={() => {}}>Clickable</Chip>);
      const chip = screen.getByRole('button');
      expect(chip).toHaveTextContent('Clickable');
      expect(chip.tagName).toBe('BUTTON');
    });

    it('renders as div when onClick is not provided', () => {
      render(<Chip>Static</Chip>);
      // No role="button" when not clickable
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText('Static').parentElement?.tagName).toBe('DIV');
    });
  });

  describe('Variants and Themes', () => {
    const variants = ['normal', 'fancy'] as const;
    const themes = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Chip variant={variant}>{variant} chip</Chip>);
        const chip = screen.getByText(`${variant} chip`).parentElement;
        expect(chip?.className).toContain(variant === 'normal' ? 'rounded-lg' : 'rounded-full');
      });
    });

    themes.forEach(theme => {
      it(`renders ${theme} theme correctly`, () => {
        render(<Chip theme={theme}>{theme} chip</Chip>);
        const chip = screen.getByText(`${theme} chip`);
        expect(chip).toBeInTheDocument();
      });
    });

    it('applies selected styles when selected', () => {
      render(
        <>
          <Chip selected data-testid="selected">Selected</Chip>
          <Chip selected={false} data-testid="unselected">Unselected</Chip>
        </>
      );
      
      const selected = screen.getByTestId('selected');
      const unselected = screen.getByTestId('unselected');
      
      // Selected chips have different background colors
      expect(selected.className).toContain('bg-willow-primary-950');
      expect(unselected.className).toContain('bg-white');
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Chip size={size}>{size} chip</Chip>);
        const chip = screen.getByText(`${size} chip`).parentElement;
        
        // Check height classes
        if (size === 'sm') expect(chip?.className).toContain('h-7');
        if (size === 'md') expect(chip?.className).toContain('h-9');
        if (size === 'lg') expect(chip?.className).toContain('h-11');
      });
    });
  });

  describe('Interactions', () => {
    it('calls onClick when chip is clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Chip onClick={handleClick}>Click me</Chip>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onRemove when remove button is clicked', async () => {
      const handleRemove = jest.fn();
      const user = userEvent.setup();
      
      render(<Chip onRemove={handleRemove}>Removable</Chip>);
      await user.click(screen.getByLabelText('Remove'));
      
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when remove button is clicked on clickable chip', async () => {
      const handleClick = jest.fn();
      const handleRemove = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Chip onClick={handleClick} onRemove={handleRemove}>
          Both clickable and removable
        </Chip>
      );
      
      await user.click(screen.getByLabelText('Remove'));
      
      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard interaction on remove button in clickable chip', () => {
      const handleRemove = jest.fn();
      const handleClick = jest.fn();
      
      render(
        <Chip onClick={handleClick} onRemove={handleRemove}>
          Keyboard test
        </Chip>
      );
      
      const removeButton = screen.getByLabelText('Remove');
      
      // Test Enter key
      fireEvent.keyDown(removeButton, { key: 'Enter' });
      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleClick).not.toHaveBeenCalled();
      
      // Test Space key
      fireEvent.keyDown(removeButton, { key: ' ' });
      expect(handleRemove).toHaveBeenCalledTimes(2);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria attributes when clickable', () => {
      render(
        <Chip onClick={() => {}} selected>
          Accessible
        </Chip>
      );
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('aria-selected', 'true');
      expect(chip).toHaveAttribute('aria-pressed', 'true');
    });

    it('has correct aria attributes when not clickable', () => {
      render(<Chip selected>Static Selected</Chip>);
      const chip = screen.getByText('Static Selected').parentElement;
      expect(chip).toHaveAttribute('aria-selected', 'true');
    });

    it('remove button has accessible label', () => {
      render(<Chip onRemove={() => {}}>Removable</Chip>);
      const removeButton = screen.getByLabelText('Remove');
      expect(removeButton).toBeInTheDocument();
    });

    it('supports custom role', () => {
      render(<Chip role="option">Custom Role</Chip>);
      expect(screen.getByRole('option')).toBeInTheDocument();
    });

    it('icon has aria-hidden', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(<Chip icon={<Icon />}>With Icon</Chip>);
      
      const iconWrapper = screen.getByTestId('icon').parentElement;
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<Chip className="custom-chip-class">Custom</Chip>);
      expect(screen.getByText('Custom').parentElement).toHaveClass('custom-chip-class');
    });

    it('applies hover styles', () => {
      render(<Chip>Hover Test</Chip>);
      const chip = screen.getByText('Hover Test').parentElement;
      expect(chip?.className).toContain('hover:shadow-chip-hover');
    });

    it('applies focus styles', () => {
      render(<Chip onClick={() => {}}>Focus Test</Chip>);
      const chip = screen.getByRole('button');
      expect(chip.className).toContain('focus:outline-none');
      expect(chip.className).toContain('focus:ring-2');
    });

    it('applies disabled styles', () => {
      render(<Chip disabled>Disabled</Chip>);
      const chip = screen.getByText('Disabled').parentElement;
      expect(chip?.className).toContain('disabled:pointer-events-none');
      expect(chip?.className).toContain('disabled:opacity-50');
    });

    it('applies correct icon sizing', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(<Chip icon={<Icon />}>Icon Size</Chip>);
      
      const iconWrapper = screen.getByTestId('icon').parentElement;
      expect(iconWrapper?.className).toContain('[&>svg]:w-[0.89em]');
      expect(iconWrapper?.className).toContain('[&>svg]:h-[0.89em]');
    });

    it('applies correct remove button sizing', () => {
      render(<Chip onRemove={() => {}}>Remove Size</Chip>);
      const removeButton = screen.getByLabelText('Remove');
      const svg = removeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-[0.89em]');
      expect(svg).toHaveClass('h-[0.89em]');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to button element when clickable', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Chip ref={ref} onClick={() => {}}>
          Clickable
        </Chip>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('forwards ref to div element when not clickable', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Chip ref={ref}>Static</Chip>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles both icon and remove button', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(
        <Chip icon={<Icon />} onRemove={() => {}}>
          Both features
        </Chip>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove')).toBeInTheDocument();
    });

    it('handles all props together', () => {
      const Icon = () => <svg data-testid="icon" />;
      const handleClick = jest.fn();
      const handleRemove = jest.fn();
      
      render(
        <Chip
          variant="fancy"
          theme="success"
          size="lg"
          selected
          icon={<Icon />}
          onClick={handleClick}
          onRemove={handleRemove}
          className="custom-class"
        >
          Full featured
        </Chip>
      );
      
      // When there's a remove button, there are multiple elements with role="button"
      const chip = screen.getByText('Full featured').closest('button');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass('custom-class');
      expect(chip).toHaveClass('rounded-full'); // fancy variant
      expect(chip).toHaveClass('h-11'); // lg size
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove')).toBeInTheDocument();
    });
  });
});