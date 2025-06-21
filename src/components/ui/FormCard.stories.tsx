import type { Meta, StoryObj } from '@storybook/nextjs';
import { FormCard, FormField } from './FormCard';
import { Mail, Lock, User, Phone, Calendar, FileText, MapPin } from 'lucide-react';

const meta: Meta<typeof FormCard> = {
  title: 'UI/Forms/FormCard',
  component: FormCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
    },
    subtitle: {
      control: 'text',
    },
    submitText: {
      control: 'text',
    },
    isLoading: {
      control: 'boolean',
    },
    currentStep: {
      control: 'number',
    },
    totalSteps: {
      control: 'number',
    },
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormCard>;

// Simple Login Form
export const SimpleLogin: Story = {
  args: {
    title: 'Sign In',
    subtitle: 'Enter your credentials to access your account',
    submitText: 'Sign In',
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'you@example.com',
        leftIcon: <Mail className="h-5 w-5" />,
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
        leftIcon: <Lock className="h-5 w-5" />,
        validation: {
          required: true,
          minLength: 6,
        },
      },
    ] as FormField[],
    onSubmit: (data) => {
      console.log('Login submitted:', data);
    },
  },
};

// Registration Form with Multiple Fields
export const Registration: Story = {
  args: {
    title: 'Create Account',
    subtitle: 'Join Willow to start managing your health',
    submitText: 'Create Account',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        placeholder: 'John',
        leftIcon: <User className="h-5 w-5" />,
        validation: {
          required: true,
          minLength: 2,
        },
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        placeholder: 'Doe',
        leftIcon: <User className="h-5 w-5" />,
        validation: {
          required: true,
          minLength: 2,
        },
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'you@example.com',
        leftIcon: <Mail className="h-5 w-5" />,
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'text',
        placeholder: '(555) 123-4567',
        leftIcon: <Phone className="h-5 w-5" />,
        validation: {
          required: true,
          pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
        },
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Create a strong password',
        leftIcon: <Lock className="h-5 w-5" />,
        validation: {
          required: true,
          minLength: 8,
          maxLength: 50,
        },
      },
      {
        name: 'confirmPassword',
        label: 'Confirm Password',
        type: 'password',
        placeholder: 'Re-enter your password',
        leftIcon: <Lock className="h-5 w-5" />,
        validation: {
          required: true,
        },
      },
    ] as FormField[],
    onSubmit: (data) => {
      console.log('Registration submitted:', data);
    },
  },
};

// Multi-Step Form Example
export const MultiStepForm: Story = {
  args: {
    title: 'Personal Information',
    subtitle: 'Please provide your personal details',
    submitText: 'Continue',
    currentStep: 2,
    totalSteps: 3,
    fields: [
      {
        name: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'text',
        placeholder: 'MM/DD/YYYY',
        leftIcon: <Calendar className="h-5 w-5" />,
        validation: {
          required: true,
          pattern: /^\d{2}\/\d{2}\/\d{4}$/,
        },
      },
      {
        name: 'address',
        label: 'Home Address',
        type: 'textarea',
        placeholder: 'Enter your full address',
        leftIcon: <MapPin className="h-5 w-5" />,
        validation: {
          required: true,
          minLength: 10,
          maxLength: 200,
        },
        showCharCount: true,
        maxChars: 200,
      },
      {
        name: 'medicalHistory',
        label: 'Medical History Summary',
        type: 'textarea',
        placeholder: 'Briefly describe any relevant medical history',
        leftIcon: <FileText className="h-5 w-5" />,
        validation: {
          maxLength: 500,
        },
        showCharCount: true,
        maxChars: 500,
      },
    ] as FormField[],
    onSubmit: (data) => {
      console.log('Step 2 submitted:', data);
    },
  },
};

// Form with Validation Errors
export const WithValidationErrors: Story = {
  args: {
    title: 'Reset Password',
    subtitle: 'Enter your email to receive a reset link',
    submitText: 'Send Reset Link',
    fields: [
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'you@example.com',
        leftIcon: <Mail className="h-5 w-5" />,
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
    ] as FormField[],
    errors: {
      email: 'This email address is not associated with any account',
    },
    defaultValues: {
      email: 'notfound@example.com',
    },
    onSubmit: (data) => {
      console.log('Password reset requested for:', data.email);
    },
  },
};

// Form in Loading State
export const LoadingState: Story = {
  args: {
    title: 'Processing Payment',
    subtitle: 'Please wait while we process your payment',
    submitText: 'Processing...',
    isLoading: true,
    fields: [
      {
        name: 'cardNumber',
        label: 'Card Number',
        type: 'text',
        placeholder: '•••• •••• •••• 4242',
        validation: {
          required: true,
        },
      },
      {
        name: 'cardholderName',
        label: 'Cardholder Name',
        type: 'text',
        placeholder: 'John Doe',
        leftIcon: <User className="h-5 w-5" />,
        validation: {
          required: true,
        },
      },
    ] as FormField[],
    defaultValues: {
      cardNumber: '•••• •••• •••• 4242',
      cardholderName: 'John Doe',
    },
    onSubmit: (data) => {
      console.log('Processing payment:', data);
    },
  },
};

// Contact Form with Character Counter
export const ContactForm: Story = {
  args: {
    title: 'Contact Us',
    subtitle: 'We would love to hear from you',
    submitText: 'Send Message',
    fields: [
      {
        name: 'name',
        label: 'Your Name',
        type: 'text',
        placeholder: 'John Doe',
        leftIcon: <User className="h-5 w-5" />,
        validation: {
          required: true,
        },
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'you@example.com',
        leftIcon: <Mail className="h-5 w-5" />,
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        placeholder: 'How can we help?',
        validation: {
          required: true,
          maxLength: 100,
        },
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Tell us more about your inquiry...',
        leftIcon: <FileText className="h-5 w-5" />,
        validation: {
          required: true,
          minLength: 20,
          maxLength: 1000,
        },
        showCharCount: true,
        maxChars: 1000,
      },
    ] as FormField[],
    onSubmit: (data) => {
      console.log('Contact form submitted:', data);
    },
  },
};

// Minimal Form
export const MinimalForm: Story = {
  args: {
    title: 'Subscribe',
    submitText: 'Subscribe',
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter your email',
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
    ] as FormField[],
    onSubmit: (data) => {
      console.log('Subscription email:', data.email);
    },
  },
};