import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '../../lib/utils'

const textareaVariants = cva(
  "flex w-full rounded-lg border bg-background px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
  {
    variants: {
      variant: {
        default: "border-input shadow-input hover:border-neutral-300 focus:border-primary",
        error: "border-destructive shadow-input-error focus:border-destructive focus:ring-destructive/20",
        success: "border-success shadow-sm focus:border-success focus:ring-success/20",
        outline: "border-primary bg-transparent focus:bg-background",
        ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "min-h-[60px] text-xs py-2",
        md: "min-h-[80px] text-sm py-3",
        lg: "min-h-[100px] text-base py-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean
  success?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, error, success, ...props }, ref) => {
    const computedVariant = error ? "error" : success ? "success" : variant
    
    return (
      <textarea
        className={cn(
          textareaVariants({ variant: computedVariant, size }),
          className
        )}
        ref={ref}
        aria-invalid={error || undefined}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }