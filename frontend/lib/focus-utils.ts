/**
 * Focus Utilities
 * Helper functions for creating accessible focus styles
 */

/**
 * Create a focus ring class with custom styles
 * Generates a CSS class string for Tailwind that can be used for custom focus styles
 * 
 * @param options Optional configuration for the focus ring
 * @returns A CSS class string that can be used with className
 */
export function focusRing(options?: {
  color?: string;
  width?: string;
  offset?: string;
  withRing?: boolean;
  withoutOutline?: boolean;
}): string {
  const {
    color = 'var(--focus-ring-color)',
    width = 'var(--focus-ring-width)',
    offset = 'var(--focus-ring-offset)',
    withRing = true,
    withoutOutline = false,
  } = options || {};
  
  let classes = 'focus:outline-none focus-visible:transition-[outline,box-shadow]';
  
  if (!withoutOutline) {
    classes += ` focus-visible:outline focus-visible:outline-[${width}] focus-visible:outline-[${color}] focus-visible:outline-offset-[${offset}]`;
  }
  
  if (withRing) {
    classes += ` focus-visible:ring-2 focus-visible:ring-[${color}] focus-visible:ring-opacity-50`;
  }
  
  return classes;
}

/**
 * Create focus styles optimized for dark mode
 * @returns A CSS class string that works for both light and dark modes
 */
export function focusRingAdaptive(): string {
  return `${focusRing()} dark:focus-visible:outline-white dark:focus-visible:ring-white dark:focus-visible:ring-opacity-50`;
} 