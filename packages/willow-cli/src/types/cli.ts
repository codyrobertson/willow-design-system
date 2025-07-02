/**
 * CLI Command and Argument Type Definitions
 */

import { z } from 'zod';

// Global CLI options that apply to all commands
export const GlobalOptionsSchema = z.object({
  version: z.boolean().optional(),
  help: z.boolean().optional(),
  config: z.string().optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  noColor: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  json: z.boolean().optional(),
});

export type GlobalOptions = z.infer<typeof GlobalOptionsSchema>;

// Framework types
export const FrameworkSchema = z.enum(['react', 'vue', 'angular', 'svelte', 'solid']);
export type Framework = z.infer<typeof FrameworkSchema>;

// UI Kit types
export const UIKitSchema = z.enum(['shadcn', 'material', 'bootstrap', 'antd', 'chakra', 'mantine']);
export type UIKit = z.infer<typeof UIKitSchema>;

// Style types
export const StyleSchema = z.enum(['tailwind', 'css-modules', 'styled-components', 'emotion', 'scss']);
export type Style = z.infer<typeof StyleSchema>;

// Component category types
export const ComponentCategorySchema = z.enum(['ui', 'layout', 'form', 'navigation', 'data', 'utility']);
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;

// Init command options
export const InitOptionsSchema = z.object({
  framework: FrameworkSchema.optional(),
  uiKit: UIKitSchema.optional(),
  typescript: z.boolean().optional(),
  style: StyleSchema.optional(),
  skipInstall: z.boolean().optional(),
  force: z.boolean().optional(),
  interactive: z.boolean().optional(),
  preset: z.string().optional(),
});

export type InitOptions = z.infer<typeof InitOptionsSchema>;

// Add command options
export const AddOptionsSchema = z.object({
  all: z.boolean().optional(),
  dependencies: z.boolean().optional(),
  overwrite: z.boolean().optional(),
  path: z.string().optional(),
  registry: z.string().url().optional(),
  example: z.boolean().optional(),
  skipValidation: z.boolean().optional(),
});

export type AddOptions = z.infer<typeof AddOptionsSchema>;

// Import command options  
export const ImportOptionsSchema = z.object({
  all: z.boolean().optional(),
  category: z.string().optional(),
  essential: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  overwrite: z.boolean().optional(),
  noDeps: z.boolean().optional(),
  noRollback: z.boolean().optional(),
  path: z.string().optional(),
  registry: z.string().url().optional(),
  filter: z.string().optional(),
  batchSize: z.string().optional(),
  timeout: z.string().optional(),
  force: z.boolean().optional(),
  quiet: z.boolean().optional(),
});

export type ImportOptions = z.infer<typeof ImportOptionsSchema>;

// Remove command options
export const RemoveOptionsSchema = z.object({
  keepDependencies: z.boolean().optional(),
  force: z.boolean().optional(),
  clean: z.boolean().optional(),
});

export type RemoveOptions = z.infer<typeof RemoveOptionsSchema>;

// List command options
export const ListOptionsSchema = z.object({
  installed: z.boolean().optional(),
  available: z.boolean().optional(),
  outdated: z.boolean().optional(),
  details: z.boolean().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export type ListOptions = z.infer<typeof ListOptionsSchema>;

// Update command options
export const UpdateOptionsSchema = z.object({
  all: z.boolean().optional(),
  check: z.boolean().optional(),
  major: z.boolean().optional(),
  interactive: z.boolean().optional(),
});

export type UpdateOptions = z.infer<typeof UpdateOptionsSchema>;

// Validate command options
export const ValidateOptionsSchema = z.object({
  fix: z.boolean().optional(),
  config: z.boolean().optional(),
  accessibility: z.boolean().optional(),
  performance: z.boolean().optional(),
  strict: z.boolean().optional(),
});

export type ValidateOptions = z.infer<typeof ValidateOptionsSchema>;

// Config command actions and options
export const ConfigActionSchema = z.enum(['get', 'set', 'list', 'reset', 'edit']);
export type ConfigAction = z.infer<typeof ConfigActionSchema>;

export const ConfigOptionsSchema = z.object({
  global: z.boolean().optional(),
  local: z.boolean().optional(),
});

export type ConfigOptions = z.infer<typeof ConfigOptionsSchema>;

// Theme command actions and options
export const ThemeActionSchema = z.enum(['create', 'apply', 'list', 'export', 'import']);
export type ThemeAction = z.infer<typeof ThemeActionSchema>;

export const ThemeOptionsSchema = z.object({
  base: z.string().optional(),
  interactive: z.boolean().optional(),
  output: z.string().optional(),
});

export type ThemeOptions = z.infer<typeof ThemeOptionsSchema>;

// Generate command types and options
export const GenerateTypeSchema = z.enum(['component', 'hook', 'utility', 'adapter']);
export type GenerateType = z.infer<typeof GenerateTypeSchema>;

export const GenerateOptionsSchema = z.object({
  template: z.string().optional(),
  typescript: z.boolean().optional(),
  test: z.boolean().optional(),
  story: z.boolean().optional(),
  force: z.boolean().optional(),
});

export type GenerateOptions = z.infer<typeof GenerateOptionsSchema>;

// Doctor command options
export const DoctorOptionsSchema = z.object({
  fix: z.boolean().optional(),
  report: z.string().optional(),
  check: z.enum(['deps', 'config', 'env']).optional(),
});

export type DoctorOptions = z.infer<typeof DoctorOptionsSchema>;

// Registry command actions and options
export const RegistryActionSchema = z.enum(['add', 'remove', 'list', 'use', 'sync']);
export type RegistryAction = z.infer<typeof RegistryActionSchema>;

// Migrate command options
export const MigrateOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  backup: z.boolean().optional(),
  interactive: z.boolean().optional(),
});

