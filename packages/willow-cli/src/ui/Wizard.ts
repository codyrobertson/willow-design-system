/**
 * Interactive Wizard Component
 */

import { InteractivePrompts, getPrompts } from './InteractivePrompts.js';
import { Logger, getLogger } from './Logger.js';
import { ProgressReporter, getGlobalReporter } from './ProgressReporter.js';

export interface WizardStep<T = any> {
  id: string;
  title: string;
  description?: string;
  validate?: (value: T, context: WizardContext) => boolean | string;
  skip?: (context: WizardContext) => boolean;
  action: (context: WizardContext) => Promise<T>;
}

export interface WizardContext {
  data: Record<string, any>;
  currentStep: number;
  totalSteps: number;
  logger: Logger;
  prompts: InteractivePrompts;
  progress: ProgressReporter;
}

export interface WizardOptions {
  title: string;
  description?: string;
  steps: WizardStep[];
  onCancel?: () => void;
  showProgress?: boolean;
}

export class Wizard {
  private options: WizardOptions;
  private logger: Logger;
  private prompts: InteractivePrompts;
  private progress: ProgressReporter;
  private context: WizardContext;

  constructor(options: WizardOptions) {
    this.options = options;
    this.logger = getLogger();
    this.prompts = getPrompts();
    this.progress = getGlobalReporter();
    
    this.context = {
      data: {},
      currentStep: 0,
      totalSteps: options.steps.length,
      logger: this.logger,
      prompts: this.prompts,
      progress: this.progress,
    };
  }

  /**
   * Run the wizard
   */
  async run(): Promise<Record<string, any> | null> {
    // Show wizard header
    this.logger.section(this.options.title);
    if (this.options.description) {
      this.logger.info(this.options.description);
      this.logger.info('');
    }

    try {
      // Process each step
      for (let i = 0; i < this.options.steps.length; i++) {
        const step = this.options.steps[i];
        this.context.currentStep = i;

        // Check if step should be skipped
        if (step.skip && step.skip(this.context)) {
          continue;
        }

        // Show step info
        if (this.options.showProgress) {
          this.logger.info(`\nStep ${i + 1} of ${this.options.steps.length}: ${step.title}`);
        } else {
          this.logger.subsection(step.title);
        }

        if (step.description) {
          this.logger.info(step.description);
        }

        // Execute step
        let result: any;
        let isValid = false;

        while (!isValid) {
          try {
            result = await step.action(this.context);
            
            // Validate result
            if (step.validate) {
              const validation = step.validate(result, this.context);
              if (validation === true) {
                isValid = true;
              } else if (typeof validation === 'string') {
                this.logger.error(validation);
              } else {
                isValid = true; // No validation or false means skip
              }
            } else {
              isValid = true;
            }
          } catch (error) {
            // Handle cancellation
            if (error && (error as any).message === 'User cancelled') {
              if (this.options.onCancel) {
                this.options.onCancel();
              }
              return null;
            }
            throw error;
          }
        }

        // Store result
        this.context.data[step.id] = result;
      }

      return this.context.data;
    } catch (error) {
      this.logger.error('Wizard failed:', error);
      throw error;
    }
  }

  /**
   * Create a confirmation step
   */
  static createConfirmationStep(
    id: string,
    getMessage: (context: WizardContext) => string
  ): WizardStep<boolean> {
    return {
      id,
      title: 'Confirm Settings',
      action: async (context) => {
        const message = getMessage(context);
        return context.prompts.confirm(message, true);
      },
    };
  }

  /**
   * Create a summary step
   */
  static createSummaryStep(
    id: string,
    getSummary: (context: WizardContext) => Array<{ label: string; value: string }>
  ): WizardStep<boolean> {
    return {
      id,
      title: 'Review Configuration',
      action: async (context) => {
        const summary = getSummary(context);
        return context.prompts.showSummary(summary);
      },
    };
  }
}

/**
 * Built-in wizard presets
 */
export class WizardPresets {
  /**
   * Create a project setup wizard
   */
  static createProjectSetup(): Wizard {
    return new Wizard({
      title: 'Project Setup Wizard',
      description: 'Let\'s configure your project step by step',
      showProgress: true,
      steps: [
        {
          id: 'projectName',
          title: 'Project Name',
          description: 'What is the name of your project?',
          action: async (context) => {
            return context.prompts.input(
              'Project name:',
              'my-app'
            );
          },
          validate: (value) => {
            if (!value || value.trim().length === 0) {
              return 'Project name is required';
            }
            if (!/^[a-z0-9-]+$/.test(value)) {
              return 'Project name must contain only lowercase letters, numbers, and hyphens';
            }
            return true;
          },
        },
        {
          id: 'framework',
          title: 'Select Framework',
          description: 'Which framework are you using?',
          action: async (context) => {
            return context.prompts.selectFramework();
          },
        },
        {
          id: 'features',
          title: 'Select Features',
          description: 'Which features would you like to enable?',
          action: async (context) => {
            return context.prompts.multiSelect(
              'Select features:',
              [
                { value: 'typescript', label: 'TypeScript' },
                { value: 'testing', label: 'Testing (Jest/Vitest)' },
                { value: 'linting', label: 'ESLint + Prettier' },
                { value: 'git', label: 'Git hooks' },
              ]
            );
          },
        },
        Wizard.createSummaryStep('summary', (context) => [
          { label: 'Project', value: context.data.projectName },
          { label: 'Framework', value: context.data.framework },
          { label: 'Features', value: context.data.features.join(', ') },
        ]),
      ],
    });
  }

  /**
   * Create a component installation wizard
   */
  static createComponentInstall(): Wizard {
    return new Wizard({
      title: 'Component Installation',
      description: 'Install and configure components',
      steps: [
        {
          id: 'components',
          title: 'Select Components',
          action: async (context) => {
            // TODO: Load available components
            const components = [
              { value: 'button', label: 'Button' },
              { value: 'input', label: 'Input' },
              { value: 'select', label: 'Select' },
              { value: 'checkbox', label: 'Checkbox' },
            ];
            
            return context.prompts.multiSelect(
              'Select components to install:',
              components
            );
          },
        },
        {
          id: 'path',
          title: 'Installation Path',
          action: async (context) => {
            return context.prompts.inputPath(
              'Where should components be installed?',
              'src/components'
            );
          },
        },
        {
          id: 'options',
          title: 'Installation Options',
          action: async (context) => {
            const options = await context.prompts.multiSelect(
              'Select options:',
              [
                { value: 'overwrite', label: 'Overwrite existing files' },
                { value: 'examples', label: 'Include example usage' },
                { value: 'tests', label: 'Include test files' },
              ]
            );
            
            return {
              overwrite: options.includes('overwrite'),
              examples: options.includes('examples'),
              tests: options.includes('tests'),
            };
          },
        },
        Wizard.createConfirmationStep('confirm', (context) => 
          `Install ${context.data.components.length} components to ${context.data.path}?`
        ),
      ],
    });
  }
}