import type { Meta, StoryObj } from '@storybook/nextjs';
import { Switch } from './Switch';
import { Label } from './Label';
import React, { useState } from 'react';
import { Moon, Sun, Bell, Mail, Shield, Wifi } from 'lucide-react';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch size="sm" />
        <span className="text-sm">Small</span>
      </div>
      <div className="flex items-center gap-3">
        <Switch size="md" />
        <span className="text-sm">Medium (Default)</span>
      </div>
      <div className="flex items-center gap-3">
        <Switch size="lg" />
        <span className="text-sm">Large</span>
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch id="airplane" />
        <Label htmlFor="airplane" className="cursor-pointer">
          Airplane Mode
        </Label>
      </div>
      
      <div className="flex items-center justify-between w-64">
        <Label htmlFor="notifications" className="cursor-pointer">
          Enable Notifications
        </Label>
        <Switch id="notifications" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch defaultChecked />
        <span className="text-sm">Checked</span>
      </div>
      <div className="flex items-center gap-3">
        <Switch />
        <span className="text-sm">Unchecked</span>
      </div>
      <div className="flex items-center gap-3">
        <Switch disabled />
        <span className="text-sm">Disabled (Off)</span>
      </div>
      <div className="flex items-center gap-3">
        <Switch disabled defaultChecked />
        <span className="text-sm">Disabled (On)</span>
      </div>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [isOn, setIsOn] = useState(false);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={isOn}
            onCheckedChange={setIsOn}
            id="controlled"
          />
          <Label htmlFor="controlled" className="cursor-pointer">
            Toggle me
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          The switch is {isOn ? 'ON' : 'OFF'}
        </p>
      </div>
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [darkMode, setDarkMode] = useState(false);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between w-64 p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            <Label htmlFor="theme" className="cursor-pointer">
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </Label>
          </div>
          <Switch
            id="theme"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>
      </div>
    );
  },
};

export const SettingsExample: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      notifications: true,
      emails: false,
      security: true,
      wifi: true,
    });
    
    const updateSetting = (key: keyof typeof settings) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    return (
      <div className="w-80 space-y-1">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        
        <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-neutral-600" />
            <div>
              <Label htmlFor="notifications" className="cursor-pointer">
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive push notifications
              </p>
            </div>
          </div>
          <Switch
            id="notifications"
            checked={settings.notifications}
            onCheckedChange={() => updateSetting('notifications')}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-neutral-600" />
            <div>
              <Label htmlFor="emails" className="cursor-pointer">
                Email Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive email notifications
              </p>
            </div>
          </div>
          <Switch
            id="emails"
            checked={settings.emails}
            onCheckedChange={() => updateSetting('emails')}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-neutral-600" />
            <div>
              <Label htmlFor="security" className="cursor-pointer">
                Two-Factor Auth
              </Label>
              <p className="text-xs text-muted-foreground">
                Extra security for your account
              </p>
            </div>
          </div>
          <Switch
            id="security"
            checked={settings.security}
            onCheckedChange={() => updateSetting('security')}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-neutral-600" />
            <div>
              <Label htmlFor="wifi" className="cursor-pointer">
                Auto-Connect WiFi
              </Label>
              <p className="text-xs text-muted-foreground">
                Connect to known networks
              </p>
            </div>
          </div>
          <Switch
            id="wifi"
            checked={settings.wifi}
            onCheckedChange={() => updateSetting('wifi')}
          />
        </div>
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      marketing: false,
      analytics: true,
      necessary: true,
    });
    
    return (
      <form className="w-96 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Cookie Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <Label htmlFor="necessary" className="cursor-pointer font-medium">
                  Necessary Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Required for the website to function properly
                </p>
              </div>
              <Switch
                id="necessary"
                checked={formData.necessary}
                disabled
              />
            </div>
            
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <Label htmlFor="analytics" className="cursor-pointer font-medium">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Help us understand how visitors use our website
                </p>
              </div>
              <Switch
                id="analytics"
                checked={formData.analytics}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, analytics: checked })
                }
              />
            </div>
            
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <Label htmlFor="marketing" className="cursor-pointer font-medium">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Used to deliver personalized advertisements
                </p>
              </div>
              <Switch
                id="marketing"
                checked={formData.marketing}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, marketing: checked })
                }
              />
            </div>
          </div>
        </div>
      </form>
    );
  },
};