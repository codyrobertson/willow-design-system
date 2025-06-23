import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Select Component', () => {
  describe('Rendering', () => {
    it('renders select trigger', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows placeholder by default', () => {
      render(<Select options={mockOptions} placeholder="Choose option" />);
      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('shows selected value', () => {
      render(<Select options={mockOptions} value="option1" />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Select options={mockOptions} defaultValue="option2" />);
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<Select options={mockOptions} disabled />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });
  });

  describe('Dropdown Behavior', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      mockOptions.forEach(option => {
        if (!option.disabled) {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        }
      });
    });

    it('closes dropdown on option select', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('Option 1'));
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on escape key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on outside click', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Select options={mockOptions} />
          <button>Outside</button>
        </div>
      );
      
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.click(screen.getByText('Outside'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('selects option on click', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Select options={mockOptions} onChange={handleChange} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('Option 2'));
      
      expect(handleChange).toHaveBeenCalledWith('option2');
    });

    it('updates display value on selection (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('Option 2'));
      
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('does not select disabled options', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Select options={mockOptions} onChange={handleChange} />);
      
      await user.click(screen.getByRole('combobox'));
      const disabledOption = screen.getByText('Option 3').closest('[role="option"]');
      
      await user.click(disabledOption!);
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with space key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      
      await user.keyboard(' ');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      
      // Test that dropdown can be opened with keyboard
      await user.keyboard(' ');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Variants and Sizes', () => {
    it('renders error variant', () => {
      render(<Select options={mockOptions} variant="error" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('border-destructive');
    });

    it('renders success variant', () => {
      render(<Select options={mockOptions} variant="success" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('border-success');
    });

    it('renders with error prop', () => {
      render(<Select options={mockOptions} error />);
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('border-destructive');
    });

    it('renders small size', () => {
      render(<Select options={mockOptions} size="sm" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('h-9');
      expect(trigger.className).toContain('text-xs');
    });

    it('renders large size', () => {
      render(<Select options={mockOptions} size="lg" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('h-11');
      expect(trigger.className).toContain('text-base');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<Select options={mockOptions} />);
      const trigger = screen.getByRole('combobox');
      
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has correct option roles', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      await user.click(screen.getByRole('combobox'));
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });

    it('supports name attribute', () => {
      render(<Select options={mockOptions} name="color" />);
      const hiddenInput = document.querySelector('input[name="color"]');
      expect(hiddenInput).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Select ref={ref} options={mockOptions} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Select options={mockOptions} className="custom-select" />);
      const container = screen.getByRole('combobox').closest('div');
      expect(container?.parentElement).toHaveClass('custom-select');
    });

    it('passes through data attributes', () => {
      render(<Select options={mockOptions} data-testid="custom-select" />);
      expect(screen.getByTestId('custom-select')).toBeInTheDocument();
    });
  });
});