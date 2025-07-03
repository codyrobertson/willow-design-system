import React, { ReactNode } from 'react';
import { AdapterProvider, AdapterProviderProps } from './AdapterContext';
import { ComponentProvider, ComponentProviderProps } from './ComponentContext';
import { ThemeProvider, ThemeProviderProps } from './ThemeContext';

/**
 * Combined provider props
 */
export interface CombinedProviderProps {
  children: ReactNode;
  
  // Adapter provider props
  adapter?: Omit<AdapterProviderProps, 'children'>;
  
  // Component provider props
  component?: Omit<ComponentProviderProps, 'children'>;
  
  // Theme provider props
  theme?: Omit<ThemeProviderProps, 'children'>;
}

/**
 * Combined provider component that wraps all context providers
 */
export function CombinedProvider({
  children,
  adapter = {},
  component = {},
  theme = {},
}: CombinedProviderProps) {
  return (
    <AdapterProvider {...adapter}>
      <ComponentProvider {...component}>
        <ThemeProvider {...theme}>
          {children}
        </ThemeProvider>
      </ComponentProvider>
    </AdapterProvider>
  );
}