import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies secondary variant correctly', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('applies outline variant correctly', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText('Outline Badge');
    expect(badge).toHaveClass('text-foreground');
  });

  it('applies destructive variant correctly', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Badge ref={ref}>Badge</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders different content types', () => {
    render(
      <Badge>
        <span>Icon</span>
        Text Content
      </Badge>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text Content')).toBeInTheDocument();
  });
});