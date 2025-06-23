'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { FormField } from './FormField';
import { Eye, EyeOff } from 'lucide-react';

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

export interface SimpleFormProps {
  fields: SimpleFormField[];
  onSubmit: (data: Record<string, string>) => void | Promise<void>;
  submitText?: string;
  isLoading?: boolean;
  errors?: Record<string, string>;
  defaultValues?: Record<string, string>;
  className?: string;
}

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