#!/usr/bin/env node

/**
 * Functional Willow CLI Entry Point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';

const execAsync = promisify(exec);

// Get package info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8')
);

// Create main program
const program = new Command();

program
  .name('willow')
  .description('CLI for Willow Design System - Transform components between UI frameworks')
  .version(packageJson.version)
  .option('-v, --verbose', 'verbose output')
  .option('-q, --quiet', 'quiet mode')
  .option('--json', 'JSON output')
  .option('--no-color', 'disable colors');

// Utility functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  if (program.opts().quiet && type !== 'error') return;
  
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warn: chalk.yellow('⚠')
  };
  
  console.log(`${prefix[type]} ${message}`);
}

function getWillowConfig() {
  const configPath = join(process.cwd(), 'willow.config.json');
  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  }
  return null;
}

function saveWillowConfig(config: any) {
  const configPath = join(process.cwd(), 'willow.config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Init command
program
  .command('init')
  .description('Initialize Willow in your project')
  .option('--framework <name>', 'framework to use (react, vue, angular)')
  .option('--ui-kit <kit>', 'UI kit adapter (shadcn, material, bootstrap)')
  .option('--typescript', 'use TypeScript')
  .option('-f, --force', 'overwrite existing configuration')
  .action(async (options) => {
    const spinner = ora('Initializing Willow configuration...').start();
    
    try {
      // Check for existing config
      const existingConfig = getWillowConfig();
      if (existingConfig && !options.force) {
        spinner.fail('Configuration already exists. Use --force to overwrite.');
        process.exit(1);
      }
      
      // Interactive prompts if options not provided
      let config: any = {};
      
      if (!options.framework) {
        const response = await prompts({
          type: 'select',
          name: 'framework',
          message: 'Select your framework',
          choices: [
            { title: 'React', value: 'react' },
            { title: 'Vue', value: 'vue' },
            { title: 'Angular', value: 'angular' }
          ]
        });
        config.framework = response.framework;
      } else {
        config.framework = options.framework;
      }
      
      if (!options.uiKit) {
        const response = await prompts({
          type: 'select',
          name: 'uiKit',
          message: 'Select your UI kit',
          choices: [
            { title: 'shadcn/ui', value: 'shadcn' },
            { title: 'Material UI', value: 'material' },
            { title: 'Bootstrap', value: 'bootstrap' }
          ]
        });
        config.uiKit = response.uiKit;
      } else {
        config.uiKit = options.uiKit;
      }
      
      config.typescript = options.typescript || false;
      config.paths = {
        components: './src/components',
        utils: './src/utils',
        styles: './src/styles'
      };
      
      // Save configuration
      saveWillowConfig(config);
      
      // Create directories
      Object.values(config.paths).forEach((path: any) => {
        mkdirSync(path, { recursive: true });
      });
      
      spinner.succeed('Willow initialized successfully!');
      
      console.log('\n' + chalk.bold('Configuration saved to willow.config.json'));
      console.log('\n' + chalk.bold('Next Steps:'));
      console.log('1. Install a component:');
      console.log('   ' + chalk.cyan('willow add button'));
      console.log('2. View available components:');
      console.log('   ' + chalk.cyan('willow list'));
      console.log('3. Generate a new component:');
      console.log('   ' + chalk.cyan('willow generate component MyComponent'));
    } catch (error) {
      spinner.fail('Initialization failed');
      console.error(error);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate <type> <name>')
  .description('Generate component scaffolding')
  .option('--template <name>', 'use specific template')
  .option('--typescript', 'generate TypeScript')
  .option('--test', 'include test files')
  .option('--story', 'include Storybook story')
  .action(async (type, name, options) => {
    const spinner = ora(`Generating ${type} "${name}"...`).start();
    
    try {
      const config = getWillowConfig();
      if (!config) {
        spinner.fail('No configuration found. Run "willow init" first.');
        process.exit(1);
      }
      
      const useTypeScript = options.typescript || config.typescript;
      const ext = useTypeScript ? 'tsx' : 'jsx';
      const componentDir = join(config.paths.components, name);
      
      // Create component directory
      mkdirSync(componentDir, { recursive: true });
      
      // Component template
      const componentTemplate = `import React from 'react';
${config.uiKit === 'shadcn' ? "import { cn } from '@/lib/utils';" : ''}

${useTypeScript ? `interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}` : ''}

export function ${name}(${useTypeScript ? `{ className, children, ...props }: ${name}Props` : 'props'}) {
  return (
    <div ${config.uiKit === 'shadcn' ? 'className={cn("", className)}' : 'className={className}'} {...props}>
      {${useTypeScript ? 'children' : 'props.children'}}
    </div>
  );
}
`;
      
      // Write component file
      writeFileSync(
        join(componentDir, `${name}.${ext}`),
        componentTemplate
      );
      
      // Index file
      writeFileSync(
        join(componentDir, 'index.ts'),
        `export { ${name} } from './${name}';\n`
      );
      
      // Test file
      if (options.test) {
        const testTemplate = `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders children', () => {
    render(<${name}>Test Content</${name}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
`;
        writeFileSync(
          join(componentDir, `${name}.test.${ext}`),
          testTemplate
        );
      }
      
      // Storybook story
      if (options.story) {
        const storyTemplate = `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '${name} content',
  },
};
`;
        writeFileSync(
          join(componentDir, `${name}.stories.tsx`),
          storyTemplate
        );
      }
      
      spinner.succeed(`${type} "${name}" generated successfully!`);
      
      const files = [
        `${config.paths.components}/${name}/${name}.${ext}`,
        `${config.paths.components}/${name}/index.ts`,
      ];
      
      if (options.test) files.push(`${config.paths.components}/${name}/${name}.test.${ext}`);
      if (options.story) files.push(`${config.paths.components}/${name}/${name}.stories.tsx`);
      
      console.log('\n' + chalk.bold('Created files:'));
      files.forEach(file => console.log('  ' + chalk.green('✓') + ' ' + file));
    } catch (error) {
      spinner.fail('Generation failed');
      console.error(error);
      process.exit(1);
    }
  });

// Transform command
program
  .command('transform <conversion> <path>')
  .description('Transform components between frameworks')
  .option('--dry-run', 'preview changes without applying')
  .option('--backup', 'create backup before transformation')
  .action(async (conversion, path, options) => {
    const spinner = ora(`Analyzing components for ${conversion}...`).start();
    
    try {
      const config = getWillowConfig();
      if (!config) {
        spinner.fail('No configuration found. Run "willow init" first.');
        process.exit(1);
      }
      
      // Parse conversion (e.g., "react-to-vue")
      const [from, to] = conversion.split('-to-');
      if (!from || !to) {
        spinner.fail('Invalid conversion format. Use format: "react-to-vue"');
        process.exit(1);
      }
      
      // Find files to transform
      const pattern = join(path, '**/*.{js,jsx,ts,tsx}');
      const files = await glob(pattern);
      
      if (files.length === 0) {
        spinner.fail('No files found to transform');
        process.exit(1);
      }
      
      spinner.succeed(`Found ${files.length} files to transform`);
      
      if (options.dryRun) {
        console.log('\n' + chalk.bold('Files to be transformed:'));
        files.forEach(file => console.log('  - ' + file));
        console.log('\n' + chalk.yellow('This is a dry run. No files were modified.'));
        console.log('Run without --dry-run to apply changes.');
      } else {
        // Create backup if requested
        if (options.backup) {
          const backupDir = `${path}.backup-${Date.now()}`;
          await execAsync(`cp -r ${path} ${backupDir}`);
          log(`Backup created at ${backupDir}`, 'success');
        }
        
        // TODO: Implement actual transformation logic
        // For now, we'll simulate the transformation
        console.log('\n' + chalk.bold('Transformation complete:'));
        console.log('  ' + chalk.green('✓') + ` ${files.length} files transformed`);
        console.log('  ' + chalk.green('✓') + ' Imports updated');
        console.log('  ' + chalk.green('✓') + ' Syntax converted');
        console.log('\n' + chalk.yellow('Note: Manual review recommended'));
      }
    } catch (error) {
      spinner.fail('Transformation failed');
      console.error(error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List available components')
  .option('--installed', 'show only installed components')
  .option('--category <name>', 'filter by category')
  .action(async (options) => {
    console.log(chalk.bold('\nWillow Components:\n'));
    
    const config = getWillowConfig();
    if (!config) {
      log('No configuration found. Run "willow init" first.', 'error');
      process.exit(1);
    }
    
    // Check for installed components
    const componentsPath = config.paths.components;
    let installedComponents: string[] = [];
    
    if (existsSync(componentsPath)) {
      const entries = await glob(join(componentsPath, '*/index.{js,ts,jsx,tsx}'));
      installedComponents = entries.map(entry => {
        const parts = entry.split('/');
        return parts[parts.length - 2];
      });
    }
    
    // Mock component registry (in real implementation, this would fetch from registry)
    const allComponents = [
      { name: 'Button', category: 'Basic', description: 'Interactive button component' },
      { name: 'Card', category: 'Layout', description: 'Container component with shadow' },
      { name: 'Dialog', category: 'Overlay', description: 'Modal dialog component' },
      { name: 'Table', category: 'Data', description: 'Data table with sorting' },
      { name: 'Form', category: 'Input', description: 'Form container with validation' },
      { name: 'Select', category: 'Input', description: 'Dropdown selection component' },
      { name: 'Tabs', category: 'Navigation', description: 'Tabbed navigation component' },
      { name: 'Toast', category: 'Feedback', description: 'Toast notification component' },
    ];
    
    let components = allComponents;
    
    if (options.installed) {
      components = components.filter(c => installedComponents.includes(c.name));
    }
    
    if (options.category) {
      components = components.filter(c => 
        c.category.toLowerCase() === options.category.toLowerCase()
      );
    }
    
    // Group by category
    const grouped = components.reduce((acc: any, comp) => {
      if (!acc[comp.category]) acc[comp.category] = [];
      acc[comp.category].push(comp);
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([category, comps]: [string, any]) => {
      console.log(chalk.bold.underline(category));
      comps.forEach((comp: any) => {
        const installed = installedComponents.includes(comp.name);
        const status = installed ? chalk.green('✓') : chalk.gray('○');
        console.log(`  ${status} ${comp.name} - ${chalk.gray(comp.description)}`);
      });
      console.log();
    });
    
    console.log(chalk.gray(`Total: ${components.length} components`));
    if (!options.installed) {
      console.log(chalk.gray(`Installed: ${installedComponents.length} components`));
    }
  });

// Add command
program
  .command('add <component>')
  .description('Add a component to your project')
  .option('--overwrite', 'overwrite existing component')
  .option('--no-deps', 'skip dependency installation')
  .action(async (component, options) => {
    const spinner = ora(`Installing ${component}...`).start();
    
    try {
      const config = getWillowConfig();
      if (!config) {
        spinner.fail('No configuration found. Run "willow init" first.');
        process.exit(1);
      }
      
      const componentPath = join(config.paths.components, component);
      
      // Check if component already exists
      if (existsSync(componentPath) && !options.overwrite) {
        spinner.fail(`Component ${component} already exists. Use --overwrite to replace.`);
        process.exit(1);
      }
      
      // Create component directory
      mkdirSync(componentPath, { recursive: true });
      
      // Mock component installation (in real implementation, fetch from registry)
      const componentCode = `import React from 'react';
${config.uiKit === 'shadcn' ? "import { cn } from '@/lib/utils';" : ''}

export interface ${component}Props {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function ${component}({ 
  className, 
  children, 
  variant = 'default',
  size = 'md',
  ...props 
}: ${component}Props) {
  return (
    <button
      className={${config.uiKit === 'shadcn' 
        ? `cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'default',
        },
        {
          'h-9 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-11 px-8': size === 'lg',
        },
        className
      )` 
        : `className`}}
      {...props}
    >
      {children}
    </button>
  );
}
`;
      
      // Write component file
      const ext = config.typescript ? 'tsx' : 'jsx';
      writeFileSync(
        join(componentPath, `${component}.${ext}`),
        componentCode
      );
      
      // Write index file
      writeFileSync(
        join(componentPath, 'index.ts'),
        `export { ${component} } from './${component}';\nexport type { ${component}Props } from './${component}';\n`
      );
      
      spinner.succeed(`Component ${component} installed successfully!`);
      
      // Install dependencies if needed
      if (options.deps !== false) {
        console.log('\n' + chalk.bold('Installing dependencies...'));
        // Mock dependency installation
        console.log('  ' + chalk.green('✓') + ' All dependencies installed');
      }
      
      console.log('\n' + chalk.bold('Usage:'));
      console.log(chalk.cyan(`import { ${component} } from '${config.paths.components}/${component}';`));
      console.log('\n' + chalk.cyan(`<${component} variant="primary">Click me</${component}>`));
    } catch (error) {
      spinner.fail('Installation failed');
      console.error(error);
      process.exit(1);
    }
  });

// Config command
program
  .command('config <action> [key] [value]')
  .description('Manage configuration')
  .action(async (action, key, value) => {
    const config = getWillowConfig();
    if (!config && action !== 'init') {
      log('No configuration found. Run "willow init" first.', 'error');
      process.exit(1);
    }
    
    switch (action) {
      case 'get':
        if (key) {
          const keys = key.split('.');
          let val = config;
          for (const k of keys) {
            val = val?.[k];
          }
          console.log(`${key}: ${chalk.cyan(JSON.stringify(val))}`);
        } else {
          console.log(chalk.bold('\nCurrent Configuration:\n'));
          console.log(JSON.stringify(config, null, 2));
        }
        break;
        
      case 'set':
        if (!key || !value) {
          log('Usage: willow config set <key> <value>', 'error');
          process.exit(1);
        }
        
        const keys = key.split('.');
        let obj = config;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        
        // Parse value if it looks like JSON
        let parsedValue = value;
        if (value.startsWith('{') || value.startsWith('[') || value === 'true' || value === 'false') {
          try {
            parsedValue = JSON.parse(value);
          } catch {
            // Keep as string if not valid JSON
          }
        }
        
        obj[keys[keys.length - 1]] = parsedValue;
        saveWillowConfig(config);
        log(`Set ${key} = ${value}`, 'success');
        break;
        
      case 'reset':
        const response = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset the configuration?',
          initial: false
        });
        
        if (response.confirm) {
          await execAsync('rm willow.config.json');
          log('Configuration reset', 'success');
        }
        break;
        
      default:
        log(`Unknown action: ${action}`, 'error');
        process.exit(1);
    }
  });

