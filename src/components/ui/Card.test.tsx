import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from './Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies default variant classes', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('border');
      expect(card.className).toContain('border-slate-200');
    });

    it('applies raised variant classes', () => {
      render(<Card variant="raised" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('border');
      expect(card.className).toContain('border-slate-200');
    });

    it('applies outlined variant classes', () => {
      render(<Card variant="outlined" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('border-2');
      expect(card.className).toContain('border-neutral-300');
    });

    it('applies custom className', () => {
      render(<Card className="custom-card">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('custom-card');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('generates accessible label from title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
        </Card>
      );
      
      // Card doesn't have role="article", find by aria-labelledby
      const title = screen.getByText('Test Card');
      const titleId = title.getAttribute('id');
      const card = document.querySelector(`[aria-labelledby="${titleId}"]`);
      expect(card).toBeInTheDocument();
    });

    it('uses aria-labelledby for accessibility', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByText('Test Card');
      const titleId = title.getAttribute('id');
      const card = title.closest('.bg-white');
      expect(card).toHaveAttribute('aria-labelledby', titleId);
    });
  });

  describe('CardHeader', () => {
    it('renders header content', () => {
      render(
        <CardHeader>
          <div>Header content</div>
        </CardHeader>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <CardHeader className="custom-header">
          Content
        </CardHeader>
      );
      const header = screen.getByText('Content').closest('div');
      expect(header).toHaveClass('custom-header');
    });

    it('applies correct default classes', () => {
      render(<CardHeader data-testid="header">Content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header.className).toContain('flex');
      expect(header.className).toContain('flex-col');
      expect(header.className).toContain('gap-2');
      expect(header.className).toContain('p-6');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 by default', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Title');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });

    it('applies correct default classes', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title.className).toContain('text-xl');
      expect(title.className).toContain('font-normal');
      expect(title.className).toContain('leading-relaxed');
      expect(title.className).toContain('tracking-tight');
    });
  });

  describe('CardDescription', () => {
    it('renders description text', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <CardDescription className="custom-description">
          Description
        </CardDescription>
      );
      expect(screen.getByText('Description')).toHaveClass('custom-description');
    });

    it('applies correct default classes', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description.className).toContain('text-base');
      expect(description.className).toContain('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders content', () => {
      render(<CardContent>Main content</CardContent>);
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <CardContent className="custom-content">
          Content
        </CardContent>
      );
      const content = screen.getByText('Content').closest('div');
      expect(content).toHaveClass('custom-content');
    });

    it('applies correct default padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content.className).toContain('p-6');
      expect(content.className).toContain('pt-4');
    });
  });

  describe('CardFooter', () => {
    it('renders footer content', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <CardFooter className="custom-footer">
          Footer
        </CardFooter>
      );
      const footer = screen.getByText('Footer').closest('div');
      expect(footer).toHaveClass('custom-footer');
    });

    it('applies correct default classes', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer.className).toContain('flex');
      expect(footer.className).toContain('items-center');
      expect(footer.className).toContain('p-6');
      expect(footer.className).toContain('pt-0');
    });
  });

  describe('Complete Card Composition', () => {
    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('card gets aria-labelledby from nested title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByText('Accessible Card');
      const titleId = title.getAttribute('id');
      const card = title.closest('.bg-white');
      expect(card).toHaveAttribute('aria-labelledby', titleId);
    });
  });

  describe('Accessibility', () => {
    it('all components forward refs correctly', () => {
      const cardRef = React.createRef<HTMLDivElement>();
      const headerRef = React.createRef<HTMLDivElement>();
      const titleRef = React.createRef<HTMLHeadingElement>();
      const descRef = React.createRef<HTMLParagraphElement>();
      const contentRef = React.createRef<HTMLDivElement>();
      const footerRef = React.createRef<HTMLDivElement>();

      render(
        <Card ref={cardRef}>
          <CardHeader ref={headerRef}>
            <CardTitle ref={titleRef}>Title</CardTitle>
            <CardDescription ref={descRef}>Description</CardDescription>
          </CardHeader>
          <CardContent ref={contentRef}>Content</CardContent>
          <CardFooter ref={footerRef}>Footer</CardFooter>
        </Card>
      );

      expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
      expect(headerRef.current).toBeInstanceOf(HTMLDivElement);
      expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
      expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(footerRef.current).toBeInstanceOf(HTMLDivElement);
    });

    it('supports additional HTML attributes', () => {
      render(
        <Card 
          data-testid="test-card"
          id="unique-card"
          role="region"
        >
          Content
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('id', 'unique-card');
      expect(card).toHaveAttribute('role', 'region');
    });
  });
});