#!/usr/bin/env node
/**
 * Willow CLI v2.0 - Simplified Architecture
 * Entry point for the CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../package.json';
import { registerCommands } from './core/command-loader';
import { createLogger } from './core/logger';
import { loadConfig } from './core/config';

const program = new Command();
const logger = createLogger();

// CLI configuration
program
  .name('willow')
  .description('Component management and documentation for modern web development')
  .version(version)
  .option('-v, --verbose', 'Verbose output')
  .option('--debug', 'Debug mode')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Path to config file');

// Global error handling
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled error:', error.message);
  if (program.opts().debug) {
    console.error(error.stack);
  }
  process.exit(1);
});

async function main() {
  try {
    // Load configuration
    const config = await loadConfig(program.opts().config);
    
    // Register all commands
    await registerCommands(program, { logger, config });
    
    // Parse arguments
    await program.parseAsync(process.argv);
    
    // Show help if no command provided
    if (process.argv.length === 2) {
      program.help();
    }
  } catch (error) {
    logger.error('Failed to initialize CLI:', error);
    process.exit(1);
  }
}

// Run CLI
main().catch(console.error);