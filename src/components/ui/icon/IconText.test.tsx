import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IconText } from './IconText';

// Mock the Icon component
jest.mock('./Icon', () => ({
  Icon: ({ name, size, className }: any) => (
    <div 
      data-testid="icon" 
      {...(name !== undefined && { 'data-name': String(name) })}
      {...(size !== undefined && { 'data-size': String(size) })}
      className={className}
    >
      Icon: {String(name)}
    </div>
  ),
}));

describe('IconText', () => {
  describe('Edge Cases', () => {
    it('handles undefined icon name', () => {
      const { container } = render(
        <IconText icon={undefined as any}>
          Text content
        </IconText>
      );
      expect(screen.getByText('Text content')).toBeInTheDocument();
      // undefined props are not passed, so no data-name attribute
      expect(screen.getByTestId('icon')).not.toHaveAttribute('data-name');
      expect(screen.getByTestId('icon')).toHaveTextContent('Icon: undefined');
    });

    it('handles null icon name', () => {
      const { container } = render(
        <IconText icon={null as any}>
          Text content
        </IconText>
      );
      expect(screen.getByText('Text content')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'null');
    });

    it('handles empty string icon name', () => {
      render(
        <IconText icon="">
          Text content
        </IconText>
      );
      expect(screen.getByText('Text content')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toHaveAttribute('data-name', '');
    });

    it('handles undefined children', () => {
      const { container } = render(
        <IconText icon="user">
          {undefined}
        </IconText>
      );
      expect(container.querySelector('span')).toBeInTheDocument();
      expect(container.querySelector('span')).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      const { container } = render(
        <IconText icon="user">
          {null}
        </IconText>
      );
      expect(container.querySelector('span')).toBeInTheDocument();
      expect(container.querySelector('span')).toBeEmptyDOMElement();
    });

    it('handles empty string children', () => {
      render(
        <IconText icon="user">
          {''}
        </IconText>
      );
      const span = screen.getByText('', { selector: 'span' });
      expect(span).toBeInTheDocument();
    });

    it('handles multiple children including null', () => {
      render(
        <IconText icon="user">
          Text
          {null}
          More text
        </IconText>
      );
      expect(screen.getByText(/TextMore text/)).toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const longText = 'A'.repeat(1000);
      render(
        <IconText icon="user">
          {longText}
        </IconText>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in children', () => {
      render(
        <IconText icon="user">
          {'<script>alert("XSS")</script>'}
        </IconText>
      );
      expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument();
    });

    it('handles invalid iconPosition values', () => {
      const { container } = render(
        <IconText icon="user" iconPosition={'invalid' as any}>
          Text
        </IconText>
      );
      // Should still render without crashing
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('handles invalid size values', () => {
      render(
        <IconText icon="user" size={'invalid' as any}>
          Text
        </IconText>
      );
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toHaveAttribute('data-size', 'invalid');
    });

    it('handles invalid gap values', () => {
      const { container } = render(
        <IconText icon="user" gap={'invalid' as any}>
          Text
        </IconText>
      );
      // Should still render but without a valid gap class
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Core Functionality', () => {
    it('renders icon and text with default props', () => {
      render(
        <IconText icon="user">
          User Profile
        </IconText>
      );
      
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'user');
      expect(screen.getByTestId('icon')).toHaveAttribute('data-size', 'md');
    });

    it('positions icon on the left by default', () => {
      const { container } = render(
        <IconText icon="user">
          Text
        </IconText>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass('flex-row-reverse');
    });

    it('positions icon on the right when specified', () => {
      const { container } = render(
        <IconText icon="user" iconPosition="right">
          Text
        </IconText>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex-row-reverse');
    });

    it('applies different gap sizes', () => {
      const { container, rerender } = render(
        <IconText icon="user" gap="xs">
          Text
        </IconText>
      );
      
      expect(container.firstChild).toHaveClass('gap-1');

      rerender(
        <IconText icon="user" gap="lg">
          Text
        </IconText>
      );
      
      expect(container.firstChild).toHaveClass('gap-4');
    });

    it('passes size prop to Icon component', () => {
      render(
        <IconText icon="user" size="lg">
          Text
        </IconText>
      );
      
      expect(screen.getByTestId('icon')).toHaveAttribute('data-size', 'lg');
    });

    it('applies custom className', () => {
      const { container } = render(
        <IconText icon="user" className="custom-class">
          Text
        </IconText>
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <IconText icon="user" ref={ref}>
          Text
        </IconText>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('spreads additional props', () => {
      render(
        <IconText icon="user" data-testid="icon-text" aria-label="User info">
          Text
        </IconText>
      );
      
      const element = screen.getByTestId('icon-text');
      expect(element).toHaveAttribute('aria-label', 'User info');
    });

    it('renders with React node children', () => {
      render(
        <IconText icon="user">
          <strong>Bold text</strong>
          <em>Italic text</em>
        </IconText>
      );
      
      expect(screen.getByText('Bold text')).toBeInTheDocument();
      expect(screen.getByText('Italic text')).toBeInTheDocument();
    });

    it('maintains flex layout with proper alignment', () => {
      const { container } = render(
        <IconText icon="user">
          Text
        </IconText>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('inline-flex', 'items-center');
    });

    it('icon maintains shrink-0 class', () => {
      render(
        <IconText icon="user">
          Text
        </IconText>
      );
      
      expect(screen.getByTestId('icon')).toHaveClass('shrink-0');
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      const { container } = render(
        <IconText icon="user">
          User Name
        </IconText>
      );
      
      expect(container.querySelector('div')).toBeInTheDocument();
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('supports aria attributes', () => {
      render(
        <IconText 
          icon="user" 
          aria-label="User information"
          role="status"
        >
          John Doe
        </IconText>
      );
      
      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-label', 'User information');
    });

    it('preserves semantic meaning of children', () => {
      render(
        <IconText icon="user">
          <h3>Heading Text</h3>
        </IconText>
      );
      
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});