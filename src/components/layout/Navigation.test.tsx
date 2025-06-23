import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from './Navigation';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders navigation with logo', () => {
      render(<Navigation />);
      const logo = screen.getByRole('img', { name: 'Willow logo' });
      expect(logo).toBeInTheDocument();
    });

    it('renders registry link', () => {
      render(<Navigation />);
      const link = screen.getByRole('link', { name: /Registry/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/registry');
    });

    it('renders user profile button', () => {
      render(<Navigation />);
      // Look for UserCircle icon by its parent button
      const buttons = screen.getAllByRole('button');
      const userButton = buttons.find(btn => 
        btn.querySelector('svg.lucide-user-circle')
      );
      expect(userButton).toBeInTheDocument();
    });

    it('renders with default styling when not transparent', () => {
      render(<Navigation />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-white');
      expect(nav).toHaveClass('border-b');
      expect(nav).toHaveClass('border-neutral-100');
    });

    it('renders with transparent styling', () => {
      render(<Navigation transparent />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('absolute');
      expect(nav).toHaveClass('top-0');
      expect(nav).toHaveClass('z-50');
      expect(nav).not.toHaveClass('bg-white');
    });
  });

  describe('Back Button', () => {
    it('does not show back button by default', () => {
      render(<Navigation />);
      const buttons = screen.getAllByRole('button');
      const backButton = buttons.find(btn => 
        btn.querySelector('svg.lucide-arrow-left')
      );
      expect(backButton).not.toBeDefined();
    });

    it('shows back button when showBackButton is true', () => {
      render(<Navigation showBackButton />);
      const buttons = screen.getAllByRole('button');
      const backButton = buttons.find(btn => 
        btn.querySelector('svg.lucide-arrow-left')
      );
      expect(backButton).toBeInTheDocument();
    });

    it('calls router.back() when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<Navigation showBackButton />);
      
      const buttons = screen.getAllByRole('button');
      const backButton = buttons.find(btn => 
        btn.querySelector('svg.lucide-arrow-left')
      );
      
      if (backButton) {
        await user.click(backButton);
        expect(mockBack).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Logo Props', () => {
    it('uses default icon lockup when not transparent', () => {
      render(<Navigation />);
      const logo = screen.getByRole('img', { name: 'Willow logo' });
      // Icon lockup has smaller viewBox
      expect(logo).toHaveAttribute('viewBox', '0 0 30 30');
    });

    it('uses full lockup when transparent', () => {
      render(<Navigation transparent />);
      const logo = screen.getByRole('img', { name: 'Willow logo' });
      // Full lockup has larger viewBox
      expect(logo).toHaveAttribute('viewBox', '0 0 132 32');
    });

    it('passes custom logo props', () => {
      render(
        <Navigation 
          logoSize="lg"
          logoLockup="wordmark"
          logoVariant="light"
        />
      );
      const logo = screen.getByRole('img', { name: 'Willow logo' });
      expect(logo).toHaveAttribute('width', '157'); // lg size
      expect(logo).toHaveAttribute('viewBox', '0 0 132 32'); // wordmark
    });
  });

  describe('Styling Variations', () => {
    it('applies hover styles for non-transparent navigation', () => {
      render(<Navigation />);
      const link = screen.getByRole('link', { name: /Registry/i });
      expect(link).toHaveClass('hover:bg-neutral-100');
    });

    it('applies hover styles for transparent navigation', () => {
      render(<Navigation transparent />);
      const link = screen.getByRole('link', { name: /Registry/i });
      expect(link).toHaveClass('hover:bg-white/10');
      expect(link).toHaveClass('text-white');
    });

    it('has responsive padding', () => {
      render(<Navigation />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('px-4');
      expect(nav).toHaveClass('sm:px-6');
      expect(nav).toHaveClass('py-3');
      expect(nav).toHaveClass('sm:py-4');
    });

    it('constrains content width', () => {
      render(<Navigation />);
      const container = screen.getByRole('navigation').firstChild;
      expect(container).toHaveClass('max-w-7xl');
      expect(container).toHaveClass('mx-auto');
    });
  });
});