export type MigrateOptions = z.infer<typeof MigrateOptionsSchema>;

// Analyze command options
export const AnalyzeOptionsSchema = z.object({
  usage: z.boolean().optional(),
  performance: z.boolean().optional(),
  dependencies: z.boolean().optional(),
  suggestions: z.boolean().optional(),
  output: z.string().optional(),
});

export type AnalyzeOptions = z.infer<typeof AnalyzeOptionsSchema>;

// Transform command options
export const TransformOptionsSchema = z.object({
  from: FrameworkSchema.optional(),
  to: FrameworkSchema.optional(),
  fromKit: UIKitSchema.optional(),
  toKit: UIKitSchema.optional(),
  dryRun: z.boolean().optional(),
  preserveStyles: z.boolean().optional(),
  typescript: z.boolean().optional(),
  overwrite: z.boolean().optional(),
  interactive: z.boolean().optional(),
});

export type TransformOptions = z.infer<typeof TransformOptionsSchema>;

// Preset command actions
export const PresetActionSchema = z.enum(['create', 'apply', 'list', 'share']);
export type PresetAction = z.infer<typeof PresetActionSchema>;

// Component metadata
export interface ComponentMetadata {
  name: string;
  description: string;
  category: string;
  dependencies: string[];
  peerDependencies: Record<string, string>;
  files: string[];
  examples?: string[];
  version: string;
  uiKit: UIKit;
  framework: Framework;
}

// CLI Configuration
export interface CLIConfig {
  framework: Framework;
  uiKit: UIKit;
  style: Style;
  typescript: boolean;
  paths: {
    components: string;
    utils: string;
    styles: string;
    [key: string]: string;
  };
  registry: {
    url: string;
    custom: Array<{ name: string; url: string }>;
  };
  theme: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, string>;
  };
  validation: {
    strict: boolean;
    rules: string[];
  };
}

// Progress event types
export type ProgressEventType = 
  | 'start'
  | 'progress'
  | 'complete'
  | 'error'
  | 'warning'
  | 'info';

export interface ProgressEvent {
  type: ProgressEventType;
  message: string;
  progress?: number;
  total?: number;
  metadata?: Record<string, unknown>;
}

// Command execution result
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  warnings?: string[];
  duration?: number;
}

// Interactive prompt types
export type PromptType = 
  | 'select'
  | 'multiselect'
  | 'confirm'
  | 'input'
  | 'password'
  | 'number';

export interface PromptConfig {
  type: PromptType;
  message: string;
  choices?: Array<{ title: string; value: string; description?: string }>;
  initial?: string | number | boolean;
  validate?: (value: unknown) => boolean | string;
  format?: (value: unknown) => string;
}

// Error types
export enum CLIErrorCode {
  INVALID_ARGUMENTS = 'INVALID_ARGUMENTS',
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  FILE_EXISTS = 'FILE_EXISTS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class CLIError extends Error {
  constructor(
    public code: CLIErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

// Exit codes
export const ExitCodes = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENTS: 2,
  COMPONENT_NOT_FOUND: 3,
  CONFIGURATION_ERROR: 4,
  NETWORK_ERROR: 5,
  VALIDATION_ERROR: 6,
  PERMISSION_ERROR: 7,
  UNKNOWN_ERROR: 99,
} as const;

export type ExitCode = typeof ExitCodes[keyof typeof ExitCodes];