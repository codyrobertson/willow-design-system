'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from './Card';
import { SimpleForm, type SimpleFormField } from './SimpleForm';

export interface FormCardProps {
  title: string;
  subtitle?: string;
  fields: SimpleFormField[];
  submitText?: string;
  onSubmit: (data: Record<string, string>) => void | Promise<void>;
  currentStep?: number;
  totalSteps?: number;
  isLoading?: boolean;
  errors?: Record<string, string>;
  defaultValues?: Record<string, string>;
  className?: string;
  children?: React.ReactNode; // For additional content
}

/**
 * FormCard - A composable form wrapper using Card components
 * 
 * This is a simpler, more maintainable version that:
 * - Uses existing Card components for layout
 * - Delegates form logic to SimpleForm
 * - Removes internal state management
 * - Provides better composition patterns
 */
export function FormCard({
  title,
  subtitle,
  fields,
  submitText = 'Submit',
  onSubmit,
  currentStep,
  totalSteps,
  isLoading = false,
  errors,
  defaultValues,
  className,
  children,
}: FormCardProps) {
  return (
    <Card className={cn('max-w-md w-full', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
        {currentStep != null && totalSteps != null && (
          <div className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of {totalSteps}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <SimpleForm
          fields={fields}
          onSubmit={onSubmit}
          submitText={submitText}
          isLoading={isLoading}
          errors={errors}
          defaultValues={defaultValues}
        />
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Example usage patterns for better composition:
 */

// 1. Basic login form
export function LoginFormCard() {
  const handleSubmit = async (data: Record<string, string>) => {
    console.log('Login:', data);
  };

  return (
    <FormCard
      title="Sign In"
      subtitle="Enter your credentials to continue"
      fields={[
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          placeholder: 'Enter your password',
          required: true,
        },
      ]}
      submitText="Sign In"
      onSubmit={handleSubmit}
    />
  );
}

// 2. Multi-step form with custom content
export function OnboardingFormCard({ step }: { step: number }) {
  const steps = [
    {
      title: 'Personal Information',
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text' as const, required: true },
        { name: 'lastName', label: 'Last Name', type: 'text' as const, required: true },
      ],
    },
    {
      title: 'Contact Details',
      fields: [
        { name: 'email', label: 'Email', type: 'email' as const, required: true },
        { name: 'phone', label: 'Phone', type: 'tel' as const },
      ],
    },
  ];

  const currentStepData = steps[step - 1];

  return (
    <FormCard
      title={currentStepData.title}
      fields={currentStepData.fields}
      currentStep={step}
      totalSteps={steps.length}
      submitText={step === steps.length ? 'Complete' : 'Next'}
      onSubmit={(data) => console.log('Step data:', data)}
    >
      {/* Additional custom content */}
      <div className="mt-4 text-center">
        <a href="#" className="text-sm text-primary hover:underline">
          Need help?
        </a>
      </div>
    </FormCard>
  );
}

// 3. Using Card components directly for maximum flexibility
export function CustomFormCard() {
  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>Custom Form Layout</CardTitle>
        <CardDescription>
          This example shows direct composition
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <SimpleForm
          fields={[
            { name: 'message', label: 'Message', type: 'textarea', rows: 4 },
          ]}
          onSubmit={(data) => console.log(data)}
          submitText="Send Message"
        />
      </CardContent>
      
      <CardFooter className="justify-between">
        <button className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <span className="text-xs text-muted-foreground">
          By submitting, you agree to our terms
        </span>
      </CardFooter>
    </Card>
  );
}