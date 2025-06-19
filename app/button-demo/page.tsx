'use client'

import { FancyButton } from "@/src/components/ui/FancyButton"
import { FA6Icon } from "@/src/components/ui/FA6Icon"

export default function ButtonDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
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

        {/* Buttons with Icons */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Buttons with Icons</h2>
          <div className="flex flex-wrap gap-4">
            <FancyButton 
              leftIcon={<FA6Icon name="arrow-left" size="sm" />}
            >
              Back
            </FancyButton>
            <FancyButton 
              rightIcon={<FA6Icon name="arrow-right" size="sm" />}
            >
              Next
            </FancyButton>
            <FancyButton 
              leftIcon={<FA6Icon name="download" size="sm" />}
              rightIcon={<FA6Icon name="file" size="sm" />}
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
    </div>
  )
}