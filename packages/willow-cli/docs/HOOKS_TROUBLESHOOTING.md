# Pre-commit Hooks Troubleshooting Guide 🔧

This guide helps you resolve common issues with the Willow CLI pre-commit hooks system.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Tool-Specific Problems](#tool-specific-problems)
4. [Performance Issues](#performance-issues)
5. [Environment Issues](#environment-issues)
6. [Emergency Procedures](#emergency-procedures)
7. [FAQ](#faq)
8. [Getting Help](#getting-help)

## Quick Diagnostics

Run this command first to diagnose most issues:

```bash
npm run hooks:verify
```

This will check:
- ✅ Husky installation
- ✅ Hook executability
- ✅ Dependencies
- ✅ Configuration files
- ✅ Test execution

## Common Issues

### 🚫 Hooks Not Running At All

**Symptoms:**
- Commits happen without any checks
- No output from pre-commit hooks
- Changes committed without formatting

**Solutions:**

```bash
# Solution 1: Reinstall hooks
npm run hooks:install

# Solution 2: Check Git version (need 2.20+)
git --version

# Solution 3: Verify hook files exist
ls -la .husky/
# Should show: pre-commit, commit-msg, pre-push

# Solution 4: Make hooks executable
chmod +x .husky/*

# Solution 5: Check if hooks are disabled
echo $HUSKY
# If shows "0", hooks are disabled. Enable with:
unset HUSKY
```

### 🔴 Commit Rejected - "Invalid commit message format"

**Symptoms:**
```
❌ Invalid commit message format!
Please use conventional commit format:
  type(scope): description
```

**Solutions:**

```bash
# Correct format examples:
git commit -m "feat: add new button component"
git commit -m "fix(auth): resolve login timeout"
git commit -m "docs: update installation guide"

# Common mistakes:
"Fixed the bug"           # ❌ No type prefix
"feat add button"         # ❌ Missing colon
"FEAT: add button"        # ❌ Wrong case
"feat: Add button"        # ❌ Capital after colon

# Valid types:
feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert
```

### 🔴 ESLint Errors Blocking Commit

**Symptoms:**
```
✖ ESLint found too many errors (exceeded max-warnings).
```

**Solutions:**

```bash
# Solution 1: Auto-fix what's possible
npm run lint:fix

# Solution 2: See all errors
npm run lint

# Solution 3: Fix specific file
npx eslint src/problem-file.ts --fix

# Solution 4: Check ESLint config
cat eslint.config.mjs

# Common fixes:
# - Remove unused imports
# - Add missing semicolons
# - Fix variable naming
# - Remove console.log statements
```

### 🔴 Prettier Formatting Errors

**Symptoms:**
```
Code style issues found. Run Prettier to fix.
```

**Solutions:**

```bash
# Solution 1: Format all files
npm run format

# Solution 2: Format specific files
npx prettier --write src/**/*.ts

# Solution 3: Check what needs formatting
npm run format:check

# Solution 4: Configure editor auto-format
# VS Code: Install Prettier extension
# Settings: "editor.formatOnSave": true
```

### 🔴 TypeScript Compilation Errors

**Symptoms:**
```
❌ TypeScript compilation failed!
```

**Solutions:**

```bash
# Solution 1: See all type errors
npm run type-check

# Solution 2: Check specific file
npx tsc --noEmit src/file.ts

# Solution 3: Quick fixes for common issues:
# - Add type annotations
# - Fix import paths
# - Handle null/undefined
# - Match interface shapes

# Solution 4: Skip lib check (temporary)
npx tsc --noEmit --skipLibCheck
```

### 🔴 Test Failures

**Symptoms:**
```
✖ vitest run failed
```

**Solutions:**

```bash
# Solution 1: Run tests manually
npm test

# Solution 2: Debug specific test
npm run test:watch

# Solution 3: Update snapshots if needed
npm run test:update

# Solution 4: Run only related tests
npx vitest related src/changed-file.ts
```

## Tool-Specific Problems

### Husky Issues

```bash
# Error: .husky/pre-commit: No such file or directory
npm run hooks:install

# Error: husky - install command is DEPRECATED
# This is just a warning, hooks still work

# Error: .git can't be found
# Ensure you're in a git repository:
git init
```

### lint-staged Issues

```bash
# Error: lint-staged failed
# Check configuration:
cat .lintstagedrc.json

# Run manually to see errors:
npx lint-staged --verbose --debug

# Clear cache if needed:
rm -rf node_modules/.cache/lint-staged
```

### ts-prune (Dead Code) Issues

```bash
# Warning: Dead code detected
# This is non-blocking, but to fix:

# See all dead code:
npm run deadcode:check

# Common cases to ignore:
# - Index files (barrel exports)
# - Test files
# - Type definitions
```

## Performance Issues

### Slow Hook Execution

**Symptoms:**
- Hooks take >10 seconds
- Terminal hangs during commit

**Solutions:**

```bash
# Solution 1: Benchmark performance
npm run hooks:benchmark

# Solution 2: Check for large files
find . -name "*.ts" -size +100k

# Solution 3: Clear all caches
rm -rf node_modules/.cache
rm -rf .eslintcache
rm -rf tsconfig.tsbuildinfo

# Solution 4: Reduce scope
# Edit .lintstagedrc.json to process fewer files

# Solution 5: Commit smaller chunks
git add -p  # Interactive staging
```

### Memory Issues

```bash
# Error: JavaScript heap out of memory

# Solution 1: Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Solution 2: Run tools separately
npm run lint
npm run format
npm test
```

## Environment Issues

### Windows-Specific Issues

```bash
# Error: Cannot run scripts
# Solution: Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Error: Line ending issues
# Solution: Configure Git
git config --global core.autocrlf true
```

### macOS-Specific Issues

```bash
# Error: Permission denied
# Solution: Fix permissions
sudo chmod -R 755 .husky

# Error: Command not found
# Solution: Install via Homebrew
brew install git
brew install node
```

### Linux-Specific Issues

```bash
# Error: /bin/sh: bad interpreter
# Solution: Install bash
sudo apt-get install bash

# Error: Permission issues
# Solution: Don't use sudo with npm
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### CI Environment Issues

```bash
# Hooks behaving differently in CI?

# Solution 1: Use CI-specific setup
npm run hooks:ci-setup

# Solution 2: Set environment variable
export CI=true

# Solution 3: Check CI documentation
cat docs/CI_INTEGRATION.md
```

## Emergency Procedures

### Can't Commit At All

```bash
# Emergency bypass (use sparingly!)
git commit --no-verify -m "emergency: fix critical issue"

# Document why you bypassed:
git commit --no-verify -m "hotfix: security patch (bypassed hooks due to CVE-2024-XXX urgency)"
```

### Completely Broken Hooks

```bash
# Temporary disable
export HUSKY=0
git commit -m "fix: repair broken hooks"
unset HUSKY

# Then fix the issue and re-enable
npm run hooks:install
npm run hooks:verify
```

### Reset Everything

```bash
# Nuclear option - complete reset
rm -rf .husky
rm -rf node_modules
npm install
npm run hooks:install
npm run hooks:verify
```

## FAQ

### Q: Why do hooks run even for documentation changes?

Hooks ensure consistent formatting for all files, including docs. To skip for true emergencies only:
```bash
git commit --no-verify
```

### Q: Can I run hooks on already committed code?

```bash
# Check entire codebase
npm run quality:full

# Generate report
npm run quality:report
```

### Q: How do I know which hook is failing?

The output shows which phase failed:
- "Running lint-staged" = Pre-commit hook
- "Validating commit message" = Commit-msg hook
- "Running pre-push hooks" = Pre-push hook

### Q: Can I customize hook behavior?

Yes! See `docs/PRE_COMMIT_HOOKS.md` for customization guide.

### Q: Hooks work locally but fail in CI?

```bash
# Ensure CI uses the same Node version
node --version

# Check for CI-specific environment
npm run hooks:ci-setup
```

### Q: How do I debug hook issues?

```bash
# Enable debug output
DEBUG=* npx lint-staged

# Run hooks manually
.husky/pre-commit

# Check individual tools
npm run lint
npm run format:check
npm run type-check
npm test
```

## Getting Help

### Self-Help Resources

1. **Verify Installation**: `npm run hooks:verify`
2. **Read Docs**: 
   - `docs/PRE_COMMIT_HOOKS.md` - Full guide
   - `docs/HOOKS_QUICK_REFERENCE.md` - Quick reference
   - `docs/CI_INTEGRATION.md` - CI setup
3. **Check Examples**: Look at recent commits for examples

### Escalation Path

1. **Try Quick Diagnostics** (above)
2. **Check FAQ** (this document)
3. **Search Issues**: GitHub issues for similar problems
4. **Ask Team**: Post in #dev-help Slack channel
5. **File Issue**: Create GitHub issue with:
   - Output of `npm run hooks:verify`
   - Error messages
   - Node version: `node --version`
   - OS and version
   - Steps to reproduce

### Debug Information to Include

When asking for help, include:

```bash
# System info
node --version
npm --version
git --version
echo $SHELL
echo $HUSKY

# Hook verification
npm run hooks:verify

# Error output (full)
npm run hooks:test 2>&1 | tee hooks-debug.log
```

## Prevention Tips

1. **Commit Often**: Smaller commits = fewer potential issues
2. **Run Checks Before Committing**: `npm run quality:full`
3. **Keep Dependencies Updated**: `npm update`
4. **Configure Your Editor**: Enable format-on-save
5. **Read Error Messages**: They usually tell you exactly what's wrong
6. **Don't Ignore Warnings**: Fix them before they become errors

---

*Remember: Hooks are here to help maintain code quality. If you're consistently having issues, reach out for help rather than bypassing them!*