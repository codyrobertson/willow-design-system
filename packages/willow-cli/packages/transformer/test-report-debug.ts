#!/usr/bin/env npx tsx

import { PropDeprecationHandler } from './src/handlers/prop-deprecation-handler';

const handler = new PropDeprecationHandler();

handler.registerDeprecation('Button', {
  source: 'fullWidth',
  target: 'fullWidth',
  deprecated: true,
  deprecationMessage: 'Use className="w-full" instead',
  alternative: 'className',
}, {
  componentName: 'Button',
  filePath: 'test.tsx',
  props: { fullWidth: true },
});

const report = handler.generateReport();
console.log('Report:', JSON.stringify(report, null, 2));
console.log('Has summary:', 'summary' in report);
console.log('Report type:', typeof report);