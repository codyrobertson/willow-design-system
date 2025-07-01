# Willow CLI Command Structure Specification

## Overview

The Willow CLI provides a comprehensive set of commands for managing design system components, with a focus on simplicity, discoverability, and power user features.

## Command Structure

### Primary Commands

```bash
willow <command> [options] [arguments]
```

### Global Options

```bash
--version, -v          # Show version number
--help, -h             # Show help
--config, -c <path>    # Specify config file location
--verbose              # Enable verbose output
--quiet, -q            # Suppress non-error output
--no-color             # Disable colored output
--dry-run              # Preview changes without applying
--json                 # Output in JSON format
```

## Core Commands

### 1. `willow init`

Initialize Willow in a project.

```bash
willow init [options]

Options:
  --framework <name>     # Framework to use (react, vue, angular)
  --ui-kit <kit>        # UI kit adapter (shadcn, material, bootstrap)
  --typescript           # Use TypeScript (default: auto-detect)
  --style <type>        # Styling approach (tailwind, css-modules, styled)
  --skip-install        # Skip dependency installation
  --force               # Overwrite existing configuration
  --interactive, -i     # Interactive mode (default)
  --preset <name>       # Use a preset configuration

Examples:
  willow init
  willow init --framework react --ui-kit shadcn
  willow init --preset nextjs-tailwind
```

### 2. `willow add`

Add components to the project.

```bash
willow add <component...> [options]

Arguments:
  component              # Component name(s) to add

Options:
  --all                 # Add all available components
  --dependencies, -d    # Also add component dependencies
  --overwrite          # Overwrite existing components
  --path <path>        # Custom installation path
  --registry <url>     # Use custom registry
  --example            # Include example usage files
  --skip-validation    # Skip component validation

Examples:
  willow add button
  willow add button card modal --dependencies
  willow add --all
  willow add button --path src/ui
```

### 3. `willow remove`

Remove components from the project.

```bash
willow remove <component...> [options]

Arguments:
  component              # Component name(s) to remove

Options:
  --keep-dependencies   # Keep shared dependencies
  --force              # Remove without confirmation
  --clean              # Remove unused dependencies

Examples:
  willow remove button
  willow remove button card --keep-dependencies
```

### 4. `willow list`

List available components.

```bash
willow list [options]

Options:
  --installed          # Show only installed components
  --available          # Show only available components
  --outdated          # Show components with updates
  --details           # Show detailed information
  --category <name>   # Filter by category
  --search <query>    # Search components

Examples:
  willow list
  willow list --installed
  willow list --category forms
  willow list --search "date"
```

### 5. `willow update`

Update components to latest versions.

```bash
willow update [component...] [options]

Arguments:
  component              # Component name(s) to update (optional)

Options:
  --all                # Update all components
  --check              # Check for updates only
  --major              # Include major version updates
  --interactive        # Select updates interactively

Examples:
  willow update
  willow update button card
  willow update --all
  willow update --check
```

### 6. `willow validate`

Validate components and configuration.

```bash
willow validate [component...] [options]

Arguments:
  component              # Component name(s) to validate (optional)

Options:
  --fix                # Auto-fix issues when possible
  --config             # Validate configuration only
  --accessibility      # Run accessibility checks
  --performance        # Run performance checks
  --strict             # Use strict validation rules

Examples:
  willow validate
  willow validate button --fix
  willow validate --config
  willow validate --accessibility --strict
```

### 7. `willow config`

Manage Willow configuration.

```bash
willow config <action> [options]

Actions:
  get <key>            # Get configuration value
  set <key> <value>    # Set configuration value
  list                 # List all configuration
  reset                # Reset to defaults
  edit                 # Open config in editor

Options:
  --global             # Use global config
  --local              # Use local config (default)

Examples:
  willow config get ui-kit
  willow config set ui-kit material
  willow config list
  willow config edit
```

### 8. `willow theme`

Manage design system themes.

```bash
willow theme <action> [options]

Actions:
  create <name>        # Create new theme
  apply <name>         # Apply a theme
  list                 # List available themes
  export <name>        # Export theme configuration
  import <file>        # Import theme from file

Options:
  --base <theme>       # Base theme to extend
  --interactive        # Interactive theme builder

Examples:
  willow theme create dark --base default
  willow theme apply dark
  willow theme export dark --output theme.json
```

### 9. `willow generate`

Generate component scaffolding.

```bash
willow generate <type> <name> [options]

Arguments:
  type                 # Type (component, hook, utility, adapter)
  name                 # Name of generated item

Options:
  --template <name>    # Use specific template
  --typescript         # Generate TypeScript (default)
  --test              # Include test files
  --story             # Include Storybook story
  --force             # Overwrite existing files

Examples:
  willow generate component DatePicker
  willow generate hook useMediaQuery --test
  willow generate adapter CustomUI
```

