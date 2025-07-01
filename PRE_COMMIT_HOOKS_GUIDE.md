# Pre-Commit Hooks Guide

This project uses comprehensive pre-commit hooks to maintain code quality, consistency, and documentation. The hooks are orchestrated using Husky and include multiple validation steps.

## Overview

Our pre-commit hooks run the following checks in order:

1. **Code Formatting & Linting** (via lint-staged)
2. **Test Execution** (via Vitest)
3. **Unused Export Detection** (via ts-prune)
4. **Documentation Generation** (via TypeDoc)
5. **Type Checking** (via TypeScript)

## Tools Used

### Husky
- **Purpose**: Git hooks management
- **Configuration**: `.husky/` directory
- **Hook**: `.husky/pre-commit`

### lint-staged
- **Purpose**: Run linters on staged files only
- **Configuration**: `.lintstagedrc.json`
- **Actions**:
  - ESLint with auto-fix
  - Prettier formatting
  - TypeScript compilation check

### ESLint
- **Purpose**: JavaScript/TypeScript linting
- **Configuration**: `eslint.config.mjs`
- **Integration**: Uses TypeScript parser and Prettier plugin

### Prettier
- **Purpose**: Code formatting
- **Configuration**: `.prettierrc` and `.prettierignore`
- **Settings**:
  - Single quotes
  - Trailing commas
  - 100 character line width
  - 2 space indentation

### Vitest
- **Purpose**: Fast test execution
- **Configuration**: `vitest.config.precommit.ts`
- **Features**:
  - Minimal reporter for speed
  - Fails fast on first error
  - Thread pool for parallel execution

### ts-prune
- **Purpose**: Detect unused exports
- **Configuration**: `.ts-prunerc`
- **Behavior**: Warns about unused exports (non-blocking)

### TypeDoc
- **Purpose**: API documentation generation
- **Configuration**: `typedoc.json`
- **Output**: `docs/api/` directory
- **Features**:
  - Markdown output
  - Automatic categorization
  - Link validation

## Installation

The pre-commit hooks are automatically installed when you run:

```bash
npm install
```

This triggers the `prepare` script which sets up Husky.

## Usage

### Normal Workflow

Simply commit your changes as usual:

```bash
git add .
git commit -m "feat: add new component"
```

The pre-commit hooks will run automatically.

### Bypassing Hooks (Emergency Only)

If you need to bypass the hooks in an emergency:

```bash
git commit -m "emergency fix" --no-verify
```

**Note**: This should be used sparingly and the issues should be fixed in the next commit.

### Running Checks Manually

You can run individual checks manually:

```bash
# Linting
npm run lint

# Formatting
npx prettier --write .

# Type checking
npm run typecheck

# Tests
npx vitest run --config vitest.config.precommit.ts

# Documentation
npx typedoc

# Unused exports
npx ts-prune
```

## Configuration Details

### lint-staged Configuration (`.lintstagedrc.json`)

```json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write"
  ],
  "*.{json,md,mdx,css,scss}": [
    "prettier --write"
  ],
  "*.{ts,tsx}": [
    "bash -c 'tsc --noEmit --skipLibCheck'"
  ],
  "packages/**/*.{ts,tsx}": [
    "bash -c 'cd packages/willow-cli && npm run typecheck'"
  ]
}
```

### Prettier Configuration (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Vitest Pre-commit Configuration

The pre-commit test configuration is optimized for speed:
- Uses thread pool for parallel execution
- Minimal dot reporter
- Fails fast on first error
- Coverage disabled
- Only runs tests for source files

### TypeDoc Configuration

Documentation is generated for:
- All source files in `src/`
- Library files in `lib/`
- Package source files in `packages/willow-cli/packages/*/src`

## Troubleshooting

### Hooks Not Running

If hooks aren't running:

```bash
# Reinstall husky
npm run prepare

# Verify hook is executable
ls -la .husky/pre-commit
```

### Lint Errors

For ESLint errors:
```bash
# Auto-fix what's possible
npx eslint . --fix

# Check specific file
npx eslint path/to/file.ts
```

### Type Errors

For TypeScript errors:
```bash
# Check all files
npm run typecheck

# Check specific project
cd packages/willow-cli && npm run typecheck
```

### Test Failures

For test failures:
```bash
# Run tests with full output
npx vitest run

# Run specific test file
npx vitest run path/to/test.ts
```

### Documentation Errors

For TypeDoc errors:
```bash
# Validate without generating
npx typedoc --emit none

# Generate with verbose output
npx typedoc --logLevel Verbose
```

## Performance Optimization

The hooks are optimized for performance:

1. **Staged Files Only**: Linting only runs on staged files
2. **Parallel Execution**: Tests run in parallel threads
3. **Fast Fail**: Stops on first error to save time
4. **Conditional Docs**: Documentation only updates when TypeScript files change
5. **Warning Only**: Unused exports don't block commits

## Best Practices

1. **Fix Issues Early**: Don't bypass hooks; fix issues immediately
2. **Run Checks Locally**: Test your changes before committing
3. **Keep Dependencies Updated**: Regularly update linting tools
4. **Document Exceptions**: If you must bypass, document why in the commit message
5. **Review Hook Output**: Pay attention to warnings even if they don't block

## Customization

### Adding New File Types

To add checks for new file types, update `.lintstagedrc.json`:

```json
{
  "*.{yml,yaml}": [
    "prettier --write"
  ]
}
```

### Adjusting Test Coverage

To add coverage requirements, modify `vitest.config.precommit.ts`:

```typescript
coverage: {
  enabled: true,
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

### Modifying TypeDoc Output

To change documentation output, update `typedoc.json`:

```json
{
  "out": "./docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "default"
}
```

## Maintenance

### Updating Tools

Keep tools updated for best performance and compatibility:

```bash
# Update all dev dependencies
npm update --save-dev

# Update specific tool
npm install --save-dev eslint@latest
```

### Monitoring Performance

If hooks become slow:

1. Check which step is slowest in the output
2. Consider moving slow checks to CI
3. Optimize test suite performance
4. Use more specific file patterns in lint-staged

## CI/CD Integration

These same checks should run in your CI pipeline:

```yaml
# Example GitHub Actions
- name: Lint
  run: npm run lint

- name: Type Check
  run: npm run typecheck

- name: Test
  run: npm test

- name: Build
  run: npm run build
```

---

By following this guide, you'll maintain high code quality standards while keeping the development workflow smooth and efficient.