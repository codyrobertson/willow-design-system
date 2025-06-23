# NPM Publishing Guide for Willow Design System

## Prerequisites

1. **NPM Account**: Make sure you're logged in to npm
   ```bash
   npm login
   ```

2. **Organization**: Create the organization if needed
   ```bash
   # This creates the @willow-design-system organization if it doesn't exist
   npm org create willow-design-system
   ```

## Publishing Steps

### 1. Publish the Create App Package

```bash
cd packages/create-willow-app
npm install
npm publish --access public
```

This will publish `@willow-design-system/create-app` to npm.

### 2. Test the Published Package

After publishing, test it works:

```bash
npx @willow-design-system/create-app@latest
```

### 3. Publish the Main Package (Optional)

If you want to publish the component library itself:

```bash
# From the root directory
npm run build-lib
npm publish
```

## Version Management

To update versions:

```bash
# For create-app
cd packages/create-willow-app
npm version patch  # or minor/major
npm publish

# For main package
npm version patch  # or minor/major
npm run build-lib
npm publish
```

## What Gets Published

### @willow-design-system/create-app
- The CLI tool for initializing new projects
- Automatically configures Tailwind, shadcn, and Willow registry
- Installs example components

### willow-design-system (main package)
- The component library itself
- Built CSS and components
- TypeScript definitions

## Registry vs NPM Package

- **Registry**: For shadcn CLI installation of individual components
- **NPM Package**: For complete library installation or CLI tools

Users can choose:
```bash
# Individual components via registry
npx shadcn@latest add willow/button

# Or full library
npm install willow-design-system

# Or create new project
npx @willow-design-system/create-app@latest
```

## Troubleshooting

1. **Permission Denied**: Make sure you're logged in and have access to the organization
2. **Package Already Exists**: Bump the version number
3. **Build Errors**: Run `npm run build-lib` before publishing

## Maintenance

Remember to:
- Update version numbers appropriately
- Test locally before publishing
- Update documentation after major changes
- Tag releases in git