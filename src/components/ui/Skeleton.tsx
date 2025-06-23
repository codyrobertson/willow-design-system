import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const skeletonVariants = cva(
  'animate-pulse rounded-md bg-muted',
  {
    variants: {
      variant: {
        default: 'bg-neutral-200',
        light: 'bg-neutral-100',
        dark: 'bg-neutral-300',
        primary: 'bg-primary/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        aria-busy="true"
        aria-live="polite"
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// Common skeleton patterns
export interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  lineHeight?: string;
  lastLineWidth?: string;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, lineHeight = 'h-4', lastLineWidth = 'w-3/4', className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(lineHeight, i === lines - 1 ? lastLineWidth : 'w-full')}
            {...props}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = 'SkeletonText';

export interface SkeletonCardProps extends SkeletonProps {}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('rounded-lg border p-4', className)}>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" {...props} />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" {...props} />
            <Skeleton className="h-4 w-1/2" {...props} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" {...props} />
          <Skeleton className="h-4 w-full" {...props} />
          <Skeleton className="h-4 w-3/4" {...props} />
        </div>
      </div>
    );
  }
);
SkeletonCard.displayName = 'SkeletonCard';

export interface SkeletonButtonProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg';
}

const skeletonButtonSizes = {
  sm: 'h-8 w-20',
  md: 'h-10 w-24',
  lg: 'h-12 w-32',
};

const SkeletonButton = React.forwardRef<HTMLDivElement, SkeletonButtonProps>(
  ({ size = 'md', className, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        className={cn('rounded-md', skeletonButtonSizes[size], className)}
        {...props}
      />
    );
  }
);
SkeletonButton.displayName = 'SkeletonButton';

export interface SkeletonAvatarProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
}

const skeletonAvatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ size = 'md', shape = 'circle', className, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        className={cn(
          skeletonAvatarSizes[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-md',
          className
        )}
        {...props}
      />
    );
  }
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

export interface SkeletonTableProps extends SkeletonProps {
  rows?: number;
  columns?: number;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ rows = 5, columns = 4, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div className="border rounded-lg">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={`header-${i}`} className="h-4 flex-1" {...props} />
              ))}
            </div>
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="border-b last:border-0 p-4">
              <div className="flex space-x-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="h-4 flex-1"
                    {...props}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
SkeletonTable.displayName = 'SkeletonTable';

export interface SkeletonFormProps extends SkeletonProps {
  fields?: number;
}

const SkeletonForm = React.forwardRef<HTMLDivElement, SkeletonFormProps>(
  ({ fields = 3, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" {...props} />
            <Skeleton className="h-10 w-full rounded-md" {...props} />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-md" {...props} />
      </div>
    );
  }
);
SkeletonForm.displayName = 'SkeletonForm';

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonTable,
  SkeletonForm,
  skeletonVariants,
};