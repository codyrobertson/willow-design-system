import * as postcss from 'postcss';
import type {
  CSSModule,
  CSSModuleClass,
  CSSRule,
  CSSModuleImport,
  CSSModuleParseResult,
  CSSModulesTransformOptions,
} from '../../types/css-modules.types';
import type { StyleParser, StyleTransformationContext } from '../../types/style-transformation.types';

/**
 * Parser for CSS Modules
 */
export class CSSModulesParser implements StyleParser<CSSModule> {
  private options: CSSModulesTransformOptions;

  constructor(options: CSSModulesTransformOptions = {}) {
    this.options = options;
  }

  /**
   * Parse CSS Module content
   */
  parse(
    input: string | any,
    context: StyleTransformationContext
  ): CSSModule {
    if (typeof input !== 'string') {
      throw new Error('CSS Modules parser expects string input');
    }

    const module: CSSModule = {
      filePath: context.filePath || '',
      classes: new Map(),
      variables: new Map(),
      imports: [],
      exports: new Map(),
      rawContent: input,
    };

    try {
      const ast = postcss.parse(input, { from: context.filePath });
      this.parseAST(ast, module, context);
    } catch (error) {
      // Fallback to simple parsing if PostCSS fails
      this.parseSimple(input, module, context);
    }

    return module;
  }

  /**
   * Serialize CSS Module back to string
   */
  serialize(
    parsed: CSSModule,
    context: StyleTransformationContext
  ): string {
    const lines: string[] = [];

    // Add imports
    if (parsed.imports && parsed.imports.length > 0) {
      for (const imp of parsed.imports) {
        const importedClasses = Array.from(imp.imports.entries())
          .map(([imported, local]) => `${imported} as ${local}`)
          .join(', ');
        lines.push(`@import "${imp.from}" { ${importedClasses} };`);
      }
      lines.push('');
    }

    // Add classes
    for (const [className, classData] of parsed.classes) {
      // Handle composition
      if (classData.isComposed && classData.composesFrom) {
        lines.push(`.${className} {`);
        lines.push(`  composes: ${classData.composesFrom.join(' ')};`);
        
        if (classData.rules && classData.rules.length > 0) {
          for (const rule of classData.rules) {
            const importance = rule.important ? ' !important' : '';
            lines.push(`  ${rule.property}: ${rule.value}${importance};`);
          }
        }
        
        lines.push('}');
      } else if (classData.rules && classData.rules.length > 0) {
        lines.push(`.${className} {`);
        for (const rule of classData.rules) {
          const importance = rule.important ? ' !important' : '';
          lines.push(`  ${rule.property}: ${rule.value}${importance};`);
        }
        lines.push('}');
      }
      lines.push('');
    }

    // Add variables
    if (parsed.variables && parsed.variables.size > 0) {
      lines.push(':root {');
      for (const [varName, varValue] of parsed.variables) {
        lines.push(`  ${varName}: ${varValue};`);
      }
      lines.push('}');
    }

    return lines.join('\n').trim();
  }

  /**
   * Parse CSS using PostCSS AST
   */
  private parseAST(
    ast: postcss.Root,
    module: CSSModule,
    context: StyleTransformationContext
  ): void {
    ast.walkRules((rule) => {
      // Skip keyframe rules
      if (rule.parent && rule.parent.type === 'atrule' && 
          (rule.parent as postcss.AtRule).name === 'keyframes') {
        return;
      }

      // Parse class selectors
      const classMatches = rule.selector.match(/\.([a-zA-Z0-9_-]+)/g);
      if (classMatches) {
        for (const match of classMatches) {
          const className = match.substring(1); // Remove leading dot
          const classData = this.getOrCreateClass(module, className);
          
          // Parse rules within the class
          rule.walkDecls((decl) => {
            if (decl.prop === 'composes') {
              // Handle composition
              classData.isComposed = true;
              classData.composesFrom = decl.value.split(/\s+/).filter(Boolean);
            } else {
              // Regular CSS rule
              if (!classData.rules) {
                classData.rules = [];
              }
              classData.rules.push({
                property: decl.prop,
                value: decl.value,
                important: decl.important,
              });
            }
          });
        }
      }

      // Parse CSS variables in :root
      if (rule.selector.includes(':root')) {
        rule.walkDecls((decl) => {
          if (decl.prop.startsWith('--')) {
            module.variables?.set(decl.prop, decl.value);
          }
        });
      }
    });

    // Parse @import rules
    ast.walkAtRules('import', (atRule) => {
      const importMatch = atRule.params.match(/["']([^"']+)["']/);
      if (importMatch) {
        const imp: CSSModuleImport = {
          from: importMatch[1],
          imports: new Map(),
        };
        module.imports?.push(imp);
      }
    });

    // Parse @value rules (CSS Modules specific)
    ast.walkAtRules('value', (atRule) => {
      const valueMatch = atRule.params.match(/([a-zA-Z0-9_-]+)\s*:\s*(.+)/);
      if (valueMatch) {
        module.variables?.set(valueMatch[1], valueMatch[2]);
      }
    });
  }

