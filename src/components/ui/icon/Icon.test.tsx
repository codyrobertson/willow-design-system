import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Icon } from './Icon';

// Mock console.warn to test warnings
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

describe('Icon', () => {
  it('renders a valid icon', () => {
    render(<Icon name="user" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName).toBe('svg');
  });

  it('handles undefined icon name gracefully', () => {
    const { container } = render(<Icon name={undefined as any} />);
    expect(container.firstChild).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Icon name is undefined');
  });

  it('handles empty string icon name', () => {
    const { container } = render(<Icon name="" />);
    expect(container.firstChild).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'Icon "" (looking for "") not found in lucide-react'
    );
  });

  it('handles null icon name', () => {
    const { container } = render(<Icon name={null as any} />);
    expect(container.firstChild).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Icon name is null');
  });

  it('warns when icon is not found', () => {
    const { container } = render(<Icon name="non-existent-icon" />);
    expect(container.firstChild).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'Icon "non-existent-icon" (looking for "NonExistentIcon") not found in lucide-react'
    );
  });

  it('applies size presets correctly', () => {
    const { rerender } = render(<Icon name="user" size="xs" data-testid="icon" />);
    expect(screen.getByTestId('icon')).toHaveAttribute('width', '12');
    expect(screen.getByTestId('icon')).toHaveAttribute('height', '12');

    rerender(<Icon name="user" size="lg" data-testid="icon" />);
    expect(screen.getByTestId('icon')).toHaveAttribute('width', '24');
    expect(screen.getByTestId('icon')).toHaveAttribute('height', '24');
  });

  it('applies custom numeric size', () => {
    render(<Icon name="user" size={30} data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('width', '30');
    expect(icon).toHaveAttribute('height', '30');
  });

  it('applies custom className', () => {
    render(<Icon name="user" className="text-red-500" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveClass('shrink-0', 'text-red-500');
  });

  it('handles aria-label correctly', () => {
    render(<Icon name="user" aria-label="User profile" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-label', 'User profile');
    expect(icon).toHaveAttribute('aria-hidden', 'false');
  });

  it('sets aria-hidden when no aria-label provided', () => {
    render(<Icon name="user" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<SVGSVGElement>();
    render(<Icon name="user" ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it('handles kebab-case icon names', () => {
    render(<Icon name="chevron-down" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('handles icon names with multiple dashes', () => {
    render(<Icon name="arrow-big-down" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(console.warn).not.toHaveBeenCalled();
  });
});