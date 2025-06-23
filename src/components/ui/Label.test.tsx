import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from './Label';

describe('Label Component', () => {
  describe('Rendering', () => {
    it('renders label with text', () => {
      render(<Label>Email Address</Label>);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('renders as label element', () => {
      render(<Label>Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label.tagName).toBe('LABEL');
    });

    it('applies default classes', () => {
      render(<Label>Default Classes</Label>);
      const label = screen.getByText('Default Classes');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-normal');
      expect(label).toHaveClass('leading-none');
    });

    it('applies custom className', () => {
      render(<Label className="custom-label">Custom</Label>);
      const label = screen.getByText('Custom');
      expect(label).toHaveClass('custom-label');
      expect(label).toHaveClass('text-sm'); // Still has default classes
    });
  });

  describe('Attributes', () => {
    it('supports htmlFor attribute', () => {
      render(<Label htmlFor="email-input">Email</Label>);
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email-input');
    });

    it('supports all HTML label attributes', () => {
      render(
        <Label 
          id="test-label"
          data-testid="label"
          aria-label="Test label"
        >
          Label
        </Label>
      );
      
      const label = screen.getByTestId('label');
      expect(label).toHaveAttribute('id', 'test-label');
      expect(label).toHaveAttribute('aria-label', 'Test label');
    });
  });

  describe('Peer Styles', () => {
    it('has peer-disabled styles', () => {
      render(<Label>Peer Label</Label>);
      const label = screen.getByText('Peer Label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-70');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Ref Test</Label>);
      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });
  });

  describe('Children', () => {
    it('renders with complex children', () => {
      render(
        <Label>
          <span>Required Field</span>
          <span className="text-red-500">*</span>
        </Label>
      );
      expect(screen.getByText('Required Field')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });
});