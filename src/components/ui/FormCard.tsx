'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FancyButton } from './FancyButton';
import { FA6Icon } from './FA6Icon';

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

interface FormCardProps {
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

export function FormCard({
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
}: FormCardProps) {
  const [formData, setFormData] = useState<Record<string, string>>(defaultValues);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update formData if defaultValues change. This allows resetting the form from the parent.
  // For a full reset (including touched state), consider using the 'key' prop on the FormCard instance.
  useEffect(() => {
    setFormData(defaultValues);
  }, [defaultValues]);

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
    <div
      className={cn(
        "bg-white max-w-md w-full rounded-lg shadow-[0px_4px_20px_0px_rgba(0,0,0,0.12),0px_1px_3px_0px_rgba(37,62,167,0.2),0px_0px_0px_1px_rgba(55,93,251,0.1),0px_1px_2px_0px_rgba(0,0,0,0.05)]",
        className
      )}
    >
      {/* Border effect */}
      <div className="absolute border border-slate-200 border-solid inset-0 pointer-events-none rounded-lg" />
      
      <div className="flex flex-col items-center justify-center relative h-full">
        <form onSubmit={handleSubmit} noValidate className="w-full">
          <div className="flex flex-col gap-2 items-center justify-center pb-0 pt-10 px-0 relative w-full">
            {/* Header */}
            <div className="relative w-full">
              <div className="flex flex-col justify-center relative h-full">
                <div className="flex flex-col gap-3 items-start justify-center pb-6 pt-8 px-6 relative w-full">
                  <h2 className="font-ux-sans-medium text-[#534f5e] text-[32px] text-center tracking-[-0.64px]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-[#635e73] text-base text-center w-full">
                      {subtitle}
                    </p>
                  )}
                  {currentStep != null && totalSteps != null && (
                    <div className="flex items-center gap-2 text-sm text-[#635e73] w-full justify-center">
                      <span>Step {currentStep} of {totalSteps}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="relative w-full">
              <div className="flex flex-col gap-6 items-start justify-start pb-6 pt-0 px-6 relative w-full">
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
                              className="font-ux-sans-medium text-[#312f37] text-sm tracking-[-0.084px] leading-5"
                            >
                              {field.label}
                            </label>
                          </div>
                        </div>
                        
                        {/* Input Field */}
                        <div className={cn(
                          "bg-white relative rounded-[10px] w-full",
                          error && "border border-red-500"
                        )}>
                          <div className="flex flex-row items-center overflow-hidden relative h-full">
                            <div className="flex flex-row gap-2 items-center justify-start pl-3 pr-2.5 py-2.5 relative w-full">
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
                                  onChange={(e) => handleChange(field.name, e.target.value)}
                                  onBlur={() => handleBlur(field.name)}
                                  placeholder={field.placeholder}
                                  maxLength={field.maxChars}
                                  rows={3}
                                  aria-invalid={!!error}
                                  aria-describedby={error ? `${field.name}-error` : undefined}
                                  className="flex-1 font-['Codec Pro'] text-sm text-[#312f37] placeholder:text-[#b8b2c9] leading-5 bg-transparent outline-none resize-none"
                                />
                              ) : (
                                <input
                                  id={field.name}
                                  name={field.name}
                                  type={isPasswordField && showPassword[field.name] ? 'text' : field.type}
                                  value={currentValue}
                                  onChange={(e) => handleChange(field.name, e.target.value)}
                                  onBlur={() => handleBlur(field.name)}
                                  placeholder={field.placeholder}
                                  aria-invalid={!!error}
                                  aria-describedby={error ? `${field.name}-error` : undefined}
                                  maxLength={field.maxChars}
                                  className="flex-1 font-['Codec Pro'] text-sm text-[#312f37] placeholder:text-[#b8b2c9] leading-5 bg-transparent outline-none"
                                />
                              )}
                              
                              {isPasswordField && (
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(field.name)}
                                  aria-label={showPassword[field.name] ? 'Hide password' : 'Show password'}
                                  className="flex-shrink-0 w-5 h-5 text-[#635e73] hover:text-[#312f37] transition-colors"
                                >
                                  <FA6Icon 
                                    name={showPassword[field.name] ? 'eye-slash' : 'eye'} 
                                    style="regular"
                                    size="base"
                                  />
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
                              <span id={`${field.name}-error`} className="text-xs text-red-500">
                                {error}
                              </span>
                            )}
                            {field.showCharCount && field.maxChars && (
                              <span className={cn(
                                "text-xs ml-auto",
                                currentValue.length > field.maxChars * 0.9 ? "text-red-500" : "text-[#635e73]"
                              )}>
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
            </div>

            {/* Button Container */}
            <div className="relative w-full">
              <div className="flex flex-col gap-4 items-start justify-start pb-8 pt-4 px-6 relative w-full">
                <FancyButton
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  size="lg"
                  fullWidth
                  className="text-2xl font-ux-sans-medium"
                >
                  {submitText}
                </FancyButton>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Inner shadow effect */}
      <div className="absolute inset-0 pointer-events-none shadow-[0px_-2.4px_9.3px_0px_inset_rgba(137,114,250,0.15)]" />
    </div>
  );
}