// Quick test to verify converter behavior
import { PropValueConverter } from './packages/transformer/src/converters/prop-value-converter.js';

const converter = new PropValueConverter();
const context = {
  sourceFile: 'test.tsx',
  targetFile: 'test.tsx',
  componentName: 'Button',
  props: {},
};

async function test() {
  const result = await converter.convertByType(123, 'string', context);
  console.log('Result:', result);
  console.log('Value:', result.value);
  console.log('Type:', typeof result.value);
}

test().catch(console.error);