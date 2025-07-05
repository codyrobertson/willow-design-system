/**
 * Interactive Prompts System for CLI
 */

import prompts from 'prompts';
import chalk from 'chalk';
import { Framework, UIKit, Style, ComponentMetadata } from '../types/cli.js';
import { CONFIG_PRESETS } from '../config/ConfigLoader.js';

export class InteractivePrompts {
  private cancelled = false;

  constructor() {
    // Handle user cancellation
    prompts.override(process.argv);
    process.on('SIGINT', () => {
      this.cancelled = true;
      process.exit(1);
    });
  }

  /**
   * Framework selection prompt
   */
  async selectFramework(initial?: Framework): Promise<Framework | null> {
    const response = await prompts({
      type: 'select',
      name: 'framework',
      message: 'Which framework are you using?',
      choices: [
        { title: 'React', value: 'react', description: 'React 18+' },
        { title: 'Vue', value: 'vue', description: 'Vue 3+' },
        { title: 'Angular', value: 'angular', description: 'Angular 14+' },
        { title: 'Svelte', value: 'svelte', description: 'SvelteKit' },
        { title: 'Solid', value: 'solid', description: 'SolidJS' },
      ],
      initial: initial ? ['react', 'vue', 'angular', 'svelte', 'solid'].indexOf(initial) : 0,
    });

    return this.cancelled ? null : response.framework;
  }

  /**
   * UI Kit selection prompt
   */
  async selectUIKit(framework: Framework, initial?: UIKit): Promise<UIKit | null> {
    const kitChoices = this.getUIKitChoices(framework);
    
    const response = await prompts({
      type: 'select',
      name: 'uiKit',
      message: 'Which UI kit would you like to use?',
      choices: kitChoices,
      initial: initial ? kitChoices.findIndex(c => c.value === initial) : 0,
    });

    return this.cancelled ? null : response.uiKit;
  }

  /**
   * Style system selection prompt
   */
  async selectStyle(uiKit: UIKit, initial?: Style): Promise<Style | null> {
    const styleChoices = this.getStyleChoices(uiKit);
    
    const response = await prompts({
      type: 'select',
      name: 'style',
      message: 'Which styling system would you like to use?',
      choices: styleChoices,
      initial: initial ? styleChoices.findIndex(c => c.value === initial) : 0,
    });

    return this.cancelled ? null : response.style;
  }

  /**
   * Component selection prompt
   */
  async selectComponents(
    available: ComponentMetadata[],
    installed: string[] = []
  ): Promise<string[] | null> {
    const choices = available.map(comp => ({
      title: comp.name,
      value: comp.name,
      description: comp.description,
      selected: installed.includes(comp.name),
    }));

    const response = await prompts({
      type: 'multiselect',
      name: 'components',
      message: 'Which components would you like to add?',
      choices,
      hint: '- Space to select. Return to submit',
      instructions: false,
      min: 1,
    });

    return this.cancelled ? null : response.components;
  }