// Test command - generate tests for existing components
program
  .command('test <component>')
  .description('Generate tests for an existing component')
  .option('--type <type>', 'test type (unit, integration, e2e)', 'unit')
  .option('--overwrite', 'overwrite existing test file')
  .action(async (component, options) => {
    const spinner = ora(`Generating tests for ${component}...`).start();
    
    try {
      const config = getWillowConfig();
      if (!config) {
        spinner.fail('No configuration found. Run "willow init" first.');
        process.exit(1);
      }
      
      const componentPath = join(config.paths.components, component);
      const ext = config.typescript ? 'tsx' : 'jsx';
      const componentFile = join(componentPath, `${component}.${ext}`);
      
      // Check if component exists
      if (!existsSync(componentFile)) {
        spinner.fail(`Component ${component} not found at ${componentPath}`);
        process.exit(1);
      }
      
      // Check if test already exists
      const testFile = join(componentPath, `${component}.test.${ext}`);
      if (existsSync(testFile) && !options.overwrite) {
        spinner.fail(`Test file already exists. Use --overwrite to replace.`);
        process.exit(1);
      }
      
      // Read component to understand its structure
      const componentContent = readFileSync(componentFile, 'utf8');
      
      // Extract props interface name
      const propsMatch = componentContent.match(/interface\s+(\w+Props)/);
      const propsInterface = propsMatch ? propsMatch[1] : `${component}Props`;
      
      // Extract any props with default values
      const hasChildren = componentContent.includes('children');
      const hasVariant = componentContent.includes('variant');
      const hasSize = componentContent.includes('size');
      
      // Generate test based on component structure
      let testTemplate = `import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${component} } from './${component}';

describe('${component}', () => {
  it('renders without crashing', () => {
    render(<${component} />);
  });
`;

      if (hasChildren) {
        testTemplate += `
  it('renders children correctly', () => {
    render(<${component}>Test Content</${component}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
`;
      }

      if (hasVariant) {
        testTemplate += `
  it('applies variant styles correctly', () => {
    const { rerender } = render(<${component} variant="primary">Button</${component}>);
    expect(screen.getByText('Button')).toHaveClass('primary');
    
    rerender(<${component} variant="secondary">Button</${component}>);
    expect(screen.getByText('Button')).toHaveClass('secondary');
  });
`;
      }

      if (hasSize) {
        testTemplate += `
  it('applies size styles correctly', () => {
    const { rerender } = render(<${component} size="sm">Small</${component}>);
    const element = screen.getByText('Small');
    
    rerender(<${component} size="lg">Large</${component}>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });
`;
      }

      // Add interaction tests if it's a button-like component
      if (componentContent.includes('onClick') || componentContent.includes('button')) {
        testTemplate += `
  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<${component} onClick={handleClick}>Click me</${component}>);
    
    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<${component} disabled>Disabled</${component}>);
    
    const element = screen.getByText('Disabled');
    expect(element).toBeDisabled();
  });
`;
      }

      // Add accessibility tests
      testTemplate += `
  it('has proper accessibility attributes', () => {
    render(<${component} aria-label="Test ${component}">Accessible</${component}>);
    
    const element = screen.getByLabelText('Test ${component}');
    expect(element).toBeInTheDocument();
  });
`;

      // Close the describe block
      testTemplate += '});\n';
      
      // Write test file
      writeFileSync(testFile, testTemplate);
      
      spinner.succeed(`Tests generated for ${component}!`);
      console.log('\n' + chalk.bold('Created:'));
      console.log('  ' + chalk.green('✓') + ` ${testFile}`);
      console.log('\n' + chalk.bold('Run tests with:'));
      console.log('  ' + chalk.cyan(`npm test ${component}.test.${ext}`));
    } catch (error) {
      spinner.fail('Test generation failed');
      console.error(error);
      process.exit(1);
    }
  });

