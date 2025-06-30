# Willow Code Generator Module

The Code Generator module provides comprehensive code generation capabilities for transforming AST (Abstract Syntax Trees) back into source code, with support for templates, file organization, and multiple output formats.

## Table of Contents

- [Installation](#installation)
- [Core Components](#core-components)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Template System](#template-system)
- [File Organization](#file-organization)
- [Advanced Features](#advanced-features)

## Installation

```bash
npm install @willow-cli/generator
```

## Core Components

### 1. AST to Code Converter

Converts TypeScript AST nodes back to source code with support for multiple output formats.

```typescript
import { ASTToCodeConverter } from '@willow-cli/generator';

const converter = new ASTToCodeConverter();
const result = converter.convert(sourceFile, {
  format: OutputFormat.TypeScript,
  formatCode: true,
  preserveComments: true,
});
```

### 2. Template Processor

Processes templates with variable substitution, conditionals, and loops.

```typescript
import { TemplateProcessor } from '@willow-cli/generator';

const processor = new TemplateProcessor();
const code = await processor.process({
  name: 'react-component',
  variables: { componentName: 'Button' },
  template: 'path/to/template.tsx',
  outputPath: 'components/Button.tsx',
});
```

### 3. File Writer

Handles file system operations with conflict resolution and backups.

```typescript
import { FileWriter, ConflictResolution } from '@willow-cli/generator';

const writer = new FileWriter();
await writer.writeFiles(files, {
  outputDir: './generated',
  conflictResolution: ConflictResolution.Overwrite,
  createBackups: true,
});
```

### 4. File Organizer

Organizes generated files according to various strategies.

```typescript
import { FileOrganizer, DirectoryStructure } from '@willow-cli/generator';

const organizer = new FileOrganizer();
const result = organizer.organize(files, {
  outputDir: './output',
  structure: DirectoryStructure.Type,
  fileNaming: FileNamingConvention.KebabCase,
});
```

## API Reference

### ASTToCodeConverter

#### Methods

##### `convert(sourceFile: ts.SourceFile, options?: CodeGeneratorOptions): CodeGenerationResult`

Converts a TypeScript source file AST to code.

**Parameters:**

- `sourceFile`: TypeScript SourceFile node
- `options`: Optional configuration
  - `format`: Output format (TypeScript, JavaScript, JSX, TSX, ESModule, CommonJS)
  - `formatCode`: Whether to format with Prettier
  - `preserveComments`: Keep original comments
  - `sourceMaps`: Generate source maps

**Returns:**

- `code`: Generated code string
- `sourceMap`: Optional source map
- `filePath`: Target file path
- `diagnostics`: Any TypeScript diagnostics

##### `convertNode(node: ts.Node, options?: CodeGeneratorOptions): string`

Converts a single AST node to code string.

##### `stripTypes(sourceFile: ts.SourceFile): string`

Removes TypeScript type annotations from code.

### TemplateProcessor

#### Methods

##### `process(config: TemplateConfig): Promise<string>`

Processes a template with the given configuration.

**Parameters:**

- `config`: Template configuration
  - `name`: Template identifier
  - `variables`: Template variables
  - `template`: Template content or path
  - `outputPath`: Target file path

##### `registerEngine(name: string, engine: Function): void`

Registers a custom template engine.

##### `registerHelper(name: string, helper: Function): void`

Registers a template helper function.

### FileWriter

#### Methods

##### `writeFiles(files: CodeGenerationResult[], config: FileWriterConfig): Promise<FileWriteResult[]>`

Writes multiple files to the file system.

**Parameters:**

- `files`: Array of files to write
- `config`: Writer configuration
  - `outputDir`: Base output directory
  - `conflictResolution`: How to handle existing files
  - `createBackups`: Whether to backup existing files
  - `createDirectories`: Auto-create missing directories

##### `writeFile(file: CodeGenerationResult, config: FileWriterConfig): Promise<FileWriteResult>`

Writes a single file.

##### `createDirectory(path: string): Promise<void>`

Creates a directory recursively.

##### `backupFile(path: string): Promise<string>`

Creates a backup of an existing file.

### FileOrganizer

#### Methods

##### `organize(files: CodeGenerationResult[], config: FileOrganizationConfig): OrganizedFiles`

Organizes files according to the specified strategy.

**Parameters:**

- `files`: Files to organize
- `config`: Organization configuration
  - `outputDir`: Base output directory
  - `structure`: Directory structure strategy
  - `fileNaming`: File naming convention
  - `customMapper`: Optional custom organization function

## Usage Examples

### Basic Code Generation

```typescript
import {
  ASTToCodeConverter,
  FileWriter,
  FileOrganizer,
  OutputFormat,
  DirectoryStructure,
  ConflictResolution,
} from '@willow-cli/generator';
import * as ts from 'typescript';

// Create AST (normally from parser)
const sourceFile = ts.createSourceFile(
  'example.ts',
  'export const greeting = "Hello, World!";',
  ts.ScriptTarget.Latest,
  true
);

// Convert to code
const converter = new ASTToCodeConverter();
const result = converter.convert(sourceFile, {
  format: OutputFormat.TypeScript,
  formatCode: true,
});

// Organize files
const organizer = new FileOrganizer();
const organized = organizer.organize([result], {
  outputDir: './output',
  structure: DirectoryStructure.Mirror,
});

// Write to disk
const writer = new FileWriter();
await writer.writeFiles([result], {
  outputDir: './output',
  conflictResolution: ConflictResolution.Overwrite,
});
```

### Template-Based Generation

```typescript
import { TemplateProcessor, TemplateRegistry } from '@willow-cli/generator';

// Initialize registry
const registry = new TemplateRegistry();
await registry.initialize();

// Create React component
const config = registry.createTemplateConfig(
  'react-functional-component',
  {
    componentName: 'UserProfile',
    props: [
      { name: 'user', type: 'User', optional: false },
      { name: 'onEdit', type: '() => void', optional: true },
    ],
    useState: true,
    useEffect: true,
    styling: 'css-modules',
  },
  'components/UserProfile.tsx'
);

// Process template
const processor = new TemplateProcessor();
const code = await processor.process(config);

// Write file
const writer = new FileWriter();
await writer.writeFile(
  { code, filePath: config.outputPath },
  {
    outputDir: './src',
    conflictResolution: ConflictResolution.Prompt,
  }
);
```

### Batch Generation with Organization

```typescript
import {
  TemplateRegistry,
  TemplateProcessor,
  FileWriter,
  FileOrganizer,
  DirectoryStructure,
} from '@willow-cli/generator';

// Generate multiple files
const registry = new TemplateRegistry();
const processor = new TemplateProcessor();

const templates = [
  { id: 'react-component', output: 'Button.tsx' },
  { id: 'react-test', output: 'Button.test.tsx' },
  { id: 'css-module', output: 'Button.module.css' },
];

const files = await Promise.all(
  templates.map(async ({ id, output }) => {
    const config = registry.createTemplateConfig(id, variables, output);
    const code = await processor.process(config);
    return { code, filePath: output };
  })
);

// Organize by type
const organizer = new FileOrganizer();
const organized = organizer.organize(files, {
  outputDir: './src',
  structure: DirectoryStructure.Type,
  fileNaming: FileNamingConvention.KebabCase,
});

// Write all files
const writer = new FileWriter();
const results = await writer.writeFiles(files, {
  outputDir: './src',
  conflictResolution: ConflictResolution.Skip,
  createBackups: true,
});
```

## Template System

### Built-in Templates

The generator includes templates for:

- **React**: Functional components, custom hooks, context providers
- **Vue**: Composition API components, composables
- **Angular**: Standalone components, services, modules
- **Shared**: Tests, CSS modules, configuration files

### Template Variables

Templates support:

- Simple variable substitution: `{{variableName}}`
- Conditionals: `{{#if condition}}...{{/if}}`
- Loops: `{{#each array}}...{{/each}}`
- Helpers: `{{capitalize name}}`, `{{kebabCase title}}`

### Custom Templates

```typescript
// Register custom template
registry.registerTemplate({
  id: 'my-template',
  name: 'My Custom Template',
  framework: 'react',
  category: 'component',
  language: 'typescript',
  templatePath: './my-template.tsx.template',
  variables: [
    {
      name: 'componentName',
      type: 'string',
      required: true,
    },
  ],
});

// Register custom helper
processor.registerHelper('timestamp', () => new Date().toISOString());
```

## File Organization

### Directory Structures

- **Flat**: All files in one directory
- **Mirror**: Preserve source structure
- **Type**: Group by file type (components, utils, tests)
- **Feature**: Group by feature/module
- **Custom**: User-defined organization

### File Naming Conventions

- **Original**: Keep source names
- **KebabCase**: convert-to-kebab-case
- **CamelCase**: convertToCamelCase
- **PascalCase**: ConvertToPascalCase
- **Custom**: User-defined naming

## Advanced Features

### Conflict Resolution

```typescript
const config: FileWriterConfig = {
  outputDir: './output',
  conflictResolution: ConflictResolution.Custom,
  customResolver: async (existing, newContent, filePath) => {
    // Custom merge logic
    if (filePath.endsWith('.json')) {
      return mergeJson(existing, newContent);
    }
    return newContent;
  },
};
```

### Source Maps

```typescript
const result = converter.convert(sourceFile, {
  format: OutputFormat.JavaScript,
  sourceMaps: true,
});

// result.sourceMap contains the source map
```

### Custom Template Engines

```typescript
processor.registerEngine('pug', (template: string, data: any) => {
  // Custom Pug processing
  return compiledContent;
});
```

### Progress Tracking

```typescript
const writer = new FileWriter();
const results = await writer.writeFiles(files, config);

results.forEach((result) => {
  console.log(`${result.filePath}: ${result.action} (${result.duration}ms)`);
});
```

## Error Handling

All components provide detailed error information:

```typescript
try {
  const result = await writer.writeFile(file, config);
  if (!result.success) {
    console.error(`Failed to write ${result.filePath}:`, result.error);
  }
} catch (error) {
  // Handle fatal errors
  console.error('Fatal error:', error);
}
```

## Best Practices

1. **Use appropriate conflict resolution**: Choose the right strategy for your use case
2. **Enable backups**: When overwriting files in production
3. **Validate templates**: Test templates with various inputs
4. **Organize by feature**: For larger projects
5. **Use source maps**: For debugging generated code
6. **Handle errors gracefully**: Check result status before proceeding

## Contributing

See the main Willow CLI contributing guide for development setup and guidelines.

## License

MIT - see LICENSE file for details.
