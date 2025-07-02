/**
 * Command exports and registration
 */

import { commandRegistry } from '../core/CommandRegistry.js';
import { InitCommand } from './init/InitCommand.js';
import { AddCommand } from './add/AddCommand.js';
import { ImportCommand } from './import/ImportCommand.js';
import { ListCommand } from './list/ListCommand.js';
import { RemoveCommand } from './remove/RemoveCommand.js';
import { UpdateCommand } from './update/UpdateCommand.js';
import { ValidateCommand } from './validate/ValidateCommand.js';
import { ConfigCommand } from './config/ConfigCommand.js';
import { ThemeCommand } from './theme/ThemeCommand.js';
import { GenerateCommand } from './generate/GenerateCommand.js';
import { DoctorCommand } from './doctor/DoctorCommand.js';

// Register all commands
export function registerCommands(): void {
  // Core commands
  commandRegistry.register({
    name: InitCommand.command,
    description: InitCommand.description,
    action: InitCommand.action.bind(InitCommand),
  });
  
  commandRegistry.register({
    name: AddCommand.command,
    description: AddCommand.description,
    action: AddCommand.action.bind(AddCommand),
  });
  
  commandRegistry.register({
    name: ImportCommand.command,
    description: ImportCommand.description,
    action: ImportCommand.action.bind(ImportCommand),
  });
  
  commandRegistry.register({
    name: ListCommand.command,
    description: ListCommand.description,
    action: ListCommand.action.bind(ListCommand),
  });
  
  commandRegistry.register({
    name: RemoveCommand.command,
    description: RemoveCommand.description,
    action: RemoveCommand.action.bind(RemoveCommand),
  });
  
  commandRegistry.register({
    name: UpdateCommand.command,
    description: UpdateCommand.description,
    action: UpdateCommand.action.bind(UpdateCommand),
  });
  
  commandRegistry.register({
    name: ValidateCommand.command,
    description: ValidateCommand.description,
    action: ValidateCommand.action.bind(ValidateCommand),
  });
  
  commandRegistry.register({
    name: ConfigCommand.command,
    description: ConfigCommand.description,
    action: ConfigCommand.action.bind(ConfigCommand),
  });
  
  commandRegistry.register({
    name: ThemeCommand.command,
    description: ThemeCommand.description,
    action: ThemeCommand.action.bind(ThemeCommand),
  });
  
  commandRegistry.register({
    name: GenerateCommand.command,
    description: GenerateCommand.description,
    action: GenerateCommand.action.bind(GenerateCommand),
  });
  
  commandRegistry.register({
    name: DoctorCommand.command,
    description: DoctorCommand.description,
    action: DoctorCommand.action.bind(DoctorCommand),
  });
}

// Export individual commands for direct use
export { InitCommand } from './init/InitCommand.js';
export { AddCommand } from './add/AddCommand.js';
export { ImportCommand } from './import/ImportCommand.js';
export { ListCommand } from './list/ListCommand.js';
export { RemoveCommand } from './remove/RemoveCommand.js';
export { UpdateCommand } from './update/UpdateCommand.js';
export { ValidateCommand } from './validate/ValidateCommand.js';
export { ConfigCommand } from './config/ConfigCommand.js';
export { ThemeCommand } from './theme/ThemeCommand.js';
export { GenerateCommand } from './generate/GenerateCommand.js';
export { DoctorCommand } from './doctor/DoctorCommand.js';