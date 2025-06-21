# Willow Design System Registry

The Willow Design System provides a shadcn-compatible component registry for easy integration into your projects.

## Using the Registry

### Option 1: Using the shadcn CLI (Recommended)

1. First, initialize shadcn in your project:

```bash
npx shadcn@latest init
```

2. Add the Willow registry to your `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "registries": [
    {
      "name": "willow",
      "url": "https://willow-design-system.vercel.app/api/registry"
    }
  ]
}
```

3. Install components from the registry:

```bash
# Install a specific component
npx shadcn@latest add willow/button

# Install multiple components
npx shadcn@latest add willow/card willow/badge willow/input
```

### Option 2: Manual Installation

1. Copy the component files from `src/components/ui/` to your project
2. Ensure you have the required dependencies:

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot
```

3. Add the Willow theme colors to your `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'willow-primary': {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#230e67',
        },
        danger: '#ef4444',
        warning: '#f97316',
        info: '#a78bfa',
        'state-error-lighter': '#fee2e2',
        'state-warning-lighter': '#fef3c7',
        'card-foreground': '#1c1917',
        'muted-foreground': '#737373',
      },
      boxShadow: {
        'card': '0px 0px 0px 1px rgba(216, 216, 216, 1), 0px 1px 3px 0px rgba(143, 143, 143, 0.4), 0px 1px 2px 0px rgba(10, 13, 20, 0.06)',
        'card-raised': '0px 2px 0px 0px rgba(221, 221, 221, 1), 0px 1px 2px 0px rgba(10, 13, 20, 0.03), 0px 1px 3px 0px rgba(143, 143, 143, 0.2), 0px 0px 0px 1px rgba(216, 216, 216, 1)',
        'card-raised-inset': 'inset 0px -4px 0px 0px rgba(226, 226, 226, 0.7)'
      },
    }
  }
}
```

## Available Components

### Core Components
- **Button** - A versatile button component with multiple themes and variants
- **Card** - Container component with header, content, and footer sections
- **Badge** - Small label component for status and categories
- **Tag** - Tag component for labels and filters
- **Chip** - Interactive chip component

### Form Components
- **Input** - Text input component
- **Label** - Form label component
- **Textarea** - Multi-line text input
- **Select** - Dropdown select component
- **Checkbox** - Checkbox input component
- **FormField** - Composite form field with label and input
- **FormCard** - Card component specialized for forms

### Special Components
- **FancyButton** - Advanced button with animations and effects
- **GradientBG** - Gradient background component
- **Highlight** - Text highlighting component
- **Logo** - Willow logo component

## Component Dependencies

Some components have dependencies on other components:
- `FormField` depends on: `Label`, `Input`, `Textarea`, `Select`
- `FormCard` depends on: `Card`

## Development

### Adding New Components to the Registry

1. Create your component in `src/components/ui/`
2. Export it from `src/components/ui/index.ts`
3. Add an entry to `registry/index.json`:

```json
{
  "name": "your-component",
  "type": "registry:ui",
  "registryDependencies": [],
  "files": [
    {
      "path": "src/components/ui/YourComponent.tsx",
      "type": "registry:ui"
    }
  ],
  "tailwind": {
    "config": {
      // Any specific Tailwind config needed
    }
  }
}
```

### Testing the Registry Locally

1. Run the development server:
```bash
npm run dev
```

2. Access the registry at:
- Full registry: `http://localhost:3000/api/registry`
- Individual component: `http://localhost:3000/api/registry/[component-name]`

## Publishing Updates

1. Update component code
2. Update version in `package.json`
3. Build the library: `npm run build-lib`
4. Deploy to Vercel or your hosting platform

The registry will automatically serve the latest components through the API endpoints.