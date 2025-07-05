/**
 * Willow CLI Entry Point - New Implementation
 */

import { createCLI } from './core/CLI.js';
import { registerCommands } from './commands/index.js';
import { commandRegistry } from './core/CommandRegistry.js';
import chalk from 'chalk';

export async function cli(): Promise<void> {
  // Register all commands
  registerCommands();

  // Create CLI instance
  const cli = createCLI(
    'willow',
    'CLI for installing Willow Design System components',
    commandRegistry
  );

  // Add custom help text
  cli.addHelpText('after', `
${chalk.gray('Examples:')}
  ${chalk.cyan('$')} willow init
  ${chalk.cyan('$')} willow add button card
  ${chalk.cyan('$')} willow list --installed
  ${chalk.cyan('$')} willow theme create dark

${chalk.gray('Docs:')} https://willow-ui.com/docs/cli
`);

  // Configure command builders
  const program = cli.getProgram();
  
  // Init command
  const initCmd = program.commands.find(cmd => cmd.name() === 'init');
  if (initCmd) {
    const { InitCommand } = await import('./commands/init/InitCommand.js');
    InitCommand.builder(initCmd);
  }

  // Add command
  const addCmd = program.commands.find(cmd => cmd.name() === 'add');
  if (addCmd) {
    const { AddCommand } = await import('./commands/add/AddCommand.js');
    AddCommand.builder(addCmd);
  }

  // List command
  const listCmd = program.commands.find(cmd => cmd.name() === 'list');
  if (listCmd) {
    const { ListCommand } = await import('./commands/list/ListCommand.js');
    ListCommand.builder(listCmd);
  }

  // Remove command
  const removeCmd = program.commands.find(cmd => cmd.name() === 'remove');
  if (removeCmd) {
    const { RemoveCommand } = await import('./commands/remove/RemoveCommand.js');
    RemoveCommand.builder(removeCmd);
  }

  // Update command
  const updateCmd = program.commands.find(cmd => cmd.name() === 'update');
  if (updateCmd) {
    const { UpdateCommand } = await import('./commands/update/UpdateCommand.js');
    UpdateCommand.builder(updateCmd);
  }

  // Validate command
  const validateCmd = program.commands.find(cmd => cmd.name() === 'validate');
  if (validateCmd) {
    const { ValidateCommand } = await import('./commands/validate/ValidateCommand.js');
    ValidateCommand.builder(validateCmd);
  }

  // Config command
  const configCmd = program.commands.find(cmd => cmd.name() === 'config');
  if (configCmd) {
    const { ConfigCommand } = await import('./commands/config/ConfigCommand.js');
    ConfigCommand.builder(configCmd);
  }

  // Theme command
  const themeCmd = program.commands.find(cmd => cmd.name() === 'theme');
  if (themeCmd) {
    const { ThemeCommand } = await import('./commands/theme/ThemeCommand.js');
    ThemeCommand.builder(themeCmd);
  }

  // Generate command
  const generateCmd = program.commands.find(cmd => cmd.name() === 'generate');
  if (generateCmd) {
    const { GenerateCommand } = await import('./commands/generate/GenerateCommand.js');
    GenerateCommand.builder(generateCmd);
  }

  // Doctor command
  const doctorCmd = program.commands.find(cmd => cmd.name() === 'doctor');
  if (doctorCmd) {
    const { DoctorCommand } = await import('./commands/doctor/DoctorCommand.js');
    DoctorCommand.builder(doctorCmd);
  }

  // Add command aliases
  program.alias('i');  // willow i -> willow init
  program.alias('a');  // willow a -> willow add
  program.alias('ls'); // willow ls -> willow list
  program.alias('rm'); // willow rm -> willow remove

  // Parse command line arguments
  await cli.parse();
}