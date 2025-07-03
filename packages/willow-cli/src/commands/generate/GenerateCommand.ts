/**
 * Generate Command Implementation
 */

import { Command } from 'commander';
import { 
  GenerateOptions,
  GenerateOptionsSchema,
  GenerateType,
  CommandResult,
  CLIError,
  CLIErrorCode 
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { argumentParser } from '../../core/ArgumentParser.js';
import { configManager } from '../../config/index.js';
import { promises as fs } from 'fs';
import path from 'path';

export class GenerateCommand {
  static command = 'generate <type> <name>';
  static description = 'Generate component scaffolding';

  static builder(cmd: Command): void {
    cmd
      .option('--template <name>', 'use specific template')
      .option('--typescript', 'generate TypeScript (default)')
      .option('--test', 'include test files')
      .option('--story', 'include Storybook story')
      .option('-f, --force', 'overwrite existing files')
      .addHelpText('after', `
Types:
  component            Generate a new component
  hook                 Generate a new React hook
  utility              Generate a utility function
  adapter              Generate a UI kit adapter
      `);
  }

  static async action(
    context: CommandContext,
    type: GenerateType,
    name: string,
    options: GenerateOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;

    // Validate options
    const validatedOptions = argumentParser.parse(
      options,
      GenerateOptionsSchema,
      'generate options'
    );

    try {
      progress.start(`Generating ${type} "${name}"...`);

      // Validate type
      const validTypes = ['component', 'hook', 'utility', 'adapter'];
      if (!validTypes.includes(type)) {
        throw new CLIError(
          CLIErrorCode.INVALID_ARGUMENTS,
          `Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`
        );
      }

      // Load configuration
      const config = configManager.get();
      
      // Generate based on type
      switch (type) {
        case 'component':
          await this.generateComponent(context, name, validatedOptions, config);
          break;
        case 'hook':
          await this.generateHook(context, name, validatedOptions, config);
          break;
        case 'utility':
          await this.generateUtility(context, name, validatedOptions, config);
          break;
        case 'adapter':
          await this.generateAdapter(context, name, validatedOptions, config);
          break;
      }

      progress.succeed(`${type} "${name}" generated successfully!`);

      return {
        success: true,
        data: { type, name },
      };
    } catch (error) {
      progress.fail('Generation failed');
      
      if (error instanceof CLIError) {
        throw error;
      }
      
      throw new CLIError(
        CLIErrorCode.UNKNOWN_ERROR,
        'Generation failed',
        error
      );
    }
  }

  private static async generateComponent(
    context: CommandContext,
    name: string,
    options: GenerateOptions,
    config: any
  ): Promise<void> {
    const { logger } = context;
    const componentDir = path.join(config.paths.components, name);
    const isTypescript = options.typescript !== false && config.typescript;
    const ext = isTypescript ? 'tsx' : 'jsx';

    // Create component directory
    await fs.mkdir(componentDir, { recursive: true });

    // Generate component file
    const componentFile = path.join(componentDir, `${name}.${ext}`);
    const componentContent = this.getComponentTemplate(name, config, options);
    
    if (!options.force) {
      try {
        await fs.access(componentFile);
        throw new CLIError(
          CLIErrorCode.FILE_EXISTS,
          `Component ${name} already exists. Use --force to overwrite.`
        );
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    
    await fs.writeFile(componentFile, componentContent);
    logger.success(`Created: ${componentFile}`);

    // Generate index file
    const indexFile = path.join(componentDir, `index.${isTypescript ? 'ts' : 'js'}`);
    const indexContent = `export { default } from './${name}';
export * from './${name}';
`;
    await fs.writeFile(indexFile, indexContent);
    logger.success(`Created: ${indexFile}`);

    // Generate test file if requested
    if (options.test) {
      const testFile = path.join(componentDir, `${name}.test.${ext}`);
      const testContent = this.getTestTemplate(name, config);
      await fs.writeFile(testFile, testContent);
      logger.success(`Created: ${testFile}`);
    }

    // Generate Storybook story if requested
    if (options.story) {
      const storyFile = path.join(componentDir, `${name}.stories.${ext}`);
      const storyContent = this.getStoryTemplate(name, config);
      await fs.writeFile(storyFile, storyContent);
      logger.success(`Created: ${storyFile}`);
    }

    // Generate styles file
    if (config.style === 'css-modules') {
      const styleFile = path.join(componentDir, `${name}.module.css`);
      const styleContent = `.${name.toLowerCase()} {\n  /* Add your styles here */\n}\n`;
      await fs.writeFile(styleFile, styleContent);
      logger.success(`Created: ${styleFile}`);
    }
  }

  private static async generateHook(
    context: CommandContext,
    name: string,
    options: GenerateOptions,
    config: any
  ): Promise<void> {
    const { logger } = context;
    const hooksDir = path.join(config.paths.utils, 'hooks');
    const isTypescript = options.typescript !== false && config.typescript;
    const ext = isTypescript ? 'ts' : 'js';

    await fs.mkdir(hooksDir, { recursive: true });

    const hookFile = path.join(hooksDir, `${name}.${ext}`);
    const hookContent = this.getHookTemplate(name, config, isTypescript);
    
    await fs.writeFile(hookFile, hookContent);
    logger.success(`Created: ${hookFile}`);

    if (options.test) {
      const testFile = path.join(hooksDir, `${name}.test.${ext}`);
      const testContent = this.getHookTestTemplate(name, config, isTypescript);
      await fs.writeFile(testFile, testContent);
      logger.success(`Created: ${testFile}`);
    }
  }

  private static async generateUtility(
    context: CommandContext,
    name: string,
    options: GenerateOptions,
    config: any
  ): Promise<void> {
    const { logger } = context;
    const utilsDir = config.paths.utils;
    const isTypescript = options.typescript !== false && config.typescript;
    const ext = isTypescript ? 'ts' : 'js';

    await fs.mkdir(utilsDir, { recursive: true });

    const utilFile = path.join(utilsDir, `${name}.${ext}`);
    const utilContent = this.getUtilityTemplate(name, isTypescript);
    
    await fs.writeFile(utilFile, utilContent);
    logger.success(`Created: ${utilFile}`);

    if (options.test) {
      const testFile = path.join(utilsDir, `${name}.test.${ext}`);
      const testContent = this.getUtilityTestTemplate(name, isTypescript);
      await fs.writeFile(testFile, testContent);
      logger.success(`Created: ${testFile}`);
    }
  }

  private static async generateAdapter(
    context: CommandContext,
    name: string,
    options: GenerateOptions,
    config: any
  ): Promise<void> {
    const { logger } = context;
    const adaptersDir = path.join('src', 'adapters');
    const adapterDir = path.join(adaptersDir, name.toLowerCase());

    await fs.mkdir(adapterDir, { recursive: true });

    const adapterFile = path.join(adapterDir, `${name}Adapter.ts`);
    const adapterContent = this.getAdapterTemplate(name);
    
    await fs.writeFile(adapterFile, adapterContent);
    logger.success(`Created: ${adapterFile}`);

    // Create adapter test
    const testFile = path.join(adapterDir, `${name}Adapter.test.ts`);
    const testContent = this.getAdapterTestTemplate(name);
    await fs.writeFile(testFile, testContent);
    logger.success(`Created: ${testFile}`);

    // Create index file
    const indexFile = path.join(adapterDir, 'index.ts');
    const indexContent = `export { ${name}Adapter } from './${name}Adapter';\n`;
    await fs.writeFile(indexFile, indexContent);
    logger.success(`Created: ${indexFile}`);
  }

  private static getComponentTemplate(name: string, config: any, options: any): string {
    const isTypescript = options.typescript !== false && config.typescript;
    
    if (config.framework === 'react') {
      return `import React${isTypescript ? ', { FC }' : ''} from 'react';
${config.style === 'css-modules' ? `import styles from './${name}.module.css';\n` : ''}
${isTypescript ? `
export interface ${name}Props {
  children?: React.ReactNode;
  className?: string;
}
` : ''}
${isTypescript ? `const ${name}: FC<${name}Props>` : `const ${name}`} = ({ children, className${isTypescript ? '' : ' = \'\''}${isTypescript ? '' : ', ...props'} }) => {
  return (
    <div className={${config.style === 'css-modules' ? '`${styles.' + name.toLowerCase() + '} ${className}`' : 'className'}}${isTypescript ? '' : ' {...props}'}>
      {children}
    </div>
  );
};

export default ${name};
`;
    } else if (config.framework === 'vue') {
      return `<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script${isTypescript ? ' lang="ts"' : ''}>
${isTypescript ? 'import { defineComponent, computed } from \'vue\';\n\n' : ''}export default ${isTypescript ? 'defineComponent(' : ''}{
  name: '${name}',
  props: {
    className: {
      type: String,
      default: ''
    }
  },
  ${isTypescript ? 'setup(props) {' : 'computed: {'}
    ${isTypescript ? 'const classes = computed(() => props.className);\n    return { classes };' : 'classes() {\n      return this.className;\n    }'}
  }
}${isTypescript ? ')' : ''};
</script>
${config.style === 'css-modules' ? `\n<style module>\n.${name.toLowerCase()} {\n  /* Add your styles here */\n}\n</style>` : ''}
`;
    } else {
      // Angular
      return `import { Component${isTypescript ? ', Input' : ''} } from '@angular/core';

@Component({
  selector: 'app-${name.toLowerCase()}',
  template: \`
    <div [class]="className">
      <ng-content></ng-content>
    </div>
  \`,
  ${config.style === 'css-modules' ? `styleUrls: ['./${name}.component.css']` : 'styles: []'}
})
export class ${name}Component {
  ${isTypescript ? '@Input() ' : ''}className${isTypescript ? ': string' : ''} = '';
}
`;
    }
  }

  private static getTestTemplate(name: string, config: any): string {
    if (config.framework === 'react') {
      return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

describe('${name}', () => {
  it('renders children', () => {
    render(<${name}>Test Content</${name}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<${name} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
`;
    } else if (config.framework === 'vue') {
      return `import { mount } from '@vue/test-utils';
import ${name} from './${name}.vue';

describe('${name}', () => {
  it('renders slot content', () => {
    const wrapper = mount(${name}, {
      slots: {
        default: 'Test Content'
      }
    });
    expect(wrapper.text()).toContain('Test Content');
  });

  it('applies custom className', () => {
    const wrapper = mount(${name}, {
      props: {
        className: 'custom-class'
      }
    });
    expect(wrapper.classes()).toContain('custom-class');
  });
});
`;
    } else {
      return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${name}Component } from './${name}.component';

describe('${name}Component', () => {
  let component: ${name}Component;
  let fixture: ComponentFixture<${name}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ${name}Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(${name}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply custom className', () => {
    component.className = 'custom-class';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('div')?.classList).toContain('custom-class');
  });
});
`;
    }
  }

  private static getStoryTemplate(name: string, config: any): string {
    if (config.framework === 'react') {
      return `import type { Meta, StoryObj } from '@storybook/react';
import ${name} from './${name}';

const meta = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof ${name}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default ${name}',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: 'Custom styled ${name}',
    className: 'custom-class',
  },
};
`;
    } else {
      return `// Add Storybook story for ${config.framework}\n`;
    }
  }

  private static getHookTemplate(name: string, config: any, isTypescript: boolean): string {
    const functionName = name.startsWith('use') ? name : `use${name.charAt(0).toUpperCase() + name.slice(1)}`;
    
    if (config.framework === 'react') {
      return `import { useState, useEffect${isTypescript ? ', useCallback' : ''} } from 'react';

${isTypescript ? `export interface ${functionName}Options {
  // Add your options here
}

export interface ${functionName}Result {
  // Add your return type here
}

` : ''}export function ${functionName}(${isTypescript ? 'options?: ' + functionName + 'Options' : 'options = {}' })${isTypescript ? ': ' + functionName + 'Result' : ''} {
  const [state, setState] = useState${isTypescript ? '<any>' : ''}(null);

  useEffect(() => {
    // Add your effect logic here
  }, []);

  return ${isTypescript ? '{ state }' : 'state'};
}
`;
    } else if (config.framework === 'vue') {
      return `import { ref, computed${isTypescript ? ', Ref, ComputedRef' : ''} } from 'vue';

${isTypescript ? `export interface ${functionName}Options {
  // Add your options here
}

export interface ${functionName}Result {
  // Add your return type here
}

` : ''}export function ${functionName}(${isTypescript ? 'options?: ' + functionName + 'Options' : 'options = {}' })${isTypescript ? ': ' + functionName + 'Result' : ''} {
  const state = ref${isTypescript ? '<any>' : ''}(null);

  // Add your composable logic here

  return {
    state${isTypescript ? ': state.value' : ''}
  };
}
`;
    } else {
      return `// Angular service or custom hook implementation\n`;
    }
  }

  private static getHookTestTemplate(name: string, config: any, isTypescript: boolean): string {
    const functionName = name.startsWith('use') ? name : `use${name.charAt(0).toUpperCase() + name.slice(1)}`;
    
    if (config.framework === 'react') {
      return `import { renderHook${isTypescript ? ', act' : ''} } from '@testing-library/react';
import { ${functionName} } from './${name}';

describe('${functionName}', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => ${functionName}());
    expect(result.current${isTypescript ? '.state' : ''}).toBe(null);
  });

  // Add more tests here
});
`;
    } else {
      return `// Add tests for ${functionName}\n`;
    }
  }

  private static getUtilityTemplate(name: string, isTypescript: boolean): string {
    return `${isTypescript ? '/**\n * ' + name + ' utility function\n */\n' : ''}export function ${name}(${isTypescript ? 'input: any' : 'input'})${isTypescript ? ': any' : ''} {
  // Add your utility logic here
  return input;
}

// Add more utility functions as needed
`;
  }

  private static getUtilityTestTemplate(name: string, isTypescript: boolean): string {
    return `import { ${name} } from './${name}';

describe('${name}', () => {
  it('should work correctly', () => {
    const input = 'test';
    const result = ${name}(input);
    expect(result).toBe(input);
  });

  // Add more tests here
});
`;
  }

  private static getAdapterTemplate(name: string): string {
    return `import { UIKitAdapter } from '@willow/types';
import {
  ComponentAST,
  TransformResult,
  GenerateResult,
  ParseOptions,
  TransformOptions,
  GenerateOptions,
} from '@willow/types';

export class ${name}Adapter implements UIKitAdapter {
  name = '${name.toLowerCase()}';
  version = '1.0.0';
  supportedFrameworks = ['react', 'vue', 'angular'] as const;

  async parse(source: string, options: ParseOptions): Promise<ComponentAST> {
    // Implement parsing logic
    throw new Error('Not implemented');
  }

  async transform(ast: ComponentAST, options: TransformOptions): Promise<TransformResult> {
    // Implement transformation logic
    throw new Error('Not implemented');
  }

  async generate(ast: ComponentAST, options: GenerateOptions): Promise<GenerateResult> {
    // Implement generation logic
    throw new Error('Not implemented');
  }

  async validate(ast: ComponentAST): Promise<boolean> {
    // Implement validation logic
    return true;
  }
}
`;
  }

  private static getAdapterTestTemplate(name: string): string {
    return `import { ${name}Adapter } from './${name}Adapter';

describe('${name}Adapter', () => {
  let adapter: ${name}Adapter;

  beforeEach(() => {
    adapter = new ${name}Adapter();
  });

  it('should have correct metadata', () => {
    expect(adapter.name).toBe('${name.toLowerCase()}');
    expect(adapter.version).toBe('1.0.0');
    expect(adapter.supportedFrameworks).toContain('react');
  });

  // Add more tests here
});
`;
  }
}