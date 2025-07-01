import type { PropertyMapping, ComponentMapping } from '../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../types/component-mapping.types';

/**
 * Deprecation warning level
 */
export enum DeprecationLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Deprecation information
 */
export interface DeprecationInfo {
  property: string;
  component: string;
  message: string;
  alternative?: string;
  level: DeprecationLevel;
  removalVersion?: string;
  migrationGuide?: string;
  sourceLocation: {
    file: string;
    line?: number;
    column?: number;
  };
}

/**
 * Deprecation usage statistics
 */
export interface DeprecationUsage {
  property: string;
  component: string;
  count: number;
  files: string[];
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * Deprecation report
 */
export interface DeprecationReport {
  totalDeprecations: number;
  deprecationsByLevel: Record<DeprecationLevel, number>;
  deprecationsByComponent: Record<string, DeprecationInfo[]>;
  mostUsedDeprecations: DeprecationUsage[];
  migrationSuggestions: string[];
}

/**
 * Configuration for deprecation handling
 */
export interface DeprecationConfig {
  enableTracking?: boolean;
  enableReporting?: boolean;
  failOnError?: boolean;
  outputFormat?: 'console' | 'json' | 'html' | 'markdown';
  outputFile?: string;
  includeStackTrace?: boolean;
  groupByComponent?: boolean;
}

/**
 * Migration suggestion
 */
export interface MigrationSuggestion {
  from: {
    component: string;
    property: string;
    value?: string;
  };
  to: {
    component: string;
    property: string;
    value?: string;
  };
  reason: string;
  automated: boolean;
  codeExample?: {
    before: string;
    after: string;
  };
}

/**
 * Handler for managing deprecated properties
 */
export class PropDeprecationHandler {
  private deprecations: Map<string, DeprecationInfo> = new Map();
  private usageStats: Map<string, DeprecationUsage> = new Map();
  private config: Required<DeprecationConfig>;

  constructor(config: DeprecationConfig = {}) {
    this.config = {
      enableTracking: true,
      enableReporting: true,
      failOnError: false,
      outputFormat: 'console',
      outputFile: '',
      includeStackTrace: false,
      groupByComponent: true,
      ...config,
    };
  }

  /**
   * Register a deprecated property
   */
  registerDeprecation(
    componentName: string,
    propertyMapping: PropertyMapping,
    context: ComponentMappingContext
  ): DeprecationInfo | null {
    if (!propertyMapping.deprecated) {
      return null;
    }

    const deprecationKey = `${componentName}.${propertyMapping.source}`;
    const sourceLocation = {
      file: context.sourceFile,
      line: context.line,
      column: context.column,
    };

    const deprecationInfo: DeprecationInfo = {
      property: propertyMapping.source,
      component: componentName,
      message: propertyMapping.deprecationMessage || `Property '${propertyMapping.source}' is deprecated`,
      alternative: propertyMapping.alternative,
      level: this.determineDeprecationLevel(propertyMapping),
      removalVersion: propertyMapping.removalVersion,
      migrationGuide: propertyMapping.migrationGuide,
      sourceLocation,
    };

    // Store deprecation info
    this.deprecations.set(deprecationKey, deprecationInfo);

    // Track usage statistics
    if (this.config.enableTracking) {
      this.trackUsage(deprecationKey, context.sourceFile);
    }

    return deprecationInfo;
  }

  /**
   * Register deprecated component
   */
  registerComponentDeprecation(
    componentMapping: ComponentMapping,
    context: ComponentMappingContext
  ): DeprecationInfo | null {
    if (!componentMapping.deprecated) {
      return null;
    }

    const deprecationKey = `${componentMapping.sourceComponent}.*`;
    const sourceLocation = {
      file: context.sourceFile,
      line: context.line,
      column: context.column,
    };

    const deprecationInfo: DeprecationInfo = {
      property: '*',
      component: componentMapping.sourceComponent,
      message: componentMapping.deprecationMessage || `Component '${componentMapping.sourceComponent}' is deprecated`,
      alternative: componentMapping.targetComponent,
      level: this.determineComponentDeprecationLevel(componentMapping),
      removalVersion: componentMapping.removalVersion,
      migrationGuide: componentMapping.migrationGuide,
      sourceLocation,
    };

    this.deprecations.set(deprecationKey, deprecationInfo);

    if (this.config.enableTracking) {
      this.trackUsage(deprecationKey, context.sourceFile);
    }

    return deprecationInfo;
  }

