import { BaseStyleTransformer } from '../base-style-transformer';
import { EmotionParser } from './emotion-parser';
import { PropertyRenamerFactory } from '../property-renaming/property-renamer';
import {
  StyleTransformationContext,
  StyleTransformationResult,
  TransformationOptions,
  NamingConvention,
} from '../../types/style-transformation.types';

export interface EmotionTransformOptions extends TransformationOptions {
  targetFramework?: 'styled-components' | 'css-modules' | 'tailwind' | 'css-in-js';
  preserveCssProp?: boolean;
  convertToJsxPragma?: boolean;
  extractGlobalStyles?: boolean;
  optimizeCssObjects?: boolean;
}

/**
 * Transformer for Emotion styles
 */
export class EmotionTransformer extends BaseStyleTransformer {
  private parser: EmotionParser;
  private propertyRenamer;

  constructor(private options: EmotionTransformOptions = {}) {
    super();
    this.parser = new EmotionParser();
    this.propertyRenamer = PropertyRenamerFactory.createForFramework('react');
  }

  getName(): string {
    return 'emotion';
  }

  canTransform(code: string, filePath?: string): boolean {
    return (
      code.includes('@emotion/styled') ||
      code.includes('@emotion/core') ||
      code.includes('@emotion/react') ||
      code.includes('@emotion/css') ||
      code.includes('/** @jsx jsx */') ||
      code.includes('css={') ||
      code.includes('css`') ||
      (filePath?.includes('.emotion.') ?? false)
    );
  }

  async transform(
    code: string,
    context?: StyleTransformationContext
  ): Promise<any> {
    const analysis = this.parser.parseEmotionComponent(code);
    const warnings: string[] = [];
    const changes: any[] = [];
    const additionalFiles: any[] = [];

    let transformedCode = code;

    switch (this.options.targetFramework) {
      case 'styled-components':
        transformedCode = await this.transformToStyledComponents(analysis, code, context);
        break;
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
      case 'css-in-js':
        transformedCode = await this.transformToCssInJs(analysis, code, context);
        break;
      default:
        transformedCode = await this.optimizeEmotion(analysis, code, context);
    }

    // Extract global styles if requested
    const globalStyles = this.options.extractGlobalStyles
      ? this.extractGlobalStyles(analysis, code)
      : undefined;

    return {
      transformed: transformedCode,
      framework: this.options.targetFramework || 'emotion',
      changes,
      warnings,
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
      metadata: {
        componentsTransformed: analysis.components.length,
        themeUsages: analysis.themeUsages,
        propUsages: analysis.propUsages,
        hasGlobalStyles: analysis.hasGlobalStyles,
        hasKeyframes: analysis.hasKeyframes,
        hasThemeProvider: analysis.hasThemeProvider,
        hasJsxPragma: analysis.hasJsxPragma,
        hasCssImport: analysis.hasCssImport,
        globalStyles,
      },
    };
  }

