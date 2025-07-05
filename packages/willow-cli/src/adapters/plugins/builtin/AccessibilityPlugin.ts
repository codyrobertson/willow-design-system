import { AdapterPlugin, ComponentMapping, StyleConfig, AdapterInstance, ComponentName } from '../../types.js';

/**
 * Accessibility enhancement plugin
 * Automatically adds accessibility features to components and styles
 */
export class AccessibilityPlugin implements AdapterPlugin {
  name = 'accessibility-plugin';
  version = '1.0.0';
  description = 'Enhances components with accessibility features';

  private readonly a11yConfig: {
    enableAriaLabels: boolean;
    enableKeyboardNavigation: boolean;
    enableFocusManagement: boolean;
    enableColorContrast: boolean;
    enableScreenReaderSupport: boolean;
  };

  constructor(config: Partial<typeof AccessibilityPlugin.prototype.a11yConfig> = {}) {
    this.a11yConfig = {
      enableAriaLabels: true,
      enableKeyboardNavigation: true,
      enableFocusManagement: true,
      enableColorContrast: true,
      enableScreenReaderSupport: true,
      ...config,
    };
  }

  async initialize(adapter: AdapterInstance): Promise<void> {
    console.debug('AccessibilityPlugin initialized for adapter:', adapter.config.name);
  }

  beforeComponentMapping(
    name: ComponentName,
    props: Record<string, unknown>
  ): Record<string, unknown> {
    const enhancedProps = { ...props };

    // Add ARIA labels if missing
    if (this.a11yConfig.enableAriaLabels) {
      enhancedProps['aria-label'] = enhancedProps['aria-label'] || this.generateAriaLabel(name, props);
    }

    // Add keyboard navigation support
    if (this.a11yConfig.enableKeyboardNavigation) {
      if (this.isInteractiveComponent(name)) {
        enhancedProps.tabIndex = enhancedProps.tabIndex ?? 0;
        
        // Add keyboard event handlers if not present
        if (!enhancedProps.onKeyDown) {
          enhancedProps.onKeyDown = this.createKeyboardHandler(name);
        }
      }
    }

    // Add focus management
    if (this.a11yConfig.enableFocusManagement) {
      if (this.needsFocusManagement(name)) {
        enhancedProps['data-focus-guard'] = true;
        enhancedProps.role = enhancedProps.role || this.getDefaultRole(name);
      }
    }

    // Add screen reader support
    if (this.a11yConfig.enableScreenReaderSupport) {
      if (this.needsScreenReaderSupport(name)) {
        enhancedProps['aria-live'] = enhancedProps['aria-live'] || 'polite';
        enhancedProps['aria-atomic'] = enhancedProps['aria-atomic'] ?? true;
      }
    }

    return enhancedProps;
  }

  afterComponentMapping(mapping: ComponentMapping): ComponentMapping {
    const enhancedMapping = { ...mapping };

    // Enhance metadata with accessibility information
    if (!enhancedMapping.metadata) {
      enhancedMapping.metadata = {};
    }

    if (!enhancedMapping.metadata.accessibility) {
      enhancedMapping.metadata.accessibility = {};
    }

    // Add accessibility metadata
    enhancedMapping.metadata.accessibility = {
      ...enhancedMapping.metadata.accessibility,
      keyboardSupport: this.hasKeyboardSupport(mapping),
      screenReaderSupport: this.hasScreenReaderSupport(mapping),
      role: mapping.props.role || this.inferRole(mapping),
      description: this.generateAccessibilityDescription(mapping),
    };

    return enhancedMapping;
  }

  beforeStyleTranslation(styles: StyleConfig): StyleConfig {
    const enhancedStyles = { ...styles };

    if (this.a11yConfig.enableColorContrast) {
      // Enhance color contrast
      enhancedStyles.colors = this.enhanceColorContrast(styles.colors || {});
    }

    if (this.a11yConfig.enableFocusManagement) {
      // Add focus styles
      enhancedStyles.states = {
        ...enhancedStyles.states,
        focus: {
          ...enhancedStyles.states?.focus,
          ...this.generateFocusStyles(),
        },
      };
    }

    // Add reduced motion support
    enhancedStyles.animations = this.addReducedMotionSupport(enhancedStyles.animations || {});

    return enhancedStyles;
  }

