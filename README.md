# Willow Design System

A modern, accessible design system built with React, TypeScript, and Tailwind CSS. Built on top of shadcn/ui with custom Willow branding and components.

## 🚀 Quick Start

### Option 1: Create New Project (Recommended)

```bash
npx create-willow-design-system@latest my-app
cd my-app
npm run dev
```

### Option 2: Add to Existing Project

1. **Install Dependencies**
```bash
npm install clsx tailwind-merge class-variance-authority lucide-react @radix-ui/react-slot tailwindcss-animate
npm install -D shadcn@latest
```

2. **Configure shadcn for Willow**
```bash
npx shadcn@latest init
```

When prompted, use these settings:
- Style: `new-york`
- Base color: `neutral`
- CSS variables: `yes`

3. **Update `components.json`**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  },
  "registries": {
    "willow": {
      "url": "https://iridescent-brigadeiros-fe4174.netlify.app/r"
    }
  }
}
```

4. **Add Willow Fonts**
```css
/* In your globals.css */
@import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');

@layer base {
  body {
    font-family: 'Codec Pro', system-ui, -apple-system, sans-serif;
  }
}
```

5. **Install Willow Components**
```bash
# Install the Willow CLI for easier component management
npm install -g willow-cli

# Install specific components with short commands
willow add button
willow add card
willow add badge
willow add input

# Or use shadcn CLI with direct URLs
npx shadcn@latest add https://iridescent-brigadeiros-fe4174.netlify.app/r/button.json
npx shadcn@latest add https://iridescent-brigadeiros-fe4174.netlify.app/r/card.json
```

## 📦 Available Components

- **Button** - Primary, secondary, destructive, and ghost variants
- **Badge** - Status indicators with multiple color schemes
- **Card** - Content containers with header, content, and footer
- **Input** - Form inputs with validation states
- **Select** - Dropdown selections
- **Textarea** - Multi-line text input
- **Label** - Form field labels
- **Separator** - Visual dividers

## 🎨 Design Tokens

Willow includes a comprehensive color palette and design tokens:

```css
/* Primary Colors */
--willow-primary-50: #f0f5ff;
--willow-primary-600: #4c5ff6;
--willow-primary-900: #1939bc;

/* Success, Warning, Destructive, Info */
--success: #1fc16b;
--warning: #ff8447;
--destructive: #ef4444;
--info: #7666ff;
```

## 🔧 Usage Examples

### Basic Button
```tsx
import { Button } from "@/components/ui/button"

export function MyComponent() {
  return (
    <Button variant="default" size="md">
      Click me
    </Button>
  )
}
```

### Card Layout
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content</p>
      </CardContent>
    </Card>
  )
}
```

### Status Badge
```tsx
import { Badge } from "@/components/ui/badge"

export function StatusBadge() {
  return (
    <Badge variant="success">Active</Badge>
  )
}
```

## 🎯 Tailwind Configuration

Add Willow's color palette to your `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'willow-primary': {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbfe',
          300: '#b4c6fc',
          400: '#8da2fb',
          500: '#6b7ff8',
          600: '#4c5ff6',
          700: '#254df2',
          800: '#2040d8',
          900: '#1939bc',
          950: '#0f2481',
        },
        'success': {
          DEFAULT: '#1fc16b',
          50: '#f0fdf4',
          500: '#1fc16b',
          900: '#14532d',
        },
        'warning': {
          DEFAULT: '#ff8447',
          50: '#fff7ed',
          500: '#ff8447',
          900: '#7c2d12',
        }
      }
    }
  }
}
```

## 📚 Documentation

- **Storybook**: [https://iridescent-brigadeiros-fe4174.netlify.app/storybook](https://iridescent-brigadeiros-fe4174.netlify.app/storybook)
- **Component Registry**: [https://iridescent-brigadeiros-fe4174.netlify.app/r](https://iridescent-brigadeiros-fe4174.netlify.app/r)

## 🔗 Font CDN

Willow fonts are served from our CDN:

```html
<!-- Option 1: Link in HTML -->
<link rel="stylesheet" href="https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css">

<!-- Option 2: Import in CSS -->
@import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run Storybook
npm run storybook
```

## 📝 License

MIT License - see LICENSE file for details.
