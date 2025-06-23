'use client';

import { useState } from 'react';
import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, List, ListItem, ListItemContent, Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { componentDocs, getCategories, getComponentsByCategory, type ComponentDocumentation } from '@/src/lib/componentDocs'
import { Copy, Check, BookOpen, Package, ChevronRight, Zap, Code2, Eye, Settings } from 'lucide-react';

// Note: CopyButton is defined but not currently used in this component.
// It's available for future copy functionality implementation.
// function CopyButton({ text }: { text: string }) {
//   const [copied, setCopied] = useState(false);

//   const handleCopy = async () => {
//     await navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   return (
//     <button
//       onClick={handleCopy}
//       className="absolute top-2 right-2 p-2 text-neutral-500 hover:text-neutral-700 bg-white/80 backdrop-blur rounded-md transition-all duration-200 hover:bg-white"
//       aria-label="Copy to clipboard"
//     >
//       {copied ? (
//         <Check className="w-4 h-4 text-green-600" />
//       ) : (
//         <Copy className="w-4 h-4" />
//       )}
//     </button>
//   );
// }


function ComponentDocSection({ component }: { component: ComponentDocumentation }) {
  const [copiedExample, setCopiedExample] = useState<number | null>(null);

  const handleCopyExample = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedExample(index);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const renderLiveExample = (componentName: string, exampleTitle: string) => {
    // Render actual component examples based on component name and example
    switch (componentName) {
      case 'Button':
        switch (exampleTitle) {
          case 'Basic Usage':
            return <Button>Click me</Button>;
          case 'Themed Buttons':
            return (
              <div className="flex gap-3">
                <Button theme="primary">Primary</Button>
                <Button theme="danger">Danger</Button>
                <Button theme="success">Success</Button>
              </div>
            );
          case 'Button with Icons':
            return (
              <Button leftIcon={<Settings />} rightIcon={<ChevronRight />}>
                Launch
              </Button>
            );
          case 'Loading State':
            return <Button loading>Processing...</Button>;
          default:
            return null;
        }
      case 'Badge':
        switch (exampleTitle) {
          case 'Basic Badge':
            return <Badge>Default Badge</Badge>;
          case 'Themed Badges':
            return (
              <div className="flex gap-2">
                <Badge theme="primary">Primary</Badge>
                <Badge theme="success">Success</Badge>
                <Badge theme="warning">Warning</Badge>
              </div>
            );
          default:
            return null;
        }
      case 'Card':
        switch (exampleTitle) {
          case 'Basic Card':
            return (
              <Card className="max-w-sm">
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content goes here</p>
                </CardContent>
              </Card>
            );
          case 'Card Variants':
            return (
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <Card variant="flat">
                  <CardContent className="p-4">Flat card</CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent className="p-4">Outlined card</CardContent>
                </Card>
              </div>
            );
          default:
            return null;
        }
      case 'List':
        switch (exampleTitle) {
          case 'Basic List':
            return (
              <List className="max-w-sm">
                <ListItem>Item 1</ListItem>
                <ListItem>Item 2</ListItem>
              </List>
            );
          case 'List with Icons':
            return (
              <List variant="divided" className="max-w-sm">
                <ListItem>
                  <ListItemContent>
                    <div className="font-medium">John Doe</div>
                    <div className="text-sm text-neutral-600">Software Engineer</div>
                  </ListItemContent>
                </ListItem>
              </List>
            );
          default:
            return null;
        }
      case 'Tabs':
        switch (exampleTitle) {
          case 'Basic Tabs':
            return (
              <Tabs defaultValue="tab1" className="max-w-md">
                <TabsList>
                  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="mt-4">Content 1</TabsContent>
                <TabsContent value="tab2" className="mt-4">Content 2</TabsContent>
              </Tabs>
            );
          default:
            return null;
        }
      default:
        return null;
    }
  };

  return (
    <Card className="mb-8" id={component.name.toLowerCase()}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl">{component.name}</CardTitle>
              <Badge 
                variant={component.status === 'stable' ? 'default' : component.status === 'beta' ? 'secondary' : 'outline'}
                theme={component.status === 'stable' ? 'success' : component.status === 'beta' ? 'warning' : 'neutral'}
              >
                {component.status}
              </Badge>
              <Badge variant="secondary" theme="info">{component.category}</Badge>
            </div>
            <CardDescription className="text-base leading-relaxed">
              {component.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Features */}
        {component.features && component.features.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Features
            </h4>
            <List variant="spaced">
              {component.features.map((feature, index) => (
                <ListItem key={index} className="py-1">
                  <ListItemContent>
                    <div className="text-sm text-neutral-700">• {feature}</div>
                  </ListItemContent>
                </ListItem>
              ))}
            </List>
          </div>
        )}

        {/* Examples */}
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Examples
          </h4>
          <Tabs defaultValue="0">
            <TabsList className="mb-4">
              {component.examples.map((example, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {component.examples.map((example, index) => (
              <TabsContent key={index} value={index.toString()}>
                <Card variant="flat">
                  <CardHeader>
                    <CardTitle className="text-base">{example.title}</CardTitle>
                    {example.description && (
                      <CardDescription>{example.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Live Example */}
                    <div>
                      <h5 className="text-sm font-medium text-neutral-900 mb-3">Preview</h5>
                      <div className="p-6 border border-neutral-200 rounded-lg bg-white flex items-center justify-center min-h-[100px]">
                        {renderLiveExample(component.name, example.title)}
                      </div>
                    </div>
                    
                    {/* Code */}
                    <div>
                      <h5 className="text-sm font-medium text-neutral-900 mb-3">Code</h5>
                      <div className="relative group">
                        <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                        <button
                          onClick={() => handleCopyExample(example.code, index)}
                          className="absolute top-2 right-2 p-2 text-neutral-500 hover:text-neutral-700 bg-white/80 backdrop-blur rounded-md transition-all duration-200 hover:bg-white opacity-0 group-hover:opacity-100"
                          aria-label="Copy code"
                        >
                          {copiedExample === index ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Props */}
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Props
          </h4>
          <Card variant="outlined">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left p-4 font-medium text-neutral-900">Name</th>
                      <th className="text-left p-4 font-medium text-neutral-900">Type</th>
                      <th className="text-left p-4 font-medium text-neutral-900">Default</th>
                      <th className="text-left p-4 font-medium text-neutral-900">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {component.props.map((prop, index) => (
                      <tr key={prop.name} className={index !== component.props.length - 1 ? "border-b border-neutral-100" : ""}>
                        <td className="p-4">
                          <code className="text-sm bg-neutral-100 px-2 py-1 rounded">{prop.name}</code>
                          {prop.required && <span className="text-red-500 ml-1">*</span>}
                        </td>
                        <td className="p-4">
                          <code className="text-sm text-neutral-600">{prop.type}</code>
                        </td>
                        <td className="p-4">
                          {prop.defaultValue ? (
                            <code className="text-sm bg-neutral-100 px-2 py-1 rounded">{prop.defaultValue}</code>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-neutral-700">{prop.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocsContent() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedComponent, setSelectedComponent] = useState<ComponentDocumentation | null>(null);
  const categories = getCategories();

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSelectedComponent(null);
  };

  const handleComponentSelect = (component: ComponentDocumentation) => {
    setSelectedComponent(component);
    setActiveSection('component');
  };

  const renderMainContent = () => {
    if (selectedComponent) {
      return <ComponentDocSection component={selectedComponent} />;
    }

    switch (activeSection) {
      case 'overview':
        return (
          <>
            {/* Hero Section */}
            <section className="mb-16">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-neutral-900 mb-6 bg-gradient-to-r from-willow-primary-600 to-willow-primary-500 bg-clip-text text-transparent">
                  Willow Design System
                </h1>
                <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
                  A comprehensive component library built with React, TypeScript, and Tailwind CSS. 
                  Each component is thoroughly documented with examples, props, and best practices.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button theme="primary" size="lg" leftIcon={<Eye />} onClick={() => setActiveSection('components')}>
                    View Components
                  </Button>
                  <Link href="/quick-start">
                    <Button theme="primary" variant="outline" size="lg" leftIcon={<Zap />}>
                      Quick Start
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card variant="flat">
                  <CardContent className="text-center p-6">
                    <div className="text-3xl font-bold text-willow-primary-700 mb-2">{componentDocs.length}</div>
                    <div className="text-neutral-600">Components</div>
                  </CardContent>
                </Card>
                <Card variant="flat">
                  <CardContent className="text-center p-6">
                    <div className="text-3xl font-bold text-willow-primary-700 mb-2">{categories.length}</div>
                    <div className="text-neutral-600">Categories</div>
                  </CardContent>
                </Card>
                <Card variant="flat">
                  <CardContent className="text-center p-6">
                    <div className="text-3xl font-bold text-willow-primary-700 mb-2">100%</div>
                    <div className="text-neutral-600">TypeScript</div>
                  </CardContent>
                </Card>
              </div>

              {/* Installation Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-neutral-900">Installation</h2>
                
                {/* Willow CLI Method */}
                <Card variant="flat" className="mb-8 border-2 border-willow-primary-200 bg-gradient-to-r from-willow-primary-50 to-blue-50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-willow-primary-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-willow-primary-900">Willow CLI (Recommended)</CardTitle>
                        <CardDescription className="text-willow-primary-700">Install components with simple commands</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-neutral-800 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="text-neutral-300 text-sm">Install globally:</div>
                        <code className="text-green-400">npm install -g willow-cli</code>
                      </div>
                    </div>
                    <div className="bg-neutral-800 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="text-neutral-300 text-sm">Add components:</div>
                        <code className="text-blue-400">willow add button</code>
                        <br />
                        <code className="text-blue-400">willow add card</code>
                        <br />
                        <code className="text-blue-400">willow list</code>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-700">
                      The Willow CLI provides the easiest way to install and manage components with short, memorable commands.
                    </div>
                  </CardContent>
                </Card>

                {/* Available CLI Commands */}
                <Card variant="flat" className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-xl">CLI Commands</CardTitle>
                    <CardDescription>All available Willow CLI commands</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border border-neutral-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="text-left p-4 font-medium">Command</th>
                              <th className="text-left p-4 font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-neutral-100">
                              <td className="p-4"><code className="text-sm bg-neutral-100 px-2 py-1 rounded">willow init</code></td>
                              <td className="p-4 text-sm">Initialize Willow in your project</td>
                            </tr>
                            <tr className="border-t border-neutral-100">
                              <td className="p-4"><code className="text-sm bg-neutral-100 px-2 py-1 rounded">willow add &lt;component&gt;</code></td>
                              <td className="p-4 text-sm">Install a specific component</td>
                            </tr>
                            <tr className="border-t border-neutral-100">
                              <td className="p-4"><code className="text-sm bg-neutral-100 px-2 py-1 rounded">willow list</code></td>
                              <td className="p-4 text-sm">List all available components</td>
                            </tr>
                            <tr className="border-t border-neutral-100">
                              <td className="p-4"><code className="text-sm bg-neutral-100 px-2 py-1 rounded">willow --help</code></td>
                              <td className="p-4 text-sm">Show help information</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alternative Methods */}
                <Card variant="flat">
                  <CardHeader>
                    <CardTitle className="text-xl">Alternative Installation Methods</CardTitle>
                    <CardDescription>Other ways to install Willow components</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Direct URLs with shadcn CLI:</h4>
                      <div className="bg-neutral-800 rounded-lg p-4">
                        <code className="text-green-400 text-sm">npx shadcn@latest add https://iridescent-brigadeiros-fe4174.netlify.app/r/button.json</code>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Create new project:</h4>
                      <div className="bg-neutral-800 rounded-lg p-4">
                        <code className="text-green-400 text-sm">npx create-willow-design-system@latest my-app</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </section>
          </>
        );
      
      
      case 'components':
        return (
          <section>
            <h1 className="text-4xl font-bold mb-8 text-neutral-900">All Components</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {componentDocs.map((component) => (
                <Card 
                  key={component.name} 
                  variant="flat" 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => handleComponentSelect(component)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl">{component.name}</CardTitle>
                      <Badge variant="secondary" theme="info">{component.category}</Badge>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {component.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-neutral-600">
                      <span>{component.examples.length} examples</span>
                      <span>{component.props.length} props</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      
      default:
        return null;
    }
  };

  return (
      <div className="flex min-h-screen bg-neutral-50">
        {/* Sidebar */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-neutral-200 overflow-y-auto z-40">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Documentation</h3>
            
            {/* Main Navigation */}
            <div className="mb-6">
              <Button
                variant={activeSection === 'overview' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start mb-2"
                onClick={() => handleSectionChange('overview')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Overview
              </Button>
              <Link href="/quick-start">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-2"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Start
                </Button>
              </Link>
              <Button
                variant={activeSection === 'components' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start mb-2"
                onClick={() => handleSectionChange('components')}
              >
                <Package className="w-4 h-4 mr-2" />
                All Components
              </Button>
            </div>
            
            {/* Component Categories */}
            <div className="border-t border-neutral-200 pt-4">
              <h4 className="text-sm font-medium text-neutral-900 mb-3">Components by Category</h4>
              {categories.map((category) => (
                <div key={category} className="mb-4">
                  <h5 className="text-xs font-medium text-neutral-700 mb-2 uppercase tracking-wide">{category}</h5>
                  <List variant="spaced">
                    {getComponentsByCategory(category).map((component) => (
                      <ListItem key={component.name}>
                        <button
                          onClick={() => handleComponentSelect(component)}
                          className={`block w-full text-left text-sm transition-colors ${
                            selectedComponent?.name === component.name
                              ? 'text-willow-primary-700 font-medium'
                              : 'text-neutral-600 hover:text-willow-primary-700'
                          }`}
                        >
                          {component.name}
                        </button>
                      </ListItem>
                    ))}
                  </List>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="ml-64 px-8 py-12">
          {selectedComponent && (
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ChevronRight className="w-4 h-4 rotate-180" />}
                onClick={() => setSelectedComponent(null)}
              >
                Back to {activeSection === 'component' ? 'Components' : 'Overview'}
              </Button>
            </div>
          )}
          {renderMainContent()}
        </main>
      </div>
  )
}