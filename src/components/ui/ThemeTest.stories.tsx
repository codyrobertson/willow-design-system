import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter, ModalClose } from './Modal';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'UI/Theme Test',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllThemes: Story = {
  render: () => {
    const themes = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
    
    return (
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Theme Consistency Test</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Verifying that all components use the 'theme' prop consistently with proper text, border, fill, and shadow styling.
          </p>
        </div>

        {/* Buttons Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Buttons</h3>
          <div className="space-y-4">
            {themes.map(theme => (
              <div key={theme} className="space-y-2">
                <h4 className="text-sm font-medium capitalize">{theme} Theme</h4>
                <div className="flex flex-wrap gap-2">
                  <Button theme={theme} variant="default">Default</Button>
                  <Button theme={theme} variant="secondary">Secondary</Button>
                  <Button theme={theme} variant="outline">Outline</Button>
                  <Button theme={theme} variant="ghost">Ghost</Button>
                  <Button theme={theme} variant="fancy">Fancy</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Badges</h3>
          <div className="space-y-4">
            {themes.map(theme => (
              <div key={theme} className="space-y-2">
                <h4 className="text-sm font-medium capitalize">{theme} Theme</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge theme={theme} variant="default">Solid</Badge>
                  <Badge theme={theme} variant="secondary">Soft</Badge>
                  <Badge theme={theme} variant="outline">Outline</Badge>
                  <Badge theme={theme} variant="default" closable>Closable</Badge>
                  <Badge theme={theme} variant="secondary" dot>With Dot</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Cards with Colored Headers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map(theme => (
              <Card key={theme}>
                <CardHeader theme={theme} variant="colored">
                  <CardTitle>{theme.charAt(0).toUpperCase() + theme.slice(1)} Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    This card has a {theme} colored header with proper theme styling.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

export const InteractiveThemeTest: Story = {
  render: () => {
    const themes = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
    const [selectedTheme, setSelectedTheme] = useState<typeof themes[number]>('primary');
    const [showModal, setShowModal] = useState(false);
    
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Interactive Theme Tester</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Select a theme to see how it applies across all component variants.
          </p>
        </div>

        {/* Theme Selector */}
        <div className="flex gap-2 p-4 bg-neutral-50 rounded-lg">
          {themes.map(theme => (
            <Button
              key={theme}
              theme={theme}
              variant={selectedTheme === theme ? 'fancy' : 'outline'}
              size="sm"
              onClick={() => setSelectedTheme(theme)}
            >
              {theme}
            </Button>
          ))}
        </div>

        {/* Selected Theme Display */}
        <div className="space-y-6 p-6 border rounded-lg">
          <h3 className="text-lg font-medium">
            Current Theme: <span className="capitalize text-primary">{selectedTheme}</span>
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Button Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Button theme={selectedTheme} variant="default">Default</Button>
                <Button theme={selectedTheme} variant="secondary">Secondary</Button>
                <Button theme={selectedTheme} variant="outline">Outline</Button>
                <Button theme={selectedTheme} variant="ghost">Ghost</Button>
                <Button theme={selectedTheme} variant="fancy">Fancy</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Badge Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Badge theme={selectedTheme} variant="default">Solid</Badge>
                <Badge theme={selectedTheme} variant="secondary">Soft</Badge>
                <Badge theme={selectedTheme} variant="outline">Outline</Badge>
                <Badge theme={selectedTheme} variant="default" closable>Closable</Badge>
                <Badge theme={selectedTheme} variant="secondary" dot>With Dot</Badge>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Card with Colored Header</h4>
              <Card className="max-w-sm">
                <CardHeader theme={selectedTheme} variant="colored">
                  <CardTitle>Themed Card Header</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    This card demonstrates the {selectedTheme} theme with proper colors and shadows.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Modal with Colored Header</h4>
              <Button theme={selectedTheme} onClick={() => setShowModal(true)}>
                Open {selectedTheme} Modal
              </Button>
              <Modal open={showModal} onOpenChange={setShowModal}>
                <ModalContent>
                  <ModalHeader theme={selectedTheme} variant="colored">
                    <ModalTitle>{selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)} Modal</ModalTitle>
                  </ModalHeader>
                  <ModalBody>
                    <p>This modal demonstrates the {selectedTheme} theme styling.</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button theme={selectedTheme} onClick={() => setShowModal(false)}>Confirm</Button>
                  </ModalFooter>
                  <ModalClose />
                </ModalContent>
              </Modal>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const ThemeStylingDetails: Story = {
  render: () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Theme Styling Details</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Demonstrating that text, borders, fills, and shadows all work correctly with the theme system.
          </p>
        </div>

        <div className="space-y-6">
          {/* Primary Theme Details */}
          <div className="p-6 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-primary">Primary Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Components:</p>
                <div className="space-y-2">
                  <Button theme="primary" variant="fancy">Fancy Button (with shadows)</Button>
                  <Button theme="primary" variant="outline">Outline (border style)</Button>
                  <Badge theme="primary" variant="default">Solid Badge (fill)</Badge>
                  <Badge theme="primary" variant="secondary">Soft Badge (text color)</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Styling Elements:</p>
                <ul className="text-sm space-y-1">
                  <li>✓ Text colors adapt to theme</li>
                  <li>✓ Border colors match theme</li>
                  <li>✓ Background fills use theme colors</li>
                  <li>✓ Shadows tinted with theme color</li>
                  <li>✓ Hover states maintain theme</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Danger Theme Details */}
          <div className="p-6 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-danger">Danger Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Components:</p>
                <div className="space-y-2">
                  <Button theme="danger" variant="fancy">Fancy Button (with shadows)</Button>
                  <Button theme="danger" variant="outline">Outline (border style)</Button>
                  <Badge theme="danger" variant="default">Solid Badge (fill)</Badge>
                  <Badge theme="danger" variant="secondary">Soft Badge (text color)</Badge>
                </div>
              </div>
              <div>
                <Card>
                  <CardHeader theme="danger" variant="colored">
                    <CardTitle>Danger Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Card with danger theme header</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Success Theme Details */}
          <div className="p-6 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-success">Success Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Components:</p>
                <div className="space-y-2">
                  <Button theme="success" variant="fancy">Fancy Button (with shadows)</Button>
                  <Button theme="success" variant="outline">Outline (border style)</Button>
                  <Badge theme="success" variant="default">Solid Badge (fill)</Badge>
                  <Badge theme="success" variant="secondary">Soft Badge (text color)</Badge>
                </div>
              </div>
              <div>
                <Card>
                  <CardHeader theme="success" variant="colored">
                    <CardTitle>Success Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Card with success theme header</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-neutral-50 rounded-lg">
          <h4 className="font-medium mb-2">Theme Implementation Summary</h4>
          <p className="text-sm text-muted-foreground">
            All components now use the standardized <code className="px-1 py-0.5 bg-white rounded">theme</code> prop 
            instead of <code className="px-1 py-0.5 bg-white rounded">color</code>. This ensures consistency across 
            the design system with proper support for text colors, borders, background fills, and shadows.
          </p>
        </div>
      </div>
    );
  },
};