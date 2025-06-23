#!/usr/bin/env node

// Test script to verify registry accessibility

const REGISTRY_URLS = [
  'https://iridescent-brigadeiros-fe4174.netlify.app/r/button.json',
  'https://iridescent-brigadeiros-fe4174.netlify.app/api/registry/ui/button',
  'https://iridescent-brigadeiros-fe4174.netlify.app/registry/ui/button.json',
];

async function testRegistry() {
  console.log('Testing Willow registry endpoints...\n');
  
  for (const url of REGISTRY_URLS) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Found component: ${data.name || 'unknown'}`);
        console.log(`Files: ${data.files ? data.files.length : 0}`);
      } else {
        console.log(`❌ Failed to fetch`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---');
  }
}

testRegistry().catch(console.error);