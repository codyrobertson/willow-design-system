import type { Meta, StoryObj } from '@storybook/nextjs';
import { Highlight } from './Highlight';
import { CheckCircle, ArrowRight, Loader2, Clock, Info, Moon, Star, Bot, AlertTriangle, XCircle, Sparkles, ExternalLink, Palette, Brush } from 'lucide-react';

const meta: Meta<typeof Highlight> = {
  title: 'UI/Highlight',
  component: Highlight,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
    },
    variant: {
      control: 'select',
      options: ['light', 'dark'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Highlight>;

export const Default: Story = {
  args: {
    text: 'This is a highlighted message',
  },
};

export const WithLeftIcon: Story = {
  args: {
    text: 'Success! Your changes have been saved.',
    iconLeft: <CheckCircle className="text-green-600 h-5 w-5" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    text: 'Click to learn more',
    iconRight: <ArrowRight className="h-5 w-5" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    text: 'Processing your request',
    iconLeft: <Loader2 className="animate-spin h-5 w-5" />,
    iconRight: <Clock className="h-5 w-5" />,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Highlight 
        text="Light variant (default)" 
        iconLeft={<Info className="h-5 w-5" />}
        variant="light"
      />
      <Highlight 
        text="Dark variant" 
        iconLeft={<Moon className="h-5 w-5" />}
        variant="dark"
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Highlight 
        text="Small size" 
        size="sm"
        iconLeft={<Star className="h-4 w-4" />}
      />
      <Highlight 
        text="Medium size (default)" 
        size="md"
        iconLeft={<Star className="h-5 w-5" />}
      />
      <Highlight 
        text="Large size" 
        size="lg"
        iconLeft={<Star className="h-6 w-6" />}
      />
    </div>
  ),
};

export const UseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Highlight 
        text="AI is processing your request" 
        iconLeft={<Bot className="text-willow-primary-950 h-5 w-5" />}
        variant="light"
      />
      <Highlight 
        text="Warning: This action cannot be undone" 
        iconLeft={<AlertTriangle className="text-warning h-5 w-5" />}
        variant="light"
      />
      <Highlight 
        text="Error: Please check your input" 
        iconLeft={<XCircle className="text-danger h-5 w-5" />}
        variant="light"
      />
      <Highlight 
        text="New feature available!" 
        iconLeft={<Sparkles className="text-yellow-500 h-5 w-5" />}
        iconRight={<ExternalLink className="h-4 w-4" />}
        variant="light"
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Highlight 
        text="Loading data..." 
        iconLeft={<Loader2 className="animate-spin h-5 w-5" />}
      />
      <Highlight 
        text="Analyzing your aftercare instructions" 
        iconLeft={<Bot className="text-willow-primary-950 h-5 w-5" />}
        iconRight={<Loader2 className="animate-spin h-4 w-4" />}
      />
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Highlight 
        text="Custom colored highlight" 
        iconLeft={<Palette className="h-5 w-5" />}
        className="bg-purple-100 text-purple-900"
      />
      <Highlight 
        text="Another custom style" 
        iconLeft={<Brush className="h-5 w-5" />}
        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900"
      />
    </div>
  ),
};