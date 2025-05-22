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
    // Check if the user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setDarkMode(true);
    } else if (savedTheme === 'light') {
      setDarkMode(false);
    } else {
      // Check if the user prefers dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
    
    // Add a listener for the system preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const systemPrefersDark = e.matches;
      // Only apply system preference if the user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        setDarkMode(systemPrefersDark);
      }
    });
  }
} 