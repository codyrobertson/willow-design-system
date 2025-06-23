import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '../../lib/utils'

const labelVariants = cva(
  "text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
  optional?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, optional, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
      {optional && <span className="text-muted-foreground ml-1 text-xs">(optional)</span>}
    </label>
  )
)
Label.displayName = "Label"

export { Label }