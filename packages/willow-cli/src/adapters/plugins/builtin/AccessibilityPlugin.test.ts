import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccessibilityPlugin } from './AccessibilityPlugin';
import { AdapterInstance, ComponentMapping, StyleConfig } from '../../types';

// Mock console methods
const consoleSpy = {
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

// Mock adapter instance
const createMockAdapter = (): AdapterInstance => ({
  id: 'test-adapter',
  config: {
    name: 'test-adapter',
    version: '1.0.0',
    capabilities: ['accessibility-enhancement'],
    framework: { name: 'react', version: '18.0.0' },
    options: {},
  },
  initialized: false,
  initialize: vi.fn().mockResolvedValue(undefined),
  mapComponent: vi.fn(),
  translateStyles: vi.fn(),
  convertTokens: vi.fn(),
  validateConfig: vi.fn(),
  cleanup: vi.fn().mockResolvedValue(undefined),
});

describe('AccessibilityPlugin', () => {
  let plugin: AccessibilityPlugin;
  let mockAdapter: AdapterInstance;

  beforeEach(() => {
    plugin = new AccessibilityPlugin();
    mockAdapter = createMockAdapter();
    
    // Clear console spies
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin information', () => {
      expect(plugin.name).toBe('accessibility-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('Enhances components with accessibility features');
    });

    it('should initialize with default configuration', () => {
      expect(plugin['a11yConfig']).toEqual({
        enableAriaLabels: true,
        enableKeyboardNavigation: true,
        enableFocusManagement: true,
        enableColorContrast: true,
        enableScreenReaderSupport: true,
      });
    });

    it('should accept custom configuration', () => {
      const customPlugin = new AccessibilityPlugin({
        enableAriaLabels: false,
        enableKeyboardNavigation: false,
      });

      expect(customPlugin['a11yConfig']).toEqual({
        enableAriaLabels: false,
        enableKeyboardNavigation: false,
        enableFocusManagement: true,
        enableColorContrast: true,
        enableScreenReaderSupport: true,
      });
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should initialize successfully', async () => {
      await plugin.initialize(mockAdapter);
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        'AccessibilityPlugin initialized for adapter:',
        'test-adapter'
      );
    });

    it('should cleanup successfully', async () => {
      await plugin.cleanup();
      
      expect(consoleSpy.debug).toHaveBeenCalledWith('AccessibilityPlugin cleaned up');
    });
  });

  describe('beforeComponentMapping', () => {
    describe('ARIA Labels', () => {
      it('should add aria-label to button components', () => {
        const props = { children: 'Click me' };
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result['aria-label']).toBe('Click me');
      });

      it('should add aria-label to input components', () => {
        const props = { placeholder: 'Enter your name' };
        const result = plugin.beforeComponentMapping('Input', props);
        
        expect(result['aria-label']).toBe('Enter your name');
      });

      it('should not override existing aria-label', () => {
        const props = { 'aria-label': 'Custom label', children: 'Button text' };
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result['aria-label']).toBe('Custom label');
      });

      it('should generate fallback labels for unknown components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('CustomComponent', props);
        
        expect(result['aria-label']).toBe('CustomComponent component');
      });

      it('should be disabled when configuration is false', () => {
        const disabledPlugin = new AccessibilityPlugin({ enableAriaLabels: false });
        const props = { children: 'Click me' };
        const result = disabledPlugin.beforeComponentMapping('Button', props);
        
        expect(result['aria-label']).toBeUndefined();
      });
    });

    describe('Keyboard Navigation', () => {
      it('should add tabIndex to interactive components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result.tabIndex).toBe(0);
      });

      it('should add keyboard event handler to interactive components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result.onKeyDown).toBeDefined();
        expect(typeof result.onKeyDown).toBe('function');
      });

      it('should not override existing tabIndex', () => {
        const props = { tabIndex: -1 };
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result.tabIndex).toBe(-1);
      });

      it('should not override existing keyboard handler', () => {
        const customHandler = vi.fn();
        const props = { onKeyDown: customHandler };
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result.onKeyDown).toBe(customHandler);
      });

      it('should not add keyboard support to non-interactive components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('Card', props);
        
        expect(result.tabIndex).toBeUndefined();
        expect(result.onKeyDown).toBeUndefined();
      });

      it('should be disabled when configuration is false', () => {
        const disabledPlugin = new AccessibilityPlugin({ enableKeyboardNavigation: false });
        const props = {};
        const result = disabledPlugin.beforeComponentMapping('Button', props);
        
        expect(result.tabIndex).toBeUndefined();
        expect(result.onKeyDown).toBeUndefined();
      });
    });

    describe('Focus Management', () => {
      it('should add focus attributes to focus-managed components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('Modal', props);
        
        expect(result['data-focus-guard']).toBe(true);
        expect(result.role).toBe('dialog');
      });

      it('should not override existing role', () => {
        const props = { role: 'alertdialog' };
        const result = plugin.beforeComponentMapping('Modal', props);
        
        expect(result.role).toBe('alertdialog');
      });

      it('should not add focus management to non-focus components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result['data-focus-guard']).toBeUndefined();
      });

      it('should be disabled when configuration is false', () => {
        const disabledPlugin = new AccessibilityPlugin({ enableFocusManagement: false });
        const props = {};
        const result = disabledPlugin.beforeComponentMapping('Modal', props);
        
        expect(result['data-focus-guard']).toBeUndefined();
        expect(result.role).toBeUndefined();
      });
    });

    describe('Screen Reader Support', () => {
      it('should add screen reader attributes to supported components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('Alert', props);
        
        expect(result['aria-live']).toBe('polite');
        expect(result['aria-atomic']).toBe(true);
      });

      it('should not override existing screen reader attributes', () => {
        const props = { 'aria-live': 'assertive', 'aria-atomic': false };
        const result = plugin.beforeComponentMapping('Alert', props);
        
        expect(result['aria-live']).toBe('assertive');
        expect(result['aria-atomic']).toBe(false);
      });

      it('should not add screen reader support to non-supported components', () => {
        const props = {};
        const result = plugin.beforeComponentMapping('Button', props);
        
        expect(result['aria-live']).toBeUndefined();
        expect(result['aria-atomic']).toBeUndefined();
      });

      it('should be disabled when configuration is false', () => {
        const disabledPlugin = new AccessibilityPlugin({ enableScreenReaderSupport: false });
        const props = {};
        const result = disabledPlugin.beforeComponentMapping('Alert', props);
        
        expect(result['aria-live']).toBeUndefined();
        expect(result['aria-atomic']).toBeUndefined();
      });
    });
  });

  describe('afterComponentMapping', () => {
    it('should enhance mapping with accessibility metadata', () => {
      const mapping: ComponentMapping = {
        component: 'button',
        props: { type: 'button', 'aria-label': 'Submit', onKeyDown: vi.fn() },
      };

      const result = plugin.afterComponentMapping(mapping);

      expect(result.metadata?.accessibility).toEqual({
        keyboardSupport: true,
        screenReaderSupport: true,
        role: 'button',
        description: 'Component with role "button", keyboard accessible, screen reader compatible',
      });
    });

    it('should create metadata if it does not exist', () => {
      const mapping: ComponentMapping = {
        component: 'div',
        props: {},
      };

      const result = plugin.afterComponentMapping(mapping);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.accessibility).toBeDefined();
    });

    it('should preserve existing metadata', () => {
      const mapping: ComponentMapping = {
        component: 'button',
        props: {},
        metadata: {
          category: 'form',
          accessibility: {
            customProperty: 'existing',
          },
        },
      };

      const result = plugin.afterComponentMapping(mapping);

      expect(result.metadata?.category).toBe('form');
      expect(result.metadata?.accessibility?.customProperty).toBe('existing');
      expect(result.metadata?.accessibility?.role).toBe('button');
    });
  });

  describe('beforeStyleTranslation', () => {
    it('should enhance color contrast when enabled', () => {
      const styles: StyleConfig = {
        colors: {
          color: '#888888',
          backgroundColor: '#ffffff',
        },
      };

      const result = plugin.beforeStyleTranslation(styles);

      expect(result.colors).toBeDefined();
      // Color should be adjusted for better contrast
      expect(result.colors?.color).not.toBe('#888888');
    });

    it('should add focus styles when enabled', () => {
      const styles: StyleConfig = {
        states: {
          hover: { backgroundColor: '#f0f0f0' },
        },
      };

      const result = plugin.beforeStyleTranslation(styles);

      expect(result.states?.focus).toEqual({
        outline: '2px solid #007bff',
        outlineOffset: '2px',
        boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.25)',
      });
      expect(result.states?.hover).toEqual({ backgroundColor: '#f0f0f0' });
    });

    it('should add reduced motion support', () => {
      const styles: StyleConfig = {
        animations: {
          transition: 'all 0.3s ease',
        },
      };

      const result = plugin.beforeStyleTranslation(styles);

      expect(result.animations?.['@media (prefers-reduced-motion: reduce)']).toEqual({
        transition: 'none',
        animation: 'none',
      });
    });

    it('should merge with existing focus styles', () => {
      const styles: StyleConfig = {
        states: {
          focus: {
            outline: '3px solid red',
            customProperty: 'preserved',
          },
        },
      };

      const result = plugin.beforeStyleTranslation(styles);

      // The plugin merges its styles after existing ones, so its outline overrides
      expect(result.states?.focus?.outline).toBe('2px solid #007bff');
      expect(result.states?.focus?.customProperty).toBe('preserved');
      expect(result.states?.focus?.outlineOffset).toBe('2px');
      expect(result.states?.focus?.boxShadow).toBe('0 0 0 3px rgba(0, 123, 255, 0.25)');
    });

    it('should be disabled when color contrast is false', () => {
      const disabledPlugin = new AccessibilityPlugin({ enableColorContrast: false });
      const styles: StyleConfig = {
        colors: {
          color: '#888888',
          backgroundColor: '#ffffff',
        },
      };

      const result = disabledPlugin.beforeStyleTranslation(styles);

      expect(result.colors?.color).toBe('#888888');
    });

    it('should be disabled when focus management is false', () => {
      const disabledPlugin = new AccessibilityPlugin({ enableFocusManagement: false });
      const styles: StyleConfig = {};

      const result = disabledPlugin.beforeStyleTranslation(styles);

      expect(result.states?.focus).toBeUndefined();
    });
  });

  describe('onError', () => {
    it('should detect and log accessibility-related errors', () => {
      const error = new Error('Missing aria-label attribute');
      const context = { component: 'Button' };

      // The onError method should not throw
      expect(() => plugin.onError(error, context)).not.toThrow();
      
      // Verify the error is recognized as accessibility-related
      const isA11yError = (plugin as any).isAccessibilityError(error);
      expect(isA11yError).toBe(true);
    });

    it('should provide appropriate suggestions for different error types', () => {
      const roleError = new Error('Invalid role attribute');
      
      // Should not throw
      expect(() => plugin.onError(roleError, {})).not.toThrow();
      
      // Verify suggestions are generated correctly
      const suggestions = (plugin as any).getAccessibilitySuggestions(roleError, {});
      expect(suggestions).toContain('Ensure the role attribute is appropriate for the component');
    });

    it('should not log non-accessibility errors', () => {
      const error = new Error('Network connection failed');
      const context = {};

      plugin.onError(error, context);

      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should handle button keyboard events', () => {
      const props = {};
      const result = plugin.beforeComponentMapping('Button', props);
      const handler = result.onKeyDown as (event: KeyboardEvent) => void;

      // Mock button element and click method
      const mockButton = {
        click: vi.fn(),
      } as any;

      const enterEvent = {
        key: 'Enter',
        target: mockButton,
        preventDefault: vi.fn(),
      } as any;

      const spaceEvent = {
        key: ' ',
        target: mockButton,
        preventDefault: vi.fn(),
      } as any;

      handler(enterEvent);
      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(mockButton.click).toHaveBeenCalled();

      handler(spaceEvent);
      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(mockButton.click).toHaveBeenCalledTimes(2);
    });

    it('should handle tab navigation events', () => {
      const props = {};
      const result = plugin.beforeComponentMapping('Tabs', props);
      const handler = result.onKeyDown as (event: KeyboardEvent) => void;

      const arrowEvent = {
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as any;

      handler(arrowEvent);
      expect(arrowEvent.preventDefault).toHaveBeenCalled();
      expect(consoleSpy.debug).toHaveBeenCalledWith('Tab navigation:', 'ArrowLeft');
    });

    it('should handle accordion keyboard events', () => {
      const props = {};
      const result = plugin.beforeComponentMapping('Accordion', props);
      const handler = result.onKeyDown as (event: KeyboardEvent) => void;

      const enterEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as any;

      handler(enterEvent);
      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(consoleSpy.debug).toHaveBeenCalledWith('Accordion toggle:', 'Enter');
    });
  });

  describe('Color Contrast Calculations', () => {
    it('should calculate contrast ratios correctly', () => {
      // Test the private method through public interface
      const styles: StyleConfig = {
        colors: {
          color: '#777777',
          backgroundColor: '#ffffff',
        },
      };

      const result = plugin.beforeStyleTranslation(styles);

      // Low contrast should be adjusted
      expect(result.colors?.color).not.toBe('#777777');
    });

    it('should handle invalid color values gracefully', () => {
      const styles: StyleConfig = {
        colors: {
          color: 'invalid-color',
          backgroundColor: '#ffffff',
        },
      };

      const result = plugin.beforeStyleTranslation(styles);

      // Should not throw and preserve original values for invalid colors
      expect(result.colors?.color).toBe('invalid-color');
    });

    it('should adjust colors based on background luminance', () => {
      // Light background with low contrast should darken text
      const lightBgStyles: StyleConfig = {
        colors: {
          color: '#cccccc', // Very light gray on white - low contrast
          backgroundColor: '#ffffff',
        },
      };

      const lightResult = plugin.beforeStyleTranslation(lightBgStyles);
      expect(lightResult.colors?.color).toMatch(/rgb\(\d+, \d+, \d+\)/);

      // Dark background with low contrast should lighten text
      const darkBgStyles: StyleConfig = {
        colors: {
          color: '#333333', // Very dark gray on black - low contrast
          backgroundColor: '#000000',
        },
      };

      const darkResult = plugin.beforeStyleTranslation(darkBgStyles);
      expect(darkResult.colors?.color).toMatch(/rgb\(\d+, \d+, \d+\)/);
    });
  });

  describe('Utility Methods', () => {
    it('should correctly identify interactive components', () => {
      const interactiveComponents = ['Button', 'Input', 'Select', 'Checkbox', 'Radio'];
      const nonInteractiveComponents = ['Card', 'Text', 'Image'];

      interactiveComponents.forEach(component => {
        const result = plugin.beforeComponentMapping(component, {});
        expect(result.tabIndex).toBe(0);
      });

      nonInteractiveComponents.forEach(component => {
        const result = plugin.beforeComponentMapping(component, {});
        expect(result.tabIndex).toBeUndefined();
      });
    });

    it('should correctly identify focus management components', () => {
      const focusComponents = ['Modal', 'Tooltip', 'Popover', 'Dropdown'];
      const nonFocusComponents = ['Button', 'Input', 'Card'];

      focusComponents.forEach(component => {
        const result = plugin.beforeComponentMapping(component, {});
        expect(result['data-focus-guard']).toBe(true);
      });

      nonFocusComponents.forEach(component => {
        const result = plugin.beforeComponentMapping(component, {});
        expect(result['data-focus-guard']).toBeUndefined();
      });
    });

    it('should correctly identify screen reader support components', () => {
      const screenReaderComponents = ['Alert', 'Toast', 'Progress', 'Spinner', 'Modal'];
      const nonScreenReaderComponents = ['Button', 'Input', 'Card'];

      screenReaderComponents.forEach(component => {
        const result = plugin.beforeComponentMapping(component, {});
        expect(result['aria-live']).toBe('polite');
      });

      nonScreenReaderComponents.forEach(component => {
        const result = plugin.beforeComponentMapping(component, {});
        expect(result['aria-live']).toBeUndefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty props gracefully', () => {
      const result = plugin.beforeComponentMapping('Button', {});
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle null/undefined values in props', () => {
      const props = {
        children: null,
        'aria-label': undefined,
        placeholder: '',
      };
      
      const result = plugin.beforeComponentMapping('Input', props);
      
      expect(result['aria-label']).toBe('Input field');
    });

    it('should handle complex nested props', () => {
      const props = {
        style: { color: 'red' },
        onClick: vi.fn(),
        children: ['Text', { type: 'span', children: 'More text' }],
      };
      
      const result = plugin.beforeComponentMapping('Button', props);
      
      expect(result.style).toEqual({ color: 'red' });
      expect(result.onClick).toBeDefined();
      expect(result['aria-label']).toBeDefined();
    });

    it('should maintain function references', () => {
      const clickHandler = vi.fn();
      const keyHandler = vi.fn();
      
      const props = {
        onClick: clickHandler,
        onKeyDown: keyHandler,
      };
      
      const result = plugin.beforeComponentMapping('Button', props);
      
      expect(result.onClick).toBe(clickHandler);
      expect(result.onKeyDown).toBe(keyHandler);
    });
  });
});