import type { Meta, StoryObj } from '@storybook/nextjs';
import { Textarea } from './Textarea';
import { Label } from './Label';
import React, { useState } from 'react';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
    rows: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message here...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-96">
      <Label htmlFor="message" required>Message</Label>
      <Textarea 
        id="message" 
        placeholder="Type your message here..."
        rows={4}
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div className="space-y-2">
        <Label htmlFor="small">Small (3 rows)</Label>
        <Textarea 
          id="small" 
          placeholder="Small textarea"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="medium">Medium (5 rows)</Label>
        <Textarea 
          id="medium" 
          placeholder="Medium textarea"
          rows={5}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="large">Large (8 rows)</Label>
        <Textarea 
          id="large" 
          placeholder="Large textarea"
          rows={8}
        />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div className="space-y-2">
        <Label htmlFor="normal">Normal State</Label>
        <Textarea 
          id="normal" 
          placeholder="Normal textarea"
          defaultValue="This is a normal textarea"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled">Disabled State</Label>
        <Textarea 
          id="disabled" 
          placeholder="Disabled textarea"
          disabled
          defaultValue="This textarea is disabled"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="error">Error State</Label>
        <Textarea 
          id="error" 
          placeholder="Error textarea"
          error
          defaultValue="This field has an error"
        />
        <p className="text-sm text-danger">Please enter a valid message</p>
      </div>
    </div>
  ),
};

export const WithCharacterCount: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const maxLength = 500;
    
    return (
      <div className="space-y-2 w-96">
        <div className="flex justify-between items-end">
          <Label htmlFor="limited" required>Bio</Label>
          <span className="text-sm text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        </div>
        <Textarea
          id="limited"
          placeholder="Tell us about yourself..."
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
          rows={4}
        />
      </div>
    );
  },
};

export const AutoResize: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    return (
      <div className="space-y-2 w-96">
        <Label htmlFor="auto">Auto-resize Example</Label>
        <Textarea
          id="auto"
          placeholder="This textarea will grow as you type..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            minHeight: '80px',
            height: value ? `${Math.min(value.split('\n').length * 24 + 32, 300)}px` : '80px',
            transition: 'height 0.1s ease-out'
          }}
        />
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      description: '',
      notes: '',
      feedback: '',
    });
    
    return (
      <form className="space-y-6 w-96">
        <div className="space-y-2">
          <Label htmlFor="description" required>
            Project Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your project in detail..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes" optional>
            Additional Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Any additional information..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="feedback">
            Feedback
          </Label>
          <Textarea
            id="feedback"
            placeholder="Share your thoughts..."
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            rows={5}
          />
          <p className="text-sm text-muted-foreground">
            Your feedback helps us improve our service
          </p>
        </div>
      </form>
    );
  },
};

export const WithHints: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Enter step-by-step instructions..."
          rows={4}
        />
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use clear, concise language</li>
          <li>• Number each step</li>
          <li>• Include any warnings or tips</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="code">Code Snippet</Label>
        <Textarea
          id="code"
          placeholder="Paste your code here..."
          rows={6}
          className="font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">
          Supports JavaScript, TypeScript, Python, and more
        </p>
      </div>
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="space-y-2 w-96">
      <Label htmlFor="readonly">License Agreement</Label>
      <Textarea
        id="readonly"
        readOnly
        rows={6}
        defaultValue="This is a read-only textarea containing important information.

By using this software, you agree to the terms and conditions outlined in this agreement. This license grants you the right to use the software for personal and commercial purposes.

You may not redistribute, modify, or reverse engineer the software without explicit permission from the copyright holder."
      />
    </div>
  ),
};