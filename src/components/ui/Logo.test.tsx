import React from 'react';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo Component', () => {
  describe('Rendering', () => {
    it('renders logo with default props', () => {
      render(<Logo />);
      const logo = screen.getByRole('img', { name: 'Willow logo' });
      expect(logo).toBeInTheDocument();
    });

    it('renders as svg element', () => {
      render(<Logo />);
      const logo = screen.getByRole('img');
      expect(logo.tagName).toBe('svg');
    });

    it('has accessible label', () => {
      render(<Logo />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('aria-label', 'Willow logo');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Logo size="sm" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('width', '94');
      expect(logo).toHaveAttribute('height', '24');
    });

    it('renders medium size by default', () => {
      render(<Logo />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('width', '126');
      expect(logo).toHaveAttribute('height', '32');
    });

    it('renders large size', () => {
      render(<Logo size="lg" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('width', '157');
      expect(logo).toHaveAttribute('height', '40');
    });
  });

  describe('Lockup Variations', () => {
    it('renders full lockup by default', () => {
      render(<Logo />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('viewBox', '0 0 132 32');
    });

    it('renders logomark only', () => {
      render(<Logo lockup="logomark" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('viewBox', '0 0 30 30');
      expect(logo).toHaveAttribute('width', '32'); // md size icon
      expect(logo).toHaveAttribute('height', '32');
    });

    it('renders icon only', () => {
      render(<Logo lockup="icon" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('viewBox', '0 0 30 30');
    });

    it('renders wordmark only', () => {
      render(<Logo lockup="wordmark" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('viewBox', '0 0 132 32');
    });

    it('scales icon size correctly for different sizes', () => {
      render(<Logo lockup="icon" size="sm" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('width', '24');
      expect(logo).toHaveAttribute('height', '24');
    });
  });

  describe('Variants', () => {
    it('renders light variant by default', () => {
      render(<Logo />);
      const logo = screen.getByRole('img');
      // Light variant uses specific gradient IDs
      expect(logo.innerHTML).toContain('paint0_linear_dark');
    });

    it('renders dark variant', () => {
      render(<Logo variant="dark" />);
      const logo = screen.getByRole('img');
      // Dark variant uses different gradient IDs
      expect(logo.innerHTML).toContain('paint0_linear_light');
    });
  });

  describe('SVG Properties', () => {
    it('includes required SVG attributes', () => {
      render(<Logo />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('fill', 'none');
      expect(logo).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('contains gradient definitions', () => {
      render(<Logo />);
      const logo = screen.getByRole('img');
      const defs = logo.querySelector('defs');
      expect(defs).toBeInTheDocument();
      expect(defs?.querySelector('linearGradient')).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('renders small dark logomark', () => {
      render(<Logo size="sm" variant="dark" lockup="logomark" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('width', '24');
      expect(logo).toHaveAttribute('height', '24');
      expect(logo).toHaveAttribute('viewBox', '0 0 30 30');
    });

    it('renders large light wordmark', () => {
      render(<Logo size="lg" variant="light" lockup="wordmark" />);
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('width', '157');
      expect(logo).toHaveAttribute('height', '40');
      expect(logo).toHaveAttribute('viewBox', '0 0 132 32');
    });
  });
});