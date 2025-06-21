'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/Button'

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
        <Button onClick={handleMockSignIn} variant="fancy" radius="full">
          Mock Sign In
        </Button>
      </div>
    </div>
  )
}