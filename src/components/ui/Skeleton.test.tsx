import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonButton, 
  SkeletonAvatar,
  SkeletonImage,
  SkeletonTable
} from './Skeleton';

describe('Skeleton Component', () => {
  describe('Basic Skeleton', () => {
    it('renders skeleton element', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
    });

    it('has correct accessibility attributes', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });

    it('applies custom className', () => {
      render(<Skeleton className="custom-skeleton" />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('custom-skeleton');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Skeleton ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Skeleton Variants', () => {
    it('renders default variant', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('bg-neutral-200');
    });

    it('renders light variant', () => {
      render(<Skeleton variant="light" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('bg-neutral-100');
    });

    it('renders dark variant', () => {
      render(<Skeleton variant="dark" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('bg-neutral-300');
    });

    it('renders primary variant', () => {
      render(<Skeleton variant="primary" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('bg-primary/10');
    });
  });

  describe('SkeletonText', () => {
    it('renders default 3 lines', () => {
      render(<SkeletonText />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('renders custom number of lines', () => {
      render(<SkeletonText lines={5} />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(5);
    });

    it('applies last line width', () => {
      render(<SkeletonText lines={3} />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      const lastLine = skeletons[skeletons.length - 1];
      expect(lastLine).toHaveClass('w-3/4');
    });

    it('applies custom last line width', () => {
      render(<SkeletonText lines={2} lastLineWidth="w-1/2" />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      const lastLine = skeletons[skeletons.length - 1];
      expect(lastLine).toHaveClass('w-1/2');
    });

    it('applies line height', () => {
      render(<SkeletonText lineHeight="h-6" />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('h-6');
      });
    });

    it('passes variant to child skeletons', () => {
      render(<SkeletonText variant="primary" />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('bg-primary/10');
      });
    });
  });

  describe('SkeletonCard', () => {
    it('renders card structure', () => {
      render(<SkeletonCard />);
      const container = document.querySelector('.rounded-lg.border.p-4');
      expect(container).toBeInTheDocument();
    });

    it('contains avatar skeleton', () => {
      render(<SkeletonCard />);
      const avatar = document.querySelector('.h-12.w-12.rounded-full');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('animate-pulse');
    });

    it('contains header skeletons', () => {
      render(<SkeletonCard />);
      const headerLine1 = document.querySelector('.h-4.w-1\\/4');
      const headerLine2 = document.querySelector('.h-4.w-1\\/2');
      expect(headerLine1).toBeInTheDocument();
      expect(headerLine2).toBeInTheDocument();
    });

    it('contains body skeletons', () => {
      render(<SkeletonCard />);
      const fullLines = document.querySelectorAll('.h-4.w-full');
      const partialLine = document.querySelector('.h-4.w-3\\/4');
      expect(fullLines).toHaveLength(2);
      expect(partialLine).toBeInTheDocument();
    });

    it('passes variant to all child skeletons', () => {
      render(<SkeletonCard variant="dark" />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('bg-neutral-300');
      });
    });
  });

  describe('SkeletonButton', () => {
    it('renders button skeleton', () => {
      render(<SkeletonButton />);
      const button = document.querySelector('.animate-pulse.rounded-md');
      expect(button).toBeInTheDocument();
    });

    it('renders small size', () => {
      render(<SkeletonButton size="sm" />);
      const button = document.querySelector('.animate-pulse');
      expect(button).toHaveClass('h-8', 'w-20');
    });

    it('renders medium size by default', () => {
      render(<SkeletonButton />);
      const button = document.querySelector('.animate-pulse');
      expect(button).toHaveClass('h-10', 'w-24');
    });

    it('renders large size', () => {
      render(<SkeletonButton size="lg" />);
      const button = document.querySelector('.animate-pulse');
      expect(button).toHaveClass('h-12', 'w-32');
    });
  });

  describe('SkeletonAvatar', () => {
    it('renders avatar skeleton', () => {
      render(<SkeletonAvatar />);
      const avatar = document.querySelector('.rounded-full.animate-pulse');
      expect(avatar).toBeInTheDocument();
    });

    it('renders small size', () => {
      render(<SkeletonAvatar size="sm" />);
      const avatar = document.querySelector('.animate-pulse');
      expect(avatar).toHaveClass('h-8', 'w-8');
    });

    it('renders medium size by default', () => {
      render(<SkeletonAvatar />);
      const avatar = document.querySelector('.animate-pulse');
      expect(avatar).toHaveClass('h-10', 'w-10');
    });

    it('renders large size', () => {
      render(<SkeletonAvatar size="lg" />);
      const avatar = document.querySelector('.animate-pulse');
      expect(avatar).toHaveClass('h-12', 'w-12');
    });
  });

  describe('SkeletonImage', () => {
    it('renders image skeleton', () => {
      render(<SkeletonImage />);
      const image = document.querySelector('.animate-pulse.rounded-md');
      expect(image).toBeInTheDocument();
    });

    it('has default aspect ratio', () => {
      render(<SkeletonImage />);
      const image = document.querySelector('.animate-pulse');
      expect(image).toHaveClass('aspect-video');
    });

    it('renders square aspect ratio', () => {
      render(<SkeletonImage aspectRatio="square" />);
      const image = document.querySelector('.animate-pulse');
      expect(image).toHaveClass('aspect-square');
    });

    it('renders portrait aspect ratio', () => {
      render(<SkeletonImage aspectRatio="portrait" />);
      const image = document.querySelector('.animate-pulse');
      expect(image).toHaveClass('aspect-[3/4]');
    });

    it('has full width', () => {
      render(<SkeletonImage />);
      const image = document.querySelector('.animate-pulse');
      expect(image).toHaveClass('w-full');
    });
  });

  describe('SkeletonTable', () => {
    it('renders table skeleton structure', () => {
      render(<SkeletonTable />);
      const container = document.querySelector('.w-full.rounded-md.border');
      expect(container).toBeInTheDocument();
    });

    it('renders default 5 rows', () => {
      render(<SkeletonTable />);
      const rows = document.querySelectorAll('.border-t');
      expect(rows).toHaveLength(5);
    });

    it('renders custom number of rows', () => {
      render(<SkeletonTable rows={3} />);
      const rows = document.querySelectorAll('.border-t');
      expect(rows).toHaveLength(3);
    });

    it('renders default 4 columns', () => {
      render(<SkeletonTable />);
      const firstRow = document.querySelector('.border-t');
      const cells = firstRow?.querySelectorAll('.animate-pulse');
      expect(cells).toHaveLength(4);
    });

    it('renders custom number of columns', () => {
      render(<SkeletonTable columns={6} />);
      const firstRow = document.querySelector('.border-t');
      const cells = firstRow?.querySelectorAll('.animate-pulse');
      expect(cells).toHaveLength(6);
    });

    it('renders header', () => {
      render(<SkeletonTable />);
      const header = document.querySelector('.bg-muted\\/50');
      expect(header).toBeInTheDocument();
      const headerCells = header?.querySelectorAll('.animate-pulse');
      expect(headerCells).toHaveLength(4);
    });
  });

  describe('Integration', () => {
    it('combines multiple skeleton types', () => {
      render(
        <div>
          <SkeletonCard />
          <SkeletonText />
          <SkeletonButton />
        </div>
      );
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('all skeletons have accessibility attributes', () => {
      render(
        <div>
          <Skeleton />
          <SkeletonText />
          <SkeletonCard />
        </div>
      );
      
      const skeletons = document.querySelectorAll('[aria-busy="true"]');
      expect(skeletons.length).toBeGreaterThan(0);
      
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});