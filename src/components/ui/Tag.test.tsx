import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from './Tag';

describe('Tag Component', () => {
  describe('Rendering', () => {
    it('renders tag with text', () => {
      render(<Tag>Category</Tag>);
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('renders as span element', () => {
      render(<Tag>Test Tag</Tag>);
      const tag = screen.getByText('Test Tag');
      expect(tag.tagName).toBe('SPAN');
    });

    it('renders with icon', () => {
      const Icon = () => <svg data-testid="tag-icon" />;
      render(<Tag icon={<Icon />}>With Icon</Tag>);
      
      expect(screen.getByTestId('tag-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders with remove button when onRemove is provided', () => {
      render(<Tag onRemove={() => {}}>Removable</Tag>);
      expect(screen.getByLabelText('Remove tag')).toBeInTheDocument();
    });

    it('does not render remove button when onRemove is not provided', () => {
      render(<Tag>Not Removable</Tag>);
      expect(screen.queryByLabelText('Remove tag')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Tag variant={variant}>{variant} tag</Tag>);
        const tag = screen.getByText(`${variant} tag`);
        expect(tag).toBeInTheDocument();
        
        // Check that appropriate color classes are applied
        expect(tag.className).toMatch(/bg-\w+(-\w+)?-\d+/);
        expect(tag.className).toMatch(/text-\w+(-\w+)?-\d+/);
      });
    });

    it('applies hover styles', () => {
      render(<Tag variant="primary">Hover test</Tag>);
      const tag = screen.getByText('Hover test');
      expect(tag.className).toContain('hover:bg-');
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Tag size={size}>{size} tag</Tag>);
        const tag = screen.getByText(`${size} tag`);
        
        // Check text size classes
        if (size === 'sm') expect(tag.className).toContain('text-xs');
        if (size === 'md') expect(tag.className).toContain('text-sm');
        if (size === 'lg') expect(tag.className).toContain('text-base');
        
        // Check padding classes
        expect(tag.className).toMatch(/p[xy]-/);
      });
    });
  });

  describe('Interactions', () => {
    it('calls onRemove when remove button is clicked', async () => {
      const handleRemove = jest.fn();
      const user = userEvent.setup();
      
      render(<Tag onRemove={handleRemove}>Removable</Tag>);
      
      await user.click(screen.getByLabelText('Remove tag'));
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when remove button is clicked', async () => {
      const handleRemove = jest.fn();
      const handleTagClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <span onClick={handleTagClick}>
          <Tag onRemove={handleRemove}>Removable</Tag>
        </span>
      );
      
      await user.click(screen.getByLabelText('Remove tag'));
      
      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleTagClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('remove button has accessible label', () => {
      render(<Tag onRemove={() => {}}>Accessible</Tag>);
      const removeButton = screen.getByLabelText('Remove tag');
      expect(removeButton).toHaveAttribute('aria-label', 'Remove tag');
    });

    it('icon has aria-hidden', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(<Tag icon={<Icon />}>With Icon</Tag>);
      
      const iconWrapper = screen.getByTestId('icon').parentElement;
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('remove button icon has aria-hidden', () => {
      render(<Tag onRemove={() => {}}>Removable</Tag>);
      const removeButton = screen.getByLabelText('Remove tag');
      const svg = removeButton.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('supports focus styles', () => {
      render(<Tag>Focus Test</Tag>);
      const tag = screen.getByText('Focus Test');
      expect(tag.className).toContain('focus:outline-none');
      expect(tag.className).toContain('focus:ring-2');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<Tag className="custom-tag-class">Custom</Tag>);
      expect(screen.getByText('Custom')).toHaveClass('custom-tag-class');
    });

    it('applies transition classes', () => {
      render(<Tag>Transition Test</Tag>);
      const tag = screen.getByText('Transition Test');
      expect(tag.className).toContain('transition-all');
    });

    it('applies correct base styles', () => {
      render(<Tag>Base Styles</Tag>);
      const tag = screen.getByText('Base Styles');
      expect(tag.className).toContain('inline-flex');
      expect(tag.className).toContain('items-center');
      expect(tag.className).toContain('rounded-md');
      expect(tag.className).toContain('font-normal');
    });

    it('applies correct icon sizing', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(<Tag icon={<Icon />}>Icon Size</Tag>);
      
      const iconWrapper = screen.getByTestId('icon').parentElement;
      expect(iconWrapper?.className).toContain('[&>svg]:w-[0.89em]');
      expect(iconWrapper?.className).toContain('[&>svg]:h-[0.89em]');
    });

    it('applies correct remove button styling', () => {
      render(<Tag onRemove={() => {}}>Remove Styling</Tag>);
      const removeButton = screen.getByLabelText('Remove tag');
      
      expect(removeButton.className).toContain('hover:opacity-75');
      expect(removeButton.className).toContain('transition-opacity');
      expect(removeButton.className).toContain('ml-1');
      expect(removeButton.className).toContain('-mr-0.5');
      
      const svg = removeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('opacity-70');
      expect(svg).toHaveClass('w-[0.89em]');
      expect(svg).toHaveClass('h-[0.89em]');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLSpanElement>();
      render(<Tag ref={ref}>Ref Test</Tag>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles both icon and remove button', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(
        <Tag icon={<Icon />} onRemove={() => {}}>
          Both features
        </Tag>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove tag')).toBeInTheDocument();
      expect(screen.getByText('Both features')).toBeInTheDocument();
    });

    it('handles all props together', () => {
      const Icon = () => <svg data-testid="icon" />;
      const handleRemove = jest.fn();
      
      render(
        <Tag
          variant="success"
          size="lg"
          icon={<Icon />}
          onRemove={handleRemove}
          className="custom-class"
          data-testid="full-tag"
        >
          Full featured
        </Tag>
      );
      
      const tag = screen.getByTestId('full-tag');
      expect(tag).toHaveTextContent('Full featured');
      expect(tag).toHaveClass('custom-class');
      expect(tag).toHaveClass('text-base'); // lg size
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove tag')).toBeInTheDocument();
    });

    it('handles empty children', () => {
      render(<Tag></Tag>);
      // Should render without crashing
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <Tag>
          <span>Part 1</span>
          <span>Part 2</span>
        </Tag>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('uses primary variant by default', () => {
      render(<Tag>Default Variant</Tag>);
      const tag = screen.getByText('Default Variant');
      expect(tag.className).toContain('bg-willow-primary-100');
      expect(tag.className).toContain('text-willow-primary-800');
    });

    it('uses md size by default', () => {
      render(<Tag>Default Size</Tag>);
      const tag = screen.getByText('Default Size');
      expect(tag.className).toContain('text-sm');
      expect(tag.className).toContain('px-2.5');
      expect(tag.className).toContain('py-1');
    });
  });
});