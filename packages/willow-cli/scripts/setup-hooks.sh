#!/bin/bash

# Pre-commit hooks setup script
# Provides easy commands for developers to manage Git hooks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

case "${1:-help}" in
  "install")
    echo "🔧 Installing Git hooks..."
    cd "$PROJECT_ROOT"
    npx husky install
    chmod +x .husky/pre-commit
    chmod +x .husky/commit-msg
    chmod +x .husky/pre-push
    echo "✅ Git hooks installed successfully!"
    echo ""
    echo "Hooks enabled:"
    echo "  - pre-commit: ESLint, Prettier, TypeScript, Tests, Dead code check"
    echo "  - commit-msg: Conventional commit format validation"
    echo "  - pre-push: Full test suite, Build verification, Type checking"
    ;;
    
  "disable")
    echo "⏸️ Disabling Git hooks..."
    echo "export HUSKY=0" >> ~/.bashrc || echo "export HUSKY=0" >> ~/.zshrc
    echo "✅ Git hooks disabled!"
    echo "To re-enable, restart your shell and run: npm run setup-hooks:enable"
    ;;
    
  "enable") 
    echo "▶️ Enabling Git hooks..."
    # Remove HUSKY=0 from shell configs
    sed -i '' '/export HUSKY=0/d' ~/.bashrc 2>/dev/null || true
    sed -i '' '/export HUSKY=0/d' ~/.zshrc 2>/dev/null || true
    echo "✅ Git hooks enabled!"
    echo "Restart your shell for changes to take effect."
    ;;
    
  "test")
    echo "🧪 Testing Git hooks..."
    cd "$PROJECT_ROOT"
    echo "Testing pre-commit hooks..."
    echo "  - lint-staged..."
    npx lint-staged --verbose
    echo "  - TypeScript..."
    npm run type-check
    echo "  - Unit tests..."
    npm run test:unit -- --run
    echo "Testing pre-push hooks..."
    echo "  - Build verification..."
    npm run build >/dev/null 2>&1
    echo "  - Type checking all packages..."
    npm run type-check:all >/dev/null 2>&1
    echo "✅ All hook tests passed!"
    ;;
    
  "bypass")
    echo "🚨 Emergency bypass instructions:"
    echo ""
    echo "To bypass hooks for a single commit:"
    echo "  git commit -m 'message' --no-verify"
    echo ""
    echo "To disable hooks temporarily:"
    echo "  export HUSKY=0"
    echo "  git commit -m 'message'"
    echo "  unset HUSKY"
    echo ""
    echo "To disable hooks permanently:"
    echo "  npm run setup-hooks:disable"
    ;;
    
  "help"|*)
    echo "Git Hooks Setup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  install   - Install and configure Git hooks"
    echo "  disable   - Disable Git hooks permanently" 
    echo "  enable    - Re-enable Git hooks"
    echo "  test      - Test all hook functionality"
    echo "  bypass    - Show bypass instructions"
    echo "  help      - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  HUSKY=0   - Disable hooks for current session"
    ;;
esac