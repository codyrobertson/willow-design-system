import type { Meta, StoryObj } from '@storybook/nextjs';
import { Icon } from './Icon';
import { IconText } from './IconText';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

const meta = {
  title: 'UI/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic icon usage
export const Basic: Story = {
  args: {
    name: 'user',
    size: 'md',
  },
};

// Icon sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icon name="user" size="xs" />
      <Icon name="user" size="sm" />
      <Icon name="user" size="md" />
      <Icon name="user" size="lg" />
      <Icon name="user" size="xl" />
      <Icon name="user" size="2xl" />
      <Icon name="user" size="3xl" />
    </div>
  ),
};

// Icon with text
export const WithText: Story = {
  render: () => (
    <div className="space-y-4">
      <IconText icon="download">Download File</IconText>
      <IconText icon="settings" iconPosition="right">Settings</IconText>
      <IconText icon="check" className="text-success">Success Message</IconText>
      <IconText icon="alert-circle" className="text-destructive">Error Message</IconText>
    </div>
  ),
};

// Icon buttons
export const IconButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button size="compact" variant="outline" aria-label="Settings">
        <Icon name="settings" />
      </Button>
      <Button size="compact" variant="ghost" aria-label="More options">
        <Icon name="more-vertical" />
      </Button>
      <Button size="compact" variant="default" aria-label="Add item">
        <Icon name="plus" />
      </Button>
      <Button size="compact" variant="outline" className="rounded-full" aria-label="User profile">
        <Icon name="user" />
      </Button>
    </div>
  ),
};

// Button with icons
export const ButtonWithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <Button leftIcon={<Icon name="download" />}>
        Download
      </Button>
      <Button rightIcon={<Icon name="arrow-right" />}>
        Continue
      </Button>
      <Button leftIcon={<Icon name="mail" />} rightIcon={<Icon name="external-link" />}>
        Send Email
      </Button>
    </div>
  ),
};

// Icons with badges
export const WithBadges: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="relative">
        <Icon name="bell" size="lg" />
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0" variant="destructive">
          3
        </Badge>
      </div>
      <div className="relative">
        <Button size="compact" variant="ghost">
          <Icon name="shopping-cart" />
        </Button>
        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0" variant="default">
          9
        </Badge>
      </div>
    </div>
  ),
};

// Icon containers (using composition)
export const IconContainers: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-willow-primary-100">
        <Icon name="star" className="text-willow-primary-600" />
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 shadow-sm">
        <Icon name="heart" />
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-willow-primary-400 to-willow-primary-600 text-white shadow-md">
        <Icon name="zap" />
      </div>
    </div>
  ),
};

// Loading states
export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Button loading>
        Loading...
      </Button>
      <div className="flex items-center gap-2 text-neutral-600">
        <Icon name="loader-2" className="animate-spin" />
        <span>Processing...</span>
      </div>
    </div>
  ),
};

// Icon lists
export const IconLists: Story = {
  render: () => (
    <Card className="w-64">
      <CardHeader>
        <CardTitle>Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <IconText icon="check" className="text-success">
          Unlimited projects
        </IconText>
        <IconText icon="check" className="text-success">
          Priority support
        </IconText>
        <IconText icon="check" className="text-success">
          Advanced analytics
        </IconText>
        <IconText icon="x" className="text-neutral-400">
          Custom branding
        </IconText>
      </CardContent>
    </Card>
  ),
};

// Complex compositions
export const ComplexCompositions: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Notification item */}
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info-100">
          <Icon name="bell" className="text-info-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">New message received</h3>
          <p className="text-sm text-muted-foreground">You have a new message from John Doe</p>
        </div>
        <Button size="sm" variant="ghost">
          <Icon name="x" size="sm" />
        </Button>
      </div>

      {/* User avatars stack */}
      <div className="flex -space-x-2">
        {['user', 'users', 'user-check'].map((icon, i) => (
          <div
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-neutral-200"
          >
            <Icon name={icon as any} />
          </div>
        ))}
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-sm font-medium">
          +3
        </div>
      </div>
    </div>
  ),
};