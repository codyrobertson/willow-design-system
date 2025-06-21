'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Card } from '@/components/molecules/Card';
import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { Button } from '@/components/atoms/Button';
import type { BaseComponentProps, CompoundComponentContext } from '@/components/primitives/types';

/**
 * Form context for managing form state
 */
interface FormContextValue {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  registerField: (name: string) => void;
  unregisterField: (name: string) => void;
}

const FormContext = React.createContext<CompoundComponentContext<FormContextValue>>({
  internal: {
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    setValue: () => {},
    setError: () => {},
    setTouched: () => {},
    registerField: () => {},
    unregisterField: () => {},
  }
});

/* ---------------------------- */
/*       Root Component         */
/* ---------------------------- */

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  validation?: Record<string, (value: any) => string | undefined>;
}

const FormRoot = React.forwardRef<HTMLFormElement, FormProps>(
  ({ 
    children,
    initialValues = {},
    onSubmit,
    validation = {},
    ...props 
  }, ref) => {
    const [values, setValues] = React.useState<Record<string, any>>(initialValues);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [touched, setTouched] = React.useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const registeredFields = React.useRef(new Set<string>());
    
    const setValue = React.useCallback((name: string, value: any) => {
      setValues(prev => ({ ...prev, [name]: value }));
      
      // Run validation if field has been touched
      if (touched[name] && validation[name]) {
        const error = validation[name](value);
        setErrors(prev => ({ ...prev, [name]: error || '' }));
      }
    }, [touched, validation]);
    
    const setError = React.useCallback((name: string, error: string) => {
      setErrors(prev => ({ ...prev, [name]: error }));
    }, []);
    
    const setTouched = React.useCallback((name: string, touched: boolean) => {
      setTouched(prev => ({ ...prev, [name]: touched }));
      
      // Run validation on blur
      if (touched && validation[name]) {
        const error = validation[name](values[name]);
        setErrors(prev => ({ ...prev, [name]: error || '' }));
      }
    }, [validation, values]);
    
    const registerField = React.useCallback((name: string) => {
      registeredFields.current.add(name);
    }, []);
    
    const unregisterField = React.useCallback((name: string) => {
      registeredFields.current.delete(name);
    }, []);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      if (isSubmitting) return;
      
      // Validate all fields
      const newErrors: Record<string, string> = {};
      let hasErrors = false;
      
      registeredFields.current.forEach(name => {
        if (validation[name]) {
          const error = validation[name](values[name]);
          if (error) {
            newErrors[name] = error;
            hasErrors = true;
          }
        }
      });
      
      setErrors(newErrors);
      
      if (!hasErrors && onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    };
    
    const contextValue = React.useMemo(
      () => ({
        internal: {
          values,
          errors,
          touched,
          isSubmitting,
          setValue,
          setError,
          setTouched,
          registerField,
          unregisterField,
        }
      }),
      [values, errors, touched, isSubmitting, setValue, setError, setTouched, registerField, unregisterField]
    );
    
    return (
      <FormContext.Provider value={contextValue}>
        <form ref={ref} onSubmit={handleSubmit} {...props}>
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);
FormRoot.displayName = 'Form';

/* ---------------------------- */
/*      Field Component         */
/* ---------------------------- */

const fieldVariants = cva(
  'space-y-2',
  {
    variants: {
      layout: {
        vertical: 'space-y-2',
        horizontal: 'flex items-center space-x-4',
      },
    },
    defaultVariants: {
      layout: 'vertical',
    },
  }
);

export interface FormFieldProps 
  extends BaseComponentProps,
    VariantProps<typeof fieldVariants> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    className,
    layout,
    name,
    label,
    description,
    required,
    children,
    ...props 
  }, ref) => {
    const { internal } = React.useContext(FormContext);
    const { errors, registerField, unregisterField } = internal;
    const error = errors[name];
    
    React.useEffect(() => {
      registerField(name);
      return () => unregisterField(name);
    }, [name, registerField, unregisterField]);
    
    return (
      <div ref={ref} className={cn(fieldVariants({ layout }), className)} {...props}>
        {label && (
          <Label 
            htmlFor={name} 
            required={required}
            variant={error ? 'destructive' : 'default'}
          >
            {label}
          </Label>
        )}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              id: name,
              name,
              'aria-invalid': !!error,
              'aria-describedby': error ? `${name}-error` : description ? `${name}-description` : undefined,
            });
          }
          return child;
        })}
        {description && !error && (
          <p id={`${name}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={`${name}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'Form.Field';

/* ---------------------------- */
/*      Input Component         */
/* ---------------------------- */

export interface FormInputProps extends Omit<React.ComponentProps<typeof Input>, 'name' | 'value' | 'onChange'> {
  name: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, ...props }, ref) => {
    const { internal } = React.useContext(FormContext);
    const { values, setValue, setTouched } = internal;
    
    return (
      <Input
        ref={ref}
        name={name}
        value={values[name] || ''}
        onChange={(value) => setValue(name, value)}
        onBlur={() => setTouched(name, true)}
        {...props}
      />
    );
  }
);
FormInput.displayName = 'Form.Input';

/* ---------------------------- */
/*     Textarea Component       */
/* ---------------------------- */

export interface FormTextareaProps extends Omit<React.ComponentProps<typeof Textarea>, 'name' | 'value' | 'onChange'> {
  name: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ name, ...props }, ref) => {
    const { internal } = React.useContext(FormContext);
    const { values, setValue, setTouched } = internal;
    
    return (
      <Textarea
        ref={ref}
        name={name}
        value={values[name] || ''}
        onChange={(value) => setValue(name, value)}
        onBlur={() => setTouched(name, true)}
        {...props}
      />
    );
  }
);
FormTextarea.displayName = 'Form.Textarea';

/* ---------------------------- */
/*     Submit Component         */
/* ---------------------------- */

export interface FormSubmitProps extends React.ComponentProps<typeof Button> {}

const FormSubmit = React.forwardRef<HTMLButtonElement, FormSubmitProps>(
  ({ children = 'Submit', disabled, ...props }, ref) => {
    const { internal } = React.useContext(FormContext);
    const { isSubmitting } = internal;
    
    return (
      <Button
        ref={ref}
        type="submit"
        disabled={disabled || isSubmitting}
        loading={isSubmitting}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
FormSubmit.displayName = 'Form.Submit';

/* ---------------------------- */
/*     Export as Compound       */
/* ---------------------------- */

export const Form = Object.assign(FormRoot, {
  Field: FormField,
  Input: FormInput,
  Textarea: FormTextarea,
  Submit: FormSubmit,
});

/* ---------------------------- */
/*    FormCard Convenience      */
/* ---------------------------- */

export interface FormCardProps extends FormProps {
  title?: string;
  description?: string;
  cardProps?: React.ComponentProps<typeof Card>;
}

export const FormCard = React.forwardRef<HTMLFormElement, FormCardProps>(
  ({ title, description, cardProps, children, ...formProps }, ref) => {
    return (
      <Card {...cardProps}>
        {(title || description) && (
          <Card.Header>
            {title && <Card.Title>{title}</Card.Title>}
            {description && <Card.Description>{description}</Card.Description>}
          </Card.Header>
        )}
        <Form ref={ref} {...formProps}>
          <Card.Content>
            {children}
          </Card.Content>
        </Form>
      </Card>
    );
  }
);
FormCard.displayName = 'FormCard';