  /**
   * Get all deprecation warnings for a component
   */
  getDeprecationsForComponent(componentName: string): DeprecationInfo[] {
    const componentDeprecations: DeprecationInfo[] = [];
    
    for (const [key, deprecation] of this.deprecations) {
      if (deprecation.component === componentName) {
        componentDeprecations.push(deprecation);
      }
    }
    
    return componentDeprecations;
  }

  /**
   * Get deprecation for specific property
   */
  getDeprecationForProperty(
    componentName: string,
    propertyName: string
  ): DeprecationInfo | null {
    const key = `${componentName}.${propertyName}`;
    return this.deprecations.get(key) || null;
  }

  /**
   * Generate migration suggestions
   */
  generateMigrationSuggestions(
    componentName: string,
    propertyMapping: PropertyMapping
  ): MigrationSuggestion[] {
    const suggestions: MigrationSuggestion[] = [];

    if (!propertyMapping.deprecated || !propertyMapping.alternative) {
      return suggestions;
    }

    const suggestion: MigrationSuggestion = {
      from: {
        component: componentName,
        property: propertyMapping.source,
      },
      to: {
        component: componentName,
        property: propertyMapping.alternative,
      },
      reason: propertyMapping.deprecationMessage || 'Property is deprecated',
      automated: true,
      codeExample: {
        before: `<${componentName} ${propertyMapping.source}="value" />`,
        after: `<${componentName} ${propertyMapping.alternative}="value" />`,
      },
    };

    suggestions.push(suggestion);
    return suggestions;
  }

  /**
   * Generate comprehensive deprecation report
   */
  generateReport(): DeprecationReport {
    const deprecationsByLevel: Record<DeprecationLevel, number> = {
      [DeprecationLevel.INFO]: 0,
      [DeprecationLevel.WARNING]: 0,
      [DeprecationLevel.ERROR]: 0,
    };

    const deprecationsByComponent: Record<string, DeprecationInfo[]> = {};

    // Group deprecations by component and count by level
    for (const deprecation of this.deprecations.values()) {
      deprecationsByLevel[deprecation.level]++;
      
      if (!deprecationsByComponent[deprecation.component]) {
        deprecationsByComponent[deprecation.component] = [];
      }
      deprecationsByComponent[deprecation.component].push(deprecation);
    }

    // Get most used deprecations
    const mostUsedDeprecations = Array.from(this.usageStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate migration suggestions
    const migrationSuggestions = this.generateReportMigrationSuggestions();

    return {
      totalDeprecations: this.deprecations.size,
      deprecationsByLevel,
      deprecationsByComponent,
      mostUsedDeprecations,
      migrationSuggestions,
    };
  }

  /**
   * Output deprecation report in specified format
   */
  outputReport(report: DeprecationReport): string {
    switch (this.config.outputFormat) {
      case 'json':
        return this.formatAsJson(report);
      case 'html':
        return this.formatAsHtml(report);
      case 'markdown':
        return this.formatAsMarkdown(report);
      case 'console':
      default:
        return this.formatAsConsole(report);
    }
  }

  /**
   * Check if there are any error-level deprecations
   */
  hasErrors(): boolean {
    return Array.from(this.deprecations.values()).some(
      d => d.level === DeprecationLevel.ERROR
    );
  }

  /**
   * Clear all tracked deprecations and usage stats
   */
  clear(): void {
    this.deprecations.clear();
    this.usageStats.clear();
  }

  /**
   * Get usage statistics for a specific deprecation
   */
  getUsageStats(componentName: string, propertyName: string): DeprecationUsage | null {
    const key = `${componentName}.${propertyName}`;
    return this.usageStats.get(key) || null;
  }

  /**
   * Get all tracked usage statistics
   */
  getAllUsageStats(): DeprecationUsage[] {
    return Array.from(this.usageStats.values());
  }

  /**
   * Determine deprecation level based on property mapping
   */
  private determineDeprecationLevel(propertyMapping: PropertyMapping): DeprecationLevel {
    if (propertyMapping.removalVersion) {
      return DeprecationLevel.ERROR;
    }
    if (propertyMapping.alternative) {
      return DeprecationLevel.WARNING;
    }
    return DeprecationLevel.INFO;
  }

  /**
   * Determine component deprecation level
   */
  private determineComponentDeprecationLevel(componentMapping: ComponentMapping): DeprecationLevel {
    if (componentMapping.removalVersion) {
      return DeprecationLevel.ERROR;
    }
    if (componentMapping.targetComponent !== componentMapping.sourceComponent) {
      return DeprecationLevel.WARNING;
    }
    return DeprecationLevel.INFO;
  }

  /**
   * Track usage of deprecated property
   */
  private trackUsage(deprecationKey: string, sourceFile: string): void {
    const now = new Date();
    const existing = this.usageStats.get(deprecationKey);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
      if (!existing.files.includes(sourceFile)) {
        existing.files.push(sourceFile);
      }
    } else {
      const [component, property] = deprecationKey.split('.');
      this.usageStats.set(deprecationKey, {
        component,
        property,
        count: 1,
        files: [sourceFile],
        firstSeen: now,
        lastSeen: now,
      });
    }
  }

