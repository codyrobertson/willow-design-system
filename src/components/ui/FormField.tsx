import * as React from "react"
import { cn } from '../../lib/utils'
import { Label } from "./Label"
import { AlertCircle } from "lucide-react"

/**
 * FormFieldProps interface for the FormField wrapper component
 * 
 * @property {string} [label] - Field label text
 * @property {string} [error] - Error message to display
 * @property {string} [hint] - Helper text to display below the field
 * @property {boolean} [required] - Whether the field is required
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} children - Form input component (Input, Select, Textarea, etc.)
 * @property {string} [htmlFor] - Custom ID for the field (auto-generated if not provided)
 */
export interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
  htmlFor?: string
}

/**
 * FormField component - Wrapper for form inputs with label, error, and hint support
 * 
 * @component
 * @example
 * // Basic field with label
 * <FormField label="Email">
 *   <Input type="email" placeholder="Enter your email" />
 * </FormField>
 * 
 * @example
 * // Required field with error
 * <FormField
 *   label="Password"
 *   required
 *   error="Password must be at least 8 characters"
 * >
 *   <Input type="password" />
 * </FormField>
 * 
 * @example
 * // Field with hint text
 * <FormField
 *   label="Username"
 *   hint="Choose a unique username"
 * >
 *   <Input />
 * </FormField>
 * 
 * Features:
 * - Automatic accessibility attributes (aria-invalid, aria-describedby, etc.)
 * - Unique ID generation for label association
 * - Error state with icon
 * - Helper text support
 * - Required field indicator
 * 
 * @param {FormFieldProps} props - Component props
 * @param {string} [props.label] - Field label
 * @param {string} [props.error] - Error message
 * @param {string} [props.hint] - Helper text
 * @param {boolean} [props.required] - Required field indicator
 * @param {React.ReactNode} props.children - Form input component
 * @param {string} [props.htmlFor] - Custom field ID
 */
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