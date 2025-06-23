'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/src/components/layout/Navigation'
import { Loader2 } from 'lucide-react'
import GradientBG from '@/src/components/ui/GradientBG'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/src/components/ui/Card'
import { Button } from '@/src/components/ui/Button'

const processingSteps = [
  'Analyzing medical terminology',
  'Simplifying instructions', 
  'Organizing medications',
  'Creating follow-up reminders',
  'Noting Medications',
  'Finalizing your plan'
]

export default function ProcessingScreen() {
  const router = useRouter()
  
  // Get aftercare instructions from sessionStorage
  const stored = typeof window !== 'undefined' ? sessionStorage.getItem('aftercareInstructions') : null
  const instructions = stored ? JSON.parse(stored).instructions.split('\n').filter((line: string) => line.trim()) : []
  
  // Use CSS animations for the rotating steps
  const stepDuration = 3000 // 3 seconds per step
  const totalDuration = stepDuration * processingSteps.length
  
  // Simulate processing completion after some time
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      router.push('/dashboard')
    }, 8000) // Navigate after 8 seconds
  }


  return (
    <GradientBG
      imageUrl="/onboarding_hero.png"
      gradientColors={['rgba(0,0,0,0.4)', 'rgba(49,26,255,0.3)']}
      height="h-screen"
      className="flex flex-col min-h-screen max-h-screen overflow-hidden"
    >
      <Navigation transparent showBackButton logoSize="lg" />
      <div className="flex-1 flex flex-col justify-center items-center p-4 pt-20 overflow-y-auto">
        {/* Main Card */}
        <Card className="max-w-md w-full" variant="default">
          <div className="flex flex-col h-[600px]">
            <CardHeader align="center" className="px-8 pt-6 pb-4 flex-shrink-0">
              <h2 className="font-codec-pro font-normal text-[#534f5e] text-[32px] tracking-[-0.64px]">
                Preparing your simplified plan
              </h2>
              <p className="text-[#635e73] text-base">
                This usually takes 30-60 seconds
              </p>
            </CardHeader>
            
            {/* Content area with clipped text - no scrolling */}
            <div className="flex-1 min-h-0 px-8 py-4">
              {/* Fixed container with gradient scrim */}
              <div className="relative h-full overflow-hidden rounded-lg bg-neutral-50">
                {/* Text container - no scrolling, just clipped */}
                <div className="relative h-full px-4 py-4">
                  <div className="space-y-2 text-sm font-codec-pro text-[#b8b2c9] leading-[20px] tracking-[-0.084px]">
                    {instructions.map((line, index) => (
                      <p 
                        key={index}
                        className={cn(
                          'opacity-60',
                          line.startsWith('#') && 'font-semibold text-[#8d85a2]',
                          line.startsWith('##') && 'mt-4 mb-2',
                          line.startsWith('###') && 'mt-3 mb-1',
                          line.includes('**') && 'text-[#8d85a2]'
                        )}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                
                {/* Strong gradient scrim overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top gradient */}
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-neutral-50 via-neutral-50/95 to-transparent" />
                  
                  {/* Bottom gradient - stronger and taller */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-50 via-neutral-50 to-transparent" />
                </div>
              </div>
            </div>
            
            {/* Button Container - fixed at bottom */}
            <CardFooter className="px-8 pb-6 pt-4 flex-shrink-0">
              <Button 
                theme="primary" 
                variant="secondary" 
                size="lg" 
                fullWidth 
                disabled
                className="text-lg"
              >
                Processing ...
              </Button>
            </CardFooter>
          </div>
        </Card>
          
        {/* Footer progress indicator */}
        <div className="mt-12">
          <div className="backdrop-blur-[34.5px] bg-[rgba(0,0,0,0.45)] bg-[rgba(129,186,255,0.09)] rounded-[10.79px] p-4">
            <div className="flex items-center gap-[5.58px] text-[20px]">
              <Loader2 
                className="text-[rgba(255,255,255,0.5)] animate-spin w-6 h-6" 
              />
              <div className="relative h-6 overflow-hidden">
                {processingSteps.map((step, index) => (
                  <span 
                    key={index}
                    className="absolute font-codec-pro font-semibold text-white text-shadow-sm animate-cycle-text"
                    style={{
                      background: 'linear-gradient(rgb(255, 255, 255) 19.609%, rgba(255, 255, 255, 0) 217.58%), linear-gradient(rgba(255, 255, 255, 0.64) 19.609%, rgba(255, 255, 255, 0) 217.58%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      '--delay': `${index * 3}s`,
                      '--duration': `${totalDuration / 1000}s`
                    } as React.CSSProperties}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GradientBG>
  )
}