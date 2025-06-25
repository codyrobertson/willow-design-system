#!/usr/bin/env tsx

import { 
  PropDeprecationHandler,
  DeprecationLevel,
  type DeprecationConfig 
} from './src/handlers/prop-deprecation-handler.js';
import type { PropertyMapping, ComponentMapping } from './src/schemas/component-mapping.schema.js';
import type { ComponentMappingContext } from './src/types/component-mapping.types.js';

async function runTests() {
  console.log('🧪 Testing PropDeprecationHandler...\n');
  
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const handler = new PropDeprecationHandler();
  const context: ComponentMappingContext = {
    sourceFile: 'test.tsx',
    targetFile: 'test.tsx',
    componentName: 'Button',
    props: {},
    line: 10,
    column: 5,
  };

  // Test property deprecation registration
  test('Property deprecation registration', () => {
    const propertyMapping: PropertyMapping = {
      source: 'color',
      target: 'variant',
      deprecated: true,
      deprecationMessage: 'Use variant instead of color',
      alternative: 'variant',
    };

    const deprecation = handler.registerDeprecation('Button', propertyMapping, context);

    if (!deprecation) throw new Error('Expected deprecation to be registered');
    if (deprecation.property !== 'color') throw new Error(`Expected property 'color', got '${deprecation.property}'`);
    if (deprecation.component !== 'Button') throw new Error(`Expected component 'Button', got '${deprecation.component}'`);
    if (deprecation.level !== DeprecationLevel.WARNING) throw new Error(`Expected WARNING level, got '${deprecation.level}'`);
  });

  test('Non-deprecated property should return null', () => {
    const propertyMapping: PropertyMapping = {
      source: 'size',
      target: 'size',
      deprecated: false,
    };

    const deprecation = handler.registerDeprecation('Button', propertyMapping, context);

    if (deprecation !== null) throw new Error('Expected null for non-deprecated property');
  });

  test('Deprecation level determination', () => {
    // Error level (has removal version)
    const errorMapping: PropertyMapping = {
      source: 'oldProp',
      target: 'newProp',
      deprecated: true,
      removalVersion: '2.0.0',
    };

    const errorDeprecation = handler.registerDeprecation('Button', errorMapping, context);
    if (errorDeprecation?.level !== DeprecationLevel.ERROR) {
      throw new Error(`Expected ERROR level, got '${errorDeprecation?.level}'`);
    }

    // Warning level (has alternative)
    const warningMapping: PropertyMapping = {
      source: 'color2',
      target: 'variant2',
      deprecated: true,
      alternative: 'variant2',
    };

    const warningDeprecation = handler.registerDeprecation('Button', warningMapping, context);
    if (warningDeprecation?.level !== DeprecationLevel.WARNING) {
      throw new Error(`Expected WARNING level, got '${warningDeprecation?.level}'`);
    }

    // Info level (basic deprecation)
    const infoMapping: PropertyMapping = {
      source: 'legacy',
      target: 'legacy',
      deprecated: true,
    };

    const infoDeprecation = handler.registerDeprecation('Button', infoMapping, context);
    if (infoDeprecation?.level !== DeprecationLevel.INFO) {
      throw new Error(`Expected INFO level, got '${infoDeprecation?.level}'`);
    }
  });

  test('Component deprecation registration', () => {
    const componentMapping: ComponentMapping = {
      sourceComponent: 'OldButton',
      targetComponent: 'NewButton',
      deprecated: true,
      deprecationMessage: 'Use NewButton instead',
      props: [],
    };

    const deprecation = handler.registerComponentDeprecation(componentMapping, context);

    if (!deprecation) throw new Error('Expected component deprecation to be registered');
    if (deprecation.property !== '*') throw new Error(`Expected property '*', got '${deprecation.property}'`);
    if (deprecation.component !== 'OldButton') throw new Error(`Expected component 'OldButton', got '${deprecation.component}'`);
    if (deprecation.alternative !== 'NewButton') throw new Error(`Expected alternative 'NewButton', got '${deprecation.alternative}'`);
  });

  test('Get deprecations for component', () => {
    const deprecations = handler.getDeprecationsForComponent('Button');

    if (deprecations.length < 3) throw new Error(`Expected at least 3 deprecations, got ${deprecations.length}`);
    
    const properties = deprecations.map(d => d.property);
    if (!properties.includes('color')) throw new Error("Expected 'color' property in deprecations");
  });

  test('Get specific property deprecation', () => {
    const deprecation = handler.getDeprecationForProperty('Button', 'color');

    if (!deprecation) throw new Error('Expected to find deprecation for Button.color');
    if (deprecation.property !== 'color') throw new Error(`Expected property 'color', got '${deprecation.property}'`);
  });

  test('Migration suggestions generation', () => {
    const propertyMapping: PropertyMapping = {
      source: 'size',
      target: 'dimensions',
      deprecated: true,
      deprecationMessage: 'Use dimensions instead',
      alternative: 'dimensions',
    };

    const suggestions = handler.generateMigrationSuggestions('Button', propertyMapping);

    if (suggestions.length !== 1) throw new Error(`Expected 1 suggestion, got ${suggestions.length}`);
    
    const suggestion = suggestions[0];
    if (suggestion.from.property !== 'size') throw new Error(`Expected from property 'size', got '${suggestion.from.property}'`);
    if (suggestion.to.property !== 'dimensions') throw new Error(`Expected to property 'dimensions', got '${suggestion.to.property}'`);
    if (!suggestion.automated) throw new Error('Expected suggestion to be automated');
  });

  test('Usage tracking', () => {
    const trackingHandler = new PropDeprecationHandler({ enableTracking: true });
    
    const propertyMapping: PropertyMapping = {
      source: 'testProp',
      target: 'newTestProp',
      deprecated: true,
    };

    // Register multiple times
    trackingHandler.registerDeprecation('TestComponent', propertyMapping, context);
    trackingHandler.registerDeprecation('TestComponent', propertyMapping, { ...context, sourceFile: 'test2.tsx' });
    trackingHandler.registerDeprecation('TestComponent', propertyMapping, context);

    const stats = trackingHandler.getUsageStats('TestComponent', 'testProp');

    if (!stats) throw new Error('Expected usage stats to be tracked');
    if (stats.count !== 3) throw new Error(`Expected count 3, got ${stats.count}`);
    if (stats.files.length !== 2) throw new Error(`Expected 2 files, got ${stats.files.length}`);
  });

  test('Report generation', () => {
    const report = handler.generateReport();

    if (report.totalDeprecations === 0) throw new Error('Expected some deprecations in report');
    if (typeof report.deprecationsByLevel.error !== 'number') throw new Error('Expected error count to be a number');
    if (typeof report.deprecationsByLevel.warning !== 'number') throw new Error('Expected warning count to be a number');
    if (typeof report.deprecationsByLevel.info !== 'number') throw new Error('Expected info count to be a number');
    if (!Array.isArray(report.migrationSuggestions)) throw new Error('Expected migration suggestions to be an array');
  });

  test('Error detection', () => {
    const hasErrors = handler.hasErrors();
    if (!hasErrors) throw new Error('Expected to detect error-level deprecations');

    // Test with clean handler
    const cleanHandler = new PropDeprecationHandler();
    const warningProp: PropertyMapping = {
      source: 'warning',
      target: 'warning',
      deprecated: true,
      alternative: 'newWarning',
    };
    cleanHandler.registerDeprecation('Button', warningProp, context);

    if (cleanHandler.hasErrors()) throw new Error('Expected no errors with only warning-level deprecations');
  });

  test('JSON output format', () => {
    const jsonHandler = new PropDeprecationHandler({ outputFormat: 'json' });
    
    const prop: PropertyMapping = {
      source: 'jsonTest',
      target: 'jsonTest',
      deprecated: true,
    };
    
    jsonHandler.registerDeprecation('Button', prop, context);
    const report = jsonHandler.generateReport();
    const output = jsonHandler.outputReport(report);

    try {
      const parsed = JSON.parse(output);
      if (typeof parsed.totalDeprecations !== 'number') {
        throw new Error('Expected totalDeprecations to be a number in JSON output');
      }
    } catch (error) {
      throw new Error('Expected valid JSON output');
    }
  });

  test('Console output format', () => {
    const consoleHandler = new PropDeprecationHandler({ outputFormat: 'console' });
    
    const prop: PropertyMapping = {
      source: 'consoleTest',
      target: 'consoleTest',
      deprecated: true,
    };
    
    consoleHandler.registerDeprecation('Button', prop, context);
    const report = consoleHandler.generateReport();
    const output = consoleHandler.outputReport(report);

    if (!output.includes('📊 Deprecation Report')) {
      throw new Error('Expected console output to contain report header');
    }
    if (!output.includes('Total Deprecations:')) {
      throw new Error('Expected console output to contain total deprecations');
    }
  });

  test('Markdown output format', () => {
    const markdownHandler = new PropDeprecationHandler({ outputFormat: 'markdown' });
    
    const prop: PropertyMapping = {
      source: 'markdownTest',
      target: 'markdownTest',
      deprecated: true,
    };
    
    markdownHandler.registerDeprecation('Button', prop, context);
    const report = markdownHandler.generateReport();
    const output = markdownHandler.outputReport(report);

    if (!output.includes('# Deprecation Report')) {
      throw new Error('Expected markdown output to contain h1 header');
    }
    if (!output.includes('## Summary')) {
      throw new Error('Expected markdown output to contain summary section');
    }
  });

  test('HTML output format', () => {
    const htmlHandler = new PropDeprecationHandler({ outputFormat: 'html' });
    
    const prop: PropertyMapping = {
      source: 'htmlTest',
      target: 'htmlTest',
      deprecated: true,
    };
    
    htmlHandler.registerDeprecation('Button', prop, context);
    const report = htmlHandler.generateReport();
    const output = htmlHandler.outputReport(report);

    if (!output.includes('<!DOCTYPE html>')) {
      throw new Error('Expected HTML output to contain DOCTYPE');
    }
    if (!output.includes('<title>Deprecation Report</title>')) {
      throw new Error('Expected HTML output to contain title');
    }
  });

  test('Clear functionality', () => {
    const clearHandler = new PropDeprecationHandler();
    
    const prop: PropertyMapping = {
      source: 'clearTest',
      target: 'clearTest',
      deprecated: true,
    };
    
    clearHandler.registerDeprecation('Button', prop, context);
    
    if (clearHandler.generateReport().totalDeprecations === 0) {
      throw new Error('Expected deprecations before clear');
    }
    
    clearHandler.clear();
    
    if (clearHandler.generateReport().totalDeprecations !== 0) {
      throw new Error('Expected no deprecations after clear');
    }
  });

  test('Performance with many deprecations', () => {
    const perfHandler = new PropDeprecationHandler();
    const start = performance.now();

    // Register many deprecations
    for (let i = 0; i < 100; i++) {
      const prop: PropertyMapping = {
        source: `prop${i}`,
        target: `newProp${i}`,
        deprecated: true,
        alternative: `newProp${i}`,
      };

      perfHandler.registerDeprecation(`Component${i % 10}`, prop, {
        ...context,
        sourceFile: `file${i % 5}.tsx`,
      });
    }

    const registrationTime = performance.now() - start;

    const reportStart = performance.now();
    const report = perfHandler.generateReport();
    const reportTime = performance.now() - reportStart;

    if (report.totalDeprecations !== 100) {
      throw new Error(`Expected 100 deprecations, got ${report.totalDeprecations}`);
    }
    if (registrationTime > 50) {
      throw new Error(`Registration took too long: ${registrationTime}ms`);
    }
    if (reportTime > 25) {
      throw new Error(`Report generation took too long: ${reportTime}ms`);
    }
  });

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed!');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});