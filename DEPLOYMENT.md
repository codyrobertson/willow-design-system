# Deployment Guide

## Branch Structure & Protection

- **main**: Production branch - deploys automatically to `willow-design-system.vercel.app`
  - Protected branch with required PR reviews (2 reviewers)
  - Registry is rebuilt and updated ONLY on main branch changes
  - Direct pushes disabled
- **staging**: Pre-production branch - deploys automatically to `staging-willow-design-system.vercel.app`
  - Protected branch with required PR reviews (1 reviewer)
  - Registry NOT rebuilt on staging
  - Direct pushes disabled  
- **develop**: Main development branch - no automatic deployment
  - Registry NOT rebuilt on develop
  - Direct pushes allowed for maintainers
- **feature/***: Feature branches - merge into develop via PR

## Workflow

### Development
1. Create feature branch from `develop`
2. Make changes and test locally
3. Create PR to merge into `develop`
4. After PR approval, merge into `develop`

### Staging Release  
1. Create PR from `develop` to `staging`
2. After approval, merge into `staging`
3. Automatic deployment to staging environment
4. Test staging deployment

### Production Release
1. Create PR from `staging` to `main`
2. After approval, merge into `main`
3. Automatic deployment to production

## Local Development

```bash
# Install dependencies
npm install

# Development servers
npm run dev                 # Start Next.js dev server
npm run storybook          # Start Storybook dev server

# Building
npm run build              # Build Next.js site
npm run build-storybook    # Build Storybook
npm run build-registry     # Build component registry
npm run build:all          # Build everything
npm run build:vercel       # Build for Vercel deployment

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
```

## Testing Requirements

All pull requests must pass:

1. **Unit Tests**: `npm test` - All tests must pass
2. **Type Safety**: `npm run typecheck` - No TypeScript errors
3. **Code Style**: `npm run lint` - ESLint rules must pass
4. **Build Success**: `npm run build` - Project must build successfully
5. **Test Coverage**: Maintain minimum 80% coverage

### Test Coverage Requirements

- **Components**: All UI components must have unit tests
- **Utilities**: All utility functions must be tested
- **Integration**: Critical user flows must be tested
- **Accessibility**: Components must pass a11y tests

```bash
# Check current coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Vercel Configuration

The project uses custom build commands defined in `vercel.json`:
- **buildCommand**: `node scripts/build-for-vercel.js`
- **outputDirectory**: `out`
- **GitHub Integration**: 
  - `main` → Production deployment
  - `staging` → Staging deployment
  - `develop` → No deployment

## Registry Protection

The component registry (`/registry/` directory) is only updated on production deployments to ensure stability:

- **Registry Rebuild**: Only triggered on `main` branch changes
- **Component Updates**: Registry components are versioned and immutable once published
- **Breaking Changes**: Major version bumps require manual review and approval
- **Build Script**: `scripts/build-registry.js` only runs during production builds

### Registry Build Process
1. Changes merged to `main` branch
2. Production deployment triggered
3. Registry components rebuilt with current stable versions
4. Registry JSON files updated with new component metadata
5. CDN cache invalidated for registry endpoints

## Required Secrets

For GitHub Actions to work, add these secrets to your repository:
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Branch Protection Rules

Configure these protection rules in GitHub:

### Main Branch
- Require pull request reviews (2 reviewers)
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict pushes that create files matching `registry/**`
- Require linear history

### Staging Branch
- Require pull request reviews (1 reviewer)
- Require status checks to pass before merging
- Require branches to be up to date before merging

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines including:

- **Development Setup**: How to set up your local environment
- **Component Guidelines**: Standards for creating new components
- **Testing Requirements**: What tests to write and how
- **Pull Request Process**: How to submit changes
- **Issue Guidelines**: How to report bugs and request features

### Quick Contribution Steps

1. **Fork** the repository
2. **Clone** and install dependencies: `npm install`
3. **Create** feature branch: `git checkout -b feature/my-feature`
4. **Make** changes with tests: `npm test`
5. **Verify** quality: `npm run typecheck && npm run lint`
6. **Submit** pull request to `develop` branch

## Issue Reporting

Use GitHub issue templates for:

- 🐛 **Bug Reports**: Something isn't working correctly
- ✨ **Feature Requests**: New components or functionality
- 📚 **Documentation**: Improvements to docs or examples
- ❓ **Questions**: Ask for help or clarification

## URLs

- **Production**: https://willow-design-system.vercel.app
- **Staging**: https://staging-willow-design-system.vercel.app (coming soon)
- **Storybook**: https://willow-design-system.vercel.app/storybook
- **Registry API**: https://willow-design-system.vercel.app/registry