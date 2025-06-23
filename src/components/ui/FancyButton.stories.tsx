import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { FancyButton } from './FancyButton'
import { Download, ArrowRight, Heart, Star, Send, Plus, Check, X } from 'lucide-react'

const meta = {
  title: 'UI/FancyButton',
  component: FancyButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'fancy'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof FancyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
}

export const Fancy: Story = {
  args: {
    children: 'Get Started',
    variant: 'fancy',
    size: 'xl',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

export const WithLeftIcon: Story = {
  args: {
    children: 'Download',
    leftIcon: <Download className="h-4 w-4" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Next',
    rightIcon: <ArrowRight className="h-4 w-4" />,
  },
}

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}

export const Sizes: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="flex items-center gap-4">
      <FancyButton size="xs">Extra Small</FancyButton>
      <FancyButton size="sm">Small</FancyButton>
      <FancyButton size="md">Medium</FancyButton>
      <FancyButton size="lg">Large</FancyButton>
      <FancyButton size="xl">Extra Large</FancyButton>
    </div>
  ),
}

export const AllVariants: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Button Variants</h3>
        <div className="flex flex-wrap gap-4">
          <FancyButton variant="primary">Primary</FancyButton>
          <FancyButton variant="fancy">Get Started</FancyButton>
          <FancyButton variant="secondary">Secondary</FancyButton>
          <FancyButton variant="ghost">Ghost</FancyButton>
          <FancyButton variant="outline">Outline</FancyButton>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-normal mb-4">With Icons</h3>
        <div className="flex flex-wrap gap-4">
          <FancyButton variant="primary" leftIcon={<Download className="h-4 w-4" />}>Download</FancyButton>
          <FancyButton variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</FancyButton>
          <FancyButton variant="ghost" leftIcon={<Heart className="h-4 w-4" />}>Like</FancyButton>
          <FancyButton variant="outline" leftIcon={<Star className="h-4 w-4" />}>Rate</FancyButton>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-normal mb-4">States</h3>
        <div className="flex flex-wrap gap-4">
          <FancyButton loading>Loading</FancyButton>
          <FancyButton disabled>Disabled</FancyButton>
          <FancyButton variant="secondary" loading>Processing</FancyButton>
          <FancyButton variant="outline" disabled>Unavailable</FancyButton>
        </div>
      </div>
    </div>
  ),
}

export const IconButtons: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Icon Only Buttons</h3>
        <div className="flex items-center gap-4">
          <FancyButton size="xs" aria-label="Add"><Plus className="h-3 w-3" /></FancyButton>
          <FancyButton size="sm" aria-label="Check"><Check className="h-4 w-4" /></FancyButton>
          <FancyButton size="md" variant="secondary" aria-label="Close"><X className="h-4 w-4" /></FancyButton>
          <FancyButton size="lg" variant="ghost" aria-label="Like"><Heart className="h-5 w-5" /></FancyButton>
          <FancyButton size="xl" variant="outline" aria-label="Send"><Send className="h-6 w-6" /></FancyButton>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-normal mb-4">Combined Icons and Text</h3>
        <div className="flex flex-wrap gap-4">
          <FancyButton leftIcon={<Plus className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Create New
          </FancyButton>
          <FancyButton variant="secondary" leftIcon={<Download className="h-4 w-4" />} rightIcon={<Check className="h-4 w-4" />}>
            Download Complete
          </FancyButton>
        </div>
      </div>
    </div>
  ),
}

export const FullWidth: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <FancyButton fullWidth>Full Width Primary</FancyButton>
      <FancyButton variant="secondary" fullWidth leftIcon={<Download className="h-4 w-4" />}>
        Download File
      </FancyButton>
      <FancyButton variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
        Continue to Next Step
      </FancyButton>
      <FancyButton variant="ghost" fullWidth loading>
        Processing...
      </FancyButton>
    </div>
  ),
}

export const FancyVariants: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Fancy Button - Theme-Aware Inner Shadows</h3>
        <p className="text-sm text-gray-600 mb-3">Each theme has its own unique inner shadow color that matches the button's character</p>
        <div className="flex flex-wrap gap-4">
          <FancyButton variant="fancy">Primary (Cyan glow)</FancyButton>
          <FancyButton variant="danger">Danger (Pink glow)</FancyButton>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-normal mb-4">Fancy Button - All Sizes</h3>
        <div className="flex items-center gap-4">
          <FancyButton variant="fancy" size="xs">Extra Small</FancyButton>
          <FancyButton variant="fancy" size="sm">Small</FancyButton>
          <FancyButton variant="fancy" size="md">Medium</FancyButton>
          <FancyButton variant="fancy" size="lg">Large</FancyButton>
          <FancyButton variant="fancy" size="xl">Get Started</FancyButton>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-normal mb-4">Fancy Button - With Icons</h3>
        <div className="flex flex-wrap gap-4">
          <FancyButton variant="fancy" size="lg" leftIcon={<Plus className="h-5 w-5" />}>
            Create New
          </FancyButton>
          <FancyButton variant="fancy" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
            Continue
          </FancyButton>
          <FancyButton variant="fancy" size="lg" leftIcon={<Download className="h-5 w-5" />} rightIcon={<Check className="h-5 w-5" />}>
            Download & Install
          </FancyButton>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-normal mb-4">Fancy Button - Different Themes</h3>
        <p className="text-sm text-gray-600 mb-3">Note: These use the Button component directly since FancyButton is deprecated</p>
        <div className="flex flex-wrap gap-4">
          <button 
            className="px-8 py-3 bg-willow-primary-900 text-white font-semibold rounded-full shadow-[0px_1px_3px_0px_rgba(37,62,167,0.2),inset_0px_-2.4px_7.5px_0px_rgba(122,196,230,0.46)] hover:bg-willow-primary-800 hover:shadow-[0px_2px_5px_0px_rgba(37,62,167,0.3),inset_0px_-2.4px_7.5px_0px_rgba(122,196,230,0.5)] active:bg-willow-primary-950 active:shadow-[inset_0px_2px_4px_0px_rgba(37,62,167,0.3)] transition-all"
          >
            Primary Fancy
          </button>
          <button 
            className="px-8 py-3 bg-destructive-600 text-white font-semibold rounded-full shadow-[0px_1px_3px_0px_rgba(183,55,55,0.4),inset_0px_-2.4px_7.5px_0px_rgba(255,150,150,0.5)] hover:bg-destructive-500 hover:shadow-[0px_2px_5px_0px_rgba(183,55,55,0.5),inset_0px_-2.4px_7.5px_0px_rgba(255,150,150,0.6)] active:bg-destructive-700 active:shadow-[inset_0px_2px_4px_0px_rgba(183,55,55,0.5)] transition-all"
          >
            Danger Fancy
          </button>
        </div>
      </div>
    </div>
  ),
}

export const InteractiveDemo: Story = {
  args: {
    children: 'Button',
  },
  render: () => {
    const [loading, setLoading] = React.useState(false);
    const [liked, setLiked] = React.useState(false);
    
    const handleClick = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setLiked(!liked);
      }, 1500);
    };
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">Click the button to see loading state</p>
          <FancyButton 
            onClick={handleClick} 
            loading={loading}
            leftIcon={<Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />}
          >
            {liked ? 'Liked!' : 'Like'}
          </FancyButton>
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 mb-4">Hover to see enhanced shadow effects</p>
          <div className="flex justify-center gap-4">
            <FancyButton variant="primary">Primary</FancyButton>
            <FancyButton variant="secondary">Secondary</FancyButton>
          </div>
        </div>
      </div>
    );
  },
}