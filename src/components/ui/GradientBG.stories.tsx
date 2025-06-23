import type { Meta, StoryObj } from '@storybook/nextjs';
import GradientBG from './GradientBG';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Badge } from './Badge';
import { ArrowRight, Play } from 'lucide-react';

const meta: Meta<typeof GradientBG> = {
  title: 'UI/GradientBG',
  component: GradientBG,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    imageUrl: {
      control: 'text',
      description: 'URL of the background image',
    },
    gradientColors: {
      control: 'object',
      description: 'Array of color strings for gradient',
    },
    gradientDirection: {
      control: 'select',
      options: ['to top', 'to bottom', 'to left', 'to right', 'to top left', 'to top right', 'to bottom left', 'to bottom right'],
      description: 'Direction of the gradient',
    },
    blur: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      description: 'Blur amount in pixels',
    },
    gradientOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Opacity of the gradient overlay',
    },
    backgroundSize: {
      control: 'select',
      options: ['cover', 'contain', 'auto'],
      description: 'How the background image is sized',
    },
    backgroundPosition: {
      control: 'text',
      description: 'Position of the background image',
    },
    darkOverlay: {
      control: 'boolean',
      description: 'Add a dark overlay for text readability',
    },
    height: {
      control: 'text',
      description: 'Height of the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GradientBG>;

export const Default: Story = {
  args: {
    imageUrl: '/onboarding_hero.png',
    gradientColors: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)'],
    gradientDirection: 'to bottom',
    blur: 0,
    gradientOpacity: 1,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    darkOverlay: false,
    height: 'min-h-screen',
  },
  render: (args) => (
    <GradientBG {...args}>
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Willow</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card is displayed over a gradient background with customizable properties.</p>
          </CardContent>
        </Card>
      </div>
    </GradientBG>
  ),
};

export const HeroSection: Story = {
  render: () => (
    <GradientBG 
      imageUrl="/onboarding_hero.png"
      gradientColors={['rgba(35,14,103,0.8)', 'rgba(49,26,255,0.4)']}
      gradientDirection="to bottom right"
    >
      <div className="min-h-screen flex flex-col">
        <header className="p-6">
          <nav className="flex items-center justify-between">
            <div className="text-white text-2xl font-normal">Willow</div>
            <div className="flex gap-6">
              <a href="#" className="text-white/80 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">About</a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">Services</a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">Contact</a>
            </div>
          </nav>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-3xl">
            <Badge variant="secondary" theme="primary" className="mb-4">New Launch</Badge>
            <h1 className="text-6xl font-normal mb-6">Welcome to Willow Health</h1>
            <p className="text-xl mb-8 opacity-90">
              Experience healthcare simplified. Your personal aftercare assistant is here to guide you through recovery with personalized support.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" theme="primary">
                Get Started <ArrowRight className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-willow-primary-950">
                Watch Demo <Play className="ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </GradientBG>
  ),
};

export const BlurredBackground: Story = {
  render: () => (
    <GradientBG 
      imageUrl="/onboarding_hero.png"
      blur={8}
      gradientColors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)']}
    >
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle>Blurred Background Effect</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The background image is blurred for a frosted glass effect.</p>
            <div className="flex gap-2">
              <Badge variant="secondary" theme="info">8px blur</Badge>
              <Badge variant="secondary" theme="success">Light overlay</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </GradientBG>
  ),
};

export const GradientDirections: Story = {
  render: () => (
    <div className="grid grid-cols-2 grid-rows-2 h-screen">
      <GradientBG 
        gradientColors={['#F4F3FF', '#230E67']}
        gradientDirection="to bottom"
        height="h-full"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-2xl font-normal mb-2">To Bottom</h3>
            <p className="text-sm opacity-75">Default gradient direction</p>
          </div>
        </div>
      </GradientBG>
      
      <GradientBG 
        gradientColors={['#E0FAEC', '#1FC16B']}
        gradientDirection="to right"
        height="h-full"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <h3 className="text-2xl font-normal mb-2">To Right</h3>
            <p className="text-sm opacity-90">Horizontal gradient</p>
          </div>
        </div>
      </GradientBG>
      
      <GradientBG 
        gradientColors={['#FFF1EB', '#FF8447']}
        gradientDirection="to bottom right"
        height="h-full"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-2xl font-normal mb-2">To Bottom Right</h3>
            <p className="text-sm opacity-75">Diagonal gradient</p>
          </div>
        </div>
      </GradientBG>
      
      <GradientBG 
        gradientColors={['#FFEBEC', '#FB3748']}
        gradientDirection="to top left"
        height="h-full"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-2xl font-normal mb-2">To Top Left</h3>
            <p className="text-sm opacity-75">Reverse diagonal</p>
          </div>
        </div>
      </GradientBG>
    </div>
  ),
};

