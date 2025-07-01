import type { TransformerConfig, Transformer, TransformerFactory, ValidationResult } from './types';
import { ASTTransformer } from './transformer';

/**
 * Factory for creating transformer instances
 */
export class DefaultTransformerFactory implements TransformerFactory {
  /**
   * Create a transformer instance
   */
  create(config: TransformerConfig): Transformer {
    return new ASTTransformer(config);
  }
  
  /**
   * Create transformer with validation
   */
  async createWithValidation(config: TransformerConfig): Promise<Transformer> {
    const transformer = this.create(config);
    const validation = await transformer.validateConfig();
    
    if (!validation.valid) {
      const errors = validation.errors.map(e => `${e.path}: ${e.message}`).join('\n');
      throw new Error(`Invalid transformer configuration:\n${errors}`);
    }
    
    return transformer;
  }
  
  /**
   * Create transformer for specific UI kit transformation
   */
  createForUIKit(sourceKit: string, targetKit: string, options?: Partial<TransformerConfig>): Transformer {
    const config: TransformerConfig = {
      sourceUIKit: sourceKit,
      targetUIKit: targetKit,
      ...options,
    };
    
    // Load UI kit specific configurations
    this.loadUIKitConfig(config);
    
    return this.create(config);
  }
  
  /**
   * Load UI kit specific configuration
   */
  private loadUIKitConfig(config: TransformerConfig): void {
    // This would load predefined mappings for known UI kits
    // For now, we'll implement some basic mappings
    
    if (config.sourceUIKit === 'willow' && config.targetUIKit === 'radix') {
      config.componentMappings = {
        mappings: {
          'Button': { target: 'Button.Root' },
          'Card': { target: 'Card.Root' },
          'Modal': { target: 'Dialog.Root' },
          'Tooltip': { target: 'Tooltip.Root' },
        },
      };
      
      config.importMappings = {
        packageMappings: {
          '@willow-ui/components': '@radix-ui/react',
        },
      };
    }
  }
}

/**
 * Create default transformer factory instance
 */
export const transformerFactory = new DefaultTransformerFactory();