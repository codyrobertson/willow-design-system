#!/usr/bin/env node

import { loadTemplate } from './dist/utils/templateLoader.js';

console.log('🧪 Testing template loading system...');

async function testTemplateLoading() {
  try {
    console.log('1. Testing Tailwind config template loading...');
    const tailwindConfig = await loadTemplate('config/tailwind.config.js', {
      projectType: { isOnlineIDE: true },
      isOnlineIDE: true
    });
    console.log('✅ Tailwind config template loaded successfully');
    console.log(`   Length: ${tailwindConfig.length} characters`);
    console.log(`   Contains Willow colors: ${tailwindConfig.includes('willow-primary') ? 'Yes' : 'No'}`);
    
    console.log('\n2. Testing CSS template loading...');
    const cssTemplate = await loadTemplate('css/globals.css', {
      projectType: { isOnlineIDE: true },
      isOnlineIDE: true
    });
    console.log('✅ CSS template loaded successfully');
    console.log(`   Length: ${cssTemplate.length} characters`);
    console.log(`   Contains Willow colors: ${cssTemplate.includes('willow-primary') ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Template loading failed:', error.message);
  }
}

testTemplateLoading();