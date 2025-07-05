# Phase 2: Documentation & Code Analysis

## Overview
This phase implements AST parsing and documentation generation capabilities for Willow CLI v2.0.

## Epic 2.1: AST Parser & Analysis
- Create AST parser using TypeScript compiler API
- Analyze React/Vue/Svelte components for props, methods, JSDoc
- Extract component metadata and patterns

## Epic 2.2: Documentation Generation  
- Generate markdown/HTML documentation from components
- Auto-generate Storybook stories from component analysis
- Create documentation templates and renderers

## Files to Implement
1. `src-v2/docs/ast-parser.ts` (400 lines)
2. `src-v2/docs/component-analyzer.ts` (200 lines)
3. `src-v2/docs/doc-generator.ts` (300 lines)
4. `src-v2/docs/markdown-renderer.ts` (150 lines)
5. `src-v2/docs/story-generator.ts` (250 lines)
6. `src-v2/docs/story-templates.ts` (100 lines)

## Dependencies
- TypeScript compiler API
- Component analysis tools
- Template engines

## Timeline: 3 days