# Component Design Guidelines

This document outlines the design principles and patterns that should be followed when creating or modifying components in the Willow Design System.

## Table of Contents
1. [Core Principles](#core-principles)
2. [Component Structure](#component-structure)
3. [Prop Design](#prop-design)
4. [State Management](#state-management)
5. [Performance Optimization](#performance-optimization)
6. [Composition Patterns](#composition-patterns)
7. [TypeScript Patterns](#typescript-patterns)
8. [Testing Requirements](#testing-requirements)

## Core Principles

### 1. Single Responsibility Principle
Each component should have one clear purpose:
- **Input components** handle user input state only
- **Layout components** manage structure and positioning
- **Display components** present data without state management

```tsx
// ✅ Good: Single responsibility
const Input = ({ value, onChange, ...props }) => {
  // Only handles input state
  return <input value={value} onChange={onChange} {...props} />;
};

// ❌ Bad: Multiple responsibilities
const Input = ({ value, onChange, layout, theme, animate, ...props }) => {
  // Mixing input, layout, and animation concerns
};
```

### 2. Composition over Inheritance
Use composition patterns to build complex UIs from simple components:

```tsx
// ✅ Good: Composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Bad: Monolithic component
<Card title="Title" content="Content" footer="Footer" />
```

### 3. Flexibility and Reusability
Components should be flexible enough to handle various use cases:

```tsx
// ✅ Good: Flexible API
<Button
  variant="primary"
  size="md"
  leftIcon={<Icon name="save" />}
  onClick={handleClick}
  className="custom-class"
>
  Save Changes
</Button>

// ❌ Bad: Rigid API
<SaveButton /> // Too specific, not reusable
```

## Component Structure

### Basic Component Template

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define variants using CVA
const componentVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'default-classes',
        secondary: 'secondary-classes',
      },
      size: {
        sm: 'sm-classes',
        md: 'md-classes',
        lg: 'lg-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Define Props interface
export interface ComponentNameProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Additional props here
}

// Component with forwardRef
const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

ComponentName.displayName = 'ComponentName';

export { ComponentName };
```

## Prop Design

### Standard Props
All components should accept these standard props:
- `className` - For custom styling
- `style` - For inline styles (when applicable)
- `children` - For component composition (when applicable)
- `ref` - Via forwardRef
- HTML attributes - Via prop spreading

### Naming Conventions

| Prop Type | Convention | Example |
|-----------|------------|---------|
| Boolean state | `is*` or direct | `isLoading`, `disabled` |
| Event handlers | `on*` | `onClick`, `onChange` |
| Render props | `render*` | `renderItem`, `renderHeader` |
| Component props | `*Component` | `iconComponent`, `wrapperComponent` |
| Position | `*Position` | `iconPosition`, `tooltipPosition` |

### Variant Props
Use consistent naming across components:
- `variant` - Visual style variations
- `size` - Size variations
- `theme` or `color` - Color scheme (pick one and be consistent)

```tsx
// ✅ Consistent variant naming
<Button variant="ghost" size="lg" theme="danger" />
<Badge variant="outline" size="sm" theme="success" />

// ❌ Inconsistent naming
<Button variant="ghost" size="large" color="danger" />
<Badge type="outline" scale="small" theme="success" />
```

## State Management

### Controlled vs Uncontrolled
Support both patterns for form components:

```tsx
// Controlled
<Input value={value} onChange={setValue} />

// Uncontrolled
<Input defaultValue="initial" />
```

### State Lifting
Lift state only when necessary:

```tsx
// ✅ Good: Local state for local concerns
const Toggle = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <button onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? 'Close' : 'Open'}
    </button>
  );
};

// ✅ Good: Lifted state for shared concerns
const Parent = () => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  return (
    <>
      <TabList selectedTab={selectedTab} onChange={setSelectedTab} />
      <TabContent selectedTab={selectedTab} />
    </>
  );
};
```

### Context for Cross-Cutting Concerns
Use Context for deeply nested component trees:

```tsx
const AccordionContext = React.createContext<AccordionContextType>({});

const Accordion = ({ children, ...props }) => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  
  return (
    <AccordionContext.Provider value={{ expandedItems, setExpandedItems }}>
      <div {...props}>{children}</div>
    </AccordionContext.Provider>
  );
};
```

## Performance Optimization

### Memoization Strategies

1. **Component Memoization**
```tsx
// For expensive components or those that re-render frequently
export const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});
```

2. **Callback Memoization**
```tsx
const handleClick = React.useCallback((id: string) => {
  // Handle click
}, [dependency]);
```

3. **Value Memoization**
```tsx
const processedData = React.useMemo(() => {
  return expensiveProcessing(rawData);
}, [rawData]);
```

### Lazy Loading
For large components or those with heavy dependencies:

```tsx
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Usage
<React.Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</React.Suspense>
```

### Virtual Scrolling
For components rendering large lists:

```tsx
// Use libraries like react-window or react-virtualized
import { FixedSizeList } from 'react-window';

