'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FormCard, FormField } from '@/src/components/ui/FormCard'
import GradientBG from '@/src/components/ui/GradientBG'
import { FA6Icon } from '@/src/components/ui/FA6Icon'

const createAccountFields: FormField[] = [
  {
    name: 'name',
    label: "What's Your Name?",
    type: 'text',
    placeholder: 'Jane Doe',
    leftIcon: <FA6Icon name="user" style="regular" size="base" />,
    validation: {
      required: true,
      minLength: 2,
    },
  },
  {
    name: 'email',
    label: "What's Your Primary Email?",
    type: 'email',
    placeholder: 'hello@alignui.com',
    leftIcon: <FA6Icon name="envelope" style="regular" size="base" />,
    validation: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  {
    name: 'password',
    label: 'Create A Password',
    type: 'password',
    placeholder: '••••••••••',
    leftIcon: <FA6Icon name="lock" style="regular" size="base" />,
    validation: {
      required: true,
      minLength: 8,
    },
  },
]

export default function AccountSetupScreen() {
  const router = useRouter()

  const handleSubmit = useCallback((data: Record<string, string>) => {
    console.log('Form submitted:', data)
    // Here you would typically handle the account creation logic,
    // e.g., calling an API endpoint.
    // router.push('/onboarding/next-step')
  }, [router])

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <GradientBG colors={['purple-600', 'blue-400']} />
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
        <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center text-white">
          <h1 className="text-2xl font-bold text-blue-300">Create Account</h1>
          <FA6Icon name="code" size="2xl" className="text-blue-300" />
        </header>

        <main className="w-full flex justify-center">
          <FormCard
            title="Create Account"
            fields={createAccountFields}
            submitText="Continue"
            onSubmit={handleSubmit}
          />
        </main>
      </div>
    </div>
  )
}