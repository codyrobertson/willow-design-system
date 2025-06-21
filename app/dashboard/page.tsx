'use client'

import { FancyButton } from '@/src/components/ui/FancyButton'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Dashboard (Coming Soon)</h1>
        <FancyButton onClick={() => router.push('/')}>
          Back to Home
        </FancyButton>
      </div>
    </div>
  )
}