import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { SimpleForm } from './SimpleForm';
import { FormCard } from './FormCard.refactored';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './Card';
import { User, Mail, Lock, Phone, MessageSquare, CreditCard, Calendar } from 'lucide-react';
import { Icon } from './icon';
import { Button } from './Button';

const meta = {
  title: 'UI/Forms/SimpleForm',
  component: SimpleForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SimpleForm is a declarative form builder that simplifies creating forms with consistent styling and behavior.

## Features
- Declarative field configuration
- Built-in password visibility toggle
- Icon support (left and right side)
- Loading and error states
- Default values support
- Textarea support with character limits
- Full accessibility support

## When to use
- Quick forms that don't need complex validation
- Login/signup forms
- Contact forms
- Simple data collection

## FormCard Integration
SimpleForm works seamlessly with FormCard for a complete form experience with title, steps, and more.
        `
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SimpleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic form
export const Basic: Story = {
  args: {
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        placeholder: 'John',
        required: true,
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        placeholder: 'Doe',
        required: true,
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'john.doe@example.com',
        required: true,
      },
    ],
    submitText: 'Submit',
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    },
  },
};

// Form with icons
export const WithIcons: Story = {
  args: {
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        placeholder: 'Enter username',
        leftIcon: <Icon name="user" size="sm" />,
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'you@example.com',
        leftIcon: <Icon name="mail" size="sm" />,
        required: true,
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Enter password',
        leftIcon: <Icon name="lock" size="sm" />,
        required: true,
      },
    ],
    submitText: 'Sign Up',
    onSubmit: (data) => {
      console.log('Sign up:', data);
    },
  },
};

// Form with errors
export const WithErrors: Story = {
  args: {
    fields: [
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
        placeholder: 'Enter password',
        required: true,
      },
    ],
    errors: {
      email: 'Email is already in use',
      password: 'Password must be at least 8 characters',
    },
    submitText: 'Sign In',
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    },
  },
};

// Form with textarea
export const WithTextarea: Story = {
  args: {
    fields: [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        placeholder: 'Your name',
        required: true,
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Enter your message here...',
        rows: 4,
        maxLength: 500,
        hint: 'Maximum 500 characters',
      },
    ],
    submitText: 'Send Message',
    onSubmit: (data) => {
      console.log('Message sent:', data);
    },
  },
};

// Loading state
export const Loading: Story = {
  args: {
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'you@example.com',
      },
    ],
    submitText: 'Subscribe',
    isLoading: true,
    onSubmit: (data) => {
      console.log('Subscribing:', data);
    },
  },
};

// FormCard examples
export const FormCardBasic: StoryObj = {
  render: () => (
    <FormCard
      title="Create Account"
      subtitle="Enter your details to get started"
      fields={[
        {
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          placeholder: 'John Doe',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'john@example.com',
          required: true,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          placeholder: 'Create a password',
          required: true,
          hint: 'Must be at least 8 characters',
        },
      ]}
      submitText="Create Account"
      onSubmit={(data) => console.log('Account created:', data)}
    />
  ),
};

// Multi-step FormCard
export const FormCardMultiStep: StoryObj = {
  render: () => (
    <FormCard
      title="Complete Your Profile"
      subtitle="Tell us more about yourself"
      currentStep={2}
      totalSteps={3}
      fields={[
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'tel',
          placeholder: '+1 (555) 123-4567',
          leftIcon: <Icon name="phone" size="sm" />,
        },
        {
          name: 'company',
          label: 'Company',
          type: 'text',
          placeholder: 'Acme Inc.',
        },
        {
          name: 'role',
          label: 'Role',
          type: 'text',
          placeholder: 'Software Engineer',
        },
      ]}
      submitText="Continue"
      onSubmit={(data) => console.log('Step 2 complete:', data)}
    />
  ),
};

// Custom composition
export const CustomComposition: StoryObj = {
  render: () => (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>
          We'll get back to you within 24 hours
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <SimpleForm
          fields={[
            {
              name: 'subject',
              label: 'Subject',
              type: 'text',
              placeholder: 'What is this about?',
              required: true,
            },
            {
              name: 'message',
              label: 'Message',
              type: 'textarea',
              placeholder: 'Describe your issue...',
              rows: 5,
              required: true,
            },
          ]}
          submitText="Send Message"
          onSubmit={(data) => console.log('Support ticket:', data)}
        />
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Include as much detail as possible to help us resolve your issue quickly.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        Average response time: 4-6 hours
      </CardFooter>
    </Card>
  ),
};

// Inline form (no card)
export const InlineForm: Story = {
  args: {
    fields: [
      {
        name: 'email',
        label: 'Subscribe to newsletter',
        type: 'email',
        placeholder: 'Enter your email',
        hint: "We'll never share your email",
      },
    ],
    submitText: 'Subscribe',
    onSubmit: (data) => {
      console.log('Newsletter subscription:', data);
    },
    className: 'max-w-sm',
  },
};

// Interactive form with dynamic errors
export const InteractiveForm: StoryObj = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = React.useState('');
    
    const handleSubmit = async (data: Record<string, string>) => {
      setIsLoading(true);
      setErrors({});
      setSuccessMessage('');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate validation
      const newErrors: Record<string, string> = {};
      
      if (!data.email || !data.email.includes('@')) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (!data.password || data.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }
      
      // Success
      setIsLoading(false);
      setSuccessMessage('Login successful! Redirecting...');
    };
    
    return (
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleForm
            fields={[
              {
                name: 'email',
                label: 'Email',
                type: 'email',
                placeholder: 'you@example.com',
                leftIcon: <Mail className="w-4 h-4" />,
                required: true,
              },
              {
                name: 'password',
                label: 'Password',
                type: 'password',
                placeholder: 'Enter your password',
                leftIcon: <Lock className="w-4 h-4" />,
                required: true,
                hint: 'Forgot password?',
              },
            ]}
            onSubmit={handleSubmit}
            submitText="Sign In"
            isLoading={isLoading}
            errors={errors}
          />
          
          {successMessage && (
            <div className="mt-4 p-3 bg-success/10 text-success rounded-lg text-sm">
              {successMessage}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="#" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    );
  },
};

// Advanced form with all features
export const AdvancedForm: StoryObj = {
  render: () => {
    const [formData, setFormData] = React.useState<Record<string, string>>({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    });
    
    return (
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Advanced Form Example</CardTitle>
          <CardDescription>
            Demonstrating all SimpleForm features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SimpleForm
            fields={[
              {
                name: 'firstName',
                label: 'First Name',
                type: 'text',
                placeholder: 'John',
                leftIcon: <User className="w-4 h-4" />,
                required: true,
              },
              {
                name: 'lastName',
                label: 'Last Name',
                type: 'text',
                placeholder: 'Doe',
                leftIcon: <User className="w-4 h-4" />,
                required: true,
              },
              {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                placeholder: 'john@example.com',
                leftIcon: <Mail className="w-4 h-4" />,
                required: true,
                hint: 'We\'ll use this for account recovery',
              },
              {
                name: 'phone',
                label: 'Phone Number',
                type: 'tel',
                placeholder: '+1 (555) 123-4567',
                leftIcon: <Phone className="w-4 h-4" />,
              },
              {
                name: 'dob',
                label: 'Date of Birth',
                type: 'text',
                placeholder: 'MM/DD/YYYY',
                leftIcon: <Calendar className="w-4 h-4" />,
                required: true,
              },
              {
                name: 'bio',
                label: 'Bio',
                type: 'textarea',
                placeholder: 'Tell us about yourself...',
                rows: 4,
                maxLength: 200,
                hint: 'Maximum 200 characters',
              },
              {
                name: 'password',
                label: 'Password',
                type: 'password',
                placeholder: 'Create a strong password',
                leftIcon: <Lock className="w-4 h-4" />,
                required: true,
                hint: 'At least 8 characters with 1 number',
              },
            ]}
            defaultValues={formData}
            onSubmit={(data) => {
              console.log('Form submitted:', data);
              alert('Check console for form data');
            }}
            submitText="Create Account"
          />
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Form Data Preview:</h4>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  },
};