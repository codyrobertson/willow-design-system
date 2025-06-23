'use client';

import { useState } from 'react';
import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Icon } from '@/src/components'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Copy, Check, ExternalLink, Github, BookOpen, Package, ArrowRight } from 'lucide-react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 text-neutral-500 hover:text-neutral-700 bg-white/80 backdrop-blur rounded-md transition-all duration-200 hover:bg-white"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

function CodeBlock({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className="relative group">
      <pre className={`bg-neutral-900 text-neutral-100 p-4 rounded-lg text-sm overflow-x-auto ${className}`}>
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  );
}

export default function QuickStartPage() {
  return (
    <AppLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold text-neutral-900 mb-6 bg-gradient-to-r from-willow-primary-600 to-willow-primary-500 bg-clip-text text-transparent">
            Quick Start Guide
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
            Get up and running with Willow Design System in minutes. Follow this step-by-step guide to install and start using components.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/docs">
              <Button theme="primary" variant="outline" size="lg" leftIcon={<BookOpen />}>
                View Docs
              </Button>
            </Link>
            <Link href="/registry">
              <Button theme="primary" size="lg" leftIcon={<Package />}>
                Browse Components
              </Button>
            </Link>
          </div>
        </section>

        {/* Installation Steps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-neutral-900">Installation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card variant="flat">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-willow-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="package" size="lg" className="text-willow-primary-600" />
                </div>
                <CardTitle>1. Install Package</CardTitle>
                <CardDescription>Add Willow to your project</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <CodeBlock>npm install willow-design-system</CodeBlock>
              </CardContent>
            </Card>

            <Card variant="flat">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="palette" size="lg" className="text-info-600" />
                </div>
                <CardTitle>2. Import Fonts</CardTitle>
                <CardDescription>Use our custom Codec Pro font</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <CodeBlock>{`<link 
  rel="stylesheet" 
  href="https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css"
/>`}</CodeBlock>
              </CardContent>
            </Card>

            <Card variant="flat">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="rocket" size="lg" className="text-success-600" />
                </div>
                <CardTitle>3. Use Components</CardTitle>
                <CardDescription>Import and use our components</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <CodeBlock>{`import { Button } from 'willow-design-system'

<Button theme="primary">
  Click me
</Button>`}</CodeBlock>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Setup */}
        <section className="mb-16">
          <Card variant="flat" className="border-2 border-neutral-200">
            <CardHeader className="bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-2xl">Complete Setup Guide</CardTitle>
              <CardDescription className="text-base">
                Detailed instructions for setting up Willow Design System in your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-willow-primary-100 rounded-full flex items-center justify-center text-willow-primary-700 font-bold text-sm">1</span>
                  Install Dependencies
                </h3>
                <p className="text-neutral-600 mb-4">
                  Install the required peer dependencies for the design system to work properly.
                </p>
                <CodeBlock>npm install class-variance-authority clsx tailwind-merge lucide-react</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-willow-primary-100 rounded-full flex items-center justify-center text-willow-primary-700 font-bold text-sm">2</span>
                  Add the CN Utility
                </h3>
                <p className="text-neutral-600 mb-4">
                  Create a utility function for combining CSS classes efficiently.
                </p>
                <CodeBlock>{`// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-willow-primary-100 rounded-full flex items-center justify-center text-willow-primary-700 font-bold text-sm">3</span>
                  Configure Tailwind CSS
                </h3>
                <p className="text-neutral-600 mb-4">
                  Update your Tailwind configuration to include the design system styles.
                </p>
                <CodeBlock>{`// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./node_modules/willow-design-system/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        willow: {
          primary: {
            50: '#f0f9ff',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            900: '#1e3a8a',
          }
        }
      }
    }
  }
}`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-willow-primary-100 rounded-full flex items-center justify-center text-willow-primary-700 font-bold text-sm">4</span>
                  Import Components
                </h3>
                <p className="text-neutral-600 mb-4">
                  Start using components in your React application.
                </p>
                <CodeBlock>{`import { Button, Card, Badge } from 'willow-design-system'

function MyComponent() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Welcome</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>Get started with Willow components!</p>
        <Button theme="primary">
          Get Started
        </Button>
      </Card.Content>
    </Card>
  )
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-neutral-900">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="flat" className="group hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Explore Components</CardTitle>
                    <CardDescription className="mt-2">
                      Browse all available components with live examples and documentation
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-willow-primary-100 rounded-lg group-hover:bg-willow-primary-200 transition-colors">
                    <BookOpen className="w-5 h-5 text-willow-primary-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/docs">
                  <Button theme="primary" className="w-full">
                    View Documentation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card variant="flat" className="group hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Component Registry</CardTitle>
                    <CardDescription className="mt-2">
                      Access individual components and their source code
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-info-100 rounded-lg group-hover:bg-info-200 transition-colors">
                    <Package className="w-5 h-5 text-info-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/registry">
                  <Button theme="primary" variant="outline" className="w-full">
                    Browse Registry
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Additional Resources */}
        <section>
          <Card variant="flat" className="bg-gradient-to-r from-neutral-50 to-neutral-100">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-neutral-900">Need Help?</h2>
              <p className="text-neutral-600 mb-6">
                Check out these additional resources to get the most out of Willow Design System.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="http://localhost:6006" target="_blank">
                  <Button theme="primary" variant="ghost" leftIcon={<ExternalLink />}>
                    Storybook
                  </Button>
                </Link>
                <Link href="https://github.com/your-org/willow-design-system" target="_blank">
                  <Button theme="primary" variant="ghost" leftIcon={<Github />}>
                    GitHub
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </AppLayout>
  )
}