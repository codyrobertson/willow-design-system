import React from 'react';
import { render, screen } from '@testing-library/react';
import { Highlight } from './Highlight';

describe('Highlight Component', () => {
  describe('Rendering', () => {
    it('renders with text', () => {
      render(<Highlight text="Important message" />);
      expect(screen.getByText('Important message')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      render(<Highlight text="Test" />);
      const container = screen.getByText('Test').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('applies backdrop filter blur', () => {
      render(<Highlight text="Blur test" />);
      const container = screen.getByText('Blur test').closest('.relative');
      expect(container).toHaveAttribute('style', expect.stringContaining('backdrop-filter: blur(20px)'));
    });

    it('applies custom blur strength', () => {
      render(<Highlight text="Custom blur" blurStrength={50} />);
      const container = screen.getByText('Custom blur').closest('.relative');
      expect(container).toHaveAttribute('style', expect.stringContaining('backdrop-filter: blur(50px)'));
    });
  });

  describe('Variants', () => {
    it('renders dark variant by default', () => {
      render(<Highlight text="Dark variant" />);
      const container = screen.getByText('Dark variant').closest('.relative');
      expect(container).toHaveClass('bg-black/20');
      expect(container).toHaveClass('border-white/10');
      const text = screen.getByText('Dark variant');
      expect(text).toHaveClass('text-white');
    });

    it('renders light variant', () => {
      render(<Highlight text="Light variant" variant="light" />);
      const container = screen.getByText('Light variant').closest('.relative');
      expect(container).toHaveClass('bg-gray-100/80');
      const text = screen.getByText('Light variant');
      expect(text).toHaveClass('text-gray-800');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Highlight text="Small" size="sm" />);
      const text = screen.getByText('Small');
      expect(text).toHaveClass('text-base');
    });

    it('renders medium size by default', () => {
      render(<Highlight text="Medium" />);
      const text = screen.getByText('Medium');
      expect(text).toHaveClass('text-lg');
    });

    it('renders large size', () => {
      render(<Highlight text="Large" size="lg" />);
      const text = screen.getByText('Large');
      expect(text).toHaveClass('text-xl');
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      render(<Highlight text="With left icon" iconLeft={<LeftIcon />} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('With left icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(<Highlight text="With right icon" iconRight={<RightIcon />} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('With right icon')).toBeInTheDocument();
    });

    it('renders with both icons', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(
        <Highlight 
          text="With both icons" 
          iconLeft={<LeftIcon />} 
          iconRight={<RightIcon />} 
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('With both icons')).toBeInTheDocument();
    });

    it('renders without icons', () => {
      render(<Highlight text="No icons" />);
      expect(screen.getByText('No icons')).toBeInTheDocument();
      // Ensure no extra elements are rendered
      const container = screen.getByText('No icons').parentElement;
      expect(container?.children).toHaveLength(1);
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<Highlight text="Custom class" className="custom-highlight" />);
      const container = screen.getByText('Custom class').closest('.relative');
      expect(container).toHaveClass('custom-highlight');
    });

    it('has rounded corners', () => {
      render(<Highlight text="Rounded" />);
      const container = screen.getByText('Rounded').closest('.relative');
      expect(container).toHaveClass('rounded-2xl');
    });

    it('has full width', () => {
      render(<Highlight text="Full width" />);
      const container = screen.getByText('Full width').closest('.relative');
      expect(container).toHaveClass('w-full');
    });

    it('has correct padding', () => {
      render(<Highlight text="Padding test" />);
      const innerContainer = screen.getByText('Padding test').parentElement;
      expect(innerContainer).toHaveClass('px-6');
      expect(innerContainer).toHaveClass('py-4');
    });

    it('has correct gap between items', () => {
      const Icon = () => <span>•</span>;
      render(<Highlight text="Gap test" iconLeft={<Icon />} />);
      const innerContainer = screen.getByText('Gap test').parentElement;
      expect(innerContainer).toHaveClass('gap-3');
    });
  });

  describe('Complex Content', () => {
    it('renders with all props', () => {
      const LeftIcon = () => <span data-testid="left">L</span>;
      const RightIcon = () => <span data-testid="right">R</span>;
      
      render(
        <Highlight
          text="Full featured"
          variant="light"
          size="lg"
          blurStrength={30}
          iconLeft={<LeftIcon />}
          iconRight={<RightIcon />}
          className="test-class"
        />
      );
      
      const container = screen.getByText('Full featured').closest('.relative');
      expect(container).toHaveClass('test-class');
      expect(container).toHaveClass('bg-gray-100/80');
      expect(container).toHaveAttribute('style', expect.stringContaining('backdrop-filter: blur(30px)'));
      
      const text = screen.getByText('Full featured');
      expect(text).toHaveClass('text-xl');
      expect(text).toHaveClass('text-gray-800');
      
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByTestId('right')).toBeInTheDocument();
    });
  });
});