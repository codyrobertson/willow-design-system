'use client'

import { Highlight } from '@/src/components/ui/Highlight'
import { FA6Icon } from '@/src/components/ui/FA6Icon'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
} from '@/src/components/ui/Card'
import { Logo } from '@/src/components/ui/Logo'
import { FancyButton } from '@/src/components/ui/FancyButton'
import GradientBG from '@/src/components/ui/GradientBG'
import { useRouter } from 'next/navigation'

export default function IntroScreen() {
  const router = useRouter()
  
  const handleGetStarted = () => {
    router.push('/onboarding/account-setup')
  }
  
  const handleSignIn = () => {
    router.push('/auth/signin')
  }
  
  return (
    <div
      className="bg-center bg-cover bg-no-repeat h-screen w-full overflow-hidden"
      style={{ backgroundImage: `url('/onboarding_hero.png')` }}
    >
      <div className="h-full flex flex-col relative">
        <GradientBG colors={["transparent", "rgba(255,255,255,0.3)"]} />

        <div className="backdrop-blur-sm bg-gradient-to-b from-transparent to-white/30 flex-1 rounded-t-lg w-full flex flex-col">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 px-8 sm:px-12 md:px-16 pt-20 pb-10 overflow-y-auto">
              
              <div className="mb-10">
                <Logo size="lg" lockup="full" variant="dark" />
              </div>

              <div className="mb-10 max-w-2xl">
                <h1 className="bg-gradient-to-b from-white/95 via-white/80 to-white/60 bg-clip-text text-transparent text-display-md sm:text-display-lg font-codec-pro-bold leading-tight tracking-tight text-shadow-md">
                  Your AI-Powered Aftercare Partner
                </h1>
              </div>

              <div className="space-y-6 max-w-lg">
                <Highlight
                  text="Daily Video Check-ins"
                  iconLeft={<FA6Icon name="circle-check" className="text-white/70" size="xl" />}
                  variant="dark"
                />

                <Highlight
                  text="Track Your Recovery"
                  iconLeft={<FA6Icon name="circle-check" className="text-white/70" size="xl" />}
                  variant="dark"
                />

                <Highlight
                  text="Answer Your Questions"
                  iconLeft={<FA6Icon name="circle-check" className="text-white/70" size="xl" />}
                  variant="dark"
                />

                <Highlight
                  text="Keeps You On Track"
                  iconLeft={<FA6Icon name="circle-check" className="text-white/70" size="xl" />}
                  variant="dark"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ready to start feeling more confident about your recovery?</CardTitle>
              </CardHeader>
              <CardFooter className="flex-col gap-4">
                <FancyButton
                  onClick={handleGetStarted}
                  size="lg"
                  fullWidth
                  className="text-2xl font-semibold"
                >
                  Get Started
                </FancyButton>
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
    </div>
  )
}