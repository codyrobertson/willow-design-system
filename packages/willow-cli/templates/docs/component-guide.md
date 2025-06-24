# Willow Design System - Component Usage Guide

## 🎨 **Button**
```tsx
import { Button } from "@/components/ui/button";

// Basic usage
<Button theme="primary">Click me</Button>
<Button theme="danger" variant="outline">Delete</Button>
<Button size="lg" leftIcon={<Icon />}>Large with icon</Button>

// Common issues:
// ❌ Don't: <Button color="red"> 
// ✅ Do: <Button theme="danger">
```

## 🏷️ **Badge**
```tsx
import { Badge } from "@/components/ui/badge";

// Usage
<Badge theme="success">Active</Badge>
<Badge theme="warning">Pending</Badge>

// When to use: Status indicators, labels, counts
```

## 👤 **Avatar**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/user.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Common issue:
// ❌ Don't import from barrel: import { Avatar } from "@/components/ui"
// ✅ Do: import { Avatar } from "@/components/ui/avatar"
```

## 📦 **Card**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

// When to use: Content containers, dashboards, product cards
```

## 📝 **Input**
```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="Enter text" />
<Input type="email" error />
<Input success />

// Common issues:
// ❌ Don't: <Input className="border-red-500"> for errors
// ✅ Do: <Input error />
```

## 💬 **Tooltip**
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>Helpful info</TooltipContent>
  </Tooltip>
</TooltipProvider>

// When to use: Additional context, icon explanations
```

## 🏷️ **Chip/Tag**
```tsx
import { Chip } from "@/components/ui/chip";
import { Tag } from "@/components/ui/tag";

// Selectable chips
<Chip selected onClick={handler}>Filter</Chip>

// Removable tags  
<Tag onRemove={handler}>React</Tag>

// When to use:
// Chip: Filters, selections, toggles
// Tag: Categories, keywords, removable items
```

## 🎛️ **Switch/Checkbox**
```tsx
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

<Switch checked={state} onCheckedChange={setState} />
<Checkbox checked={state} onCheckedChange={setState} />

// When to use:
// Switch: Settings, on/off states
// Checkbox: Multiple selections, lists
```

## 📋 **Tabs**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## ⚠️ **Common Import Issues & Fixes**

### Path Errors
```tsx
// ❌ Wrong paths:
import { Card } from "@/src/components/ui/Card"
import { cn } from "./utils"

// ✅ Correct paths:
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
```

### Barrel Import Issues
```tsx
// ❌ Causes "No matching export" errors:
import { Avatar, AvatarImage } from "@/components/ui"

// ✅ Always use direct imports:
import { Avatar, AvatarImage } from "@/components/ui/avatar"
```

### Theme Usage
```tsx
// ❌ Wrong theme names:
<Button color="red" variant="error">

// ✅ Correct theme names:
<Button theme="danger" variant="outline">
```

## 🎨 **Color Themes**
- `primary` - Brand purple, main actions
- `danger` - Red, destructive actions  
- `success` - Green, positive feedback
- `warning` - Orange, caution states
- `info` - Blue, informational
- `neutral` - Gray, secondary actions

## 🔧 **Quick Fixes**
1. **Import errors**: Use individual imports, not barrel imports
2. **Color not showing**: Check theme name (use `danger` not `error`)
3. **Utils not found**: Import from `@/lib/utils` not `./utils`
4. **Component not rendering**: Verify correct file casing (lowercase)