### 10. `willow doctor`

Diagnose and fix common issues.

```bash
willow doctor [options]

Options:
  --fix                # Attempt to fix issues
  --report <file>      # Save report to file
  --check <type>       # Specific check (deps, config, env)

Examples:
  willow doctor
  willow doctor --fix
  willow doctor --check deps
```

## Advanced Commands

### 11. `willow registry`

Manage component registries.

```bash
willow registry <action> [options]

Actions:
  add <name> <url>     # Add custom registry
  remove <name>        # Remove registry
  list                 # List registries
  use <name>           # Set active registry
  sync                 # Sync registry data

Examples:
  willow registry add work https://registry.company.com
  willow registry use work
  willow registry sync
```

### 12. `willow migrate`

Migrate between UI kits or versions.

```bash
willow migrate <from> <to> [options]

Arguments:
  from                 # Source UI kit or version
  to                   # Target UI kit or version

Options:
  --components <list>  # Specific components to migrate
  --backup             # Create backup before migration
  --interactive        # Review changes interactively

Examples:
  willow migrate material-v4 material-v5
  willow migrate bootstrap shadcn --interactive
```

### 13. `willow analyze`

Analyze component usage and patterns.

```bash
willow analyze [options]

Options:
  --usage              # Component usage statistics
  --performance        # Performance metrics
  --dependencies       # Dependency analysis
  --suggestions        # Improvement suggestions
  --output <file>      # Save analysis report

Examples:
  willow analyze --usage
  willow analyze --performance --output report.json
```

### 14. `willow preset`

Manage configuration presets.

```bash
willow preset <action> [name] [options]

Actions:
  create <name>        # Create preset from current config
  apply <name>         # Apply a preset
  list                 # List available presets
  share <name>         # Share preset (generate URL)

Examples:
  willow preset create my-setup
  willow preset apply nextjs-tailwind
  willow preset share my-setup
```

## Command Aliases

For convenience and compatibility:

```bash
# Short aliases
w init               # willow init
w add                # willow add
w rm                 # willow remove
w ls                 # willow list
w up                 # willow update

# Alternative names
willow install       # alias for 'add'
willow uninstall     # alias for 'remove'
willow upgrade       # alias for 'update'
willow check         # alias for 'validate'
```

## Interactive Mode

When no arguments are provided to commands that expect them, enter interactive mode:

```bash
willow add
# ? Which components would you like to add? (Use arrow keys)
# ❯ ◯ accordion
#   ◯ alert
#   ◯ avatar
#   ◯ badge
#   ◯ button
```

## Configuration File

`.willow/config.json`:

```json
{
  "framework": "react",
  "uiKit": "shadcn",
  "style": "tailwind",
  "typescript": true,
  "paths": {
    "components": "src/components",
    "utils": "src/lib/utils",
    "styles": "src/styles"
  },
  "registry": {
    "url": "https://registry.willow-ui.com",
    "custom": []
  },
  "theme": {
    "colors": {},
    "fonts": {},
    "spacing": {}
  },
  "validation": {
    "strict": false,
    "rules": []
  }
}
```

## Error Handling

All commands should provide clear, actionable error messages:

```bash
❌ Error: Component 'button' already exists
   
   Use --overwrite to replace the existing component:
   willow add button --overwrite
   
   Or remove it first:
   willow remove button
```

## Progress Reporting

For long-running operations:

```bash
Installing components...
  ✓ Fetching button from registry
  ✓ Validating dependencies
  ↻ Installing button component... 45%
  ◯ Updating imports
  ◯ Running post-install hooks
```

## Help System

Comprehensive help for all commands:

```bash
willow help                    # General help
willow help add               # Command-specific help
willow add --help             # Same as above
willow --help                 # Show all commands
```

## Environment Variables

```bash
WILLOW_REGISTRY         # Default registry URL
WILLOW_CONFIG          # Config file location
WILLOW_CACHE_DIR       # Cache directory
WILLOW_NO_COLOR        # Disable colors
WILLOW_VERBOSE         # Enable verbose output
WILLOW_TELEMETRY       # Enable/disable telemetry
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Component not found
- `4` - Configuration error
- `5` - Network error
- `6` - Validation error
- `7` - Permission error

## Future Considerations

- Plugin system for custom commands
- Shell completions (bash, zsh, fish)
- GUI companion app
- CI/CD integrations
- Version constraints and locking
- Workspace/monorepo support
- Offline mode with cached registry

---

This specification provides a comprehensive, user-friendly CLI interface that scales from simple component installation to complex design system management.