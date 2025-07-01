# CI/CD Integration Guide for Pre-commit Hooks

This guide explains how the Willow CLI pre-commit hooks integrate with CI/CD environments, ensuring consistent code quality across development and production pipelines.

## Overview

The pre-commit hooks are designed to work seamlessly in both local development and CI environments with the following key features:

- **Environment Detection**: Automatically detects CI environments and adjusts behavior
- **Performance Optimization**: Faster execution in CI with check-only operations
- **Bypass Mechanisms**: Emergency bypass options for critical deployments
- **Comprehensive Testing**: Full hook validation in CI pipelines

## CI Environment Support

### Supported CI Platforms

✅ **GitHub Actions** - Full integration with workflow artifacts  
✅ **GitLab CI** - Pipeline optimization and caching  
✅ **Jenkins** - Plugin compatibility and build reports  
✅ **CircleCI** - Workflow parallelization support  
✅ **Azure DevOps** - Pipeline templates available  
✅ **Travis CI** - Legacy support maintained  

### Environment Detection

The hooks automatically detect CI environments using these indicators:

```bash
# Environment variables checked:
- CI=true
- GITHUB_ACTIONS=true  
- GITLAB_CI=true
- JENKINS_URL (any value)
- CIRCLECI=true
- TF_BUILD=true (Azure DevOps)
```

## GitHub Actions Integration

### Workflow Configuration

Add the pre-commit hooks workflow to your `.github/workflows/` directory:

```yaml
name: Pre-commit Hooks CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  hooks:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      
    - name: Setup CI hooks
      run: npm run hooks:ci-setup
      
    - name: Verify hooks
      run: npm run hooks:verify
```

### Performance Optimization

The CI hooks run in "check-only" mode for optimal performance:

```bash
# Local development (with auto-fix):
eslint --fix --max-warnings=0
prettier --write

# CI environment (check-only):
eslint --max-warnings=0
prettier --check
```

## Hook Behavior in CI

### Pre-commit Hook (CI Mode)

```bash
1. ESLint check (no auto-fix)
2. Prettier validation (no formatting)
3. TypeScript compilation
4. Relevant test execution
5. Performance under 30 seconds
```

### Pre-push Hook (CI Mode)

```bash
1. Full test suite execution
2. Build verification
3. Cross-package type checking
4. Performance under 2 minutes
```

### Commit Message Hook

```bash
# Same behavior in both environments:
1. Conventional commit format validation
2. Length and format checking
3. Type validation (feat, fix, docs, etc.)
```

## Performance Targets

| Environment | Target Time | Measured Time | Status |
|-------------|-------------|---------------|---------|
| Local Dev   | < 10s       | ~2s          | ✅ Excellent |
| CI Small    | < 30s       | ~15s         | ✅ Good |
| CI Medium   | < 60s       | ~30s         | ✅ Good |
| CI Large    | < 120s      | ~60s         | ✅ Acceptable |

## Bypass Mechanisms

### Emergency Bypass

For critical deployments when hooks are failing:

```bash
# Single commit bypass:
git commit --no-verify -m "hotfix: critical security patch"

# Temporary disable (CI):
export HUSKY=0
git commit -m "emergency deployment"
unset HUSKY

# Permanent disable (not recommended):
npm run hooks:disable
```

### CI-Specific Bypass

```yaml
# In GitHub Actions workflow:
- name: Deploy with bypass
  run: |
    export HUSKY=0
    npm run deploy
  env:
    EMERGENCY_DEPLOY: true
```

## Troubleshooting

### Common CI Issues

#### 1. Dependencies Not Found

```bash
# Solution: Ensure all dev dependencies are installed
npm ci  # Not npm install
```

#### 2. Permission Issues

```bash
# Solution: Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

#### 3. Git Configuration

```bash
# Solution: Configure Git user in CI
git config --global user.email "ci@yourproject.com"
git config --global user.name "CI Bot"
```

#### 4. Performance Timeouts

```yaml
# Solution: Increase timeout in CI
- name: Run hooks
  run: npm run hooks:verify
  timeout-minutes: 5
