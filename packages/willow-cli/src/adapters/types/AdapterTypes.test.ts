import { describe, it, expect } from 'vitest';
import {
  // Base types
  AdapterId,
  SemVer,
  ComponentName,
  LifecyclePhase,
  AdapterCapability,
  SeverityLevel,
  LogLevel,
  
  // Configuration types
  AdapterConfig,
  AdapterOptions,
  ThemeConfig,
  
  // Component types
  ComponentConfig,
  ComponentType,
  ComponentVariant,
  ComponentMapping,
  ComponentMetadata,
  PropDocumentation,
  
  // Style types
  StyleConfig,
  ResponsiveStyles,
  LayoutStyles,
  TypographyStyles,
  ColorStyles,
  SpacingStyles,
  BorderStyles,
  EffectStyles,
  AnimationStyles,
  
  // Token types
  TokenConfig,
  ColorTokens,
  ColorScale,
  TypographyTokens,
  SpacingTokens,
  BorderTokens,
  ShadowTokens,
  AnimationTokens,
  BreakpointTokens,
  
  // Validation types
  ValidationResult,
  ValidationError,
  ValidationWarning,
  
  // Registry types
  AdapterRegistryEntry,
  AdapterInstance,
  AdapterStats,
  PerformanceMetrics,
  RegistryMetadata,
  
  // Event types
  AdapterEventType,
  AdapterEvent,
  EventMetadata,
  
  // Plugin types
  AdapterPlugin,
  
  // Utility types
  DeepPartial,
  RequireFields,
  OptionalFields,
  KeysOfType,
  Brand,
  JSONSerializable,
  AsyncFunction,
  Callback,
  EventListener,
  Constructor,
  Mixin,
  
  // Type guards
  isAdapterConfig,
  isComponentMapping,
  isValidationResult,
  isAdapterInstance,
} from './AdapterTypes.js';

