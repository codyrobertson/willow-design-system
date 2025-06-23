import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';

const meta: Meta = {
  title: 'Debug/Color Test',
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

export const ColorTest: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Direct Color Classes Test</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-2">Success Colors:</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-success-50 border rounded flex items-center justify-center text-xs">50</div>
              <div className="w-20 h-20 bg-success-100 border rounded flex items-center justify-center text-xs">100</div>
              <div className="w-20 h-20 bg-success-200 border rounded flex items-center justify-center text-xs">200</div>
              <div className="w-20 h-20 bg-success-300 border rounded flex items-center justify-center text-xs">300</div>
              <div className="w-20 h-20 bg-success-400 border rounded flex items-center justify-center text-xs text-white">400</div>
              <div className="w-20 h-20 bg-success-500 border rounded flex items-center justify-center text-xs text-white">500</div>
              <div className="w-20 h-20 bg-success-600 border rounded flex items-center justify-center text-xs text-white">600</div>
              <div className="w-20 h-20 bg-success-700 border rounded flex items-center justify-center text-xs text-white">700</div>
              <div className="w-20 h-20 bg-success-800 border rounded flex items-center justify-center text-xs text-white">800</div>
              <div className="w-20 h-20 bg-success-900 border rounded flex items-center justify-center text-xs text-white">900</div>
            </div>
          </div>
          
          <div>
            <p className="text-sm mb-2">Warning Colors:</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-warning-50 border rounded flex items-center justify-center text-xs">50</div>
              <div className="w-20 h-20 bg-warning-100 border rounded flex items-center justify-center text-xs">100</div>
              <div className="w-20 h-20 bg-warning-200 border rounded flex items-center justify-center text-xs">200</div>
              <div className="w-20 h-20 bg-warning-300 border rounded flex items-center justify-center text-xs">300</div>
              <div className="w-20 h-20 bg-warning-400 border rounded flex items-center justify-center text-xs">400</div>
              <div className="w-20 h-20 bg-warning-500 border rounded flex items-center justify-center text-xs">500</div>
              <div className="w-20 h-20 bg-warning-600 border rounded flex items-center justify-center text-xs text-white">600</div>
              <div className="w-20 h-20 bg-warning-700 border rounded flex items-center justify-center text-xs text-white">700</div>
              <div className="w-20 h-20 bg-warning-800 border rounded flex items-center justify-center text-xs text-white">800</div>
              <div className="w-20 h-20 bg-warning-900 border rounded flex items-center justify-center text-xs text-white">900</div>
            </div>
          </div>
          
          <div>
            <p className="text-sm mb-2">CSS Variable Colors (success/warning):</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-success border rounded flex items-center justify-center text-xs text-white">success</div>
              <div className="w-20 h-20 bg-warning border rounded flex items-center justify-center text-xs text-white">warning</div>
            </div>
          </div>
          
          <div>
            <p className="text-sm mb-2">State Colors:</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-state-success-base border rounded flex items-center justify-center text-xs text-white">base</div>
              <div className="w-20 h-20 bg-state-success-lighter border rounded flex items-center justify-center text-xs">lighter</div>
              <div className="w-20 h-20 bg-state-warning-base border rounded flex items-center justify-center text-xs">base</div>
              <div className="w-20 h-20 bg-state-warning-lighter border rounded flex items-center justify-center text-xs">lighter</div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Component Usage Test</h3>
        <div className="space-y-2">
          <p className="text-success-600">This text should be green (success-600)</p>
          <p className="text-warning-600">This text should be orange (warning-600)</p>
          <div className="p-4 bg-success-100 text-success-800 rounded">Success background with text</div>
          <div className="p-4 bg-warning-100 text-warning-800 rounded">Warning background with text</div>
        </div>
      </div>
    </div>
  ),
};