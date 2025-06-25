// Simple test runner for token parser
import {
  TokenParserRegistry,
  CSSVariableParser,
  JSObjectParser,
  TailwindConfigParser,
} from '../../src/styles/theme-tokens/token-parser.js';
import {
  TokenFormat,
  TokenType,
  TokenCategory,
} from '../../src/types/theme-tokens.types.js';

console.log('Running token parser tests...');

async function testCSSVariableParser() {
  console.log('✓ Testing CSSVariableParser');
  
  const parser = new CSSVariableParser();
  
  // Test format support
  console.assert(parser.supportsFormat(TokenFormat.CSS_VARIABLE), 'Should support CSS_VARIABLE');
  console.assert(!parser.supportsFormat(TokenFormat.JSON), 'Should not support JSON');
  
  // Test basic parsing
  const css = `
    :root {
      --primary-color: #007bff;
      --spacing-md: 16px;
      --font-weight-bold: 700;
    }
  `;
  
  const result = await parser.parse(css, TokenFormat.CSS_VARIABLE);
  console.assert(result.tokens.length === 3, 'Should parse 3 tokens');
  
  const primaryColor = result.tokens.find(t => t.name === '--primary-color');
  console.assert(primaryColor?.value === '#007bff', 'Primary color value should match');
  console.assert(primaryColor?.type === TokenType.COLOR, 'Primary color should be COLOR type');
  
  // Test references
  const cssWithRef = `
    :root {
      --primary: #007bff;
      --secondary: var(--primary);
    }
  `;
  
  const refResult = await parser.parse(cssWithRef, TokenFormat.CSS_VARIABLE);
  const secondary = refResult.tokens.find(t => t.name === '--secondary');
  console.assert(secondary?.type === TokenType.REFERENCE, 'Secondary should be reference type');
  console.assert(secondary?.value?.$ref === 'primary', 'Reference should point to primary');
}

async function testJSObjectParser() {
  console.log('✓ Testing JSObjectParser');
  
  const parser = new JSObjectParser();
  
  // Test format support
  console.assert(parser.supportsFormat(TokenFormat.JSON), 'Should support JSON');
  console.assert(!parser.supportsFormat(TokenFormat.CSS_VARIABLE), 'Should not support CSS_VARIABLE');
  
  // Test flat object
  const flatJson = JSON.stringify({
    'color.primary': '#007bff',
    'spacing.md': '16px',
  });
  
  const result = await parser.parse(flatJson, TokenFormat.JSON);
  console.assert(result.tokens.length === 2, 'Should parse 2 tokens from flat object');
  
  // Test nested object
  const nestedJson = JSON.stringify({
    color: {
      primary: '#007bff',
      secondary: '#6c757d',
    },
    spacing: {
      sm: '8px',
      md: '16px',
    },
  });
  
  const nestedResult = await parser.parse(nestedJson, TokenFormat.JSON);
  console.assert(nestedResult.tokens.length === 4, 'Should parse 4 tokens from nested object');
  
  const primary = nestedResult.tokens.find(t => t.name === 'color.primary');
  console.assert(primary?.value === '#007bff', 'Primary color should match');
  console.assert(primary?.type === TokenType.COLOR, 'Should detect color type');
}

async function testTailwindConfigParser() {
  console.log('✓ Testing TailwindConfigParser');
  
  const parser = new TailwindConfigParser();
  
  // Test format support
  console.assert(parser.supportsFormat(TokenFormat.TAILWIND_CONFIG), 'Should support TAILWIND_CONFIG');
  
  // Test basic config
  const config = `
    module.exports = {
      theme: {
        colors: {
          primary: '#007bff',
          gray: {
            100: '#f8f9fa',
            500: '#6c757d',
          }
        },
        spacing: {
          '4': '1rem',
          '8': '2rem',
        }
      }
    };
  `;
  
  const result = await parser.parse(config, TokenFormat.TAILWIND_CONFIG);
  console.assert(result.tokens.length >= 4, 'Should parse multiple tokens');
  
  const primary = result.tokens.find(t => t.name === 'colors.primary');
  console.assert(primary?.value === '#007bff', 'Primary color should match');
  console.assert(primary?.type === TokenType.COLOR, 'Should be color type');
  
  const spacing = result.tokens.find(t => t.name === 'spacing.4');
  console.assert(spacing?.value === '1rem', 'Spacing value should match');
  console.assert(spacing?.category === TokenCategory.SPACING, 'Should be spacing category');
}

async function testTokenParserRegistry() {
  console.log('✓ Testing TokenParserRegistry');
  
  const registry = new TokenParserRegistry();
  
  // Test supported formats
  const formats = registry.getSupportedFormats();
  console.assert(formats.includes(TokenFormat.CSS_VARIABLE), 'Should support CSS_VARIABLE');
  console.assert(formats.includes(TokenFormat.JSON), 'Should support JSON');
  console.assert(formats.includes(TokenFormat.TAILWIND_CONFIG), 'Should support TAILWIND_CONFIG');
  
  // Test parser retrieval
  const cssParser = registry.getParser(TokenFormat.CSS_VARIABLE);
  console.assert(cssParser instanceof CSSVariableParser, 'Should return CSSVariableParser');
  
  const jsParser = registry.getParser(TokenFormat.JSON);
  console.assert(jsParser instanceof JSObjectParser, 'Should return JSObjectParser');
  
  // Test parsing through registry
  const json = JSON.stringify({ 'color.primary': '#007bff' });
  const result = await registry.parse(json, TokenFormat.JSON);
  console.assert(result.tokens.length === 1, 'Should parse token through registry');
}

async function testTypeDetection() {
  console.log('✓ Testing type detection');
  
  const parser = new CSSVariableParser();
  
  // Test color detection
  const colors = `
    :root {
      --hex: #ff0000;
      --rgb: rgb(255, 0, 0);
      --hsl: hsl(0, 100%, 50%);
    }
  `;
  
  const colorResult = await parser.parse(colors, TokenFormat.CSS_VARIABLE);
  colorResult.tokens.forEach(token => {
    console.assert(token.type === TokenType.COLOR, `${token.name} should be COLOR type`);
    console.assert(token.category === TokenCategory.COLOR, `${token.name} should be COLOR category`);
  });
  
  // Test dimension detection
  const dimensions = `
    :root {
      --width: 100px;
      --height: 2rem;
      --margin: 1.5em;
    }
  `;
  
  const dimResult = await parser.parse(dimensions, TokenFormat.CSS_VARIABLE);
  dimResult.tokens.forEach(token => {
    console.assert(token.type === TokenType.DIMENSION, `${token.name} should be DIMENSION type`);
  });
}

// Run all tests
async function runTests() {
  try {
    await testCSSVariableParser();
    await testJSObjectParser();
    await testTailwindConfigParser();
    await testTokenParserRegistry();
    await testTypeDetection();
    
    console.log('🎉 All token parser tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();