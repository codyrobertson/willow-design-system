import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card Component System
 * 
 * A versatile card component system for building content containers with consistent styling.
 * Includes Card, CardHeader, CardFooter, CardTitle, CardDescription, and CardContent.
 * 
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description goes here</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * 
 * // Card with colored header
 * <Card>
 *   <CardHeader color="primary" variant="colored">
 *     <CardTitle>Important Notice</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Important information here</p>
 *   </CardContent>
 * </Card>
 * 
 * // Different card variants
 * <Card variant="elevated">
 *   <CardContent>Elevated card with shadow</CardContent>
 * </Card>
 * ```
 */

// Context for Card header color
const CardHeaderContext = React.createContext<{ isColored: boolean }>({ isColored: false });

const cardVariants = cva(
  'bg-white text-card-foreground relative rounded-lg overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border border-slate-200 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.12),0px_1px_3px_0px_rgba(37,62,167,0.2),0px_0px_0px_1px_rgba(55,93,251,0.1),0px_1px_2px_0px_rgba(0,0,0,0.05),0px_-2.4px_9.3px_0px_inset_rgba(137,114,250,0.15)]',
        raised: 'border border-slate-200 shadow-[0px_4px_5.8px_10px_rgba(208,208,208,0.05),0px_4px_20px_0px_rgba(0,0,0,0.12),0px_1px_3px_0px_rgba(37,62,167,0.2),0px_0px_0px_1px_rgba(55,93,251,0.1),0px_1px_2px_0px_rgba(0,0,0,0.05),0px_-2.4px_9.3px_0px_inset_rgba(137,114,250,0.15)]',
        flat: 'border border-[#e1dee9] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
        outlined: 'bg-transparent border-2 border-neutral-300 shadow-sm',
        elevated: 'border border-neutral-100 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_10px_10px_-5px_rgba(0,0,0,0.04),0px_-2.4px_9.3px_0px_inset_rgba(137,114,250,0.15)]',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Visual variant of the card */
  variant?: 'default' | 'raised' | 'flat' | 'outlined' | 'elevated';
  /** Padding preset for the card */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card Component
 * 
 * A flexible container component for grouping related content and actions.
 * Provides consistent styling with multiple variants and automatic ARIA labeling.
 * 
 * @component
 * @example
 * ```tsx
 * <Card variant="elevated" padding="md">
 *   <CardHeader>
 *     <CardTitle>Welcome</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Your content here</p>
 *   </CardContent>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, children, ...props }, ref) => {
    const [titleId, setTitleId] = React.useState<string | undefined>();
    
    // Provide context for CardTitle to register its ID
    const cardContext = React.useMemo(() => ({ setTitleId }), []);
    
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        aria-labelledby={titleId}
        {...props}
      >
        <CardContext.Provider value={cardContext}>
          {children}
        </CardContext.Provider>
      </div>
    );
  }
);
Card.displayName = 'Card';

// Add Card context
const CardContext = React.createContext<{ setTitleId?: (id: string | undefined) => void }>({});

const cardHeaderVariants = cva('flex flex-col gap-2', {
  variants: {
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    variant: {
      default: 'p-6',
      colored: 'relative',
    },
  },
  defaultVariants: {
    align: 'center',
    variant: 'default',
  },
});

const cardHeaderColorVariants = cva(
  'relative shrink-0 w-full',
  {
    variants: {
      theme: {
        neutral: 'bg-neutral-50',
        primary: 'bg-willow-primary-50',
        info: 'bg-info-50',
        success: 'bg-state-success-lighter',
        warning: 'bg-state-warning-lighter',
        danger: 'bg-state-error-lighter',
      },
    },
    defaultVariants: {
      theme: 'neutral',
    },
  }
);

const cardHeaderColorOverlayVariants = cva(
  'absolute border-solid inset-0 pointer-events-none',
  {
    variants: {
      theme: {
        neutral: 'border-neutral-200 border-[0px_0px_1px]',
        primary: 'border-willow-primary-200 border-[0px_0px_1px]',
        info: 'border-info-200 border-[0px_0px_1px]',
        success: 'border-success/20 border-[0px_0px_1px]',
        warning: 'border-warning/20 border-[0px_0px_1px]',
        danger: 'border-destructive-200 border-[0px_0px_1px]',
      },
    },
    defaultVariants: {
      theme: 'neutral',
    },
  }
);

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {
  /** Background color theme for colored variant */
  theme?: 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger';
  /** Text alignment within the header */
  align?: 'left' | 'center' | 'right';
  /** Visual variant of the header */
  variant?: 'default' | 'colored';
}