export const MultiColorGradient: Story = {
  render: () => (
    <GradientBG 
      gradientColors={[
        'rgba(244,243,255,0.9)',
        'rgba(141,128,255,0.7)',
        'rgba(118,102,255,0.8)',
        'rgba(35,14,103,0.95)'
      ]}
      gradientDirection="to bottom"
    >
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-white max-w-2xl">
          <h1 className="text-5xl font-normal mb-6">Multi-Color Gradient</h1>
          <p className="text-xl mb-8 opacity-90">
            Using the Willow primary color palette to create a smooth multi-stop gradient
          </p>
          <Button size="lg" variant="secondary">Explore More</Button>
        </div>
      </div>
    </GradientBG>
  ),
};

export const DarkOverlayExample: Story = {
  render: () => (
    <GradientBG 
      imageUrl="/onboarding_hero.png"
      darkOverlay={true}
      gradientColors={['transparent', 'rgba(35,14,103,0.3)']}
    >
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-white max-w-2xl">
          <h1 className="text-5xl font-normal mb-6">Dark Overlay Active</h1>
          <p className="text-xl mb-8 opacity-90">
            The dark overlay provides better text readability on bright images
          </p>
          <div className="flex gap-4 justify-center">
            <Badge variant="secondary" theme="neutral">50% Black Overlay</Badge>
            <Badge variant="secondary" theme="primary">Subtle Gradient</Badge>
          </div>
        </div>
      </div>
    </GradientBG>
  ),
};

export const CustomHeight: Story = {
  render: () => (
    <div className="space-y-4">
      <GradientBG 
        gradientColors={['#F4F3FF', '#D1CCFF']}
        height="h-32"
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-lg">Custom Height: h-32 (8rem)</p>
        </div>
      </GradientBG>
      
      <GradientBG 
        gradientColors={['#E0FAEC', '#bbf7d0']}
        height="h-48"
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-lg">Custom Height: h-48 (12rem)</p>
        </div>
      </GradientBG>
      
      <GradientBG 
        gradientColors={['#FFF1EB', '#fed7aa']}
        height="h-64"
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-lg">Custom Height: h-64 (16rem)</p>
        </div>
      </GradientBG>
    </div>
  ),
};

export const OpacityVariations: Story = {
  render: () => (
    <div className="relative">
      <GradientBG 
        imageUrl="/onboarding_hero.png"
        height="min-h-screen"
      >
        <div className="grid grid-cols-3 gap-4 p-8 h-screen">
          <div className="relative">
            <GradientBG 
              gradientColors={['#230E67', '#7666FF']}
              gradientOpacity={0.3}
              height="h-full"
              className="rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <h3 className="text-xl font-normal mb-2">30% Opacity</h3>
                  <p className="text-sm">Subtle overlay</p>
                </div>
              </div>
            </GradientBG>
          </div>
          
          <div className="relative">
            <GradientBG 
              gradientColors={['#230E67', '#7666FF']}
              gradientOpacity={0.6}
              height="h-full"
              className="rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <h3 className="text-xl font-normal mb-2">60% Opacity</h3>
                  <p className="text-sm">Balanced overlay</p>
                </div>
              </div>
            </GradientBG>
          </div>
          
          <div className="relative">
            <GradientBG 
              gradientColors={['#230E67', '#7666FF']}
              gradientOpacity={0.9}
              height="h-full"
              className="rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <h3 className="text-xl font-normal mb-2">90% Opacity</h3>
                  <p className="text-sm">Strong overlay</p>
                </div>
              </div>
            </GradientBG>
          </div>
        </div>
      </GradientBG>
    </div>
  ),
};

export const BackgroundPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4 h-screen">
      <GradientBG 
        imageUrl="/onboarding_hero.png"
        backgroundPosition="top"
        backgroundSize="cover"
        gradientColors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        height="h-full"
        className="rounded-lg overflow-hidden"
      >
        <div className="flex items-end justify-center h-full p-8">
          <div className="text-center text-white">
            <h3 className="text-xl font-normal">Position: Top</h3>
          </div>
        </div>
      </GradientBG>
      
      <GradientBG 
        imageUrl="/onboarding_hero.png"
        backgroundPosition="bottom"
        backgroundSize="cover"
        gradientColors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        height="h-full"
        className="rounded-lg overflow-hidden"
      >
        <div className="flex items-end justify-center h-full p-8">
          <div className="text-center text-white">
            <h3 className="text-xl font-normal">Position: Bottom</h3>
          </div>
        </div>
      </GradientBG>
      
      <GradientBG 
        imageUrl="/onboarding_hero.png"
        backgroundPosition="left"
        backgroundSize="contain"
        gradientColors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        height="h-full"
        className="rounded-lg overflow-hidden"
      >
        <div className="flex items-end justify-center h-full p-8">
          <div className="text-center text-white">
            <h3 className="text-xl font-normal">Size: Contain, Position: Left</h3>
          </div>
        </div>
      </GradientBG>
      
      <GradientBG 
        imageUrl="/onboarding_hero.png"
        backgroundPosition="right"
        backgroundSize="contain"
        gradientColors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        height="h-full"
        className="rounded-lg overflow-hidden"
      >
        <div className="flex items-end justify-center h-full p-8">
          <div className="text-center text-white">
            <h3 className="text-xl font-normal">Size: Contain, Position: Right</h3>
          </div>
        </div>
      </GradientBG>
    </div>
  ),
};