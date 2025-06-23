import type { Meta, StoryObj } from '@storybook/nextjs';
import { Tooltip } from './Tooltip';
import { Button } from './Button';
import { Badge } from './Badge';
import { Icon } from './icon/Icon';
import React from 'react';
import { Info, HelpCircle, AlertCircle, Copy, Download, Share2 } from 'lucide-react';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
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
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8 items-center min-h-[200px]">
      <div />
      <Tooltip content="Top tooltip" side="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <div />
      
      <Tooltip content="Left tooltip" side="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
      <div />
      <Tooltip content="Right tooltip" side="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
      
      <div />
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <div />
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="flex gap-4">
        <Tooltip content="Aligned to start" side="top" align="start">
          <Button variant="outline" className="w-32">Start</Button>
        </Tooltip>
        <Tooltip content="Aligned to center" side="top" align="center">
          <Button variant="outline" className="w-32">Center</Button>
        </Tooltip>
        <Tooltip content="Aligned to end" side="top" align="end">
          <Button variant="outline" className="w-32">End</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="More information">
        <Button variant="ghost" size="sm">
          <Info className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Get help">
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Warning: This action cannot be undone">
        <Button variant="ghost" size="sm" color="danger">
          <AlertCircle className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tooltip 
      content="This is a longer tooltip message that provides more detailed information about the element you're hovering over."
    >
      <Button>Long tooltip content</Button>
    </Tooltip>
  ),
};

export const WithDisabledElements: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip content="This button is disabled">
        <span className="inline-block">
          <Button disabled>Disabled Button</Button>
        </span>
      </Tooltip>
      
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
        <Tooltip content="We'll never share your email with anyone else">
          <Info className="w-4 h-4 text-muted-foreground" />
        </Tooltip>
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Tooltip content="Must be at least 8 characters with one uppercase letter and one number">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </Tooltip>
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="api-key" className="text-sm font-medium">
          API Key
        </label>
        <Tooltip content="Find your API key in your account settings">
          <Info className="w-4 h-4 text-muted-foreground" />
        </Tooltip>
      </div>
    </div>
  ),
};

export const ActionButtons: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip content="Copy to clipboard">
        <Button variant="ghost" size="sm">
          <Copy className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Download file">
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Share">
        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <div className="flex gap-3">
      <Tooltip content="This feature is new!">
        <Badge color="success">New</Badge>
      </Tooltip>
      
      <Tooltip content="Beta features may change">
        <Badge color="warning">Beta</Badge>
      </Tooltip>
      
      <Tooltip content="This feature is deprecated">
        <Badge color="danger">Deprecated</Badge>
      </Tooltip>
    </div>
  ),
};

export const DelayedTooltip: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip content="Instant tooltip (default)">
        <Button>Instant</Button>
      </Tooltip>
      
      <p className="text-sm text-muted-foreground">
        Note: You can configure delay using RadixUI's Provider
      </p>
    </div>
  ),
};

export const ComplexContent: Story = {
  render: () => (
    <Tooltip
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
    </Tooltip>
  ),
};

export const NavigationExample: Story = {
  render: () => (
    <nav className="flex gap-1">
      <Tooltip content="Dashboard">
        <Button variant="ghost" size="sm">
          <Icon name="home" className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Analytics">
        <Button variant="ghost" size="sm">
          <Icon name="chart-line" className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Settings">
        <Button variant="ghost" size="sm">
          <Icon name="cog" className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Profile">
        <Button variant="ghost" size="sm">
          <Icon name="user" className="w-4 h-4" />
        </Button>
      </Tooltip>
    </nav>
  ),
};