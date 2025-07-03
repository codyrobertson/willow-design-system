import { readFile } from 'fs/promises';
import { fileExists } from './fileSystem.js';
import { ProjectType } from '../types/index.js';
import chalk from 'chalk';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checkedFiles: string[];
}

export interface ValidationCheck {
  name: string;
  file: string;
  required: boolean;
  contentChecks?: {
    contains: string[];
    description: string;
  }[];
}

/**
 * Comprehensive validation checker for Willow Design System setup
 */
export async function validateWillowSetup(projectType: ProjectType): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    checkedFiles: []
  };

  console.log(chalk.blue('🔍 Validating Willow Design System setup...'));

  // Define critical files and their content validation
  const validationChecks: ValidationCheck[] = [
    // Core configuration files
    {
      name: 'Components Configuration',
      file: 'components.json',
      required: true,
      contentChecks: [
        {
          contains: ['"willow"', '"components"', '"utils"'],
          description: 'Must contain Willow registry and path configurations'
        }
      ]
    },
    {
      name: 'Tailwind Configuration',
      file: projectType.isOnlineIDE ? 'tailwind.config.js' : 'tailwind.config.ts',
      required: true,
      contentChecks: [
        {
          contains: ['willow-primary', 'neutral', 'destructive'],
          description: 'Must include Willow color tokens'
        },
        {
          contains: ['button-secondary', 'shadow'],
          description: 'Must include Willow shadows and component tokens'
        },
        {
          contains: ['fontFamily', 'Codec Pro'],
          description: 'Must include Willow font family configuration'
        }
      ]
    },
    {
      name: 'Global CSS',
      file: projectType.isVite ? 'src/index.css' : 'src/app/globals.css',
      required: true,
      contentChecks: [
        {
          contains: ['@tailwind base', '@tailwind components', '@tailwind utilities'],
          description: 'Must include Tailwind directives'
        },
        {
          contains: ['--willow-primary', '--neutral', '--destructive'],
          description: 'Must include Willow CSS custom properties'
        },
        {
          contains: ['Codec Pro', 'display=swap'],
          description: 'Must include Willow font configurations'
        }
      ]
    },
    {
      name: 'Vite Configuration',
      file: 'vite.config.js',
      required: projectType.isVite,
      contentChecks: [
        {
          contains: ['"@":', 'resolve'],
          description: 'Must include path aliases for component imports'
        }
      ]
    },

    // Core library files
    {
      name: 'Utils Library',
      file: projectType.isOnlineIDE ? 'src/lib/utils.js' : 'src/lib/utils.ts',
      required: true,
      contentChecks: [
        {
          contains: ['clsx', 'twMerge', 'cn'],
          description: 'Must export cn utility function for class merging'
        }
      ]
    },
    {
      name: 'Design Tokens',
      file: projectType.isOnlineIDE ? 'src/lib/tokens.js' : 'src/lib/tokens.ts',
      required: true,
      contentChecks: [
        {
          contains: ['colors', 'typography', 'spacing'],
          description: 'Must export Willow design tokens'
        }
      ]
    },
    {
      name: 'Theme Colors',
      file: projectType.isOnlineIDE ? 'src/lib/theme-colors.js' : 'src/lib/theme-colors.ts',
      required: true,
      contentChecks: [
        {
          contains: ['themeColors', 'light', 'dark'],
          description: 'Must export Willow color system'
        }
      ]
    },
    {
      name: 'Theme Utils',
      file: projectType.isOnlineIDE ? 'src/lib/theme-utils.js' : 'src/lib/theme-utils.ts',
      required: true,
      contentChecks: [
        {
          contains: ['getThemeColor', 'applyTheme'],
          description: 'Must export theme utility functions'
        }
      ]
    },

    // Component system
    {
      name: 'Component Barrel Exports',
      file: 'src/components/ui/index.ts',
      required: true,
      contentChecks: [
        {
          contains: ['export * from', './button', './card', './badge'],
          description: 'Must export core Willow components'
        }
      ]
    },
    {
      name: 'Core Button Component',
      file: 'src/components/ui/button.tsx',
      required: true,
      contentChecks: [
        {
          contains: ['willow-primary', 'theme', 'variant'],
          description: 'Must use Willow design tokens and theming system'
        },
        {
          contains: ['cva', 'VariantProps'],
          description: 'Must use class-variance-authority for variants'
        }
      ]
    }
  ];

  // Version tracking
  const versionCheck: ValidationCheck = {
    name: 'Willow Version Tracking',
    file: '.willow-version.json',
    required: true,
    contentChecks: [
      {
        contains: ['version', 'timestamp'],
        description: 'Must track Willow CLI version and installation time'
      }
    ]
  };
  validationChecks.push(versionCheck);

  // Run all validation checks
  for (const check of validationChecks) {
    await runValidationCheck(check, result);
  }

  // Summary
  const totalChecks = validationChecks.length;
  const passedChecks = totalChecks - result.errors.length;
  
  if (result.errors.length === 0) {
    console.log(chalk.green(`✅ All ${totalChecks} validation checks passed!`));
    console.log(chalk.gray(`   Verified: ${result.checkedFiles.length} files`));
  } else {
    result.isValid = false;
    console.log(chalk.red(`❌ ${result.errors.length} validation errors found`));
    console.log(chalk.yellow(`⚠️  ${result.warnings.length} warnings`));
    console.log(chalk.blue(`ℹ️  ${passedChecks}/${totalChecks} checks passed`));
  }

  return result;
}

