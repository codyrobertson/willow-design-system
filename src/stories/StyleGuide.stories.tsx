import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';

const meta: Meta = {
  title: 'Foundation/Style Guide',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

const ColorSwatch = ({ color, name, hex }: { color: string; name: string; hex?: string }) => (
  <div className="text-center">
    <div className={`${color} h-20 w-full rounded-lg shadow-md mb-2`} />
    <p className="text-sm font-normal">{name}</p>
    {hex && <p className="text-xs text-gray-500">{hex}</p>}
  </div>
);

export const Colors: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Willow Brand Colors</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-normal mb-4">Primary Colors</h3>
            <div className="grid grid-cols-5 gap-4">
              <ColorSwatch color="bg-willow-primary-50" name="Primary 50" hex="#F4F3FF" />
              <ColorSwatch color="bg-willow-primary-100" name="Primary 100" hex="#E8E6FF" />
              <ColorSwatch color="bg-willow-primary-200" name="Primary 200" hex="#D1CCFF" />
              <ColorSwatch color="bg-willow-primary-300" name="Primary 300" hex="#BBB3FF" />
              <ColorSwatch color="bg-willow-primary-400" name="Primary 400" hex="#A499FF" />
              <ColorSwatch color="bg-willow-primary-500" name="Primary 500" hex="#8D80FF" />
              <ColorSwatch color="bg-willow-primary-600" name="Primary 600" hex="#7666FF" />
              <ColorSwatch color="bg-willow-primary-700" name="Primary 700" hex="#5F4DFF" />
              <ColorSwatch color="bg-willow-primary-800" name="Primary 800" hex="#4833FF" />
              <ColorSwatch color="bg-willow-primary-900" name="Primary 900" hex="#311AFF" />
              <ColorSwatch color="bg-willow-primary-950" name="Primary 950" hex="#230E67" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4">Neutral Colors</h3>
            <div className="grid grid-cols-5 gap-4">
              <ColorSwatch color="bg-neutral-0" name="Neutral 0" hex="#FFFFFF" />
              <ColorSwatch color="bg-neutral-50" name="Neutral 50" hex="#F3F7F8" />
              <ColorSwatch color="bg-neutral-100" name="Neutral 100" hex="#E0E9ED" />
              <ColorSwatch color="bg-neutral-200" name="Neutral 200" hex="#CDD9DE" />
              <ColorSwatch color="bg-neutral-300" name="Neutral 300" hex="#B9C9D0" />
              <ColorSwatch color="bg-neutral-400" name="Neutral 400" hex="#A6B9C2" />
              <ColorSwatch color="bg-neutral-500" name="Neutral 500" hex="#93A9B4" />
              <ColorSwatch color="bg-neutral-600" name="Neutral 600" hex="#7F99A6" />
              <ColorSwatch color="bg-neutral-700" name="Neutral 700" hex="#6C8998" />
              <ColorSwatch color="bg-neutral-800" name="Neutral 800" hex="#587989" />
              <ColorSwatch color="bg-neutral-900" name="Neutral 900" hex="#45697B" />
              <ColorSwatch color="bg-neutral-950" name="Neutral 950" hex="#31596D" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4">Oxford Blue (Secondary Neutral)</h3>
            <div className="grid grid-cols-4 gap-4">
              <ColorSwatch color="bg-oxford-blue-50" name="Oxford 50" hex="#F3F7F8" />
              <ColorSwatch color="bg-oxford-blue-100" name="Oxford 100" hex="#E0E9ED" />
              <ColorSwatch color="bg-oxford-blue-400" name="Oxford 400" hex="#6C90A4" />
              <ColorSwatch color="bg-oxford-blue-500" name="Oxford 500" hex="#50748A" />
              <ColorSwatch color="bg-oxford-blue-600" name="Oxford 600" hex="#456075" />
              <ColorSwatch color="bg-oxford-blue-800" name="Oxford 800" hex="#384652" />
              <ColorSwatch color="bg-oxford-blue-900" name="Oxford 900" hex="#333E49" />
              <ColorSwatch color="bg-oxford-blue-950" name="Oxford 950" hex="#1E262E" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4">System Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <ColorSwatch color="bg-success" name="Success" hex="#1FC16B" />
              <ColorSwatch color="bg-warning" name="Warning" hex="#FF8447" />
              <ColorSwatch color="bg-danger" name="Danger" hex="#EB5757" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4">State Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <ColorSwatch color="bg-state-success-base" name="Success Base" hex="#1FC16B" />
                <ColorSwatch color="bg-state-success-lighter" name="Success Light" hex="#E0FAEC" />
              </div>
              <div>
                <ColorSwatch color="bg-state-warning-base" name="Warning Base" hex="#FF8447" />
                <ColorSwatch color="bg-state-warning-lighter" name="Warning Light" hex="#FFF1EB" />
              </div>
              <div>
                <ColorSwatch color="bg-state-error-base" name="Error Base" hex="#FB3748" />
                <ColorSwatch color="bg-state-error-lighter" name="Error Light" hex="#FFEBEC" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Typography</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-normal mb-4">Font Family</h3>
            <p className="text-base mb-2">Primary: Codec Pro</p>
            <p className="text-sm text-gray-600">Fallback: Inter, system-ui, sans-serif</p>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4">Font Weights</h3>
            <div className="space-y-2">
              <p className="font-thin">Thin (100) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-extralight">Extralight (200) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-light">Light (300) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-normal">Normal (400) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-normal">Medium (500) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-normal">Semibold (600) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-normal">Bold (700) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-extrabold">Extrabold (800) - The quick brown fox jumps over the lazy dog</p>
              <p className="font-heavy">Heavy (900) - The quick brown fox jumps over the lazy dog</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4">Type Scale</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Text XS (0.75rem)</p>
                <p className="text-xs">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Text SM (0.875rem)</p>
                <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Text Base (1rem)</p>
                <p className="text-base">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Text LG (1.125rem)</p>
                <p className="text-lg">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Text XL (1.25rem)</p>
                <p className="text-xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Text 2XL (1.5rem)</p>
                <p className="text-2xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Text 3XL (1.875rem)</p>
                <p className="text-3xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Text 4XL (2.25rem)</p>
                <p className="text-4xl">The quick brown fox jumps over the lazy dog</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Shadow System</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-normal mb-4">Card Shadows</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-card">
                <p className="font-normal mb-2">Card Shadow</p>
                <p className="text-sm text-gray-600">Default card elevation</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-card-default">
                <p className="font-normal mb-2">Card Default</p>
                <p className="text-sm text-gray-600">Enhanced default shadow</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-card-raised">
                <p className="font-normal mb-2">Card Raised</p>
                <p className="text-sm text-gray-600">Elevated card shadow</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4">Button Shadows</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <button className="px-4 py-2 bg-willow-primary-950 text-white rounded-lg shadow-button-primary">
                  Primary Button Shadow
                </button>
                <button className="px-4 py-2 bg-danger text-white rounded-lg shadow-button-danger">
                  Danger Button Shadow
                </button>
                <button className="px-4 py-2 bg-warning text-white rounded-lg shadow-button-warning">
                  Warning Button Shadow
                </button>
              </div>
              <div className="space-y-3">
                <button className="px-4 py-2 bg-white text-willow-primary-950 rounded-lg shadow-button-primary-stroke">
                  Primary Stroke Shadow
                </button>
                <button className="px-4 py-2 bg-white text-danger rounded-lg shadow-button-danger-stroke">
                  Danger Stroke Shadow
                </button>
                <button className="px-4 py-2 bg-white text-warning rounded-lg shadow-button-warning-stroke">
                  Warning Stroke Shadow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Spacing System</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-normal mb-4">Spacing Scale</h3>
            <div className="space-y-2">
              {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32].map((size) => (
                <div key={size} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-12">{size}</span>
                  <div className={`h-4 bg-willow-primary-500`} style={{ width: `${size * 0.25}rem` }} />
                  <span className="text-xs text-gray-500">{size * 0.25}rem / {size * 4}px</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal mb-6">Border Radius</h2>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded-none mb-2" />
            <p className="text-sm">None (0px)</p>
          </div>
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded-sm mb-2" />
            <p className="text-sm">Small (0.125rem)</p>
          </div>
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded mb-2" />
            <p className="text-sm">Default (0.25rem)</p>
          </div>
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded-md mb-2" />
            <p className="text-sm">Medium (0.375rem)</p>
          </div>
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded-lg mb-2" />
            <p className="text-sm">Large (0.5rem)</p>
          </div>
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded-xl mb-2" />
            <p className="text-sm">Extra Large (0.75rem)</p>
          </div>
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded-2xl mb-2" />
            <p className="text-sm">2XL (1rem)</p>
          </div>
          <div className="text-center">
            <div className="h-20 w-full bg-willow-primary-100 rounded-full mb-2" />
            <p className="text-sm">Full (9999px)</p>
          </div>
        </div>
      </div>
    </div>
  ),
};