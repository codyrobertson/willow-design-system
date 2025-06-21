import type { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from './Input';
import { Label } from './Label';
import { FormField } from './FormField';
import { Search, Mail, Lock, User, Calendar, CreditCard } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Forms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time'],
    },
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <FormField label="Text Input">
        <Input type="text" placeholder="Enter text" />
      </FormField>
      
      <FormField label="Email Input">
        <Input type="email" placeholder="you@example.com" />
      </FormField>
      
      <FormField label="Password Input">
        <Input type="password" placeholder="••••••••" />
      </FormField>
      
      <FormField label="Number Input">
        <Input type="number" placeholder="123" />
      </FormField>
      
      <FormField label="Date Input">
        <Input type="date" />
      </FormField>
      
      <FormField label="Search Input">
        <Input type="search" placeholder="Search..." />
      </FormField>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <FormField label="Email">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" type="email" placeholder="you@example.com" />
        </div>
      </FormField>
      
      <FormField label="Password">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" type="password" placeholder="••••••••" />
        </div>
      </FormField>
      
      <FormField label="Search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" type="search" placeholder="Search..." />
        </div>
      </FormField>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <FormField label="Default">
        <Input placeholder="Default input" />
      </FormField>
      
      <FormField label="Focused" hint="This input is focused by default">
        <Input placeholder="Focused input" autoFocus />
      </FormField>
      
      <FormField label="Disabled">
        <Input placeholder="Disabled input" disabled />
      </FormField>
      
      <FormField label="Read Only">
        <Input value="Read only value" readOnly />
      </FormField>
      
      <FormField label="With Error" error="This field is required">
        <Input placeholder="Error state" error />
      </FormField>
    </div>
  ),
};

export const Validation: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <FormField label="Required Field" required>
        <Input placeholder="This field is required" required />
      </FormField>
      
      <FormField label="Email Validation" error="Please enter a valid email">
        <Input 
          type="email" 
          placeholder="you@example.com" 
          defaultValue="invalid-email"
          error
        />
      </FormField>
      
      <FormField label="Min/Max Length" hint="Between 3 and 10 characters">
        <Input 
          placeholder="3-10 characters" 
          minLength={3}
          maxLength={10}
        />
      </FormField>
      
      <FormField label="Pattern Validation" hint="Only letters allowed">
        <Input 
          placeholder="Letters only" 
          pattern="[A-Za-z]+"
          title="Please enter only letters"
        />
      </FormField>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <FormField label="Small Input">
        <Input size="sm" placeholder="Small size" />
      </FormField>
      
      <FormField label="Medium Input (Default)">
        <Input size="md" placeholder="Medium size" />
      </FormField>
      
      <FormField label="Large Input">
        <Input size="lg" placeholder="Large size" />
      </FormField>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <FormField label="Default Variant">
        <Input placeholder="Default input" />
      </FormField>
      
      <FormField label="Error Variant" error="This field has an error">
        <Input variant="error" placeholder="Error input" />
      </FormField>
      
      <FormField label="Success Variant">
        <Input variant="success" placeholder="Success input" defaultValue="Valid input" />
      </FormField>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <FormField label="Custom Border">
        <Input 
          className="border-2 border-purple-500 focus-visible:ring-purple-500" 
          placeholder="Purple border"
        />
      </FormField>
      
      <FormField label="Rounded Full">
        <Input 
          className="rounded-full" 
          placeholder="Fully rounded"
        />
      </FormField>
      
      <FormField label="No Border">
        <Input 
          className="border-0 border-b rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-2" 
          placeholder="Underline only"
        />
      </FormField>
      
      <FormField label="Background Color">
        <Input 
          className="bg-gray-100 border-gray-300" 
          placeholder="Gray background"
        />
      </FormField>
    </div>
  ),
};