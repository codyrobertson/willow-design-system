#!/usr/bin/env node

// Import and run the compiled CLI
import { cli } from '../dist/cli.js';

cli().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});