import type { Meta, StoryObj } from '@storybook/nextjs';
import { Label } from './Label';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import React from 'react';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Label text',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="Enter your email" />
    </div>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here" />
    </div>
  ),
};

export const WithSelect: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="country">Country</Label>
      <Select 
        id="country"
        placeholder="Select a country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'mx', label: 'Mexico' }
        ]}
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" required>
          Full Name
        </Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio" required>
          Bio
        </Label>
        <Textarea id="bio" placeholder="Tell us about yourself" />
      </div>
    </div>
  ),
};

export const Optional: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nickname" optional>
          Nickname
        </Label>
        <Input id="nickname" placeholder="Optional field" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone" optional>
          Phone Number
        </Label>
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled-input">
        Disabled Label
      </Label>
      <Input id="disabled-input" disabled placeholder="This field is disabled" />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Enter a secure password" />
        <p className="text-sm text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username" required>Username</Label>
        <Input id="username" placeholder="Choose a username" />
        <p className="text-sm text-muted-foreground">
          This will be your public display name
        </p>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-6 w-96">
      <div className="space-y-2">
        <Label htmlFor="form-email" required>
          Email
        </Label>
        <Input id="form-email" type="email" placeholder="email@example.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="form-subject">
          Subject
        </Label>
        <Input id="form-subject" placeholder="What is this about?" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="form-message" required>
          Message
        </Label>
        <Textarea id="form-message" placeholder="Your message here..." rows={4} />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="form-priority" optional>
          Priority
        </Label>
        <Select 
          id="form-priority"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ]}
        />
      </div>
    </form>
  ),
};