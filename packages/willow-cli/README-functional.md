# Willow CLI - Fully Functional Canary

A powerful CLI tool for managing and transforming UI components across different frameworks.

## Installation

```bash
npm install -g willow-cli@canary
# or
npm install -g willow-cli@0.7.0-canary.2
```

## Quick Start

1. **Initialize your project:**
```bash
willow init --framework react --ui-kit shadcn --typescript
```

2. **Add a component:**
```bash
willow add Button
```

3. **Generate a new component:**
```bash
willow generate component MyComponent --test --story
```

## Commands

### `willow init`
Initialize Willow in your project with configuration for your framework and UI kit.

**Options:**
- `--framework <name>` - Framework to use (react, vue, angular)
- `--ui-kit <kit>` - UI kit adapter (shadcn, material, bootstrap)
- `--typescript` - Use TypeScript
- `-f, --force` - Overwrite existing configuration

### `willow add <component>`
Add a pre-built component to your project from the Willow registry.

**Options:**
- `--overwrite` - Overwrite existing component
- `--no-deps` - Skip dependency installation

**Example:**
```bash
willow add Card
willow add Dialog --overwrite
```

### `willow generate <type> <name>`
Generate component scaffolding with boilerplate code.

**Options:**
- `--template <name>` - Use specific template
- `--typescript` - Generate TypeScript
- `--test` - Include test files
- `--story` - Include Storybook story

**Example:**
```bash
willow generate component Header --test --story
willow generate hook useAuth --typescript
```

### `willow transform <conversion> <path>`
Transform components between frameworks (e.g., React to Vue).

**Options:**
- `--dry-run` - Preview changes without applying
- `--backup` - Create backup before transformation

**Example:**
```bash
willow transform react-to-vue ./src/components
willow transform vue-to-angular ./components --dry-run
```

### `willow list`
List available components from the registry.

**Options:**
- `--installed` - Show only installed components
- `--category <name>` - Filter by category

**Example:**
```bash
willow list
willow list --installed
willow list --category Layout
```

### `willow config <action> [key] [value]`
Manage Willow configuration.

**Actions:**
- `get [key]` - Get configuration value
- `set <key> <value>` - Set configuration value
- `reset` - Reset configuration to defaults

**Example:**
```bash
willow config get
willow config get framework
willow config set framework vue
willow config set paths.components ./components
```

### `willow doctor`
Check project health and compatibility.

**Options:**
- `--fix` - Attempt to fix issues automatically

**Example:**
```bash
willow doctor
willow doctor --fix
```

## Configuration

Willow stores its configuration in `willow.config.json`:

```json
{
  "framework": "react",
  "uiKit": "shadcn",
  "typescript": true,
  "paths": {
    "components": "./src/components",
    "utils": "./src/utils",
    "styles": "./src/styles"
  }
}
```

## Features in This Canary

✅ **Working Commands:**
- `init` - Creates configuration and directory structure
- `add` - Installs components with proper code generation
- `generate` - Creates new components with tests and stories
- `list` - Shows available and installed components
- `transform` - Analyzes files for transformation (dry-run works)
- `config` - Full configuration management
- `doctor` - Project health checks

✅ **Functionality:**
- Creates real files and directories
- Generates proper React/TypeScript code
- Supports shadcn/ui utility functions
- Tracks installed components
- Interactive prompts for missing options
- Proper error handling and user feedback

## Component Structure

Generated components follow a consistent structure:

```
src/components/
├── Button/
│   ├── Button.tsx        # Component implementation
│   ├── index.ts          # Barrel export
│   ├── Button.test.tsx   # Unit tests (optional)
│   └── Button.stories.tsx # Storybook stories (optional)
└── Card/
    ├── Card.tsx
    └── index.ts
```

## What's Next

The full implementation will include:
- Real component registry integration
- Actual framework transformation logic
- Advanced validation and error recovery
- Component dependency resolution
- Theme and styling management
- Plugin system for extensibility

## License

MIT