import type { Meta, StoryObj } from '@storybook/nextjs';
import { Badge } from './Badge';
import { Star, Check, AlertCircle, Info, TrendingUp, User, Calendar, Tag as TagIcon } from 'lucide-react';
import React from 'react';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline'],
    },
    theme: {
      control: 'select',
      options: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    rounded: {
      control: 'select',
      options: ['full', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Default Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default" theme="primary">Primary</Badge>
          <Badge variant="default" theme="neutral">Neutral</Badge>
          <Badge variant="default" theme="success">Success</Badge>
          <Badge variant="default" theme="warning">Warning</Badge>
          <Badge variant="default" theme="danger">Danger</Badge>
          <Badge variant="default" theme="info">Info</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-normal mb-4">Secondary Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" theme="primary">Primary</Badge>
          <Badge variant="secondary" theme="neutral">Neutral</Badge>
          <Badge variant="secondary" theme="success">Success</Badge>
          <Badge variant="secondary" theme="warning">Warning</Badge>
          <Badge variant="secondary" theme="danger">Danger</Badge>
          <Badge variant="secondary" theme="info">Info</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-normal mb-4">Outline Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" theme="primary">Primary</Badge>
          <Badge variant="outline" theme="neutral">Neutral</Badge>
          <Badge variant="outline" theme="success">Success</Badge>
          <Badge variant="outline" theme="warning">Warning</Badge>
          <Badge variant="outline" theme="danger">Danger</Badge>
          <Badge variant="outline" theme="info">Info</Badge>
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Badge icon={<Star />} theme="warning">Featured</Badge>
        <Badge icon={<Check />} theme="success">Verified</Badge>
        <Badge icon={<AlertCircle />} theme="danger">Alert</Badge>
        <Badge icon={<Info />} theme="info">Info</Badge>
      </div>
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" icon={<TrendingUp />} theme="success">Trending</Badge>
        <Badge variant="secondary" icon={<User />} theme="primary">Pro User</Badge>
        <Badge variant="secondary" icon={<Calendar />} theme="info">Today</Badge>
        <Badge variant="secondary" icon={<TagIcon />} theme="neutral">Tagged</Badge>
      </div>
      <div>
        <h3 className="text-sm font-normal mb-3">Different Sizes with Icons</h3>
        <div className="flex items-center gap-3">
          <Badge size="sm" icon={<Star />} theme="warning">Small</Badge>
          <Badge size="md" icon={<Star />} theme="warning">Medium</Badge>
          <Badge size="lg" icon={<Star />} theme="warning">Large</Badge>
        </div>
      </div>
    </div>
  ),
};

export const WithDots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge dot theme="success">Active</Badge>
      <Badge dot theme="warning">Pending</Badge>
      <Badge dot theme="danger">Offline</Badge>
      <Badge dot variant="secondary" theme="info">In Progress</Badge>
      <Badge dot variant="outline" theme="primary">Available</Badge>
    </div>
  ),
};

export const Closable: Story = {
  render: () => {
    const [badges, setBadges] = React.useState([
      { id: 1, label: 'JavaScript', theme: 'primary' as const },
      { id: 2, label: 'React', theme: 'info' as const },
      { id: 3, label: 'TypeScript', theme: 'success' as const },
      { id: 4, label: 'Node.js', theme: 'warning' as const },
    ]);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge
              key={badge.id}
              theme={badge.theme}
              closable
              onClose={() => setBadges(badges.filter(b => b.id !== badge.id))}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
        {badges.length === 0 && (
          <p className="text-sm text-gray-500">All badges removed!</p>
        )}
      </div>
    );
  },
};

export const RoundedVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Badge rounded="full">Rounded Full</Badge>
        <Badge rounded="md">Rounded MD</Badge>
      </div>
      <div className="flex gap-3">
        <Badge rounded="full" icon={<Star className="h-3 w-3" />} closable>With Icons</Badge>
        <Badge rounded="md" icon={<Star className="h-3 w-3" />} closable>With Icons</Badge>
      </div>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-normal mb-3">User Status</h3>
        <div className="flex gap-2">
          <Badge dot theme="success" size="sm">Online</Badge>
          <Badge dot theme="warning" size="sm">Away</Badge>
          <Badge dot theme="danger" size="sm">Do Not Disturb</Badge>
          <Badge dot theme="neutral" size="sm">Offline</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-normal mb-3">Task Status</h3>
        <div className="flex gap-2">
          <Badge variant="secondary" theme="info">In Progress</Badge>
          <Badge variant="secondary" theme="success">Completed</Badge>
          <Badge variant="secondary" theme="warning">Review</Badge>
          <Badge variant="secondary" theme="danger">Blocked</Badge>
        </div>
      </div>
    </div>
  ),
};

export const NumberBadges: Story = {
  render: () => (
    <div className="flex gap-3">
      <Badge size="sm" rounded="full">1</Badge>
      <Badge size="sm" rounded="full" theme="danger">9</Badge>
      <Badge size="sm" rounded="full" theme="warning">12</Badge>
      <Badge size="sm" rounded="full" theme="success">99+</Badge>
    </div>
  ),
};