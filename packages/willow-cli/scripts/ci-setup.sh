#!/bin/bash

# CI Environment Setup Script for Pre-commit Hooks
# Configures Git hooks for CI environments with appropriate bypasses

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up pre-commit hooks for CI environment...${NC}"

cd "$PROJECT_ROOT"

# Function to detect CI environment
detect_ci() {
  if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$GITLAB_CI" = "true" ] || [ "$JENKINS_URL" != "" ]; then
    return 0
  else
    return 1
  fi
}

# Check if we're in CI
if detect_ci; then
  echo -e "${YELLOW}📍 CI environment detected${NC}"
  CI_MODE=true
else
  echo -e "${YELLOW}📍 Local development environment detected${NC}"
  CI_MODE=false
fi

# Install husky
echo -e "${YELLOW}🔧 Installing husky...${NC}"
if [ "$CI_MODE" = "true" ]; then
  # In CI, we don't need interactive installation
  export HUSKY=0
  npm install --save-dev husky
else
  npx husky install
fi

# Make hooks executable
chmod +x .husky/pre-commit 2>/dev/null || true
chmod +x .husky/commit-msg 2>/dev/null || true
chmod +x .husky/pre-push 2>/dev/null || true

# Create CI-specific hook configuration
if [ "$CI_MODE" = "true" ]; then
  echo -e "${YELLOW}⚙️ Configuring hooks for CI environment...${NC}"
  
  # Create CI-optimized pre-commit hook
  cat > .husky/pre-commit-ci << 'EOF'
#!/usr/bin/env sh

echo "🚀 Running CI pre-commit checks..."

# Exit on any error
set -e

# Phase 1: Quick lint check (no fixes in CI)
echo "📝 Running ESLint (check only)..."
if ! npx eslint . --ext .ts,.tsx --max-warnings=0; then
  echo "❌ ESLint check failed!"
  exit 1
fi

# Phase 2: Prettier check (no writes in CI)
echo "💅 Checking Prettier formatting..."
if ! npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"; then
  echo "❌ Prettier check failed!"
  echo "💡 Run 'npm run format' locally to fix formatting"
  exit 1
fi

# Phase 3: TypeScript compilation
echo "🔍 Running TypeScript compilation..."
if ! npx tsc --noEmit --skipLibCheck; then
  echo "❌ TypeScript compilation failed!"
  exit 1
fi

# Phase 4: Run tests related to changes (if applicable)
echo "🧪 Running relevant tests..."
if [ -f "package.json" ] && grep -q "vitest" package.json; then
  if ! npm run test:unit; then
    echo "❌ Tests failed!"
    exit 1
  fi
fi

echo "✅ All CI pre-commit checks passed!"
EOF

  chmod +x .husky/pre-commit-ci
  
  # Set environment variable to use CI hooks
  echo "export HUSKY_CI_MODE=true" >> ~/.bashrc 2>/dev/null || true
  
else
  echo -e "${YELLOW}⚙️ Standard development hooks configured${NC}"
fi

# Verify hook setup
echo -e "${YELLOW}🔍 Verifying hook setup...${NC}"

if [ -f ".husky/pre-commit" ]; then
  echo -e "${GREEN}✅ pre-commit hook exists${NC}"
else
  echo -e "${YELLOW}⚠️ pre-commit hook missing${NC}"
fi

if [ -f ".husky/commit-msg" ]; then
  echo -e "${GREEN}✅ commit-msg hook exists${NC}"
else
  echo -e "${YELLOW}⚠️ commit-msg hook missing${NC}"
fi

if [ -f ".husky/pre-push" ]; then
  echo -e "${GREEN}✅ pre-push hook exists${NC}"
else
  echo -e "${YELLOW}⚠️ pre-push hook missing${NC}"
fi

# Check dependencies
echo -e "${YELLOW}📚 Checking CI dependencies...${NC}"
required_deps=("husky" "lint-staged" "eslint" "prettier" "typescript")

for dep in "${required_deps[@]}"; do
  if npm list "$dep" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ $dep available${NC}"
  else
    echo -e "${YELLOW}⚠️ $dep not found, installing...${NC}"
    npm install --save-dev "$dep"
  fi
done

echo ""
echo -e "${GREEN}🎉 CI setup complete!${NC}"

if [ "$CI_MODE" = "true" ]; then
  echo -e "${BLUE}📋 CI Configuration:${NC}"
  echo "  - Hooks run in check-only mode (no file modifications)"
  echo "  - Tests run on CI-appropriate subset"
  echo "  - Performance optimized for CI execution"
  echo "  - Bypass available with HUSKY=0 environment variable"
else
  echo -e "${BLUE}📋 Development Configuration:${NC}"
  echo "  - Full pre-commit hooks with auto-fixing enabled"
  echo "  - Run 'npm run hooks:test' to verify functionality"
  echo "  - Use 'git commit --no-verify' to bypass when needed"
fi