  /**
   * Confirmation prompt
   */
  async confirm(message: string, initial = true): Promise<boolean> {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message,
      initial,
    });

    return response.confirmed || false;
  }

  /**
   * Text input prompt
   */
  async input(
    message: string,
    options: {
      initial?: string;
      validate?: (value: string) => boolean | string;
      format?: (value: string) => string;
    } = {}
  ): Promise<string | null> {
    const response = await prompts({
      type: 'text',
      name: 'value',
      message,
      initial: options.initial,
      validate: options.validate,
      format: options.format,
    });

    return this.cancelled ? null : response.value;
  }

  /**
   * Path input prompt
   */
  async inputPath(
    message: string,
    initial = './src/components'
  ): Promise<string | null> {
    return this.input(message, {
      initial,
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'Path cannot be empty';
        }
        return true;
      },
    });
  }

  /**
   * Preset selection prompt
   */
  async selectPreset(): Promise<string | null> {
    const presets = Object.entries(CONFIG_PRESETS).map(([key, preset]) => ({
      title: key,
      value: key,
      description: `${preset.framework} + ${preset.uiKit} + ${preset.style}`,
    }));

    const response = await prompts({
      type: 'select',
      name: 'preset',
      message: 'Would you like to use a preset configuration?',
      choices: [
        { title: 'Custom configuration', value: null, description: 'Configure manually' },
        ...presets,
      ],
    });

    return response.preset;
  }

  /**
   * Show installation summary
   */
  async showSummary(items: Array<{ label: string; value: string }>): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('\n' + chalk.bold('Configuration Summary:'));
    // eslint-disable-next-line no-console
    console.log('─'.repeat(50));
    
    items.forEach(({ label, value }) => {
      // eslint-disable-next-line no-console
      console.log(`  ${chalk.gray(label.padEnd(20))} ${chalk.cyan(value)}`);
    });
    
    // eslint-disable-next-line no-console
    console.log('─'.repeat(50) + '\n');

    return this.confirm('Is this correct?');
  }

  /**
   * Multi-step wizard
   */
  async wizard<T>(
    steps: Array<{
      message: string;
      type: 'select' | 'multiselect' | 'confirm' | 'text';
      name: string;
      choices?: any[];
      initial?: any;
      validate?: (value: any) => boolean | string;
    }>
  ): Promise<T | null> {
    const response = await prompts(steps);
    
    if (this.cancelled || Object.keys(response).length !== steps.length) {
      return null;
    }
    
    return response as T;
  }

  /**
   * Get UI kit choices based on framework
   */
  private getUIKitChoices(framework: Framework) {
    const allKits = [
      { title: 'shadcn/ui', value: 'shadcn', description: 'Radix UI + Tailwind CSS' },
      { title: 'Material UI', value: 'material', description: 'Material Design components' },
      { title: 'Bootstrap', value: 'bootstrap', description: 'Bootstrap components' },
      { title: 'Ant Design', value: 'antd', description: 'Enterprise design language' },
      { title: 'Chakra UI', value: 'chakra', description: 'Modular component library' },
      { title: 'Mantine', value: 'mantine', description: 'Full-featured components' },
    ];

    // Filter based on framework compatibility
    const compatibility: Record<Framework, string[]> = {
      react: ['shadcn', 'material', 'antd', 'chakra', 'mantine'],
      vue: ['material', 'antd'],
      angular: ['material', 'bootstrap'],
      svelte: ['shadcn'],
      solid: ['shadcn'],
    };

    const compatible = compatibility[framework] || [];
    return allKits.filter(kit => compatible.includes(kit.value));
  }

  /**
   * Get style choices based on UI kit
   */
  private getStyleChoices(uiKit: UIKit) {
    const allStyles = [
      { title: 'Tailwind CSS', value: 'tailwind', description: 'Utility-first CSS' },
      { title: 'CSS Modules', value: 'css-modules', description: 'Scoped CSS' },
      { title: 'Styled Components', value: 'styled-components', description: 'CSS-in-JS' },
      { title: 'Emotion', value: 'emotion', description: 'CSS-in-JS library' },
      { title: 'SCSS', value: 'scss', description: 'Sass preprocessor' },
    ];

    // Filter based on UI kit compatibility
    const compatibility: Record<UIKit, string[]> = {
      shadcn: ['tailwind'],
      material: ['css-modules', 'emotion', 'styled-components'],
      bootstrap: ['scss', 'css-modules'],
      antd: ['css-modules', 'tailwind'],
      chakra: ['emotion'],
      mantine: ['css-modules', 'emotion'],
    };

    const compatible = compatibility[uiKit] || allStyles.map(s => s.value);
    return allStyles.filter(style => compatible.includes(style.value));
  }
}

// Singleton instance
let instance: InteractivePrompts | null = null;

export function getPrompts(): InteractivePrompts {
  if (!instance) {
    instance = new InteractivePrompts();
  }
  return instance;
}