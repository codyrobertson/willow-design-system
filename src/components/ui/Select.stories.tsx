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
    children: (
      <>
        <option value="">Select an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </>
    ),
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="small">Small Select</Label>
        <Select id="small" size="sm">
          <option>Small size</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="medium">Medium Select (Default)</Label>
        <Select id="medium" size="md">
          <option>Medium size</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="large">Large Select</Label>
        <Select id="large" size="lg">
          <option>Large size</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </Select>
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="country" required>Country</Label>
      <Select id="country">
        <option value="">Select your country</option>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="mx">Mexico</option>
        <option value="uk">United Kingdom</option>
        <option value="au">Australia</option>
      </Select>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div className="space-y-2">
        <Label htmlFor="normal">Normal State</Label>
        <Select id="normal">
          <option>Select an option</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled">Disabled State</Label>
        <Select id="disabled" disabled>
          <option>Disabled select</option>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="error">Error State</Label>
        <Select id="error" error>
          <option value="">Please select</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </Select>
        <p className="text-sm text-danger">Please select an option</p>
      </div>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="grouped">Categories</Label>
      <Select id="grouped">
        <option value="">Select a category</option>
        <optgroup label="Technology">
          <option value="computers">Computers</option>
          <option value="phones">Phones</option>
          <option value="tablets">Tablets</option>
        </optgroup>
        <optgroup label="Entertainment">
          <option value="movies">Movies</option>
          <option value="music">Music</option>
          <option value="games">Games</option>
        </optgroup>
        <optgroup label="Sports">
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
          <option value="tennis">Tennis</option>
        </optgroup>
      </Select>
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
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">Choose a color</option>
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
            <option value="purple">Purple</option>
          </Select>
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
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          >
            <option value="">Select a position</option>
            <option value="developer">Software Developer</option>
            <option value="designer">UI/UX Designer</option>
            <option value="manager">Product Manager</option>
            <option value="analyst">Business Analyst</option>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department" required>Department</Label>
          <Select
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          >
            <option value="">Choose department</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="product">Product</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location" optional>Location</Label>
          <Select
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          >
            <option value="">Any location</option>
            <option value="remote">Remote</option>
            <option value="nyc">New York City</option>
            <option value="sf">San Francisco</option>
            <option value="london">London</option>
            <option value="berlin">Berlin</option>
          </Select>
        </div>
      </form>
    );
  },
};

export const Multiple: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="multiple">Select Multiple Options</Label>
      <Select id="multiple" multiple size={5}>
        <option value="react">React</option>
        <option value="vue">Vue</option>
        <option value="angular">Angular</option>
        <option value="svelte">Svelte</option>
        <option value="solid">Solid</option>
        <option value="qwik">Qwik</option>
      </Select>
      <p className="text-sm text-muted-foreground">
        Hold Ctrl/Cmd to select multiple options
      </p>
    </div>
  ),
};