/**
 * CardHeader Component
 * 
 * A header section for cards that can contain titles, descriptions, and other metadata.
 * Supports colored backgrounds and different text alignments.
 * 
 * @component
 * @example
 * ```tsx
 * // Default header
 * <CardHeader>
 *   <CardTitle>Title</CardTitle>
 *   <CardDescription>Description</CardDescription>
 * </CardHeader>
 * 
 * // Colored header
 * <CardHeader theme="primary" variant="colored">
 *   <CardTitle>Important Info</CardTitle>
 * </CardHeader>
 * ```
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, align, variant, theme, children, ...props }, ref) => {
    const isColored = variant === 'colored' || !!theme;
    
    if (isColored) {
      return (
        <CardHeaderContext.Provider value={{ isColored: true }}>
          <div
            ref={ref}
            className={cn(cardHeaderColorVariants({ theme }))}
            {...props}
          >
            <div className="flex flex-row items-center overflow-clip relative size-full">
              <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start pl-3 pr-2.5 py-1.5 relative w-full">
                <div className={cn(cardHeaderVariants({ align, variant: 'colored', className }))}>
                  {children}
                </div>
              </div>
            </div>
            <div className={cn(cardHeaderColorOverlayVariants({ theme }))} />
          </div>
        </CardHeaderContext.Provider>
      );
    }
    
    return (
      <CardHeaderContext.Provider value={{ isColored: false }}>
        <div
          ref={ref}
          className={cn(cardHeaderVariants({ align, variant, className }))}
          {...props}
        >
          {children}
        </div>
      </CardHeaderContext.Provider>
    );
  }
);
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** HTML heading element to render as */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * CardTitle Component
 * 
 * The main heading element for a card. Automatically registers with the parent Card
 * for accessibility labeling. Adapts styling based on whether it's in a colored header.
 * 
 * @component
 * @example
 * ```tsx
 * // Default h3 title
 * <CardTitle>Welcome Back</CardTitle>
 * 
 * // As h1 element
 * <CardTitle as="h1">Page Title</CardTitle>
 * 
 * // In colored header
 * <CardHeader variant="colored">
 *   <CardTitle>Alert Title</CardTitle>
 * </CardHeader>
 * ```
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  CardTitleProps
>(({ className, as: Component = 'h3', id, ...props }, ref) => {
  const { isColored } = React.useContext(CardHeaderContext);
  const { setTitleId } = React.useContext(CardContext);
  
  // Generate ID if not provided
  const generatedId = React.useId();
  const titleId = id || generatedId;
  
  // Register ID with Card
  React.useEffect(() => {
    if (setTitleId) {
      setTitleId(titleId);
      return () => setTitleId(undefined);
    }
  }, [titleId, setTitleId]);
  
  return (
    <Component
      ref={ref}
      id={titleId}
      className={cn(
        isColored 
          ? 'text-neutral-950 text-sm font-medium tracking-tight leading-5'
          : 'text-card-foreground text-xl font-normal tracking-tight leading-relaxed text-shadow-sm',
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription Component
 * 
 * A muted text element for providing additional context or descriptions within a card header.
 * Typically used alongside CardTitle for supplementary information.
 * 
 * @component
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle>Account Settings</CardTitle>
 *   <CardDescription>
 *     Manage your account preferences and security options
 *   </CardDescription>
 * </CardHeader>
 * ```
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-muted-foreground text-base font-normal leading-6', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContent Component
 * 
 * The main content container for a card. Provides consistent padding and spacing
 * for the primary content area between the header and footer.
 * 
 * @component
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Content Area</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Your main content goes here</p>
 *     <Button>Action</Button>
 *   </CardContent>
 * </Card>
 * ```
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const cardFooterVariants = cva('flex items-center p-6 pt-0', {
  variants: {
    align: {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    },
  },
  defaultVariants: {
    align: 'left',
  },
});

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {
  /** Alignment of footer content */
  align?: 'left' | 'center' | 'right' | 'between';
}

/**
 * CardFooter Component
 * 
 * A footer section for cards that typically contains action buttons or additional controls.
 * Supports different content alignments for flexible layouts.
 * 
 * @component
 * @example
 * ```tsx
 * // Left-aligned actions
 * <CardFooter>
 *   <Button variant="outline">Cancel</Button>
 *   <Button>Save</Button>
 * </CardFooter>
 * 
 * // Space between actions
 * <CardFooter align="between">
 *   <Button variant="ghost">Reset</Button>
 *   <div className="space-x-2">
 *     <Button variant="outline">Cancel</Button>
 *     <Button>Save</Button>
 *   </div>
 * </CardFooter>
 * ```
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ align, className }))}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};