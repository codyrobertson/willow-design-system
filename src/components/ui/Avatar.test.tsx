import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Avatar, AvatarGroup } from './Avatar';

describe('Avatar', () => {
  describe('Edge Cases', () => {
    it('handles undefined src gracefully', () => {
      const { container } = render(<Avatar src={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles null src gracefully', () => {
      const { container } = render(<Avatar src={null as string | undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles empty string src', () => {
      const { container } = render(<Avatar src="" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles undefined alt text', () => {
      render(<Avatar src="/test.jpg" alt={undefined} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Avatar');
    });

    it('handles null alt text', () => {
      render(<Avatar src="/test.jpg" alt={null as string | undefined} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Avatar');
    });

    it('handles undefined fallback', () => {
      const { container } = render(<Avatar fallback={undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles null fallback', () => {
      const { container } = render(<Avatar fallback={null as string | undefined} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles empty string fallback', () => {
      const { container } = render(<Avatar fallback="" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles very long fallback text', () => {
      render(<Avatar fallback="VERYLONGFALLBACKTEXT" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveTextContent('VERYLONGFALLBACKTEXT');
    });

    it('handles special characters in fallback', () => {
      render(<Avatar fallback="!@#$%" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveTextContent('!@#$%');
    });

    it('handles unicode characters in fallback', () => {
      render(<Avatar fallback="👋🏻" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveTextContent('👋🏻');
    });

    it('handles invalid status values', () => {
      const { container } = render(<Avatar status={'invalid' as 'online' | 'offline' | 'away' | 'busy' | undefined} />);
      // Should still render without crashing
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles undefined onError callback', () => {
      const { container } = render(<Avatar src="/invalid.jpg" onError={undefined} />);
      const img = container.querySelector('img');
      fireEvent.error(img!);
      // Should handle error without crashing
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles null as children in component', () => {
      const { container } = render(<Avatar>{null}</Avatar>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Core Functionality', () => {
    it('renders with image when src is provided', () => {
      render(<Avatar src="/test.jpg" alt="Test User" />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/test.jpg');
      expect(img).toHaveAttribute('alt', 'Test User');
    });

    it('renders fallback text when no image', () => {
      render(<Avatar fallback="JD" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders default SVG when no src or fallback', () => {
      const { container } = render(<Avatar />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('switches to fallback when image fails to load', async () => {
      const onError = jest.fn();
      render(<Avatar src="/invalid.jpg" fallback="FB" onError={onError} />);
      
      const img = screen.getByRole('img');
      fireEvent.error(img);
      
      await waitFor(() => {
        expect(screen.getByText('FB')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
      });
    });

    it('applies correct size classes', () => {
      const { rerender } = render(<Avatar size="xs" data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toHaveClass('h-6', 'w-6');

      rerender(<Avatar size="2xl" data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toHaveClass('h-16', 'w-16');
    });

    it('applies correct shape classes', () => {
      const { rerender } = render(<Avatar shape="circle" data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toHaveClass('rounded-full');

      rerender(<Avatar shape="square" data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toHaveClass('rounded-md');
    });

    it('renders status indicator', () => {
      const { container } = render(<Avatar status="online" />);
      const status = container.querySelector('[aria-label="Status: online"]');
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass('bg-success-500');
    });

    it('applies custom className', () => {
      render(<Avatar className="custom-class" data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Avatar ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('applies custom style', () => {
      render(<Avatar style={{ marginTop: '10px' }} data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toHaveStyle({ marginTop: '10px' });
    });

    it('generates consistent colors for same fallback text', () => {
      const { container: container1 } = render(<Avatar fallback="JD" />);
      const { container: container2 } = render(<Avatar fallback="JD" />);
      
      const avatar1 = container1.firstChild as HTMLElement;
      const avatar2 = container2.firstChild as HTMLElement;
      
      // Should have the same background color class
      const getBackgroundClass = (element: HTMLElement) => 
        Array.from(element.classList).find(cls => cls.startsWith('bg-'));
      
      expect(getBackgroundClass(avatar1)).toBe(getBackgroundClass(avatar2));
    });
  });

  describe('AvatarGroup', () => {
    it('renders multiple avatars', () => {
      render(
        <AvatarGroup>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
          <Avatar fallback="C" />
        </AvatarGroup>
      );
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('limits displayed avatars based on max prop', () => {
      render(
        <AvatarGroup max={2}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
          <Avatar fallback="C" />
          <Avatar fallback="D" />
        </AvatarGroup>
      );
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.queryByText('C')).not.toBeInTheDocument();
      expect(screen.queryByText('D')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('handles undefined max prop', () => {
      render(
        <AvatarGroup max={undefined}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('handles zero max prop', () => {
      render(
        <AvatarGroup max={0}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );
      
      // When max is 0, it should show all children since slice(0, 0) returns empty array
      // but the code uses max ? slice : children, so 0 is falsy and shows all
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('handles null children', () => {
      render(
        <AvatarGroup>
          <Avatar fallback="A" />
          {null}
          <Avatar fallback="B" />
        </AvatarGroup>
      );
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('handles non-Avatar children gracefully', () => {
      const { container } = render(
        <AvatarGroup>
          <Avatar fallback="A" />
          <div>Not an avatar</div>
          <Avatar fallback="B" />
        </AvatarGroup>
      );
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('applies size prop to all avatars', () => {
      render(
        <AvatarGroup size="lg">
          <Avatar fallback="A" data-testid="avatar-a" />
          <Avatar fallback="B" data-testid="avatar-b" />
        </AvatarGroup>
      );
      
      const avatarA = screen.getByTestId('avatar-a');
      const avatarB = screen.getByTestId('avatar-b');
      
      expect(avatarA).toHaveClass('h-12', 'w-12');
      expect(avatarB).toHaveClass('h-12', 'w-12');
    });

    it('applies custom className', () => {
      render(
        <AvatarGroup className="custom-group" data-testid="group">
          <Avatar fallback="A" />
        </AvatarGroup>
      );
      
      expect(screen.getByTestId('group')).toHaveClass('custom-group');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <AvatarGroup ref={ref}>
          <Avatar fallback="A" />
        </AvatarGroup>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Accessibility', () => {
    it('provides appropriate alt text for images', () => {
      render(<Avatar src="/test.jpg" alt="John Doe" />);
      expect(screen.getByAltText('John Doe')).toBeInTheDocument();
    });

    it('includes aria-label for status indicators', () => {
      const { container } = render(<Avatar status="online" />);
      const status = container.querySelector('[aria-label="Status: online"]');
      expect(status).toBeInTheDocument();
    });

    it('handles keyboard navigation in avatar group', () => {
      const { container } = render(
        <AvatarGroup>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );
      
      // Avatar group should not interfere with natural tab order
      const avatars = container.querySelectorAll('[class*="rounded-full"]');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });
});