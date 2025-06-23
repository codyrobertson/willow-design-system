import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-neutral-900">Willow Design System</h1>
        <p className="text-lg text-neutral-600 mb-8">A modern React component library</p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/storybook" 
            className="px-6 py-3 bg-willow-primary-600 text-white rounded-lg hover:bg-willow-primary-700 transition-colors"
          >
            View Storybook
          </Link>
          <Link 
            href="/registry" 
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Component Registry
          </Link>
        </div>
      </div>
    </div>
  );
}