  /**
   * Transform to styled-components
   */
  private async transformToStyledComponents(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<string> {
    let transformedCode = code;

    // Replace Emotion imports with styled-components
    transformedCode = transformedCode.replace(
      /import\s+styled(?:,\s*\{([^}]*)\})?\s+from\s+['"]@emotion\/styled['"];?/g,
      (match, namedImports) => {
        if (namedImports) {
          return `import styled, {${namedImports}} from 'styled-components';`;
        }
        return `import styled from 'styled-components';`;
      }
    );

    // Replace @emotion/react imports
    transformedCode = transformedCode.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]@emotion\/(?:core|react)['"];?/g,
      (match, imports) => {
        const importList = imports.split(',').map(i => i.trim());
        const styledComponentsImports: string[] = [];
        
        if (importList.includes('css')) styledComponentsImports.push('css');
        if (importList.includes('keyframes')) styledComponentsImports.push('keyframes');
        if (importList.includes('Global')) styledComponentsImports.push('createGlobalStyle');
        if (importList.includes('ThemeProvider')) styledComponentsImports.push('ThemeProvider');
        
        return styledComponentsImports.length > 0
          ? `import { ${styledComponentsImports.join(', ')} } from 'styled-components';`
          : '';
      }
    );

    // Remove JSX pragma
    transformedCode = transformedCode.replace(/\/\*\*\s*@jsx\s+jsx\s*\*\/\s*\n?/g, '');

    // Transform Global to createGlobalStyle
    transformedCode = transformedCode.replace(
      /<Global\s+styles=\{([\s\S]*?)\}\s*\/>/g,
      (match, styles) => {
        if (styles.includes('css`')) {
          return `const GlobalStyles = createGlobalStyle${styles.replace('css', '')};\n/* Use <GlobalStyles /> in your app */`;
        }
        return match;
      }
    );

    // Handle css prop usage
    if (!this.options.preserveCssProp) {
      transformedCode = this.convertCssPropToStyledComponents(transformedCode);
    }

    return transformedCode;
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

    // Transform styled components to CSS modules
    for (const component of analysis.components) {
      const className = this.generateClassName(component.element);
      const cssContent = this.convertToCss(component);
      
      cssModules[className] = cssContent;

      const replacement = component.isWrapped
        ? `(props) => <${component.element} className={\`\${styles.${className}} \${props.className || ''}\`} {...props} />`
        : `(props) => <${component.element} className={\`\${styles.${className}} \${props.className || ''}\`} {...props} />`;

      transformedCode = transformedCode.replace(
        component.fullDefinition,
        replacement
      );
    }

    // Handle css prop usage
    const cssPropUsages = this.parser.parseJsxCssProp(code);
    for (const usage of cssPropUsages) {
      const className = `css${Math.random().toString(36).substr(2, 9)}`;
      cssModules[className] = usage.type === 'template' 
        ? usage.cssValue 
        : this.convertObjectToCss(usage.cssValue);
      
      const regex = new RegExp(
        `<${usage.element}([^>]*)css=\\{[^}]+\\}([^>]*)>`,
        'g'
      );
      transformedCode = transformedCode.replace(
        regex,
        `<${usage.element}$1 className={styles.${className}}$2>`
      );
    }

    // Remove Emotion imports
    transformedCode = transformedCode.replace(
      /import\s+[^;]+from\s+['"]@emotion\/[^'"]+['"];?\n?/g,
      ''
    );

    // Add CSS module import
    const cssImport = `import styles from './${context?.fileName?.replace(/\.[jt]sx?$/, '')}.module.css';\n`;
    transformedCode = cssImport + transformedCode;

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

    // Transform styled components
    for (const component of analysis.components) {
      const tailwindClasses = this.convertToTailwindClasses(component);
      
      const replacement = component.isWrapped
        ? `(props) => <${component.element} className={\`${tailwindClasses} \${props.className || ''}\`} {...props} />`
        : `(props) => <${component.element} className={\`${tailwindClasses} \${props.className || ''}\`} {...props} />`;

      transformedCode = transformedCode.replace(
        component.fullDefinition,
        replacement
      );
    }

    // Handle css prop usage
    const cssPropUsages = this.parser.parseJsxCssProp(code);
    for (const usage of cssPropUsages) {
      const tailwindClasses = usage.type === 'template'
        ? this.cssToTailwind(usage.cssValue)
        : this.objectToTailwind(usage.cssValue);
      
      const regex = new RegExp(
        `<${usage.element}([^>]*)css=\\{[^}]+\\}([^>]*)>`,
        'g'
      );
      transformedCode = transformedCode.replace(
        regex,
        `<${usage.element}$1 className="${tailwindClasses}"$2>`
      );
    }

    // Remove Emotion imports
    transformedCode = transformedCode.replace(
      /import\s+[^;]+from\s+['"]@emotion\/[^'"]+['"];?\n?/g,
      ''
    );

    return transformedCode;
  }

