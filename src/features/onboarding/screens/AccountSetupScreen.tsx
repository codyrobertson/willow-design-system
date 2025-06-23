'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/Card'
import GradientBG from '@/src/components/ui/GradientBG'
import { User, Mail, Lock } from 'lucide-react'
import { Navigation } from '@/src/components/layout/Navigation'
import { FormCard, FormField } from '@/src/components/ui/FormCard'

const createAccountFields: FormField[] = [
  {
    name: 'name',
    label: "What's Your Name?",
    type: 'text',
    placeholder: 'Jane Doe',
    leftIcon: <User className="w-4 h-4" />,
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
    leftIcon: <Mail className="w-4 h-4" />,
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
    leftIcon: <Lock className="w-4 h-4" />,
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
    router.push('/onboarding/aftercare-instructions')
  }, [router])

  return (
    <GradientBG
      imageUrl="/onboarding_hero.png"
      gradientColors={['rgba(0,0,0,0.4)', 'rgba(49,26,255,0.3)']}
      height="h-screen"
      className="flex flex-col min-h-screen max-h-screen overflow-hidden"
    >
      <Navigation transparent showBackButton logoSize="lg" />
      <div className="flex-1 flex flex-col justify-center items-center p-4 pt-20 overflow-y-auto">
        <FormCard
          title="Create your account"
          subtitle="Get started with a free Willow account today."
          fields={createAccountFields}
          submitText="Continue"
          onSubmit={handleSubmit}
        />
      </div>
    </GradientBG>
  )
}