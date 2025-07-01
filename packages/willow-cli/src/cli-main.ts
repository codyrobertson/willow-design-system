#!/usr/bin/env node

/**
 * Willow CLI Entry Point
 */

import { CLI } from './core/CLI.js';
import { CommandRegistry } from './core/CommandRegistry.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Import commands
import { InitCommand } from './commands/init/InitCommand.js';
import { AddCommand } from './commands/add/AddCommand.js';
import { ListCommand } from './commands/list/ListCommand.js';
import { RemoveCommand } from './commands/remove/RemoveCommand.js';
import { UpdateCommand } from './commands/update/UpdateCommand.js';
import { ValidateCommand } from './commands/validate/ValidateCommand.js';
import { ConfigCommand } from './commands/config/ConfigCommand.js';
import { DoctorCommand } from './commands/doctor/DoctorCommand.js';
import { ThemeCommand } from './commands/theme/ThemeCommand.js';
import { GenerateCommand } from './commands/generate/GenerateCommand.js';
import { TransformCommand } from './commands/transform/TransformCommand.js';

async function main() {
  try {
    // Get package info
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf8')
    );

    // Create command registry
    const registry = new CommandRegistry();

    // Register all commands
    registry.register(InitCommand);
    registry.register(AddCommand);
    registry.register(ListCommand);
    registry.register(RemoveCommand);
    registry.register(UpdateCommand);
    registry.register(ValidateCommand);
    registry.register(ConfigCommand);
    registry.register(DoctorCommand);
    registry.register(ThemeCommand);
    registry.register(GenerateCommand);
    registry.register(TransformCommand);

    // Create CLI instance
    const cli = new CLI({
      name: 'willow',
      description: 'CLI for Willow Design System - Transform components between UI frameworks',
      version: packageJson.version,
      registry,
    });

    // Run CLI
    await cli.run();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run main function
main();