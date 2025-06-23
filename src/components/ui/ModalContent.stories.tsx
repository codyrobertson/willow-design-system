import type { Meta, StoryObj } from '@storybook/react';
import { 
  Modal,
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose
} from './Modal';
import { Button } from './Button';
import React, { useState } from 'react';

const meta: Meta<typeof ModalContent> = {
  title: 'UI/Modal/ModalContent',
  component: ModalContent,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
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
    preventClose: {
      control: 'boolean',
      description: 'Prevents the modal from being closed',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalContent>;

export const Playground: Story = {
  args: {
    variant: 'default',
    size: 'md',
    position: 'center',
    preventClose: false,
  },
  render: (args) => {
    const [open, setOpen] = useState(true);
    
    return (
      <>
        {!open && (
          <Button onClick={() => setOpen(true)}>Show Modal</Button>
        )}
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent {...args}>
            <ModalHeader>
              <ModalTitle>ModalContent Playground</ModalTitle>
              <ModalDescription>
                Adjust the controls to see different ModalContent configurations.
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Variant:</strong> {args.variant}
                </p>
                <p className="text-sm">
                  <strong>Size:</strong> {args.size}
                </p>
                <p className="text-sm">
                  <strong>Position:</strong> {args.position}
                </p>
                <p className="text-sm">
                  <strong>Prevent Close:</strong> {args.preventClose ? 'Yes' : 'No'}
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={args.preventClose}
              >
                {args.preventClose ? 'Close Disabled' : 'Close'}
              </Button>
            </ModalFooter>
            {!args.preventClose && <ModalClose />}
          </ModalContent>
        </Modal>
      </>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const [activeVariant, setActiveVariant] = useState<string | null>(null);
    const variants = ['default', 'raised', 'flat', 'outlined', 'elevated'] as const;
    
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <Button
              key={variant}
              variant="outline"
              size="sm"
              onClick={() => setActiveVariant(variant)}
            >
              {variant}
            </Button>
          ))}
        </div>
        {activeVariant && (
          <Modal open={true} onOpenChange={() => setActiveVariant(null)}>
            <ModalContent variant={activeVariant as any}>
              <ModalHeader>
                <ModalTitle>{activeVariant.charAt(0).toUpperCase() + activeVariant.slice(1)} Variant</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p>This modal uses the {activeVariant} variant.</p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setActiveVariant(null)}>Close</Button>
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        )}
      </>
    );
  },
};

export const AllSizes: Story = {
  render: () => {
    const [activeSize, setActiveSize] = useState<string | null>(null);
    const sizes = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const;
    
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <Button
              key={size}
              variant="outline"
              size="sm"
              onClick={() => setActiveSize(size)}
            >
              Size: {size}
            </Button>
          ))}
        </div>
        {activeSize && (
          <Modal open={true} onOpenChange={() => setActiveSize(null)}>
            <ModalContent size={activeSize as any}>
              <ModalHeader>
                <ModalTitle>Size: {activeSize}</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p>This modal demonstrates the {activeSize} size option.</p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setActiveSize(null)}>Close</Button>
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        )}
      </>
    );
  },
};