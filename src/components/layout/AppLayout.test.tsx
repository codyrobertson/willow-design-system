import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppLayout } from './AppLayout';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('AppLayout Component', () => {
  it('renders children', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('has min-height screen class', () => {
    render(
      <AppLayout>
        <div data-testid="child">Content</div>
      </AppLayout>
    );
    
    // The min-h-screen is on the root div, not the immediate parent
    const container = screen.getByTestId('child').parentElement?.parentElement;
    expect(container).toHaveClass('min-h-screen');
  });

  it('has neutral background', () => {
    render(
      <AppLayout>
        <div data-testid="child">Content</div>
      </AppLayout>
    );
    
    // The bg-neutral-50 is on the root div, not the immediate parent
    const container = screen.getByTestId('child').parentElement?.parentElement;
    expect(container).toHaveClass('bg-neutral-50');
  });

  it('renders multiple children', () => {
    render(
      <AppLayout>
        <header>Header</header>
        <main>Main Content</main>
        <footer>Footer</footer>
      </AppLayout>
    );
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});