# Willow Design System Theme Guide

## Overview

The Willow Design System uses a comprehensive token-based theming system that ensures consistency across all components. All design decisions should reference these tokens rather than using hardcoded values.

## Token Structure

All tokens are defined in `/src/lib/tokens.ts` and automatically integrated with Tailwind CSS.

### Color System

#### Brand Colors
- **Willow Purple** (`willow-primary-*`): Our primary brand color
  - Use `willow-primary-950` for primary actions
  - Use `willow-primary-50` for light backgrounds
  - Full scale: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950

#### Neutral Colors
- **Neutral** (`neutral-*`): For text, borders, and backgrounds
  - `neutral-0`: Pure white
  - `neutral-900`: Primary text color
  - `neutral-200`: Default borders
  - Full scale: 0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950

#### Semantic Colors
- **Success** (`success` or `state-success-*`): Green tones for positive states
- **Warning** (`warning` or `state-warning-*`): Orange tones for caution
- **Error/Danger** (`danger` or `state-error-*`): Red tones for errors
- **Info** (`info-*`): Blue tones for informational content

### Typography

#### Font Families
- Primary: `font-sans` or `font-codec-pro` (Codec Pro)
- Monospace: `font-mono`

#### Font Sizes
```
text-xs    - 12px / 18px line height
text-sm    - 14px / 20px line height
text-base  - 16px / 24px line height
text-lg    - 18px / 28px line height
text-xl    - 20px / 30px line height
text-2xl   - 24px / 32px line height
text-3xl   - 30px / 38px line height
text-4xl   - 36px / 44px line height
text-5xl   - 48px / 60px line height
text-6xl   - 60px / 72px line height
text-7xl   - 72px / 90px line height
```

#### Font Weights
- `font-thin`: 100
- `font-extralight`: 200
- `font-light`: 300
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700
- `font-extrabold`: 800
- `font-heavy`: 900

### Spacing

Use consistent spacing tokens instead of arbitrary values:
```
spacing-0    - 0px
spacing-px   - 1px
spacing-0.5  - 2px
spacing-1    - 4px
spacing-1.5  - 6px
spacing-2    - 8px
spacing-2.5  - 10px
spacing-3    - 12px
spacing-3.5  - 14px
spacing-4    - 16px
spacing-5    - 20px
spacing-6    - 24px
spacing-8    - 32px
spacing-10   - 40px
spacing-12   - 48px
spacing-16   - 64px
spacing-20   - 80px
spacing-24   - 96px
```

### Border Radius

```
rounded-none   - 0px
rounded-sm     - 2px
rounded        - 4px (default)
rounded-md     - 6px
rounded-lg     - 8px
rounded-xl     - 12px
rounded-2xl    - 16px
rounded-3xl    - 24px
rounded-full   - 9999px
```

### Shadows

#### Elevation Shadows
- `shadow-xs`: Minimal elevation
- `shadow-sm`: Small elevation
- `shadow`: Default elevation
- `shadow-md`: Medium elevation
- `shadow-lg`: Large elevation
- `shadow-xl`: Extra large elevation
- `shadow-2xl`: Maximum elevation

#### Component Shadows
- **Cards**: `shadow-card`, `shadow-card-hover`, `shadow-card-raised`
- **Buttons**: `shadow-button-primary`, `shadow-button-secondary`, `shadow-button-danger`
- **Inputs**: `shadow-input-focus`, `shadow-input-error`
- **Chips**: `shadow-chip`, `shadow-chip-hover`, `shadow-chip-fancy`

### Animation

#### Durations
- `duration-instant`: 0ms
- `duration-fast`: 150ms
- `duration-200`: 200ms (default)
- `duration-medium`: 300ms
- `duration-slow`: 500ms

#### Timing Functions
- `ease-DEFAULT`: cubic-bezier(0.4, 0, 0.2, 1)
- `ease-linear`: linear
- `ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `ease-out`: cubic-bezier(0, 0, 0.2, 1)
- `ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)

## Usage Guidelines

### DO's ✅

1. **Always use tokens**
   ```tsx
   // Good
   <div className="bg-willow-primary-950 text-neutral-0">
   
   // Bad
   <div className="bg-[#230E67] text-white">
   ```

2. **Use semantic tokens for states**
   ```tsx
   // Good
   <div className="bg-state-error-lighter text-error">
   
   // Bad
   <div className="bg-red-50 text-red-500">
   ```

3. **Apply consistent spacing**
   ```tsx
   // Good
   <div className="p-4 gap-3">
   
   // Bad
   <div className="p-[17px] gap-[13px]">
   ```

4. **Use shadow tokens**
   ```tsx
   // Good
   <Card className="shadow-card hover:shadow-card-hover">
   
   // Bad
   <Card className="shadow-[0px_4px_20px_0px_rgba(0,0,0,0.12)]">
   ```

### DON'Ts ❌

1. **Never hardcode colors**
   ```tsx
   // Bad
   style={{ backgroundColor: '#230E67' }}
   className="bg-[#230E67]"
   ```

2. **Avoid arbitrary values**
   ```tsx
   // Bad
   className="p-[18px] text-[15px] rounded-[7px]"
   ```

3. **Don't mix token systems**
   ```tsx
   // Bad - mixing Tailwind defaults with our tokens
   className="bg-blue-500 text-neutral-900"
   ```

## Component Token Usage

### Buttons
- Primary: `bg-willow-primary-950` with `shadow-button-primary`
- Secondary: `bg-neutral-100` with `shadow-button-secondary`
- Danger: `bg-danger` with `shadow-button-danger`

### Cards
- Default: `bg-white` with `shadow-card`
- Raised: `bg-white` with `shadow-card-raised`
- Borders: `border-neutral-200`

### Inputs
- Default: `border-neutral-200` with `focus:shadow-input-focus`
- Error: `border-error` with `focus:shadow-input-error`
- Background: `bg-white`

### Text
- Primary: `text-neutral-900`
- Secondary: `text-neutral-700`
- Muted: `text-neutral-600`
- Disabled: `text-neutral-400`

## Dark Mode

The system supports dark mode through CSS variables defined in `globals.css`. Components should use the semantic color tokens that automatically adapt:

- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-popover` / `text-popover-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-destructive` / `text-destructive-foreground`

## Migration Guide

When updating existing components:

1. **Replace hardcoded colors**
   - Find: `#230E67` → Replace: `willow-primary-950`
   - Find: `#534F5E` → Replace: `neutral-900`
   - Find: `#E1DEE9` → Replace: `neutral-200`

2. **Update shadow definitions**
   - Replace inline shadow styles with token classes
   - Use `shadow-*` utilities from the token system

3. **Standardize spacing**
   - Replace arbitrary padding/margin with spacing tokens
   - Use consistent gap values

4. **Fix font references**
   - Replace `font-codec-pro-medium` with `font-medium`
   - Replace `font-codec-pro-bold` with `font-bold`

## Token Reference

For the complete token reference, see `/src/lib/tokens.ts`

This file contains:
- Complete color palettes
- All spacing values
- Typography definitions
- Shadow configurations
- Animation presets
- Semantic tokens
- Component-specific tokens