```

### Debug Commands

```bash
# Verify CI environment detection:
npm run hooks:ci-setup

# Test individual components:
npx eslint . --ext .ts,.tsx
npx prettier --check "**/*.{ts,tsx,json,md}"
npx tsc --noEmit

# Performance debugging:
npm run hooks:benchmark

# Full verification:
npm run hooks:verify
```

## Configuration Files

### Core Configuration

- `.husky/pre-commit` - Main pre-commit hook
- `.husky/commit-msg` - Commit message validation  
- `.husky/pre-push` - Pre-push verification
- `.lintstagedrc.json` - Staged file processing
- `scripts/ci-setup.sh` - CI environment setup

### CI-Specific Files

- `.github/workflows/willow-cli-hooks.yml` - GitHub Actions workflow
- `scripts/verify-hooks.sh` - Comprehensive verification
- `scripts/benchmark-hooks.sh` - Performance testing

## Best Practices

### 1. Caching Strategy

```yaml
# Cache node_modules for faster CI:
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: 'package-lock.json'
```

### 2. Parallel Execution

```yaml
# Run hooks in parallel with other jobs:
jobs:
  hooks:
    # ... hook configuration
  tests:
    # ... other tests
  build:
    needs: hooks  # Only after hooks pass
```

### 3. Conditional Execution

```yaml
# Only run on relevant file changes:
on:
  push:
    paths: 
      - 'src/**'
      - 'packages/**'
      - '*.ts'
      - '*.tsx'
```

### 4. Error Reporting

```yaml
# Upload reports for debugging:
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: hook-reports
    path: .reports/
```

## Integration Examples

### GitLab CI

```yaml
# .gitlab-ci.yml
pre-commit-hooks:
  stage: test
  script:
    - npm ci
    - npm run hooks:ci-setup
    - npm run hooks:verify
  cache:
    paths:
      - node_modules/
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Pre-commit Hooks') {
            steps {
                sh 'npm ci'
                sh 'npm run hooks:ci-setup'
                sh 'npm run hooks:verify'
            }
        }
    }
}
```

### CircleCI

```yaml
# .circleci/config.yml
version: 2.1
jobs:
  hooks:
    docker:
      - image: node:20
    steps:
      - checkout
      - run: npm ci
      - run: npm run hooks:ci-setup
      - run: npm run hooks:verify
```

## Monitoring and Metrics

### Performance Tracking

The hooks generate performance reports accessible in CI artifacts:

- `benchmark-results.csv` - Raw performance data
- `performance-report.md` - Human-readable analysis
- `ci-compatibility-report.md` - CI-specific metrics

### Health Checks

Regular verification ensures hooks remain functional:

```bash
# Daily health check (can be automated):
npm run hooks:verify
npm run hooks:benchmark
```

## Security Considerations

### Safe Bypass Usage

- Only use `--no-verify` for genuine emergencies
- Document all bypass usage in commit messages
- Review bypassed commits in post-incident analysis

### CI Environment Security

- Never expose sensitive tokens in hook scripts
- Use CI-provided secret management
- Audit hook permissions regularly

## Support and Maintenance

### Version Compatibility

- Node.js 18+ required
- Git 2.20+ recommended
- npm 8+ for workspace support

### Updates and Migration

When updating hook configurations:

1. Test locally first: `npm run hooks:test`
2. Verify CI compatibility: `npm run hooks:ci-setup`
3. Update documentation
4. Communicate changes to team

### Getting Help

- Check `npm run hooks:verify` output
- Review CI logs for specific errors
- Use `npm run hooks:benchmark` for performance issues
- Consult this documentation for configuration questions

---

*This integration ensures consistent code quality across all development environments while maintaining optimal performance in CI/CD pipelines.*