  /**
   * Transform to CSS-in-JS
   */
  private async transformToCssInJs(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<string> {
    let transformedCode = code;

    // Transform styled components to style objects
    for (const component of analysis.components) {
      const styleObject = this.convertToStyleObject(component);
      
      const styleName = `${component.element}Styles`;
      const styleDefinition = `const ${styleName} = ${JSON.stringify(styleObject, null, 2)};\n`;
      
      const replacement = component.isWrapped
        ? `(props) => <${component.element} style={{...${styleName}, ...props.style}} {...props} />`
        : `(props) => <${component.element} style={{...${styleName}, ...props.style}} {...props} />`;

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

    // Handle css prop usage
    const cssPropUsages = this.parser.parseJsxCssProp(code);
    for (const usage of cssPropUsages) {
      const styleObject = usage.type === 'template'
        ? this.cssToObject(usage.cssValue)
        : usage.cssValue;
      
      const regex = new RegExp(
        `css=\\{[^}]+\\}`,
        'g'
      );
      transformedCode = transformedCode.replace(
        regex,
        `style={${styleObject}}`
      );
    }

    // Remove Emotion imports
    transformedCode = transformedCode.replace(
      /import\s+[^;]+from\s+['"]@emotion\/[^'"]+['"];?\n?/g,
      ''
    );

    return transformedCode;
  }

  /**
   * Optimize existing Emotion code
   */
  private async optimizeEmotion(
    analysis: any,
    code: string,
    context?: StyleTransformationContext
  ): Promise<string> {
    let transformedCode = code;

    // Optimize css objects if requested
    if (this.options.optimizeCssObjects) {
      transformedCode = this.optimizeCssObjects(transformedCode);
    }

    // Convert to JSX pragma if requested
    if (this.options.convertToJsxPragma && !analysis.hasJsxPragma && analysis.hasCssImport) {
      transformedCode = '/** @jsx jsx */\n' + transformedCode;
    }

    return transformedCode;
  }

  /**
   * Convert css prop to styled-components
   */
  private convertCssPropToStyledComponents(code: string): string {
    const cssPropUsages = this.parser.parseJsxCssProp(code);
    let transformedCode = code;
    let componentCounter = 0;

    for (const usage of cssPropUsages) {
      componentCounter++;
      const componentName = `Styled${usage.element}${componentCounter}`;
      
      let styleDefinition: string;
      if (usage.type === 'template') {
        styleDefinition = `const ${componentName} = styled.${usage.element.toLowerCase()}\`${usage.cssValue}\`;\n`;
      } else {
        const cssString = this.objectToCssString(usage.cssValue);
        styleDefinition = `const ${componentName} = styled.${usage.element.toLowerCase()}\`${cssString}\`;\n`;
      }

      // Insert style definition
      const firstImportEnd = transformedCode.search(/import[^;]+;\n/) + 1;
      transformedCode = 
        transformedCode.slice(0, firstImportEnd) +
        styleDefinition +
        transformedCode.slice(firstImportEnd);

      // Replace element with styled component
      const regex = new RegExp(
        `<${usage.element}([^>]*)css=\\{[^}]+\\}([^>]*)>`,
        'g'
      );
      transformedCode = transformedCode.replace(
        regex,
        `<${componentName}$1$2>`
      );
    }

    return transformedCode;
  }

  /**
   * Helper methods
   */
  private generateClassName(element: string): string {
    return element.charAt(0).toUpperCase() + element.slice(1);
  }

  private convertToCss(component: any): string {
    const cssRules: string[] = [];

    for (const [property, value] of Object.entries(component.styles.static)) {
      cssRules.push(`  ${property}: ${value};`);
    }

    for (const [selector, styles] of Object.entries(component.styles.pseudo)) {
      cssRules.push(`\n&${selector} {\n${this.formatCssRules(styles)}\n}`);
    }

    for (const [query, styles] of Object.entries(component.styles.media)) {
      cssRules.push(`\n@media ${query} {\n${this.formatCssRules(styles)}\n}`);
    }

    return cssRules.join('\n');
  }

  private convertToTailwindClasses(component: any): string {
    const classes: string[] = [];
    const styleMap = component.styles.static;

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

  private convertToStyleObject(component: any): Record<string, any> {
    const result = this.propertyRenamer.renameProperties(component.styles.static);
    return JSON.parse(result.renamed);
  }

  private cssToTailwind(css: string): string {
    // Simple implementation - would be more comprehensive in production
    const rules = css.split(';').map(r => r.trim()).filter(r => r);
    const classes: string[] = [];
    
    for (const rule of rules) {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property === 'display' && value === 'flex') classes.push('flex');
      if (property === 'color' && value === 'white') classes.push('text-white');
      // Add more mappings as needed
    }
    
    return classes.join(' ');
  }

  private objectToTailwind(objectStr: string): string {
    // Convert object string to Tailwind classes
    return 'flex items-center'; // Simplified
  }

  private cssToObject(css: string): string {
    const rules = css.split(';').map(r => r.trim()).filter(r => r);
    const obj: Record<string, string> = {};
    
    for (const rule of rules) {
      const [property, value] = rule.split(':').map(s => s.trim());
      const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      obj[camelCase] = value;
    }
    
    return JSON.stringify(obj);
  }

  private objectToCssString(objectStr: string): string {
    // Convert object to CSS string
    return 'display: flex;\nalign-items: center;'; // Simplified
  }

  private formatCssRules(styles: string): string {
    return styles
      .split(';')
      .filter(rule => rule.trim())
      .map(rule => `  ${rule.trim()};`)
      .join('\n');
  }

  private generateCssModuleContent(modules: Record<string, string>): string {
    const entries = Object.entries(modules).map(([className, css]) => {
      return `.${className} {\n${css}\n}`;
    });
    return entries.join('\n\n');
  }

  private optimizeCssObjects(code: string): string {
    // Optimize css objects by merging common styles
    return code; // Simplified implementation
  }

  private extractGlobalStyles(analysis: any, code: string): any {
    const globalStyles = this.parser.parseGlobalStyles(code);
    return {
      count: globalStyles.length,
      styles: globalStyles,
    };
  }

  private colorToTailwind(color: string, prefix: string): string | null {
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
      const rem = px / 4;
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
}