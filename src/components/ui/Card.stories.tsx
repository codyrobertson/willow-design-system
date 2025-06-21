import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'
import { FancyButton } from './FancyButton'
import { Button } from './Button'
import { Rocket, Check, CheckCircle, AlertTriangle, ArrowUp, ChartLine, Palette, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Card component is a versatile container for grouping related content and actions. It provides several visual variants and supports flexible content alignment.

## Features
- **5 Visual Variants**: default, raised, flat, outlined, and elevated
- **Colored Headers**: 6 color themes for header backgrounds
- **Flexible Alignment**: Control text alignment in headers and footers
- **Composable Structure**: Mix and match Card sub-components
- **Padding Options**: none, sm, md, lg for flexible spacing
- **Accessible**: Automatic ARIA labeling and semantic HTML

## Components
- **Card**: Main container with variants and padding
- **CardHeader**: Header section with alignment and color options  
- **CardTitle**: Main heading with automatic accessibility
- **CardDescription**: Supplementary text for context
- **CardContent**: Main content area with consistent spacing
- **CardFooter**: Action area with alignment options

## Best Practices
- Use colored headers sparingly for important states
- Choose variants based on visual hierarchy needs
- Keep card content focused and concise
- Use consistent alignment within card groups
- Consider mobile responsiveness in card layouts

## Examples
\`\`\`tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Welcome</CardTitle>
    <CardDescription>Get started with our platform</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
  <CardFooter>
    <Button>Learn More</Button>
  </CardFooter>
</Card>

// Colored header card
<Card>
  <CardHeader color="primary" variant="colored">
    <CardTitle>Premium Feature</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Upgrade to access this feature</p>
  </CardContent>
</Card>
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'raised', 'flat', 'outlined', 'elevated'],
      description: 'Visual style variant of the card',
      table: {
        type: { summary: 'default | raised | flat | outlined | elevated' },
        defaultValue: { summary: 'default' }
      }
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Padding size for the card container',
      table: {
        type: { summary: 'none | sm | md | lg' },
        defaultValue: { summary: 'none' }
      }
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// Basic Examples
export const Default: Story = {
  args: {
    variant: 'default',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Default Card</CardTitle>
        <CardDescription>This is the default card style with subtle shadows</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The default card variant provides a balanced visual hierarchy with our standard shadow system.
        </p>
      </CardContent>
      <CardFooter>
        <FancyButton size="sm" onClick={() => console.log('button-clicked')}>Learn More</FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const Playground: Story = {
  name: '🎮 Interactive Playground',
  args: {
    variant: 'default',
    padding: 'none',
    className: 'w-[400px]'
  },
  argTypes: {
    variant: { control: 'select' },
    padding: { control: 'select' },
  },
  render: (args) => {
    const [clickCount, setClickCount] = React.useState(0);
    const [headerColor, setHeaderColor] = React.useState<'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'>('neutral');
    const [headerAlign, setHeaderAlign] = React.useState<'left' | 'center' | 'right'>('center');
    const [footerAlign, setFooterAlign] = React.useState<'left' | 'center' | 'right' | 'between'>('right');
    const [showDescription, setShowDescription] = React.useState(true);
    
    return (
      <div className="space-y-6">
        <Card {...args}>
          <CardHeader 
            align={headerAlign} 
            color={headerColor}
            variant={headerColor !== 'neutral' ? 'colored' : 'default'}
          >
            <CardTitle>Interactive Card</CardTitle>
            {showDescription && (
              <CardDescription>
                Experiment with different card configurations
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This is an interactive card demo. Use the controls below to modify the card appearance in real-time.
            </p>
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
              <p className="text-2xl font-normal">{clickCount}</p>
            </div>
          </CardContent>
          <CardFooter align={footerAlign}>
            {footerAlign === 'between' ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setClickCount(0);
                    console.log('reset-clicked');
                  }}
                >
                  Reset
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    setClickCount(prev => prev + 1);
                    console.log('increment-clicked');
                  }}
                >
                  Increment
                </Button>
              </>
            ) : (
              <Button 
                size="sm"
                onClick={() => {
                  setClickCount(prev => prev + 1);
                  console.log('button-clicked');
                }}
              >
                Click Me ({clickCount})
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <div className="p-4 bg-gray-50 rounded space-y-4">
          <h3 className="font-semibold text-sm">Interactive Controls</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1">Header Color</label>
              <select 
                className="w-full px-2 py-1 text-sm border rounded"
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value as any)}
              >
                <option value="neutral">Neutral</option>
                <option value="primary">Primary</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium block mb-1">Header Align</label>
              <select 
                className="w-full px-2 py-1 text-sm border rounded"
                value={headerAlign}
                onChange={(e) => setHeaderAlign(e.target.value as any)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium block mb-1">Footer Align</label>
              <select 
                className="w-full px-2 py-1 text-sm border rounded"
                value={footerAlign}
                onChange={(e) => setFooterAlign(e.target.value as any)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="between">Between</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium block mb-1">Description</label>
              <button
                className="w-full px-2 py-1 text-sm border rounded bg-white"
                onClick={() => setShowDescription(!showDescription)}
              >
                {showDescription ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
}

export const Raised: Story = {
  args: {
    variant: 'raised',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Raised Card</CardTitle>
        <CardDescription>Elevated appearance for emphasis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The raised variant creates a stronger visual emphasis with enhanced shadows.
        </p>
      </CardContent>
      <CardFooter>
        <FancyButton size="sm">Action</FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const Flat: Story = {
  args: {
    variant: 'flat',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Flat Card</CardTitle>
        <CardDescription>Minimal style with no shadows</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The flat variant removes all shadows for a clean, minimal appearance.
        </p>
      </CardContent>
      <CardFooter>
        <FancyButton variant="secondary" size="sm">View Details</FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Outlined Card</CardTitle>
        <CardDescription>Prominent border style</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The outlined variant uses a stronger border for clear separation.
        </p>
      </CardContent>
      <CardFooter>
        <FancyButton variant="secondary" size="sm">Explore</FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>Maximum elevation for important content</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The elevated variant provides the highest visual prominence with strong shadows.
        </p>
      </CardContent>
      <CardFooter>
        <FancyButton size="sm">Get Started</FancyButton>
      </CardFooter>
    </Card>
  ),
}

// Alignment Examples
export const LeftAligned: Story = {
  name: 'Left Aligned Content',
  args: {
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader align="left">
        <CardTitle>Left Aligned</CardTitle>
        <CardDescription>Content aligned to the left</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This card demonstrates left-aligned header content, which is ideal for most reading contexts.
        </p>
      </CardContent>
      <CardFooter align="left">
        <FancyButton size="sm" className="mr-2">Cancel</FancyButton>
        <FancyButton size="sm">Confirm</FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const CenterAligned: Story = {
  name: 'Center Aligned Content',
  args: {
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader align="center">
        <CardTitle>Center Aligned</CardTitle>
        <CardDescription>Perfect for feature highlights</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">
          Center alignment works well for feature cards and promotional content.
        </p>
      </CardContent>
      <CardFooter align="center">
        <FancyButton size="sm">Get Started</FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const RightAligned: Story = {
  name: 'Right Aligned Content',
  args: {
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader align="right">
        <CardTitle>Right Aligned</CardTitle>
        <CardDescription>Content aligned to the right</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-right text-sm text-muted-foreground">
          Right alignment can be used for RTL languages or specific design needs.
        </p>
      </CardContent>
      <CardFooter align="right">
        <FancyButton size="sm">Next</FancyButton>
      </CardFooter>
    </Card>
  ),
}

// Complex Examples
export const FeatureCard: Story = {
  name: 'Feature Card',
  args: {
    variant: 'raised',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader align="center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Rocket className="text-primary h-6 w-6" />
        </div>
        <CardTitle>Launch Faster</CardTitle>
        <CardDescription>Get your project up and running in minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <Check className="text-success h-3 w-3" />
            <span>Pre-configured components</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="text-success h-3 w-3" />
            <span>TypeScript support</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="text-success h-3 w-3" />
            <span>Responsive design</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter align="center">
        <FancyButton size="sm" className="w-full">Start Building</FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const PricingCard: Story = {
  name: 'Pricing Card',
  args: {
    variant: 'elevated',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader align="center">
        <CardTitle className="text-2xl">Pro Plan</CardTitle>
        <CardDescription>Everything you need to grow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <span className="text-4xl font-normal">$29</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <CheckCircle className="text-success h-4 w-4" />
            <span className="text-sm">Unlimited projects</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="text-success h-4 w-4" />
            <span className="text-sm">Advanced analytics</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="text-success h-4 w-4" />
            <span className="text-sm">Priority support</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="text-success h-4 w-4" />
            <span className="text-sm">Custom integrations</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter align="center">
        <FancyButton size="md" className="w-full">
          Start Free Trial
        </FancyButton>
      </CardFooter>
    </Card>
  ),
}

export const NotificationCard: Story = {
  name: 'Notification Card',
  args: {
    variant: 'outlined',
    className: 'w-[400px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader align="left">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-warning h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Action Required</CardTitle>
            <CardDescription>Please review and update your billing information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your payment method will expire soon. Update it to avoid any service interruptions.
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-between">
          <FancyButton variant="secondary" size="sm">Remind Later</FancyButton>
          <FancyButton variant="danger" size="sm">Update Now</FancyButton>
        </div>
      </CardFooter>
    </Card>
  ),
}

export const StatsCard: Story = {
  name: 'Stats Card',
  args: {
    variant: 'flat',
    padding: 'lg',
    className: 'w-[300px]'
  },
  render: (args) => (
    <Card {...args}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-3xl font-normal">$54,239</p>
          <p className="text-sm text-success mt-2 flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            12.5% from last month
          </p>
        </div>
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <ChartLine className="text-primary h-8 w-8" />
        </div>
      </div>
    </Card>
  ),
}

export const SimpleCard: Story = {
  name: 'Simple Card',
  args: {
    padding: 'md',
    className: 'w-[350px]'
  },
  render: (args) => (
    <Card {...args}>
      <h3 className="font-normal mb-2">Quick Note</h3>
      <p className="text-sm text-muted-foreground">
        Sometimes you just need a simple card with padding. Use the padding prop to add consistent spacing.
      </p>
    </Card>
  ),
}

export const GridExample: Story = {
  name: 'Card Grid',
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
      <Card variant="default">
        <CardHeader align="center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="text-blue-600 h-6 w-6" />
          </div>
          <CardTitle>Design System</CardTitle>
          <CardDescription>Consistent and beautiful UI</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Pre-built components following design best practices.
          </p>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardHeader align="center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-green-600 h-6 w-6" />
          </div>
          <CardTitle>Type Safe</CardTitle>
          <CardDescription>Built with TypeScript</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Full TypeScript support with proper type definitions.
          </p>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardHeader align="center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-purple-600 h-6 w-6" />
          </div>
          <CardTitle>Modern Stack</CardTitle>
          <CardDescription>Latest technologies</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Built with React, Tailwind CSS, and modern tools.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
}

export const InteractiveExample: Story = {
  name: 'Interactive Card',
  args: {
    variant: 'default',
    className: 'w-[350px] cursor-pointer transition-all hover:shadow-xl'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader align="left">
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover to see the effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Cards can be made interactive with hover states and transitions. Try hovering over this card.
        </p>
      </CardContent>
      <CardFooter align="right">
        <ArrowRight className="text-muted-foreground h-4 w-4" />
      </CardFooter>
    </Card>
  ),
}

// Colored Header Examples
export const ColoredHeaderNeutral: Story = {
  name: 'Colored Header - Neutral',
  args: {
    className: 'w-[340px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader color="neutral">
        <CardTitle>Grade 3 Concussion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <h3 className="text-2xl font-medium text-neutral-950 mb-4">Marissa&apos;s Aftercare Plan</h3>
          <div className="flex gap-2">
            <FancyButton size="sm" className="flex-1">
              Discuss Plan With Willow
            </FancyButton>
            <FancyButton variant="secondary" size="sm" className="flex-1">
              Your Progress
            </FancyButton>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
}

export const ColoredHeaderPrimary: Story = {
  name: 'Colored Header - Primary',
  args: {
    className: 'w-[340px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader color="primary">
        <CardTitle>Premium Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Access advanced features with our premium plan.
        </p>
        <FancyButton size="sm" className="w-full">
          Upgrade Now
        </FancyButton>
      </CardContent>
    </Card>
  ),
}

export const ColoredHeaderSuccess: Story = {
  name: 'Colored Header - Success',
  args: {
    className: 'w-[340px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader color="success">
        <CardTitle>Task Completed</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Great job! You&apos;ve successfully completed all your tasks.
        </p>
        <div className="flex gap-2">
          <FancyButton variant="secondary" size="sm">
            View Report
          </FancyButton>
          <FancyButton size="sm">
            Next Task
          </FancyButton>
        </div>
      </CardContent>
    </Card>
  ),
}

export const ColoredHeaderWarning: Story = {
  name: 'Colored Header - Warning',
  args: {
    className: 'w-[340px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader color="warning">
        <CardTitle>Attention Required</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Your subscription will expire in 7 days. Please renew to continue.
        </p>
        <FancyButton variant="warning" size="sm" className="w-full">
          Renew Subscription
        </FancyButton>
      </CardContent>
    </Card>
  ),
}

export const ColoredHeaderDanger: Story = {
  name: 'Colored Header - Danger',
  args: {
    className: 'w-[340px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader color="danger">
        <CardTitle>Critical Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          System error detected. Immediate action required.
        </p>
        <FancyButton variant="danger" size="sm" className="w-full">
          Fix Now
        </FancyButton>
      </CardContent>
    </Card>
  ),
}

export const ColoredHeaderInfo: Story = {
  name: 'Colored Header - Info',
  args: {
    className: 'w-[340px]'
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader color="info">
        <CardTitle>New Update Available</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Version 2.5.0 is now available with new features and improvements.
        </p>
        <div className="flex gap-2">
          <FancyButton variant="secondary" size="sm">
            Later
          </FancyButton>
          <FancyButton size="sm">
            Update Now
          </FancyButton>
        </div>
      </CardContent>
    </Card>
  ),
}

export const ColoredHeaderGrid: Story = {
  name: 'Colored Headers Grid',
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <Card>
        <CardHeader color="primary">
          <CardTitle>Primary Color</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use for brand-related or primary actions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader color="success">
          <CardTitle>Success Color</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Perfect for positive outcomes and confirmations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader color="warning">
          <CardTitle>Warning Color</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use to draw attention to important information.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader color="danger">
          <CardTitle>Danger Color</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Reserved for errors and critical actions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader color="info">
          <CardTitle>Info Color</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ideal for informational messages and updates.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader color="neutral">
          <CardTitle>Neutral Color</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Default option for general content.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
}