import { describe, it, expect, beforeEach } from 'vitest';
import { 
  PropDeprecationHandler,
  DeprecationLevel,
  type DeprecationConfig,
  type DeprecationInfo,
  type MigrationSuggestion
} from '../prop-deprecation-handler';
import type { PropertyMapping, ComponentMapping } from '../../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../../types/component-mapping.types';

describe('PropDeprecationHandler', () => {
  let handler: PropDeprecationHandler;
  let context: ComponentMappingContext;

  beforeEach(() => {
    handler = new PropDeprecationHandler();
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
      line: 10,
      column: 5,
    };
  });

  describe('property deprecation registration', () => {
    it('should register deprecated property', () => {
      const propertyMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        deprecationMessage: 'Use variant instead of color',
        alternative: 'variant',
      };

      const deprecation = handler.registerDeprecation('Button', propertyMapping, context);

      expect(deprecation).toBeTruthy();
      expect(deprecation?.property).toBe('color');
      expect(deprecation?.component).toBe('Button');
      expect(deprecation?.message).toBe('Use variant instead of color');
      expect(deprecation?.alternative).toBe('variant');
      expect(deprecation?.level).toBe(DeprecationLevel.WARNING);
    });

    it('should not register non-deprecated property', () => {
      const propertyMapping: PropertyMapping = {
        source: 'size',
        target: 'size',
        deprecated: false,
      };

      const deprecation = handler.registerDeprecation('Button', propertyMapping, context);

      expect(deprecation).toBeNull();
    });

    it('should determine correct deprecation levels', () => {
      // Error level (has removal version)
      const errorMapping: PropertyMapping = {
        source: 'oldProp',
        target: 'newProp',
        deprecated: true,
        removalVersion: '2.0.0',
      };

      const errorDeprecation = handler.registerDeprecation('Button', errorMapping, context);
      expect(errorDeprecation?.level).toBe(DeprecationLevel.ERROR);

      // Warning level (has alternative)
      const warningMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };

      const warningDeprecation = handler.registerDeprecation('Button', warningMapping, context);
      expect(warningDeprecation?.level).toBe(DeprecationLevel.WARNING);

      // Info level (basic deprecation)
      const infoMapping: PropertyMapping = {
        source: 'legacy',
        target: 'legacy',
        deprecated: true,
      };

      const infoDeprecation = handler.registerDeprecation('Button', infoMapping, context);
      expect(infoDeprecation?.level).toBe(DeprecationLevel.INFO);
    });

    it('should track source location', () => {
      const propertyMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      const deprecation = handler.registerDeprecation('Button', propertyMapping, context);

      expect(deprecation?.sourceLocation.file).toBe('test.tsx');
      expect(deprecation?.sourceLocation.line).toBe(10);
      expect(deprecation?.sourceLocation.column).toBe(5);
    });
  });

  describe('component deprecation registration', () => {
    it('should register deprecated component', () => {
      const componentMapping: ComponentMapping = {
        sourceComponent: 'OldButton',
        targetComponent: 'NewButton',
        deprecated: true,
        deprecationMessage: 'Use NewButton instead',
        props: [],
      };

      const deprecation = handler.registerComponentDeprecation(componentMapping, context);

      expect(deprecation).toBeTruthy();
      expect(deprecation?.property).toBe('*');
      expect(deprecation?.component).toBe('OldButton');
      expect(deprecation?.message).toBe('Use NewButton instead');
      expect(deprecation?.alternative).toBe('NewButton');
    });

    it('should not register non-deprecated component', () => {
      const componentMapping: ComponentMapping = {
        sourceComponent: 'Button',
        targetComponent: 'Button',
        deprecated: false,
        props: [],
      };

      const deprecation = handler.registerComponentDeprecation(componentMapping, context);

      expect(deprecation).toBeNull();
    });
  });

  describe('deprecation retrieval', () => {
    beforeEach(() => {
      // Register some test deprecations
      const prop1: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };

      const prop2: PropertyMapping = {
        source: 'size',
        target: 'dimensions',
        deprecated: true,
        removalVersion: '2.0.0',
      };

      handler.registerDeprecation('Button', prop1, context);
      handler.registerDeprecation('Button', prop2, context);
    });

    it('should get deprecations for component', () => {
      const deprecations = handler.getDeprecationsForComponent('Button');

      expect(deprecations).toHaveLength(2);
      expect(deprecations.map(d => d.property)).toContain('color');
      expect(deprecations.map(d => d.property)).toContain('size');
    });

    it('should get specific property deprecation', () => {
      const deprecation = handler.getDeprecationForProperty('Button', 'color');

      expect(deprecation).toBeTruthy();
      expect(deprecation?.property).toBe('color');
      expect(deprecation?.alternative).toBe('variant');
    });

    it('should return null for non-deprecated property', () => {
      const deprecation = handler.getDeprecationForProperty('Button', 'nonexistent');

      expect(deprecation).toBeNull();
    });
  });

  describe('migration suggestions', () => {
    it('should generate migration suggestions for deprecated property', () => {
      const propertyMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        deprecationMessage: 'Use variant instead',
        alternative: 'variant',
      };

      const suggestions = handler.generateMigrationSuggestions('Button', propertyMapping);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toEqual({
        from: {
          component: 'Button',
          property: 'color',
        },
        to: {
          component: 'Button',
          property: 'variant',
        },
        reason: 'Use variant instead',
        automated: true,
        codeExample: {
          before: '<Button color="value" />',
          after: '<Button variant="value" />',
        },
      });
    });

    it('should return empty array for non-deprecated property', () => {
      const propertyMapping: PropertyMapping = {
        source: 'size',
        target: 'size',
        deprecated: false,
      };

      const suggestions = handler.generateMigrationSuggestions('Button', propertyMapping);

      expect(suggestions).toHaveLength(0);
    });

    it('should return empty array for deprecated property without alternative', () => {
      const propertyMapping: PropertyMapping = {
        source: 'legacy',
        target: 'legacy',
        deprecated: true,
      };

      const suggestions = handler.generateMigrationSuggestions('Button', propertyMapping);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('usage tracking', () => {
    it('should track usage statistics when enabled', () => {
      const config: DeprecationConfig = { enableTracking: true };
      handler = new PropDeprecationHandler(config);

      const propertyMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      // Register deprecation multiple times
      handler.registerDeprecation('Button', propertyMapping, context);
      handler.registerDeprecation('Button', propertyMapping, { ...context, sourceFile: 'test2.tsx' });
      handler.registerDeprecation('Button', propertyMapping, context);

      const stats = handler.getUsageStats('Button', 'color');

      expect(stats).toBeTruthy();
      expect(stats?.count).toBe(3);
      expect(stats?.files).toContain('test.tsx');
      expect(stats?.files).toContain('test2.tsx');
      expect(stats?.component).toBe('Button');
      expect(stats?.property).toBe('color');
    });

    it('should not track usage when disabled', () => {
      const config: DeprecationConfig = { enableTracking: false };
      handler = new PropDeprecationHandler(config);

      const propertyMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      handler.registerDeprecation('Button', propertyMapping, context);

      const stats = handler.getUsageStats('Button', 'color');
      expect(stats).toBeNull();
    });

    it('should get all usage statistics', () => {
      const prop1: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      const prop2: PropertyMapping = {
        source: 'size',
        target: 'dimensions',
        deprecated: true,
      };

      handler.registerDeprecation('Button', prop1, context);
      handler.registerDeprecation('Input', prop2, context);

      const allStats = handler.getAllUsageStats();

      expect(allStats).toHaveLength(2);
      expect(allStats.map(s => s.property)).toContain('color');
      expect(allStats.map(s => s.property)).toContain('size');
    });
  });

  describe('reporting', () => {
    beforeEach(() => {
      // Set up test data
      const errorProp: PropertyMapping = {
        source: 'oldProp',
        target: 'newProp',
        deprecated: true,
        removalVersion: '2.0.0',
      };

      const warningProp: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };

      const infoProp: PropertyMapping = {
        source: 'legacy',
        target: 'legacy',
        deprecated: true,
      };

      handler.registerDeprecation('Button', errorProp, context);
      handler.registerDeprecation('Button', warningProp, context);
      handler.registerDeprecation('Input', infoProp, context);

      // Register multiple times for usage stats
      handler.registerDeprecation('Button', warningProp, context);
      handler.registerDeprecation('Button', warningProp, context);
    });

    it('should generate comprehensive report', () => {
      const report = handler.generateReport();

      expect(report.totalDeprecations).toBe(3);
      expect(report.deprecationsByLevel.error).toBe(1);
      expect(report.deprecationsByLevel.warning).toBe(1);
      expect(report.deprecationsByLevel.info).toBe(1);

      expect(report.deprecationsByComponent).toHaveProperty('Button');
      expect(report.deprecationsByComponent).toHaveProperty('Input');
      expect(report.deprecationsByComponent.Button).toHaveLength(2);
      expect(report.deprecationsByComponent.Input).toHaveLength(1);

      expect(report.mostUsedDeprecations).toHaveLength(3);
      expect(report.mostUsedDeprecations[0].property).toBe('color'); // Most used
      expect(report.mostUsedDeprecations[0].count).toBe(3);

      expect(report.migrationSuggestions).toContain("Replace 'color' with 'variant' in Button");
    });

    it('should detect error-level deprecations', () => {
      expect(handler.hasErrors()).toBe(true);

      // Clear and add only non-error deprecations
      handler.clear();
      const warningProp: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };
      handler.registerDeprecation('Button', warningProp, context);

      expect(handler.hasErrors()).toBe(false);
    });
  });

  describe('output formats', () => {
    beforeEach(() => {
      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
        deprecationMessage: 'Use variant instead',
      };

      handler.registerDeprecation('Button', prop, context);
    });

    it('should format report as JSON', () => {
      const config: DeprecationConfig = { outputFormat: 'json' };
      handler = new PropDeprecationHandler(config);

      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };

      handler.registerDeprecation('Button', prop, context);
      const report = handler.generateReport();
      const output = handler.outputReport(report);

      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.totalDeprecations).toBe(1);
    });

    it('should format report as console output', () => {
      const config: DeprecationConfig = { outputFormat: 'console' };
      handler = new PropDeprecationHandler(config);

      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };

      handler.registerDeprecation('Button', prop, context);
      const report = handler.generateReport();
      const output = handler.outputReport(report);

      expect(output).toContain('📊 Deprecation Report');
      expect(output).toContain('Total Deprecations: 1');
      expect(output).toContain('💡 Migration Suggestions:');
    });

    it('should format report as Markdown', () => {
      const config: DeprecationConfig = { outputFormat: 'markdown' };
      handler = new PropDeprecationHandler(config);

      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };

      handler.registerDeprecation('Button', prop, context);
      const report = handler.generateReport();
      const output = handler.outputReport(report);

      expect(output).toContain('# Deprecation Report');
      expect(output).toContain('## Summary');
      expect(output).toContain('**Total Deprecations:** 1');
      expect(output).toContain('| Component | Property |');
    });

    it('should format report as HTML', () => {
      const config: DeprecationConfig = { outputFormat: 'html' };
      handler = new PropDeprecationHandler(config);

      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        alternative: 'variant',
      };

      handler.registerDeprecation('Button', prop, context);
      const report = handler.generateReport();
      const output = handler.outputReport(report);

      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('<title>Deprecation Report</title>');
      expect(output).toContain('<h1>Deprecation Report</h1>');
      expect(output).toContain('Total Deprecations: 1');
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultHandler = new PropDeprecationHandler();
      
      // Test that default config is applied by checking behavior
      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      defaultHandler.registerDeprecation('Button', prop, context);
      const stats = defaultHandler.getUsageStats('Button', 'color');
      
      expect(stats).toBeTruthy(); // Tracking should be enabled by default
    });

    it('should respect custom configuration', () => {
      const config: DeprecationConfig = {
        enableTracking: false,
        enableReporting: false,
        failOnError: true,
        outputFormat: 'json',
      };

      const customHandler = new PropDeprecationHandler(config);
      
      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      customHandler.registerDeprecation('Button', prop, context);
      const stats = customHandler.getUsageStats('Button', 'color');
      
      expect(stats).toBeNull(); // Tracking should be disabled
    });
  });

  describe('edge cases', () => {
    it('should handle empty deprecation message', () => {
      const propertyMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
        // No deprecationMessage provided
      };

      const deprecation = handler.registerDeprecation('Button', propertyMapping, context);

      expect(deprecation?.message).toBe("Property 'color' is deprecated");
    });

    it('should handle missing context properties', () => {
      const minimalContext: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {},
        // No line or column
      };

      const propertyMapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      const deprecation = handler.registerDeprecation('Button', propertyMapping, minimalContext);

      expect(deprecation).toBeTruthy();
      expect(deprecation?.sourceLocation.file).toBe('test.tsx');
      expect(deprecation?.sourceLocation.line).toBeUndefined();
      expect(deprecation?.sourceLocation.column).toBeUndefined();
    });

    it('should handle clearing deprecations', () => {
      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      handler.registerDeprecation('Button', prop, context);
      
      expect(handler.generateReport().totalDeprecations).toBe(1);
      expect(handler.getAllUsageStats()).toHaveLength(1);

      handler.clear();

      expect(handler.generateReport().totalDeprecations).toBe(0);
      expect(handler.getAllUsageStats()).toHaveLength(0);
    });

    it('should handle unknown components and properties', () => {
      const deprecations = handler.getDeprecationsForComponent('UnknownComponent');
      expect(deprecations).toHaveLength(0);

      const deprecation = handler.getDeprecationForProperty('UnknownComponent', 'unknownProp');
      expect(deprecation).toBeNull();

      const stats = handler.getUsageStats('UnknownComponent', 'unknownProp');
      expect(stats).toBeNull();
    });
  });

  describe('performance', () => {
    it('should handle large numbers of deprecations efficiently', () => {
      const start = performance.now();

      // Register many deprecations
      for (let i = 0; i < 1000; i++) {
        const prop: PropertyMapping = {
          source: `prop${i}`,
          target: `newProp${i}`,
          deprecated: true,
          alternative: `newProp${i}`,
        };

        handler.registerDeprecation(`Component${i % 10}`, prop, {
          ...context,
          sourceFile: `file${i % 5}.tsx`,
        });
      }

      const registrationTime = performance.now() - start;

      const reportStart = performance.now();
      const report = handler.generateReport();
      const reportTime = performance.now() - reportStart;

      expect(report.totalDeprecations).toBe(1000);
      expect(registrationTime).toBeLessThan(100); // Should be fast
      expect(reportTime).toBeLessThan(50); // Report generation should be fast
    });

    it('should handle frequent usage tracking efficiently', () => {
      const prop: PropertyMapping = {
        source: 'color',
        target: 'variant',
        deprecated: true,
      };

      const start = performance.now();

      // Track many usages
      for (let i = 0; i < 10000; i++) {
        handler.registerDeprecation('Button', prop, {
          ...context,
          sourceFile: `file${i % 100}.tsx`,
        });
      }

      const duration = performance.now() - start;
      const stats = handler.getUsageStats('Button', 'color');

      expect(stats?.count).toBe(10000);
      expect(stats?.files).toHaveLength(100); // 100 unique files
      expect(duration).toBeLessThan(200); // Should complete quickly
    });
  });
});