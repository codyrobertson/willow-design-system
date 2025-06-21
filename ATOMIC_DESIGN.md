# Willow Design System - Atomic Design Architecture

## Overview

The Willow Design System follows **Atomic Design** principles, organizing components into a hierarchical structure that promotes reusability, consistency, and maintainability.

## Directory Structure

```
src/components/
├── primitives/      # Shared types and utilities
│   └── types.ts     # Base interfaces, polymorphic types, etc.
├── atoms/           # Basic building blocks
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Label.tsx
│   ├── Badge.tsx
│   ├── Checkbox.tsx
│   ├── Switch.tsx
│   ├── Textarea.tsx
│   └── index.ts
├── molecules/       # Simple component groups
│   ├── Card.tsx
│   ├── Accordion.tsx
│   ├── List.tsx
│   └── index.ts
├── organisms/       # Complex components
│   ├── Modal.tsx
│   ├── Form.tsx
│   └── index.ts
├── templates/       # Page layouts (future)
│   └── index.ts
└── index.ts         # Main export file
```

## Component Categories

### 🔷 Primitives
Shared types, interfaces, and utilities used across all components.

```typescript
// Base types for all components
export interface BaseComponentProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

// Polymorphic component support
export type PolymorphicProps<C extends React.ElementType, Props = {}> = 
  Props & { as?: C; } & Omit<React.ComponentPropsWithRef<C>, keyof Props | 'as'>;
```

### ⚛️ Atoms
The smallest, indivisible components. They implement:
- Standardized variant system
- Consistent size options (sm, md, lg)
- Polymorphic support where appropriate
- Controlled/uncontrolled patterns

**Examples:**
- Button, Input, Label, Badge
- Checkbox, Switch, Textarea
- Icon, Avatar, Spinner

### 🧬 Molecules
Simple groups of atoms functioning together:
- Use compound component pattern
- Provide context to child components
- Handle internal state management

**Examples:**
- Card (Header + Content + Footer)
- Accordion (Trigger + Content)
- List (Item + Icon + Content)

### 🏗️ Organisms
Complex components composed of molecules and atoms:
- Handle complex state and interactions
- May include business logic
- Often form complete UI sections

**Examples:**
- Modal (Portal + Overlay + Content)
- Form (Fields + Validation + Submit)
- Navigation (Menu + Items + Mobile)

## Component API Standards

### 1. Variant System
All components use a standardized variant system:

```typescript
// Standard variants across all components
type Variant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
type Status = 'default' | 'success' | 'warning' | 'error' | 'info';
```

### 2. Compound Components
Complex components use compound patterns:

```typescript
// Compound component example
<Card variant="elevated">
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    Content goes here
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

### 3. Controlled/Uncontrolled
All form components support both patterns:

```typescript
// Uncontrolled
<Input defaultValue="Hello" />

// Controlled
<Input value={value} onChange={setValue} />
```

### 4. Polymorphic Components
Components that can render as different elements:

```typescript
// Render as different elements
<Button as="a" href="/home">Home</Button>
<Button as="div" role="button">Custom</Button>
```

## CVA Rules

To maintain manageable complexity:

1. **Maximum 10-15 compound variants** per component
2. **Group related styles** into semantic variants
3. **Avoid variant explosion** by using data attributes
4. **Use CSS variables** for dynamic values

```typescript
// Good - Manageable variants
const buttonVariants = cva('...', {
  variants: {
    variant: { default, primary, secondary, destructive, outline, ghost },
    size: { sm, md, lg },
  },
  // Only essential compound variants
  compoundVariants: [
    { variant: 'ghost', size: 'sm', className: 'px-2' },
  ],
});

// Bad - Too many combinations
const badVariants = cva('...', {
  variants: {
    theme: { light, dark, willow, ocean, forest },
    variant: { solid, outline, ghost, gradient },
    size: { xs, sm, md, lg, xl },
    state: { default, hover, active, disabled },
  },
  // Results in 5 × 4 × 5 × 4 = 400 combinations!
});
```

## Import Patterns

### For Library Users

```typescript
// Import from main entry
import { Button, Card, Modal } from 'willow-design-system';

// Import from specific categories
import { Button, Input } from 'willow-design-system/atoms';
import { Card, List } from 'willow-design-system/molecules';
import { Modal, Form } from 'willow-design-system/organisms';
```

### Internal Imports

```typescript
// Atoms importing primitives
import type { BaseComponentProps, PolymorphicProps } from '@/components/primitives/types';

// Molecules importing atoms
import { Button } from '@/components/atoms/Button';

// Always use absolute imports for clarity
import { cn } from '@/lib/utils';
```

## Component Guidelines

### Creating New Components

1. **Determine the category:**
   - Single, indivisible element → Atom
   - Group of atoms → Molecule
   - Complex, multi-part component → Organism

2. **Follow the template:**
   ```typescript
   'use client';
   
   import * as React from 'react';
   import { cva, type VariantProps } from 'class-variance-authority';
   import { cn } from '@/lib/utils';
   import type { BaseComponentProps } from '@/components/primitives/types';
   
   const componentVariants = cva('base-classes', {
     variants: {
       variant: { /* ... */ },
       size: { /* ... */ },
     },
     defaultVariants: {
       variant: 'default',
       size: 'md',
     },
   });
   
   export interface ComponentProps 
     extends BaseComponentProps,
       VariantProps<typeof componentVariants> {
     // Additional props
   }
   
   export const Component = React.forwardRef<HTMLElement, ComponentProps>(
     ({ className, variant, size, ...props }, ref) => {
       return (
         <element
           ref={ref}
           className={cn(componentVariants({ variant, size }), className)}
           {...props}
         />
       );
     }
   );
   Component.displayName = 'Component';
   ```

3. **Add to the appropriate index:**
   ```typescript
   // atoms/index.ts
   export { Component, componentVariants } from './Component';
   export type { ComponentProps } from './Component';
   ```

### Migration Strategy

When migrating existing components:

1. **Analyze complexity** - Determine atomic category
2. **Standardize API** - Apply consistent variant system
3. **Reduce CVA complexity** - Limit compound variants
4. **Add TypeScript types** - Use discriminated unions
5. **Implement patterns** - Add polymorphic/compound support
6. **Update imports** - Fix import paths
7. **Test thoroughly** - Ensure backwards compatibility

## Benefits

1. **Consistency** - All components follow the same patterns
2. **Discoverability** - Clear organization by complexity
3. **Reusability** - Components compose naturally
4. **Maintainability** - Changes isolated to appropriate level
5. **Performance** - Reduced bundle size through composition
6. **Type Safety** - Full TypeScript support with discriminated unions

## Examples

### Creating a Newsletter Form (Organism)

```typescript
// Uses atoms and molecules
import { Form } from '@/components/organisms/Form';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

export function NewsletterForm() {
  return (
    <Card variant="elevated">
      <Card.Header>
        <Card.Title>Subscribe to our newsletter</Card.Title>
        <Card.Description>Get updates delivered to your inbox</Card.Description>
      </Card.Header>
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <Form.Field name="email" label="Email" required>
            <Form.Input type="email" placeholder="you@example.com" />
          </Form.Field>
        </Card.Content>
        <Card.Footer>
          <Form.Submit>Subscribe</Form.Submit>
        </Card.Footer>
      </Form>
    </Card>
  );
}
```

This architecture ensures the Willow Design System remains scalable, maintainable, and developer-friendly as it grows.