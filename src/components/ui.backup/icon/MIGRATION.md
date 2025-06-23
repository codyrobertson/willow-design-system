# Icon Component Migration Guide

## Overview
The Icon component has been refactored from a 650+ line monolithic component into smaller, focused components. This guide will help you migrate from the old Icon component to the new modular architecture.

## Breaking Changes

### 1. Core Icon Component
The core `Icon` component is now simplified and only handles rendering icons.

**Before:**
```tsx
<Icon 
  name="user" 
  variant="contained"
  containerSize={40}
  backgroundColor="#f0f0f0"
  containerShape="circle"
/>
```

**After:**
```tsx
// Use composition with existing components
<div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
  <Icon name="user" size="md" />
</div>

// Or use with Button component for clickable icons
<Button variant="outline" size="compact" className="rounded-full">
  <Icon name="user" size="md" />
</Button>
```

### 2. Icon with Text
`IconWithText` compound component is now replaced with a simpler `IconText` component.

**Before:**
```tsx
<Icon.WithText
  iconName="download"
  label="Download"
  description="PDF, 2.5MB"
  layout="horizontal"
  iconPosition="start"
/>
```

**After:**
```tsx
// Simple icon with text
<IconText icon="download">
  Download
</IconText>

// For more complex layouts, compose manually
<div className="flex items-center gap-3">
  <Icon name="download" />
  <div>
    <div className="font-medium">Download</div>
    <div className="text-sm text-muted-foreground">PDF, 2.5MB</div>
  </div>
</div>
```

### 3. Icon Container
`IconContainer` compound component is removed. Use standard div with Tailwind classes.

**Before:**
```tsx
<Icon.Container
  size={48}
  shape="circle"
  backgroundColor="#e0e0e0"
  shadow="md"
>
  <Icon name="user" />
</Icon.Container>
```

**After:**
```tsx
<div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 shadow-md">
  <Icon name="user" />
</div>
```

### 4. Icon Badge
`IconBadge` compound component is removed. Use the existing `Badge` component.

**Before:**
```tsx
<div className="relative">
  <Icon name="bell" />
  <Icon.Badge content={3} position="top-right" />
</div>
```

**After:**
```tsx
<div className="relative">
  <Icon name="bell" />
  <Badge 
    variant="destructive" 
    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
  >
    3
  </Badge>
</div>
```

### 5. Icon Stack
`IconStack` compound component is removed. Use flexbox utilities.

**Before:**
```tsx
<Icon.Stack direction="horizontal" overlap overlapOffset={-8}>
  <Icon name="user" />
  <Icon name="user" />
  <Icon name="user" />
</Icon.Stack>
```

**After:**
```tsx
<div className="flex -space-x-2">
  <div className="rounded-full bg-blue-500 p-1">
    <Icon name="user" className="text-white" />
  </div>
  <div className="rounded-full bg-green-500 p-1">
    <Icon name="user" className="text-white" />
  </div>
  <div className="rounded-full bg-red-500 p-1">
    <Icon name="user" className="text-white" />
  </div>
</div>
```

## Common Patterns

### Icon Button
Use the existing `Button` component:

```tsx
<Button 
  variant="outline" 
  size="compact"
  onClick={handleClick}
  aria-label="Settings"
>
  <Icon name="settings" />
</Button>
```

### Icon with Badge
```tsx
<div className="relative inline-flex">
  <Button variant="ghost" size="compact">
    <Icon name="bell" />
  </Button>
  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0">
    3
  </Badge>
</div>
```

### Loading State
```tsx
<Button disabled>
  <Icon name="loader-2" className="animate-spin" />
  Loading...
</Button>
```

### Icon List
```tsx
<div className="space-y-2">
  <IconText icon="check" className="text-success">
    Feature included
  </IconText>
  <IconText icon="x" className="text-destructive">
    Not available
  </IconText>
</div>
```

## Benefits of the New Architecture

1. **Smaller Bundle Size**: Only import what you need
2. **Better Composition**: Use existing components like Button and Badge
3. **Clearer Code**: No more 20+ props on a single component
4. **Easier Testing**: Test individual pieces separately
5. **Better TypeScript**: Simpler types, better autocomplete

## Gradual Migration

You can migrate gradually by:

1. Start with new features using the new components
2. Update existing code when touching those files
3. Use find & replace for simple cases
4. Keep the old Icon.tsx temporarily if needed

## Need Help?

If you encounter any issues during migration, please:
1. Check the component stories for examples
2. Look at the new component source code
3. Ask in the team chat for assistance