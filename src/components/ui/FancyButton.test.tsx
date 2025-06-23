import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FancyButton } from './FancyButton';

// Mock console.warn to avoid noise in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

describe('FancyButton Component (Deprecated)', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<FancyButton>Click me</FancyButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('warns about deprecation', () => {
      render(<FancyButton>Test</FancyButton>);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('FancyButton is deprecated')
      );
    });

    it('renders with left icon', () => {
      const Icon = () => <span data-testid="left-icon">←</span>;
      render(<FancyButton leftIcon={<Icon />}>With Icon</FancyButton>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const Icon = () => <span data-testid="right-icon">→</span>;
      render(<FancyButton rightIcon={<Icon />}>With Icon</FancyButton>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<FancyButton disabled>Disabled</FancyButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('renders loading state', () => {
      render(<FancyButton loading>Loading</FancyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('renders primary variant', () => {
      render(<FancyButton variant="primary">Primary</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders secondary variant', () => {
      render(<FancyButton variant="secondary">Secondary</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders ghost variant', () => {
      render(<FancyButton variant="ghost">Ghost</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders outline variant', () => {
      render(<FancyButton variant="outline">Outline</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders danger variant', () => {
      render(<FancyButton variant="danger">Danger</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders fancy variant', () => {
      render(<FancyButton variant="fancy">Fancy</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders xs size', () => {
      render(<FancyButton size="xs">XS</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders sm size', () => {
      render(<FancyButton size="sm">SM</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders md size', () => {
      render(<FancyButton size="md">MD</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders lg size', () => {
      render(<FancyButton size="lg">LG</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders xl size', () => {
      render(<FancyButton size="xl">XL</FancyButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onClick handler', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<FancyButton onClick={handleClick}>Click me</FancyButton>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<FancyButton disabled onClick={handleClick}>Click me</FancyButton>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Props', () => {
    it('renders full width', () => {
      render(<FancyButton fullWidth>Full Width</FancyButton>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });

    it('supports custom className', () => {
      render(<FancyButton className="custom-class">Custom</FancyButton>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('supports button type', () => {
      render(<FancyButton type="submit">Submit</FancyButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('has rounded-full radius', () => {
      render(<FancyButton>Rounded</FancyButton>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('rounded-full');
    });
  });
});