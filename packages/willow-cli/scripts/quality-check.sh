#!/bin/bash

# Comprehensive code quality check script
# Runs all quality tools and generates reports

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$PROJECT_ROOT/.reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}🔍 Running comprehensive quality checks...${NC}"
echo "Reports will be saved to: $REPORTS_DIR"
echo ""

cd "$PROJECT_ROOT"

# 1. Linting
echo -e "${YELLOW}📝 Running ESLint...${NC}"
if npm run lint -- --format json --output-file "$REPORTS_DIR/eslint-report.json"; then
  echo -e "${GREEN}✅ ESLint passed${NC}"
else
  echo -e "${RED}❌ ESLint failed${NC}"
  exit 1
fi

# 2. Formatting check
echo -e "${YELLOW}💅 Checking code formatting...${NC}"
if npm run format:check; then
  echo -e "${GREEN}✅ Code formatting is correct${NC}"
else
  echo -e "${RED}❌ Code formatting issues found${NC}"
  echo "Run: npm run format"
  exit 1
fi

# 3. Type checking
echo -e "${YELLOW}🔍 Running TypeScript type check...${NC}"
if npm run type-check 2> "$REPORTS_DIR/typescript-errors.txt"; then
  echo -e "${GREEN}✅ TypeScript type check passed${NC}"
else
  echo -e "${RED}❌ TypeScript type check failed${NC}"
  echo "See: $REPORTS_DIR/typescript-errors.txt"
  exit 1
fi

# 4. Dead code detection
echo -e "${YELLOW}🧹 Checking for dead code...${NC}"
if npm run deadcode:check > "$REPORTS_DIR/dead-code-analysis.txt" 2>&1; then
  echo -e "${GREEN}✅ No dead code found${NC}"
else
  echo -e "${YELLOW}⚠️ Potential dead code detected${NC}"
  echo "See: $REPORTS_DIR/dead-code-analysis.txt"
fi

# 5. Unit tests
echo -e "${YELLOW}🧪 Running unit tests...${NC}"
if npm run test:unit -- --reporter=json --outputFile="$REPORTS_DIR/test-results.json"; then
  echo -e "${GREEN}✅ All unit tests passed${NC}"
else
  echo -e "${RED}❌ Unit tests failed${NC}"
  exit 1
fi

# 6. Test coverage
echo -e "${YELLOW}📊 Generating test coverage report...${NC}"
if npm run test:coverage -- --reporter=json --outputFile="$REPORTS_DIR/coverage-summary.json"; then
  echo -e "${GREEN}✅ Coverage report generated${NC}"
else
  echo -e "${YELLOW}⚠️ Coverage report generation failed${NC}"
fi

# 7. Bundle size analysis (if applicable)
echo -e "${YELLOW}📦 Checking bundle size...${NC}"
if npm run build > "$REPORTS_DIR/build-output.txt" 2>&1; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  echo "See: $REPORTS_DIR/build-output.txt"
  exit 1
fi

# Generate summary report
echo -e "${BLUE}📋 Generating quality summary...${NC}"
cat > "$REPORTS_DIR/quality-summary.md" << EOF
# Code Quality Report

Generated: $(date)

## Summary
- ✅ ESLint: Passed
- ✅ Prettier: Passed  
- ✅ TypeScript: Passed
- ⚠️ Dead Code: Check reports
- ✅ Unit Tests: Passed
- ✅ Build: Passed

## Reports Generated
- \`eslint-report.json\` - ESLint analysis
- \`typescript-errors.txt\` - TypeScript issues
- \`dead-code-analysis.txt\` - Unused code detection
- \`test-results.json\` - Test execution results
- \`coverage-summary.json\` - Test coverage metrics
- \`build-output.txt\` - Build process log

## Commands Used
\`\`\`bash
npm run lint
npm run format:check
npm run type-check
npm run deadcode:check
npm run test:unit
npm run test:coverage
npm run build
\`\`\`

EOF

echo ""
echo -e "${GREEN}✅ Quality check complete!${NC}"
echo -e "${BLUE}📋 Summary report: $REPORTS_DIR/quality-summary.md${NC}"
echo ""