describe('AdapterTypes', () => {
  describe('Base Types', () => {
    it('should define AdapterId as string', () => {
      const adapterId: AdapterId = 'test-adapter-123';
      expect(typeof adapterId).toBe('string');
    });

    it('should define SemVer as string', () => {
      const version: SemVer = '1.2.3';
      expect(typeof version).toBe('string');
    });

    it('should define ComponentName as string', () => {
      const componentName: ComponentName = 'Button';
      expect(typeof componentName).toBe('string');
    });

    it('should accept valid LifecyclePhase values', () => {
      const phases: LifecyclePhase[] = [
        'initialization',
        'configuration',
        'validation',
        'registration',
        'activation',
        'operation',
        'cleanup',
        'destruction',
      ];
      
      phases.forEach(phase => {
        expect(typeof phase).toBe('string');
      });
    });

    it('should accept valid AdapterCapability values', () => {
      const capabilities: AdapterCapability[] = [
        'component-mapping',
        'style-translation',
        'token-conversion',
        'theme-switching',
        'accessibility-enhancement',
        'performance-optimization',
        'hot-reloading',
        'code-generation',
        'documentation-generation',
        'testing-integration',
      ];
      
      capabilities.forEach(capability => {
        expect(typeof capability).toBe('string');
      });
    });

    it('should accept valid SeverityLevel values', () => {
      const severities: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];
      severities.forEach(severity => {
        expect(typeof severity).toBe('string');
      });
    });

    it('should accept valid LogLevel values', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      levels.forEach(level => {
        expect(typeof level).toBe('string');
      });
    });
  });

  describe('Configuration Types', () => {
    it('should create valid AdapterConfig', () => {
      const config: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        displayName: 'Test Adapter',
        description: 'A test adapter for testing',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com',
        },
        license: 'MIT',
        homepage: 'https://test-adapter.com',
        repository: {
          type: 'git',
          url: 'https://github.com/test/test-adapter',
        },
        keywords: ['test', 'adapter', 'ui'],
        capabilities: ['component-mapping', 'style-translation'],
        framework: {
          name: 'react',
          version: '18.0.0',
          minVersion: '17.0.0',
          maxVersion: '19.0.0',
        },
        dependencies: {
          'react': '^18.0.0',
        },
        peerDependencies: {
          'react-dom': '^18.0.0',
        },
        optionalDependencies: {
          'framer-motion': '^10.0.0',
        },
        options: {
          theme: {
            mode: 'light',
          },
          accessibility: {
            enabled: true,
            level: 'AA',
          },
          performance: {
            mode: 'development',
            caching: true,
          },
        },
        metadata: {
          customField: 'customValue',
        },
      };

      expect(config.name).toBe('test-adapter');
      expect(config.capabilities).toContain('component-mapping');
      expect(config.framework.name).toBe('react');
      expect(config.options.accessibility?.enabled).toBe(true);
    });

    it('should create valid AdapterOptions with all features', () => {
      const options: AdapterOptions = {
        theme: {
          mode: 'dark',
          customThemes: {
            'my-theme': {
              id: 'my-theme',
              name: 'My Custom Theme',
              colors: {
                primary: {
                  500: '#3b82f6',
                },
              },
            },
          },
        },
        locale: {
          language: 'en',
          region: 'US',
          rtl: false,
        },
        accessibility: {
          enabled: true,
          level: 'AAA',
          announcements: true,
          highContrast: false,
          reducedMotion: true,
        },
        performance: {
          mode: 'production',
          caching: true,
          cacheSize: 1000,
          lazyLoading: true,
          debounceTime: 300,
          throttleTime: 100,
        },
        development: {
          hotReload: true,
          debugging: true,
          strictMode: true,
          deprecationWarnings: true,
          logLevel: 'debug',
        },
        testing: {
          enabled: true,
          coverage: true,
          snapshots: true,
          accessibility: true,
        },
        custom: {
          customOption: 'value',
        },
      };

      expect(options.theme?.mode).toBe('dark');
      expect(options.locale?.language).toBe('en');
      expect(options.accessibility?.level).toBe('AAA');
      expect(options.performance?.cacheSize).toBe(1000);
      expect(options.development?.logLevel).toBe('debug');
      expect(options.testing?.enabled).toBe(true);
    });

    it('should create valid ThemeConfig', () => {
      const theme: ThemeConfig = {
        id: 'custom-theme',
        name: 'Custom Theme',
        description: 'A custom theme for testing',
        extends: 'base-theme',
        colors: {
          primary: {
            50: '#eff6ff',
            500: '#3b82f6',
            900: '#1e3a8a',
          },
          semantic: {
            success: {
              500: '#10b981',
            },
            error: {
              500: '#ef4444',
            },
          },
        },
        typography: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          fontSize: {
            base: '16px',
            lg: '18px',
          },
        },
        spacing: {
          1: '4px',
          2: '8px',
          4: '16px',
        },
        custom: {
          customToken: 'value',
        },
      };

      expect(theme.id).toBe('custom-theme');
      expect(theme.colors?.primary?.[500]).toBe('#3b82f6');
      expect(theme.typography?.fontFamily?.sans).toContain('Inter');
      expect(theme.spacing?.[4]).toBe('16px');
    });
  });

  describe('Component Types', () => {
    it('should create valid ComponentConfig', () => {
      const config: ComponentConfig = {
        name: 'Button',
        type: ComponentType.Button,
        props: {
          variant: 'primary',
          size: 'md',
        },
        children: 'Click me',
        variants: [
          {
            name: 'primary',
            props: {
              className: 'btn-primary',
            },
            styles: {
              base: {
                backgroundColor: 'blue',
              },
            },
            isDefault: true,
            description: 'Primary button variant',
          },
        ],
        defaultProps: {
          type: 'button',
        },
        metadata: {
          category: 'form',
          tags: ['interactive', 'button'],
          accessibility: {
            role: 'button',
            keyboardSupport: true,
          },
        },
      };

      expect(config.name).toBe('Button');
      expect(config.type).toBe(ComponentType.Button);
      expect(config.variants?.[0].name).toBe('primary');
      expect(config.metadata?.category).toBe('form');
    });

    it('should create valid ComponentMapping', () => {
      const mapping: ComponentMapping = {
        component: 'button',
        props: {
          className: 'btn btn-primary',
          type: 'button',
        },
        styles: {
          base: {
            padding: '8px 16px',
            borderRadius: '4px',
          },
          states: {
            hover: {
              opacity: 0.8,
            },
          },
        },
        variants: [
          {
            name: 'secondary',
            props: {
              className: 'btn btn-secondary',
            },
          },
        ],
        children: {
          allowed: true,
          transform: (children) => children,
        },
        displayName: 'AdaptedButton',
        metadata: {
          category: 'form',
          accessibility: {
            role: 'button',
          },
        },
      };

      expect(mapping.component).toBe('button');
      expect(mapping.props.className).toBe('btn btn-primary');
      expect(mapping.children?.allowed).toBe(true);
      expect(mapping.displayName).toBe('AdaptedButton');
    });

    it('should define all ComponentType enum values', () => {
      const expectedTypes = [
        'button', 'input', 'select', 'checkbox', 'radio', 'switch', 'slider',
        'modal', 'tooltip', 'popover', 'dropdown', 'menu', 'tabs', 'accordion',
        'card', 'badge', 'avatar', 'progress', 'spinner', 'alert', 'toast',
        'table', 'form', 'layout', 'grid', 'custom',
      ];

      expectedTypes.forEach(type => {
        expect(Object.values(ComponentType)).toContain(type);
      });
    });
  });

  describe('Style Types', () => {
    it('should create comprehensive StyleConfig', () => {
      const styles: StyleConfig = {
        base: {
          display: 'flex',
          alignItems: 'center',
        },
        variants: {
          primary: {
            backgroundColor: 'blue',
            color: 'white',
          },
          secondary: {
            backgroundColor: 'gray',
            color: 'black',
          },
        },
        states: {
          hover: {
            opacity: 0.8,
          },
          focus: {
            outline: '2px solid blue',
          },
          disabled: {
            opacity: 0.5,
            cursor: 'not-allowed',
          },
        },
        responsive: {
          sm: {
            fontSize: '14px',
          },
          lg: {
            fontSize: '18px',
          },
        },
        layout: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: 'auto',
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: 1.5,
        },
        colors: {
          color: '#333',
          backgroundColor: '#fff',
          borderColor: '#ccc',
        },
        spacing: {
          padding: '8px 16px',
          margin: '0',
        },
        borders: {
          border: '1px solid #ccc',
          borderRadius: '4px',
        },
        effects: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transform: 'scale(1)',
        },
        animations: {
          transition: 'all 0.2s ease',
          animation: 'fadeIn 0.3s ease-in-out',
        },
        custom: {
          customProperty: 'value',
        },
      };

      expect(styles.base?.display).toBe('flex');
      expect(styles.variants?.primary?.backgroundColor).toBe('blue');
      expect(styles.states?.hover?.opacity).toBe(0.8);
      expect(styles.responsive?.sm?.fontSize).toBe('14px');
      expect(styles.layout?.display).toBe('flex');
      expect(styles.typography?.fontFamily).toBe('Inter, sans-serif');
      expect(styles.colors?.color).toBe('#333');
      expect(styles.spacing?.padding).toBe('8px 16px');
      expect(styles.borders?.border).toBe('1px solid #ccc');
      expect(styles.effects?.boxShadow).toBe('0 2px 4px rgba(0,0,0,0.1)');
      expect(styles.animations?.transition).toBe('all 0.2s ease');
    });
  });

  describe('Token Types', () => {
    it('should create valid TokenConfig', () => {
      const tokenConfig: TokenConfig = {
        category: 'colors',
        path: 'colors.primary.500',
        value: '#3b82f6',
        metadata: {
          description: 'Primary brand color',
          usage: 'Used for primary buttons and links',
        },
        tokens: {
          colors: {
            primary: {
              50: '#eff6ff',
              500: '#3b82f6',
              900: '#1e3a8a',
            },
            semantic: {
              success: {
                500: '#10b981',
              },
            },
          },
          typography: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
            },
            fontSize: {
              base: '16px',
            },
          },
          spacing: {
            1: '4px',
            2: '8px',
          },
        },
      };

      expect(tokenConfig.category).toBe('colors');
      expect(tokenConfig.path).toBe('colors.primary.500');
      expect(tokenConfig.value).toBe('#3b82f6');
      expect(tokenConfig.tokens?.colors?.primary?.[500]).toBe('#3b82f6');
    });

    it('should create comprehensive ColorTokens', () => {
      const colors: ColorTokens = {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          500: '#6b7280',
        },
        neutral: {
          50: '#f9fafb',
          500: '#6b7280',
          900: '#111827',
        },
        success: {
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
        },
        info: {
          500: '#06b6d4',
        },
        background: {
          primary: '#ffffff',
          secondary: '#f3f4f6',
        },
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          inverse: '#ffffff',
        },
        border: {
          primary: '#d1d5db',
          focus: '#3b82f6',
          error: '#ef4444',
        },
        semantic: {
          success: {
            500: '#10b981',
          },
          warning: {
            500: '#f59e0b',
          },
          error: {
            500: '#ef4444',
          },
          info: {
            500: '#06b6d4',
          },
        },
        custom: {
          brand: '#8b5cf6',
          brandScale: {
            500: '#8b5cf6',
          },
        },
      };

      expect(colors.primary?.[500]).toBe('#3b82f6');
      expect(colors.semantic?.success?.[500]).toBe('#10b981');
      expect(colors.text?.primary).toBe('#111827');
      expect(colors.custom?.brand).toBe('#8b5cf6');
    });

    it('should create comprehensive TypographyTokens', () => {
      const typography: TypographyTokens = {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          serif: ['Georgia', 'serif'],
          mono: ['JetBrains Mono', 'monospace'],
          display: ['Playfair Display', 'serif'],
          custom: {
            brand: ['Brand Font', 'sans-serif'],
          },
        },
        fontSize: {
          xs: '12px',
          sm: '14px',
          base: '16px',
          lg: '18px',
          xl: '20px',
          '2xl': '24px',
          '3xl': '30px',
          '4xl': '36px',
          '5xl': '48px',
          '6xl': '60px',
          custom: {
            huge: '72px',
          },
        },
        fontWeight: {
          thin: 100,
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
          extrabold: 800,
          black: 900,
          custom: {
            extraLight: 200,
          },
        },
        lineHeight: {
          none: 1,
          tight: 1.25,
          snug: 1.375,
          normal: 1.5,
          relaxed: 1.625,
          loose: 2,
          custom: {
            comfortable: 1.6,
          },
        },
        letterSpacing: {
          tighter: '-0.05em',
          tight: '-0.025em',
          normal: '0em',
          wide: '0.025em',
          wider: '0.05em',
          widest: '0.1em',
          custom: {
            brand: '0.015em',
          },
        },
      };

      expect(typography.fontFamily?.sans).toContain('Inter');
      expect(typography.fontSize?.base).toBe('16px');
      expect(typography.fontWeight?.medium).toBe(500);
      expect(typography.lineHeight?.normal).toBe(1.5);
      expect(typography.letterSpacing?.normal).toBe('0em');
    });
  });

  describe('Validation Types', () => {
    it('should create valid ValidationResult', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          {
            code: 'REQUIRED_FIELD',
            message: 'Name is required',
            path: 'name',
            expected: 'string',
            actual: undefined,
            severity: 'high',
            suggestion: 'Provide a valid name for the adapter',
          },
        ],
        warnings: [
          {
            code: 'DEPRECATED_OPTION',
            message: 'Option is deprecated',
            path: 'options.oldOption',
            category: 'deprecation',
            suggestion: 'Use newOption instead',
          },
        ],
        context: {
          validatedAt: new Date(),
          validator: 'AdapterValidator',
        },
      };

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors[0].code).toBe('REQUIRED_FIELD');
      expect(result.warnings[0].code).toBe('DEPRECATED_OPTION');
    });
  });

  describe('Registry Types', () => {
    it('should create valid AdapterRegistryEntry', () => {
      const entry: AdapterRegistryEntry = {
        config: {
          name: 'test-adapter',
          version: '1.0.0',
          capabilities: ['component-mapping'],
          framework: {
            name: 'react',
            version: '18.0.0',
          },
          options: {},
        },
        registeredAt: new Date(),
        lastAccessedAt: new Date(),
        stats: {
          usageCount: 42,
          componentMappings: 20,
          styleTranslations: 15,
          tokenConversions: 7,
          errorCount: 0,
          averageDuration: 125.5,
          performance: {
            memoryUsage: {
              current: 1024000,
              peak: 2048000,
              average: 1536000,
            },
            timings: {
              initialization: 50,
              componentMapping: 25,
              styleTranslation: 30,
              tokenConversion: 15,
            },
            cache: {
              hits: 35,
              misses: 7,
              size: 128,
            },
          },
        },
        metadata: {
          priority: 1,
          tags: ['react', 'ui-kit'],
          source: 'installed',
          status: 'active',
        },
      };

      expect(entry.config.name).toBe('test-adapter');
      expect(entry.stats.usageCount).toBe(42);
      expect(entry.metadata.status).toBe('active');
    });

    it('should create valid AdapterInstance interface', () => {
      const instance: AdapterInstance = {
        id: 'test-adapter-instance',
        config: {
          name: 'test-adapter',
          version: '1.0.0',
          capabilities: ['component-mapping'],
          framework: {
            name: 'react',
            version: '18.0.0',
          },
          options: {},
        },
        initialized: true,
        async initialize() {
          // Mock implementation
        },
        mapComponent(name: string, props: Record<string, unknown>) {
          return {
            component: name.toLowerCase(),
            props,
          };
        },
        translateStyles(styles: any) {
          return styles;
        },
        convertTokens(tokens: any) {
          return tokens;
        },
        validateConfig() {
          return {
            valid: true,
            errors: [],
            warnings: [],
          };
        },
        async cleanup() {
          // Mock implementation
        },
      };

      expect(instance.id).toBe('test-adapter-instance');
      expect(instance.initialized).toBe(true);
      expect(typeof instance.initialize).toBe('function');
      expect(typeof instance.mapComponent).toBe('function');
    });
  });

  describe('Event Types', () => {
    it('should create valid AdapterEvent', () => {
      const event: AdapterEvent = {
        type: 'adapter.registered',
        timestamp: new Date(),
        adapterId: 'test-adapter',
        payload: {
          adapterName: 'test-adapter',
          version: '1.0.0',
        },
        metadata: {
          source: 'registry',
          user: {
            id: 'user123',
            session: 'session456',
          },
          request: {
            id: 'req789',
            url: '/api/adapters',
            method: 'POST',
          },
          performance: {
            duration: 150,
            memory: 1024000,
          },
        },
      };

      expect(event.type).toBe('adapter.registered');
      expect(event.adapterId).toBe('test-adapter');
      expect(event.metadata?.source).toBe('registry');
    });

    it('should define all AdapterEventType values', () => {
      const expectedTypes: AdapterEventType[] = [
        'adapter.registered',
        'adapter.unregistered',
        'adapter.initialized',
        'adapter.activated',
        'adapter.deactivated',
        'adapter.error',
        'component.mapped',
        'style.translated',
        'token.converted',
        'validation.completed',
        'performance.measured',
      ];

      expectedTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('Plugin Types', () => {
    it('should create valid AdapterPlugin', () => {
      const plugin: AdapterPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        async initialize(adapter) {
          // Mock initialization
        },
        beforeComponentMapping(name, props) {
          return { ...props, pluginProcessed: true };
        },
        afterComponentMapping(mapping) {
          return { ...mapping, pluginEnhanced: true };
        },
        beforeStyleTranslation(styles) {
          return { ...styles, pluginProcessed: true };
        },
        afterStyleTranslation(styles) {
          return { ...styles, pluginEnhanced: true };
        },
        beforeTokenConversion(tokens) {
          return { ...tokens, pluginProcessed: true };
        },
        afterTokenConversion(tokens) {
          return { ...tokens, pluginEnhanced: true };
        },
        beforeValidation(config) {
          return { ...config, pluginProcessed: true };
        },
        afterValidation(result) {
          return { ...result, pluginEnhanced: true };
        },
        onError(error, context) {
          console.log('Plugin error handler:', error.message);
        },
        async cleanup() {
          // Mock cleanup
        },
      };

      expect(plugin.name).toBe('test-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.beforeComponentMapping).toBe('function');
    });
  });

  describe('Utility Types', () => {
    it('should test DeepPartial utility type', () => {
      interface TestInterface {
        required: string;
        nested: {
          value: number;
          deep: {
            property: boolean;
          };
        };
      }

      const partial: DeepPartial<TestInterface> = {
        nested: {
          deep: {
            property: true,
          },
        },
      };

      expect(partial.nested?.deep?.property).toBe(true);
    });

    it('should test RequireFields utility type', () => {
      interface TestInterface {
        optional?: string;
        required: number;
      }

      const required: RequireFields<TestInterface, 'optional'> = {
        optional: 'now required',
        required: 42,
      };

      expect(required.optional).toBe('now required');
      expect(required.required).toBe(42);
    });

    it('should test OptionalFields utility type', () => {
      interface TestInterface {
        required: string;
        alsoRequired: number;
      }

      const optional: OptionalFields<TestInterface, 'required'> = {
        alsoRequired: 42,
      };

      expect(optional.alsoRequired).toBe(42);
    });

    it('should test Brand utility type', () => {
      type UserId = Brand<string, 'UserId'>;
      type AdapterName = Brand<string, 'AdapterName'>;

      const userId: UserId = 'user123' as UserId;
      const adapterName: AdapterName = 'test-adapter' as AdapterName;

      expect(typeof userId).toBe('string');
      expect(typeof adapterName).toBe('string');
    });

    it('should test JSONSerializable type', () => {
      const data: JSONSerializable = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 'two', true],
        nested: {
          value: 'nested',
        },
      };

      expect(typeof data).toBe('object');
      expect(JSON.stringify(data)).toBeDefined();
    });

    it('should test AsyncFunction type', () => {
      const asyncFn: AsyncFunction<[string, number], boolean> = async (str, num) => {
        return str.length > num;
      };

      expect(typeof asyncFn).toBe('function');
    });

    it('should test Callback type', () => {
      const callback: Callback<string> = (error, result) => {
        if (error) {
          console.error(error);
        } else {
          console.log(result);
        }
      };

      expect(typeof callback).toBe('function');
    });

    it('should test Constructor type', () => {
      class TestClass {
        value: string;
        constructor(value: string) {
          this.value = value;
        }
      }

      const ctor: Constructor<TestClass> = TestClass;
      const instance = new ctor('test');

      expect(instance.value).toBe('test');
    });
  });

  describe('Type Guards', () => {
    it('should validate AdapterConfig with isAdapterConfig', () => {
      const validConfig: AdapterConfig = {
        name: 'test-adapter',
        version: '1.0.0',
        capabilities: ['component-mapping'],
        framework: {
          name: 'react',
          version: '18.0.0',
        },
        options: {},
      };

      const invalidConfig = {
        name: 'test-adapter',
        // Missing required fields
      };

      expect(isAdapterConfig(validConfig)).toBe(true);
      expect(isAdapterConfig(invalidConfig)).toBe(false);
      expect(isAdapterConfig(null)).toBe(false);
      expect(isAdapterConfig('string')).toBe(false);
    });

    it('should validate ComponentMapping with isComponentMapping', () => {
      const validMapping: ComponentMapping = {
        component: 'button',
        props: {
          className: 'btn',
        },
      };

      const invalidMapping = {
        component: 'button',
        // Missing props
      };

      expect(isComponentMapping(validMapping)).toBe(true);
      expect(isComponentMapping(invalidMapping)).toBe(false);
      expect(isComponentMapping(null)).toBe(false);
    });

    it('should validate ValidationResult with isValidationResult', () => {
      const validResult: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      const invalidResult = {
        valid: true,
        // Missing arrays
      };

      expect(isValidationResult(validResult)).toBe(true);
      expect(isValidationResult(invalidResult)).toBe(false);
      expect(isValidationResult(null)).toBe(false);
    });

    it('should validate AdapterInstance with isAdapterInstance', () => {
      const validInstance: AdapterInstance = {
        id: 'test-adapter',
        config: {
          name: 'test-adapter',
          version: '1.0.0',
          capabilities: ['component-mapping'],
          framework: { name: 'react', version: '18.0.0' },
          options: {},
        },
        initialized: true,
        initialize: async () => {},
        mapComponent: () => ({ component: 'div', props: {} }),
        translateStyles: (styles) => styles,
        convertTokens: (tokens) => tokens,
        validateConfig: () => ({ valid: true, errors: [], warnings: [] }),
        cleanup: async () => {},
      };

      const invalidInstance = {
        id: 'test-adapter',
        // Missing required methods
      };

      expect(isAdapterInstance(validInstance)).toBe(true);
      expect(isAdapterInstance(invalidInstance)).toBe(false);
      expect(isAdapterInstance(null)).toBe(false);
    });
  });

  describe('Complex Type Combinations', () => {
    it('should create complex nested configuration', () => {
      const complexConfig: AdapterConfig & {
        customExtension: {
          features: string[];
          settings: Record<string, unknown>;
        };
      } = {
        name: 'complex-adapter',
        version: '2.0.0',
        capabilities: [
          'component-mapping',
          'style-translation',
          'token-conversion',
          'theme-switching',
          'accessibility-enhancement',
        ],
        framework: {
          name: 'react',
          version: '18.2.0',
          minVersion: '18.0.0',
        },
        options: {
          theme: {
            mode: 'auto',
            customThemes: {
              corporate: {
                id: 'corporate',
                name: 'Corporate Theme',
                colors: {
                  primary: {
                    50: '#f0f9ff',
                    500: '#0ea5e9',
                    900: '#0c4a6e',
                  },
                },
                typography: {
                  fontFamily: {
                    sans: ['Corporate Sans', 'sans-serif'],
                  },
                },
              },
            },
          },
          accessibility: {
            enabled: true,
            level: 'AAA',
            announcements: true,
            highContrast: true,
            reducedMotion: false,
          },
          performance: {
            mode: 'production',
            caching: true,
            cacheSize: 2000,
            lazyLoading: true,
            debounceTime: 200,
            throttleTime: 50,
          },
        },
        customExtension: {
          features: ['advanced-theming', 'dynamic-imports'],
          settings: {
            enableExperimentalFeatures: true,
            maxConcurrentOperations: 10,
          },
        },
      };

      expect(complexConfig.name).toBe('complex-adapter');
      expect(complexConfig.capabilities).toHaveLength(5);
      expect(complexConfig.options.theme?.mode).toBe('auto');
      expect(complexConfig.customExtension.features).toContain('advanced-theming');
    });

    it('should work with multiple utility types combined', () => {
      interface BaseConfig {
        required: string;
        optional?: number;
        nested: {
          value: boolean;
        };
      }

      type PartialWithRequired = RequireFields<
        DeepPartial<BaseConfig>,
        'required'
      >;

      const config: PartialWithRequired = {
        required: 'must be present',
        nested: {
          value: true,
        },
      };

      expect(config.required).toBe('must be present');
      expect(config.nested?.value).toBe(true);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle complete adapter lifecycle types', () => {
      // Simulate complete adapter creation and usage
      const adapterConfig: AdapterConfig = {
        name: 'material-ui-adapter',
        version: '1.0.0',
        displayName: 'Material-UI Adapter',
        description: 'Adapter for Material-UI components',
        capabilities: ['component-mapping', 'style-translation', 'theme-switching'],
        framework: {
          name: 'react',
          version: '18.0.0',
        },
        options: {
          theme: {
            mode: 'light',
          },
          accessibility: {
            enabled: true,
            level: 'AA',
          },
        },
      };

      const componentMapping: ComponentMapping = {
        component: 'Button',
        props: {
          variant: 'contained',
          color: 'primary',
        },
        styles: {
          base: {
            textTransform: 'none',
          },
        },
      };

      const validationResult: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      expect(isAdapterConfig(adapterConfig)).toBe(true);
      expect(isComponentMapping(componentMapping)).toBe(true);
      expect(isValidationResult(validationResult)).toBe(true);
    });

    it('should handle error and warning scenarios', () => {
      const errorResult: ValidationResult = {
        valid: false,
        errors: [
          {
            code: 'INVALID_VERSION',
            message: 'Version format is invalid',
            path: 'version',
            expected: 'semver string',
            actual: 'invalid',
            severity: 'high',
            suggestion: 'Use semantic versioning format like "1.0.0"',
          },
        ],
        warnings: [
          {
            code: 'MISSING_DESCRIPTION',
            message: 'Description is recommended',
            path: 'description',
            category: 'completeness',
            suggestion: 'Add a description to help users understand the adapter',
          },
        ],
      };

      expect(errorResult.valid).toBe(false);
      expect(errorResult.errors).toHaveLength(1);
      expect(errorResult.warnings).toHaveLength(1);
      expect(errorResult.errors[0].severity).toBe('high');
    });

    it('should handle performance monitoring types', () => {
      const performanceMetrics: PerformanceMetrics = {
        memoryUsage: {
          current: 1024 * 1024, // 1MB
          peak: 2 * 1024 * 1024, // 2MB
          average: 1.5 * 1024 * 1024, // 1.5MB
        },
        timings: {
          initialization: 150,
          componentMapping: 25,
          styleTranslation: 35,
          tokenConversion: 20,
        },
        cache: {
          hits: 85,
          misses: 15,
          size: 100,
        },
      };

      expect(performanceMetrics.memoryUsage.current).toBe(1048576);
      expect(performanceMetrics.timings.initialization).toBe(150);
      expect(performanceMetrics.cache.hits).toBe(85);
    });

    it('should handle event-driven architecture types', () => {
      const events: AdapterEvent[] = [
        {
          type: 'adapter.registered',
          timestamp: new Date(),
          adapterId: 'test-adapter',
          payload: {
            name: 'test-adapter',
            version: '1.0.0',
          },
        },
        {
          type: 'component.mapped',
          timestamp: new Date(),
          adapterId: 'test-adapter',
          payload: {
            componentName: 'Button',
            mappingTime: 25,
          },
        },
        {
          type: 'performance.measured',
          timestamp: new Date(),
          adapterId: 'test-adapter',
          payload: {
            operation: 'componentMapping',
            duration: 25,
            memoryUsed: 1024,
          },
        },
      ];

      events.forEach(event => {
        expect(event.type).toBeDefined();
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.adapterId).toBe('test-adapter');
      });
    });
  });
});