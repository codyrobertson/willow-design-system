# Willow Design System Registry Documentation

## Overview

The Willow Design System provides a comprehensive component registry compatible with [shadcn/ui](https://ui.shadcn.com), allowing developers to easily install and use our components in their projects.

## Quick Start

### Method 1: Using create-willow-app (Recommended)

Initialize a new project with Willow Design System pre-configured:

```bash
npx create-willow-app@latest
```

This will:
- Create a new project with your chosen framework (Next.js, Vite, or Remix)
- Configure Tailwind CSS with Willow theme colors
- Set up the Willow registry
- Install example components
- Configure fonts and styling

### Method 2: Manual Installation

1. **Configure your components.json**

Add the Willow registry to your `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
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
      "url": "https://willow-prod.vercel.app/r"
    }
  }
}
```

2. **Install components**

```bash
# Install individual components
npx shadcn@latest add willow/button
npx shadcn@latest add willow/card
npx shadcn@latest add willow/badge

# Or use direct URLs
npx shadcn@latest add https://willow-prod.vercel.app/r/button.json
```

## Registry Endpoints

### Production Registry
- **Base URL**: `https://willow-prod.vercel.app`
- **Registry Files**: `https://willow-prod.vercel.app/r/[component].json`
- **API Endpoints**: `https://willow-prod.vercel.app/api/registry/`

### Available Endpoints

1. **Component Registry Files** (Static)
   - Pattern: `/r/[component].json`
   - Example: `https://willow-prod.vercel.app/r/button.json`

2. **Dynamic API Endpoints**
   - Registry metadata: `/api/registry.json`
   - Component endpoint: `/api/registry/ui/[component]`
   - Utils endpoint: `/api/registry/lib/utils.json`

## Available Components

### Core Components
- `accordion` - Expandable accordion component
- `avatar` - User avatar with fallback
- `badge` - Status and label badges
- `button` - Multi-theme button with variants
- `card` - Container card component
- `checkbox` - Form checkbox input
- `chip` - Compact information display

### Form Components
- `input` - Text input field
- `select` - Dropdown selection
- `textarea` - Multi-line text input
- `form-field` - Complete form field with label
- `form-card` - Card container for forms

### Display Components
- `tabs` - Tabbed content container
- `tooltip` - Hover tooltips
- `toast` - Notification toasts
- `modal` - Dialog modals
- `skeleton` - Loading placeholders

### Special Components
- `icon` - Willow icon system
- `icon-text` - Icon with text combinations
- `gradient-bg` - Animated gradient backgrounds
- `logo` - Willow brand logo

## Theme Configuration

### Colors

Add Willow theme colors to your `tailwind.config.js`:

```javascript
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
          // ... full palette
        },
        'warning': {
          DEFAULT: '#ff8447',
          // ... full palette
        },
        'destructive': {
          DEFAULT: '#ef4444',
          // ... full palette
        },
        'info': {
          DEFAULT: '#7666ff',
          // ... full palette
        },
      },
    },
  },
}
```

### Fonts

Willow uses the Codec Pro font family. Add to your CSS:

```css
@font-face {
  font-family: 'Codec Pro';
  src: url('https://willow-prod.vercel.app/cdn/fonts/Codec-Pro-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://willow-prod.vercel.app/cdn/fonts/Codec-Pro-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
}

body {
  font-family: 'Codec Pro', system-ui, -apple-system, sans-serif;
}
```

## Component Usage Examples

### Button Component

```tsx
import { Button } from "@/components/ui/button"

export function Example() {
  return (
    <>
      <Button theme="primary" variant="default">
        Primary Button
      </Button>
      
      <Button theme="success" variant="fancy">
        Success Button
      </Button>
      
      <Button 
        theme="danger" 
        variant="outline"
        leftIcon={<AlertCircle />}
      >
        Delete Item
      </Button>
    </>
  )
}
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Willow</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Your content here</p>
      </CardContent>
    </Card>
  )
}
```

## Advanced Configuration

### Custom Registry Path

If you need to self-host the registry:

```json
{
  "registries": {
    "willow": {
      "url": "https://your-domain.com/path/to/registry"
    }
  }
}
```

### Authentication

For private registries, add authentication:

```bash
npx shadcn@latest add https://willow-prod.vercel.app/r/button.json?token=YOUR_TOKEN
```

## Troubleshooting

### Common Issues

1. **Component not found**
   - Ensure the registry URL is correct
   - Check if the component name matches exactly

2. **Styling issues**
   - Make sure Tailwind config includes Willow colors
   - Verify CSS variables are properly set

3. **Font loading issues**
   - Check CORS settings if self-hosting
   - Ensure font URLs are accessible

### Getting Help

- Documentation: https://willow-prod.vercel.app/docs
- GitHub Issues: https://github.com/your-org/willow-design-system/issues
- Registry Test Page: https://willow-prod.vercel.app/registry-test

## Contributing

To add new components to the registry:

1. Create component in `registry/components/ui/`
2. Add to `registry.json`
3. Run `npm run registry:build`
4. Deploy changes

## License

MIT License - see LICENSE file for details.