/**
 * Test unified transformer API
 */

import * as ts from 'typescript';
import { 
  ImportTransformer,
  NamespaceAliasTransformer,
  StyleTransformerFactory,
  EmotionTransformer 
} from '../src/transformers';
import { BaseTransformer, TransformContext } from '../src/index';

describe('Unified Transformer API', () => {
  it('should export all transformer categories', () => {
    // Core transformers
    expect(ImportTransformer).toBeDefined();
    expect(NamespaceAliasTransformer).toBeDefined();
    
    // Style transformers
    expect(StyleTransformerFactory).toBeDefined();
    expect(EmotionTransformer).toBeDefined();
    
    // Base infrastructure
    expect(BaseTransformer).toBeDefined();
  });

  it('should allow creating import transformer', async () => {
    const transformer = new ImportTransformer();
    
    expect(transformer.name).toBe('import-transformer');
    expect(transformer.description).toContain('import');
    expect(transformer.version).toBe('1.0.0');
    
    await transformer.initialize({
      pathMappings: {
        '@old/ui': '@new/ui'
      }
    });
    
    expect(transformer.canTransform).toBeDefined();
  });

  it('should allow creating namespace alias transformer', async () => {
    const transformer = new NamespaceAliasTransformer();
    
    expect(transformer.name).toBe('namespace-alias-transformer');
    expect(transformer.description).toContain('namespace');
    expect(transformer.version).toBe('1.0.0');
    
    await transformer.initialize({
      convertStarImports: true
    });
    
    expect(transformer.canTransform).toBeDefined();
  });
});