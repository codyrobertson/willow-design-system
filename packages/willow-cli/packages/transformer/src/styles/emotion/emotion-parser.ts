import { StyledComponentAnalysis, StyledComponentResult } from '../../types/style-transformation.types';

/**
 * Parser for Emotion syntax
 */
export class EmotionParser {
  private styledRegex = /styled\.([\w]+)`([\s\S]*?)`/g;
  private styledFunctionRegex = /styled\(([\w]+)\)`([\s\S]*?)`/g;
  private cssRegex = /css`([\s\S]*?)`/g;
  private jsxPragmaRegex = /\/\*\*\s*@jsx\s+jsx\s*\*\//;
  private cssImportRegex = /import\s+\{[^}]*css[^}]*\}\s+from\s+['"]@emotion\/(?:core|react)['"];?/;
  private globalRegex = /Global\s+styles=\{([\s\S]*?)\}/g;
  private keyframesRegex = /keyframes`([\s\S]*?)`/g;
  private themeUsageRegex = /\$\{[^}]*?(?:props\.theme|theme)\.([\w.]+)[^}]*?\}/g;
  private cssObjectRegex = /css\(\s*\{([\s\S]*?)\}\s*\)/g;

  /**
   * Parse Emotion styled component
   */
  parseEmotionComponent(code: string): StyledComponentAnalysis {
    const components: StyledComponentResult[] = [];
    const themeUsages = new Set<string>();
    const propUsages = new Set<string>();
    const cssBlocks: string[] = [];

    // Check for JSX pragma
    const hasJsxPragma = this.jsxPragmaRegex.test(code);
    const hasCssImport = this.cssImportRegex.test(code);

    // Parse styled components (same as styled-components)
    this.parseStyledComponents(code, components, themeUsages, propUsages);

    // Parse css blocks
    this.parseCssBlocks(code, cssBlocks, themeUsages, propUsages);

    // Parse css objects
    this.parseCssObjects(code, cssBlocks);

    // Parse Global styles
    const hasGlobalStyles = this.parseGlobalStyles(code).length > 0;

    // Parse keyframes
    const hasKeyframes = this.parseKeyframes(code).length > 0;

    return {
      components,
      themeUsages: Array.from(themeUsages),
      propUsages: Array.from(propUsages),
      cssBlocks,
      hasGlobalStyles,
      hasThemeProvider: /ThemeProvider/.test(code),
      hasKeyframes,
      hasJsxPragma,
      hasCssImport,
    };
  }

  /**
   * Parse styled components
   */
  private parseStyledComponents(
    code: string,
    components: StyledComponentResult[],
    themeUsages: Set<string>,
    propUsages: Set<string>
  ): void {
    // Parse template literal components
    let match = this.styledRegex.exec(code);
    while (match) {
      const [fullMatch, element, styles] = match;
      const component = this.analyzeComponent(fullMatch, element, styles);
      components.push(component);
      
      this.extractThemeUsage(styles, themeUsages);
      this.extractPropUsage(styles, propUsages);
      
      match = this.styledRegex.exec(code);
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
  }

  /**
   * Parse css blocks
   */
  private parseCssBlocks(
    code: string,
    cssBlocks: string[],
    themeUsages: Set<string>,
    propUsages: Set<string>
  ): void {
    this.cssRegex.lastIndex = 0;
    let match = this.cssRegex.exec(code);
    while (match) {
      const [, cssBlock] = match;
      cssBlocks.push(cssBlock);
      
      this.extractThemeUsage(cssBlock, themeUsages);
      this.extractPropUsage(cssBlock, propUsages);
      
      match = this.cssRegex.exec(code);
    }
  }

  /**
   * Parse css objects
   */
  private parseCssObjects(code: string, cssBlocks: string[]): void {
    this.cssObjectRegex.lastIndex = 0;
    let match = this.cssObjectRegex.exec(code);
    while (match) {
      const [, cssObject] = match;
      cssBlocks.push(`{${cssObject}}`);
      match = this.cssObjectRegex.exec(code);
    }
  }

  /**
   * Analyze component
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

    // Match destructured props
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
   * Parse Global styles
   */
  parseGlobalStyles(code: string): Array<{
    styles: string;
    type: 'object' | 'template';
  }> {
    const globalStyles: Array<{ styles: string; type: 'object' | 'template' }> = [];
    
    // Parse Global component with template literal (more specific, check first)
    const globalTemplateRegex = /Global\s+styles=\{css`([\s\S]*?)`\}/g;
    let match = globalTemplateRegex.exec(code);
    while (match) {
      globalStyles.push({ styles: match[1], type: 'template' });
      match = globalTemplateRegex.exec(code);
    }

    // Parse Global component with object styles (but not css template)
    const globalObjectRegex = /Global\s+styles=\{(?!css`)([\s\S]*?)\}/g;
    match = globalObjectRegex.exec(code);
    while (match) {
      globalStyles.push({ styles: match[1], type: 'object' });
      match = globalObjectRegex.exec(code);
    }

    return globalStyles;
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
   * Parse JSX css prop usage
   */
  parseJsxCssProp(code: string): Array<{
    element: string;
    cssValue: string;
    type: 'template' | 'object' | 'array';
  }> {
    const cssPropUsages: Array<{
      element: string;
      cssValue: string;
      type: 'template' | 'object' | 'array';
    }> = [];

    // Match css prop with template literal
    const cssTemplateRegex = /<(\w+)\s+[^>]*css=\{css`([^`]+)`\}[^>]*>/g;
    let match = cssTemplateRegex.exec(code);
    while (match) {
      cssPropUsages.push({
        element: match[1],
        cssValue: match[2],
        type: 'template',
      });
      match = cssTemplateRegex.exec(code);
    }

    // Match css prop with object
    const cssObjectPropRegex = /<(\w+)\s+[^>]*css=\{\{([^}]+)\}\}[^>]*>/g;
    match = cssObjectPropRegex.exec(code);
    while (match) {
      cssPropUsages.push({
        element: match[1],
        cssValue: match[2],
        type: 'object',
      });
      match = cssObjectPropRegex.exec(code);
    }

    return cssPropUsages;
  }
}