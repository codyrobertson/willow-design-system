import type { Meta, StoryObj } from '@storybook/nextjs';
import { Chip } from './Chip';
import { Check, Filter, Calendar, MapPin, User, Star, Heart, Coffee, Zap, Moon } from 'lucide-react';
import React from 'react';

const meta: Meta<typeof Chip> = {
  title: 'UI/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['normal', 'fancy'],
    },
    theme: {
      control: 'select',
      options: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    selected: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: {
    children: 'Chip',
  },
};

export const NormalVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-normal mb-3">Unselected State</h3>
        <div className="flex flex-wrap gap-3">
          <Chip variant="normal" theme="primary">Primary</Chip>
          <Chip variant="normal" theme="neutral">Neutral</Chip>
          <Chip variant="normal" theme="success">Success</Chip>
          <Chip variant="normal" theme="warning">Warning</Chip>
          <Chip variant="normal" theme="danger">Danger</Chip>
          <Chip variant="normal" theme="info">Info</Chip>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-normal mb-3">Selected State</h3>
        <div className="flex flex-wrap gap-3">
          <Chip variant="normal" theme="primary" selected>Primary</Chip>
          <Chip variant="normal" theme="neutral" selected>Neutral</Chip>
          <Chip variant="normal" theme="success" selected>Success</Chip>
          <Chip variant="normal" theme="warning" selected>Warning</Chip>
          <Chip variant="normal" theme="danger" selected>Danger</Chip>
          <Chip variant="normal" theme="info" selected>Info</Chip>
        </div>
      </div>
    </div>
  ),
};

export const FancyVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-8 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-normal mb-4">Fancy Chips - Layered Shadow Design</h3>
        <p className="text-sm text-gray-600 mb-6">
          These chips feature a sophisticated layered shadow approach with three distinct layers:
          an outer drop shadow, a border effect, and an inset bottom shadow for depth.
        </p>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-normal mb-3">Unselected State</h4>
            <div className="flex flex-wrap gap-3">
              <Chip variant="fancy" theme="primary">Fancy Badge</Chip>
              <Chip variant="fancy" theme="primary">Advanced Components</Chip>
              <Chip variant="fancy" theme="neutral">Neutral</Chip>
              <Chip variant="fancy" theme="success">Success</Chip>
              <Chip variant="fancy" theme="warning">Warning</Chip>
              <Chip variant="fancy" theme="danger">Danger</Chip>
              <Chip variant="fancy" theme="info">Info</Chip>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-normal mb-3">Selected State</h4>
            <div className="flex flex-wrap gap-3">
              <Chip variant="fancy" theme="primary" selected>Fancy Badge</Chip>
              <Chip variant="fancy" theme="primary" selected>Advanced Components</Chip>
              <Chip variant="fancy" theme="neutral" selected>Neutral</Chip>
              <Chip variant="fancy" theme="success" selected>Success</Chip>
              <Chip variant="fancy" theme="warning" selected>Warning</Chip>
              <Chip variant="fancy" theme="danger" selected>Danger</Chip>
              <Chip variant="fancy" theme="info" selected>Info</Chip>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-normal mb-3">Shadow Layer Breakdown</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Layer 1:</strong> Drop shadow for elevation</p>
          <p>• <strong>Layer 2:</strong> Border shadow for definition</p>
          <p>• <strong>Layer 3:</strong> Inset bottom shadow for depth perception</p>
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
      <Chip size="lg">Large</Chip>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-normal mb-3">Normal Chips with Icons</h3>
        <div className="flex flex-wrap gap-3">
          <Chip icon={<Filter />}>Filter</Chip>
          <Chip icon={<Calendar />} theme="info">Today</Chip>
          <Chip icon={<MapPin />} theme="success">Nearby</Chip>
          <Chip icon={<User />} theme="warning">Profile</Chip>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-normal mb-3">Fancy Chips with Icons</h3>
        <div className="flex flex-wrap gap-3">
          <Chip variant="fancy" icon={<Star />} theme="warning">Featured</Chip>
          <Chip variant="fancy" icon={<Heart />} theme="danger">Favorite</Chip>
          <Chip variant="fancy" icon={<Coffee />} theme="primary">Break</Chip>
          <Chip variant="fancy" icon={<Zap />} theme="success">Fast</Chip>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-normal mb-3">Different Sizes with Icons</h3>
        <div className="flex items-center gap-3">
          <Chip size="sm" icon={<Star />}>Small</Chip>
          <Chip size="md" icon={<Star />}>Medium</Chip>
          <Chip size="lg" icon={<Star />}>Large</Chip>
        </div>
      </div>
    </div>
  ),
};

export const Removable: Story = {
  render: () => {
    const [chips, setChips] = React.useState([
      { id: 1, label: 'JavaScript', theme: 'primary' as const },
      { id: 2, label: 'React', theme: 'info' as const },
      { id: 3, label: 'TypeScript', theme: 'success' as const },
      { id: 4, label: 'Node.js', theme: 'warning' as const },
    ]);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Chip
              key={chip.id}
              theme={chip.theme}
              onRemove={() => setChips(chips.filter(c => c.id !== chip.id))}
            >
              {chip.label}
            </Chip>
          ))}
        </div>
        {chips.length === 0 && (
          <p className="text-sm text-gray-500">All chips removed!</p>
        )}
      </div>
    );
  },
};

export const SelectableChips: Story = {
  render: () => {
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>(['popular']);
    const filters = [
      { id: 'new', label: 'New', icon: <Zap className="h-4 w-4" /> },
      { id: 'popular', label: 'Popular', icon: <Star className="h-4 w-4" /> },
      { id: 'trending', label: 'Trending', icon: <Check className="h-4 w-4" /> },
      { id: 'featured', label: 'Featured', icon: <Heart className="h-4 w-4" /> },
    ];

    const toggleFilter = (filterId: string) => {
      setSelectedFilters(prev =>
        prev.includes(filterId)
          ? prev.filter(id => id !== filterId)
          : [...prev, filterId]
      );
    };

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-normal">Filter by:</h3>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              variant="fancy"
              theme="primary"
              icon={filter.icon}
              selected={selectedFilters.includes(filter.id)}
              onClick={() => toggleFilter(filter.id)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Selected: {selectedFilters.length > 0 ? selectedFilters.join(', ') : 'none'}
        </p>
      </div>
    );
  },
};

export const ChipGroups: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-normal mb-3">Time Range</h3>
        <div className="flex gap-2">
          <Chip variant="normal" size="sm">Today</Chip>
          <Chip variant="normal" size="sm" selected>This Week</Chip>
          <Chip variant="normal" size="sm">This Month</Chip>
          <Chip variant="normal" size="sm">This Year</Chip>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-normal mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <Chip variant="fancy" theme="primary" icon={<Coffee className="h-4 w-4" />}>Coffee</Chip>
          <Chip variant="fancy" theme="info" icon={<Moon className="h-4 w-4" />}>Sleep</Chip>
          <Chip variant="fancy" theme="success" icon={<Heart className="h-4 w-4" />}>Health</Chip>
          <Chip variant="fancy" theme="warning" icon={<Zap className="h-4 w-4" />}>Energy</Chip>
        </div>
      </div>
    </div>
  ),
};