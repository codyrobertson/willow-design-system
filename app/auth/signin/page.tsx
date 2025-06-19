'use client'

import { useRouter } from 'next/navigation'
import { FancyButton } from '@/src/components/ui/FancyButton'

export default function SignInPage() {
  const router = useRouter()
  
  const handleMockSignIn = () => {
    // Mock sign in - just redirect to home
    router.push('/')
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In (Mock)</h1>
        <FancyButton onClick={handleMockSignIn}>
          Mock Sign In
        </FancyButton>
      </div>
    </div>
  )
}