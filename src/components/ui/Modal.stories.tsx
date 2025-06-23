import type { Meta, StoryObj } from '@storybook/react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalTrigger,
  ModalClose
} from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Textarea } from './Textarea';
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle, Shield } from 'lucide-react';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controlled open state of the modal',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'undefined' },
      },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Default open state for uncontrolled usage',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    isOpen: {
      control: 'boolean',
      description: 'Simple mode - open state of the modal',
      table: {
        type: { summary: 'boolean' },
        category: 'Simple Mode',
      },
    },
    variant: {
      control: 'select',
      options: ['default', 'raised', 'flat', 'outlined', 'elevated'],
      description: 'Visual variant of the modal',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
      description: 'Size of the modal',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    position: {
      control: 'select',
      options: ['center', 'top', 'bottom'],
      description: 'Position of the modal on screen',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'center' },
      },
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Whether clicking the overlay closes the modal',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Behavior',
      },
    },
    closeOnEsc: {
      control: 'boolean',
      description: 'Whether pressing Escape closes the modal',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Behavior',
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the modal',
      table: {
        type: { summary: 'string' },
        category: 'Styling',
      },
    },
    onOpenChange: {
      action: 'onOpenChange',
      description: 'Callback when modal open state changes',
      table: {
        type: { summary: '(open: boolean) => void' },
        category: 'Events',
      },
    },
    onClose: {
      action: 'onClose',
      description: 'Simple mode - callback when modal closes',
      table: {
        type: { summary: '() => void' },
        category: 'Simple Mode',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Playground: Story = {
  args: {
    variant: 'default',
    size: 'md',
    position: 'center',
    closeOnOverlayClick: true,
    closeOnEsc: true,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal 
          {...args}
          isOpen={isOpen} 
          onClose={() => {
            setIsOpen(false);
            args.onClose?.();
          }}
        >
          <ModalHeader>
            <ModalTitle>Playground Modal</ModalTitle>
            <ModalDescription>
              Use the controls to customize this modal's appearance and behavior.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Current Settings:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Variant: <span className="font-medium">{args.variant}</span></li>
                  <li>Size: <span className="font-medium">{args.size}</span></li>
                  <li>Position: <span className="font-medium">{args.position}</span></li>
                  <li>Close on overlay click: <span className="font-medium">{args.closeOnOverlayClick ? 'Yes' : 'No'}</span></li>
                  <li>Close on Escape: <span className="font-medium">{args.closeOnEsc ? 'Yes' : 'No'}</span></li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Try changing the controls in the Storybook panel to see how the modal responds
                to different configurations.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </ModalFooter>
          <ModalClose />
        </Modal>
      </>
    );
  },
};

export const ControlledModal: Story = {
  args: {
    open: false,
    variant: 'default',
    size: 'md',
    position: 'center',
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    
    // Update local state when args.open changes
    React.useEffect(() => {
      setOpen(args.open);
    }, [args.open]);
    
    return (
      <Modal 
        {...args}
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          args.onOpenChange?.(newOpen);
        }}
      >
        <ModalTrigger asChild>
          <Button>Open Controlled Modal</Button>
        </ModalTrigger>
        <ModalContent variant={args.variant} size={args.size} position={args.position}>
          <ModalHeader>
            <ModalTitle>Controlled Modal</ModalTitle>
            <ModalDescription>
              This modal's open state is controlled via the "open" prop in controls.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm">
              Toggle the "open" control in Storybook to open/close this modal.
              You can also click the buttons to close it.
            </p>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Cancel</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button>Confirm</Button>
            </ModalClose>
          </ModalFooter>
          <ModalClose />
        </ModalContent>
      </Modal>
    );
  },
};

export const Default: Story = {
  render: () => {
    return (
      <Modal>
        <ModalTrigger asChild>
          <Button>Open Modal</Button>
        </ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Default Modal</ModalTitle>
            <ModalDescription>
              This is a basic modal with header, body, and footer sections.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-muted-foreground">
              The modal component follows the same design patterns as the Card component,
              with consistent styling and structure. It includes proper mobile responsiveness
              and accessibility features.
            </p>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Cancel</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button>Confirm</Button>
            </ModalClose>
          </ModalFooter>
          <ModalClose />
        </ModalContent>
      </Modal>
    );
  },
};

