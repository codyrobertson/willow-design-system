# Contributing to Willow Design System

Thank you for your interest in contributing to Willow Design System! This guide will help you get started with contributing to our project.

## 🎯 Quick Start

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Create** a feature branch: `git checkout -b feature/my-feature`
5. **Make** your changes
6. **Test** your changes: `npm run test`
7. **Submit** a pull request

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Component Guidelines](#component-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Release Process](#release-process)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ or 20+
- npm 9+
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/willow-design-system.git
cd willow-design-system

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev                 # Start Next.js dev server
npm run storybook          # Start Storybook dev server

# Building
npm run build              # Build Next.js site
npm run build-storybook    # Build Storybook
npm run build-registry     # Build component registry
npm run build:all          # Build everything

# Testing
npm test                   # Run tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:ci            # Run tests for CI
npm run test:update        # Update test snapshots

# Code Quality
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript checks
npm run check:all          # Check for all errors

# Deployment
npm run build:vercel       # Build for Vercel deployment
```

## 📁 Project Structure

```
willow-design-system/
├── .github/                # GitHub templates and workflows
├── app/                    # Next.js app directory
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── layout/         # Layout components
│   │   └── ui/             # UI components
│   ├── lib/                # Utility libraries
│   └── stories/            # Storybook stories
├── registry/               # Component registry for distribution
├── scripts/                # Build and utility scripts
└── ...config files
```

## 🔄 Development Workflow

### Branch Strategy

- **main**: Production branch (protected) - merges ONLY from staging
- **staging**: Pre-production branch (protected) - merges ONLY from develop
- **develop**: Main development branch - merges from feature branches
- **feature/**: Feature branches - merge into develop only

### Pre-commit Hooks

We use automated pre-commit hooks to maintain code quality and consistency. These hooks run automatically before each commit to catch issues early.

#### 🚀 Quick Setup

```bash
# Install dependencies (includes husky setup)
npm install

# Verify hooks are working
npm run hooks:verify

# Test hooks without committing
npm run hooks:test
```

#### 🔧 Available Hook Commands

```bash
# Hook management
npm run hooks:install      # Install/reinstall Git hooks
npm run hooks:disable      # Disable hooks permanently
npm run hooks:enable       # Re-enable hooks
npm run hooks:test         # Test all hooks without committing
npm run hooks:bypass       # Show bypass instructions
npm run hooks:verify       # Comprehensive verification
npm run hooks:benchmark    # Performance benchmarking
npm run hooks:ci-setup     # Configure for CI environment

# Quality checks (can be run manually)
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
npm run type-check         # TypeScript compilation
npm run deadcode:check     # Dead code detection
npm run quality:full       # Run all quality checks
npm run quality:report     # Generate comprehensive report
```

#### 🎯 What Hooks Do

**Pre-commit Hook** (runs on `git commit`):
1. **ESLint** - Lints and auto-fixes staged `.ts` and `.tsx` files
2. **Prettier** - Formats all staged files (code, JSON, Markdown)
3. **Vitest** - Runs tests related to changed files
4. **TypeScript** - Validates types (syntax check)
5. **Dead Code** - Warns about unused exports (non-blocking)

**Commit Message Hook** (validates commit format):
- Enforces [Conventional Commits](https://conventionalcommits.org/) format
- Format: `type(scope): description`
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

**Pre-push Hook** (runs on `git push`):
1. **Full Test Suite** - All unit tests must pass
2. **Build Verification** - Project must build successfully
3. **Type Checking** - All packages must type-check

#### ⚡ Performance

Our hooks are optimized for speed:
- Small commits (3 files): ~900ms
- Medium commits (8 files): ~1s
- Large commits (15 files): ~1.1s
- Very large commits (25 files): ~1.2s

Target: All hooks complete in <10 seconds

#### 🚨 Emergency Bypass

When you need to bypass hooks (use sparingly!):

```bash
# Single commit bypass
git commit -m "hotfix: critical fix" --no-verify

# Temporary disable for session
export HUSKY=0
git commit -m "emergency fix"
unset HUSKY

# Show all bypass options
npm run hooks:bypass
```

**Important**: Document why you bypassed hooks in your commit message.

#### 🔍 Troubleshooting

Common issues and solutions:

```bash
# Hooks not running?
npm run hooks:install
npm run hooks:verify

# ESLint errors?
npm run lint:fix          # Auto-fix what's possible
npm run lint             # See remaining issues

# Prettier conflicts?
npm run format           # Format all files
npm run format:check     # Check without changing

# TypeScript errors?
npm run type-check       # See all type errors
npx tsc --noEmit        # Check specific files

# Tests failing?
npm test                 # Run all tests
npm run test:watch      # Debug interactively

# Performance issues?
npm run hooks:benchmark  # Measure hook performance
```

### Workflow Steps

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/component-name
   ```

2. **Make Changes**
   - Write code following our [Component Guidelines](#component-guidelines)
   - Add tests for new functionality
   - Update documentation and Storybook stories

3. **Test Changes**
   ```bash
   npm run typecheck      # Check TypeScript
   npm run lint           # Check code style
   npm test              # Run test suite
   npm run build         # Ensure build works
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new component X"
   ```
   
   Our pre-commit hooks will automatically:
   - ✅ Fix linting issues with ESLint
   - ✅ Format code with Prettier
   - ✅ Run tests for changed files
   - ✅ Validate TypeScript types
   - ✅ Check commit message format
   
   Follow [Conventional Commits](https://conventionalcommits.org/):
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, missing semicolons, etc.)
   - `refactor:` - Code refactoring (no functional changes)
   - `test:` - Test changes
   - `chore:` - Build/tool changes
   - `perf:` - Performance improvements
   - `ci:` - CI/CD changes
   - `build:` - Build system changes
   - `revert:` - Revert previous commit
   
   Examples:
   ```bash
   # Good commit messages
   git commit -m "feat(button): add size variant prop"
   git commit -m "fix: resolve memory leak in tooltip component"
   git commit -m "docs: update installation guide"
   git commit -m "test(card): add accessibility tests"
   
   # Bad commit messages (will be rejected)
   git commit -m "fixed stuff"              # No type prefix
   git commit -m "feat add button"          # Missing colon
   git commit -m "FEAT: add button"         # Wrong case
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/component-name
   ```

## 🧪 Testing Guidelines

### Test Requirements

All new components and features must include:

1. **Unit Tests** - Test component behavior and props
2. **Accessibility Tests** - Ensure components meet a11y standards
3. **Visual Tests** - Storybook stories for all variants

### Writing Tests

```typescript
// Component.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Component } from '../Component';

describe('Component', () => {
  it('renders with default props', () => {
    render(<Component>Content</Component>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick}>Button</Component>);
    fireEvent.click(screen.getByText('Button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Test Coverage

Maintain minimum 80% test coverage:
```bash
npm run test:coverage
```

## 🎨 Component Guidelines

### Component Structure

```typescript
// Component.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const componentVariants = cva(
  // base styles
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-styles",
        secondary: "secondary-styles",
      },
      size: {
        sm: "small-styles",
        lg: "large-styles",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Additional props
}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Component.displayName = "Component";

export { Component };
```

### Best Practices

1. **Accessibility First**
   - Use semantic HTML
   - Include ARIA attributes
   - Support keyboard navigation
   - Test with screen readers

2. **TypeScript**
   - Fully typed components
   - Extend appropriate HTML element interfaces
   - Export prop types

3. **Styling**
   - Use Tailwind CSS classes
   - Implement variants with CVA
   - Support custom className prop
   - Responsive design considerations

4. **Documentation**
   - Comprehensive Storybook stories
   - JSDoc comments for props
   - Usage examples

### Component Checklist

- [ ] Component follows naming conventions
- [ ] TypeScript interfaces defined and exported
- [ ] Variants implemented with CVA
- [ ] Accessibility attributes included
- [ ] Forwards refs correctly
- [ ] Unit tests written
- [ ] Storybook stories created
- [ ] Documentation updated

## 🔀 Pull Request Process

### PR Requirements

Before submitting a PR, ensure:

- [ ] **Pre-commit Hooks Pass**: All automated checks pass during commit
- [ ] **Tests**: All tests pass (`npm test`)
- [ ] **Type Safety**: No TypeScript errors (`npm run typecheck`)
- [ ] **Code Style**: Follows linting rules (`npm run lint`)
- [ ] **Build**: Successful build (`npm run build`)
- [ ] **Documentation**: Updated if needed
- [ ] **Storybook**: Stories added/updated for UI changes
- [ ] **Commit Messages**: Follow conventional commit format
- [ ] **No Bypassed Hooks**: Avoid using `--no-verify` unless documented

If you had to bypass hooks, document why in the PR description.

### PR Template

Use our PR template to ensure all requirements are met:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Storybook stories updated

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and builds
2. **Code Review**: Team members review code quality and design
3. **Approval**: Required approvals based on branch:
   - staging → main: 2 reviewers
   - develop → staging: 1 reviewer
   - feature → develop: 1 reviewer

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search** existing issues for duplicates
2. **Check** documentation and Storybook
3. **Test** with latest version

### Issue Types

Use appropriate templates:

- **🐛 Bug Report**: Something isn't working
- **✨ Feature Request**: New component or functionality
- **📚 Documentation**: Improve or fix documentation
- **🎨 Design**: Design system improvements
- **❓ Question**: Ask for help or clarification

### Bug Report Template

```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
```

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Workflow

1. **Feature Development** → `feature/*` branches → **develop**
2. **Pre-release Testing** → `develop` → **staging** 
3. **Production Release** → `staging` → **main**

**Important**: Each branch can only merge to the next branch in the sequence. No skipping stages!

### Registry Updates

The component registry is only updated on production releases to ensure stability:

- **Registry rebuilds** only on `main` branch deployments
- **Component versions** are immutable once published
- **Breaking changes** require major version bump

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/willow-design)
- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Create an issue for bugs or feature requests
- **Email**: team@willow-design-system.com

## 🎉 Recognition

Contributors will be:
- Listed in our [Contributors](CONTRIBUTORS.md) file
- Featured in release notes
- Given credit in component documentation

Thank you for contributing to Willow Design System! 🌳