  /**
   * Simple parsing fallback when PostCSS is not available
   */
  private parseSimple(
    content: string,
    module: CSSModule,
    context: StyleTransformationContext
  ): void {
    // Parse class definitions
    const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const rulesContent = match[2];
      const classData = this.getOrCreateClass(module, className);
      
      // Parse rules
      const ruleRegex = /([a-zA-Z-]+)\s*:\s*([^;]+);?/g;
      let ruleMatch;
      
      while ((ruleMatch = ruleRegex.exec(rulesContent)) !== null) {
        const prop = ruleMatch[1].trim();
        const value = ruleMatch[2].trim();
        
        if (prop === 'composes') {
          classData.isComposed = true;
          classData.composesFrom = value.split(/\s+/).filter(Boolean);
        } else {
          if (!classData.rules) {
            classData.rules = [];
          }
          classData.rules.push({
            property: prop,
            value: value.replace(/\s*!important\s*$/, ''),
            important: value.includes('!important'),
          });
        }
      }
    }

    // Parse CSS variables
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    while ((match = varRegex.exec(content)) !== null) {
      module.variables?.set(`--${match[1]}`, match[2].trim());
    }

    // Parse @import statements
    const importRegex = /@import\s+["']([^"']+)["']/g;
    while ((match = importRegex.exec(content)) !== null) {
      module.imports?.push({
        from: match[1],
        imports: new Map(),
      });
    }
  }

  /**
   * Get or create a class in the module
   */
  private getOrCreateClass(module: CSSModule, className: string): CSSModuleClass {
    let classData = module.classes.get(className);
    if (!classData) {
      classData = {
        originalName: className,
        localName: this.generateLocalName(className, module.filePath),
      };
      module.classes.set(className, classData);
    }
    return classData;
  }

  /**
   * Generate local scoped name for a class
   */
  private generateLocalName(className: string, filePath: string): string {
    if (this.options.generateScopedName) {
      return this.options.generateScopedName(className, filePath, '');
    }
    
    // Default: [name]__[hash]
    const hash = this.simpleHash(filePath + className).substring(0, 6);
    return `${className}__${hash}`;
  }

  /**
   * Simple hash function for generating unique identifiers
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Parse a CSS Module with additional context
   */
  parseWithResult(
    input: string,
    context: StyleTransformationContext
  ): CSSModuleParseResult {
    const module = this.parse(input, context);
    const warnings: string[] = [];
    const dependencies: string[] = [];

    // Collect dependencies
    if (module.imports) {
      for (const imp of module.imports) {
        dependencies.push(imp.from);
      }
    }

    // Check for potential issues
    for (const [className, classData] of module.classes) {
      if (classData.isComposed && classData.composesFrom) {
        for (const composedClass of classData.composesFrom) {
          // Check if composed class exists locally or is imported
          if (!module.classes.has(composedClass) && 
              !this.isImportedClass(composedClass, module)) {
            warnings.push(`Class "${className}" composes from undefined class "${composedClass}"`);
          }
        }
      }
    }

    return {
      module,
      warnings: warnings.length > 0 ? warnings : undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
    };
  }

  /**
   * Check if a class is imported
   */
  private isImportedClass(className: string, module: CSSModule): boolean {
    if (!module.imports) return false;
    
    for (const imp of module.imports) {
      if (Array.from(imp.imports.values()).includes(className)) {
        return true;
      }
    }
    
    return false;
  }
}