'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Eye, EyeOff } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/src/components/ui/Card';

export interface FormField {
  /**
   * Unique field identifier
   */
  name: string;
  /**
   * Field label
   */
  label: string;
  /**
   * Input type
   */
  type: 'text' | 'email' | 'password' | 'textarea';
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Field validation rules
   */
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
  /**
   * Character counter for textareas
   */
  showCharCount?: boolean;
  /**
   * Maximum characters (for counter)
   */
  maxChars?: number;
  /**
   * Left icon for input
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon for input (e.g., password visibility toggle)
   */
  rightIcon?: React.ReactNode;
}

export interface FormCardProps {
  /**
   * Card title/heading
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Form fields configuration
   */
  fields: FormField[];
  /**
   * Submit button text
   */
  submitText: string;
  /**
   * Form submission handler
   */
  onSubmit: (data: Record<string, string>) => void;
  /**
   * Current step number (for multi-step flows)
   */
  currentStep?: number;
  /**
   * Total steps (for multi-step flows)
   */
  totalSteps?: number;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Form validation errors
   */
  errors?: Record<string, string>;
  /**
   * Initial form values
   */
  defaultValues?: Record<string, string>;
  /**
   * Additional styling
   */
  className?: string;
}

export const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  ({
    title,
    subtitle,
    fields,
    submitText,
    onSubmit,
    currentStep,
    totalSteps,
    isLoading = false,
    errors = {},
    defaultValues = {},
    className,
  }, ref) => {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    // Initialize with defaultValues or empty strings for each field
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      initialData[field.name] = defaultValues[field.name] || '';
    });
    return initialData;
  });
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validateField = useCallback((field: FormField, value: string): string | undefined => {
    if (field.validation?.required && !value) {
      return `${field.label} is required`;
    }
    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `${field.label} must be at least ${field.validation.minLength} characters`;
    }
    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `${field.label} must be no more than ${field.validation.maxLength} characters`;
    }
    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `${field.label} is invalid`;
    }
    return undefined;
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched.
    const allTouched = fields.reduce((acc, field) => {
      acc[field.name] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate form.
    const isValid = fields.every(field => {
      const value = formData[field.name] || '';
      return !validateField(field, value);
    });

    if (isValid) {
      onSubmit(formData);
    }
  };

  const togglePasswordVisibility = useCallback((fieldName: string) => {
    setShowPassword(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }, []);

  const getFieldError = useCallback((field: FormField): string | undefined => {
    const value = formData[field.name] || '';
    // Show error if the field has been touched or a server-side error is provided.
    if (!touched[field.name] && !errors[field.name]) return undefined;

    const validationError = validateField(field, value);
    if (validationError) {
      return validationError;
    }
    
    return errors[field.name];
  }, [formData, touched, errors, validateField]);

  return (
    <Card ref={ref} className={cn('max-w-md w-full', className)} variant="default">
      <form onSubmit={handleSubmit} noValidate className="w-full">
        <CardHeader align="center" className="px-8 pt-6 pb-4">
          <h2 className="font-codec-pro font-normal text-[#534f5e] text-[32px] tracking-[-0.64px]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[#635e73] text-base">
              {subtitle}
            </p>
          )}
          {currentStep != null && totalSteps != null && (
            <div className="flex items-center gap-2 text-sm text-[#635e73]">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
            </div>
          )}
        </CardHeader>

        {/* Form Content */}
        <CardContent className="px-8 pt-0 pb-6">
          <div className="flex flex-col gap-5 items-start justify-start w-full">
            {fields.map(field => {
              const error = getFieldError(field);
              const isPasswordField = field.type === 'password';
              const isTextarea = field.type === 'textarea';
              const currentValue = formData[field.name] || '';

              return (
                <div key={field.name} className="relative w-full">
                  <div className="flex flex-col gap-1 items-start justify-start w-full">
                    {/* Label */}
                    <div className="relative w-full">
                      <div className="flex flex-row gap-px items-center justify-start w-full">
                        <label
                          htmlFor={field.name}
                          className="font-codec-pro font-normal text-[#312f37] text-sm tracking-[-0.084px] leading-5"
                        >
                          {field.label}
                        </label>
                      </div>
                    </div>

                    {/* Input Field */}
                    <div
                      className={cn(
                        'bg-white relative rounded-[10px] w-full',
                        error && 'border border-red-500'
                      )}
                    >
                      <div className="flex flex-row items-center overflow-hidden relative h-full">
                        <div className="flex flex-row gap-2 items-center justify-start pl-4 pr-3 py-3 relative w-full">
                          {field.leftIcon && (
                            <div className="flex-shrink-0 w-5 h-5 text-[#635e73]">
                              {field.leftIcon}
                            </div>
                          )}

                          {isTextarea ? (
                            <textarea
                              id={field.name}
                              name={field.name}
                              value={currentValue}
                              onChange={e =>
                                handleChange(field.name, e.target.value)
                              }
                              onBlur={() => handleBlur(field.name)}
                              placeholder={field.placeholder}
                              maxLength={field.maxChars}
                              rows={3}
                              aria-invalid={!!error}
                              aria-describedby={
                                error ? `${field.name}-error` : undefined
                              }
                              className="flex-1 font-codec-pro text-sm text-[#312f37] placeholder:text-[#b8b2c9] leading-5 bg-transparent outline-none resize-none"
                            />
                          ) : (
                            <input
                              id={field.name}
                              name={field.name}
                              type={
                                isPasswordField && showPassword[field.name]
                                  ? 'text'
                                  : field.type
                              }
                              value={currentValue}
                              onChange={e =>
                                handleChange(field.name, e.target.value)
                              }
                              onBlur={() => handleBlur(field.name)}
                              placeholder={field.placeholder}
                              aria-invalid={!!error}
                              aria-describedby={
                                error ? `${field.name}-error` : undefined
                              }
                              maxLength={field.maxChars}
                              className="flex-1 font-codec-pro text-sm text-[#312f37] placeholder:text-[#b8b2c9] leading-5 bg-transparent outline-none"
                            />
                          )}

                          {isPasswordField && (
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility(field.name)
                              }
                              aria-label={
                                showPassword[field.name]
                                  ? 'Hide password'
                                  : 'Show password'
                              }
                              className="flex-shrink-0 w-5 h-5 text-[#635e73] hover:text-[#312f37] transition-colors"
                            >
                              {showPassword[field.name] ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          )}

                          {field.rightIcon && !isPasswordField && (
                            <div className="flex-shrink-0 w-5 h-5 text-[#635e73]">
                              {field.rightIcon}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute border border-[#e1dee9] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]" />
                    </div>

                    {/* Character counter or error message */}
                    {(field.showCharCount || error) && (
                      <div className="flex justify-between items-center w-full mt-1">
                        {error && (
                          <span
                            id={`${field.name}-error`}
                            className="text-xs text-red-500"
                          >
                            {error}
                          </span>
                        )}
                        {field.showCharCount && field.maxChars && (
                          <span
                            className={cn(
                              'text-xs ml-auto',
                              currentValue.length > field.maxChars * 0.9
                                ? 'text-red-500'
                                : 'text-[#635e73]'
                            )}
                          >
                            {currentValue.length}/{field.maxChars}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>

        {/* Button Container */}
        <CardFooter align="center" className="px-8 pt-4 pb-8">
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            variant="fancy"
            size="lg"
            fullWidth
            radius="full"
            className="text-2xl font-codec-pro font-normal"
          >
            {submitText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
  }
);
FormCard.displayName = 'FormCard';