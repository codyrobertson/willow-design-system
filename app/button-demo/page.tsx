'use client'

import { FancyButton } from "@/src/components/ui/FancyButton"
import { AppLayout } from '@/src/components/layout/AppLayout'
import { ArrowLeft, ArrowRight, Download, FileText } from "lucide-react"

export default function ButtonDemo() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 p-8">
        <h1 className="text-3xl font-bold text-gray-900">FancyButton Demo</h1>
        
        {/* Button Sizes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Button Sizes</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <FancyButton size="xs">Extra Small</FancyButton>
            <FancyButton size="sm">Small</FancyButton>
            <FancyButton size="md">Medium</FancyButton>
            <FancyButton size="lg">Large</FancyButton>
            <FancyButton size="xl">Extra Large</FancyButton>
          </div>
        </div>

        {/* Button States */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Button States</h2>
          <div className="flex flex-wrap gap-4">
            <FancyButton>Default</FancyButton>
            <FancyButton disabled>Disabled</FancyButton>
            <FancyButton loading>Loading</FancyButton>
          </div>
        </div>

        {/* Button Variants */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <FancyButton variant="primary">Primary</FancyButton>
            <FancyButton variant="secondary">Secondary</FancyButton>
            <FancyButton variant="ghost">Ghost</FancyButton>
            <FancyButton variant="outline">Outline</FancyButton>
          </div>
        </div>

        {/* Fancy Button Variant */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">The New Fancy Button</h2>
          <div className="flex flex-wrap gap-4 p-4 items-center bg-gray-900 rounded-lg">
            <FancyButton variant="fancy" size="sm">Get Started</FancyButton>
            <FancyButton variant="fancy" size="md">Get Started</FancyButton>
            <FancyButton variant="fancy" size="lg">Get Started</FancyButton>
          </div>
        </div>

        {/* Buttons with Icons */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Buttons with Icons</h2>
          <div className="flex flex-wrap gap-4">
            <FancyButton 
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </FancyButton>
            <FancyButton 
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next
            </FancyButton>
            <FancyButton 
              leftIcon={<Download className="w-4 h-4" />}
              rightIcon={<FileText className="w-4 h-4" />}
            >
              Download File
            </FancyButton>
          </div>
        </div>

        {/* Full Width Button */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Full Width Button</h2>
          <FancyButton fullWidth size="lg">
            Get Started Now
          </FancyButton>
        </div>
      </div>
    </AppLayout>
  )
}