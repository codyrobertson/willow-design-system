import { StyledComponentAnalysis, StyledComponentResult } from '../../types/style-transformation.types';

/**
 * Parser for styled-components syntax
 */
export class StyledComponentsParser {
  private templateLiteralRegex = /styled\.([\w]+)`([\s\S]*?)`/g;
  private styledFunctionRegex = /styled\(([\w]+)\)`([\s\S]*?)`/g;
  private cssHelperRegex = /css`([\s\S]*?)`/g;
  private themeUsageRegex = /\$\{[^}]*?(?:props\.theme|theme)\.([\w.]+)[^}]*?\}/g;
  private propsUsageRegex = /\$\{[^}]*?(?:props\.([\w]+)|(?:\(\s*\{\s*(\w+)(?:\s*,\s*(\w+))*\s*\}\s*\))[^}]*?\s*=>\s*[^}]*?(?:\1|\2|\3))[^}]*?\}/g;

  /**
   * Parse styled-component definition
   */
  parseStyledComponent(code: string): StyledComponentAnalysis {
    const components: StyledComponentResult[] = [];
    const themeUsages = new Set<string>();
    const propUsages = new Set<string>();
    const cssBlocks: string[] = [];

    // Parse template literal components
    let match = this.templateLiteralRegex.exec(code);
    while (match) {
      const [fullMatch, element, styles] = match;
      const component = this.analyzeComponent(fullMatch, element, styles);
      components.push(component);
      
      // Extract theme and prop usage
      this.extractThemeUsage(styles, themeUsages);
      this.extractPropUsage(styles, propUsages);
      
      match = this.templateLiteralRegex.exec(code);
    }

    // Parse styled function components
    this.styledFunctionRegex.lastIndex = 0;
    match = this.styledFunctionRegex.exec(code);
    while (match) {
      const [fullMatch, baseComponent, styles] = match;
      const component = this.analyzeComponent(fullMatch, baseComponent, styles, true);
      components.push(component);
      
      this.extractThemeUsage(styles, themeUsages);
      this.extractPropUsage(styles, propUsages);
      
      match = this.styledFunctionRegex.exec(code);
    }

    // Parse CSS helper blocks
    this.cssHelperRegex.lastIndex = 0;
    match = this.cssHelperRegex.exec(code);
    while (match) {
      const [, cssBlock] = match;
      cssBlocks.push(cssBlock);
      
      this.extractThemeUsage(cssBlock, themeUsages);
      this.extractPropUsage(cssBlock, propUsages);
      
      match = this.cssHelperRegex.exec(code);
    }

    return {
      components,
      themeUsages: Array.from(themeUsages),
      propUsages: Array.from(propUsages),
      cssBlocks,
      hasGlobalStyles: code.includes('createGlobalStyle'),
      hasThemeProvider: code.includes('ThemeProvider'),
      hasKeyframes: code.includes('keyframes'),
    };
  }

  /**
   * Analyze individual component
   */
  private analyzeComponent(
    fullMatch: string,
    element: string,
    styles: string,
    isWrapped = false
  ): StyledComponentResult {
    const dynamicStyles = this.extractDynamicStyles(styles);
    const staticStyles = this.extractStaticStyles(styles);
    const conditionalStyles = this.extractConditionalStyles(styles);
    const mediaQueries = this.extractMediaQueries(styles);
    const pseudoSelectors = this.extractPseudoSelectors(styles);
    const nestedSelectors = this.extractNestedSelectors(styles);

    // Extract prop usages for this component
    const propUsages = new Set<string>();
    this.extractPropUsage(styles, propUsages);

    return {
      type: 'styled-component',
      element: isWrapped ? element : element.toLowerCase(),
      isWrapped,
      styles: {
        static: staticStyles,
        dynamic: dynamicStyles,
        conditional: conditionalStyles,
        media: mediaQueries,
        pseudo: pseudoSelectors,
        nested: nestedSelectors,
      },
      fullDefinition: fullMatch,
      hasTheme: /props\.theme|theme\s*\}/.test(styles),
      hasProps: /props\.|{\s*\w+.*?}.*?=>/.test(styles),
      propUsages: Array.from(propUsages),
    };
  }

  /**
   * Extract theme usage
   */
  private extractThemeUsage(styles: string, themeUsages: Set<string>): void {
    // Reset regex index
    this.themeUsageRegex.lastIndex = 0;
    
    // Match theme.path.to.value patterns
    const patterns = [
      /props\.theme\.([\w.]+)/g,
      /\(\s*\{\s*theme\s*\}\s*\)\s*=>\s*theme\.([\w.]+)/g,
    ];
    
    for (const pattern of patterns) {
      let match = pattern.exec(styles);
      while (match) {
        themeUsages.add(match[1]);
        match = pattern.exec(styles);
      }
    }
  }

  /**
   * Extract prop usage
   */
  private extractPropUsage(styles: string, propUsages: Set<string>): void {
    // Match props.propName
    const propsAccessRegex = /props\.([\w]+)/g;
    let match = propsAccessRegex.exec(styles);
    while (match) {
      if (match[1] !== 'theme') {
        propUsages.add(match[1]);
      }
      match = propsAccessRegex.exec(styles);
    }

    // Match destructured props ({ propName }) => 
    const destructuredRegex = /\(\s*\{\s*([\w\s,]+)\s*\}\s*\)\s*=>/g;
    match = destructuredRegex.exec(styles);
    while (match) {
      const props = match[1].split(',').map(p => p.trim()).filter(p => p);
      props.forEach(prop => {
        if (prop !== 'theme') {
          propUsages.add(prop);
        }
      });
      match = destructuredRegex.exec(styles);
    }
  }

  /**
   * Extract dynamic styles
   */
  private extractDynamicStyles(styles: string): Array<{
    property: string;
    expression: string;
  }> {
    const dynamicStyles: Array<{ property: string; expression: string }> = [];
    const dynamicRegex = /([\w-]+):\s*\$\{([^}]+)\}/g;
    
    let match = dynamicRegex.exec(styles);
    while (match) {
      const [, property, expression] = match;
      dynamicStyles.push({ property, expression });
      match = dynamicRegex.exec(styles);
    }

    return dynamicStyles;
  }

  /**
   * Extract static styles
   */
  private extractStaticStyles(styles: string): Record<string, string> {
    const staticStyles: Record<string, string> = {};
    const staticRegex = /([\w-]+):\s*([^;${]+);/g;
    
    let match = staticRegex.exec(styles);
    while (match) {
      const [, property, value] = match;
      staticStyles[property.trim()] = value.trim();
      match = staticRegex.exec(styles);
    }

    return staticStyles;
  }

  /**
   * Extract conditional styles
   */
  private extractConditionalStyles(styles: string): Array<{
    condition: string;
    styles: string;
  }> {
    const conditionalStyles: Array<{ condition: string; styles: string }> = [];
    const conditionalRegex = /\$\{(?:props\s*=>\s*)?([\s\S]+?)\s*&&\s*css`([\s\S]+?)`\}/g;
    
    let match = conditionalRegex.exec(styles);
    while (match) {
      const [, condition, conditionalStyle] = match;
      conditionalStyles.push({
        condition: condition.trim(),
        styles: conditionalStyle.trim(),
      });
      match = conditionalRegex.exec(styles);
    }

    return conditionalStyles;
  }

  /**
   * Extract media queries
   */
  private extractMediaQueries(styles: string): Record<string, string> {
    const mediaQueries: Record<string, string> = {};
    const mediaRegex = /@media([^{]+)\{([^}]+)\}/g;
    
    let match = mediaRegex.exec(styles);
    while (match) {
      const [, query, queryStyles] = match;
      mediaQueries[query.trim()] = queryStyles.trim();
      match = mediaRegex.exec(styles);
    }

    return mediaQueries;
  }

  /**
   * Extract pseudo selectors
   */
  private extractPseudoSelectors(styles: string): Record<string, string> {
    const pseudoSelectors: Record<string, string> = {};
    const pseudoRegex = /&(:[a-z-]+)(?:\([^)]*\))?\s*\{([^}]+)\}/g;
    
    let match = pseudoRegex.exec(styles);
    while (match) {
      const [, selector, selectorStyles] = match;
      pseudoSelectors[selector] = selectorStyles.trim();
      match = pseudoRegex.exec(styles);
    }

    return pseudoSelectors;
  }

  /**
   * Extract nested selectors
   */
  private extractNestedSelectors(styles: string): Record<string, string> {
    const nestedSelectors: Record<string, string> = {};
    const nestedRegex = /&\s+([^:{][^{]+)\s*\{([^}]+)\}/g;
    
    let match = nestedRegex.exec(styles);
    while (match) {
      const [, selector, selectorStyles] = match;
      nestedSelectors[selector.trim()] = selectorStyles.trim();
      match = nestedRegex.exec(styles);
    }

    return nestedSelectors;
  }

  /**
   * Parse keyframes
   */
  parseKeyframes(code: string): Array<{
    name: string;
    keyframes: string;
  }> {
    const keyframes: Array<{ name: string; keyframes: string }> = [];
    const keyframesRegex = /const\s+(\w+)\s*=\s*keyframes`([\s\S]*?)`/g;
    
    let match = keyframesRegex.exec(code);
    while (match) {
      const [, name, keyframeContent] = match;
      keyframes.push({ name, keyframes: keyframeContent });
      match = keyframesRegex.exec(code);
    }

    return keyframes;
  }

  /**
   * Parse global styles
   */
  parseGlobalStyles(code: string): string[] {
    const globalStyles: string[] = [];
    const globalRegex = /createGlobalStyle`([\s\S]*?)`/g;
    
    let match = globalRegex.exec(code);
    while (match) {
      globalStyles.push(match[1]);
      match = globalRegex.exec(code);
    }

    return globalStyles;
  }
}