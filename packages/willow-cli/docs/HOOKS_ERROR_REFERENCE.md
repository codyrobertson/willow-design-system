# Pre-commit Hooks Error Messages Reference 📖

A comprehensive guide to understanding and resolving error messages from the pre-commit hooks system.

## Table of Contents

- [Husky Errors](#husky-errors)
- [ESLint Errors](#eslint-errors)
- [Prettier Errors](#prettier-errors)
- [TypeScript Errors](#typescript-errors)
- [Test Errors](#test-errors)
- [Commit Message Errors](#commit-message-errors)
- [Performance Warnings](#performance-warnings)
- [System Errors](#system-errors)

## Husky Errors

### Error: `.husky/pre-commit: No such file or directory`

**Meaning**: Husky hooks are not installed.

**Solution**:
```bash
npm run hooks:install
```

### Warning: `husky - install command is DEPRECATED`

**Meaning**: Using an older husky command (non-breaking).

**Solution**: 
- This is just a warning, hooks still work
- Update will be handled in future package updates

### Error: `.git can't be found`

**Meaning**: Not in a Git repository or Git not initialized.

**Solution**:
```bash
git init
# OR if in wrong directory:
cd /path/to/your/project
```

### Error: `HUSKY=0 environment variable is set`

**Meaning**: Hooks are disabled via environment variable.

**Solution**:
```bash
unset HUSKY
# OR check your .env file
```

## ESLint Errors

### Error: `Unexpected console statement (no-console)`

**Example**:
```
error  Unexpected console statement  no-console
```

**Solution**:
```javascript
// Remove the console.log
console.log('debug'); // ❌ Remove this

// Or if needed for debugging:
// eslint-disable-next-line no-console
console.log('debug'); // ✅ With exception
```

### Error: `'X' is defined but never used (no-unused-vars)`

**Example**:
```
error  'useState' is defined but never used  @typescript-eslint/no-unused-vars
```

**Solution**:
```javascript
// Remove unused import
import { useState } from 'react'; // ❌ If not used

// Or prefix with underscore if intentionally unused
const _unusedVar = 'value'; // ✅ Prefixed
```

### Error: `Missing semicolon (semi)`

**Example**:
```
error  Missing semicolon  semi
```

**Solution**:
```javascript
const value = 42  // ❌ Missing semicolon
const value = 42; // ✅ Added semicolon
```

### Error: `Too many errors (exceeded max-warnings)`

**Example**:
```
✖ ESLint found too many errors (exceeded max-warnings).
```

**Solution**:
```bash
# Fix all auto-fixable issues first
npm run lint:fix

# Then see remaining issues
npm run lint

# Fix manually one by one
```

## Prettier Errors

### Error: `Code style issues found`

**Example**:
```
Checking formatting...
Code style issues found in the above file(s). Forgot to run Prettier?
```

**Solution**:
```bash
# Auto-format all files
npm run format

# Or format specific files
npx prettier --write src/**/*.ts
```

### Error: `Invalid prettier configuration`

**Example**:
```
Invalid configuration file `.prettierrc`: Unexpected token
```

**Solution**:
```bash
# Check prettier config syntax
cat .prettierrc

# Use default config if broken
rm .prettierrc
npm run format
```

## TypeScript Errors

### Error: `Cannot find module 'X'`

**Example**:
```typescript
error TS2307: Cannot find module '@/components/Button' or its corresponding type declarations.
```

**Solution**:
```typescript
// Check import path
import Button from '@/components/Button'; // ❌ Wrong path
import Button from './components/Button'; // ✅ Correct path

// Or install missing package
npm install missing-package
```

### Error: `Property 'X' does not exist on type 'Y'`

**Example**:
```typescript
error TS2339: Property 'name' does not exist on type 'User'.
```

**Solution**:
```typescript
// Add property to type
interface User {
  id: number;
  // name: string; // ❌ Missing
  name: string;    // ✅ Added
}

// Or use optional chaining
user.name        // ❌ May not exist
user.name?.trim() // ✅ Safe access
```

### Error: `Type 'X' is not assignable to type 'Y'`

**Example**:
```typescript
error TS2322: Type 'string' is not assignable to type 'number'.
```

**Solution**:
```typescript
// Fix type mismatch
const count: number = "5";     // ❌ Wrong type
const count: number = 5;       // ✅ Correct type
const count: number = parseInt("5"); // ✅ Convert type
```

### Error: `Object is possibly 'null' or 'undefined'`

**Example**:
```typescript
error TS2531: Object is possibly 'null'.
```

**Solution**:
```typescript
// Add null check
element.focus();           // ❌ May be null
element?.focus();          // ✅ Optional chaining
if (element) element.focus(); // ✅ Null check
```

## Test Errors

### Error: `Test suite failed to run`

**Example**:
```
FAIL  src/components/Button.test.tsx
  ● Test suite failed to run
```

**Solution**:
```bash
# Check for syntax errors in test file
npx vitest run src/components/Button.test.tsx

# Check imports
# Make sure all imports exist
```

### Error: `expect(received).toBe(expected)`

**Example**:
```
Expected: "Hello"
Received: "Hello "
```

**Solution**:
```javascript
// Fix test expectation
expect(text).toBe('Hello ');  // ✅ Match actual
expect(text.trim()).toBe('Hello'); // ✅ Trim whitespace
```

### Error: `Cannot find module in test`

**Example**:
```
Cannot find module '@testing-library/react' from 'Button.test.tsx'
```

**Solution**:
```bash
# Install test dependencies
npm install --save-dev @testing-library/react
```

## Commit Message Errors

### Error: `Invalid commit message format!`

**Full Error**:
```
❌ Invalid commit message format!

Please use conventional commit format:
  type(scope): description

Examples:
  feat(auth): add user authentication
  fix: resolve memory leak in parser
  docs: update API documentation

Valid types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
```

**Common Issues & Solutions**:

```bash
# ❌ Wrong formats:
git commit -m "updated code"          # No type
git commit -m "feat add button"       # Missing colon
git commit -m "FEAT: add button"      # Wrong case
git commit -m "feat: Add button"      # Capital after colon
git commit -m "feature: add button"   # Invalid type

# ✅ Correct formats:
git commit -m "feat: add button component"
git commit -m "fix(auth): resolve login timeout"
git commit -m "docs: update README installation"
git commit -m "test: add unit tests for utils"
```

## Performance Warnings

### Warning: `Hook execution time: 15234ms`

**Meaning**: Hooks taking longer than expected.

**Solution**:
```bash
# Run benchmark
npm run hooks:benchmark

# Clear caches
rm -rf node_modules/.cache

# Commit in smaller chunks
git add -p  # Interactive staging
```

### Warning: `Dead code detected (non-blocking)`

**Meaning**: Unused exports found (doesn't block commit).

**Solution**:
```bash
# See all dead code
npm run deadcode:check

# Remove unused exports or ignore if needed
```

## System Errors

### Error: `Permission denied`

**Example**:
```
sh: .husky/pre-commit: Permission denied
```

**Solution**:
```bash
# Fix permissions
chmod +x .husky/*

# If still fails (avoid sudo with npm)
sudo chown -R $(whoami) .husky
```

### Error: `Command not found`

**Example**:
```
sh: eslint: command not found
```

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Check PATH
npm bin
export PATH=$(npm bin):$PATH
```

### Error: `ENOENT: no such file or directory`

**Example**:
```
ENOENT: no such file or directory, open '.lintstagedrc.json'
```

**Solution**:
```bash
# Restore missing config files
git checkout .lintstagedrc.json

# Or reinstall
npm run hooks:install
```

### Error: `JavaScript heap out of memory`

**Example**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution**:
```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or run tools separately
npm run lint
npm run format
npm test
```

## Quick Error Resolution Guide

1. **Read the error message** - It usually tells you exactly what's wrong
2. **Run the suggested command** - Error messages often include the fix
3. **Use auto-fix when available** - `npm run lint:fix`, `npm run format`
4. **Check file paths** - Many errors are just wrong imports
5. **Verify dependencies** - `npm install` fixes many issues
6. **Clear caches if weird behavior** - `rm -rf node_modules/.cache`
7. **When in doubt** - `npm run hooks:verify`

---

*Remember: Error messages are your friends! They're trying to help you write better code. 🤝*