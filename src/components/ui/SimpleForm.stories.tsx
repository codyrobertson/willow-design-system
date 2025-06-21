import type { Meta, StoryObj } from '@storybook/nextjs';
import { SimpleForm } from './SimpleForm';
import { FormCard } from './FormCard.refactored';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './Card';
import { User, Mail, Lock, Phone, MessageSquare } from 'lucide-react';
import { Icon } from './icon';

const meta = {
  title: 'UI/Forms/SimpleForm',
  component: SimpleForm,
  parameters: {
    layout: 'centered',
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
export const FormCardBasic: Story = {
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
export const FormCardMultiStep: Story = {
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
export const CustomComposition: Story = {
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