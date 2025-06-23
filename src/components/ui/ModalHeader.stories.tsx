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

const meta: Meta<typeof ModalHeader> = {
  title: 'UI/Modal/ModalHeader',
  component: ModalHeader,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'colored'],
      description: 'Visual variant of the header',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    theme: {
      control: 'select',
      options: ['neutral', 'primary', 'info', 'success', 'warning', 'danger'],
      description: 'Background color theme for colored variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'neutral' },
      },
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment within the header',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'left' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalHeader>;

export const Playground: Story = {
  args: {
    variant: 'default',
    theme: 'neutral',
    align: 'left',
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent>
            <ModalHeader {...args}>
              <ModalTitle>Modal Header Playground</ModalTitle>
              <ModalDescription>
                This header is using: variant="{args.variant}", theme="{args.theme}", align="{args.align}"
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm">
                Use the controls to customize the header appearance.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </ModalFooter>
            <ModalClose />
          </ModalContent>
        </Modal>
      </>
    );
  },
};

export const ColoredHeaders: Story = {
  render: () => {
    const [activeColor, setActiveColor] = useState<string | null>(null);
    const colors = ['neutral', 'primary', 'info', 'success', 'warning', 'danger'] as const;
    
    return (
      <>
        <div className="grid grid-cols-3 gap-2">
          {colors.map((color) => (
            <Button
              key={color}
              variant="outline"
              size="sm"
              onClick={() => setActiveColor(color)}
            >
              {color}
            </Button>
          ))}
        </div>
        {activeColor && (
          <Modal open={true} onOpenChange={() => setActiveColor(null)}>
            <ModalContent>
              <ModalHeader variant="colored" theme={activeColor as any}>
                <ModalTitle>{activeColor.charAt(0).toUpperCase() + activeColor.slice(1)} Header</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p>This modal has a {activeColor} colored header.</p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setActiveColor(null)}>Close</Button>
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        )}
      </>
    );
  },
};

export const Alignments: Story = {
  render: () => {
    const [activeAlign, setActiveAlign] = useState<string | null>(null);
    const alignments = ['left', 'center', 'right'] as const;
    
    return (
      <>
        <div className="flex gap-2">
          {alignments.map((align) => (
            <Button
              key={align}
              variant="outline"
              size="sm"
              onClick={() => setActiveAlign(align)}
            >
              Align: {align}
            </Button>
          ))}
        </div>
        {activeAlign && (
          <Modal open={true} onOpenChange={() => setActiveAlign(null)}>
            <ModalContent>
              <ModalHeader align={activeAlign as any}>
                <ModalTitle>Header Aligned {activeAlign}</ModalTitle>
                <ModalDescription>
                  This header text is aligned to the {activeAlign}.
                </ModalDescription>
              </ModalHeader>
              <ModalBody>
                <p>Notice how the header content is aligned.</p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setActiveAlign(null)}>Close</Button>
              </ModalFooter>
              <ModalClose />
            </ModalContent>
          </Modal>
        )}
      </>
    );
  },
};