const VirtualList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>{items[index]}</div>
    )}
  </FixedSizeList>
);
```

## Composition Patterns

### Compound Components
For complex components with multiple parts:

```tsx
// Parent manages shared state
const Tabs = ({ children, defaultValue }) => {
  const [value, setValue] = React.useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
};

// Children access shared state via context
const TabsTrigger = ({ value, children }) => {
  const { value: selectedValue, setValue } = useTabsContext();
  
  return (
    <button
      onClick={() => setValue(value)}
      aria-selected={value === selectedValue}
    >
      {children}
    </button>
  );
};

// Usage
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Slot Pattern
For maximum flexibility:

```tsx
interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const Card = ({ header, footer, children }) => (
  <div className="card">
    {header && <div className="card-header">{header}</div>}
    <div className="card-body">{children}</div>
    {footer && <div className="card-footer">{footer}</div>}
  </div>
);
```

### Render Props
For sharing logic between components:

```tsx
const MouseTracker = ({ render }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  
  // Track mouse position
  
  return render(position);
};

// Usage
<MouseTracker
  render={({ x, y }) => (
    <div>Mouse position: {x}, {y}</div>
  )}
/>
```

## TypeScript Patterns

### Required Patterns

1. **Export Props Interface**
```tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}
```

2. **Use Proper HTML Element Types**
```tsx
// Map to correct HTML element
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
interface DivProps extends React.HTMLAttributes<HTMLDivElement> {}
```

3. **Generic Components**
```tsx
interface SelectProps<T> {
  items: T[];
  value?: T;
  onChange?: (value: T) => void;
  renderItem?: (item: T) => React.ReactNode;
}

function Select<T>({ items, value, onChange, renderItem }: SelectProps<T>) {
  // Implementation
}
```

## Testing Requirements

### Required Tests

1. **Rendering Tests**
```tsx
it('renders without crashing', () => {
  render(<Component />);
});

it('renders children correctly', () => {
  render(<Component>Test Content</Component>);
  expect(screen.getByText('Test Content')).toBeInTheDocument();
});
```

2. **Prop Tests**
```tsx
it('applies className prop', () => {
  render(<Component className="custom-class" />);
  expect(screen.getByRole('button')).toHaveClass('custom-class');
});

it('forwards ref correctly', () => {
  const ref = React.createRef<HTMLButtonElement>();
  render(<Component ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
});
```

3. **Interaction Tests**
```tsx
it('calls onClick handler', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

4. **Edge Case Tests**
```tsx
it('handles undefined children', () => {
  render(<Component>{undefined}</Component>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});

it('handles null props gracefully', () => {
  render(<Component onClick={null as any} />);
  // Should not crash
});
```

5. **Accessibility Tests**
```tsx
it('supports keyboard navigation', async () => {
  render(<Component />);
  const element = screen.getByRole('button');
  
  element.focus();
  expect(element).toHaveFocus();
  
  await userEvent.keyboard('{Enter}');
  // Verify behavior
});

it('has proper ARIA attributes', () => {
  render(<Component aria-label="Test" />);
  expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Test');
});
```

## Checklist for New Components

- [ ] Uses `forwardRef` for ref forwarding
- [ ] Has `displayName` property
- [ ] Extends appropriate HTML element interface
- [ ] Accepts `className` and properly merges with internal classes
- [ ] Uses CVA for variant management
- [ ] Follows naming conventions for props
- [ ] Exports TypeScript interface for props
- [ ] Has comprehensive tests including edge cases
- [ ] Follows accessibility best practices
- [ ] Uses composition patterns where appropriate
- [ ] Implements proper state management patterns
- [ ] Has JSDoc comments for complex props
- [ ] Includes usage examples in comments