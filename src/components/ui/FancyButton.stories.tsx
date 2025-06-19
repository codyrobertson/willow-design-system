import type { Meta, StoryObj } from '@storybook/react'
import { FancyButton } from './FancyButton'
import { FA6Icon } from './FA6Icon'

const meta = {
  title: 'UI/FancyButton',
  component: FancyButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof FancyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

export const WithLeftIcon: Story = {
  args: {
    children: 'Download',
    leftIcon: <FA6Icon name="download" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Next',
    rightIcon: <FA6Icon name="arrow-right" />,
  },
}

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <FancyButton size="xs">Extra Small</FancyButton>
      <FancyButton size="sm">Small</FancyButton>
      <FancyButton size="md">Medium</FancyButton>
      <FancyButton size="lg">Large</FancyButton>
      <FancyButton size="xl">Extra Large</FancyButton>
    </div>
  ),
}