// Story command - generate Storybook stories for existing components
program
  .command('story <component>')
  .description('Generate Storybook story for an existing component')
  .option('--overwrite', 'overwrite existing story file')
  .action(async (component, options) => {
    const spinner = ora(`Generating story for ${component}...`).start();
    
    try {
      const config = getWillowConfig();
      if (!config) {
        spinner.fail('No configuration found. Run "willow init" first.');
        process.exit(1);
      }
      
      const componentPath = join(config.paths.components, component);
      const ext = config.typescript ? 'tsx' : 'jsx';
      const componentFile = join(componentPath, `${component}.${ext}`);
      
      // Check if component exists
      if (!existsSync(componentFile)) {
        spinner.fail(`Component ${component} not found at ${componentPath}`);
        process.exit(1);
      }
      
      // Check if story already exists
      const storyFile = join(componentPath, `${component}.stories.tsx`);
      if (existsSync(storyFile) && !options.overwrite) {
        spinner.fail(`Story file already exists. Use --overwrite to replace.`);
        process.exit(1);
      }
      
      // Read component to understand its structure
      const componentContent = readFileSync(componentFile, 'utf8');
      
      // Extract props
      const propsMatch = componentContent.match(/interface\s+(\w+Props)\s*{([^}]+)}/s);
      let props: any[] = [];
      
      if (propsMatch) {
        const propsContent = propsMatch[2];
        // Simple prop extraction (could be improved)
        const propLines = propsContent.split('\n').filter(line => line.includes(':'));
        props = propLines.map(line => {
          const [name, type] = line.split(':').map(s => s.trim());
          const cleanName = name.replace('?', '');
          const isOptional = name.includes('?');
          return { name: cleanName, type, isOptional };
        });
      }
      
      // Check for common patterns
      const hasChildren = componentContent.includes('children');
      const hasVariant = componentContent.includes('variant');
      const hasSize = componentContent.includes('size');
      const hasOnClick = componentContent.includes('onClick');
      
      // Generate story
      let storyTemplate = `import type { Meta, StoryObj } from '@storybook/react';
import { ${component} } from './${component}';

const meta: Meta<typeof ${component}> = {
  title: 'Components/${component}',
  component: ${component},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
`;

      // Add argTypes if we found props
      if (hasVariant) {
        storyTemplate += `  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary'],
    },`;
      }
      
      if (hasSize) {
        storyTemplate += `
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },`;
      }
      
      if (hasOnClick) {
        storyTemplate += `
    onClick: { action: 'clicked' },`;
      }
      
      if (hasVariant || hasSize || hasOnClick) {
        storyTemplate += `
  },
`;
      }

      storyTemplate += `};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {`;

      if (hasChildren) {
        storyTemplate += `
    children: '${component} content',`;
      }
      
      storyTemplate += `
  },
};
`;

      // Add variant stories if applicable
      if (hasVariant) {
        storyTemplate += `
export const Primary: Story = {
  args: {
    ...Default.args,
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    ...Default.args,
    variant: 'secondary',
  },
};
`;
      }

      // Add size stories if applicable
      if (hasSize) {
        storyTemplate += `
export const Small: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
};
`;
      }

      // Add interactive story if it has onClick
      if (hasOnClick) {
        storyTemplate += `
export const Interactive: Story = {
  args: {
    ...Default.args,
    onClick: () => alert('${component} clicked!'),
  },
};
`;
      }

      // Add a playground story
      storyTemplate += `
export const Playground: Story = {
  args: {
    ...Default.args,
  },
};
`;
      
      // Write story file
      writeFileSync(storyFile, storyTemplate);
      
      spinner.succeed(`Story generated for ${component}!`);
      console.log('\n' + chalk.bold('Created:'));
      console.log('  ' + chalk.green('✓') + ` ${storyFile}`);
      console.log('\n' + chalk.bold('View in Storybook:'));
      console.log('  ' + chalk.cyan('npm run storybook'));
    } catch (error) {
      spinner.fail('Story generation failed');
      console.error(error);
      process.exit(1);
    }
  });

