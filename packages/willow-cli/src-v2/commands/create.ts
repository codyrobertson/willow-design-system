/**
 * Create Command - Scaffold new components
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { CommandContext } from '../core/command-loader';
import { FileManager } from '../utils/file-manager';
import { detectFramework } from '../utils/framework-detector';

const COMPONENT_TEMPLATES = {
  button: `import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
        },
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}`,
  card: `import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'shadow';
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-card text-card-foreground',
        {
          'border': variant === 'bordered',
          'shadow-lg': variant === 'shadow',
        },
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}`,
  default: `import React from 'react';
import { cn } from '@/lib/utils';

export interface {{NAME}}Props extends React.HTMLAttributes<HTMLDivElement> {
  // Add your props here
}

export function {{NAME}}({ className, ...props }: {{NAME}}Props) {
  return (
    <div className={cn('', className)} {...props}>
      {/* Component implementation */}
    </div>
  );
}`
};

export function createCreateCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('create')
    .description('Create a new component with boilerplate')
    .argument('<name>', 'Component name (e.g., button, card, modal)')
    .option('--template <template>', 'Use a specific template (button, card, default)')
    .option('--path <path>', 'Custom output directory')
    .option('--typescript', 'Generate TypeScript component (default)')
    .option('--no-typescript', 'Generate JavaScript component')
    .option('--story', 'Generate Storybook story')
    .option('--test', 'Generate test file')
    .action(async (name: string, options) => {
      const spinner = ora();
      
      try {
        // Detect framework
        const framework = await detectFramework();
        if (framework.type === 'unknown') {
          logger.error('No supported framework detected.');
          process.exit(1);
        }
        
        // Prepare component name
        const componentName = name.charAt(0).toUpperCase() + name.slice(1);
        const fileName = name.toLowerCase().replace(/\s+/g, '-');
        const fileExt = options.typescript !== false ? 'tsx' : 'jsx';
        
        // Get template
        const template = COMPONENT_TEMPLATES[options.template as keyof typeof COMPONENT_TEMPLATES] 
          || COMPONENT_TEMPLATES.default;
        const componentCode = template.replace(/{{NAME}}/g, componentName);
        
        // Determine output path
        const outputDir = options.path || join(framework.paths.components, 'ui');
        const componentPath = join(outputDir, `${fileName}.${fileExt}`);
        
        // Create component file
        spinner.start(`Creating ${componentName} component...`);
        const fileManager = new FileManager({ logger });
        await fileManager.writeFile(componentPath, componentCode);
        spinner.succeed(`Created component at ${componentPath}`);
        
        // Create story file if requested
        if (options.story) {
          const storyCode = `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './${fileName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'UI/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};`;
          
          const storyPath = join(outputDir, `${fileName}.stories.${fileExt}`);
          await fileManager.writeFile(storyPath, storyCode);
          logger.success(`Created story at ${storyPath}`);
        }
        
        // Create test file if requested
        if (options.test) {
          const testCode = `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${fileName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByRole('${name}')).toBeInTheDocument();
  });
});`;
          
          const testPath = join(outputDir, `${fileName}.test.${fileExt}`);
          await fileManager.writeFile(testPath, testCode);
          logger.success(`Created test at ${testPath}`);
        }
        
        // Show next steps
        logger.info('\n✨ Component created successfully!');
        logger.info('\n💡 Next steps:');
        logger.info(`  1. Import your component:`);
        logger.info(chalk.gray(`     import { ${componentName} } from '@/components/ui/${fileName}'`));
        logger.info(`  2. Customize the component in ${componentPath}`);
        if (options.story) {
          logger.info(`  3. View in Storybook: npm run storybook`);
        }
        
      } catch (error) {
        spinner.fail('Component creation failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}