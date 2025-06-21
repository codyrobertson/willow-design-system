/**
 * Standardized Component API Types
 * All components MUST follow these patterns
 */

export type Size = 'sm' | 'md' | 'lg';

export type Variant = 
  | 'default' 
  | 'primary'
  | 'secondary'
  | 'destructive' 
  | 'outline' 
  | 'ghost'
  | 'link';

export type Status = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Base props that ALL components should extend
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Polymorphic component props
 */
export type PolymorphicProps<
  C extends React.ElementType,
  Props = {}
> = Props & {
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof Props | 'as'>;

/**
 * Controlled/Uncontrolled pattern
 */
export type ControlledState<T> = 
  | { value: T; defaultValue?: never; onChange: (value: T) => void }
  | { value?: never; defaultValue?: T; onChange?: (value: T) => void };

/**
 * Compound component context pattern
 */
export interface CompoundComponentContext<T = {}> {
  /**
   * Internal state and methods shared between compound components
   */
  internal: T;
}

/**
 * Standard variant props pattern
 * ALL styled components MUST use this
 */
export interface StyledComponentProps {
  variant?: Variant;
  size?: Size;
  status?: Status;
}

/**
 * Form component props pattern
 */
export interface FormComponentProps extends BaseComponentProps {
  name?: string;
  disabled?: boolean;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

/**
 * Interactive component props pattern
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}