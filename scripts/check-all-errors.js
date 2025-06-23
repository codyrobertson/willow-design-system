#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Comprehensive Error Check\n');

// 1. TypeScript compilation errors
console.log('📘 TypeScript Errors:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  execSync('npx tsc --noEmit --pretty --skipLibCheck', { stdio: 'inherit' });
  console.log('✅ No TypeScript errors found');
} catch (error) {
  console.log('❌ TypeScript errors found above');
}

console.log('\n📋 ESLint Errors:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ No ESLint errors found');
} catch (error) {
  console.log('❌ ESLint errors found above');
}

console.log('\n🏗️  Next.js Build Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed - see errors above');
}