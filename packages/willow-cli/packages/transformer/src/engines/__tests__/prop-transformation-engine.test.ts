import { describe, it, expect, beforeEach } from 'vitest';
import * as ts from 'typescript';
import { PropTransformationEngine } from '../prop-transformation-engine';
import type { ComponentMappingConfig } from '../../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../../types/component-mapping.types';

describe('PropTransformationEngine', () => {
  let engine: PropTransformationEngine;
  let config: ComponentMappingConfig;

  beforeEach(() => {
    config = {
      version: '1.0.0',
      sourceUIKit: 'mui',
      targetUIKit: 'willow',
      mappings: [
        {
          sourceComponent: 'Button',
          targetComponent: 'WillowButton',
          props: [
            {
              source: 'color',
              target: 'variant',
              valueTransformation: {
                type: 'map',
                map: {
                  primary: 'primary',
                  secondary: 'secondary',
                  error: 'danger',
                },
              },
            },
            {
              source: 'disabled',
              target: 'isDisabled',
            },
            {
              source: 'size',
              target: 'size',
              conditional: [
                {
                  condition: {
                    prop: 'variant',
                    operator: 'equals',
                    value: 'icon',
                  },
                  target: 'iconSize',
                },
              ],
            },
          ],
        },
      ],
      globalPropMappings: [
        {
          source: 'className',
          target: 'class',
        },
        {
          source: 'style',
          target: 'sx',
        },
      ],
    };

    engine = new PropTransformationEngine(config);
  });

  describe('transformJsxElementProps', () => {
    it('should transform component props based on mapping', () => {
      const code = `<Button color="primary" disabled className="btn" />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {
          color: 'primary',
          disabled: true,
          className: 'btn',
        },
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      expect(result.success).toBe(true);
      expect(result.targetComponent).toBe('WillowButton');
      expect(result.propResults).toHaveLength(3);

      // Check color -> variant transformation
      const colorProp = result.propResults.find(p => p.sourceProp === 'color');
      expect(colorProp?.targetProp).toBe('variant');
      expect(colorProp?.transformedValue).toBe('primary');

      // Check disabled -> isDisabled transformation
      const disabledProp = result.propResults.find(p => p.sourceProp === 'disabled');
      expect(disabledProp?.targetProp).toBe('isDisabled');

      // Check global className -> class transformation
      const classNameProp = result.propResults.find(p => p.sourceProp === 'className');
      expect(classNameProp?.targetProp).toBe('class');
    });

    it('should handle conditional prop mappings', () => {
      const code = `<Button size="small" variant="icon" />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {
          size: 'small',
          variant: 'icon',
        },
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      // Size should be transformed to iconSize due to conditional mapping
      const sizeProp = result.propResults.find(p => p.sourceProp === 'size');
      expect(sizeProp?.targetProp).toBe('iconSize');
    });

    it('should handle value transformations', () => {
      const code = `<Button color="error" />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {
          color: 'error',
        },
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      const colorProp = result.propResults.find(p => p.sourceProp === 'color');
      expect(colorProp?.transformedValue).toBe('danger'); // error -> danger mapping
    });

    it('should warn about unmapped props when configured', () => {
      config.options = { warnOnUnmappedProps: true };
      engine = new PropTransformationEngine(config);

      const code = `<Button unknownProp="value" />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {
          unknownProp: 'value',
        },
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      expect(result.warnings).toContain('No mapping found for property unknownProp');
    });

    it('should handle deprecated components', () => {
      config.mappings[0].deprecated = true;
      config.mappings[0].deprecationMessage = 'Use NewButton instead';
      engine = new PropTransformationEngine(config);

      const code = `<Button />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {},
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      expect(result.warnings).toContain('Component Button is deprecated. Use NewButton instead');
    });

    it('should handle spread attributes', () => {
      const code = `<Button {...props} />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {},
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      const spreadProp = result.propResults.find(p => p.sourceProp === '...spread');
      expect(spreadProp).toBeDefined();
      expect(spreadProp?.targetProp).toBe('...spread');
    });
  });

  describe('createTransformedJsxElement', () => {
    it('should create new JSX element with transformed props', () => {
      const code = `<Button color="primary" disabled />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {
          color: 'primary',
          disabled: true,
        },
      };

      const mappingResult = engine.transformJsxElementProps(jsxElement!, 'Button', context);
      const transformed = engine.createTransformedJsxElement(jsxElement!, mappingResult);

      const printer = ts.createPrinter();
      const result = printer.printNode(ts.EmitHint.Unspecified, transformed, sourceFile);

      expect(result).toContain('WillowButton');
      expect(result).toContain('variant="primary"');
      expect(result).toContain('isDisabled');
    });

    it('should handle self-closing elements', () => {
      const code = `<Button color="secondary" />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {
          color: 'secondary',
        },
      };

      const mappingResult = engine.transformJsxElementProps(jsxElement!, 'Button', context);
      const transformed = engine.createTransformedJsxElement(jsxElement!, mappingResult);

      expect(ts.isJsxSelfClosingElement(transformed)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle components without mappings', () => {
      const code = `<UnmappedComponent prop="value" />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'UnmappedComponent',
        props: {
          prop: 'value',
        },
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'UnmappedComponent', context);

      expect(result.targetComponent).toBe('UnmappedComponent');
      expect(result.propResults).toHaveLength(1);
    });

    it('should handle empty props', () => {
      const code = `<Button />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {},
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      expect(result.success).toBe(true);
      expect(result.propResults).toHaveLength(0);
    });

    it('should handle boolean props without values', () => {
      const code = `<Button disabled />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: {
          disabled: true,
        },
      };

      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);

      const disabledProp = result.propResults.find(p => p.sourceProp === 'disabled');
      expect(disabledProp?.value).toBe(true);
      expect(disabledProp?.transformedValue).toBe(true);
    });
  });

  describe('performance', () => {
    it('should handle large number of props efficiently', () => {
      const props = Array.from({ length: 100 }, (_, i) => `prop${i}="value${i}"`).join(' ');
      const code = `<Button ${props} />`;
      const sourceFile = ts.createSourceFile(
        'test.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const jsxElement = findFirstJsxElement(sourceFile);
      const context: ComponentMappingContext = {
        sourceFile: 'test.tsx',
        targetFile: 'test.tsx',
        componentName: 'Button',
        props: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`prop${i}`, `value${i}`])
        ),
      };

      const start = performance.now();
      const result = engine.transformJsxElementProps(jsxElement!, 'Button', context);
      const duration = performance.now() - start;

      expect(result.propResults).toHaveLength(100);
      expect(duration).toBeLessThan(50); // Should complete quickly
    });
  });
});

// Helper function to find first JSX element in AST
function findFirstJsxElement(node: ts.Node): ts.JsxElement | ts.JsxSelfClosingElement | undefined {
  let result: ts.JsxElement | ts.JsxSelfClosingElement | undefined;

  function visit(n: ts.Node) {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      result = n;
      return;
    }
    ts.forEachChild(n, visit);
  }

  visit(node);
  return result;
}