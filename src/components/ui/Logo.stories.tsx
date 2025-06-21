import type { Meta, StoryObj } from '@storybook/nextjs';
import { Logo } from './Logo';

const meta: Meta<typeof Logo> = {
  title: 'UI/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the rendered logo',
    },
    lockup: {
      control: 'select',
      options: ['logomark', 'wordmark', 'full'],
      description: 'Which part of the logo to show',
    },
    variant: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Theme variant for different backgrounds',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {
    size: 'md',
    lockup: 'full',
    variant: 'light',
  },
};

export const Lockups: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Logo Lockup Variations</h3>
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-neutral-50 p-8 rounded-lg mb-2">
              <Logo lockup="logomark" size="md" />
            </div>
            <p className="text-sm text-gray-600">Logomark Only</p>
            <p className="text-xs text-gray-500 mt-1">Icon without text</p>
          </div>
          <div className="text-center">
            <div className="bg-neutral-50 p-8 rounded-lg mb-2">
              <Logo lockup="wordmark" size="md" />
            </div>
            <p className="text-sm text-gray-600">Wordmark Only</p>
            <p className="text-xs text-gray-500 mt-1">Text without icon</p>
          </div>
          <div className="text-center">
            <div className="bg-neutral-50 p-8 rounded-lg mb-2">
              <Logo lockup="full" size="md" />
            </div>
            <p className="text-sm text-gray-600">Full Logo</p>
            <p className="text-xs text-gray-500 mt-1">Icon + text combination</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Size Variations - Full Logo</h3>
        <div className="flex items-center gap-8 p-4 bg-neutral-50 rounded-lg">
          <div className="text-center">
            <Logo size="sm" lockup="full" />
            <p className="text-xs text-gray-600 mt-2">Small (94x24)</p>
          </div>
          <div className="text-center">
            <Logo size="md" lockup="full" />
            <p className="text-xs text-gray-600 mt-2">Medium (126x32)</p>
          </div>
          <div className="text-center">
            <Logo size="lg" lockup="full" />
            <p className="text-xs text-gray-600 mt-2">Large (157x40)</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-normal mb-4">Size Variations - Logomark Only</h3>
        <div className="flex items-center gap-8 p-4 bg-neutral-50 rounded-lg">
          <div className="text-center">
            <Logo size="sm" lockup="logomark" />
            <p className="text-xs text-gray-600 mt-2">Small</p>
          </div>
          <div className="text-center">
            <Logo size="md" lockup="logomark" />
            <p className="text-xs text-gray-600 mt-2">Medium</p>
          </div>
          <div className="text-center">
            <Logo size="lg" lockup="logomark" />
            <p className="text-xs text-gray-600 mt-2">Large</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Theme Variants</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Logo variant="light" size="lg" />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">Light variant (for light backgrounds)</p>
          </div>
          <div>
            <div className="bg-oxford-blue-950 p-8 rounded-lg">
              <Logo variant="dark" size="lg" />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">Dark variant (for dark backgrounds)</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const UsageExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Common Usage Patterns</h3>
        <div className="space-y-6">
          {/* Navigation Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Logo size="md" lockup="full" />
              <nav className="flex gap-6">
                <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">Services</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
              </nav>
            </div>
            <p className="text-xs text-gray-500 mt-4">Navigation header with full logo</p>
          </div>

          {/* Mobile Navigation */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Logo size="sm" lockup="logomark" />
              <button className="p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">Mobile header with logomark only</p>
          </div>

          {/* Dark Footer */}
          <div className="bg-oxford-blue-950 rounded-lg p-8">
            <div className="text-center">
              <Logo size="lg" variant="dark" lockup="full" />
              <p className="text-gray-400 mt-4">© 2024 Willow Health. All rights reserved.</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">Footer with dark variant</p>
          </div>

          {/* Loading State */}
          <div className="bg-neutral-50 rounded-lg p-12">
            <div className="flex items-center justify-center">
              <Logo size="md" lockup="logomark" className="animate-pulse" />
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Loading state with logomark</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ResponsiveExample: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-normal mb-4">Responsive Logo Usage</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            {/* Show logomark on mobile, full logo on desktop */}
            <div>
              <div className="block sm:hidden">
                <Logo size="sm" lockup="logomark" />
              </div>
              <div className="hidden sm:block">
                <Logo size="md" lockup="full" />
              </div>
            </div>
            <span className="text-sm text-gray-600">Resize window to see responsive behavior</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Common pattern: Show logomark only on mobile devices to save space, 
          and full logo on larger screens.
        </p>
      </div>
    </div>
  ),
};

export const BackgroundVariations: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-8 bg-gradient-to-br from-willow-primary-50 to-willow-primary-100 rounded-lg flex items-center justify-center">
        <Logo size="lg" lockup="full" />
      </div>
      <div className="p-8 bg-gradient-to-br from-willow-primary-900 to-willow-primary-950 rounded-lg flex items-center justify-center">
        <Logo size="lg" variant="dark" lockup="full" />
      </div>
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
        <Logo size="lg" lockup="logomark" />
      </div>
      <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
        <Logo size="lg" variant="dark" lockup="logomark" />
      </div>
    </div>
  ),
};