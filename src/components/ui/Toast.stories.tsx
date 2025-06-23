import type { Meta, StoryObj } from '@storybook/nextjs';
import { Toast } from './Toast';
import { Button } from './Button';
import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => {
    const [show, setShow] = useState(false);
    
    return (
      <>
        <Button onClick={() => setShow(true)}>Show Toast</Button>
        {show && (
          <Toast
            id="default-toast"
            description="This is a default toast message"
            onClose={() => setShow(false)}
          />
        )}
      </>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const [toasts, setToasts] = useState<string[]>([]);
    
    const showToast = (variant: string) => {
      setToasts([...toasts, variant]);
      setTimeout(() => {
        setToasts(prev => prev.filter(v => v !== variant));
      }, 5000);
    };
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => showToast('default')}>Default</Button>
          <Button theme="success" onClick={() => showToast('success')}>Success</Button>
          <Button theme="warning" onClick={() => showToast('warning')}>Warning</Button>
          <Button theme="danger" onClick={() => showToast('error')}>Error</Button>
          <Button theme="info" onClick={() => showToast('info')}>Info</Button>
        </div>
        
        <div className="fixed bottom-4 right-4 space-y-2">
          {toasts.includes('default') && (
            <Toast
              id="default"
              description="This is a default message"
              onClose={() => setToasts(prev => prev.filter(v => v !== 'default'))}
            />
          )}
          {toasts.includes('success') && (
            <Toast
              id="success"
              variant="success"
              description="Operation completed successfully!"
              onClose={() => setToasts(prev => prev.filter(v => v !== 'success'))}
            />
          )}
          {toasts.includes('warning') && (
            <Toast
              id="warning"
              variant="warning"
              description="Please review your input"
              onClose={() => setToasts(prev => prev.filter(v => v !== 'warning'))}
            />
          )}
          {toasts.includes('error') && (
            <Toast
              id="error"
              variant="error"
              description="An error occurred. Please try again."
              onClose={() => setToasts(prev => prev.filter(v => v !== 'error'))}
            />
          )}
          {toasts.includes('info') && (
            <Toast
              id="info"
              variant="info"
              description="New updates are available"
              onClose={() => setToasts(prev => prev.filter(v => v !== 'info'))}
            />
          )}
        </div>
      </div>
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [toasts, setToasts] = useState<string[]>([]);
    
    const showToast = (id: string) => {
      setToasts([...toasts, id]);
    };
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button theme="success" onClick={() => showToast('success-icon')}>
            Success with Icon
          </Button>
          <Button theme="danger" onClick={() => showToast('error-icon')}>
            Error with Icon
          </Button>
          <Button theme="info" onClick={() => showToast('info-icon')}>
            Info with Icon
          </Button>
        </div>
        
        <div className="fixed bottom-4 right-4 space-y-2">
          {toasts.includes('success-icon') && (
            <Toast
              id="success-icon"
              variant="success"
              description="File uploaded successfully!"
              icon={<CheckCircle className="w-5 h-5" />}
              onClose={() => setToasts(prev => prev.filter(v => v !== 'success-icon'))}
            />
          )}
          {toasts.includes('error-icon') && (
            <Toast
              id="error-icon"
              variant="error"
              description="Failed to save changes"
              icon={<AlertCircle className="w-5 h-5" />}
              onClose={() => setToasts(prev => prev.filter(v => v !== 'error-icon'))}
            />
          )}
          {toasts.includes('info-icon') && (
            <Toast
              id="info-icon"
              variant="info"
              description="Syncing your data..."
              icon={<Info className="w-5 h-5" />}
              onClose={() => setToasts(prev => prev.filter(v => v !== 'info-icon'))}
            />
          )}
        </div>
      </div>
    );
  },
};

export const WithAction: Story = {
  render: () => {
    const [show, setShow] = useState(false);
    const [undone, setUndone] = useState(false);
    
    return (
      <>
        <Button onClick={() => { setShow(true); setUndone(false); }}>
          Delete Item
        </Button>
        {show && (
          <Toast
            id="with-action"
            description="Item deleted"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setUndone(true);
                  setTimeout(() => setShow(false), 2000);
                }}
              >
                Undo
              </Button>
            }
            onClose={() => setShow(false)}
          />
        )}
        {undone && (
          <p className="text-sm text-muted-foreground mt-4">Action undone!</p>
        )}
      </>
    );
  },
};

export const LongMessage: Story = {
  render: () => {
    const [show, setShow] = useState(false);
    
    return (
      <>
        <Button onClick={() => setShow(true)}>Show Long Message</Button>
        {show && (
          <Toast
            id="long-message"
            description="This is a much longer toast message that demonstrates how the toast component handles multiple lines of text content gracefully."
            variant="info"
            onClose={() => setShow(false)}
          />
        )}
      </>
    );
  },
};

export const AutoDismiss: Story = {
  render: () => {
    const [toasts, setToasts] = useState<number[]>([]);
    let idCounter = 0;
    
    const showToast = () => {
      const id = ++idCounter;
      setToasts(prev => [...prev, id]);
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t !== id));
      }, 3000);
    };
    
    return (
      <div className="space-y-4">
        <Button onClick={showToast}>
          Show Auto-dismiss Toast (3s)
        </Button>
        <p className="text-sm text-muted-foreground">
          Click multiple times to stack toasts
        </p>
        
        <div className="fixed bottom-4 right-4 space-y-2">
          {toasts.map(id => (
            <Toast
              key={id}
              id={`auto-${id}`}
              description={`Toast #${id} - Auto-dismissing...`}
              variant="info"
              onClose={() => setToasts(prev => prev.filter(t => t !== id))}
            />
          ))}
        </div>
      </div>
    );
  },
};

export const ToastStack: Story = {
  render: () => {
    const [toasts, setToasts] = useState<Array<{
      id: number;
      variant: 'success' | 'error' | 'warning' | 'info';
      message: string;
    }>>([]);
    let idCounter = 0;
    
    const addToast = (variant: 'success' | 'error' | 'warning' | 'info', message: string) => {
      const id = ++idCounter;
      setToasts(prev => [...prev, { id, variant, message }]);
    };
    
    const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    };
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Button onClick={() => addToast('success', 'File saved successfully!')}>
            Save File
          </Button>
          <Button onClick={() => addToast('error', 'Failed to connect to server')}>
            Test Connection
          </Button>
          <Button onClick={() => addToast('warning', 'Your session will expire in 5 minutes')}>
            Check Session
          </Button>
          <Button onClick={() => addToast('info', 'New version available')}>
            Check Updates
          </Button>
        </div>
        
        <div className="fixed bottom-4 right-4 space-y-2 max-w-sm">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={`stack-${toast.id}`}
              variant={toast.variant}
              description={toast.message}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    );
  },
};

export const CustomStyling: Story = {
  render: () => {
    const [show, setShow] = useState(false);
    
    return (
      <>
        <Button onClick={() => setShow(true)}>Show Custom Toast</Button>
        {show && (
          <Toast
            id="custom-styled"
            description="Custom styled toast"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
            onClose={() => setShow(false)}
          />
        )}
      </>
    );
  },
};