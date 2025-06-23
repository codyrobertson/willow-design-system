import type { Meta, StoryObj } from '@storybook/nextjs';
import { IconText } from './IconText';
import React from 'react';

const meta: Meta<typeof IconText> = {
  title: 'UI/IconText',
  component: IconText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'text',
    },
    iconStyle: {
      control: 'select',
      options: ['solid', 'regular', 'light', 'thin', 'duotone'],
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconText>;

export const Default: Story = {
  args: {
    icon: 'user',
    children: 'User Profile',
  },
};

export const IconStyles: Story = {
  render: () => (
    <div className="space-y-3">
      <IconText icon="heart" iconStyle="solid">Solid Icon</IconText>
      <IconText icon="heart" iconStyle="regular">Regular Icon</IconText>
      <IconText icon="heart" iconStyle="light">Light Icon</IconText>
      <IconText icon="heart" iconStyle="thin">Thin Icon</IconText>
      <IconText icon="heart" iconStyle="duotone">Duotone Icon</IconText>
    </div>
  ),
};

export const IconPositions: Story = {
  render: () => (
    <div className="space-y-3">
      <IconText icon="arrow-left" iconPosition="left">
        Icon on Left (Default)
      </IconText>
      <IconText icon="arrow-right" iconPosition="right">
        Icon on Right
      </IconText>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-3">
      <IconText icon="star" size="xs">Extra Small</IconText>
      <IconText icon="star" size="sm">Small</IconText>
      <IconText icon="star" size="md">Medium (Default)</IconText>
      <IconText icon="star" size="lg">Large</IconText>
      <IconText icon="star" size="xl">Extra Large</IconText>
    </div>
  ),
};

export const CommonUseCases: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-3">Navigation Items</h3>
        <IconText icon="house">Home</IconText>
        <IconText icon="chart-line">Analytics</IconText>
        <IconText icon="gear">Settings</IconText>
        <IconText icon="user">Profile</IconText>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-3">Status Indicators</h3>
        <IconText icon="circle-check" className="text-success-600">
          Completed
        </IconText>
        <IconText icon="clock" className="text-warning-600">
          In Progress
        </IconText>
        <IconText icon="circle-xmark" className="text-danger">
          Failed
        </IconText>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-3">Actions</h3>
        <IconText icon="download">Download File</IconText>
        <IconText icon="upload">Upload Document</IconText>
        <IconText icon="share" iconPosition="right">
          Share
        </IconText>
        <IconText icon="trash" className="text-danger">
          Delete
        </IconText>
      </div>
    </div>
  ),
};

export const WithCustomStyling: Story = {
  render: () => (
    <div className="space-y-3">
      <IconText 
        icon="star" 
        className="text-warning-600 font-semibold"
      >
        Featured Item
      </IconText>
      
      <IconText 
        icon="shield-check" 
        className="text-success-600 bg-success-50 px-3 py-1 rounded-md"
      >
        Verified Account
      </IconText>
      
      <IconText 
        icon="rocket" 
        className="text-primary-600 text-lg"
        size="lg"
      >
        Premium Plan
      </IconText>
    </div>
  ),
};

export const InButtons: Story = {
  render: () => (
    <div className="flex gap-3">
      <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
        <IconText icon="plus" iconStyle="solid">
          Add New
        </IconText>
      </button>
      
      <button className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50">
        <IconText icon="pencil">
          Edit
        </IconText>
      </button>
      
      <button className="px-4 py-2 text-danger hover:bg-danger/10 rounded-md">
        <IconText icon="trash">
          Delete
        </IconText>
      </button>
    </div>
  ),
};

export const ListExample: Story = {
  render: () => (
    <ul className="space-y-3">
      <li>
        <IconText icon="check" className="text-success-600">
          Free shipping on orders over $50
        </IconText>
      </li>
      <li>
        <IconText icon="check" className="text-success-600">
          30-day money back guarantee
        </IconText>
      </li>
      <li>
        <IconText icon="check" className="text-success-600">
          24/7 customer support
        </IconText>
      </li>
      <li>
        <IconText icon="check" className="text-success-600">
          Secure payment processing
        </IconText>
      </li>
    </ul>
  ),
};

export const SocialLinks: Story = {
  render: () => (
    <div className="flex gap-4">
      <a href="#" className="text-neutral-600 hover:text-neutral-900">
        <IconText icon="facebook" iconStyle="brands">
          Facebook
        </IconText>
      </a>
      <a href="#" className="text-neutral-600 hover:text-neutral-900">
        <IconText icon="twitter" iconStyle="brands">
          Twitter
        </IconText>
      </a>
      <a href="#" className="text-neutral-600 hover:text-neutral-900">
        <IconText icon="linkedin" iconStyle="brands">
          LinkedIn
        </IconText>
      </a>
      <a href="#" className="text-neutral-600 hover:text-neutral-900">
        <IconText icon="github" iconStyle="brands">
          GitHub
        </IconText>
      </a>
    </div>
  ),
};

export const FileTypes: Story = {
  render: () => (
    <div className="space-y-2">
      <IconText icon="file-pdf" className="text-red-600">
        document.pdf
      </IconText>
      <IconText icon="file-excel" className="text-green-600">
        spreadsheet.xlsx
      </IconText>
      <IconText icon="file-word" className="text-blue-600">
        report.docx
      </IconText>
      <IconText icon="file-image" className="text-purple-600">
        photo.jpg
      </IconText>
      <IconText icon="file-video" className="text-orange-600">
        video.mp4
      </IconText>
    </div>
  ),
};