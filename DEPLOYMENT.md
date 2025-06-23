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

# Run development server
npm run dev

# Run Storybook
npm run storybook

# Build project
npm run build

# Build for Vercel
npm run build:vercel

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test
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

## URLs

- **Production**: https://willow-design-system.vercel.app
- **Staging**: https://staging-willow-design-system.vercel.app (coming soon)
- **Storybook**: https://willow-design-system.vercel.app/storybook