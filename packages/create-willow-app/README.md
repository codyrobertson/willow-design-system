# create-willow-design-system

The easiest way to get started with Willow Design System.

## Usage

```bash
npx create-willow-design-system@latest
```

or 

```bash
npm create willow-design-system@latest
```

## What it does

This CLI tool helps you:

1. **Create a new project** - Choose from Next.js, Vite, or Remix
2. **Configure Tailwind CSS** - Automatically sets up Willow theme colors and fonts
3. **Set up shadcn/ui** - Configures the Willow registry for component installation
4. **Install components** - Optionally installs example components to get started
5. **Configure styling** - Sets up CSS with Willow design tokens

## Options

The CLI will prompt you for:

- **Project name** - Name of your new project
- **Framework** - Next.js, Vite, or Remix
- **TypeScript** - Whether to use TypeScript
- **Example components** - Install starter components

## Manual Setup

If you prefer manual setup, see the [Registry Documentation](https://github.com/your-org/willow-design-system/blob/main/REGISTRY_DOCUMENTATION.md).

## After Installation

```bash
cd your-project-name
npm run dev
```

Then install more components:

```bash
npx shadcn@latest add willow/button
npx shadcn@latest add willow/card
```

## License

MIT