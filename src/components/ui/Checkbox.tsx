import * as React from "react"
import { Check, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer shrink-0 rounded border ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
  {
    variants: {
      variant: {
        default: "border-input bg-background checked:bg-primary checked:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary",
        secondary: "border-input bg-background checked:bg-secondary checked:border-secondary-foreground checked:text-secondary-foreground data-[state=indeterminate]:bg-secondary data-[state=indeterminate]:border-secondary-foreground",
        destructive: "border-input bg-background checked:bg-destructive checked:border-destructive data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:border-destructive",
        outline: "border-primary bg-background checked:bg-background checked:border-primary data-[state=indeterminate]:bg-background data-[state=indeterminate]:border-primary",
        ghost: "border-transparent bg-transparent checked:bg-accent checked:border-accent data-[state=indeterminate]:bg-accent data-[state=indeterminate]:border-accent",
      },
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
      shape: {
        square: "rounded-sm",
        rounded: "rounded-md",
        circle: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "square",
    },
  }
)

const checkIconVariants = cva(
  "absolute left-0 top-0 pointer-events-none opacity-0 peer-checked:opacity-100 peer-data-[state=indeterminate]:hidden transition-opacity duration-200",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        destructive: "text-destructive-foreground",
        outline: "text-primary",
        ghost: "text-accent-foreground",
      },
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4", 
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const minusIconVariants = cva(
  "absolute left-0 top-0 pointer-events-none opacity-0 peer-data-[state=indeterminate]:opacity-100 hidden peer-data-[state=indeterminate]:block transition-opacity duration-200",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        destructive: "text-destructive-foreground",
        outline: "text-primary",
        ghost: "text-accent-foreground",
      },
      size: {
        sm: "h-3 w-3 p-0.5",
        md: "h-4 w-4 p-0.5",
        lg: "h-5 w-5 p-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof checkboxVariants> {
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, size, shape, onCheckedChange, indeterminate, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null)
    
    React.useImperativeHandle(ref, () => checkboxRef.current as HTMLInputElement)
    
    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate || false
      }
    }, [indeterminate])

    return (
      <div className="relative inline-flex">
        <input
          type="checkbox"
          className={cn(checkboxVariants({ variant, size, shape, className }))}
          ref={checkboxRef}
          data-state={indeterminate ? "indeterminate" : undefined}
          onChange={(e) => {
            props.onChange?.(e)
            if (onCheckedChange) {
              if (indeterminate) {
                onCheckedChange("indeterminate")
              } else {
                onCheckedChange(e.target.checked)
              }
            }
          }}
          aria-checked={indeterminate ? "mixed" : props.checked}
          {...props}
        />
        <Check className={cn(checkIconVariants({ variant, size }))} />
        <Minus className={cn(minusIconVariants({ variant, size }))} />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox, checkboxVariants }