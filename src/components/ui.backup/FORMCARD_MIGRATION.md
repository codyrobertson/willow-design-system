# FormCard Migration Guide

## Overview

The FormCard component has been refactored from a monolithic 373-line component into smaller, composable pieces that better align with modern React patterns and our design system principles.

## Key Changes

### 1. Separation of Concerns

**Before:** FormCard handled everything - layout, form state, validation, and styling.

**After:** Responsibilities are now separated:
- `Card` components handle layout and styling
- `SimpleForm` handles form logic and field rendering
- `FormField` handles individual field layout and errors
- You manage validation and state externally

### 2. Component Architecture

```tsx
// Old: Monolithic component
<FormCard 
  title="Login"
  fields={[...]}
  onSubmit={handleSubmit}
  // Everything bundled together
/>

// New: Composable components
<Card>
  <CardHeader>
    <CardTitle>Login</CardTitle>
  </CardHeader>
  <CardContent>
    <SimpleForm 
      fields={[...]}
      onSubmit={handleSubmit}
    />
  </CardContent>
</Card>
```

### 3. Removed Features

The following features were removed for simplicity and should be handled externally:

1. **Built-in validation** - Use a form library like React Hook Form or Zod
2. **Character counting** - Implement in your form wrapper if needed
3. **Touched state tracking** - Use a form library for this
4. **Complex error handling** - Handle at the application level

## Migration Examples

### Basic Form

**Old FormCard:**
```tsx
<FormCard
  title="Sign In"
  subtitle="Enter your credentials"
  fields={[
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@example.com',
      validation: { required: true }
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      validation: { required: true, minLength: 8 }
    }
  ]}
  submitText="Sign In"
  onSubmit={handleSubmit}
  errors={errors}
  isLoading={loading}
/>
```

**New Approach (Simple):**
```tsx
// Using the refactored FormCard (drop-in replacement)
<FormCard
  title="Sign In"
  subtitle="Enter your credentials"
  fields={[
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@example.com',
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true
    }
  ]}
  submitText="Sign In"
  onSubmit={handleSubmit}
  errors={errors}
  isLoading={loading}
/>
```

**New Approach (Full Control):**
```tsx
// Direct composition for maximum flexibility
<Card className="max-w-md w-full">
  <CardHeader>
    <CardTitle>Sign In</CardTitle>
    <CardDescription>Enter your credentials</CardDescription>
  </CardHeader>
  <CardContent>
    <SimpleForm
      fields={[
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
          required: true
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          required: true
        }
      ]}
      submitText="Sign In"
      onSubmit={handleSubmit}
      errors={errors}
      isLoading={loading}
    />
  </CardContent>
</Card>
```

### Form with Validation

**Old Approach:**
```tsx
// Validation was built into FormCard
<FormCard
  fields={[
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      validation: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    }
  ]}
  // ...
/>
```

**New Approach with React Hook Form:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Email" error={errors.email?.message} required>
            <Input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
            />
          </FormField>
          
          <FormField label="Password" error={errors.password?.message} required>
            <Input
              {...register('password')}
              type="password"
            />
          </FormField>
          
          <Button type="submit" fullWidth>
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Multi-Step Form

**Old Approach:**
```tsx
<FormCard
  title="Step 1: Personal Info"
  currentStep={1}
  totalSteps={3}
  fields={step1Fields}
  onSubmit={handleStep1}
/>
```

**New Approach:**
```tsx
function MultiStepForm({ currentStep }: { currentStep: number }) {
  const steps = [
    { title: 'Personal Info', fields: [...] },
    { title: 'Contact Details', fields: [...] },
    { title: 'Preferences', fields: [...] }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        <CardDescription>
          Step {currentStep} of {steps.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleForm
          fields={steps[currentStep - 1].fields}
          onSubmit={handleStepSubmit}
          submitText={currentStep === steps.length ? 'Complete' : 'Next'}
        />
      </CardContent>
    </Card>
  );
}
```

### Character Counter

**Old Approach:**
```tsx
<FormCard
  fields={[
    {
      name: 'bio',
      type: 'textarea',
      showCharCount: true,
      maxChars: 200
    }
  ]}
/>
```

**New Approach:**
```tsx
function TextareaWithCounter() {
  const [value, setValue] = React.useState('');
  const maxLength = 200;

  return (
    <FormField label="Bio">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={maxLength}
      />
      <div className="flex justify-end mt-1">
        <span className={cn(
          "text-xs",
          value.length > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground"
        )}>
          {value.length}/{maxLength}
        </span>
      </div>
    </FormField>
  );
}
```

## Benefits of the New Architecture

1. **Better Composition** - Mix and match components as needed
2. **Smaller Bundle** - Only import what you use
3. **Easier Testing** - Test individual components separately
4. **More Flexible** - Add custom elements between form fields
5. **Better TypeScript** - Simpler types, better inference
6. **Framework Agnostic** - Easy to integrate with form libraries

## Gradual Migration Strategy

1. **Phase 1**: Use the refactored FormCard as a drop-in replacement
2. **Phase 2**: Start using Card components directly for new forms
3. **Phase 3**: Integrate with a form library for complex validation
4. **Phase 4**: Remove old FormCard component

## When to Use What

- **FormCard (refactored)** - Quick forms with basic needs
- **Card + SimpleForm** - When you need custom layout
- **Card + Form Library** - Complex forms with validation
- **Individual Components** - Maximum control and customization