  /**
   * Generate migration suggestions for report
   */
  private generateReportMigrationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    for (const deprecation of this.deprecations.values()) {
      if (deprecation.alternative) {
        suggestions.push(
          `Replace '${deprecation.property}' with '${deprecation.alternative}' in ${deprecation.component}`
        );
      } else if (deprecation.migrationGuide) {
        suggestions.push(deprecation.migrationGuide);
      }
    }
    
    return suggestions;
  }

  /**
   * Format report as JSON
   */
  private formatAsJson(report: DeprecationReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Format report as HTML
   */
  private formatAsHtml(report: DeprecationReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Deprecation Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .error { color: #d32f2f; }
    .warning { color: #f57c00; }
    .info { color: #1976d2; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Deprecation Report</h1>
  <h2>Summary</h2>
  <p>Total Deprecations: ${report.totalDeprecations}</p>
  <ul>
    <li class="error">Errors: ${report.deprecationsByLevel.error}</li>
    <li class="warning">Warnings: ${report.deprecationsByLevel.warning}</li>
    <li class="info">Info: ${report.deprecationsByLevel.info}</li>
  </ul>
  
  <h2>Most Used Deprecated Properties</h2>
  <table>
    <tr><th>Component</th><th>Property</th><th>Usage Count</th><th>Files</th></tr>
    ${report.mostUsedDeprecations.map(usage => `
    <tr>
      <td>${usage.component}</td>
      <td>${usage.property}</td>
      <td>${usage.count}</td>
      <td>${usage.files.length}</td>
    </tr>
    `).join('')}
  </table>
  
  <h2>Migration Suggestions</h2>
  <ul>
    ${report.migrationSuggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
  </ul>
</body>
</html>
    `.trim();
  }

  /**
   * Format report as Markdown
   */
  private formatAsMarkdown(report: DeprecationReport): string {
    return `
# Deprecation Report

## Summary

- **Total Deprecations:** ${report.totalDeprecations}
- **Errors:** ${report.deprecationsByLevel.error}
- **Warnings:** ${report.deprecationsByLevel.warning}
- **Info:** ${report.deprecationsByLevel.info}

## Most Used Deprecated Properties

| Component | Property | Usage Count | Files |
|-----------|----------|-------------|-------|
${report.mostUsedDeprecations.map(usage => 
  `| ${usage.component} | ${usage.property} | ${usage.count} | ${usage.files.length} |`
).join('\n')}

## Migration Suggestions

${report.migrationSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}

## Deprecations by Component

${Object.entries(report.deprecationsByComponent).map(([component, deprecations]) => `
### ${component}

${deprecations.map(dep => `
- **${dep.property}** (${dep.level}): ${dep.message}
  ${dep.alternative ? `  - Alternative: \`${dep.alternative}\`` : ''}
  ${dep.removalVersion ? `  - Removal Version: ${dep.removalVersion}` : ''}
`).join('')}
`).join('')}
    `.trim();
  }

  /**
   * Format report as console output
   */
  private formatAsConsole(report: DeprecationReport): string {
    const lines: string[] = [];
    
    lines.push('📊 Deprecation Report');
    lines.push('==================');
    lines.push(`Total Deprecations: ${report.totalDeprecations}`);
    lines.push(`Errors: ${report.deprecationsByLevel.error}`);
    lines.push(`Warnings: ${report.deprecationsByLevel.warning}`);
    lines.push(`Info: ${report.deprecationsByLevel.info}`);
    lines.push('');
    
    if (report.mostUsedDeprecations.length > 0) {
      lines.push('🔥 Most Used Deprecated Properties:');
      for (const usage of report.mostUsedDeprecations.slice(0, 5)) {
        lines.push(`  ${usage.component}.${usage.property}: ${usage.count} usages in ${usage.files.length} files`);
      }
      lines.push('');
    }
    
    if (report.migrationSuggestions.length > 0) {
      lines.push('💡 Migration Suggestions:');
      for (const suggestion of report.migrationSuggestions.slice(0, 10)) {
        lines.push(`  - ${suggestion}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
}