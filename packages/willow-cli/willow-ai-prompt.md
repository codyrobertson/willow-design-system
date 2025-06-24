# Willow Design System - AI Assistant Prompt

I want to use the Willow Design System in my project. It's a modern React component library with a sophisticated purple/blue brand color and neutral-first approach.

## Installation
```bash
npx willow-cli@latest init
npx willow-cli@latest add button card badge
```

## Design Philosophy
Willow uses a **balanced color approach**:
- **Neutrals first**: Most UI should use neutral colors (neutral-50 to neutral-950)
- **Purple accents**: Use willow-primary colors sparingly for key actions and brand elements
- **Semantic colors**: Info, success, warning, error colors only for their specific purposes

## Key Features
- **Components**: Enhanced shadcn/ui components with Willow styling
- **Typography**: Codec Pro font with system fallbacks
- **Colors**: Comprehensive token system (willow-primary-*, neutral-*, semantic colors)
- **Shadows**: Specialized button, card, input, and chip shadow variants
- **Themes**: Multiple button themes (primary, neutral, danger, warning, info, success)

## Best Color Practices
- **Backgrounds**: `bg-neutral-50`, `bg-white`, `bg-neutral-100`
- **Text**: `text-neutral-900` (primary), `text-neutral-600` (secondary)
- **Buttons**: `theme="neutral"` for most, `theme="primary"` for main actions
- **Accents**: `text-willow-primary-600`, `border-willow-primary-200`
- **Cards**: `bg-white` with `border-neutral-200`

## Example Usage
```tsx
// Balanced design - mostly neutral with purple accents
<Card className="bg-white border-neutral-200">
  <CardHeader>
    <h2 className="text-neutral-900">Dashboard</h2>
    <p className="text-neutral-600">Welcome back to your account</p>
  </CardHeader>
  <CardContent className="space-y-4">
    <Button theme="neutral">Settings</Button>
    <Button theme="primary">Get Started</Button>
  </CardContent>
</Card>
```

Create designs that are primarily neutral and clean, using Willow's purple brand colors strategically for emphasis and key actions, not as the dominant color scheme.