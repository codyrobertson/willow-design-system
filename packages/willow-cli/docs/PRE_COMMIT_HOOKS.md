# Pre-commit Hooks Developer Guide

A comprehensive guide to understanding and using the Willow CLI pre-commit hooks system.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Hook Types](#hook-types)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Performance](#performance)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## Overview

The Willow CLI uses a comprehensive pre-commit hook system to ensure code quality, consistency, and maintainability. These hooks run automatically before commits to catch issues early in the development process.

### Key Benefits

- **🚀 Fast Execution**: <2 seconds for typical commits
- **🔧 Auto-fixing**: Automatically fixes formatting and linting issues
- **✅ Quality Assurance**: Ensures tests pass and types are correct
- **📝 Commit Standards**: Enforces conventional commit messages
- **🎯 Focused Testing**: Runs only tests related to changed files

## Architecture

### Technology Stack

- **Husky**: Git hooks management (v9.1.7)
- **lint-staged**: Staged file processing (v15.0.0)
- **ESLint**: JavaScript/TypeScript linting (v8.0.0)
- **Prettier**: Code formatting (v3.0.0)
- **Vitest**: Test execution (v1.0.0)
- **TypeScript**: Type checking (v5.8.3)
- **ts-prune**: Dead code detection (v0.10.3)

### File Structure

```
.husky/
├── pre-commit          # Main pre-commit hook
├── commit-msg          # Commit message validation
└── pre-push            # Pre-push verification

scripts/
├── setup-hooks.sh      # Hook installation script
├── verify-hooks.sh     # Verification script
├── benchmark-hooks.sh  # Performance testing
├── quality-check.sh    # Comprehensive quality check
└── ci-setup.sh         # CI environment setup

Configuration files:
├── .lintstagedrc.json  # Staged file processing config
├── .tsprunerc          # Dead code detection config
├── typedoc.json        # Documentation generation
└── package.json        # NPM scripts
```

## Hook Types

### Pre-commit Hook

Runs before each commit to ensure code quality:

```bash
# What it does:
1. ESLint --fix        # Fix linting issues
2. Prettier --write    # Format code
3. Vitest related      # Run related tests
4. TypeScript check    # Validate types
5. Dead code warning   # Detect unused exports
```

### Commit Message Hook

Validates commit message format:

```bash
# Valid format: type(scope): description

# Examples:
✅ feat(auth): add OAuth2 integration
✅ fix: resolve memory leak in parser
✅ docs: update API documentation
✅ test(utils): add edge case coverage

# Invalid:
❌ Fixed the bug         # No type
❌ feat add feature      # Missing colon
❌ FEAT: add feature     # Wrong case
```

### Pre-push Hook

Runs comprehensive checks before pushing:

```bash
# What it does:
1. Full test suite     # All tests must pass
2. Build verification  # Project must build
3. Type checking       # All packages checked
```

## Configuration

### Basic Setup

```bash
# Initial setup (automatic with npm install)
npm install

# Manual setup if needed
npm run hooks:install

# Verify installation
npm run hooks:verify
```

### Configuration Files

#### .lintstagedrc.json

```json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
    "vitest related --run --reporter=verbose"
  ],
  "*.{js,jsx}": [
    "eslint --fix --max-warnings=0", 
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

#### .tsprunerc

```json
{
  "ignore": [
    "src/index.ts",
    "src/cli.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

## Usage Examples

### Daily Development Workflow

```bash
# 1. Make your changes
vim src/components/Button.tsx

# 2. Stage changes
git add src/components/Button.tsx

# 3. Commit (hooks run automatically)
git commit -m "feat(button): add disabled state styling"

# Output:
🚀 Running pre-commit hooks...
📝 Running lint-staged (ESLint + Prettier + Tests)...
 ✔ eslint --fix --max-warnings=0
 ✔ prettier --write
 ✔ vitest related --run
🔍 Running syntax validation...
✅ Pre-commit checks passed!
```

### Testing Hooks Without Committing

```bash
# Test all hooks
npm run hooks:test

# Test specific tools
npx lint-staged --verbose
npm run type-check
npm run test:unit
```

### Bypassing Hooks (Emergency Only)

```bash
# Single commit bypass
git commit -m "hotfix: critical security patch" --no-verify

# Temporary session bypass
export HUSKY=0
git commit -m "emergency: bypass for deployment"
unset HUSKY

# View all bypass options
npm run hooks:bypass
```

### Performance Benchmarking

```bash
# Run performance tests
npm run hooks:benchmark

# Output:
📊 Scenario: Small commit (3 files, ~20 lines each)
✅ Lint-staged completed in 924ms

📊 Scenario: Medium commit (8 files, ~50 lines each)
✅ Lint-staged completed in 992ms

📊 Scenario: Large commit (15 files, ~100 lines each)
✅ Lint-staged completed in 1099ms
```

## Performance

### Optimization Strategies

1. **Parallel Processing**: Tools run concurrently when possible
2. **Incremental Checks**: Only process changed files
3. **Smart Test Selection**: Run only related tests
4. **Caching**: ESLint and TypeScript use caching

### Performance Targets

| Commit Size | Files | Target Time | Actual Time | Status |
|-------------|-------|-------------|-------------|---------|
| Small       | 1-3   | <2s         | ~900ms      | ✅ Excellent |
| Medium      | 4-10  | <5s         | ~1s         | ✅ Excellent |
| Large       | 11-20 | <10s        | ~1.1s       | ✅ Excellent |
| Very Large  | 20+   | <15s        | ~1.2s       | ✅ Excellent |

## Customization

### Adding Custom Checks

Edit `.lintstagedrc.json` to add custom commands:

```json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
    "vitest related --run",
    "npm run custom-check"  // Add your custom check
  ]
}
```

### Modifying Hook Behavior

Edit `.husky/pre-commit`:

```bash
#!/usr/bin/env sh

# Add custom logic
echo "🔍 Running custom checks..."
npm run my-custom-script

# Continue with standard hooks
npx lint-staged
```

### Environment-specific Configuration

```bash
# Development
npm run hooks:install       # Full hooks with auto-fix

# CI Environment
npm run hooks:ci-setup     # Check-only mode, no auto-fix

# Production
export HUSKY=0             # Disable hooks entirely
```

## Troubleshooting

### Common Issues

#### Hooks Not Running

```bash
# Solution 1: Reinstall hooks
npm run hooks:install

# Solution 2: Check Git version
git --version  # Need 2.20+

# Solution 3: Verify hook files
ls -la .husky/
chmod +x .husky/*
```

#### ESLint Errors

```bash
# Auto-fix possible issues
npm run lint:fix

# See all issues
npm run lint

# Check specific file
npx eslint src/file.ts --fix
```

#### TypeScript Errors

```bash
# Check all files
npm run type-check

# Check specific file
npx tsc --noEmit src/file.ts

# Skip lib check for faster results
npx tsc --noEmit --skipLibCheck
```

#### Test Failures

```bash
# Run all tests
npm test

# Debug specific test
npm run test:watch

# Run with coverage
npm run test:coverage
```

#### Performance Issues

```bash
# Benchmark current performance
npm run hooks:benchmark

# Check for large files
find . -name "*.ts" -size +100k

# Clear caches
rm -rf node_modules/.cache
```

### Debug Mode

Enable verbose output for debugging:

```bash
# Verbose lint-staged
npx lint-staged --verbose --debug

# Debug ESLint
DEBUG=eslint:* npx eslint src/

# Debug Prettier
npx prettier --log-level debug src/
```

## FAQ

### Q: Can I customize which files trigger hooks?

Yes, edit `.lintstagedrc.json` to modify file patterns:

```json
{
  "src/**/*.{ts,tsx}": ["eslint --fix"],  // Only src files
  "!**/*.generated.ts": []                // Exclude generated
}
```

### Q: How do I disable hooks for a specific project?

```bash
# Project-specific disable
echo "HUSKY=0" >> .env

# Or in package.json
"scripts": {
  "prepare": "echo 'Skipping husky install'"
}
```

### Q: Can hooks run different commands per branch?

Yes, modify hooks to check branch:

```bash
# In .husky/pre-commit
if [ "$(git branch --show-current)" = "main" ]; then
  npm run strict-checks
else
  npx lint-staged
fi
```

### Q: How do I add a new validation tool?

1. Install the tool: `npm install --save-dev new-tool`
2. Add to lint-staged: Edit `.lintstagedrc.json`
3. Test: `npm run hooks:test`
4. Document: Update this guide

### Q: What if hooks are too slow?

1. Run benchmark: `npm run hooks:benchmark`
2. Check for large files or many files
3. Consider:
   - Excluding certain file types
   - Running some checks only on CI
   - Using `--no-verify` for WIP commits

### Q: Can I run hooks on all files, not just staged?

```bash
# Run quality check on entire codebase
npm run quality:full

# Generate comprehensive report
npm run quality:report
```

## Best Practices

1. **Commit Often**: Smaller commits = faster hooks
2. **Fix Issues Early**: Don't accumulate linting errors
3. **Use Auto-fix**: Let tools fix issues automatically
4. **Keep Dependencies Updated**: Regular updates improve performance
5. **Monitor Performance**: Run benchmarks periodically
6. **Document Bypasses**: Always explain why you used `--no-verify`

## Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

---

*This guide is maintained by the Willow CLI team. For updates or corrections, please submit a PR.*