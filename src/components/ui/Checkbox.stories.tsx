import type { Meta, StoryObj } from '@storybook/nextjs';
import { Checkbox } from './Checkbox';
import { FormField } from './FormField';
import { Label } from './Label';
import * as React from 'react';

const meta = {
  title: 'UI/Forms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    shape: {
      control: 'select',
      options: ['square', 'rounded', 'circle'],
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic checkbox
export const Basic: Story = {
  args: {
    'aria-label': 'Basic checkbox',
  },
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

// Variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="default" variant="default" defaultChecked />
        <Label htmlFor="default">Default variant</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="secondary" variant="secondary" defaultChecked />
        <Label htmlFor="secondary">Secondary variant</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="destructive" variant="destructive" defaultChecked />
        <Label htmlFor="destructive">Destructive variant</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="outline" variant="outline" defaultChecked />
        <Label htmlFor="outline">Outline variant</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="ghost" variant="ghost" defaultChecked />
        <Label htmlFor="ghost">Ghost variant</Label>
      </div>
    </div>
  ),
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="small" size="sm" defaultChecked />
        <Label htmlFor="small">Small</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="medium" size="md" defaultChecked />
        <Label htmlFor="medium">Medium</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="large" size="lg" defaultChecked />
        <Label htmlFor="large">Large</Label>
      </div>
    </div>
  ),
};

// Shapes
export const Shapes: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="square" shape="square" defaultChecked />
        <Label htmlFor="square">Square</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="rounded" shape="rounded" defaultChecked />
        <Label htmlFor="rounded">Rounded</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="circle" shape="circle" defaultChecked />
        <Label htmlFor="circle">Circle</Label>
      </div>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="unchecked" />
        <Label htmlFor="unchecked">Unchecked</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="checked" defaultChecked />
        <Label htmlFor="checked">Checked</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled" className="opacity-50">Disabled</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="opacity-50">Disabled checked</Label>
      </div>
    </div>
  ),
};

// Indeterminate state
export const Indeterminate: Story = {
  render: () => {
    const [checkedItems, setCheckedItems] = React.useState([true, false]);
    const allChecked = checkedItems.every(Boolean);
    const isIndeterminate = checkedItems.some(Boolean) && !allChecked;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={allChecked}
            indeterminate={isIndeterminate}
            onCheckedChange={(checked) => {
              setCheckedItems([checked === true, checked === true]);
            }}
          />
          <Label htmlFor="select-all" className="font-medium">Select all</Label>
        </div>
        <div className="ml-6 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="item-1"
              checked={checkedItems[0]}
              onCheckedChange={(checked) => {
                setCheckedItems([checked === true, checkedItems[1]]);
              }}
            />
            <Label htmlFor="item-1">Item 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="item-2"
              checked={checkedItems[1]}
              onCheckedChange={(checked) => {
                setCheckedItems([checkedItems[0], checked === true]);
              }}
            />
            <Label htmlFor="item-2">Item 2</Label>
          </div>
        </div>
      </div>
    );
  },
};

// With FormField
export const WithFormField: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <FormField label="Preferences" hint="Select your preferences">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="emails" />
            <Label htmlFor="emails" className="text-sm font-normal">Email notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="sms" />
            <Label htmlFor="sms" className="text-sm font-normal">SMS notifications</Label>
          </div>
        </div>
      </FormField>
      
      <FormField label="Agreement" error="You must accept the terms" required>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms-error" variant="destructive" />
          <Label htmlFor="terms-error" className="text-sm font-normal">
            I accept the terms and conditions
          </Label>
        </div>
      </FormField>
    </div>
  ),
};

// Complex example
export const ComplexExample: Story = {
  render: () => {
    const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>([]);
    
    const features = [
      { id: 'analytics', label: 'Advanced Analytics', description: 'Track user behavior' },
      { id: 'api', label: 'API Access', description: 'Integrate with your tools' },
      { id: 'support', label: 'Priority Support', description: '24/7 customer support' },
      { id: 'custom', label: 'Custom Branding', description: 'White-label solution' },
    ];

    return (
      <div className="w-96 space-y-4">
        <h3 className="text-lg font-semibold">Select Features</h3>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                id={feature.id}
                checked={selectedFeatures.includes(feature.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedFeatures([...selectedFeatures, feature.id]);
                  } else {
                    setSelectedFeatures(selectedFeatures.filter(id => id !== feature.id));
                  }
                }}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor={feature.id} className="text-sm font-medium cursor-pointer">
                  {feature.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>
    );
  },
};