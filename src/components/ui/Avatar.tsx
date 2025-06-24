import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Avatar component variants using class-variance-authority
 * 
 * Sizes:
 * - xs: 24px
 * - sm: 32px
 * - md: 40px (default)
 * - lg: 48px
 * - xl: 56px
 * - 2xl: 64px
 * 
 * Shape:
 * - circle: Fully rounded
 * - square: Rounded corners
 */
const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden bg-neutral-100 select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-14 w-14 text-xl',
        '2xl': 'h-16 w-16 text-2xl',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
    },
  }
);

const avatarImageVariants = cva(
  'aspect-square h-full w-full object-cover',
  {
    variants: {
      shape: {
        circle: '',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      shape: 'circle',
    },
  }
);

const avatarStatusVariants = cva(
  'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
  {
    variants: {
      status: {
        online: 'bg-success-500',
        offline: 'bg-neutral-400',
        busy: 'bg-danger',
        away: 'bg-warning-500',
      },
      size: {
        xs: 'h-2 w-2 border',
        sm: 'h-2.5 w-2.5 border',
        md: 'h-3 w-3',
        lg: 'h-3.5 w-3.5',
        xl: 'h-4 w-4',
        '2xl': 'h-5 w-5 border-[3px]',
      },
    },
    defaultVariants: {
      status: 'offline',
      size: 'md',
    },
  }
);

/**
 * AvatarProps interface
 * 
 * @property {string} [src] - Image source URL
 * @property {string} [alt] - Alt text for the image
 * @property {string} [fallback] - Fallback text (usually initials)
 * @property {'online' | 'offline' | 'busy' | 'away'} [status] - Status indicator
 * @property {Function} [onError] - Error handler for image load failure
 */
export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  onError?: () => void;
}

/**
 * Avatar component - User profile image with fallback and status
 * 
 * @component
 * @example
 * // Basic avatar with image
 * <Avatar 
 *   src="/path/to/image.jpg" 
 *   alt="John Doe"
 * />
 * 
 * @example
 * // Avatar with fallback initials
 * <Avatar 
 *   fallback="JD"
 * />
 * 
 * @example
 * // Avatar with status indicator
 * <Avatar 
 *   src="/path/to/image.jpg"
 *   status="online"
 * />
 * 
 * Features:
 * - Image with fallback to initials
 * - Multiple sizes from xs to 2xl
 * - Circle or square shape
 * - Optional status indicator
 * - Automatic color generation for fallback
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    src, 
    alt, 
    fallback, 
    size, 
    shape, 
    status, 
    onError,
    style,
    ...props 
  }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    
    const handleImageError = () => {
      setImageError(true);
      onError?.();
    };
    
    // Generate a consistent background color based on fallback text
    const getFallbackColor = (text: string) => {
      if (!text) return 'bg-neutral-200';
      
      const colors = [
        'bg-willow-primary-500',
        'bg-info-500',
        'bg-success-500',
        'bg-warning-500',
        'bg-danger',
        'bg-oxford-blue-500',
      ];
      
      const charCode = text.charCodeAt(0);
      return colors[charCode % colors.length];
    };
    
    const showImage = src && !imageError;
    const fallbackColor = getFallbackColor(fallback || '');
    
    return (
      <div
        ref={ref}
        className={cn(
          avatarVariants({ size, shape }),
          !showImage && fallback && fallbackColor,
          className
        )}
        style={style}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            onError={handleImageError}
            className={avatarImageVariants({ shape })}
          />
        ) : fallback ? (
          <span className="font-medium text-white">
            {fallback}
          </span>
        ) : (
          // Default avatar icon
          <svg
            className="h-[60%] w-[60%] text-neutral-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        )}
        
        {status && (
          <span 
            className={cn(avatarStatusVariants({ status, size }))}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * AvatarGroup component - Display multiple avatars with overlap
 */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarProps['size'];
  children: React.ReactNode;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 4, size = 'md', children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const displayedChildren = max ? childrenArray.slice(0, max) : childrenArray;
    const remainingCount = childrenArray.length - displayedChildren.length;
    
    return (
      <div
        ref={ref}
        className={cn('flex -space-x-3', className)}
        {...props}
      >
        {displayedChildren.map((child, index) => (
          <div
            key={index}
            className="relative inline-block ring-2 ring-white rounded-full"
            style={{ zIndex: displayedChildren.length - index }}
          >
            {React.isValidElement(child) && 
              React.cloneElement(child as React.ReactElement<AvatarProps>, { size })}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="relative inline-block ring-2 ring-white rounded-full"
            style={{ zIndex: 0 }}
          >
            <Avatar
              size={size}
              fallback={`+${remainingCount}`}
              className="bg-neutral-300"
            />
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup, avatarVariants };