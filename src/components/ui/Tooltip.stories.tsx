import type { Meta, StoryObj } from '@storybook/nextjs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipWrapper } from './Tooltip';
import { Button } from './Button';
import { Badge } from './Badge';
import { Icon } from './icon';
import React from 'react';
import { Info, HelpCircle, AlertCircle, Copy, Download, Share2 } from 'lucide-react';

const meta: Meta<typeof TooltipWrapper> = {
  title: 'UI/Tooltip',
  component: TooltipWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
    },
    content: {
      control: 'text',
    },
    delayDuration: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TooltipWrapper>;

export const Default: Story = {
  render: () => (
    <TooltipWrapper content="This is a tooltip">
      <Button>Hover me</Button>
    </TooltipWrapper>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8 items-center min-h-[200px]">
      <div />
      <TooltipWrapper content="Top tooltip" side="top">
        <Button variant="outline">Top</Button>
      </TooltipWrapper>
      <div />
      
      <TooltipWrapper content="Left tooltip" side="left">
        <Button variant="outline">Left</Button>
      </TooltipWrapper>
      <div />
      <TooltipWrapper content="Right tooltip" side="right">
        <Button variant="outline">Right</Button>
      </TooltipWrapper>
      
      <div />
      <TooltipWrapper content="Bottom tooltip" side="bottom">
        <Button variant="outline">Bottom</Button>
      </TooltipWrapper>
      <div />
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="flex gap-4">
        <TooltipWrapper content="Aligned to start" side="top" align="start">
          <Button variant="outline" className="w-32">Start</Button>
        </TooltipWrapper>
        <TooltipWrapper content="Aligned to center" side="top" align="center">
          <Button variant="outline" className="w-32">Center</Button>
        </TooltipWrapper>
        <TooltipWrapper content="Aligned to end" side="top" align="end">
          <Button variant="outline" className="w-32">End</Button>
        </TooltipWrapper>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <TooltipWrapper content="More information">
        <Button variant="ghost" size="sm">
          <Info className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Get help">
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Warning: This action cannot be undone">
        <Button variant="ghost" size="sm" theme="danger">
          <AlertCircle className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <TooltipWrapper content="This is a longer tooltip message that provides more detailed information about the element you're hovering over.">
      <Button>Long tooltip content</Button>
    </TooltipWrapper>
  ),
};

export const WithDisabledElements: Story = {
  render: () => (
    <div className="space-y-4">
      <TooltipWrapper content="This button is disabled">
        <span className="inline-block">
          <Button disabled>Disabled Button</Button>
        </span>
      </TooltipWrapper>
      
      <p className="text-sm text-muted-foreground">
        Note: Wrap disabled elements in a span to ensure tooltip works
      </p>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div className="flex items-center gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email Address
        </label>
        <TooltipWrapper content="We'll never share your email with anyone else">
          <Info className="w-4 h-4 text-muted-foreground" />
        </TooltipWrapper>
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <TooltipWrapper content="Must be at least 8 characters with one uppercase letter and one number">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </TooltipWrapper>
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="api-key" className="text-sm font-medium">
          API Key
        </label>
        <TooltipWrapper content="Find your API key in your account settings">
          <Info className="w-4 h-4 text-muted-foreground" />
        </TooltipWrapper>
      </div>
    </div>
  ),
};

export const ActionButtons: Story = {
  render: () => (
    <div className="flex gap-2">
      <TooltipWrapper content="Copy to clipboard">
        <Button variant="ghost" size="sm">
          <Copy className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Download file">
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Share">
        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
    </div>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <div className="flex gap-3">
      <TooltipWrapper content="This feature is new!">
        <Badge theme="success">New</Badge>
      </TooltipWrapper>
      
      <TooltipWrapper content="Beta features may change">
        <Badge theme="warning">Beta</Badge>
      </TooltipWrapper>
      
      <TooltipWrapper content="This feature is deprecated">
        <Badge theme="danger">Deprecated</Badge>
      </TooltipWrapper>
    </div>
  ),
};

export const DelayedTooltip: Story = {
  render: () => (
    <div className="space-y-4">
      <TooltipWrapper content="Default instant tooltip">
        <Button>Default (instant)</Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Small delay tooltip" delayDuration={200}>
        <Button>Small delay (200ms)</Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Long delay tooltip" delayDuration={700}>
        <Button>Long delay (700ms)</Button>
      </TooltipWrapper>
    </div>
  ),
};

export const ComplexContent: Story = {
  render: () => (
    <TooltipWrapper
      content={
        <div className="space-y-2">
          <p className="font-semibold">Keyboard Shortcuts</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span>Copy</span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded">Cmd+C</kbd>
            </div>
            <div className="flex justify-between gap-4">
              <span>Paste</span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded">Cmd+V</kbd>
            </div>
            <div className="flex justify-between gap-4">
              <span>Cut</span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded">Cmd+X</kbd>
            </div>
          </div>
        </div>
      }
    >
      <Button variant="outline">
        <Icon name="keyboard" className="w-4 h-4 mr-2" />
        Shortcuts
      </Button>
    </TooltipWrapper>
  ),
};

export const NavigationExample: Story = {
  render: () => (
    <nav className="flex gap-1">
      <TooltipWrapper content="Dashboard">
        <Button variant="ghost" size="sm">
          <Icon name="home" className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Analytics">
        <Button variant="ghost" size="sm">
          <Icon name="chart-line" className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Settings">
        <Button variant="ghost" size="sm">
          <Icon name="cog" className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
      
      <TooltipWrapper content="Profile">
        <Button variant="ghost" size="sm">
          <Icon name="user" className="w-4 h-4" />
        </Button>
      </TooltipWrapper>
    </nav>
  ),
};