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
      options: ['solid', 'soft', 'outline'],
    },
    color: {
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
        <h3 className="text-lg font-normal mb-4">Solid Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="solid" color="primary">Primary</Badge>
          <Badge variant="solid" color="neutral">Neutral</Badge>
          <Badge variant="solid" color="success">Success</Badge>
          <Badge variant="solid" color="warning">Warning</Badge>
          <Badge variant="solid" color="danger">Danger</Badge>
          <Badge variant="solid" color="info">Info</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-normal mb-4">Soft Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="soft" color="primary">Primary</Badge>
          <Badge variant="soft" color="neutral">Neutral</Badge>
          <Badge variant="soft" color="success">Success</Badge>
          <Badge variant="soft" color="warning">Warning</Badge>
          <Badge variant="soft" color="danger">Danger</Badge>
          <Badge variant="soft" color="info">Info</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-normal mb-4">Outline Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" color="primary">Primary</Badge>
          <Badge variant="outline" color="neutral">Neutral</Badge>
          <Badge variant="outline" color="success">Success</Badge>
          <Badge variant="outline" color="warning">Warning</Badge>
          <Badge variant="outline" color="danger">Danger</Badge>
          <Badge variant="outline" color="info">Info</Badge>
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
        <Badge icon={<Star />} color="warning">Featured</Badge>
        <Badge icon={<Check />} color="success">Verified</Badge>
        <Badge icon={<AlertCircle />} color="danger">Alert</Badge>
        <Badge icon={<Info />} color="info">Info</Badge>
      </div>
      <div className="flex flex-wrap gap-3">
        <Badge variant="soft" icon={<TrendingUp />} color="success">Trending</Badge>
        <Badge variant="soft" icon={<User />} color="primary">Pro User</Badge>
        <Badge variant="soft" icon={<Calendar />} color="info">Today</Badge>
        <Badge variant="soft" icon={<TagIcon />} color="neutral">Tagged</Badge>
      </div>
      <div>
        <h3 className="text-sm font-normal mb-3">Different Sizes with Icons</h3>
        <div className="flex items-center gap-3">
          <Badge size="sm" icon={<Star />} color="warning">Small</Badge>
          <Badge size="md" icon={<Star />} color="warning">Medium</Badge>
          <Badge size="lg" icon={<Star />} color="warning">Large</Badge>
        </div>
      </div>
    </div>
  ),
};

export const WithDots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge dot color="success">Active</Badge>
      <Badge dot color="warning">Pending</Badge>
      <Badge dot color="danger">Offline</Badge>
      <Badge dot variant="soft" color="info">In Progress</Badge>
      <Badge dot variant="outline" color="primary">Available</Badge>
    </div>
  ),
};

export const Closable: Story = {
  render: () => {
    const [badges, setBadges] = React.useState([
      { id: 1, label: 'JavaScript', color: 'primary' as const },
      { id: 2, label: 'React', color: 'info' as const },
      { id: 3, label: 'TypeScript', color: 'success' as const },
      { id: 4, label: 'Node.js', color: 'warning' as const },
    ]);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge
              key={badge.id}
              color={badge.color}
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
          <Badge dot color="success" size="sm">Online</Badge>
          <Badge dot color="warning" size="sm">Away</Badge>
          <Badge dot color="danger" size="sm">Do Not Disturb</Badge>
          <Badge dot color="neutral" size="sm">Offline</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-normal mb-3">Task Status</h3>
        <div className="flex gap-2">
          <Badge variant="soft" color="info">In Progress</Badge>
          <Badge variant="soft" color="success">Completed</Badge>
          <Badge variant="soft" color="warning">Review</Badge>
          <Badge variant="soft" color="danger">Blocked</Badge>
        </div>
      </div>
    </div>
  ),
};

export const NumberBadges: Story = {
  render: () => (
    <div className="flex gap-3">
      <Badge size="sm" rounded="full">1</Badge>
      <Badge size="sm" rounded="full" color="danger">9</Badge>
      <Badge size="sm" rounded="full" color="warning">12</Badge>
      <Badge size="sm" rounded="full" color="success">99+</Badge>
    </div>
  ),
};