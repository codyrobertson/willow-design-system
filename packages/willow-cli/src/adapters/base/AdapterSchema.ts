/**
 * JSON Schema definitions for adapter configuration validation
 */

/**
 * Base adapter configuration schema
 */
export const AdapterConfigSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9-_]*$',
      description: 'Adapter name (alphanumeric, hyphens, underscores only)',
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(?:-[a-zA-Z0-9.-]+)?(?:\\+[a-zA-Z0-9.-]+)?$',
      description: 'Semantic version (e.g., 1.2.3, 1.0.0-beta.1)',
    },
    options: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
          default: 'light',
        },
        rtl: {
          type: 'boolean',
          default: false,
        },
        accessibility: {
          type: 'boolean',
          default: true,
        },
        performanceMode: {
          type: 'string',
          enum: ['fast', 'balanced', 'quality'],
          default: 'balanced',
        },
        strictMode: {
          type: 'boolean',
          default: false,
        },
        debugMode: {
          type: 'boolean',
          default: false,
        },
        cacheSize: {
          type: 'integer',
          minimum: 0,
          maximum: 100000,
          default: 1000,
        },
        timeout: {
          type: 'integer',
          minimum: 100,
          maximum: 300000, // 5 minutes
          default: 10000,
        },
        retryCount: {
          type: 'integer',
          minimum: 0,
          maximum: 10,
          default: 3,
        },
        locale: {
          type: 'string',
          pattern: '^[a-z]{2}(-[A-Z]{2})?$',
          default: 'en',
          description: 'Language code (e.g., en, en-US)',
        },
        customProperties: {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    },
    customMappings: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9]*$': {
          type: 'object',
          properties: {
            component: {
              oneOf: [
                { type: 'string' },
                { type: 'object' },
              ],
            },
            props: {
              type: 'object',
              additionalProperties: true,
            },
            children: {
              type: ['string', 'object', 'array'],
            },
            wrapper: {
              type: 'object',
            },
          },
          required: ['component', 'props'],
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    styleOverrides: {
      type: 'object',
      additionalProperties: true,
    },
    tokenMappings: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9-]*$': {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
  },
  required: ['name', 'version'],
  additionalProperties: false,
} as const;

/**
 * Component configuration schema
 */
export const ComponentConfigSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      pattern: '^[A-Z][a-zA-Z0-9]*$',
      description: 'Component name in PascalCase',
    },
    type: {
      type: 'string',
      enum: [
        'button', 'input', 'select', 'checkbox', 'radio', 'switch', 'slider',
        'modal', 'tooltip', 'popover', 'dropdown', 'menu', 'tabs', 'accordion',
        'card', 'badge', 'avatar', 'progress', 'spinner', 'alert', 'toast',
        'table', 'form', 'layout', 'grid', 'custom',
      ],
    },
    props: {
      type: 'object',
      additionalProperties: true,
    },
    children: {
      type: ['string', 'object', 'array'],
    },
    variants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            pattern: '^[a-zA-Z][a-zA-Z0-9]*$',
          },
          props: {
            type: 'object',
            additionalProperties: true,
          },
          description: {
            type: 'string',
            maxLength: 200,
          },
        },
        required: ['name', 'props'],
        additionalProperties: false,
      },
    },
    defaultProps: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['name', 'type'],
  additionalProperties: false,
} as const;

/**
 * Style configuration schema
 */