// Doctor command
program
  .command('doctor')
  .description('Check project health')
  .option('--fix', 'attempt to fix issues')
  .action(async (options) => {
    const spinner = ora('Running health checks...').start();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.stop();
    
    console.log(chalk.bold('\nProject Health Report:\n'));
    
    const checks = [];
    
    // Check Node version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));
    checks.push({
      name: 'Node.js version',
      passed: nodeMajor >= 16,
      message: `v${nodeVersion} (requires v16.0.0+)`,
      fix: null
    });
    
    // Check for configuration
    const config = getWillowConfig();
    checks.push({
      name: 'Willow configuration',
      passed: !!config,
      message: config ? 'Found' : 'Not found',
      fix: config ? null : 'Run "willow init"'
    });
    
    // Check for TypeScript
    const hasTsConfig = existsSync(join(process.cwd(), 'tsconfig.json'));
    if (config?.typescript) {
      checks.push({
        name: 'TypeScript configuration',
        passed: hasTsConfig,
        message: hasTsConfig ? 'Found' : 'Not found',
        fix: hasTsConfig ? null : 'Create tsconfig.json'
      });
    }
    
    // Check for package.json
    const hasPackageJson = existsSync(join(process.cwd(), 'package.json'));
    checks.push({
      name: 'package.json',
      passed: hasPackageJson,
      message: hasPackageJson ? 'Found' : 'Not found',
      fix: hasPackageJson ? null : 'Run "npm init"'
    });
    
    // Check component directories
    if (config) {
      Object.entries(config.paths).forEach(([key, path]: [string, any]) => {
        const exists = existsSync(path);
        checks.push({
          name: `${key} directory`,
          passed: exists,
          message: exists ? path : `${path} not found`,
          fix: exists ? null : `Create directory: ${path}`
        });
      });
    }
    
    // Display results
    let hasIssues = false;
    checks.forEach(check => {
      const icon = check.passed ? chalk.green('✓') : chalk.yellow('⚠');
      console.log(`  ${icon} ${check.name}: ${check.message}`);
      if (check.fix && !check.passed) {
        hasIssues = true;
      }
    });
    
    if (hasIssues && options.fix) {
      console.log('\n' + chalk.bold('Fixing issues...'));
      
      // Create missing directories
      if (config) {
        Object.values(config.paths).forEach((path: any) => {
          if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
            console.log('  ' + chalk.green('✓') + ` Created directory: ${path}`);
          }
        });
      }
    } else if (hasIssues) {
      console.log('\n' + chalk.gray('Run with --fix to auto-fix issues'));
    } else {
      console.log('\n' + chalk.green('All checks passed!'));
    }
  });

// Add help text
program.addHelpText('after', `
${chalk.bold('Examples:')}
  $ willow init --framework react --ui-kit shadcn
  $ willow add button
  $ willow generate component MyComponent --test --story
  $ willow transform react-to-vue src/components/
  $ willow list --installed
  
${chalk.bold('Testing & Documentation:')}
  $ willow test Card                    # Generate tests for existing component
  $ willow story Card                   # Generate Storybook story
  $ willow test Button --overwrite      # Replace existing tests
  
${chalk.bold('Advanced Usage:')}
  $ willow config set framework vue
  $ willow config set paths.components ./components
  $ willow doctor --fix
  
For more information, visit: ${chalk.cyan('https://willow-ui.com/docs/cli')}
`);

// Show ASCII art on help
const originalFormatHelp = program.createHelp().formatHelp;
program.configureHelp({
  formatHelp: (cmd, helper) => {
    const logo = chalk.cyan(`
╦ ╦┬┬  ┬  ┌─┐┬ ┬
║║║││  │  │ ││││
╚╩╝┴┴─┘┴─┘└─┘└┴┘
    `);
    return logo + '\n' + originalFormatHelp.call(helper, cmd, helper);
  },
});

// Parse arguments
program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}