  onError(error: Error, context: Record<string, unknown>): void {
    // Log accessibility-related errors
    if (this.isAccessibilityError(error)) {
      console.warn('Accessibility Plugin detected potential a11y issue:', {
        error: error.message,
        context,
        suggestions: this.getAccessibilitySuggestions(error, context),
      });
    }
  }

  async cleanup(): Promise<void> {
    console.debug('AccessibilityPlugin cleaned up');
  }

  /**
   * Generate appropriate ARIA label for component
   */
  private generateAriaLabel(componentName: ComponentName, props: Record<string, unknown>): string {
    // If already has aria-label or aria-labelledby, don't override
    if (props['aria-label'] || props['aria-labelledby']) {
      return props['aria-label'] as string;
    }

    // Generate based on component type and props
    switch (componentName.toLowerCase()) {
      case 'button':
        return props.children as string || props.text as string || 'Button';
      
      case 'input':
        return props.placeholder as string || props.label as string || 'Input field';
      
      case 'select':
        return props.label as string || 'Select option';
      
      case 'checkbox':
        return props.label as string || 'Checkbox';
      
      case 'radio':
        return props.label as string || 'Radio button';
      
      case 'modal':
        return props.title as string || 'Modal dialog';
      
      case 'tooltip':
        return 'Tooltip';
      
      default:
        return `${componentName} component`;
    }
  }

  /**
   * Check if component is interactive
   */
  private isInteractiveComponent(componentName: ComponentName): boolean {
    const interactiveComponents = [
      'button', 'input', 'select', 'checkbox', 'radio', 'switch', 
      'slider', 'tabs', 'accordion', 'dropdown', 'menu'
    ];
    return interactiveComponents.includes(componentName.toLowerCase());
  }

  /**
   * Check if component needs focus management
   */
  private needsFocusManagement(componentName: ComponentName): boolean {
    const focusComponents = [
      'modal', 'tooltip', 'popover', 'dropdown', 'menu', 'tabs', 'accordion'
    ];
    return focusComponents.includes(componentName.toLowerCase());
  }

  /**
   * Check if component needs screen reader support
   */
  private needsScreenReaderSupport(componentName: ComponentName): boolean {
    const screenReaderComponents = [
      'alert', 'toast', 'progress', 'spinner', 'modal'
    ];
    return screenReaderComponents.includes(componentName.toLowerCase());
  }

  /**
   * Get default ARIA role for component
   */
  private getDefaultRole(componentName: ComponentName): string {
    const roleMap: Record<string, string> = {
      button: 'button',
      input: 'textbox',
      select: 'combobox',
      checkbox: 'checkbox',
      radio: 'radio',
      slider: 'slider',
      modal: 'dialog',
      tooltip: 'tooltip',
      alert: 'alert',
      progress: 'progressbar',
      tabs: 'tablist',
      accordion: 'button',
      menu: 'menu',
    };
    return roleMap[componentName.toLowerCase()] || 'generic';
  }

