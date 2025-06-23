'use client';

import { useState } from 'react';

// Registry components for testing
const registryComponents = [
  'accordion', 'avatar', 'badge', 'button', 'card', 'checkbox', 'chip',
  'error-boundary', 'fancy-button', 'form-card', 'form-field', 'gradient-bg',
  'highlight', 'icon', 'icon-text', 'info-card', 'input', 'label', 'list', 
  'logo', 'modal', 'select', 'simple-form', 'skeleton', 'switch', 'tabs', 
  'tag', 'textarea', 'theme-test', 'toast', 'tooltip'
];

export default function RegistryTestPage() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [installCode, setInstallCode] = useState<string>('');
  const [registryUrl, setRegistryUrl] = useState<string>('https://iridescent-brigadeiros-fe4174.netlify.app');

  const generateInstallCode = (component: string) => {
    const code = `# Method 1: Using shadcn CLI (Recommended)
npx shadcn@latest add ${registryUrl}/r/${component}.json

# Method 2: Manual Installation
# 1. Fetch component JSON
curl ${registryUrl}/r/${component}.json > ${component}.json

# 2. Extract and save component code
cat ${component}.json | jq -r '.files[0].content' > components/ui/${component}.tsx

# 3. Install dependencies (check the JSON for exact dependencies)
npm install @radix-ui/react-slot class-variance-authority lucide-react

# Method 3: Direct Download Script
#!/bin/bash
COMPONENT=$1
curl -s ${registryUrl}/r/$COMPONENT.json | \\
  jq -r '.files[0].content' > components/ui/$COMPONENT.tsx

# Usage: ./install.sh ${component}`;
    return code;
  };

  const handleComponentSelect = (component: string) => {
    setSelectedComponent(component);
    setInstallCode(generateInstallCode(component));
  };

  const testRegistryEndpoint = async (component: string) => {
    try {
      const response = await fetch(`${registryUrl}/api/registry/ui/${component}`);
      const data = await response.json();
      console.log(`${component} registry data:`, data);
      alert(`✅ ${component} registry JSON loaded successfully! Check console for details.`);
    } catch (error) {
      console.error(`Failed to load ${component}:`, error);
      alert(`❌ Failed to load ${component} registry JSON`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Shadcn Registry Tester
          </h1>
          <p className="text-slate-600 text-lg">
            Test your shadcn/ui compatible component registry
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium">
              🚀 Registry URL: <span className="font-mono">{registryUrl}</span>
            </p>
          </div>
        </div>

        {/* Registry URL Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Registry Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Registry Base URL
              </label>
              <input
                type="text"
                value={registryUrl}
                onChange={(e) => setRegistryUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://willow-prod.vercel.app"
              />
            </div>
            <div className="flex gap-2">
              <a
                href={`${registryUrl}/api/registry.json`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Test Registry Root
              </a>
              <a
                href={`${registryUrl}/api/registry/lib/utils.json`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Test Utils
              </a>
            </div>
          </div>
        </div>

        {/* Component Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Available Components ({registryComponents.length})
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {registryComponents.map((component) => (
              <div key={component} className="flex flex-col gap-1">
                <button
                  onClick={() => handleComponentSelect(component)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-sm font-medium
                    ${selectedComponent === component
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  {component}
                </button>
                <button
                  onClick={() => testRegistryEndpoint(component)}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Test JSON
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Install Instructions */}
        {selectedComponent && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Install {selectedComponent} Component
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-medium text-slate-800">Installation Commands</h3>
                  <button
                    onClick={() => testRegistryEndpoint(selectedComponent)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Test Registry JSON
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-sm">
                  <code>{installCode}</code>
                </pre>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Registry Endpoints</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• <code>/api/registry.json</code> - Registry metadata</li>
                    <li>• <code>/api/registry/ui/{selectedComponent}</code> - Component</li>
                    <li>• <code>/api/registry/lib/utils.json</code> - Utilities</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">📦 Installation Methods</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• shadcn CLI integration</li>
                    <li>• Direct component installation</li>
                    <li>• Automatic dependency management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Testing Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Registry Testing Guide
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
              <h3 className="font-semibold text-purple-900 mb-2">1. Test Registry Schema</h3>
              <p className="text-purple-800 text-sm mb-2">
                Verify the registry.json follows shadcn format
              </p>
              <code className="text-xs bg-purple-100 p-1 rounded">
                curl {registryUrl}/api/registry.json
              </code>
            </div>
            
            <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
              <h3 className="font-semibold text-orange-900 mb-2">2. Test Component JSON</h3>
              <p className="text-orange-800 text-sm mb-2">
                Check individual component registry files
              </p>
              <code className="text-xs bg-orange-100 p-1 rounded">
                curl {registryUrl}/r/button.json
              </code>
            </div>
            
            <div className="p-4 border-l-4 border-green-500 bg-green-50">
              <h3 className="font-semibold text-green-900 mb-2">3. Test Installation</h3>
              <p className="text-green-800 text-sm mb-2">
                Install components using shadcn CLI
              </p>
              <code className="text-xs bg-green-100 p-1 rounded">
                npx shadcn@latest add {registryUrl}/r/button.json
              </code>
            </div>
          </div>
        </div>

        {/* Advanced Testing */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Advanced Registry Testing
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Test All Endpoints</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {['api/registry.json', 'api/registry/lib/utils.json', 'api/registry/ui/button'].map((endpoint) => (
                  <a
                    key={endpoint}
                    href={`${registryUrl}/${endpoint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700 transition-colors"
                  >
                    {endpoint}
                  </a>
                ))}
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-800 mb-2">📥 Installation Script</h4>
                <div className="flex gap-2">
                  <a
                    href={`${registryUrl}/install.sh`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Download install.sh
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(`curl -o install.sh ${registryUrl}/install.sh && chmod +x install.sh`)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Copy Install Command
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ CORS Testing</h3>
              <p className="text-yellow-700 text-sm">
                Test if registry endpoints work cross-origin for CLI tools. All JSON files should be accessible without CORS issues.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}