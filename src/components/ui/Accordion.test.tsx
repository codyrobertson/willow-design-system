import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  Accordion, 
  AccordionTrigger, 
  AccordionContent, 
  AccordionGroup, 
  AccordionItem 
} from './Accordion';

describe('Accordion Component', () => {
  describe('Basic Accordion', () => {
    it('renders accordion with trigger and content', () => {
      render(
        <Accordion>
          <AccordionTrigger>Test Trigger</AccordionTrigger>
          <AccordionContent>Test Content</AccordionContent>
        </Accordion>
      );
      
      expect(screen.getByText('Test Trigger')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('is collapsed by default', () => {
      render(
        <Accordion>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </Accordion>
      );
      
      const content = screen.getByText('Content');
      expect(content).toHaveClass('hidden');
    });

    it('expands when defaultExpanded is true', () => {
      render(
        <Accordion defaultExpanded>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </Accordion>
      );
      
      const content = screen.getByText('Content');
      expect(content).not.toHaveClass('hidden');
    });

    it('toggles on click', async () => {
      const user = userEvent.setup();
      render(
        <Accordion>
          <AccordionTrigger>Click Me</AccordionTrigger>
          <AccordionContent>Hidden Content</AccordionContent>
        </Accordion>
      );
      
      const trigger = screen.getByRole('button', { name: 'Click Me' });
      const content = screen.getByText('Hidden Content');
      
      expect(content).toHaveClass('hidden');
      
      await user.click(trigger);
      expect(content).not.toHaveClass('hidden');
      
      await user.click(trigger);
      expect(content).toHaveClass('hidden');
    });

    it('calls onExpandedChange when toggled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Accordion onExpandedChange={handleChange}>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </Accordion>
      );
      
      await user.click(screen.getByRole('button'));
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('respects collapsible prop', async () => {
      const user = userEvent.setup();
      render(
        <Accordion defaultExpanded collapsible={false}>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </Accordion>
      );
      
      const content = screen.getByText('Content');
      expect(content).not.toHaveClass('hidden');
      
      await user.click(screen.getByRole('button'));
      expect(content).not.toHaveClass('hidden'); // Should remain open
    });
  });

  describe('Accordion Variants', () => {
    const variants = ['default', 'card', 'ghost', 'minimal'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant`, () => {
        render(
          <Accordion variant={variant} data-testid={`accordion-${variant}`}>
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </Accordion>
        );
        
        const accordion = screen.getByTestId(`accordion-${variant}`);
        expect(accordion).toBeInTheDocument();
        
        if (variant === 'default') {
          expect(accordion).toHaveClass('border', 'border-neutral-100');
        }
      });
    });
  });

  describe('AccordionTrigger', () => {
    it('renders as button by default', () => {
      render(
        <Accordion>
          <AccordionTrigger>Button Trigger</AccordionTrigger>
        </Accordion>
      );
      
      const trigger = screen.getByRole('button', { name: 'Button Trigger' });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('type', 'button');
    });

    it('renders with custom icon', () => {
      render(
        <Accordion>
          <AccordionTrigger icon={<span data-testid="custom-icon">📁</span>}>
            With Icon
          </AccordionTrigger>
        </Accordion>
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('shows chevron by default', () => {
      render(
        <Accordion>
          <AccordionTrigger>With Chevron</AccordionTrigger>
        </Accordion>
      );
      
      const chevron = document.querySelector('.chevron');
      expect(chevron).toBeInTheDocument();
    });

    it('hides chevron when chevron prop is false', () => {
      render(
        <Accordion>
          <AccordionTrigger chevron={false}>No Chevron</AccordionTrigger>
        </Accordion>
      );
      
      const chevron = document.querySelector('.chevron');
      expect(chevron).not.toBeInTheDocument();
    });

    it('rotates chevron when expanded', async () => {
      const user = userEvent.setup();
      render(
        <Accordion>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </Accordion>
      );
      
      const chevron = document.querySelector('.chevron');
      expect(chevron).not.toHaveClass('rotate-180');
      
      await user.click(screen.getByRole('button'));
      expect(chevron).toHaveClass('rotate-180');
    });

    it('renders custom chevron icon', () => {
      render(
        <Accordion>
          <AccordionTrigger chevronIcon={<span data-testid="custom-chevron">▼</span>}>
            Custom Chevron
          </AccordionTrigger>
        </Accordion>
      );
      
      expect(screen.getByTestId('custom-chevron')).toBeInTheDocument();
    });

    it('supports trigger variants', () => {
      const triggerVariants = ['default', 'ghost', 'padded'] as const;
      
      triggerVariants.forEach(variant => {
        const { container } = render(
          <Accordion>
            <AccordionTrigger variant={variant}>Trigger</AccordionTrigger>
          </Accordion>
        );
        
        const trigger = container.querySelector('button');
        
        if (variant === 'ghost') {
          expect(trigger).toHaveClass('bg-transparent', 'border-0');
        } else if (variant === 'padded') {
          expect(trigger).toHaveClass('px-4', 'py-3');
        }
      });
    });
  });

  describe('AccordionContent', () => {
    it('supports padding variants', () => {
      const paddingVariants = ['none', 'sm', 'md', 'lg'] as const;
      
      paddingVariants.forEach(padding => {
        const { container } = render(
          <Accordion defaultExpanded>
            <AccordionContent padding={padding}>Content</AccordionContent>
          </Accordion>
        );
        
        const content = screen.getByText('Content');
        
        if (padding === 'sm') {
          expect(content).toHaveClass('p-3');
        } else if (padding === 'md') {
          expect(content).toHaveClass('p-4');
        } else if (padding === 'lg') {
          expect(content).toHaveClass('p-6');
        }
      });
    });

    it('can be force mounted', () => {
      render(
        <Accordion>
          <AccordionContent forceMount>Force Mounted Content</AccordionContent>
        </Accordion>
      );
      
      const content = screen.getByText('Force Mounted Content');
      expect(content).not.toHaveClass('hidden');
    });
  });

  describe('Controlled Accordion', () => {
    it('works as controlled component', async () => {
      const ControlledAccordion = () => {
        const [expanded, setExpanded] = React.useState(false);
        
        return (
          <>
            <button onClick={() => setExpanded(!expanded)}>
              External Toggle
            </button>
            <Accordion expanded={expanded} onExpandedChange={setExpanded}>
              <AccordionTrigger>Controlled</AccordionTrigger>
              <AccordionContent>Controlled Content</AccordionContent>
            </Accordion>
          </>
        );
      };
      
      const user = userEvent.setup();
      render(<ControlledAccordion />);
      
      const content = screen.getByText('Controlled Content');
      const externalButton = screen.getByText('External Toggle');
      const accordionTrigger = screen.getByRole('button', { name: 'Controlled' });
      
      expect(content).toHaveClass('hidden');
      
      // Toggle via external button
      await user.click(externalButton);
      expect(content).not.toHaveClass('hidden');
      
      // Toggle via accordion trigger
      await user.click(accordionTrigger);
      expect(content).toHaveClass('hidden');
    });
  });

  describe('AccordionGroup', () => {
    it('renders multiple accordions', () => {
      render(
        <AccordionGroup>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </AccordionGroup>
      );
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('supports single expansion mode', async () => {
      const user = userEvent.setup();
      render(
        <AccordionGroup type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </AccordionGroup>
      );
      
      const trigger1 = screen.getByRole('button', { name: 'Item 1' });
      const trigger2 = screen.getByRole('button', { name: 'Item 2' });
      const content1 = screen.getByText('Content 1');
      const content2 = screen.getByText('Content 2');
      
      // Both start closed
      expect(content1).toHaveClass('hidden');
      expect(content2).toHaveClass('hidden');
      
      // Open first item
      await user.click(trigger1);
      expect(content1).not.toHaveClass('hidden');
      expect(content2).toHaveClass('hidden');
      
      // Open second item (should close first)
      await user.click(trigger2);
      expect(content1).toHaveClass('hidden');
      expect(content2).not.toHaveClass('hidden');
    });

    it('supports multiple expansion mode', async () => {
      const user = userEvent.setup();
      render(
        <AccordionGroup type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </AccordionGroup>
      );
      
      const trigger1 = screen.getByRole('button', { name: 'Item 1' });
      const trigger2 = screen.getByRole('button', { name: 'Item 2' });
      const content1 = screen.getByText('Content 1');
      const content2 = screen.getByText('Content 2');
      
      // Open first item
      await user.click(trigger1);
      expect(content1).not.toHaveClass('hidden');
      expect(content2).toHaveClass('hidden');
      
      // Open second item (both should be open)
      await user.click(trigger2);
      expect(content1).not.toHaveClass('hidden');
      expect(content2).not.toHaveClass('hidden');
    });

    it('supports defaultValue', () => {
      render(
        <AccordionGroup type="single" defaultValue="item-2">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </AccordionGroup>
      );
      
      expect(screen.getByText('Content 1')).toHaveClass('hidden');
      expect(screen.getByText('Content 2')).not.toHaveClass('hidden');
    });

    it('supports defaultValue for multiple mode', () => {
      render(
        <AccordionGroup type="multiple" defaultValue={['item-1', 'item-2']}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </AccordionGroup>
      );
      
      expect(screen.getByText('Content 1')).not.toHaveClass('hidden');
      expect(screen.getByText('Content 2')).not.toHaveClass('hidden');
    });

    it('calls onValueChange', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <AccordionGroup type="single" onValueChange={handleChange}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </AccordionGroup>
      );
      
      await user.click(screen.getByRole('button', { name: 'Item 1' }));
      
      expect(handleChange).toHaveBeenCalledWith('item-1');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <Accordion>
          <AccordionTrigger>Accessible Trigger</AccordionTrigger>
          <AccordionContent>Accessible Content</AccordionContent>
        </Accordion>
      );
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when toggled', async () => {
      const user = userEvent.setup();
      render(
        <Accordion>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </Accordion>
      );
      
      const trigger = screen.getByRole('button');
      
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has correct data-state attributes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </Accordion>
      );
      
      const accordion = container.firstChild as HTMLElement;
      expect(accordion).toHaveAttribute('data-state', 'closed');
      
      await user.click(screen.getByRole('button'));
      expect(accordion).toHaveAttribute('data-state', 'open');
    });
  });

  describe('Custom className and styling', () => {
    it('applies custom className to Accordion', () => {
      render(
        <Accordion className="custom-accordion">
          <AccordionTrigger>Trigger</AccordionTrigger>
        </Accordion>
      );
      
      const accordion = document.querySelector('.custom-accordion');
      expect(accordion).toBeInTheDocument();
    });

    it('applies custom className to AccordionTrigger', () => {
      render(
        <Accordion>
          <AccordionTrigger className="custom-trigger">Trigger</AccordionTrigger>
        </Accordion>
      );
      
      expect(screen.getByRole('button')).toHaveClass('custom-trigger');
    });

    it('applies custom className to AccordionContent', () => {
      render(
        <Accordion defaultExpanded>
          <AccordionContent className="custom-content">Content</AccordionContent>
        </Accordion>
      );
      
      expect(screen.getByText('Content')).toHaveClass('custom-content');
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to Accordion', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Accordion ref={ref}>
          <AccordionTrigger>Trigger</AccordionTrigger>
        </Accordion>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to AccordionTrigger', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <Accordion>
          <AccordionTrigger ref={ref}>Trigger</AccordionTrigger>
        </Accordion>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('forwards ref to AccordionContent', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Accordion defaultExpanded>
          <AccordionContent ref={ref}>Content</AccordionContent>
        </Accordion>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});