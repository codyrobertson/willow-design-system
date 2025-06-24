# How Willow Design System Works: Registry, CDN & Component Architecture

## 🎯 The Component Registry System

The Willow registry is a smart component distribution system that makes installing UI components as simple as running a single command.

### ✅ How Components Are Stored & Served

Every component lives in two places:
- **Source:** `/src/components/ui/` - The TypeScript source with full types
- **Registry:** `/public/r/` - JSON metadata files for distribution

When you run `npx @willow-ui/cli add button`:
1. The CLI fetches `/r/button.json` from our CDN
2. Extracts the component code, dependencies, and metadata
3. Intelligently rewrites imports to match your project
4. Installs it exactly where you need it

### 🔄 The Registry Build Process

Here's what happens when we build the registry:

```
src/components/ui/button.tsx → build-registry.js → public/r/button.json
```

The build script (`scripts/build-registry.js`):
- ✅ Extracts component source code
- ✅ Analyzes AST to find all dependencies
- ✅ Resolves transitive dependencies (Button needs Icon? Both get included)
- ✅ Generates clean JSON with everything the CLI needs

### 📦 Registry Structure

Each component's registry file contains:
```json
{
  "name": "button",
  "dependencies": ["lucide-react", "class-variance-authority"],
  "files": [{
    "path": "button.tsx",
    "content": "// Full component source",
    "type": "registry:ui"
  }],
  "type": "registry:ui",
  "tailwind": {
    "config": {
      "theme": {
        "extend": {
          // Any required Tailwind extensions
        }
      }
    }
  }
}
```

## 🌐 The CDN Architecture

### Font Delivery System

Willow includes custom Codec Pro fonts with multiple delivery strategies:

**1. Primary CDN Path:**
```
/cdn/fonts/codec-pro.css → @font-face declarations
/cdn/fonts/Codec-Pro-*.otf → Actual font files
```

**2. Smart Font Loading:**
- `font-display: swap` for instant text rendering
- Unicode ranges for optimized loading
- Multiple format support (OTF, WOFF2)
- Fallback chains for compatibility

**3. Sandboxed Environment Support:**
When running in StackBlitz/CodeSandbox:
- Detects restricted environments
- Provides base64 encoded fallbacks
- Uses system font stacks when needed

### Static Asset Optimization

The CDN serves all static assets with intelligent caching:
```
/cdn/fonts/* → 1 year cache (immutable)
/r/* → 1 hour cache (registry updates)
/_next/static/* → 1 year cache (hashed files)
```

## 🔧 Component Dependencies & Resolution

### Dependency Chain Resolution

When you install a complex component like `Modal`:
```
Modal
├── Button (dependency)
│   └── Icon (transitive dependency)
├── Portal (dependency)
└── Focus Trap (external dependency)
```

The system:
1. **Detects all dependencies** via AST analysis
2. **Resolves the full tree** including transitive deps
3. **Deduplicates** shared dependencies
4. **Orders them** for correct installation

### Import Rewriting Intelligence

The CLI rewrites imports based on your project structure:

**If your project uses `@/` aliases:**
```typescript
// Original
import { cn } from "@/lib/utils"

// Becomes
import { cn } from "@/lib/utils"
```

**If your project uses relative imports:**
```typescript
// Original
import { cn } from "@/lib/utils"

// Becomes
import { cn } from "../../lib/utils"
```

**If you have custom paths:**
```typescript
// Original
import { cn } from "@/lib/utils"

// Becomes (if detected)
import { cn } from "src/lib/utils"
```

## 🎨 Style System Integration

### CSS Variable Architecture

Components use a token-based design system:
```css
/* Component uses semantic tokens */
.button {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

/* Your app defines the actual values */
:root {
  --primary: 210 100% 50%;
  --primary-foreground: 0 0% 100%;
}
```

### Dark Mode Support

Every component supports dark mode out of the box:
- Uses CSS variables that switch with `.dark` class
- No JavaScript required for theme switching
- Respects system preferences automatically

## 🚀 Performance Optimizations

### Registry Caching

The registry implements smart caching:
- **Browser Cache:** 1-hour cache for registry files
- **CDN Cache:** Cloudflare/Netlify edge caching
- **Build Cache:** Components are pre-built at deploy time

### Bundle Size Optimization

Components are designed to be tree-shakeable:
```typescript
// Only import what you need
import { Button, ButtonGroup } from 'willow-design-system'

// Or install individually for smallest bundle
import { Button } from '@/components/ui/button'
```

### Font Loading Performance

Custom font loading is optimized for Core Web Vitals:
1. **Preload critical fonts** in document head
2. **Use font-display: swap** for no layout shift
3. **Subset fonts** by unicode range
4. **Serve from same origin** to avoid CORS delays

## 🛠️ CLI Installation Flow

Here's the complete flow when you run `npx @willow-ui/cli add`:

1. **Project Detection**
   - Detects TypeScript vs JavaScript
   - Finds your component directory
   - Analyzes import patterns
   - Locates style imports

2. **Component Fetching**
   - Downloads from CDN with retry logic
   - Validates component integrity
   - Resolves dependency tree

3. **Transform Pipeline**
   ```
   Fetch → Parse → Transform → Validate → Write
   ```
   - AST-based import rewriting
   - TypeScript to JavaScript conversion (if needed)
   - Path resolution and validation
   - Style import updates

4. **Dependency Installation**
   - Detects package manager (npm/yarn/pnpm/bun)
   - Installs only missing dependencies
   - Updates package.json cleanly

## 🔍 Error Handling & Recovery

The system includes multiple fallback strategies:

### Component Installation Failures
- Rollback on error
- Clear error messages with solutions
- Partial installation recovery

### CDN Failures
- Multiple CDN endpoints
- Local fallback for development
- Offline mode support (coming soon)

### Font Loading Failures
- System font fallbacks
- Base64 encoded alternatives
- Progressive enhancement

## 📊 Monitoring & Analytics

The registry tracks (anonymously):
- Component popularity for optimization
- Installation success rates
- Common error patterns
- Performance metrics

This helps us:
- Optimize popular components
- Fix common issues proactively
- Improve CDN performance
- Enhance CLI reliability

## 🔮 Future Enhancements

### Planned Features
- **Component versioning** - Install specific versions
- **Private registries** - Host your own components
- **Component marketplace** - Share custom components
- **Visual component picker** - Browse and preview
- **Automatic updates** - Keep components in sync

### Performance Improvements
- Edge computing for transforms
- WebAssembly-powered CLI
- Streaming installations
- P2P component sharing

---

The Willow Design System is built to be fast, reliable, and intelligent. Every decision—from AST-based transforms to CDN architecture—is designed to give you a seamless component installation experience.