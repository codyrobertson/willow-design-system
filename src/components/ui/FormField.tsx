import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./Label"
import { AlertCircle } from "lucide-react"

export interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
  htmlFor?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, hint, required, className, children, htmlFor }, ref) => {
    // Generate unique IDs for accessibility
    const generatedId = React.useId()
    const fieldId = htmlFor || generatedId
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`
    
    // Clone child element to add accessibility attributes
    const child = React.Children.only(children)
    const enhancedChild = React.isValidElement(child) 
      ? React.cloneElement(child as React.ReactElement<any>, {
          id: fieldId,
          'aria-describedby': [
            error && errorId,
            hint && !error && hintId,
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? true : undefined,
          'aria-required': required || undefined,
        })
      : child

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={fieldId}>
            {label}
            {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
          </Label>
        )}
        {enhancedChild}
        {hint && !error && (
          <p id={hintId} className="text-sm text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }