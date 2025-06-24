# Willow CLI

A modular TypeScript CLI for installing Willow Design System components.

## Architecture

```
willow-cli/
├── bin/
│   └── index.js          # Entry point (only JS file)
├── src/
│   ├── cli.ts           # Main CLI setup
│   ├── commands/        # Command modules
│   │   ├── add.ts      # Add components command
│   │   ├── init.ts     # Initialize project command
│   │   └── list.ts     # List components command
│   ├── utils/          # Utility modules
│   │   ├── componentInstaller.ts  # Component installation logic
│   │   ├── configTemplates.ts     # Configuration templates
│   │   └── fileSystem.ts         # File system utilities
│   └── types/          # TypeScript types
│       ├── index.ts    # Main type definitions
│       └── didyoumean.d.ts  # Type declaration for didyoumean
├── dist/               # Compiled JavaScript (generated)
├── tsconfig.json       # TypeScript configuration
└── package.json
```

## Features

- **TypeScript**: All source code is written in TypeScript with strict types
- **Modular Architecture**: Commands and utilities are organized in separate modules
- **Type Safety**: Comprehensive type definitions for all interfaces and functions
- **Project Detection**: Automatically detects Vite/Next.js/React projects
- **Online IDE Support**: Special handling for StackBlitz, CodeSandbox, etc.
- **Dependency Resolution**: Automatically installs component dependencies
- **Barrel Exports**: Generates index.ts files for easy imports

## Commands

### `willow init`
Initialize Willow Design System in your project:
- Detects project type
- Creates configuration files
- Sets up Tailwind CSS
- Installs dependencies

### `willow add <component>`
Add components to your project:
- Validates component names
- Fetches from registry
- Handles dependencies
- Updates barrel exports

### `willow list`
List available components:
- Display all components
- Group by categories
- Output as JSON

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development
npm run dev

# Type check
npm run type-check
```

## Publishing

The CLI is published as an npm package with only the necessary files:
- Compiled JavaScript in `dist/`
- Entry point in `bin/`
- Type definitions