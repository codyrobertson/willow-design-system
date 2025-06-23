'use client';

import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';

export default function Home() {
  // Note: router is available but not currently used since we're using window.location.href
  // const router = useRouter();

  useEffect(() => {
    // Redirect to production storybook
    window.location.href = 'https://willow-design-system.vercel.app/storybook';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-neutral-900">Redirecting to Storybook...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-willow-primary-600 mx-auto"></div>
      </div>
    </div>
  );
}