import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { InfoCard, AlertBanner } from './InfoCard'
import { Card } from './Card'
import { Info, AlertTriangle, CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react'

const meta = {
  title: 'UI/InfoCard',
  component: InfoCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The InfoCard and AlertBanner components provide flexible ways to display informational messages, warnings, and alerts.

## Components
- **InfoCard**: Small inline cards for contextual information
- **AlertBanner**: Full-width banners for prominent alerts

## Features
- Multiple variants (info, success, warning, danger)
- Size options (sm, md, lg)
- Optional icons
- Flexible content
- Proper color contrast and accessibility

## Usage
\`\`\`tsx
// Simple info card
<InfoCard variant="info">
  Important information here
</InfoCard>

// With custom icon
<InfoCard variant="warning" icon={<AlertTriangle />}>
  Warning message
</InfoCard>

// Alert banner
<AlertBanner variant="danger">
  Critical alert message
</AlertBanner>
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
      description: 'Visual variant of the card',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the card',
    },
    icon: {
      control: false,
      description: 'Optional icon to display',
    },
  },
} satisfies Meta<typeof InfoCard>

export default meta
type Story = StoryObj<typeof meta>

// Basic Examples
export const Default: Story = {
  args: {
    children: 'This is an informational message',
    variant: 'info',
    size: 'md',
  },
}

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div className="space-y-4 w-[400px]">
      <InfoCard variant="info">
        Info: General information or tips
      </InfoCard>
      <InfoCard variant="success">
        Success: Operation completed successfully
      </InfoCard>
      <InfoCard variant="warning">
        Warning: Please review this information
      </InfoCard>
      <InfoCard variant="danger">
        Danger: Critical information requiring attention
      </InfoCard>
    </div>
  ),
}

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <div className="space-y-4 w-[400px]">
      <InfoCard variant="info" icon={<Info />}>
        General information with icon
      </InfoCard>
      <InfoCard variant="success" icon={<CheckCircle />}>
        Success message with checkmark
      </InfoCard>
      <InfoCard variant="warning" icon={<AlertTriangle />}>
        Warning message with alert icon
      </InfoCard>
      <InfoCard variant="danger" icon={<XCircle />}>
        Error message with X icon
      </InfoCard>
    </div>
  ),
}

export const Sizes: Story = {
  name: 'Size Variants',
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <InfoCard variant="info" size="sm">
          Small info card with less padding
        </InfoCard>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <InfoCard variant="info" size="md">
          Medium info card with standard padding
        </InfoCard>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <InfoCard variant="info" size="lg">
          Large info card with more padding
        </InfoCard>
      </div>
    </div>
  ),
}

export const ComplexContent: Story = {
  name: 'Complex Content',
  render: () => (
    <div className="space-y-4 w-[400px]">
      <InfoCard variant="info" icon={<Info />}>
        <strong>Note:</strong> You can include <em>formatted text</em> and even{' '}
        <a href="#" className="underline">links</a> in info cards.
      </InfoCard>
      
      <InfoCard variant="warning">
        <div className="space-y-1">
          <div className="font-semibold">Multiple lines of content</div>
          <div className="text-sm">Info cards can contain multiple paragraphs and complex layouts.</div>
          <div className="text-sm">Just pass any React nodes as children.</div>
        </div>
      </InfoCard>
    </div>
  ),
}

// Alert Banner Examples
export const AlertBanners: Story = {
  name: 'Alert Banners',
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <AlertBanner variant="info">
        Info: System maintenance scheduled for tonight at 10 PM EST
      </AlertBanner>
      
      <AlertBanner variant="success">
        Success: Your changes have been saved successfully
      </AlertBanner>
      
      <AlertBanner variant="warning">
        Warning: Your session will expire in 5 minutes
      </AlertBanner>
      
      <AlertBanner variant="danger">
        Danger: Critical system error - please contact support
      </AlertBanner>
    </div>
  ),
}

export const AlertBannerSizes: Story = {
  name: 'Alert Banner Sizes',
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <AlertBanner variant="info" size="sm">
        Small alert banner
      </AlertBanner>
      
      <AlertBanner variant="info" size="md">
        Medium alert banner (default)
      </AlertBanner>
      
      <AlertBanner variant="info" size="lg">
        Large alert banner
      </AlertBanner>
    </div>
  ),
}

export const RealWorldExamples: Story = {
  name: 'Real World Examples',
  render: () => (
    <div className="space-y-6 w-full max-w-2xl">
      <Card>
        <div className="p-4 space-y-3">
          <h3 className="font-semibold">Medication Instructions</h3>
          <InfoCard variant="warning" icon={<AlertTriangle />} size="sm">
            Take with food to avoid stomach upset
          </InfoCard>
          <InfoCard variant="info" icon={<Info />} size="sm">
            Store at room temperature away from moisture
          </InfoCard>
        </div>
      </Card>
      
      <Card>
        <AlertBanner variant="danger" size="sm">
          Call 911 if experiencing severe symptoms
        </AlertBanner>
        <div className="p-4">
          <h3 className="font-semibold mb-3">Emergency Symptoms</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Severe headache</li>
            <li>Difficulty breathing</li>
            <li>Chest pain</li>
          </ul>
        </div>
      </Card>
      
      <Card>
        <div className="p-4 space-y-3">
          <h3 className="font-semibold">Activity Restrictions</h3>
          <InfoCard variant="success" icon={<CheckCircle />} size="sm">
            Light walking allowed after 24 hours
          </InfoCard>
          <InfoCard variant="danger" icon={<XCircle />} size="sm">
            No heavy lifting for 2 weeks
          </InfoCard>
          <InfoCard variant="warning" icon={<AlertCircle />} size="sm">
            Avoid driving until cleared by doctor
          </InfoCard>
        </div>
      </Card>
    </div>
  ),
}

export const NestedInComponents: Story = {
  name: 'Nested Usage',
  render: () => (
    <div className="space-y-4 w-[400px]">
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-3">Form with validation</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border rounded" 
                placeholder="Enter email"
              />
            </div>
            <InfoCard variant="danger" size="sm">
              Please enter a valid email address
            </InfoCard>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-3">Help Section</h3>
          <InfoCard variant="info" icon={<HelpCircle />} size="md">
            <div>
              <div className="font-medium mb-1">Need help?</div>
              <div className="text-sm">
                Contact support at support@example.com or call 1-800-HELP
              </div>
            </div>
          </InfoCard>
        </div>
      </Card>
    </div>
  ),
}