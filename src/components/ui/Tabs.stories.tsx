import type { Meta, StoryObj } from '@storybook/nextjs';
import { Tabs, TabsList, TabsTrigger, TabsContent, StyledTabsList, StyledTabsTrigger } from './Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Switch } from './Switch';
import React, { useState } from 'react';
import { User, CreditCard, Bell, Shield, Code, Palette, Package } from 'lucide-react';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <Card>
          <CardHeader>
            <CardTitle>Tab 1 Content</CardTitle>
            <CardDescription>This is the content for the first tab.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="tab2">
        <Card>
          <CardHeader>
            <CardTitle>Tab 2 Content</CardTitle>
            <CardDescription>This is the content for the second tab.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="tab3">
        <Card>
          <CardHeader>
            <CardTitle>Tab 3 Content</CardTitle>
            <CardDescription>This is the content for the third tab.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="tab1" orientation="vertical" className="w-[600px] h-[300px]">
      <TabsList>
        <TabsTrigger value="tab1">General</TabsTrigger>
        <TabsTrigger value="tab2">Security</TabsTrigger>
        <TabsTrigger value="tab3">Notifications</TabsTrigger>
        <TabsTrigger value="tab4">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage your general account settings.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="tab2" className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure your security preferences.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="tab3" className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Choose how you receive notifications.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="tab4" className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Advanced configuration options.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const UnderlineStyle: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[600px]">
      <StyledTabsList variant="underline" className="w-full">
        <StyledTabsTrigger value="overview" variant="underline">Overview</StyledTabsTrigger>
        <StyledTabsTrigger value="analytics" variant="underline">Analytics</StyledTabsTrigger>
        <StyledTabsTrigger value="reports" variant="underline">Reports</StyledTabsTrigger>
        <StyledTabsTrigger value="notifications" variant="underline">Notifications</StyledTabsTrigger>
      </StyledTabsList>
      <TabsContent value="overview">
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">Overview</h3>
          <p className="text-muted-foreground">
            Welcome to your dashboard. Here you can see an overview of your account activity.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-muted-foreground">
            View detailed analytics and insights about your performance.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">Reports</h3>
          <p className="text-muted-foreground">
            Generate and download comprehensive reports.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">Notifications</h3>
          <p className="text-muted-foreground">
            Manage your notification preferences and history.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const PillsStyle: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-[500px]">
      <StyledTabsList variant="pills">
        <StyledTabsTrigger value="all" variant="pills">All</StyledTabsTrigger>
        <StyledTabsTrigger value="active" variant="pills">Active</StyledTabsTrigger>
        <StyledTabsTrigger value="draft" variant="pills">Draft</StyledTabsTrigger>
        <StyledTabsTrigger value="archived" variant="pills">Archived</StyledTabsTrigger>
      </StyledTabsList>
      <TabsContent value="all">
        <div className="mt-4 space-y-2">
          <div className="p-3 border rounded-lg">All items (24)</div>
        </div>
      </TabsContent>
      <TabsContent value="active">
        <div className="mt-4 space-y-2">
          <div className="p-3 border rounded-lg">Active items (12)</div>
        </div>
      </TabsContent>
      <TabsContent value="draft">
        <div className="mt-4 space-y-2">
          <div className="p-3 border rounded-lg">Draft items (7)</div>
        </div>
      </TabsContent>
      <TabsContent value="archived">
        <div className="mt-4 space-y-2">
          <div className="p-3 border rounded-lg">Archived items (5)</div>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="billing" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="h-4 w-4" />
          Alerts
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account profile details.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="billing">
        <Card>
          <CardHeader>
            <CardTitle>Billing & Payments</CardTitle>
            <CardDescription>Manage your billing information and payment methods.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you want to receive.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Keep your account secure with these settings.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="messages" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="messages" className="gap-2">
          Messages
          <Badge size="sm" className="ml-1">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="requests" className="gap-2">
          Requests
          <Badge size="sm" color="warning" className="ml-1">12</Badge>
        </TabsTrigger>
        <TabsTrigger value="archived">
          Archived
        </TabsTrigger>
      </TabsList>
      <TabsContent value="messages">
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>You have 3 unread messages.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="requests">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>You have 12 pending requests to review.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="archived">
        <Card>
          <CardHeader>
            <CardTitle>Archived</CardTitle>
            <CardDescription>Previously archived conversations.</CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab('tab1')}
          >
            Go to Tab 1
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab('tab2')}
          >
            Go to Tab 2
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab('tab3')}
          >
            Go to Tab 3
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Card>
              <CardContent className="pt-6">
                <p>Current tab: {activeTab}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab2">
            <Card>
              <CardContent className="pt-6">
                <p>Current tab: {activeTab}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab3">
            <Card>
              <CardContent className="pt-6">
                <p>Current tab: {activeTab}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
};

export const SettingsExample: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-[700px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Manage your general account settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="Tell us about yourself" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="privacy">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control your privacy and data sharing preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to others
                </p>
              </div>
              <Switch id="profile-visibility" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-activity">Show Activity Status</Label>
                <p className="text-sm text-muted-foreground">
                  Let others see when you're active
                </p>
              </div>
              <Switch id="show-activity" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="data-collection">Data Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to collect usage data
                </p>
              </div>
              <Switch id="data-collection" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how and when you want to be notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications
                </p>
              </div>
              <Switch id="push-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive marketing and promotional emails
                </p>
              </div>
              <Switch id="marketing-emails" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const CodeExample: Story = {
  render: () => (
    <Tabs defaultValue="preview" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="preview" className="gap-2">
          <Palette className="h-4 w-4" />
          Preview
        </TabsTrigger>
        <TabsTrigger value="code" className="gap-2">
          <Code className="h-4 w-4" />
          Code
        </TabsTrigger>
        <TabsTrigger value="usage" className="gap-2">
          <Package className="h-4 w-4" />
          Usage
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <Card>
          <CardContent className="pt-6">
            <Button>Example Button</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="code">
        <Card>
          <CardContent className="pt-6">
            <pre className="p-4 bg-neutral-100 rounded-lg overflow-x-auto">
              <code>{`<Button>Example Button</Button>`}</code>
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="usage">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Import the Button component and use it in your application:
            </p>
            <pre className="mt-2 p-4 bg-neutral-100 rounded-lg overflow-x-auto">
              <code>{`import { Button } from '@/components/ui/Button'`}</code>
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};