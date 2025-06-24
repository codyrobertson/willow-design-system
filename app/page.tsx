import Link from 'next/link';

// Force this to be a server component by using dynamic data
export const dynamic = 'force-dynamic';

export default function Home() {
  // Add timestamp to force server-side rendering
  const timestamp = new Date().toISOString();
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-6xl font-bold mb-6 text-neutral-900">
            Willow Design System
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            A modern, accessible design system built with React, TypeScript, and Tailwind CSS. 
            Built on top of shadcn/ui with custom Willow branding.
          </p>
          
          {/* CLI Installation */}
          <div className="bg-neutral-800 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="text-left">
              <p className="text-neutral-300 mb-2">Complete setup in one command:</p>
              <code className="text-green-400 text-lg">npm install -g willow-cli</code>
              <br />
              <code className="text-blue-400 text-lg">willow init</code>
              <p className="text-neutral-400 text-sm mt-2">
                ✨ Installs all components, fonts, theme, and dependencies automatically
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/quick-start" 
              className="px-8 py-4 bg-willow-primary-600 text-white rounded-lg hover:bg-willow-primary-700 transition-colors font-semibold text-lg"
            >
              Quick Start
            </Link>
            <Link 
              href="/docs" 
              className="px-8 py-4 border-2 border-willow-primary-600 text-willow-primary-600 rounded-lg hover:bg-willow-primary-50 transition-colors font-semibold text-lg"
            >
              Documentation
            </Link>
            <Link 
              href="/storybook" 
              className="px-8 py-4 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-semibold text-lg"
            >
              View Storybook
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-willow-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-neutral-600">Install components with simple commands. No complex configuration needed.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-willow-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Beautiful Design</h3>
              <p className="text-neutral-600">Carefully crafted components with Willow's custom color palette and typography.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-willow-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Developer Friendly</h3>
              <p className="text-neutral-600">Built on shadcn/ui with TypeScript support and excellent developer experience.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}