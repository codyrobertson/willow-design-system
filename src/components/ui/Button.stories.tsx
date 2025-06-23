import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './Button';
import { Rocket, ArrowRight, Heart, Download, Trash, AlertTriangle, Settings, Plus, X, MoreVertical, Search, Filter, ChevronDown, ExternalLink, Info } from 'lucide-react';
import * as React from 'react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Button component is a flexible, accessible button with multiple themes, variants, and sizes.

## Features
- **7 Themes**: primary, danger, warning, info, success, dark, neutral
- **6 Variants**: default, secondary, outline, ghost, link, fancy
- **4 Sizes**: sm, md, lg, compact
- **8 Border Radius Options**: none through full
- **Icon Support**: Left and right icons with automatic sizing
- **Loading State**: Built-in loading spinner
- **Full Width Option**: Stretch to container width
- **Polymorphic**: Can be rendered as any element using asChild

## Accessibility
- Supports keyboard navigation
- Proper ARIA attributes
- Focus management
- Disabled state handling

## Best Practices
- Use primary theme for main actions
- Use danger theme for destructive actions
- Use outline variant for secondary actions
- Use ghost variant for tertiary actions
- Always provide accessible labels for icon-only buttons
        `
      }
    }
  },
  argTypes: {
    theme: {
      control: 'select',
      options: ['primary', 'danger', 'warning', 'info', 'dark', 'neutral', 'success'],
    },
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'link', 'fancy'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'compact'],
    },
    radius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    theme: 'primary',
    variant: 'default',
    size: 'md',
    children: 'Button',
    onClick: () => console.log('Button clicked'),
  },
};

export const Playground: Story = {
  name: '🎮 Interactive Playground',
  args: {
    theme: 'primary',
    variant: 'default',
    size: 'md',
    radius: 'md',
    children: 'Click me!',
    disabled: false,
    loading: false,
    fullWidth: false,
  },
  argTypes: {
    children: { control: 'text' },
    onClick: { action: 'clicked' },
  },
  render: (args) => {
    const [clickCount, setClickCount] = React.useState(0);
    
    return (
      <div className="space-y-4">
        <Button 
          {...args} 
          onClick={(e) => {
            setClickCount(prev => prev + 1);
            args.onClick?.(e);
          }}
        />
        <p className="text-sm text-gray-600">
          Button clicked {clickCount} times
        </p>
      </div>
    );
  },
};

export const WithIcons: Story = {
  args: {
    ...Default.args,
    leftIcon: <Rocket className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: 'Get Started',
  },
};

export const IconOnly: Story = {
  args: {
    ...Default.args,
    size: 'compact',
    leftIcon: <Heart className="h-4 w-4" />,
    children: undefined,
  },
};

export const AsChild: Story = {
    render: (args) => (
        <Button {...args} asChild>
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            I am a link
          </a>
        </Button>
      ),
      args: {
        ...Default.args
      }
  };
  

export const AllVariants: Story = {
    render: () => (
      <div className="flex flex-col gap-8 p-4 bg-gray-50">
        {(['primary', 'danger', 'warning', 'info', 'dark', 'neutral', 'success'] as const).map((theme) => (
          <div key={theme} className="flex flex-col gap-4">
            <h2 className="text-xl font-normal capitalize">{theme}</h2>
            <div className="flex flex-wrap items-center gap-4">
              {(['default', 'secondary', 'outline', 'ghost'] as const).map((variant) => (
                <Button key={variant} theme={theme} variant={variant}>
                  {variant}
                </Button>
              ))}
              <Button theme={theme} variant="default" loading>
                Loading
              </Button>
              <Button theme={theme} variant="default" disabled>
                Disabled
              </Button>
            </div>
          </div>
        ))}
      </div>
    ),
  };

export const RadiusVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-4 bg-gray-50">
      <h2 className="text-xl font-normal">Button Radius Options</h2>
      <div className="grid grid-cols-4 gap-4">
        {(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const).map((radius) => (
          <div key={radius} className="flex flex-col items-center gap-2">
            <Button radius={radius} theme="primary">
              Button
            </Button>
            <span className="text-sm text-gray-600">{radius}</span>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-normal mb-4">Radius with Different Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm" radius="md">Small</Button>
          <Button size="md" radius="lg">Medium</Button>
          <Button size="lg" radius="xl">Large</Button>
          <Button size="compact" radius="lg" leftIcon={<Heart className="h-4 w-4" />} />
        </div>
      </div>
    </div>
  ),
};

export const InteractiveStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-4 bg-gray-50">
      <h2 className="text-xl font-normal">Hover and Active States</h2>
      <p className="text-gray-600">Hover over buttons to see enhanced shadow effects. Click to see active state.</p>
      <div className="flex flex-wrap gap-4">
        <Button theme="primary">Primary Hover</Button>
        <Button theme="danger">Danger Hover</Button>
        <Button theme="warning">Warning Hover</Button>
        <Button theme="info">Info Hover</Button>
        <Button theme="dark">Dark Hover</Button>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-normal mb-2">Outline Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Button theme="primary" variant="outline">Primary Outline</Button>
          <Button theme="danger" variant="outline">Danger Outline</Button>
          <Button theme="warning" variant="outline">Warning Outline</Button>
          <Button theme="info" variant="outline">Info Outline</Button>
          <Button theme="dark" variant="outline">Dark Outline</Button>
        </div>
      </div>
    </div>
  ),
};

export const IconExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-4 bg-gray-50">
      <h2 className="text-xl font-normal">Button with Icons</h2>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-normal mb-2">Left Icons</h3>
          <div className="flex flex-wrap gap-4">
            <Button leftIcon={<Download className="h-4 w-4" />}>Download</Button>
            <Button theme="danger" leftIcon={<Trash className="h-4 w-4" />}>Delete</Button>
            <Button theme="warning" leftIcon={<AlertTriangle className="h-4 w-4" />}>Warning</Button>
            <Button theme="info" leftIcon={<Info className="h-4 w-4" />}>Info</Button>
            <Button theme="dark" leftIcon={<Settings className="h-4 w-4" />}>Settings</Button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-normal mb-2">Right Icons</h3>
          <div className="flex flex-wrap gap-4">
            <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Next</Button>
            <Button variant="secondary" rightIcon={<ExternalLink className="h-4 w-4" />}>Open</Button>
            <Button variant="outline" rightIcon={<ChevronDown className="h-4 w-4" />}>Options</Button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-normal mb-2">Icon Only Buttons</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Button size="compact" leftIcon={<Heart className="h-4 w-4" />} />
            <Button size="compact" theme="danger" leftIcon={<X className="h-4 w-4" />} />
            <Button size="compact" variant="outline" leftIcon={<MoreVertical className="h-4 w-4" />} />
            <Button size="sm" leftIcon={<Plus className="h-3 w-3" />} />
            <Button size="md" leftIcon={<Search className="h-4 w-4" />} />
            <Button size="lg" leftIcon={<Filter className="h-5 w-5" />} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-normal mb-2">Loading States</h3>
          <div className="flex flex-wrap gap-4">
            <Button loading>Loading</Button>
            <Button theme="danger" variant="secondary" loading>Processing</Button>
            <Button size="compact" loading />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const FancyVariant: Story = {
  parameters: {
    docs: {
      storyDescription: 'Fancy button variant with enhanced styling'
    }
  },
  render: () => (
    <div className="flex flex-col gap-8 p-4 bg-gray-50">
      <h2 className="text-xl font-normal">Fancy Button Style</h2>
      <p className="text-gray-600">Premium dark buttons with enhanced shadow effects</p>
      
      <div>
        <h3 className="text-lg font-normal mb-3">All Themes</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="fancy" theme="primary">Primary</Button>
          <Button variant="fancy" theme="danger">Danger</Button>
          <Button variant="fancy" theme="warning">Warning</Button>
          <Button variant="fancy" theme="success">Success</Button>
          <Button variant="fancy" theme="info">Info</Button>
          <Button variant="fancy" theme="dark">Dark</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-normal mb-3">Sizes</h3>
        <div className="flex items-center gap-4">
          <Button variant="fancy" size="sm">Get Started</Button>
          <Button variant="fancy" size="md">Get Started</Button>
          <Button variant="fancy" size="lg">Get Started</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-normal mb-3">Border Radius Options</h3>
        <div className="flex items-center gap-4">
          <Button variant="fancy" radius="md">Rounded Medium</Button>
          <Button variant="fancy" radius="lg">Rounded Large</Button>
          <Button variant="fancy" radius="xl">Rounded XL</Button>
          <Button variant="fancy" radius="full">Rounded Full</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-normal mb-3">With Icons</h3>
        <div className="flex items-center gap-4">
          <Button variant="fancy" leftIcon={<Rocket className="h-4 w-4" />}>Launch App</Button>
          <Button variant="fancy" rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</Button>
          <Button variant="fancy" leftIcon={<Heart className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Get Premium
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-normal mb-3">All Themes with Full Radius</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="fancy" theme="primary" radius="full" size="lg">Get Started</Button>
          <Button variant="fancy" theme="danger" radius="full" size="lg">Delete Account</Button>
          <Button variant="fancy" theme="warning" radius="full" size="lg">Proceed with Caution</Button>
          <Button variant="fancy" theme="success" radius="full" size="lg">Save Changes</Button>
          <Button variant="fancy" theme="info" radius="full" size="lg">Learn More</Button>
          <Button variant="fancy" theme="dark" radius="full" size="lg">Dark Mode</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-normal mb-3">States</h3>
        <div className="flex items-center gap-4">
          <Button variant="fancy">Normal</Button>
          <Button variant="fancy" disabled>Disabled</Button>
          <Button variant="fancy" loading>Loading</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-normal mb-3">Full Width</h3>
        <div className="max-w-sm space-y-2">
          <Button variant="fancy" theme="primary" fullWidth radius="full">Get Started Now</Button>
          <Button variant="fancy" theme="danger" fullWidth radius="full">Delete Everything</Button>
        </div>
      </div>
    </div>
  ),
};
  
