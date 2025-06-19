import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * A container component that provides a styled card with a border and shadow.
 * It is the main wrapper for all other card components.
 * It is a stateless, side-effect-free component, ensuring efficient DOM updates.
 * The border effect is automatically applied and is part of this component's style.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to the underlying div element.
 * @returns {React.ReactElement} The rendered card component.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-card text-card-foreground relative rounded-tl-2xl rounded-tr-2xl shadow-card",
      className
    )}
    {...props}
  >
    <div className="absolute border border-border border-solid inset-0 pointer-events-none rounded-tl-2xl rounded-tr-2xl" />
    <div className="relative h-full">{props.children}</div>
  </div>
));
Card.displayName = "Card";

/**
 * A header component for the Card.
 * Intended to be used for titles and descriptions.
 * It is a stateless, side-effect-free component.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to the underlying div element.
 * @returns {React.ReactElement} The rendered card header.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2 p-6 text-center", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * A title component for the CardHeader.
 * Should be used to display the main heading of the card.
 * It is a stateless, side-effect-free component.
 *
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - The props for the component.
 * @param {React.Ref<HTMLParagraphElement>} ref - The ref to the underlying h3 element.
 * @returns {React.ReactElement} The rendered card title.
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-card-foreground text-[22px] font-bold tracking-[-0.44px] leading-[1.35] text-shadow-sm",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * A description component for the CardHeader.
 * Should be used for subtext or additional information.
 * It is a stateless, side-effect-free component.
 *
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - The props for the component.
 * @param {React.Ref<HTMLParagraphElement>} ref - The ref to the underlying p element.
 * @returns {React.ReactElement} The rendered card description.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground text-base font-medium leading-6", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * The main content area for the Card.
 * Use this to wrap the primary content of your card.
 * It is a stateless, side-effect-free component.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to the underlying div element.
 * @returns {React.ReactElement} The rendered card content.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * A footer component for the Card.
 * Useful for action buttons or closing remarks.
 * It is a stateless, side-effect-free component.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to the underlying div element.
 * @returns {React.ReactElement} The rendered card footer.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 pb-16", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}; 