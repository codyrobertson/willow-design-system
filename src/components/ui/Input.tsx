import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-normal disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input shadow-input hover:border-neutral-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20",
        error: "border-destructive shadow-input-error focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20",
        success: "border-success shadow-sm focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20",
      },
      size: {
        sm: "h-9 py-2 text-xs",
        md: "h-11 py-3 text-sm",
        lg: "h-12 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, error, success, ...props }, ref) => {
    const computedVariant = error ? "error" : success ? "success" : variant;
    
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: computedVariant, size }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }