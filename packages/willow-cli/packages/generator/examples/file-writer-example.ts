/**
 * FileWriter Usage Example
 * Demonstrates various file writing scenarios and conflict resolution strategies
 */

import { FileWriter, ConflictResolution, FileWriterConfig, CodeGenerationResult } from '../src';

async function demonstrateFileWriter() {
  const fileWriter = new FileWriter();

  // Example 1: Basic file writing with overwrite strategy
  console.log('Example 1: Basic file writing');
  const basicConfig: FileWriterConfig = {
    outputDir: './output',
    conflictResolution: ConflictResolution.Overwrite,
    createBackups: true,
    createDirectories: true,
  };

  const simpleFile: CodeGenerationResult = {
    code: `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`,
    filePath: 'greet.ts',
  };

  const result1 = await fileWriter.writeFile(simpleFile, basicConfig);
  console.log('Result:', result1);

  // Example 2: Writing multiple files with skip strategy
  console.log('\nExample 2: Writing multiple files');
  const multiConfig: FileWriterConfig = {
    outputDir: './output',
    conflictResolution: ConflictResolution.Skip,
    createDirectories: true,
  };

  const multipleFiles: CodeGenerationResult[] = [
    {
      code: 'export const API_URL = "https://api.example.com";',
      filePath: 'config/api.ts',
    },
    {
      code: 'export const APP_VERSION = "1.0.0";',
      filePath: 'config/version.ts',
    },
    {
      code: `import { API_URL } from './config/api';
import { APP_VERSION } from './config/version';

console.log(\`App v\${APP_VERSION} connecting to \${API_URL}\`);`,
      filePath: 'index.ts',
    },
  ];

  const results2 = await fileWriter.writeFiles(multipleFiles, multiConfig);
  console.log('Results:', results2);

  // Example 3: JSON merging
  console.log('\nExample 3: JSON file merging');
  const mergeConfig: FileWriterConfig = {
    outputDir: './output',
    conflictResolution: ConflictResolution.Merge,
    createBackups: true,
  };

  const packageJsonUpdate: CodeGenerationResult = {
    code: JSON.stringify(
      {
        scripts: {
          'test:unit': 'vitest',
          'test:e2e': 'playwright test',
        },
        devDependencies: {
          vitest: '^1.0.0',
          '@playwright/test': '^1.40.0',
        },
      },
      null,
      2
    ),
    filePath: 'package.json',
  };

  const result3 = await fileWriter.writeFile(packageJsonUpdate, mergeConfig);
  console.log('Result:', result3);

  // Example 4: Custom conflict resolution
  console.log('\nExample 4: Custom conflict resolution');
  const customConfig: FileWriterConfig = {
    outputDir: './output',
    conflictResolution: ConflictResolution.Custom,
    customResolver: async (existing, newContent, filePath) => {
      // Custom logic: append new imports to existing file
      if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        const existingImports = existing.match(/^import .*/gm) || [];
        const newImports = newContent.match(/^import .*/gm) || [];
        const allImports = [...new Set([...existingImports, ...newImports])];

        const existingWithoutImports = existing.replace(/^import .*\n/gm, '');
        const newWithoutImports = newContent.replace(/^import .*\n/gm, '');

        return `${allImports.join('\n')}\n\n${existingWithoutImports}\n\n// Generated additions:\n${newWithoutImports}`;
      }
      return newContent; // Default: use new content
    },
  };

  const moduleUpdate: CodeGenerationResult = {
    code: `import { Logger } from './logger';
import { Database } from './database';

export class UserService {
  constructor(
    private logger: Logger,
    private db: Database
  ) {}
  
  async getUser(id: string) {
    this.logger.info(\`Fetching user \${id}\`);
    return this.db.users.findById(id);
  }
}`,
    filePath: 'services/user.service.ts',
  };

  const result4 = await fileWriter.writeFile(moduleUpdate, customConfig);
  console.log('Result:', result4);

  // Example 5: Suffix strategy for avoiding conflicts
  console.log('\nExample 5: Suffix strategy');
  const suffixConfig: FileWriterConfig = {
    outputDir: './output',
    conflictResolution: ConflictResolution.Suffix,
  };

  const componentFile: CodeGenerationResult = {
    code: `export const Button = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};`,
    filePath: 'components/Button.tsx',
  };

  // Write the same file multiple times to see suffix behavior
  const result5a = await fileWriter.writeFile(componentFile, suffixConfig);
  const result5b = await fileWriter.writeFile(componentFile, suffixConfig);
  const result5c = await fileWriter.writeFile(componentFile, suffixConfig);

  console.log('Results:', [result5a, result5b, result5c]);
}

// Run the demonstration
if (require.main === module) {
  demonstrateFileWriter().catch(console.error);
}
