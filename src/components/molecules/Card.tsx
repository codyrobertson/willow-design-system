'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, CompoundComponentContext } from '@/components/primitives/types';

/**
 * Card variants - simplified and maintainable
 */
const cardVariants = cva(
  'rounded-lg bg-card text-card-foreground',
  {
    variants: {
      variant: {
        default: 'border shadow-sm',
        elevated: 'shadow-lg',
        outline: 'border-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CardContextValue {
  variant?: 'default' | 'elevated' | 'outline';
}

const CardContext = React.createContext<CompoundComponentContext<CardContextValue>>({
  internal: { variant: 'default' }
});

/* ---------------------------- */
/*       Root Component         */
/* ---------------------------- */

export interface CardProps 
  extends BaseComponentProps,
    VariantProps<typeof cardVariants> {}

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, children, ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ internal: { variant } }),
      [variant]
    );

    return (
      <CardContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(cardVariants({ variant }), className)}
          {...props}
        >
          {children}
        </div>
      </CardContext.Provider>
    );
  }
);
CardRoot.displayName = 'Card';

/* ---------------------------- */
/*      Header Component        */
/* ---------------------------- */

export interface CardHeaderProps extends BaseComponentProps {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'Card.Header';

/* ---------------------------- */
/*       Title Component        */
/* ---------------------------- */

export interface CardTitleProps extends BaseComponentProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'Card.Title';

/* ---------------------------- */
/*   Description Component      */
/* ---------------------------- */

export interface CardDescriptionProps extends BaseComponentProps {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'Card.Description';

/* ---------------------------- */
/*      Content Component       */
/* ---------------------------- */

export interface CardContentProps extends BaseComponentProps {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'Card.Content';

/* ---------------------------- */
/*      Footer Component        */
/* ---------------------------- */

export interface CardFooterProps extends BaseComponentProps {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'Card.Footer';

/* ---------------------------- */
/*     Export as Compound       */
/* ---------------------------- */

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});