'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { AppLayout } from '@/src/components/layout/AppLayout';
import { Skeleton } from '@/src/components';

// Dynamically import heavy components
const DocsContent = dynamic(() => import('./DocsContent'), {
  loading: () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-12 w-3/4 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  ),
});

export default function DocsPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      }>
        <DocsContent />
      </Suspense>
    </AppLayout>
  );
}