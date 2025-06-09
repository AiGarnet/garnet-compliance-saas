/**
 * Design Token Utilities
 * Helper functions for working with CSS custom properties and design tokens
 */

/**
 * Get the current value of a CSS custom property
 * @param propertyName - The name of the CSS custom property (without the -- prefix)
 * @param element - The element to get the property from (defaults to :root)
 * @returns The value of the CSS custom property
 */
export function getTokenValue(propertyName: string, element: HTMLElement | null = null): string {
  // Use the document element if no element is provided
  const targetElement = element || document.documentElement;
  // Get the computed style
  const styles = getComputedStyle(targetElement);
  // Return the value of the property
  return styles.getPropertyValue(`--${propertyName}`).trim();
}

/**
 * Set a CSS custom property value
 * @param propertyName - The name of the CSS custom property (without the -- prefix)
 * @param value - The value to set
 * @param element - The element to set the property on (defaults to :root)
 */
export function setTokenValue(propertyName: string, value: string, element: HTMLElement | null = null): void {
  // Use the document element if no element is provided
  const targetElement = element || document.documentElement;
  // Set the property value
  targetElement.style.setProperty(`--${propertyName}`, value);
}

/**
 * Reset a CSS custom property to its default value
 * @param propertyName - The name of the CSS custom property (without the -- prefix)
 * @param element - The element to reset the property on (defaults to :root)
 */
export function resetTokenValue(propertyName: string, element: HTMLElement | null = null): void {
  // Use the document element if no element is provided
  const targetElement = element || document.documentElement;
  // Remove the property
  targetElement.style.removeProperty(`--${propertyName}`);
}

/**
 * Toggle dark mode by adding/removing the dark-mode class to the HTML element
 * @param isDark - Whether to enable dark mode
 */
export function setDarkMode(isDark: boolean): void {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }
}

/**
 * Check if dark mode is currently active
 * @returns Whether dark mode is active
 */
export function isDarkMode(): boolean {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark-mode');
  }
  return false;
}

/**
 * Initialize the theme based on user preference or system preference
 */
export function initializeTheme(): void {
  if (typeof window !== 'undefined') {
    // Always force light mode - ignore any saved preferences
    setDarkMode(false);
    
    // Remove any existing theme preference to ensure it stays light
    localStorage.setItem('theme', 'light');
    
    // Remove the system preference listener since we always want light mode
    // No longer listening to system preference changes
  }
}

/**
 * Force light mode - utility function to ensure light theme is always applied
 * Call this function to override any theme settings and force light mode
 */
export function forceLightMode(): void {
  if (typeof document !== 'undefined') {
    // Remove dark mode class
    document.documentElement.classList.remove('dark-mode');
    // Set light theme in localStorage
    localStorage.setItem('theme', 'light');
    // Remove any other theme-related classes that might exist
    document.documentElement.classList.remove('dark-theme', 'dark');
    document.documentElement.classList.add('light-mode');
  }
} 