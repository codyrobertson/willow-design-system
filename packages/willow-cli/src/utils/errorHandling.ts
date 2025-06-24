import chalk from 'chalk';
import type { ProjectType } from '../types/index.js';

export interface WillowError extends Error {
  code?: string;
  context?: Record<string, unknown>;
  suggestions?: string[];
}

export class WillowCliError extends Error implements WillowError {
  public code?: string;
  public context?: Record<string, unknown>;
  public suggestions?: string[];
  
  constructor(
    message: string, 
    options: { 
      code?: string; 
      context?: Record<string, unknown>; 
      suggestions?: string[] 
    } = {}
  ) {
    super(message);
    this.name = 'WillowCliError';
    this.code = options.code;
    this.context = options.context;
    this.suggestions = options.suggestions;
  }
}

/**
 * Enhanced error handling with user-friendly messages and recovery suggestions
 */
export function handleError(error: unknown, context?: string): void {
  console.log(); // Add some space
  
  if (error instanceof WillowCliError) {
    console.error(chalk.red(`❌ ${context ? `${context}: ` : ''}${error.message}`));
    
    if (error.code) {
      console.error(chalk.gray(`   Error Code: ${error.code}`));
    }
    
    if (error.context) {
      console.error(chalk.gray(`   Context: ${JSON.stringify(error.context, null, 2)}`));
    }
    
    if (error.suggestions && error.suggestions.length > 0) {
      console.log(chalk.yellow('\n💡 Suggestions:'));
      error.suggestions.forEach((suggestion, index) => {
        console.log(chalk.yellow(`   ${index + 1}. ${suggestion}`));
      });
    }
  } else if (error instanceof Error) {
    console.error(chalk.red(`❌ ${context ? `${context}: ` : ''}${error.message}`));
    
    // Provide context-specific suggestions
    if (context) {
      const suggestions = getContextualSuggestions(error.message, context);
      if (suggestions.length > 0) {
        console.log(chalk.yellow('\n💡 Suggestions:'));
        suggestions.forEach((suggestion, index) => {
          console.log(chalk.yellow(`   ${index + 1}. ${suggestion}`));
        });
      }
    }
  } else {
    console.error(chalk.red(`❌ ${context ? `${context}: ` : ''}Unknown error occurred`));
    console.error(chalk.gray('   Details:'), error);
  }
  
  console.log(chalk.gray('\n🔗 For more help: https://github.com/your-org/willow-cli/issues'));
}

/**
 * Get contextual suggestions based on error message and context
 */
function getContextualSuggestions(errorMessage: string, context: string): string[] {
  const suggestions: string[] = [];
  const lowerError = errorMessage.toLowerCase();
  const lowerContext = context.toLowerCase();
  
  // File system errors
  if (lowerError.includes('permission') || lowerError.includes('eacces')) {
    suggestions.push('Try running with sudo (Linux/Mac) or as Administrator (Windows)');
    suggestions.push('Check file/directory permissions');
  }
  
  if (lowerError.includes('enoent') || lowerError.includes('not found')) {
    suggestions.push('Ensure you are in the correct project directory');
    suggestions.push('Check if the file path exists');
  }
  
  if (lowerError.includes('eexist') || lowerError.includes('already exists')) {
    suggestions.push('Use --force flag to overwrite existing files');
    suggestions.push('Remove existing files manually first');
  }
  
  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    suggestions.push('Check your internet connection');
    suggestions.push('Try again in a few moments');
    suggestions.push('Verify proxy settings if behind a corporate firewall');
  }
  
  // Package manager errors
  if (lowerContext.includes('install') && (lowerError.includes('npm') || lowerError.includes('package'))) {
    suggestions.push('Clear npm cache: npm cache clean --force');
    suggestions.push('Delete node_modules and package-lock.json, then run npm install');
    suggestions.push('Try using a different package manager (yarn, pnpm)');
  }
  
  // Project structure errors
  if (lowerContext.includes('init') || lowerContext.includes('setup')) {
    suggestions.push('Make sure you are in a valid React project directory');
    suggestions.push('Run "npm init" or "npx create-react-app" first');
    suggestions.push('Check that package.json exists');
  }
  
  // TypeScript errors
  if (lowerError.includes('typescript') || lowerError.includes('.ts')) {
    suggestions.push('Install TypeScript: npm install -D typescript');
    suggestions.push('Check tsconfig.json configuration');
    suggestions.push('Use JavaScript files instead (.js) if TypeScript is not needed');
  }
  
  // Tailwind errors
  if (lowerError.includes('tailwind')) {
    suggestions.push('Install Tailwind CSS: npm install -D tailwindcss');
    suggestions.push('Check tailwind.config.js configuration');
    suggestions.push('Ensure CSS imports are correct');
  }
  
  return suggestions;
}

