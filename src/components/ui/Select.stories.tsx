import type { Meta, StoryObj } from '@storybook/nextjs';
import { Select } from './Select';
import { Label } from './Label';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    options: [
      { value: '', label: 'Select an option' },
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' }
    ],
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="small">Small Select</Label>
        <Select 
          id="small" 
          size="sm"
          options={[
            { value: 'small', label: 'Small size' },
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="medium">Medium Select (Default)</Label>
        <Select 
          id="medium" 
          size="md"
          options={[
            { value: 'medium', label: 'Medium size' },
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="large">Large Select</Label>
        <Select 
          id="large" 
          size="lg"
          options={[
            { value: 'large', label: 'Large size' },
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]}
        />
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="country" required>Country</Label>
      <Select 
        id="country"
        options={[
          { value: '', label: 'Select your country' },
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'mx', label: 'Mexico' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'au', label: 'Australia' }
        ]}
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div className="space-y-2">
        <Label htmlFor="normal">Normal State</Label>
        <Select 
          id="normal"
          options={[
            { value: '', label: 'Select an option' },
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled">Disabled State</Label>
        <Select 
          id="disabled" 
          disabled
          options={[
            { value: '', label: 'Disabled select' }
          ]}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="error">Error State</Label>
        <Select 
          id="error" 
          error
          options={[
            { value: '', label: 'Please select' },
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]}
        />
        <p className="text-sm text-danger">Please select an option</p>
      </div>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="grouped">Categories</Label>
      <Select 
        id="grouped"
        options={[
          { value: '', label: 'Select a category' },
          { value: 'computers', label: 'Technology - Computers' },
          { value: 'phones', label: 'Technology - Phones' },
          { value: 'tablets', label: 'Technology - Tablets' },
          { value: 'movies', label: 'Entertainment - Movies' },
          { value: 'music', label: 'Entertainment - Music' },
          { value: 'games', label: 'Entertainment - Games' },
          { value: 'football', label: 'Sports - Football' },
          { value: 'basketball', label: 'Sports - Basketball' },
          { value: 'tennis', label: 'Sports - Tennis' }
        ]}
      />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="controlled">Favorite Color</Label>
          <Select
            id="controlled"
            value={value}
            onChange={(value) => setValue(value)}
            options={[
              { value: '', label: 'Choose a color' },
              { value: 'red', label: 'Red' },
              { value: 'green', label: 'Green' },
              { value: 'blue', label: 'Blue' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'purple', label: 'Purple' }
            ]}
          />
        </div>
        {value && (
          <p className="text-sm text-muted-foreground">
            You selected: <span className="font-medium">{value}</span>
          </p>
        )}
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      title: '',
      department: '',
      location: '',
    });
    
    return (
      <form className="space-y-4 w-96">
        <div className="space-y-2">
          <Label htmlFor="title" required>Job Title</Label>
          <Select
            id="title"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            options={[
              { value: '', label: 'Select a position' },
              { value: 'developer', label: 'Software Developer' },
              { value: 'designer', label: 'UI/UX Designer' },
              { value: 'manager', label: 'Product Manager' },
              { value: 'analyst', label: 'Business Analyst' }
            ]}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department" required>Department</Label>
          <Select
            id="department"
            value={formData.department}
            onChange={(value) => setFormData({ ...formData, department: value })}
            options={[
              { value: '', label: 'Choose department' },
              { value: 'engineering', label: 'Engineering' },
              { value: 'design', label: 'Design' },
              { value: 'product', label: 'Product' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'sales', label: 'Sales' }
            ]}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location" optional>Location</Label>
          <Select
            id="location"
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            options={[
              { value: '', label: 'Any location' },
              { value: 'remote', label: 'Remote' },
              { value: 'nyc', label: 'New York City' },
              { value: 'sf', label: 'San Francisco' },
              { value: 'london', label: 'London' },
              { value: 'berlin', label: 'Berlin' }
            ]}
          />
        </div>
      </form>
    );
  },
};

export const Multiple: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="multiple">Select Framework</Label>
      <Select 
        id="multiple"
        options={[
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue' },
          { value: 'angular', label: 'Angular' },
          { value: 'svelte', label: 'Svelte' },
          { value: 'solid', label: 'Solid' },
          { value: 'qwik', label: 'Qwik' }
        ]}
      />
      <p className="text-sm text-muted-foreground">
        Choose your preferred frontend framework
      </p>
    </div>
  ),
};