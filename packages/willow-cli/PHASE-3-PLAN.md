# Phase 3: Utilities & Framework Support

## Overview
Create utility modules and framework detection capabilities for Willow CLI v2.0.

## Epic 3.1: Core Utilities
- File management with rollback support
- Template engine for code generation  
- Progress tracking and user interface helpers
- Interactive prompts for user input

## Epic 3.2: Framework Detection & Support
- Auto-detect project frameworks (Next.js, Vite, Remix, CRA, etc.)
- Resolve component paths for different frameworks
- Adapt CLI behavior based on detected framework

## Files to Implement
1. `src-v2/utils/file-manager.ts` (200 lines)
2. `src-v2/utils/template-engine.ts` (100 lines)
3. `src-v2/utils/progress-tracker.ts` (150 lines)
4. `src-v2/utils/prompts.ts` (100 lines)
5. `src-v2/utils/framework-detector.ts` (200 lines)
6. `src-v2/utils/path-resolver.ts` (100 lines)

## Key Features
- Safe file operations with automatic rollback
- Framework-specific path resolution
- Beautiful progress indicators and prompts
- Template-based code generation

## Timeline: 2 days