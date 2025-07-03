#!/usr/bin/env node

// Import and run the CLI
import('../src/cli-functional.ts').catch(error => {
  console.error('Failed to load CLI:', error);
  process.exit(1);
});
