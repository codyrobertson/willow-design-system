import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Chip } from '../components/ui/Chip';
import { Tag } from '../components/ui/Tag';
import { Star, Check, AlertCircle, Info, TrendingUp, User } from 'lucide-react';

const meta: Meta = {
  title: 'Foundation/Component Showcase',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

export const ColorConsistency: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Willow Design System - Color Consistency</h2>
        <p className="text-gray-600 mb-8">
          All components use the same color palette and styling patterns for consistency across the design system.
        </p>
      </div>

      <div className="space-y-12">
        {/* Primary Theme */}
        <div>
          <h3 className="text-lg font-normal mb-4 text-willow-primary-950">Primary Theme</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-normal mb-3">Badges</h4>
              <div className="space-y-2">
                <Badge variant="default" theme="primary">Solid</Badge>
                <Badge variant="secondary" theme="primary">Soft</Badge>
                <Badge variant="outline" theme="primary">Outline</Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Chips</h4>
              <div className="space-y-2">
                <Chip theme="primary">Normal</Chip>
                <Chip theme="primary" selected>Selected</Chip>
                <Chip variant="fancy" theme="primary">Fancy</Chip>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Tags</h4>
              <div className="space-y-2">
                <Tag variant="primary">Primary Tag</Tag>
                <Tag variant="primary" icon={<Star />}>With Icon</Tag>
                <Tag variant="primary" onRemove={() => {}}>Removable</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Success Theme */}
        <div>
          <h3 className="text-lg font-normal mb-4 text-green-700">Success Theme</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-normal mb-3">Badges</h4>
              <div className="space-y-2">
                <Badge variant="default" theme="success">Solid</Badge>
                <Badge variant="secondary" theme="success">Soft</Badge>
                <Badge variant="outline" theme="success">Outline</Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Chips</h4>
              <div className="space-y-2">
                <Chip theme="success">Normal</Chip>
                <Chip theme="success" selected>Selected</Chip>
                <Chip variant="fancy" theme="success">Fancy</Chip>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Tags</h4>
              <div className="space-y-2">
                <Tag variant="success">Success Tag</Tag>
                <Tag variant="success" icon={<Check />}>Verified</Tag>
                <Tag variant="success" onRemove={() => {}}>Removable</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Theme */}
        <div>
          <h3 className="text-lg font-normal mb-4 text-orange-700">Warning Theme</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-normal mb-3">Badges</h4>
              <div className="space-y-2">
                <Badge variant="default" theme="warning">Solid</Badge>
                <Badge variant="secondary" theme="warning">Soft</Badge>
                <Badge variant="outline" theme="warning">Outline</Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Chips</h4>
              <div className="space-y-2">
                <Chip theme="warning">Normal</Chip>
                <Chip theme="warning" selected>Selected</Chip>
                <Chip variant="fancy" theme="warning">Fancy</Chip>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Tags</h4>
              <div className="space-y-2">
                <Tag variant="warning">Warning Tag</Tag>
                <Tag variant="warning" icon={<AlertCircle />}>Alert</Tag>
                <Tag variant="warning" onRemove={() => {}}>Removable</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Theme */}
        <div>
          <h3 className="text-lg font-normal mb-4 text-red-700">Danger Theme</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-normal mb-3">Badges</h4>
              <div className="space-y-2">
                <Badge variant="default" theme="danger">Solid</Badge>
                <Badge variant="secondary" theme="danger">Soft</Badge>
                <Badge variant="outline" theme="danger">Outline</Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Chips</h4>
              <div className="space-y-2">
                <Chip theme="danger">Normal</Chip>
                <Chip theme="danger" selected>Selected</Chip>
                <Chip variant="fancy" theme="danger">Fancy</Chip>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Tags</h4>
              <div className="space-y-2">
                <Tag variant="danger">Danger Tag</Tag>
                <Tag variant="danger" icon={<AlertCircle />}>Critical</Tag>
                <Tag variant="danger" onRemove={() => {}}>Removable</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Neutral Theme */}
        <div>
          <h3 className="text-lg font-normal mb-4 text-neutral-700">Neutral Theme</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-normal mb-3">Badges</h4>
              <div className="space-y-2">
                <Badge variant="default" theme="neutral">Solid</Badge>
                <Badge variant="secondary" theme="neutral">Soft</Badge>
                <Badge variant="outline" theme="neutral">Outline</Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Chips</h4>
              <div className="space-y-2">
                <Chip theme="neutral">Normal</Chip>
                <Chip theme="neutral" selected>Selected</Chip>
                <Chip variant="fancy" theme="neutral">Fancy</Chip>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Tags</h4>
              <div className="space-y-2">
                <Tag variant="neutral">Neutral Tag</Tag>
                <Tag variant="neutral" icon={<User />}>User</Tag>
                <Tag variant="neutral" onRemove={() => {}}>Removable</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Info Theme */}
        <div>
          <h3 className="text-lg font-normal mb-4 text-willow-primary-600">Info Theme</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-normal mb-3">Badges</h4>
              <div className="space-y-2">
                <Badge variant="default" theme="info">Solid</Badge>
                <Badge variant="secondary" theme="info">Soft</Badge>
                <Badge variant="outline" theme="info">Outline</Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Chips</h4>
              <div className="space-y-2">
                <Chip theme="info">Normal</Chip>
                <Chip theme="info" selected>Selected</Chip>
                <Chip variant="fancy" theme="info">Fancy</Chip>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-normal mb-3">Tags</h4>
              <div className="space-y-2">
                <Tag variant="info">Info Tag</Tag>
                <Tag variant="info" icon={<Info />}>Information</Tag>
                <Tag variant="info" onRemove={() => {}}>Removable</Tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Size Consistency</h2>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-normal mb-4">Small Size</h3>
          <div className="flex items-center gap-4">
            <Badge size="sm">Badge Small</Badge>
            <Badge size="sm" icon={<Star />}>With Icon</Badge>
            <Badge size="sm" closable onClose={() => {}}>Closable</Badge>
            <Chip size="sm">Chip Small</Chip>
            <Tag size="sm">Tag Small</Tag>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-normal mb-4">Medium Size (Default)</h3>
          <div className="flex items-center gap-4">
            <Badge size="md">Badge Medium</Badge>
            <Badge size="md" icon={<Star />}>With Icon</Badge>
            <Badge size="md" closable onClose={() => {}}>Closable</Badge>
            <Chip size="md">Chip Medium</Chip>
            <Tag size="md">Tag Medium</Tag>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-normal mb-4">Large Size</h3>
          <div className="flex items-center gap-4">
            <Badge size="lg">Badge Large</Badge>
            <Badge size="lg" icon={<Star />}>With Icon</Badge>
            <Badge size="lg" closable onClose={() => {}}>Closable</Badge>
            <Chip size="lg">Chip Large</Chip>
            <Tag size="lg">Tag Large</Tag>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const InteractiveStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Interactive States</h2>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-normal mb-4">Closable Components</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge closable onClose={() => alert('Badge closed!')}>Closable Badge</Badge>
              <Badge variant="secondary" closable onClose={() => alert('Badge closed!')}>Soft Badge</Badge>
              <Badge variant="outline" closable onClose={() => alert('Badge closed!')}>Outline Badge</Badge>
            </div>
            <div className="flex gap-3">
              <Chip onRemove={() => alert('Chip removed!')}>Removable Chip</Chip>
              <Chip variant="fancy" onRemove={() => alert('Chip removed!')}>Fancy Chip</Chip>
            </div>
            <div className="flex gap-3">
              <Tag onRemove={() => alert('Tag removed!')}>Removable Tag</Tag>
              <Tag variant="info" onRemove={() => alert('Tag removed!')}>Info Tag</Tag>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-normal mb-4">Selectable Chips</h3>
          <div className="flex gap-3">
            <Chip onClick={() => alert('Chip clicked!')}>Clickable</Chip>
            <Chip selected onClick={() => alert('Chip clicked!')}>Selected</Chip>
            <Chip variant="fancy" onClick={() => alert('Chip clicked!')}>Fancy</Chip>
            <Chip variant="fancy" selected onClick={() => alert('Chip clicked!')}>Fancy Selected</Chip>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-normal mb-4">With Icons</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge icon={<Star />} iconPosition="left">Left Icon</Badge>
              <Badge icon={<Star />} iconPosition="right">Right Icon</Badge>
              <Badge icon={<Star />} dot>With Dot</Badge>
            </div>
            <div className="flex gap-3">
              <Chip icon={<TrendingUp />}>Trending</Chip>
              <Chip icon={<User />} selected>Active User</Chip>
            </div>
            <div className="flex gap-3">
              <Tag icon={<Info />}>Information</Tag>
              <Tag icon={<Check />} variant="success">Completed</Tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};