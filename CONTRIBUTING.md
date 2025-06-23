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

- **main**: Production branch (protected)
- **staging**: Pre-production branch (protected)
- **develop**: Main development branch
- **feature/**: Feature branches

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
   
   Follow [Conventional Commits](https://conventionalcommits.org/):
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `chore:` - Build/tool changes

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

- [ ] **Tests**: All tests pass (`npm test`)
- [ ] **Type Safety**: No TypeScript errors (`npm run typecheck`)
- [ ] **Code Style**: Follows linting rules (`npm run lint`)
- [ ] **Build**: Successful build (`npm run build`)
- [ ] **Documentation**: Updated if needed
- [ ] **Storybook**: Stories added/updated for UI changes

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
   - develop → main: 2 reviewers
   - feature → staging: 1 reviewer
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

1. **Development** → `develop` branch
2. **Pre-release** → `staging` branch
3. **Production** → `main` branch

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