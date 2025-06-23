'use client';

import { useState } from 'react';
import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Logo, Icon } from '@/src/components'
import { Copy, Check, ExternalLink, Github, BookOpen, Package, ChevronRight } from 'lucide-react';

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

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo size="md" />
            <nav className="flex gap-2">
              <Link href="/registry">
                <Button variant="ghost" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Registry
                </Button>
              </Link>
              <Link href="/storybook" target="_blank">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Storybook
                </Button>
              </Link>
              <Link href="https://github.com/your-org/willow-design-system" target="_blank">
                <Button variant="ghost" size="sm">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-neutral-900 mb-6 bg-gradient-to-r from-willow-primary-600 to-willow-primary-500 bg-clip-text text-transparent">
            Build Beautiful Interfaces
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
            A modern, accessible, and customizable component library built with React and Tailwind CSS. 
            Designed to accelerate your development workflow.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/registry">
              <Button theme="primary" size="lg">
                Browse Components
              </Button>
            </Link>
            <Link href="#quick-start">
              <Button theme="primary" variant="outline" size="lg">
                Quick Start
              </Button>
            </Link>
          </div>
        </section>

        {/* Getting Started Cards */}
        <section className="mb-16" id="quick-start">
          <h2 className="text-3xl font-bold mb-8 text-neutral-900">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-willow-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="package" size="lg" className="text-willow-primary-600" />
                </div>
                <CardTitle>Install</CardTitle>
                <CardDescription>Add Willow to your project</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <CodeBlock>npm install willow-design-system</CodeBlock>
              </CardContent>
            </Card>

            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="palette" size="lg" className="text-info-600" />
                </div>
                <CardTitle>Import Fonts</CardTitle>
                <CardDescription>Use our custom Codec Pro font</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <CodeBlock>{`<link 
  rel="stylesheet" 
  href="https://willow-design-system.vercel.app/cdn/fonts/codec-pro.css"
/>`}</CodeBlock>
              </CardContent>
            </Card>

            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="rocket" size="lg" className="text-success-600" />
                </div>
                <CardTitle>Use Components</CardTitle>
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

        {/* Resources Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-neutral-900">Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="raised" className="group hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Component Library</CardTitle>
                    <CardDescription className="mt-2">
                      Explore all components in our interactive Storybook
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-willow-primary-100 rounded-lg group-hover:bg-willow-primary-200 transition-colors">
                    <BookOpen className="w-5 h-5 text-willow-primary-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/storybook" target="_blank">
                  <Button theme="primary" className="w-full">
                    Open Storybook
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card variant="raised" className="group hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Component Registry</CardTitle>
                    <CardDescription className="mt-2">
                      Access individual components via our registry API
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
                    View Registry
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-neutral-900">Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'React 18+ Support', name: 'atom', colorClass: 'text-willow-primary-600' },
              { label: 'TypeScript', name: 'file-code-2', colorClass: 'text-info-600' },
              { label: 'Tailwind CSS', name: 'palette', colorClass: 'text-success-600' },
              { label: 'Accessible', name: 'accessibility', colorClass: 'text-warning-600' },
              { label: 'Theme Support', name: 'paintbrush', colorClass: 'text-danger-600' },
              { label: 'Tree Shakeable', name: 'tree-pine', colorClass: 'text-willow-primary-600' },
              { label: 'Server Components', name: 'server', colorClass: 'text-info-600' },
              { label: 'Custom Fonts', name: 'type', colorClass: 'text-success-600' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-3"
              >
                <Icon name={feature.name} size="md" className={feature.colorClass} />
                <span className="text-sm font-medium text-neutral-700">{feature.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Installation Guide */}
        <section className="mb-16">
          <Card variant="flat" className="border-2 border-neutral-200">
            <CardHeader className="bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-2xl">Complete Installation Guide</CardTitle>
              <CardDescription className="text-base">
                Get up and running with Willow Design System in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-willow-primary-100 rounded-full flex items-center justify-center text-willow-primary-700 font-bold text-sm">1</span>
                  Install Dependencies
                </h3>
                <CodeBlock>npm install class-variance-authority clsx tailwind-merge lucide-react</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-willow-primary-100 rounded-full flex items-center justify-center text-willow-primary-700 font-bold text-sm">2</span>
                  Add the cn utility
                </h3>
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
                  Configure Tailwind
                </h3>
                <CodeBlock>{`// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/willow-design-system/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        willow: {
          primary: { /* your colors */ }
        }
      }
    }
  }
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}