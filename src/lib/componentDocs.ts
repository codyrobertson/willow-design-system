/**
 * Component Documentation System
 * 
 * Extracts and organizes component documentation from JSDoc and TypeScript interfaces
 */

export interface ComponentExample {
  title: string;
  description?: string;
  code: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface ComponentDocumentation {
  name: string;
  description: string;
  examples: ComponentExample[];
  props: ComponentProp[];
  features?: string[];
  category: 'Core' | 'Form' | 'Layout' | 'Special';
  status: 'stable' | 'beta' | 'experimental';
}

/**
 * Component documentation data extracted from JSDoc and interfaces
 */
export const componentDocs: ComponentDocumentation[] = [
  // CORE COMPONENTS
  {
    name: 'Button',
    description: 'A flexible, themeable button component with multiple variants, sizes, and states. Supports icons, loading states, and can be rendered as different HTML elements.',
    category: 'Core',
    status: 'stable',
    features: [
      'Multiple themes (primary, danger, warning, info, dark, success)',
      'Various sizes (sm, md, lg, compact)',
      'Loading states with spinner',
      'Left and right icon support',
      'Customizable border radius',
      'Full width option',
      'Accessible with proper ARIA attributes'
    ],
    examples: [
      {
        title: 'Basic Usage',
        description: 'Simple button with default styling',
        code: `<Button>Click me</Button>`
      },
      {
        title: 'Themed Buttons',
        description: 'Buttons with different color themes',
        code: `<Button theme="primary">Primary</Button>
<Button theme="danger">Danger</Button>
<Button theme="success">Success</Button>`
      },
      {
        title: 'Button with Icons',
        description: 'Buttons with left and right icons',
        code: `<Button leftIcon={<Settings />} rightIcon={<ChevronRight />}>
  Launch
</Button>`
      },
      {
        title: 'Loading State',
        description: 'Button with loading spinner',
        code: `<Button loading>Processing...</Button>`
      }
    ],
    props: [
      {
        name: 'theme',
        type: "'primary' | 'danger' | 'warning' | 'info' | 'dark' | 'success' | 'neutral'",
        description: 'Color theme of the button',
        defaultValue: 'primary'
      },
      {
        name: 'variant',
        type: "'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'fancy'",
        description: 'Visual variant of the button',
        defaultValue: 'default'
      },
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg' | 'compact'",
        description: 'Size of the button',
        defaultValue: 'md'
      },
      {
        name: 'loading',
        type: 'boolean',
        description: 'Show loading spinner and disable interactions',
        defaultValue: 'false'
      },
      {
        name: 'leftIcon',
        type: 'React.ReactNode',
        description: 'Icon to display on the left side'
      },
      {
        name: 'rightIcon',
        type: 'React.ReactNode',
        description: 'Icon to display on the right side'
      },
      {
        name: 'fullWidth',
        type: 'boolean',
        description: 'Make button take full width of container',
        defaultValue: 'false'
      }
    ]
  },
  {
    name: 'Badge',
    description: 'A versatile badge component for displaying status, notifications, or labels with multiple themes and variants.',
    category: 'Core',
    status: 'stable',
    features: [
      'Multiple color themes',
      'Closable badges with onClose callback',
      'Icon support with positioning',
      'Various sizes and variants',
      'Accessible with proper ARIA attributes'
    ],
    examples: [
      {
        title: 'Basic Badge',
        code: `<Badge>Default Badge</Badge>`
      },
      {
        title: 'Themed Badges',
        code: `<Badge theme="primary">Primary</Badge>
<Badge theme="success">Success</Badge>
<Badge theme="warning">Warning</Badge>`
      }
    ],
    props: [
      {
        name: 'theme',
        type: "'primary' | 'danger' | 'warning' | 'info' | 'success' | 'neutral'",
        description: 'Color theme of the badge'
      },
      {
        name: 'variant',
        type: "'default' | 'soft' | 'outline'",
        description: 'Visual variant of the badge'
      },
      {
        name: 'closable',
        type: 'boolean',
        description: 'Whether the badge can be closed'
      }
    ]
  },
  {
    name: 'Avatar',
    description: 'User profile image component with fallback support and status indicators.',
    category: 'Core',
    status: 'stable',
    features: [
      'Image fallback to initials',
      'Status indicators',
      'Multiple sizes',
      'Group composition support',
      'Accessible implementation'
    ],
    examples: [
      {
        title: 'Basic Avatar',
        code: `<Avatar src="/avatar.jpg" alt="John Doe" />`
      },
      {
        title: 'Avatar with Fallback',
        code: `<Avatar fallback="JD" />`
      }
    ],
    props: [
      {
        name: 'src',
        type: 'string',
        description: 'Image source URL'
      },
      {
        name: 'alt',
        type: 'string',
        description: 'Alternative text for image'
      },
      {
        name: 'fallback',
        type: 'string',
        description: 'Fallback text when image fails to load'
      },
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg'",
        description: 'Size of the avatar',
        defaultValue: 'md'
      }
    ]
  },
  {
    name: 'Chip',
    description: 'Interactive element for tags, filters, or selections with remove functionality.',
    category: 'Core',
    status: 'stable',
    features: [
      'Removable chips',
      'Icon support',
      'Selected states',
      'Multiple variants',
      'Keyboard navigation'
    ],
    examples: [
      {
        title: 'Basic Chip',
        code: `<Chip>Technology</Chip>`
      },
      {
        title: 'Removable Chip',
        code: `<Chip onRemove={() => console.log('removed')}>
  Remove me
</Chip>`
      }
    ],
    props: [
      {
        name: 'variant',
        type: "'default' | 'fancy'",
        description: 'Visual variant of the chip'
      },
      {
        name: 'selected',
        type: 'boolean',
        description: 'Whether the chip is selected'
      },
      {
        name: 'onRemove',
        type: '() => void',
        description: 'Callback when chip is removed'
      }
    ]
  },
  {
    name: 'Tag',
    description: 'Simple labeling component for categorization and organization.',
    category: 'Core',
    status: 'stable',
    features: [
      'Multiple color variants',
      'Icon support',
      'Removable functionality',
      'Consistent sizing'
    ],
    examples: [
      {
        title: 'Basic Tag',
        code: `<Tag>Frontend</Tag>`
      },
      {
        title: 'Colored Tags',
        code: `<Tag variant="success">Completed</Tag>
<Tag variant="warning">In Progress</Tag>`
      }
    ],
    props: [
      {
        name: 'variant',
        type: "'default' | 'success' | 'warning' | 'danger'",
        description: 'Color variant of the tag'
      },
      {
        name: 'icon',
        type: 'React.ReactNode',
        description: 'Icon to display in the tag'
      },
      {
        name: 'onRemove',
        type: '() => void',
        description: 'Callback when tag is removed'
      }
    ]
  },
  {
    name: 'Icon',
    description: 'Unified icon component with consistent sizing and theming.',
    category: 'Core',
    status: 'stable',
    features: [
      'Multiple size variants',
      'Lucide icon integration',
      'Consistent spacing',
      'Accessible implementation'
    ],
    examples: [
      {
        title: 'Basic Icon',
        code: `<Icon name="heart" size="md" />`
      },
      {
        title: 'Colored Icon',
        code: `<Icon name="star" size="lg" className="text-yellow-500" />`
      }
    ],
    props: [
      {
        name: 'name',
        type: 'string',
        description: 'Lucide icon name'
      },
      {
        name: 'size',
        type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        description: 'Size of the icon',
        defaultValue: 'md'
      }
    ]
  },

  // FORM COMPONENTS
  {
    name: 'Input',
    description: 'Text input field with various types and validation states.',
    category: 'Form',
    status: 'stable',
    features: [
      'Multiple input types',
      'Error and success states',
      'Placeholder support',
      'Accessible labels'
    ],
    examples: [
      {
        title: 'Basic Input',
        code: `<Input placeholder="Enter your name" />`
      },
      {
        title: 'Input with Error',
        code: `<Input placeholder="Email" error="Invalid email format" />`
      }
    ],
    props: [
      {
        name: 'type',
        type: "'text' | 'email' | 'password' | 'number'",
        description: 'Type of input field',
        defaultValue: 'text'
      },
      {
        name: 'placeholder',
        type: 'string',
        description: 'Placeholder text'
      },
      {
        name: 'error',
        type: 'string',
        description: 'Error message to display'
      }
    ]
  },
  {
    name: 'Label',
    description: 'Form label component with consistent styling and accessibility features.',
    category: 'Form',
    status: 'stable',
    features: [
      'Automatic htmlFor association',
      'Required field indicators',
      'Consistent typography',
      'Accessible implementation'
    ],
    examples: [
      {
        title: 'Basic Label',
        code: `<Label htmlFor="email">Email Address</Label>`
      },
      {
        title: 'Required Label',
        code: `<Label htmlFor="password" required>Password</Label>`
      }
    ],
    props: [
      {
        name: 'htmlFor',
        type: 'string',
        description: 'Associates label with form control'
      },
      {
        name: 'required',
        type: 'boolean',
        description: 'Shows required indicator'
      }
    ]
  },
  {
    name: 'Textarea',
    description: 'Multi-line text input component with resize controls.',
    category: 'Form',
    status: 'stable',
    features: [
      'Resizable textarea',
      'Row and column control',
      'Error states',
      'Character counting support'
    ],
    examples: [
      {
        title: 'Basic Textarea',
        code: `<Textarea placeholder="Enter your message" rows={4} />`
      },
      {
        title: 'Textarea with Error',
        code: `<Textarea placeholder="Description" error="Description is required" />`
      }
    ],
    props: [
      {
        name: 'rows',
        type: 'number',
        description: 'Number of visible text lines',
        defaultValue: '3'
      },
      {
        name: 'placeholder',
        type: 'string',
        description: 'Placeholder text'
      },
      {
        name: 'error',
        type: 'string',
        description: 'Error message to display'
      }
    ]
  },
  {
    name: 'Select',
    description: 'Dropdown selection component with custom styling.',
    category: 'Form',
    status: 'stable',
    features: [
      'Custom dropdown styling',
      'Option grouping',
      'Search functionality',
      'Keyboard navigation'
    ],
    examples: [
      {
        title: 'Basic Select',
        code: `<Select placeholder="Choose option">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>`
      }
    ],
    props: [
      {
        name: 'placeholder',
        type: 'string',
        description: 'Placeholder text when no option selected'
      },
      {
        name: 'value',
        type: 'string',
        description: 'Current selected value'
      },
      {
        name: 'onChange',
        type: '(value: string) => void',
        description: 'Callback when selection changes'
      }
    ]
  },
  {
    name: 'Checkbox',
    description: 'Checkbox input with custom styling and indeterminate state support.',
    category: 'Form',
    status: 'stable',
    features: [
      'Custom checkbox styling',
      'Indeterminate state',
      'Accessible labels',
      'Form integration'
    ],
    examples: [
      {
        title: 'Basic Checkbox',
        code: `<Checkbox>Accept terms and conditions</Checkbox>`
      },
      {
        title: 'Controlled Checkbox',
        code: `<Checkbox checked={isChecked} onChange={setIsChecked}>
  Subscribe to newsletter
</Checkbox>`
      }
    ],
    props: [
      {
        name: 'checked',
        type: 'boolean',
        description: 'Whether checkbox is checked'
      },
      {
        name: 'indeterminate',
        type: 'boolean',
        description: 'Whether checkbox is in indeterminate state'
      },
      {
        name: 'onChange',
        type: '(checked: boolean) => void',
        description: 'Callback when state changes'
      }
    ]
  },
  {
    name: 'Switch',
    description: 'Toggle switch component for binary choices.',
    category: 'Form',
    status: 'stable',
    features: [
      'Smooth toggle animation',
      'Custom styling',
      'Accessible implementation',
      'Label integration'
    ],
    examples: [
      {
        title: 'Basic Switch',
        code: `<Switch>Enable notifications</Switch>`
      },
      {
        title: 'Controlled Switch',
        code: `<Switch checked={isEnabled} onChange={setIsEnabled}>
  Dark mode
</Switch>`
      }
    ],
    props: [
      {
        name: 'checked',
        type: 'boolean',
        description: 'Whether switch is on'
      },
      {
        name: 'onChange',
        type: '(checked: boolean) => void',
        description: 'Callback when state changes'
      }
    ]
  },

  // LAYOUT COMPONENTS
  {
    name: 'Card',
    description: 'A versatile card component system for building content containers with consistent styling. Includes Card, CardHeader, CardFooter, CardTitle, CardDescription, and CardContent.',
    category: 'Layout',
    status: 'stable',
    features: [
      'Multiple visual variants (default, raised, flat, outlined, elevated)',
      'Flexible padding options',
      'Compound component system',
      'Colored header support',
      'Consistent shadow system',
      'Responsive design'
    ],
    examples: [
      {
        title: 'Basic Card',
        description: 'Simple card with header and content',
        code: `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>`
      },
      {
        title: 'Card Variants',
        description: 'Different visual styles',
        code: `<Card variant="flat">
  <CardContent>Flat card</CardContent>
</Card>

<Card variant="outlined">
  <CardContent>Outlined card</CardContent>
</Card>`
      }
    ],
    props: [
      {
        name: 'variant',
        type: "'default' | 'raised' | 'flat' | 'outlined' | 'elevated'",
        description: 'Visual variant of the card',
        defaultValue: 'default'
      },
      {
        name: 'padding',
        type: "'none' | 'sm' | 'md' | 'lg'",
        description: 'Padding preset for the card',
        defaultValue: 'none'
      }
    ]
  },
  {
    name: 'List',
    description: 'A flexible container for displaying lists of content with keyboard navigation support and various styling options.',
    category: 'Layout',
    status: 'stable',
    features: [
      'Keyboard navigation with arrow keys',
      'Multiple variants (default, divided, spaced)',
      'Structured content support',
      'Icon containers',
      'Section grouping',
      'Accessibility features'
    ],
    examples: [
      {
        title: 'Basic List',
        code: `<List>
  <ListItem>Item 1</ListItem>
  <ListItem>Item 2</ListItem>
</List>`
      },
      {
        title: 'List with Icons',
        code: `<List variant="divided">
  <ListItem>
    <ListItemContent
      title="John Doe"
      subtitle="Software Engineer"
    />
  </ListItem>
</List>`
      }
    ],
    props: [
      {
        name: 'variant',
        type: "'default' | 'divided' | 'spaced'",
        description: 'Visual variant of the list'
      },
      {
        name: 'enableKeyboardNavigation',
        type: 'boolean',
        description: 'Enable keyboard navigation with arrow keys'
      }
    ]
  },
  {
    name: 'Tabs',
    description: 'A tab component system for organizing content into multiple panels with keyboard navigation support.',
    category: 'Layout',
    status: 'stable',
    features: [
      'Horizontal and vertical orientations',
      'Keyboard navigation',
      'Accessible implementation',
      'Customizable styling'
    ],
    examples: [
      {
        title: 'Basic Tabs',
        code: `<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>`
      }
    ],
    props: [
      {
        name: 'orientation',
        type: "'horizontal' | 'vertical'",
        description: 'Orientation of the tabs'
      },
      {
        name: 'value',
        type: 'string',
        description: 'Current active tab value'
      }
    ]
  },
  {
    name: 'Accordion',
    description: 'Collapsible content sections for organizing information hierarchically.',
    category: 'Layout',
    status: 'stable',
    features: [
      'Single and multiple expand modes',
      'Smooth animations',
      'Keyboard navigation',
      'Accessible implementation'
    ],
    examples: [
      {
        title: 'Basic Accordion',
        code: `<Accordion>
  <AccordionTrigger>What is Willow?</AccordionTrigger>
  <AccordionContent>
    Willow is a modern design system built with React and Tailwind CSS.
  </AccordionContent>
</Accordion>`
      }
    ],
    props: [
      {
        name: 'collapsible',
        type: 'boolean',
        description: 'Whether accordion can be collapsed'
      },
      {
        name: 'defaultValue',
        type: 'string',
        description: 'Default expanded item'
      }
    ]
  },
  {
    name: 'Modal',
    description: 'Overlay component for displaying content above the main interface.',
    category: 'Layout',
    status: 'stable',
    features: [
      'Focus trapping',
      'Backdrop dismissal',
      'Keyboard navigation',
      'Multiple sizes',
      'Scrollable content'
    ],
    examples: [
      {
        title: 'Basic Modal',
        code: `<Modal>
  <ModalTrigger>Open Modal</ModalTrigger>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Modal Title</ModalTitle>
    </ModalHeader>
    <ModalBody>
      Modal content goes here.
    </ModalBody>
  </ModalContent>
</Modal>`
      }
    ],
    props: [
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg' | 'xl'",
        description: 'Size of the modal',
        defaultValue: 'md'
      },
      {
        name: 'closeOnBackdrop',
        type: 'boolean',
        description: 'Close modal when backdrop is clicked',
        defaultValue: 'true'
      }
    ]
  },

  // SPECIAL COMPONENTS
  {
    name: 'Skeleton',
    description: 'Loading placeholder component with various presets for different content types.',
    category: 'Special',
    status: 'stable',
    features: [
      'Multiple preset shapes',
      'Customizable dimensions',
      'Smooth animations',
      'Responsive design'
    ],
    examples: [
      {
        title: 'Basic Skeleton',
        code: `<Skeleton className="h-4 w-full" />`
      },
      {
        title: 'Skeleton Presets',
        code: `<SkeletonCard />
<SkeletonText lines={3} />
<SkeletonAvatar />`
      }
    ],
    props: [
      {
        name: 'className',
        type: 'string',
        description: 'CSS classes for custom styling'
      }
    ]
  },
  {
    name: 'Toast',
    description: 'Notification system for displaying temporary messages.',
    category: 'Special',
    status: 'stable',
    features: [
      'Multiple types (success, error, warning, info)',
      'Auto-dismiss functionality',
      'Action buttons',
      'Positioning options'
    ],
    examples: [
      {
        title: 'Basic Toast',
        code: `const { toast } = useToast();
toast("Success! Your action was completed.");`
      },
      {
        title: 'Toast with Action',
        code: `toast("Error occurred", {
  type: "error",
  action: { label: "Retry", onClick: retry }
});`
      }
    ],
    props: [
      {
        name: 'type',
        type: "'success' | 'error' | 'warning' | 'info'",
        description: 'Type of toast notification'
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Auto-dismiss duration in milliseconds'
      }
    ]
  },
  {
    name: 'Tooltip',
    description: 'Contextual information overlay triggered by hover or focus.',
    category: 'Special',
    status: 'stable',
    features: [
      'Multiple positioning options',
      'Hover and focus triggers',
      'Accessible implementation',
      'Custom delays'
    ],
    examples: [
      {
        title: 'Basic Tooltip',
        code: `<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>Helpful information</TooltipContent>
</Tooltip>`
      }
    ],
    props: [
      {
        name: 'side',
        type: "'top' | 'right' | 'bottom' | 'left'",
        description: 'Positioning of the tooltip',
        defaultValue: 'top'
      },
      {
        name: 'delayDuration',
        type: 'number',
        description: 'Delay before showing tooltip',
        defaultValue: '700'
      }
    ]
  },
  {
    name: 'Logo',
    description: 'Brand logo component with multiple variants and sizes.',
    category: 'Special',
    status: 'stable',
    features: [
      'Multiple logo variants',
      'Flexible sizing',
      'Dark and light modes',
      'Responsive behavior'
    ],
    examples: [
      {
        title: 'Basic Logo',
        code: `<Logo size="md" />`
      },
      {
        title: 'Logo Variants',
        code: `<Logo lockup="full" variant="dark" size="lg" />`
      }
    ],
    props: [
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg'",
        description: 'Size of the logo',
        defaultValue: 'md'
      },
      {
        name: 'variant',
        type: "'light' | 'dark'",
        description: 'Color variant of the logo',
        defaultValue: 'dark'
      },
      {
        name: 'lockup',
        type: "'icon' | 'full'",
        description: 'Logo lockup style',
        defaultValue: 'full'
      }
    ]
  }
];

/**
 * Get documentation for a specific component
 */
export function getComponentDoc(name: string): ComponentDocumentation | undefined {
  return componentDocs.find(doc => doc.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all components by category
 */
export function getComponentsByCategory(category: ComponentDocumentation['category']): ComponentDocumentation[] {
  return componentDocs.filter(doc => doc.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): ComponentDocumentation['category'][] {
  return Array.from(new Set(componentDocs.map(doc => doc.category)));
}