/**
 * Graceful error handling for individual operations
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorContext: string,
  options: {
    fallback?: T;
    retries?: number;
    logWarning?: boolean;
  } = {}
): Promise<T | undefined> {
  const { fallback, retries = 0, logWarning = true } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries) {
        if (logWarning) {
          console.warn(chalk.yellow(`⚠️ ${errorContext} failed after ${retries + 1} attempts`));
          if (error instanceof Error) {
            console.warn(chalk.gray(`   Error: ${error.message}`));
          }
        }
        
        if (fallback !== undefined) {
          console.log(chalk.blue(`   Using fallback value`));
          return fallback;
        }
        
        throw error;
      } else {
        console.log(chalk.yellow(`   Retrying ${errorContext} (attempt ${attempt + 2}/${retries + 1})...`));
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

/**
 * Validate and recover from common project issues
 */
export async function validateAndRecover(projectType: ProjectType): Promise<{
  valid: boolean;
  recoverable: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  let recoverable = true;
  
  try {
    // Check critical dependencies
    const { fileExists, readFileContent } = await import('./fileSystem.js');
    
    if (!(await fileExists('package.json'))) {
      issues.push('Missing package.json');
      recoverable = false;
      return { valid: false, recoverable, issues };
    }
    
    const pkg = JSON.parse(await readFileContent('package.json'));
    
    // Check React
    if (!pkg.dependencies?.react && !pkg.devDependencies?.react) {
      issues.push('React not found in dependencies');
    }
    
    // Check if node_modules exists
    if (!(await fileExists('node_modules'))) {
      issues.push('node_modules directory missing - run npm install');
    }
    
    // Check TypeScript if project claims to use it
    if (projectType.hasTypeScript && !(await fileExists('tsconfig.json'))) {
      issues.push('TypeScript configuration missing');
    }
    
  } catch (error) {
    issues.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    recoverable = false;
  }
  
  return {
    valid: issues.length === 0,
    recoverable,
    issues,
  };
}

/**
 * Progress tracking with error recovery
 */
export class ProgressTracker {
  private steps: { name: string; completed: boolean; error?: Error }[] = [];
  private currentStep = 0;
  
  addStep(name: string): void {
    this.steps.push({ name, completed: false });
  }
  
  async executeStep<T>(stepName: string, operation: () => Promise<T>): Promise<T> {
    const stepIndex = this.steps.findIndex(step => step.name === stepName);
    
    if (stepIndex === -1) {
      throw new WillowCliError(`Step "${stepName}" not found in progress tracker`);
    }
    
    this.currentStep = stepIndex;
    console.log(chalk.blue(`⏳ ${stepName}...`));
    
    try {
      const result = await operation();
      this.steps[stepIndex].completed = true;
      console.log(chalk.green(`✅ ${stepName}`));
      return result;
    } catch (error) {
      this.steps[stepIndex].error = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red(`❌ ${stepName} failed`));
      throw error;
    }
  }
  
  getProgress(): { completed: number; total: number; failed: number } {
    const completed = this.steps.filter(step => step.completed).length;
    const failed = this.steps.filter(step => step.error).length;
    return { completed, total: this.steps.length, failed };
  }
  
  summarize(): void {
    const { completed, total, failed } = this.getProgress();
    
    console.log(chalk.blue('\n📊 Progress Summary:'));
    console.log(chalk.green(`   ✅ Completed: ${completed}/${total}`));
    
    if (failed > 0) {
      console.log(chalk.red(`   ❌ Failed: ${failed}`));
      
      console.log(chalk.yellow('\n⚠️ Failed Steps:'));
      this.steps
        .filter(step => step.error)
        .forEach(step => {
          console.log(chalk.red(`   • ${step.name}: ${step.error?.message}`));
        });
    }
    
    if (completed === total) {
      console.log(chalk.green('\n🎉 All steps completed successfully!'));
    } else if (completed > 0) {
      console.log(chalk.yellow('\n⚠️ Partial completion - some steps may need manual intervention'));
    }
  }
}