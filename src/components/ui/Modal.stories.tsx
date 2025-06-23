import type { Meta, StoryObj } from '@storybook/nextjs';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Default Modal</h2>
            <p className="text-muted-foreground mb-6">
              This is a basic modal with some content. You can add any content here.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

export const WithForm: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Item</h2>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter item name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Enter description" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={(e) => { e.preventDefault(); setIsOpen(false); }}>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button color="danger" onClick={() => setIsOpen(true)}>Delete Item</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-danger/10 rounded-full">
                <AlertCircle className="w-6 h-6 text-danger" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Delete Item?</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button color="danger" onClick={() => setIsOpen(false)}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

export const Success: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Success</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-success-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-muted-foreground mb-6">
              Your changes have been saved successfully.
            </p>
            <Button onClick={() => setIsOpen(false)} color="success">
              Done
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const WithCloseButton: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal with Close</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="relative p-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4 pr-8">Modal with Close Button</h2>
            <p className="text-muted-foreground">
              This modal has a close button in the top-right corner.
            </p>
          </div>
        </Modal>
      </>
    );
  },
};

export const InfoModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Info</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-info-100 rounded-lg flex-shrink-0">
                <Info className="w-5 h-5 text-info-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Important Information</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Please read the following information carefully before proceeding.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Changes will be applied immediately</li>
                  <li>You can undo this action within 24 hours</li>
                  <li>All team members will be notified</li>
                </ul>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => setIsOpen(false)}>
                    I Understand
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

export const CustomWidth: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Wide Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-4xl">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Wide Modal Example</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Left Column</h3>
                <p className="text-muted-foreground text-sm">
                  This modal has a custom width and uses a two-column layout.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Right Column</h3>
                <p className="text-muted-foreground text-sm">
                  You can add any content layout inside the modal.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

export const NonDismissible: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Non-dismissible Modal</Button>
        <Modal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          closeOnOverlayClick={false}
          closeOnEsc={false}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Complete Required Action</h2>
            <p className="text-muted-foreground mb-6">
              This modal cannot be closed by clicking outside or pressing Escape. 
              You must complete the action to proceed.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setIsOpen(false)}>
                Complete Action
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};