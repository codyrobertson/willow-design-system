import type { Meta, StoryObj } from '@storybook/nextjs';
import { Avatar, AvatarGroup } from './Avatar';
import React from 'react';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'busy', 'away'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    alt: 'User avatar',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar
        size="xs"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
        alt="Extra small avatar"
      />
      <Avatar
        size="sm"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
        alt="Small avatar"
      />
      <Avatar
        size="md"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
        alt="Medium avatar"
      />
      <Avatar
        size="lg"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
        alt="Large avatar"
      />
      <Avatar
        size="xl"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
        alt="Extra large avatar"
      />
      <Avatar
        size="2xl"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
        alt="2XL avatar"
      />
    </div>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar fallback="JD" />
      <Avatar fallback="AB" />
      <Avatar fallback="XY" />
      <Avatar fallback="MN" />
      <Avatar fallback="RS" />
      <Avatar fallback="PQ" />
    </div>
  ),
};

export const FallbackSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="xs" fallback="XS" />
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
      <Avatar size="xl" fallback="XL" />
      <Avatar size="2xl" fallback="2X" />
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar
        shape="circle"
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
        alt="Circle avatar"
      />
      <Avatar
        shape="square"
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
        alt="Square avatar"
      />
      <Avatar shape="circle" fallback="CR" />
      <Avatar shape="square" fallback="SQ" />
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
        status="online"
        alt="Online user"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"
        status="away"
        alt="Away user"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400"
        status="busy"
        alt="Busy user"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400"
        status="offline"
        alt="Offline user"
      />
    </div>
  ),
};

export const StatusWithFallback: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar fallback="ON" status="online" />
      <Avatar fallback="AW" status="away" />
      <Avatar fallback="BS" status="busy" />
      <Avatar fallback="OF" status="offline" />
    </div>
  ),
};

export const DefaultIcon: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm" />
      <Avatar size="md" />
      <Avatar size="lg" />
      <Avatar size="xl" />
    </div>
  ),
};

export const ImageLoadError: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar
          src="https://invalid-url-that-will-fail.com/image.jpg"
          fallback="ER"
          alt="Error fallback"
        />
        <span className="text-sm text-muted-foreground">
          Image fails to load, shows fallback
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Avatar
          src="https://invalid-url-that-will-fail.com/image.jpg"
          alt="Error default"
        />
        <span className="text-sm text-muted-foreground">
          Image fails to load, shows default icon
        </span>
      </div>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="space-y-4">
      <AvatarGroup>
        <Avatar src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400" />
      </AvatarGroup>
      
      <AvatarGroup max={3}>
        <Avatar fallback="JD" />
        <Avatar fallback="AB" />
        <Avatar fallback="XY" />
        <Avatar fallback="MN" />
        <Avatar fallback="RS" />
        <Avatar fallback="PQ" />
      </AvatarGroup>
    </div>
  ),
};

export const GroupSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <AvatarGroup size="sm">
        <Avatar src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" />
      </AvatarGroup>
      
      <AvatarGroup size="md">
        <Avatar src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" />
      </AvatarGroup>
      
      <AvatarGroup size="lg">
        <Avatar src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" />
        <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" />
      </AvatarGroup>
    </div>
  ),
};

export const UserList: Story = {
  render: () => {
    const users = [
      { name: 'John Doe', status: 'online' as const, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400' },
      { name: 'Jane Smith', status: 'away' as const, fallback: 'JS' },
      { name: 'Mike Johnson', status: 'busy' as const, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
      { name: 'Sarah Williams', status: 'offline' as const, fallback: 'SW' },
    ];
    
    return (
      <div className="space-y-3 w-64">
        {users.map((user) => (
          <div key={user.name} className="flex items-center gap-3">
            <Avatar
              src={user.avatar}
              fallback={user.fallback}
              status={user.status}
              alt={user.name}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
            </div>
          </div>
        ))}
      </div>
    );
  },
};

export const ProfileCard: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6 border rounded-lg w-80">
      <Avatar
        size="xl"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
        status="online"
        alt="Profile"
      />
      <div>
        <h3 className="font-semibold">Alex Thompson</h3>
        <p className="text-sm text-muted-foreground">Product Designer</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-2 h-2 bg-success-500 rounded-full" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
      </div>
    </div>
  ),
};