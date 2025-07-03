/**
 * Component Error
 * For component-related operations and dependency issues
 */

import { BaseError } from './BaseError.js';
import { ErrorCode, ErrorContext } from '../types/errors.js';
import chalk from 'chalk';

export interface ComponentErrorDetails {
  componentName?: string;
  version?: string;
  requiredVersion?: string;
  dependencies?: string[];
  conflictingComponents?: Array<{
    name: string;
    version: string;
    requiredBy?: string;
  }>;
  circularDependency?: string[];
}

export class ComponentError extends BaseError {
  public readonly details: ComponentErrorDetails;

  constructor(
    message: string,
    code: ErrorCode,
    details: ComponentErrorDetails = {},
    options?: {
      cause?: Error;
      context?: ErrorContext;
    }
  ) {
    super(message, code, {
      ...options,
      context: {
        ...options?.context,
        component: details.componentName
      },
      metadata: details
    });

    this.details = details;
  }

  toUserMessage(): string {
    const parts: string[] = [
      chalk.red('✖ Component Error:'),
      this.message
    ];

    if (this.details.componentName) {
      parts.push(chalk.gray(`  Component: ${this.details.componentName}`));
    }

    if (this.details.version && this.details.requiredVersion) {
      parts.push(chalk.gray(`  Current version: ${this.details.version}`));
      parts.push(chalk.gray(`  Required version: ${this.details.requiredVersion}`));
    }

    if (this.details.dependencies?.length) {
      parts.push(chalk.yellow('\n  Missing dependencies:'));
      this.details.dependencies.forEach(dep => {
        parts.push(chalk.gray(`    • ${dep}`));
      });
    }

    if (this.details.conflictingComponents?.length) {
      parts.push(chalk.yellow('\n  Conflicting components:'));
      this.details.conflictingComponents.forEach(conflict => {
        const line = `    • ${conflict.name}@${conflict.version}`;
        if (conflict.requiredBy) {
          parts.push(chalk.gray(`${line} (required by ${conflict.requiredBy})`));
        } else {
          parts.push(chalk.gray(line));
        }
      });
    }

    if (this.details.circularDependency?.length) {
      parts.push(chalk.yellow('\n  Circular dependency detected:'));
      parts.push(chalk.gray(`    ${this.details.circularDependency.join(' → ')}`));
    }

    const suggestions = this.getSuggestedActions();
    if (suggestions.length > 0) {
      parts.push(chalk.cyan('\n  Suggestions:'));
      suggestions.forEach(suggestion => {
        parts.push(chalk.cyan(`    → ${suggestion}`));
      });
    }

    return parts.join('\n');
  }

  getSuggestedActions(): string[] {
    const suggestions: string[] = [];

    switch (this.code) {
      case ErrorCode.COMPONENT_NOT_FOUND:
        suggestions.push(`Run 'willow list' to see available components`);
        suggestions.push('Check the component name for typos');
        if (this.details.componentName?.includes('-')) {
          const camelCase = this.details.componentName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          suggestions.push(`Try '${camelCase}' instead`);
        }
        break;

      case ErrorCode.INCOMPATIBLE_VERSION:
        suggestions.push('Update the component to a compatible version');
        suggestions.push('Use --force flag to override version checks (not recommended)');
        break;

      case ErrorCode.DEPENDENCY_CONFLICT:
        suggestions.push('Try updating all related components together');
        suggestions.push('Use \'willow update --all\' to update all components');
        suggestions.push('Remove conflicting components and reinstall');
        break;

      case ErrorCode.CIRCULAR_DEPENDENCY:
        suggestions.push('This is likely a bug in the component registry');
        suggestions.push('Report this issue to the component maintainers');
        suggestions.push('Use --no-deps flag to skip dependency resolution');
        break;

      case ErrorCode.COMPONENT_ALREADY_EXISTS:
        suggestions.push('Use --overwrite flag to replace the existing component');
        suggestions.push('Use a different name for the component');
        break;
    }

    return suggestions;
  }

  static notFound(componentName: string): ComponentError {
    return new ComponentError(
      `Component '${componentName}' not found in registry`,
      ErrorCode.COMPONENT_NOT_FOUND,
      { componentName }
    );
  }

  static incompatibleVersion(
    componentName: string,
    currentVersion: string,
    requiredVersion: string
  ): ComponentError {
    return new ComponentError(
      `Component '${componentName}' version ${currentVersion} is incompatible with required version ${requiredVersion}`,
      ErrorCode.INCOMPATIBLE_VERSION,
      { componentName, version: currentVersion, requiredVersion }
    );
  }

  static dependencyConflict(
    componentName: string,
    conflicts: ComponentErrorDetails['conflictingComponents']
  ): ComponentError {
    return new ComponentError(
      `Component '${componentName}' has dependency conflicts`,
      ErrorCode.DEPENDENCY_CONFLICT,
      { componentName, conflictingComponents: conflicts }
    );
  }

  static circularDependency(cycle: string[]): ComponentError {
    return new ComponentError(
      `Circular dependency detected: ${cycle.join(' → ')}`,
      ErrorCode.CIRCULAR_DEPENDENCY,
      { circularDependency: cycle }
    );
  }

  static alreadyExists(componentName: string, path?: string): ComponentError {
    const message = path 
      ? `Component '${componentName}' already exists at ${path}`
      : `Component '${componentName}' already exists`;
    
    return new ComponentError(
      message,
      ErrorCode.COMPONENT_ALREADY_EXISTS,
      { componentName }
    );
  }
}