  /**
   * Create keyboard event handler
   */
  private createKeyboardHandler(componentName: ComponentName) {
    return (event: KeyboardEvent) => {
      switch (componentName.toLowerCase()) {
        case 'button':
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            (event.target as HTMLElement).click();
          }
          break;
        
        case 'tabs':
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            // Navigate between tabs
            this.navigateTabs(event);
          }
          break;
        
        case 'accordion':
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            // Toggle accordion
            this.toggleAccordion(event);
          }
          break;
      }
    };
  }

  /**
   * Enhance color contrast
   */
  private enhanceColorContrast(colors: Record<string, unknown>): Record<string, unknown> {
    const enhancedColors = { ...colors };

    // Ensure sufficient contrast ratios
    if (enhancedColors.color && enhancedColors.backgroundColor) {
      const contrast = this.calculateContrast(
        enhancedColors.color as string,
        enhancedColors.backgroundColor as string
      );

      // If contrast is too low, adjust colors
      if (contrast < 4.5) {
        enhancedColors.color = this.adjustColorForContrast(
          enhancedColors.color as string,
          enhancedColors.backgroundColor as string
        );
      }
    }

    return enhancedColors;
  }

  /**
   * Generate focus styles
   */
  private generateFocusStyles(): Record<string, unknown> {
    return {
      outline: '2px solid #007bff',
      outlineOffset: '2px',
      boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.25)',
    };
  }

  /**
   * Add reduced motion support
   */
  private addReducedMotionSupport(animations: Record<string, unknown>): Record<string, unknown> {
    const enhancedAnimations = { ...animations };

    // Add media query for reduced motion
    enhancedAnimations['@media (prefers-reduced-motion: reduce)'] = {
      transition: 'none',
      animation: 'none',
    };

    return enhancedAnimations;
  }

  /**
   * Check if error is accessibility-related
   */
  private isAccessibilityError(error: Error): boolean {
    const a11yKeywords = ['aria', 'role', 'tabindex', 'focus', 'accessibility', 'screen reader'];
    return a11yKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  /**
   * Get accessibility suggestions for errors
   */
  private getAccessibilitySuggestions(error: Error, context: Record<string, unknown>): string[] {
    const suggestions: string[] = [];

    if (error.message.includes('aria-label')) {
      suggestions.push('Consider adding an aria-label or aria-labelledby attribute');
    }

    if (error.message.includes('role')) {
      suggestions.push('Ensure the role attribute is appropriate for the component');
    }

    if (error.message.includes('focus')) {
      suggestions.push('Check that focusable elements have proper focus management');
    }

    if (error.message.includes('contrast')) {
      suggestions.push('Verify color contrast meets WCAG guidelines (4.5:1 minimum)');
    }

    return suggestions;
  }

  /**
   * Check if mapping has keyboard support
   */
  private hasKeyboardSupport(mapping: ComponentMapping): boolean {
    return !!(
      mapping.props.tabIndex !== undefined ||
      mapping.props.onKeyDown ||
      mapping.props.onKeyUp ||
      mapping.props.onKeyPress
    );
  }

  /**
   * Check if mapping has screen reader support
   */
  private hasScreenReaderSupport(mapping: ComponentMapping): boolean {
    return !!(
      mapping.props['aria-label'] ||
      mapping.props['aria-labelledby'] ||
      mapping.props['aria-describedby'] ||
      mapping.props.role
    );
  }

  /**
   * Infer ARIA role from mapping
   */
  private inferRole(mapping: ComponentMapping): string {
    if (mapping.props.role) {
      return mapping.props.role as string;
    }

    if (typeof mapping.component === 'string') {
      return this.getDefaultRole(mapping.component as ComponentName);
    }

    return 'generic';
  }

  /**
   * Generate accessibility description
   */
  private generateAccessibilityDescription(mapping: ComponentMapping): string {
    const hasKeyboard = this.hasKeyboardSupport(mapping);
    const hasScreenReader = this.hasScreenReaderSupport(mapping);
    const role = this.inferRole(mapping);

    let description = `Component with role "${role}"`;

    if (hasKeyboard) {
      description += ', keyboard accessible';
    }

    if (hasScreenReader) {
      description += ', screen reader compatible';
    }

    return description;
  }

  /**
   * Navigate between tabs (helper method)
   */
  private navigateTabs(event: KeyboardEvent): void {
    // Implementation would depend on the specific tab structure
    console.debug('Tab navigation:', event.key);
  }

  /**
   * Toggle accordion (helper method)
   */
  private toggleAccordion(event: KeyboardEvent): void {
    // Implementation would depend on the specific accordion structure
    console.debug('Accordion toggle:', event.key);
  }

  /**
   * Calculate color contrast ratio
   */
  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast algorithm
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 1;

    const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Get luminance value
   */
  private getLuminance(r: number, g: number, b: number): number {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Adjust color for better contrast
   */
  private adjustColorForContrast(color: string, backgroundColor: string): string {
    // Simplified adjustment - darken or lighten the color
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    // If background is light, darken the text
    const bgRgb = this.hexToRgb(backgroundColor);
    if (!bgRgb) return color;

    const bgLuminance = this.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    
    if (bgLuminance > 0.5) {
      // Light background, darken text
      return `rgb(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)})`;
    } else {
      // Dark background, lighten text
      return `rgb(${Math.min(255, rgb.r + 50)}, ${Math.min(255, rgb.g + 50)}, ${Math.min(255, rgb.b + 50)})`;
    }
  }
}