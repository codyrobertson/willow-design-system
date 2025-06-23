'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { FormField } from './FormField';
import { Eye, EyeOff } from 'lucide-react';

/**
 * SimpleFormField interface for defining form fields declaratively
 * 
 * @property {string} name - Field name (used as key in form data)
 * @property {string} label - Field label text
 * @property {'text' | 'email' | 'password' | 'textarea' | 'tel' | 'url'} type - Input type
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [required] - Whether field is required
 * @property {string} [hint] - Helper text
 * @property {number} [maxLength] - Maximum character length
 * @property {React.ReactNode} [leftIcon] - Icon on the left side
 * @property {React.ReactNode} [rightIcon] - Icon on the right side
 * @property {number} [rows] - Number of rows for textarea
 */
export interface SimpleFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  hint?: string;
  maxLength?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rows?: number; // for textarea
}

/**
 * SimpleFormProps interface for the SimpleForm component
 * 
 * @property {SimpleFormField[]} fields - Array of field definitions
 * @property {Function} onSubmit - Submit handler with form data
 * @property {string} [submitText="Submit"] - Submit button text
 * @property {boolean} [isLoading=false] - Loading state
 * @property {Record<string, string>} [errors] - Field error messages
 * @property {Record<string, string>} [defaultValues] - Default field values
 * @property {string} [className] - Additional CSS classes
 */
export interface SimpleFormProps {
  fields: SimpleFormField[];
  onSubmit: (data: Record<string, string>) => void | Promise<void>;
  submitText?: string;
  isLoading?: boolean;
  errors?: Record<string, string>;
  defaultValues?: Record<string, string>;
  className?: string;
}

/**
 * SimpleForm component - A declarative form builder for quick forms
 * 
 * @component
 * @example
 * // Basic login form
 * <SimpleForm
 *   fields={[
 *     { name: 'email', label: 'Email', type: 'email', required: true },
 *     { name: 'password', label: 'Password', type: 'password', required: true }
 *   ]}
 *   onSubmit={(data) => console.log(data)}
 *   submitText="Sign In"
 * />
 * 
 * @example
 * // Contact form with icons and hints
 * <SimpleForm
 *   fields={[
 *     { 
 *       name: 'name', 
 *       label: 'Name', 
 *       type: 'text', 
 *       leftIcon: <User className="w-4 h-4" />,
 *       required: true 
 *     },
 *     { 
 *       name: 'message', 
 *       label: 'Message', 
 *       type: 'textarea',
 *       rows: 4,
 *       hint: 'Maximum 500 characters',
 *       maxLength: 500
 *     }
 *   ]}
 *   onSubmit={async (data) => await sendMessage(data)}
 *   isLoading={isSubmitting}
 * />
 * 
 * Features:
 * - Declarative field configuration
 * - Built-in password visibility toggle
 * - Icon support (left and right)
 * - Loading states
 * - Error handling
 * - Default values
 * - Textarea support
 * 
 * @param {SimpleFormProps} props - Component props
 */
export function SimpleForm({
  fields,
  onSubmit,
  submitText = 'Submit',
  isLoading = false,
  errors = {},
  defaultValues = {},
  className,
}: SimpleFormProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      initialData[field.name] = defaultValues[field.name] || '';
    });
    return initialData;
  });

  const [showPassword, setShowPassword] = React.useState<Record<string, boolean>>({});

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {fields.map(field => {
        const isPasswordField = field.type === 'password';
        const isTextarea = field.type === 'textarea';
        const fieldError = errors[field.name];
        const currentValue = formData[field.name] || '';

        return (
          <FormField
            key={field.name}
            label={field.label}
            required={field.required}
            error={fieldError}
            hint={field.hint}
          >
            {isTextarea ? (
              <Textarea
                id={field.name}
                name={field.name}
                value={currentValue}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                rows={field.rows || 3}
                className={cn(fieldError && 'border-destructive')}
              />
            ) : (
              <div className="relative">
                {field.leftIcon && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {field.leftIcon}
                  </div>
                )}
                <Input
                  id={field.name}
                  name={field.name}
                  type={isPasswordField && showPassword[field.name] ? 'text' : field.type}
                  value={currentValue}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  className={cn(
                    field.leftIcon && 'pl-10',
                    (isPasswordField || field.rightIcon) && 'pr-10',
                    fieldError && 'border-destructive'
                  )}
                />
                {isPasswordField && (
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.name)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword[field.name] ? 'Hide password' : 'Show password'}
                  >
                    {showPassword[field.name] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                )}
                {field.rightIcon && !isPasswordField && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {field.rightIcon}
                  </div>
                )}
              </div>
            )}
          </FormField>
        );
      })}

      <Button
        type="submit"
        disabled={isLoading}
        loading={isLoading}
        fullWidth
        size="lg"
      >
        {submitText}
      </Button>
    </form>
  );
}