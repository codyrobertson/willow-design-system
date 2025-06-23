'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/Card'
import { Button } from '@/src/components/ui/Button'
import GradientBG from '@/src/components/ui/GradientBG'
import { Navigation } from '@/src/components/layout/Navigation'
import { Highlight } from '@/src/components/ui/Highlight'

export default function AftercareInstructionsScreen() {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [instructions, setInstructions] = useState('')
  const [charCount, setCharCount] = useState(0)
  const maxChars = 5000

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInstructions(value)
    setCharCount(value.length)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Allow paste and update character count
    setTimeout(() => {
      const value = textareaRef.current?.value || ''
      setInstructions(value)
      setCharCount(value.length)
    }, 0)
  }, [])

  const handleContinue = useCallback(() => {
    // Export data structure ready for API
    const exportData = {
      instructions: instructions,
      timestamp: new Date().toISOString(),
      characterCount: charCount,
      source: 'manual_input'
    }
    
    console.log('Exporting aftercare instructions:', exportData)
    
    // Store in sessionStorage for next screen
    sessionStorage.setItem('aftercareInstructions', JSON.stringify(exportData))
    
    // Navigate to processing screen
    router.push('/onboarding/processing')
  }, [instructions, charCount, router])


  return (
    <GradientBG
      imageUrl="/onboarding_hero.png"
      gradientColors={['transparent', 'rgba(255,255,255,0.3)']}
      height="h-screen"
      className="flex flex-col min-h-screen max-h-screen overflow-hidden"
    >
      <Navigation transparent showBackButton logoSize="lg" />
      
      <main className="flex-1 flex flex-col justify-center items-center p-4 pt-20 overflow-y-auto">
        <div className="w-full max-w-4xl my-auto">
            {/* Main Card */}
            <Card variant="default">
              <CardHeader align="left" className="pb-4">
                <h2 className="text-2xl font-codec-pro-bold text-oxford-blue-950 mb-2">
                  Aftercare Instructions
                </h2>
                <p className="text-neutral-600">
                  Paste or type your aftercare instructions below
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={instructions}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    placeholder="Paste your aftercare instructions here..."
                    maxLength={maxChars}
                    className="w-full h-[200px] sm:h-[250px] lg:h-[300px] p-4 rounded-lg border border-neutral-300 
                             focus:border-willow-primary-500 focus:ring-2 focus:ring-willow-primary-500/20 
                             transition-colors resize-none font-codec-pro text-oxford-blue-950
                             placeholder:text-neutral-400"
                  />
                  
                  {/* Character count */}
                  <div className="absolute bottom-2 right-2 text-xs text-neutral-500">
                    {charCount}/{maxChars}
                  </div>
                </div>

                {/* Clear button */}
                {instructions.length > 0 && (
                  <button
                    onClick={() => {
                      setInstructions('')
                      setCharCount(0)
                      textareaRef.current?.focus()
                    }}
                    className="mt-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </CardContent>

              <CardFooter align="center" className="pt-6">
                <Button
                  onClick={handleContinue}
                  disabled={instructions.length === 0}
                  variant="fancy"
                  size="lg"
                  fullWidth
                  radius="full"
                >
                  Continue
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
    </GradientBG>
  )
}