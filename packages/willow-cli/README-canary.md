# Willow CLI - Canary Release

This is a canary release of the Willow CLI with simplified functionality for testing purposes.

## Installation

```bash
npm install -g willow-cli@canary
# or
npm install -g willow-cli@0.7.0-canary.1
```

## Available Commands

### Initialize a Project
```bash
willow init --framework react --ui-kit shadcn
```

### Generate Components
```bash
willow generate component Button --typescript --test
```

### Transform Components
```bash
willow transform react-to-vue src/components/
```

### List Components
```bash
willow list --installed
```

### Configure Settings
```bash
willow config get
willow config set framework vue
```

### Health Check
```bash
willow doctor --fix
```

## Features in This Canary

- ✅ Basic CLI structure and commands
- ✅ Interactive prompts with ora spinners
- ✅ Colorful output with chalk
- ✅ Help documentation
- ✅ Version management
- ⚠️ Commands show simulated output (not fully functional yet)

## Known Limitations

This canary release includes:
- Simplified command implementations that simulate behavior
- Basic CLI structure for testing the user experience
- All core commands are present but show demo output

## Next Steps

The full implementation is being developed and includes:
- Complete validation module (Task 8)
- Error handling and recovery system (Task 10)
- Registry integration for component fetching
- Actual file transformations
- Component dependency management
- Advanced configuration management

## Feedback

Please report any issues or feedback at:
https://github.com/willow-design-system/willow-cli/issues