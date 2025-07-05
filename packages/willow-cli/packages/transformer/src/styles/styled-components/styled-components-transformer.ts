import { BaseStyleTransformer } from '../base-style-transformer';
import { StyledComponentsParser } from './styled-components-parser';
import { PropertyRenamerFactory } from '../property-renaming/property-renamer';
import {
  StyleTransformationContext,
  StyleTransformationResult,
  StyledComponentResult,
  TransformationOptions,
  NamingConvention,
} from '../../types/style-transformation.types';

export interface StyledComponentsTransformOptions extends TransformationOptions {
  targetFramework?: 'css-modules' | 'tailwind' | 'emotion' | 'css-in-js';
  preserveDynamicStyles?: boolean;
  extractTheme?: boolean;
  generateTypeDefinitions?: boolean;
  cssModulesPrefix?: string;
  tailwindConfig?: Record<string, any>;
}

/**
 * Transformer for styled-components
 */
export class StyledComponentsTransformer extends BaseStyleTransformer {
  private parser: StyledComponentsParser;
  private propertyRenamer;

  constructor(private options: StyledComponentsTransformOptions = {}) {
    super();
    this.parser = new StyledComponentsParser();
    this.propertyRenamer = PropertyRenamerFactory.createForFramework('react');
  }

  getName(): string {
    return 'styled-components';
  }

  canTransform(code: string, filePath?: string): boolean {
    return (
      code.includes('styled.') ||
      code.includes('styled(') ||
      code.includes('css`') ||
      code.includes('createGlobalStyle') ||
      code.includes('keyframes') ||
      (filePath?.endsWith('.styled.js') ?? false) ||
      (filePath?.endsWith('.styled.ts') ?? false)
    );
  }

  async transform(
    code: string,
    context?: StyleTransformationContext
  ): Promise<any> {
    const analysis = this.parser.parseStyledComponent(code);
    const warnings: string[] = [];
    const changes: any[] = [];
    const additionalFiles: any[] = [];

    let transformedCode = code;

    switch (this.options.targetFramework) {
      case 'css-modules':
        const cssResult = await this.transformToCssModules(analysis, code, context);
        transformedCode = cssResult.code;
        if (cssResult.additionalFiles) {
          additionalFiles.push(...cssResult.additionalFiles);
        }
        break;
      case 'tailwind':
        transformedCode = await this.transformToTailwind(analysis, code, context);
        break;
      case 'emotion':
        transformedCode = await this.transformToEmotion(analysis, code, context);
        break;
      case 'css-in-js':
        transformedCode = await this.transformToCssInJs(analysis, code, context);
        break;
      default:
        transformedCode = await this.optimizeStyledComponents(analysis, code, context);
    }

    // Extract theme if requested
    const theme = this.options.extractTheme
      ? this.extractThemeDefinition(analysis, code)
      : undefined;

    // Generate type definitions if requested
    const typeDefinitions = this.options.generateTypeDefinitions
      ? this.generateTypeDefinitions(analysis)
      : undefined;

    return {
      transformed: transformedCode,
      framework: this.options.targetFramework || 'styled-components',
      changes,
      warnings,
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
      metadata: {
        componentsTransformed: analysis.components.length,
        themeUsages: analysis.themeUsages,
        propUsages: analysis.propUsages,
        hasGlobalStyles: analysis.hasGlobalStyles,
        hasKeyframes: analysis.hasKeyframes,
        theme,
        typeDefinitions,
      },
    };
  }

