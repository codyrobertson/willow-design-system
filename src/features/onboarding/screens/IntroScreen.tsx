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
      className="flex flex-col min-h-screen max-h-screen overflow-hidden"
    >
      <Navigation transparent logoLockup="full" logoVariant="dark" />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left side - Content */}
        <div className="flex flex-col justify-center lg:flex-1 px-4 sm:px-6 lg:px-12 xl:px-16 pt-16 sm:pt-20 pb-4 lg:py-0 overflow-y-auto">
          <div className="w-full lg:max-w-xl xl:max-w-2xl mx-auto lg:mx-0">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight drop-shadow-lg">
                Your AI-Powered Aftercare Partner
              </h1>
            </div>

            <div className="space-y-3 lg:space-y-4">
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
        <div className="mt-auto lg:mt-0 lg:flex lg:items-center lg:justify-center lg:flex-1 lg:py-8">
          <div className="w-full lg:max-w-lg xl:max-w-xl lg:px-8 xl:px-12">
            <Card className="p-6 sm:p-8 lg:p-12 xl:p-16 rounded-t-3xl lg:rounded-lg flex flex-col justify-center shadow-lg lg:shadow-xl">
              <CardHeader className="px-0 pt-0 pb-6 lg:pb-8">
                <CardTitle className="text-lg lg:text-xl xl:text-2xl">Ready to start feeling more confident about your recovery?</CardTitle>
              </CardHeader>
              <CardFooter className="flex-col gap-4 lg:gap-6 px-0 pb-0">
                <Button
                  onClick={handleGetStarted}
                  variant="fancy"
                  size="lg"
                  fullWidth
                  radius="full"
                  className="text-xl lg:text-2xl"
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