# Willow Design System - Quick Start Guide

## 🚀 Method 1: Create New Project (Recommended)

The fastest way to get started with Willow Design System:

```bash
npx create-willow-design-system@latest my-willow-app
cd my-willow-app
npm run dev
```

This creates a complete Next.js project with:
- ✅ Willow fonts automatically configured
- ✅ Tailwind CSS with Willow color palette
- ✅ Essential components pre-installed
- ✅ Proper TypeScript configuration
- ✅ Ready-to-use utilities

## 🔧 Method 2: Add to Existing Project

### Step 1: Install Dependencies

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react @radix-ui/react-slot tailwindcss-animate
npm install -D shadcn@latest
```

### Step 2: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Choose these settings:
- **Style:** `new-york`
- **Base color:** `neutral` 
- **CSS variables:** `yes`

### Step 3: Add Willow Fonts

Add to your CSS file (e.g., `globals.css`):

```css
@import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');

@layer base {
  body {
    font-family: 'Codec Pro', system-ui, -apple-system, sans-serif;
  }
}
```

### Step 4: Update Tailwind Config

Add Willow colors to your `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'willow-primary': {
          50: '#f0f5ff',
          100: '#e5edff',
          600: '#4c5ff6',
          900: '#1939bc',
        },
        'success': '#1fc16b',
        'warning': '#ff8447',
        'destructive': '#ef4444',
        'info': '#7666ff',
      }
    }
  }
}
```

### Step 5: Install Willow Components

**Option A: Use Willow CLI (Recommended)**
```bash
# Install Willow CLI for easier component management
npm install -g willow-cli

# Initialize Willow in your project
willow init

# Install components with short commands
willow add button
willow add card
willow add badge
willow add input

# View all available components
willow list
```

**Option B: Use shadcn CLI with direct URLs**
```bash
# Essential components
npx shadcn@latest add https://iridescent-brigadeiros-fe4174.netlify.app/r/button.json
npx shadcn@latest add https://iridescent-brigadeiros-fe4174.netlify.app/r/card.json
npx shadcn@latest add https://iridescent-brigadeiros-fe4174.netlify.app/r/badge.json
```

## 📋 Available Components

| Component | Description | Install Command |
|-----------|-------------|-----------------|
| **Button** | Primary, secondary, destructive variants | `willow add button` |
| **Badge** | Status indicators with colors | `willow add badge` |
| **Card** | Content containers | `willow add card` |
| **Input** | Form text inputs | `willow add input` |
| **Label** | Form field labels | `willow add label` |
| **Select** | Dropdown selections | `willow add select` |
| **Textarea** | Multi-line text input | `willow add textarea` |
| **Accordion** | Collapsible content | `willow add accordion` |
| **Tabs** | Tabbed interfaces | `willow add tabs` |
| **Modal** | Dialog overlays | `willow add modal` |

## 💡 Usage Examples

### Button Variants

```tsx
import { Button } from "@/components/ui/button"

export function ButtonExample() {
  return (
    <div className="space-x-2">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
}
```

### Status Badges

```tsx
import { Badge } from "@/components/ui/badge"

export function BadgeExample() {
  return (
    <div className="space-x-2">
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Error</Badge>
      <Badge variant="secondary">Draft</Badge>
    </div>
  )
}
```

### Form Components

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function FormExample() {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Card Layout

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function CardExample() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Alpha</CardTitle>
          <Badge variant="success">Active</Badge>
        </div>
        <CardDescription>A next-generation web application</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This project showcases the power of Willow Design System.</p>
      </CardContent>
    </Card>
  )
}
```

## 🎨 Design Tokens

Willow includes a comprehensive design system:

```css
/* Primary Colors */
--willow-primary-50: #f0f5ff;
--willow-primary-600: #4c5ff6;
--willow-primary-900: #1939bc;

/* Status Colors */
--success: #1fc16b;
--warning: #ff8447;
--destructive: #ef4444;
--info: #7666ff;
```

## 🔗 Resources

- **Storybook Examples**: [View Components](https://iridescent-brigadeiros-fe4174.netlify.app/storybook)
- **Component Registry**: [Browse Registry](https://iridescent-brigadeiros-fe4174.netlify.app/r)
- **Font CDN**: `https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css`

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Run Storybook
npm run storybook

# Run tests
npm test
```

## ❓ Troubleshooting

### Components not showing Willow styling?
Make sure you've imported the Willow fonts in your CSS and added the Willow color palette to your Tailwind config.

### shadcn CLI not working?
Ensure you're using the latest version: `npm install -g shadcn@latest`

### Fonts not loading?
Verify the font import in your CSS file and check browser network tab for any blocked requests.

---

**Need help?** Check out our [Storybook documentation](https://iridescent-brigadeiros-fe4174.netlify.app/storybook) or browse the [component registry](https://iridescent-brigadeiros-fe4174.netlify.app/r).