'use client';

import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/src/components/ui';
import { AppLayout } from '@/src/components/layout/AppLayout';
import { Code2, Palette, Package, Rocket } from 'lucide-react';

export default function RegistryPage() {
  const components = [
    // Core Components
    { name: 'Accordion', count: 1, category: 'Core' },
    { name: 'Avatar', count: 2, category: 'Core' },
    { name: 'Badge', count: 1, category: 'Core' },
    { name: 'Button', count: 6, category: 'Core' },
    { name: 'Card', count: 5, category: 'Core' },
    { name: 'Chip', count: 1, category: 'Core' },
    { name: 'Icon', count: 1, category: 'Core' },
    { name: 'IconText', count: 1, category: 'Core' },
    { name: 'List', count: 1, category: 'Core' },
    { name: 'Modal', count: 1, category: 'Core' },
    { name: 'Skeleton', count: 1, category: 'Core' },
    { name: 'Tabs', count: 6, category: 'Core' },
    { name: 'Tag', count: 1, category: 'Core' },
    { name: 'Toast', count: 1, category: 'Core' },
    { name: 'Tooltip', count: 1, category: 'Core' },
    
    // Form Components
    { name: 'Checkbox', count: 1, category: 'Form' },
    { name: 'FormCard', count: 1, category: 'Form' },
    { name: 'FormField', count: 1, category: 'Form' },
    { name: 'Input', count: 1, category: 'Form' },
    { name: 'Label', count: 1, category: 'Form' },
    { name: 'Select', count: 1, category: 'Form' },
    { name: 'SimpleForm', count: 1, category: 'Form' },
    { name: 'Switch', count: 1, category: 'Form' },
    { name: 'Textarea', count: 1, category: 'Form' },
    
    // Special Components
    { name: 'ErrorBoundary', count: 1, category: 'Special' },
    { name: 'FancyButton', count: 1, category: 'Special' },
    { name: 'GradientBG', count: 1, category: 'Special' },
    { name: 'Highlight', count: 1, category: 'Special' },
    { name: 'InfoCard', count: 1, category: 'Special' },
    { name: 'Logo', count: 1, category: 'Special' },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Willow Design System Registry
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A modern, accessible component library built with React and Tailwind CSS.
            Fully compatible with shadcn/ui.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <Card variant="raised">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-willow-primary-100 rounded-lg">
                  <Code2 className="w-6 h-6 text-willow-primary-700" />
                </div>
              </div>
              <CardTitle>Easy Installation</CardTitle>
              <CardDescription>
                Install components using the shadcn CLI or copy them directly into your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-neutral-100 p-2 rounded block">
                npx shadcn@latest add willow/button
              </code>
            </CardContent>
          </Card>

          <Card variant="raised">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-info-100 rounded-lg">
                  <Palette className="w-6 h-6 text-info-700" />
                </div>
              </div>
              <CardTitle>Customizable Themes</CardTitle>
              <CardDescription>
                Multiple color themes and variants to match your brand identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 justify-center">
                <Badge theme="primary">Primary</Badge>
                <Badge theme="danger">Danger</Badge>
                <Badge theme="warning">Warning</Badge>
                <Badge theme="info">Info</Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="raised">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-700" />
                </div>
              </div>
              <CardTitle>16+ Components</CardTitle>
              <CardDescription>
                Everything you need to build modern web applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <span className="text-2xl font-bold text-neutral-900">
                  {components.length}
                </span>
                <span className="text-muted-foreground ml-2">Components</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get up and running with Willow Design System in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">1. Initialize shadcn in your project</h3>
              <code className="text-sm bg-neutral-100 p-3 rounded block">
                npx shadcn@latest init
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Add the Willow registry</h3>
              <pre className="text-sm bg-neutral-100 p-3 rounded overflow-x-auto">
{`// components.json
{
  "registries": [
    {
      "name": "willow",
      "url": "https://iridescent-brigadeiros-fe4174.netlify.app/api/registry"
    }
  ]
}`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Install components</h3>
              <code className="text-sm bg-neutral-100 p-3 rounded block">
                npx shadcn@latest add willow/card willow/button willow/input
              </code>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Available Components</CardTitle>
            <CardDescription>
              All components are built with accessibility and customization in mind
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {['Core', 'Form', 'Special'].map(category => (
                <div key={category}>
                  <h3 className="font-semibold text-lg mb-3">{category} Components</h3>
                  <div className="space-y-2">
                    {components
                      .filter(c => c.category === category)
                      .map(component => (
                        <div key={component.name} className="flex items-center justify-between p-2 rounded hover:bg-neutral-100">
                          <span className="text-sm">{component.name}</span>
                          <Badge variant="secondary" size="sm">
                            {component.count === 1 ? '1 variant' : `${component.count} variants`}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-neutral-900">Ready to get started?</h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/button-demo">
              <Button theme="primary" size="lg">
                <Rocket className="w-4 h-4 mr-2" />
                View Demo
              </Button>
            </Link>
            <Link href="http://localhost:6006" target="_blank">
              <Button theme="primary" variant="outline" size="lg">
                <Package className="w-4 h-4 mr-2" />
                Browse in Storybook
              </Button>
            </Link>
            <Link href="https://github.com/your-org/willow-design-system" target="_blank">
              <Button theme="dark" variant="ghost" size="lg">
                <Code2 className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        <Card variant="outlined" className="mt-12">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Access the component registry programmatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold mb-1">Full Registry</p>
                <code className="text-sm bg-neutral-100 p-2 rounded block">
                  GET /api/registry
                </code>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Individual Component</p>
                <code className="text-sm bg-neutral-100 p-2 rounded block">
                  GET /api/registry/[component-name]
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}