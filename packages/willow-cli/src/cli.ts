import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { registerAddCommand } from './commands/add.js';
import { registerInitCommand } from './commands/init.js';
import { registerListCommand } from './commands/list.js';
import { registerImportCommand } from './commands/import.js';

export async function cli(): Promise<void> {
  // Get package info
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8')
  );

  // Create program
  const program = new Command();

  program
    .name('willow')
    .description('CLI for installing Willow Design System components')
    .version(packageJson.version);

  // Register commands
  registerAddCommand(program);
  registerInitCommand(program);
  registerListCommand(program);
  registerImportCommand(program);

  // Handle unknown commands
  program.on('command:*', (operands: string[]) => {
    console.error(`❌ Unknown command: ${operands[0]}`);
    console.log('\n📖 Available commands:');
    console.log('  willow init               - Initialize Willow in your project');
    console.log('  willow add <component>    - Install a component');
    console.log('  willow import [components] - Import components in bulk');
    console.log('  willow list               - List all components');
    process.exit(1);
  });

  // Parse arguments
  program.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}