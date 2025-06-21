'use client'

import { Highlight } from '@/src/components/ui/Highlight'
import { CheckCircle } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
} from '@/src/components/ui/Card'
import { Button } from '@/src/components/ui/Button'
import GradientBG from '@/src/components/ui/GradientBG'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/src/components/layout/Navigation'

export default function IntroScreen() {
  const router = useRouter()
  
  const handleGetStarted = () => {
    router.push('/onboarding/account-setup')
  }
  
  const handleSignIn = () => {
    router.push('/auth/signin')
  }
  
  return (
    <GradientBG
      imageUrl="/onboarding_hero.png"
      gradientColors={['rgba(0,0,0,0.4)', 'rgba(49,26,255,0.3)']}
      height="h-screen"
      className="flex flex-col overflow-hidden"
    >
      <Navigation transparent logoLockup="full" logoVariant="dark" />
      <div className="flex flex-col lg:flex-row flex-1 pt-24 lg:pt-20">
        {/* Left side - Content */}
        <div className="flex flex-col justify-center lg:flex-1 px-8 sm:px-12 lg:px-16 xl:px-20 py-8 lg:py-0">
          <div className="w-full lg:max-w-xl xl:max-w-2xl mx-auto lg:mx-0">
            <div className="mb-10">
              <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight drop-shadow-lg">
                Your AI-Powered Aftercare Partner
              </h1>
            </div>

            <div className="space-y-6">
              <Highlight
                text="Daily Video Check-ins"
                iconLeft={<CheckCircle className="text-white/80 w-6 h-6" />}
                variant="dark"
                className="bg-black/30"
              />

              <Highlight
                text="Track Your Recovery"
                iconLeft={<CheckCircle className="text-white/80 w-6 h-6" />}
                variant="dark"
                className="bg-black/30"
              />

              <Highlight
                text="Answer Your Questions"
                iconLeft={<CheckCircle className="text-white/80 w-6 h-6" />}
                variant="dark"
                className="bg-black/30"
              />

              <Highlight
                text="Keeps You On Track"
                iconLeft={<CheckCircle className="text-white/80 w-6 h-6" />}
                variant="dark"
                className="bg-black/30"
              />
            </div>
          </div>
        </div>

        {/* Right side - Card */}
        <div className="flex items-end lg:items-center lg:justify-center lg:flex-1 pb-0 lg:py-8">
          <div className="w-full lg:max-w-lg xl:max-w-xl lg:px-16 xl:px-20">
            <Card className="p-8 sm:p-10 lg:p-16 xl:p-20 rounded-none lg:rounded-lg lg:min-h-[500px] xl:min-h-[600px] flex flex-col justify-center">
              <CardHeader className="px-0 pt-0 pb-8 lg:pb-12">
                <CardTitle className="text-xl lg:text-2xl">Ready to start feeling more confident about your recovery?</CardTitle>
              </CardHeader>
              <CardFooter className="flex-col gap-6 px-0 pb-0">
                <Button
                  onClick={handleGetStarted}
                  variant="fancy"
                  size="lg"
                  fullWidth
                  radius="full"
                  className="text-2xl"
                >
                  Get Started
                </Button>
                <p className="font-bold text-sm text-center tracking-[-0.28px] w-full leading-6">
                  <span>Already have an account? </span>
                  <button
                    onClick={handleSignIn}
                    className="text-foreground underline hover:no-underline transition-all"
                    type="button"
                  >
                    Sign In
                  </button>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </GradientBG>
  )
}