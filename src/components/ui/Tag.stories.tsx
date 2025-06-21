import type { Meta, StoryObj } from '@storybook/nextjs';
import { Tag } from './Tag';
import { Hash, User, Calendar, MapPin, Heart, Star } from 'lucide-react';
import React from 'react';

const meta: Meta<typeof Tag> = {
  title: 'UI/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    children: 'Tag',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Category',
    icon: <Hash />,
  },
};

export const Removable: Story = {
  args: {
    children: 'Removable',
    onRemove: () => alert('Tag removed!'),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Tag variant="primary">Primary</Tag>
      <Tag variant="neutral">Neutral</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="danger">Danger</Tag>
      <Tag variant="info">Info</Tag>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Tag size="sm">Small</Tag>
      <Tag size="md">Medium</Tag>
      <Tag size="lg">Large</Tag>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Tag icon={<User />}>User</Tag>
      <Tag icon={<Calendar />} variant="primary">Event</Tag>
      <Tag icon={<MapPin />} variant="info">Location</Tag>
      <Tag icon={<Heart />} variant="danger">Favorite</Tag>
      <Tag icon={<Star />} variant="warning">Featured</Tag>
    </div>
  ),
};

export const RemovableTags: Story = {
  render: () => {
    const [tags, setTags] = React.useState(['React', 'TypeScript', 'Tailwind', 'Next.js', 'Storybook']);
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Tag
              key={tag}
              variant={index % 2 === 0 ? 'primary' : 'neutral'}
              onRemove={() => setTags(tags.filter(t => t !== tag))}
            >
              {tag}
            </Tag>
          ))}
        </div>
        {tags.length === 0 && (
          <p className="text-sm text-gray-500">All tags removed!</p>
        )}
      </div>
    );
  },
};

export const CategoryTags: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-normal mb-2">Article Tags:</h3>
        <div className="flex flex-wrap gap-2">
          <Tag icon={<Hash />} size="sm" variant="neutral">technology</Tag>
          <Tag icon={<Hash />} size="sm" variant="neutral">design</Tag>
          <Tag icon={<Hash />} size="sm" variant="neutral">development</Tag>
          <Tag icon={<Hash />} size="sm" variant="neutral">ui-ux</Tag>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-normal mb-2">Filter by:</h3>
        <div className="flex flex-wrap gap-2">
          <Tag variant="primary" onRemove={() => {}}>Price: $10-50</Tag>
          <Tag variant="primary" onRemove={() => {}}>Brand: Nike</Tag>
          <Tag variant="primary" onRemove={() => {}}>Size: Medium</Tag>
          <Tag variant="primary" onRemove={() => {}}>Color: Blue</Tag>
        </div>
      </div>
    </div>
  ),
};