export const StyleConfigSchema = {
  type: 'object',
  properties: {
    base: {
      type: 'object',
      additionalProperties: true,
    },
    variants: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9]*$': {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    },
    states: {
      type: 'object',
      patternProperties: {
        '^(hover|focus|active|disabled|selected|pressed|expanded|collapsed)$': {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    },
    responsive: {
      type: 'object',
      properties: {
        xs: { type: 'object', additionalProperties: true },
        sm: { type: 'object', additionalProperties: true },
        md: { type: 'object', additionalProperties: true },
        lg: { type: 'object', additionalProperties: true },
        xl: { type: 'object', additionalProperties: true },
        '2xl': { type: 'object', additionalProperties: true },
      },
      additionalProperties: false,
    },
    dark: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: false,
} as const;

/**
 * Token configuration schema
 */
export const TokenConfigSchema = {
  type: 'object',
  properties: {
    colors: {
      type: 'object',
      properties: {
        primary: { $ref: '#/definitions/colorScale' },
        secondary: { $ref: '#/definitions/colorScale' },
        neutral: { $ref: '#/definitions/colorScale' },
        success: { $ref: '#/definitions/colorScale' },
        warning: { $ref: '#/definitions/colorScale' },
        error: { $ref: '#/definitions/colorScale' },
        info: { $ref: '#/definitions/colorScale' },
        background: {
          type: 'object',
          additionalProperties: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        },
        foreground: {
          type: 'object',
          additionalProperties: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        },
        custom: {
          type: 'object',
          additionalProperties: {
            oneOf: [
              { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
              { $ref: '#/definitions/colorScale' },
            ],
          },
        },
      },
      additionalProperties: false,
    },
    typography: {
      type: 'object',
      properties: {
        fontFamily: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        fontSize: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        fontWeight: {
          type: 'object',
          additionalProperties: {
            oneOf: [
              { type: 'string' },
              { type: 'integer', minimum: 100, maximum: 900 },
            ],
          },
        },
        lineHeight: {
          type: 'object',
          additionalProperties: {
            oneOf: [
              { type: 'string' },
              { type: 'number', minimum: 0 },
            ],
          },
        },
        letterSpacing: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
    spacing: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      },
    },
    sizing: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      },
    },
    borders: {
      type: 'object',
      properties: {
        width: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        radius: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        style: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
    shadows: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    animations: {
      type: 'object',
      properties: {
        duration: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        easing: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        delay: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
    breakpoints: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      },
    },
    custom: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: false,
  definitions: {
    colorScale: {
      type: 'object',
      properties: {
        '50': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '100': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '200': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '300': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '400': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '500': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '600': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '700': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '800': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '900': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        '950': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
      },
      additionalProperties: false,
    },
  },
} as const;

/**
 * Adapter registration schema
 */
export const AdapterRegistrationSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9-_@/]*$',
      description: 'Adapter package name',
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(?:-[a-zA-Z0-9.-]+)?(?:\\+[a-zA-Z0-9.-]+)?$',
    },
    constructor: {
      type: 'function',
      description: 'Adapter constructor function',
    },
    description: {
      type: 'string',
      maxLength: 500,
    },
    author: {
      type: 'string',
      maxLength: 100,
    },
    homepage: {
      type: 'string',
      format: 'uri',
    },
    keywords: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
      },
      maxItems: 20,
      uniqueItems: true,
    },
    supportedVersions: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^\\d+\\.\\d+\\.\\d+(?:-[a-zA-Z0-9.-]+)?(?:\\+[a-zA-Z0-9.-]+)?$',
      },
      uniqueItems: true,
    },
    dependencies: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9][a-zA-Z0-9-_@/]*$': {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    peerDependencies: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9][a-zA-Z0-9-_@/]*$': {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['name', 'version', 'constructor'],
  additionalProperties: false,
} as const;

/**
 * Validation options schema
 */
export const ValidationOptionsSchema = {
  type: 'object',
  properties: {
    strict: {
      type: 'boolean',
      default: false,
      description: 'Enable strict validation mode',
    },
    allowAdditionalProperties: {
      type: 'boolean',
      default: true,
      description: 'Allow additional properties not defined in schema',
    },
    coerceTypes: {
      type: 'boolean',
      default: true,
      description: 'Automatically convert compatible types',
    },
    removeAdditional: {
      type: 'boolean',
      default: false,
      description: 'Remove properties not defined in schema',
    },
    useDefaults: {
      type: 'boolean',
      default: true,
      description: 'Apply default values from schema',
    },
    verbose: {
      type: 'boolean',
      default: false,
      description: 'Include detailed error information',
    },
    abortEarly: {
      type: 'boolean',
      default: false,
      description: 'Stop validation on first error',
    },
    maxErrors: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10,
      description: 'Maximum number of errors to report',
    },
  },
  additionalProperties: false,
} as const;

/**
 * All schemas combined for easy export
 */
export const AdapterSchemas = {
  AdapterConfig: AdapterConfigSchema,
  ComponentConfig: ComponentConfigSchema,
  StyleConfig: StyleConfigSchema,
  TokenConfig: TokenConfigSchema,
  AdapterRegistration: AdapterRegistrationSchema,
  ValidationOptions: ValidationOptionsSchema,
} as const;

/**
 * Schema type definitions for TypeScript
 */
export type AdapterConfigSchemaType = typeof AdapterConfigSchema;
export type ComponentConfigSchemaType = typeof ComponentConfigSchema;
export type StyleConfigSchemaType = typeof StyleConfigSchema;
export type TokenConfigSchemaType = typeof TokenConfigSchema;
export type AdapterRegistrationSchemaType = typeof AdapterRegistrationSchema;
export type ValidationOptionsSchemaType = typeof ValidationOptionsSchema;