async function runValidationCheck(check: ValidationCheck, result: ValidationResult): Promise<void> {
  const { name, file, required, contentChecks } = check;

  try {
    // Check if file exists
    const exists = await fileExists(file);
    
    if (!exists) {
      if (required) {
        result.errors.push(`Missing required file: ${file} (${name})`);
        console.log(chalk.red(`   ❌ ${name}: ${file} not found`));
      } else {
        result.warnings.push(`Optional file not found: ${file} (${name})`);
        console.log(chalk.yellow(`   ⚠️  ${name}: ${file} not found (optional)`));
      }
      return;
    }

    result.checkedFiles.push(file);

    // Read and validate content if checks are defined
    if (contentChecks && contentChecks.length > 0) {
      const content = await readFile(file, 'utf-8');
      
      for (const contentCheck of contentChecks) {
        const missingItems = contentCheck.contains.filter(item => !content.includes(item));
        
        if (missingItems.length > 0) {
          const error = `${name} (${file}): Missing ${contentCheck.description} - missing: ${missingItems.join(', ')}`;
          result.errors.push(error);
          console.log(chalk.red(`   ❌ ${name}: Missing required content`));
          console.log(chalk.gray(`      ${contentCheck.description}`));
          console.log(chalk.gray(`      Missing: ${missingItems.join(', ')}`));
        } else {
          console.log(chalk.green(`   ✅ ${name}: Content validation passed`));
        }
      }
    } else {
      console.log(chalk.green(`   ✅ ${name}: File exists`));
    }

  } catch (error) {
    const errorMsg = `Error validating ${file} (${name}): ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.log(chalk.red(`   ❌ ${name}: Validation error`));
    console.log(chalk.gray(`      ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * Quick validation for essential files only
 */
export async function validateEssentials(projectType: ProjectType): Promise<boolean> {
  const essentialFiles = [
    'components.json',
    projectType.isOnlineIDE ? 'tailwind.config.js' : 'tailwind.config.ts',
    projectType.isVite ? 'src/index.css' : 'src/app/globals.css',
    projectType.isOnlineIDE ? 'src/lib/utils.js' : 'src/lib/utils.ts',
  ];

  console.log(chalk.blue('🔍 Quick validation of essential files...'));
  
  for (const file of essentialFiles) {
    const exists = await fileExists(file);
    if (!exists) {
      console.log(chalk.red(`   ❌ Missing essential file: ${file}`));
      return false;
    } else {
      console.log(chalk.green(`   ✅ ${file}`));
    }
  }

  console.log(chalk.green('✅ Essential files validation passed'));
  return true;
}

/**
 * Validate component imports work correctly
 */
export async function validateComponentImports(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    checkedFiles: []
  };

  console.log(chalk.blue('🔍 Validating component import structure...'));

  try {
    // Check barrel exports file
    const barrelFile = 'src/components/ui/index.ts';
    if (await fileExists(barrelFile)) {
      const content = await readFile(barrelFile, 'utf-8');
      result.checkedFiles.push(barrelFile);

      // Check for proper exports (looking for export statements)
      const expectedExports = ['./button', './card', './badge', './input', './label'];
      const missingExports = expectedExports.filter(exp => !content.includes(exp));
      
      if (missingExports.length > 0) {
        result.errors.push(`Missing component exports: ${missingExports.join(', ')}`);
        console.log(chalk.red(`   ❌ Missing exports: ${missingExports.join(', ')}`));
      } else {
        console.log(chalk.green(`   ✅ Component exports validated`));
      }

      // Check for proper import patterns
      const hasProperImports = content.includes('export') && content.includes('./');
      if (!hasProperImports) {
        result.warnings.push('Barrel file may not have proper import/export structure');
        console.log(chalk.yellow(`   ⚠️  Unusual import/export structure in barrel file`));
      }
    } else {
      result.errors.push('Component barrel file (src/components/ui/index.ts) not found');
      console.log(chalk.red(`   ❌ Barrel file not found`));
    }

  } catch (error) {
    result.errors.push(`Component import validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(chalk.red(`   ❌ Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }

  result.isValid = result.errors.length === 0;
  return result;
}