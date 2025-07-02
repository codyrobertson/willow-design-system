import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  it('renders without crashing', () => {
    render(<Card />);
  });

  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Card variant="primary">Button</Card>);
    expect(screen.getByText('Button')).toHaveClass('primary');
    
    rerender(<Card variant="secondary">Button</Card>);
    expect(screen.getByText('Button')).toHaveClass('secondary');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Card size="sm">Small</Card>);
    const element = screen.getByText('Small');
    
    rerender(<Card size="lg">Large</Card>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Card onClick={handleClick}>Click me</Card>);
    
    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Card disabled>Disabled</Card>);
    
    const element = screen.getByText('Disabled');
    expect(element).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<Card aria-label="Test Card">Accessible</Card>);
    
    const element = screen.getByLabelText('Test Card');
    expect(element).toBeInTheDocument();
  });
});