export const Variants: Story = {
  render: () => {
    const variants = ['default', 'raised', 'flat', 'outlined', 'elevated'] as const;
    
    return (
      <div className="flex flex-wrap gap-4">
        {variants.map((variant) => (
          <Modal key={variant}>
            <ModalTrigger asChild>
              <Button variant="outline">{variant}</Button>
            </ModalTrigger>
            <ModalContent variant={variant}>
              <ModalHeader>
                <ModalTitle>{variant.charAt(0).toUpperCase() + variant.slice(1)} Modal</ModalTitle>
                <ModalDescription>
                  This modal uses the {variant} variant styling.
                </ModalDescription>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  Each variant provides a different visual style while maintaining
                  consistent functionality and structure.
                </p>
              </ModalBody>
              <ModalFooter>
                <ModalClose asChild>
                  <Button>Close</Button>
                </ModalClose>
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        ))}
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const sizes = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const;
    
    return (
      <div className="flex flex-wrap gap-4">
        {sizes.map((size) => (
          <Modal key={size}>
            <ModalTrigger asChild>
              <Button variant="outline" size="sm">Size: {size}</Button>
            </ModalTrigger>
            <ModalContent size={size}>
              <ModalHeader>
                <ModalTitle>Modal Size: {size}</ModalTitle>
                <ModalDescription>
                  This demonstrates the {size} modal size.
                </ModalDescription>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-muted-foreground">
                  Different sizes are available to accommodate various content needs.
                  The modal is responsive and adapts to mobile screens automatically.
                </p>
                {size === 'full' && (
                  <p className="text-sm text-muted-foreground mt-4">
                    The full size modal takes up the entire viewport on mobile and 
                    95% of the viewport on desktop screens.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <ModalClose asChild>
                  <Button>Close</Button>
                </ModalClose>
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        ))}
      </div>
    );
  },
};

export const Positions: Story = {
  render: () => {
    const positions = ['center', 'top', 'bottom'] as const;
    
    return (
      <div className="flex gap-4">
        {positions.map((position) => (
          <Modal key={position}>
            <ModalTrigger asChild>
              <Button variant="outline">Position: {position}</Button>
            </ModalTrigger>
            <ModalContent position={position}>
              <ModalHeader>
                <ModalTitle>{position.charAt(0).toUpperCase() + position.slice(1)} Position</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  This modal is positioned at the {position} of the viewport.
                </p>
              </ModalBody>
              <ModalFooter>
                <ModalClose asChild>
                  <Button>Close</Button>
                </ModalClose>
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        ))}
      </div>
    );
  },
};

export const ColoredHeaders: Story = {
  render: () => {
    const colors = [
      { name: 'neutral', icon: Info },
      { name: 'primary', icon: Info },
      { name: 'info', icon: Info },
      { name: 'success', icon: CheckCircle },
      { name: 'warning', icon: AlertTriangle },
      { name: 'danger', icon: AlertCircle },
    ] as const;
    
    return (
      <div className="flex flex-wrap gap-4">
        {colors.map(({ name, icon: Icon }) => (
          <Modal key={name}>
            <ModalTrigger asChild>
              <Button variant="outline" size="sm">{name}</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader variant="colored" theme={name}>
                <ModalTitle>{name.charAt(0).toUpperCase() + name.slice(1)} Header</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">
                      This modal features a colored header using the {name} color scheme.
                      The colored headers are perfect for conveying different states or importance levels.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <ModalClose asChild>
                  <Button>Got it</Button>
                </ModalClose>
              </ModalFooter>
            </ModalContent>
          </Modal>
        ))}
      </div>
    );
  },
};

export const WithForm: Story = {
  render: () => {
    return (
      <Modal>
        <ModalTrigger asChild>
          <Button>Create New Item</Button>
        </ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Create New Item</ModalTitle>
            <ModalDescription>
              Fill in the details below to create a new item.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter item name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter a detailed description" 
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Select a category</option>
                  <option>Technology</option>
                  <option>Design</option>
                  <option>Business</option>
                </select>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Cancel</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button>Create Item</Button>
            </ModalClose>
          </ModalFooter>
          <ModalClose />
        </ModalContent>
      </Modal>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    return (
      <Modal>
        <ModalTrigger asChild>
          <Button theme="danger">Delete Item</Button>
        </ModalTrigger>
        <ModalContent size="sm">
          <ModalHeader variant="colored" theme="danger">
            <ModalTitle>Delete Item</ModalTitle>
          </ModalHeader>
          <ModalBody className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-danger/10 rounded-full">
                <AlertCircle className="w-8 h-8 text-danger" />
              </div>
            </div>
            <p className="text-muted-foreground">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter align="center">
            <ModalClose asChild>
              <Button variant="outline">Cancel</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button theme="danger">Delete</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  },
};

export const LongContent: Story = {
  render: () => {
    return (
      <Modal>
        <ModalTrigger asChild>
          <Button>Open Long Content</Button>
        </ModalTrigger>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Terms of Service</ModalTitle>
            <ModalDescription>
              Please read our terms of service carefully.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i}>
                  <h3 className="font-medium mb-2">Section {i + 1}</h3>
                  <p className="text-sm text-muted-foreground">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
                    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
                    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Decline</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button>Accept</Button>
            </ModalClose>
          </ModalFooter>
          <ModalClose />
        </ModalContent>
      </Modal>
    );
  },
};

export const FooterAlignments: Story = {
  render: () => {
    const alignments = ['left', 'center', 'right', 'between'] as const;
    
    return (
      <div className="flex flex-wrap gap-4">
        {alignments.map((align) => (
          <Modal key={align}>
            <ModalTrigger asChild>
              <Button variant="outline">Footer: {align}</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Footer Alignment: {align}</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  This modal demonstrates the '{align}' footer alignment option.
                </p>
              </ModalBody>
              <ModalFooter align={align}>
                {align === 'between' ? (
                  <>
                    <Button variant="ghost" size="sm">Reset</Button>
                    <div>
                      <ModalClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </ModalClose>
                      <ModalClose asChild>
                        <Button className="ml-2">Save</Button>
                      </ModalClose>
                    </div>
                  </>
                ) : (
                  <>
                    <ModalClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </ModalClose>
                    <ModalClose asChild>
                      <Button>Save</Button>
                    </ModalClose>
                  </>
                )}
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        ))}
      </div>
    );
  },
};

export const NonDismissible: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    
    React.useEffect(() => {
      if (open && progress < 100) {
        const timer = setTimeout(() => {
          setProgress((prev) => Math.min(prev + 20, 100));
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [open, progress]);
    
    return (
      <>
        <Button onClick={() => { setOpen(true); setProgress(0); }}>
          Start Process
        </Button>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent 
            preventClose={progress < 100}
            onEscapeKeyDown={(e) => progress < 100 && e.preventDefault()}
            onPointerDownOutside={(e) => progress < 100 && e.preventDefault()}
          >
            <ModalHeader variant="colored" theme="info">
              <ModalTitle>Processing...</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your request. This modal cannot be closed
                  until the process is complete.
                </p>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-center">{progress}%</p>
              </div>
            </ModalBody>
            <ModalFooter align="center">
              <Button 
                disabled={progress < 100}
                onClick={() => setOpen(false)}
              >
                {progress < 100 ? 'Processing...' : 'Done'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  },
};

export const SimpleMode: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Simple Modal</Button>
        <Modal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          variant="elevated"
          size="md"
        >
          <ModalHeader>
            <ModalTitle>Simple Mode</ModalTitle>
            <ModalDescription>
              This modal uses the simple API with isOpen and onClose props.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm">
              The simple mode is perfect for basic use cases where you just need
              to control the modal's open state without the compound component pattern.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </ModalFooter>
          <ModalClose onClick={() => setIsOpen(false)} />
        </Modal>
      </>
    );
  },
};

export const MobileOptimized: Story = {
  render: () => {
    return (
      <Modal>
        <ModalTrigger asChild>
          <Button>Mobile Optimized</Button>
        </ModalTrigger>
        <ModalContent size="full" position="center">
          <ModalHeader variant="colored" theme="primary">
            <ModalTitle>Mobile Optimized Modal</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Responsive Design</h3>
                <p className="text-sm text-muted-foreground">
                  This modal is fully optimized for mobile devices with:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Full screen on mobile, centered on desktop</li>
                  <li>Touch-friendly close button positioning</li>
                  <li>Proper padding adjustments for smaller screens</li>
                  <li>Scrollable content area with overscroll behavior</li>
                  <li>Prevented body scroll when modal is open</li>
                </ul>
              </div>
              
              <div className="bg-info-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Accessibility Features
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Proper ARIA attributes</li>
                  <li>Focus trap management</li>
                  <li>Keyboard navigation support</li>
                  <li>Screen reader friendly</li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button className="w-full md:w-auto">Close</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  },
};