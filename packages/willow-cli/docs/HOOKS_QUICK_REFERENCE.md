# Pre-commit Hooks Quick Reference 🚀

## Essential Commands

```bash
# Setup & Management
npm install              # Auto-installs hooks
npm run hooks:verify     # Check everything works
npm run hooks:test       # Test without committing
npm run hooks:benchmark  # Check performance

# Emergency Bypass
git commit --no-verify   # Skip hooks once
HUSKY=0 git commit      # Skip for session
```

## What Runs on Each Command

### `git commit`
1. **ESLint** - Auto-fixes linting issues ✨
2. **Prettier** - Formats your code 💅
3. **Tests** - Runs related tests 🧪
4. **TypeScript** - Checks types 📘
5. **Commit Message** - Validates format 📝

### `git push`
1. **Full Tests** - All must pass ✅
2. **Build** - Must compile 🔨
3. **Type Check** - All packages 📦

## Commit Message Format

```bash
type(scope): description

# Types: feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert

# ✅ Good
feat(auth): add OAuth integration
fix: resolve memory leak
docs: update README

# ❌ Bad  
fixed stuff            # No type
feat: Add feature     # Wrong capitalization
```

## Performance Expectations

- **Small commit (1-3 files)**: <1 second ⚡
- **Medium commit (4-10 files)**: ~1 second ⚡
- **Large commit (10+ files)**: <2 seconds ⚡

## Troubleshooting

```bash
# Hooks not running?
npm run hooks:install

# Linting errors?
npm run lint:fix

# Type errors?
npm run type-check

# Tests failing?
npm test

# Need help?
npm run hooks:bypass   # Shows all options
```

## Manual Quality Checks

```bash
npm run lint          # Check linting
npm run format        # Format all files
npm run type-check    # TypeScript check
npm run test:unit     # Run tests
npm run quality:full  # Everything at once
```

---
*💡 Pro tip: Commit often with small changes for fastest hook execution!*