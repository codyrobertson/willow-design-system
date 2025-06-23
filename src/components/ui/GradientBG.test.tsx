import React from 'react';
import { render, screen } from '@testing-library/react';
import GradientBG from './GradientBG';

describe('GradientBG Component', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(
        <GradientBG>
          <div>Test Content</div>
        </GradientBG>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders with default height', () => {
      render(<GradientBG>Content</GradientBG>);
      const outerContainer = screen.getByText('Content').closest('.relative.w-full');
      expect(outerContainer).toHaveClass('min-h-screen');
    });

    it('renders with custom height', () => {
      render(<GradientBG height="h-96">Content</GradientBG>);
      const outerContainer = screen.getByText('Content').closest('.relative.w-full');
      expect(outerContainer).toHaveClass('h-96');
    });

    it('renders with custom className', () => {
      render(<GradientBG className="custom-bg">Content</GradientBG>);
      const outerContainer = screen.getByText('Content').closest('.relative.w-full');
      expect(outerContainer).toHaveClass('custom-bg');
    });
  });

  describe('Background Image', () => {
    it('renders background image when imageUrl is provided', () => {
      render(<GradientBG imageUrl="test.jpg">Content</GradientBG>);
      const imageLayer = document.querySelector('.bg-no-repeat');
      expect(imageLayer).toBeInTheDocument();
      expect(imageLayer).toHaveStyle({ backgroundImage: "url('test.jpg')" });
    });

    it('does not render image layer when no imageUrl', () => {
      render(<GradientBG>Content</GradientBG>);
      const imageLayer = document.querySelector('.bg-no-repeat');
      expect(imageLayer).not.toBeInTheDocument();
    });

    it('applies custom background size', () => {
      render(<GradientBG imageUrl="test.jpg" backgroundSize="contain">Content</GradientBG>);
      const imageLayer = document.querySelector('.bg-no-repeat');
      expect(imageLayer).toHaveStyle({ backgroundSize: 'contain' });
    });

    it('applies custom background position', () => {
      render(<GradientBG imageUrl="test.jpg" backgroundPosition="top right">Content</GradientBG>);
      const imageLayer = document.querySelector('.bg-no-repeat');
      expect(imageLayer).toHaveStyle({ backgroundPosition: 'top right' });
    });

    it('applies blur filter to image', () => {
      render(<GradientBG imageUrl="test.jpg" blur={5}>Content</GradientBG>);
      const imageLayer = document.querySelector('.bg-no-repeat');
      expect(imageLayer).toHaveStyle({ filter: 'blur(5px)' });
    });
  });

  describe('Gradient Overlay', () => {
    it('renders gradient with multiple colors', () => {
      render(
        <GradientBG gradientColors={['#ff0000', '#00ff00']}>
          Content
        </GradientBG>
      );
      const gradientLayer = document.querySelector('.absolute.inset-0:not(.bg-no-repeat)');
      expect(gradientLayer).toBeInTheDocument();
      expect(gradientLayer).toHaveStyle({ 
        backgroundImage: 'linear-gradient(to bottom, #ff0000, #00ff00)' 
      });
    });

    it('renders solid color for single gradient color', () => {
      render(
        <GradientBG gradientColors={['#ff0000']}>
          Content
        </GradientBG>
      );
      const gradientLayer = document.querySelector('.absolute.inset-0:not(.bg-no-repeat)');
      expect(gradientLayer).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('does not render gradient layer when no colors', () => {
      render(<GradientBG>Content</GradientBG>);
      const gradientLayers = document.querySelectorAll('.absolute.inset-0');
      expect(gradientLayers).toHaveLength(0);
    });

    it('applies custom gradient direction', () => {
      render(
        <GradientBG 
          gradientColors={['#ff0000', '#00ff00']}
          gradientDirection="to right"
        >
          Content
        </GradientBG>
      );
      const gradientLayer = document.querySelector('.absolute.inset-0:not(.bg-no-repeat)');
      expect(gradientLayer).toHaveStyle({ 
        backgroundImage: 'linear-gradient(to right, #ff0000, #00ff00)' 
      });
    });

    it('applies gradient opacity', () => {
      render(
        <GradientBG 
          gradientColors={['#ff0000', '#00ff00']}
          gradientOpacity={0.5}
        >
          Content
        </GradientBG>
      );
      const gradientLayer = document.querySelector('.absolute.inset-0:not(.bg-no-repeat)');
      expect(gradientLayer).toHaveStyle({ opacity: '0.5' });
    });
  });

  describe('Dark Overlay', () => {
    it('renders dark overlay when enabled', () => {
      render(<GradientBG darkOverlay>Content</GradientBG>);
      const darkLayer = document.querySelector('.bg-black\\/50');
      expect(darkLayer).toBeInTheDocument();
    });

    it('does not render dark overlay by default', () => {
      render(<GradientBG>Content</GradientBG>);
      const darkLayer = document.querySelector('.bg-black\\/50');
      expect(darkLayer).not.toBeInTheDocument();
    });
  });

  describe('Layer Order', () => {
    it('renders all layers in correct order', () => {
      render(
        <GradientBG 
          imageUrl="test.jpg"
          gradientColors={['#ff0000', '#00ff00']}
          darkOverlay
        >
          <div data-testid="content">Content</div>
        </GradientBG>
      );
      
      const container = screen.getByTestId('content').closest('.relative.w-full');
      const children = Array.from(container?.children || []);
      
      // Should have 4 children: image, gradient, dark overlay, content
      expect(children).toHaveLength(4);
      
      // Check content is last (highest z-index)
      const contentWrapper = children[children.length - 1];
      expect(contentWrapper).toHaveClass('relative z-10');
    });
  });

  describe('Complex Scenarios', () => {
    it('renders with all features combined', () => {
      render(
        <GradientBG
          imageUrl="background.jpg"
          gradientColors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
          gradientDirection="to top"
          blur={10}
          gradientOpacity={0.8}
          backgroundSize="cover"
          backgroundPosition="center top"
          darkOverlay
          height="h-screen"
          className="test-gradient"
        >
          <h1>Hero Title</h1>
        </GradientBG>
      );
      
      const container = screen.getByText('Hero Title').closest('.relative.w-full');
      expect(container).toHaveClass('test-gradient');
      expect(container).toHaveClass('h-screen');
      
      const imageLayer = document.querySelector('.bg-no-repeat');
      expect(imageLayer).toHaveStyle({ 
        backgroundImage: "url('background.jpg')",
        filter: 'blur(10px)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top'
      });
      
      // Find gradient layer by checking style
      const allLayers = document.querySelectorAll('.absolute.inset-0');
      let gradientLayer = null;
      allLayers.forEach(layer => {
        const style = layer.getAttribute('style');
        if (style && style.includes('linear-gradient')) {
          gradientLayer = layer;
        }
      });
      
      expect(gradientLayer).toBeTruthy();
      expect(gradientLayer).toHaveStyle({ 
        backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0), rgba(0,0,0,1))',
        opacity: '0.8'
      });
      
      // Check for dark overlay
      const hasBlackOverlay = Array.from(allLayers).some(layer => 
        layer.className.includes('bg-black')
      );
      expect(hasBlackOverlay).toBe(true);
    });

    it('renders without any background effects', () => {
      render(<GradientBG>Plain Content</GradientBG>);
      const container = screen.getByText('Plain Content').closest('.relative');
      const backgroundLayers = container?.querySelectorAll('.absolute.inset-0');
      expect(backgroundLayers).toHaveLength(0);
    });
  });
});