# Willow CLI Test Guide

## Test Performance Optimization

We've optimized our test suite for better developer experience:

### Test Groups

- **`npm run test:fast`** - ⚡ Lightning fast unit tests only (~5-10s)
  - Excludes integration, stress, and performance tests
  - Perfect for rapid development feedback
  - Uses 8 parallel workers

- **`npm run test:unit`** - 🧪 Standard unit tests (~15-20s)
  - Excludes integration tests
  - Good for pre-commit checks

- **`npm run test:integration`** - 🔄 Integration & performance tests (~1-2min)
  - Includes adapter integration tests
  - Performance benchmarks
  - Error recovery scenarios

- **`npm run test:all`** - 📦 Complete test suite
  - Runs everything with maximum parallelization

- **`npm run test:watch`** - 👀 Watch mode for development
  - Auto-reruns affected tests on file changes

- **`npm run test:coverage`** - 📊 Coverage report
  - Generates detailed coverage metrics

### Performance Tips

1. **During Development**: Use `npm run test:fast` for quick feedback
2. **Before Committing**: Run `npm run test:unit`
3. **Before PR**: Run `npm run test:all`

### Verbose Mode

To see all console output (including expected errors from error handling tests):

```bash
VERBOSE_TESTS=true npm run test
```

### Why Some Tests Are Slow

Integration tests intentionally include delays to test:
- Concurrent plugin operations
- Timeout handling
- Retry mechanisms
- Performance boundaries
- Memory stress scenarios

These are excluded from `test:fast` for rapid development.