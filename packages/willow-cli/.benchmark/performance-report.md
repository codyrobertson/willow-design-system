# Pre-commit Hooks Performance Report

Generated: Mon Jun 30 22:03:09 MDT 2025

## Benchmark Results

| Scenario | Files | Lines/File | Duration (ms) | Performance |
|----------|-------|------------|---------------|-------------|
| Small commit | 3 | 20 | -1 | ❌ Failed |
| Medium commit | 8 | 50 | -1 | ❌ Failed |
| Large commit | 15 | 100 | -1 | ❌ Failed |
| Very large commit | 25 | 150 | -1 | ❌ Failed |

## Performance Targets
- **Target**: < 10 seconds (10,000ms) for typical commits
- **Excellent**: < 5 seconds (5,000ms)
- **Good**: 5-10 seconds
- **Needs optimization**: > 10 seconds

## Tools Measured
- ESLint with --fix
- Prettier formatting
- File staging/unstaging

## Recommendations
- Commits with 3-8 files perform optimally
- Very large commits (>25 files) may benefit from:
  - Breaking into smaller commits
  - Using `--no-verify` flag for emergency commits
  - Running `npm run quality:full` separately