  /**
   * Transform to CSS Modules
   */
  private async transformToCssModules(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<{ code: string; additionalFiles?: any[] }> {
    let transformedCode = code;
    const cssModules: Record<string, string> = {};
    const prefix = this.options.cssModulesPrefix || '';

    for (const component of analysis.components) {
      const className = this.generateClassName(component.element, prefix);
      const cssContent = this.convertToCss(component);
      
      cssModules[className] = cssContent;

      // Replace styled component with className usage
      const replacement = component.isWrapped
        ? `(props) => <${component.element} className={\`\${styles.${className}} \${props.className || ''}\`} {...props} />`
        : `(props) => <${component.element} className={\`\${styles.${className}} \${props.className || ''}\`} {...props} />`;

      transformedCode = transformedCode.replace(
        component.fullDefinition,
        replacement
      );
    }

    // Add CSS module import
    const cssImport = `import styles from './${context?.fileName?.replace(/\.[jt]sx?$/, '')}.module.css';\n`;
    transformedCode = cssImport + transformedCode;

    // Store CSS content for later file generation
    const additionalFiles = [{
      path: `${context?.fileName?.replace(/\.[jt]sx?$/, '')}.module.css`,
      content: this.generateCssModuleContent(cssModules),
    }];

    return { code: transformedCode, additionalFiles };
  }

  /**
   * Transform to Tailwind
   */
  private async transformToTailwind(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<string> {
    let transformedCode = code;

    for (const component of analysis.components) {
      const tailwindClasses = this.convertToTailwindClasses(component);
      
      // Create component with Tailwind classes
      const replacement = component.isWrapped
        ? `(props) => <${component.element} className={\`${tailwindClasses} \${props.className || ''}\`} {...props} />`
        : `(props) => <${component.element} className={\`${tailwindClasses} \${props.className || ''}\`} {...props} />`;

      transformedCode = transformedCode.replace(
        component.fullDefinition,
        replacement
      );
    }

    // Remove styled-components import
    transformedCode = transformedCode.replace(
      /import\s+styled(?:,\s*\{[^}]*\})?\s+from\s+['"]styled-components['"];?\n?/g,
      ''
    );

    return transformedCode;
  }

  /**
   * Transform to Emotion
   */
  private async transformToEmotion(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<string> {
    let transformedCode = code;

    // Replace styled-components import with emotion
    transformedCode = transformedCode.replace(
      /import\s+styled(?:,\s*\{([^}]*)\})?\s+from\s+['"]styled-components['"];?/g,
      (match, namedImports) => {
        let emotionImports = ['import styled from \'@emotion/styled\';'];
        
        if (namedImports) {
          const imports = namedImports.split(',').map((i: string) => i.trim());
          const emotionReactImports: string[] = [];
          
          if (imports.includes('css')) emotionReactImports.push('css');
          if (imports.includes('keyframes')) emotionReactImports.push('keyframes');
          
          // Other imports that need to come from @emotion/react
          const otherImports = imports.filter(i => 
            !['css', 'keyframes'].includes(i) && i !== ''
          );
          
          if (otherImports.length > 0) {
            emotionReactImports.push(...otherImports);
          }
          
          if (emotionReactImports.length > 0) {
            emotionImports.push(`import { ${emotionReactImports.join(', ')} } from '@emotion/react';`);
          }
        }
        
        return emotionImports.join('\n');
      }
    );

    // Transform createGlobalStyle to Global
    transformedCode = transformedCode.replace(
      /createGlobalStyle/g,
      '/* Note: Use emotion\'s Global component instead */\n// createGlobalStyle'
    );

    return transformedCode;
  }

  /**
   * Transform to generic CSS-in-JS
   */
  private async transformToCssInJs(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<string> {
    let transformedCode = code;

    for (const component of analysis.components) {
      const styleObject = this.convertToStyleObject(component);
      
      // Create style object
      const styleName = `${component.element}Styles`;
      const styleDefinition = `const ${styleName} = ${JSON.stringify(styleObject, null, 2)};\n`;
      
      // Create component using style object
      const replacement = component.isWrapped
        ? `(props) => <${component.element} style={{...${styleName}, ...props.style}} {...props} />`
        : `(props) => <${component.element} style={{...${styleName}, ...props.style}} {...props} />`;

      // Insert style definition before component
      const insertPosition = transformedCode.indexOf(component.fullDefinition);
      transformedCode = 
        transformedCode.slice(0, insertPosition) +
        styleDefinition +
        transformedCode.slice(insertPosition);

      transformedCode = transformedCode.replace(
        component.fullDefinition,
        replacement
      );
    }

    // Remove styled-components import
    transformedCode = transformedCode.replace(
      /import\s+styled(?:,\s*\{[^}]*\})?\s+from\s+['"]styled-components['"];?\n?/g,
      ''
    );

    return transformedCode;
  }

  /**
   * Optimize existing styled-components
   */
  private async optimizeStyledComponents(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<string> {
    let transformedCode = code;

    for (const component of analysis.components) {
      // Rename properties to camelCase for React
      const renamedStyles = this.propertyRenamer.renameProperties(component.styles.static);
      
      // Rebuild component with optimized styles
      const optimizedDefinition = this.rebuildStyledComponent(component, renamedStyles);
      
      transformedCode = transformedCode.replace(
        component.fullDefinition,
        optimizedDefinition
      );
    }

    return transformedCode;
  }

  /**
   * Convert component to CSS
   */
  private convertToCss(component: StyledComponentResult): string {
    const cssRules: string[] = [];

    // Static styles
    for (const [property, value] of Object.entries(component.styles.static)) {
      cssRules.push(`  ${property}: ${value};`);
    }

    // Pseudo selectors
    for (const [selector, styles] of Object.entries(component.styles.pseudo)) {
      cssRules.push(`\n&${selector} {\n${this.formatCssRules(styles)}\n}`);
    }

    // Media queries
    for (const [query, styles] of Object.entries(component.styles.media)) {
      cssRules.push(`\n@media ${query} {\n${this.formatCssRules(styles)}\n}`);
    }

    return cssRules.join('\n');
  }

  /**
   * Convert to Tailwind classes
   */
  private convertToTailwindClasses(component: StyledComponentResult): string {
    const classes: string[] = [];
    const styleMap = component.styles.static;

    // Map common CSS properties to Tailwind classes
    const mappings: Record<string, (value: string) => string | null> = {
      'display': (v) => v === 'flex' ? 'flex' : v === 'block' ? 'block' : v === 'none' ? 'hidden' : null,
      'flex-direction': (v) => v === 'column' ? 'flex-col' : v === 'row' ? 'flex-row' : null,
      'justify-content': (v) => v === 'center' ? 'justify-center' : v === 'space-between' ? 'justify-between' : null,
      'align-items': (v) => v === 'center' ? 'items-center' : v === 'flex-start' ? 'items-start' : null,
      'background-color': (v) => this.colorToTailwind(v, 'bg'),
      'color': (v) => this.colorToTailwind(v, 'text'),
      'padding': (v) => this.spacingToTailwind(v, 'p'),
      'margin': (v) => this.spacingToTailwind(v, 'm'),
      'border-radius': (v) => this.borderRadiusToTailwind(v),
      'font-size': (v) => this.fontSizeToTailwind(v),
      'font-weight': (v) => this.fontWeightToTailwind(v),
    };

    for (const [property, value] of Object.entries(styleMap)) {
      const mapper = mappings[property];
      if (mapper) {
        const tailwindClass = mapper(value);
        if (tailwindClass) {
          classes.push(tailwindClass);
        }
      }
    }

    return classes.join(' ');
  }

  /**
   * Convert to style object
   */
  private convertToStyleObject(component: StyledComponentResult): Record<string, any> {
    const result = this.propertyRenamer.renameProperties(component.styles.static);
    return JSON.parse(result.renamed);
  }

  /**
   * Helper methods for Tailwind conversion
   */
  private colorToTailwind(color: string, prefix: string): string | null {
    // Simple color mapping - in production, would be more comprehensive
    const colorMap: Record<string, string> = {
      '#fff': 'white',
      '#ffffff': 'white',
      '#000': 'black',
      '#000000': 'black',
    };

    const mapped = colorMap[color.toLowerCase()];
    return mapped ? `${prefix}-${mapped}` : null;
  }

  private spacingToTailwind(spacing: string, prefix: string): string | null {
    const match = spacing.match(/^(\d+)px$/);
    if (match) {
      const px = parseInt(match[1]);
      const rem = px / 4; // Tailwind uses 0.25rem increments
      return Number.isInteger(rem) ? `${prefix}-${rem}` : null;
    }
    return null;
  }

  private borderRadiusToTailwind(radius: string): string | null {
    const map: Record<string, string> = {
      '0': 'rounded-none',
      '2px': 'rounded-sm',
      '4px': 'rounded',
      '6px': 'rounded-md',
      '8px': 'rounded-lg',
    };
    return map[radius] || null;
  }

  private fontSizeToTailwind(size: string): string | null {
    const map: Record<string, string> = {
      '12px': 'text-xs',
      '14px': 'text-sm',
      '16px': 'text-base',
      '18px': 'text-lg',
      '20px': 'text-xl',
      '24px': 'text-2xl',
    };
    return map[size] || null;
  }

  private fontWeightToTailwind(weight: string): string | null {
    const map: Record<string, string> = {
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
    };
    return map[weight] || null;
  }

  /**
   * Generate class name for CSS modules
   */
  private generateClassName(element: string, prefix: string): string {
    return `${prefix}${element.charAt(0).toUpperCase() + element.slice(1)}`;
  }

  /**
   * Format CSS rules
   */
  private formatCssRules(styles: string): string {
    return styles
      .split(';')
      .filter(rule => rule.trim())
      .map(rule => `  ${rule.trim()};`)
      .join('\n');
  }

  /**
   * Generate CSS module content
   */
  private generateCssModuleContent(modules: Record<string, string>): string {
    const entries = Object.entries(modules).map(([className, css]) => {
      return `.${className} {\n${css}\n}`;
    });
    return entries.join('\n\n');
  }

  /**
   * Rebuild styled component with optimized styles
   */
  private rebuildStyledComponent(
    component: StyledComponentResult,
    renamedStyles: any
  ): string {
    const styles = JSON.parse(renamedStyles.renamed);
    const styleStrings: string[] = [];

    for (const [property, value] of Object.entries(styles)) {
      styleStrings.push(`  ${property}: ${value};`);
    }

    // Add dynamic styles
    for (const dynamic of component.styles.dynamic) {
      styleStrings.push(`  ${dynamic.property}: \${${dynamic.expression}};`);
    }

    const element = component.isWrapped ? `(${component.element})` : `.${component.element}`;
    return `styled${element}\`\n${styleStrings.join('\n')}\n\``;
  }

  /**
   * Extract theme definition
   */
  private extractThemeDefinition(analysis: any, code: string): Record<string, any> {
    const theme: Record<string, any> = {};
    
    // Extract theme object definition
    const themeRegex = /const\s+theme\s*=\s*\{([\s\S]*?)\};/;
    const match = themeRegex.exec(code);
    
    if (match) {
      try {
        // Simple evaluation - in production would use proper AST parsing
        const themeStr = `{${match[1]}}`;
        theme.definition = themeStr;
        theme.usages = analysis.themeUsages;
      } catch (error) {
        theme.error = 'Failed to parse theme definition';
      }
    }

    return theme;
  }

  /**
   * Generate type definitions
   */
  private generateTypeDefinitions(analysis: any): string {
    const types: string[] = [];

    // Component prop types
    for (const component of analysis.components) {
      if (component.hasProps) {
        const propTypes = Array.from(new Set(component.propUsages || []));
        const interfaceName = `${component.element.charAt(0).toUpperCase() + component.element.slice(1)}Props`;
        
        types.push(`interface ${interfaceName} {`);
        for (const prop of propTypes) {
          types.push(`  ${prop}?: any;`);
        }
        types.push('}\n');
      }
    }

    // Theme type
    if (analysis.hasThemeProvider && analysis.themeUsages.length > 0) {
      types.push('interface Theme {');
      for (const usage of analysis.themeUsages) {
        const path = usage.split('.');
        types.push(`  // ${usage}`);
      }
      types.push('}\n');
    }

    return types.join('\n');
  }
}