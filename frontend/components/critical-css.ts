export const criticalNavCSS = `
:root {
  --primary-color: #3b82f6;
  --primary-light: #93c5fd;
  --primary-dark: #1e40af;
  --header-bg: #ffffff;
  --header-text: #1f2937;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  
  /* Site-wide colors */
  --body-bg: #f9fafb;
  --body-text: #111827;
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --card-text: #374151;
  --muted-text: #6b7280;
  --success-color: #10b981;
  --success-light: #d1fae5;
  --warning-color: #f59e0b;
  --warning-light: #fef3c7;
  --danger-color: #ef4444;
  --danger-light: #fee2e2;
  --secondary-color: #6b7280;
  --secondary-light: #e5e7eb;
  --controls-bg: #f3f4f6; /* Light mode controls background */
  --controls-text: #111827; /* Light mode controls text */
  --switch-active: #3b82f6; /* Active switch color */
  --switch-inactive: #6b7280; /* Inactive switch color */
  --search-icon: #6b7280; /* Search icon color in light mode */
  --search-text: #111827; /* Search text color in light mode */
  --search-placeholder: #6b7280; /* Search placeholder color in light mode */
  --search-bg: #f3f4f6; /* Search background in light mode */
}

/* Dark Mode Variables */
.dark-mode {
  --header-bg: #1f2937;
  --header-text: #f9fafb;
  --primary-color: #60a5fa;
  --primary-light: #1e40af;
  --primary-dark: #93c5fd;
  
  /* Site-wide dark mode colors */
  --body-bg: #111827;
  --body-text: #f9fafb;
  --card-bg: #1f2937;
  --card-border: #374151;
  --card-text: #e5e7eb;
  --muted-text: #9ca3af;
  --success-color: #34d399;
  --success-light: #064e3b;
  --warning-color: #fbbf24;
  --warning-light: #78350f;
  --danger-color: #f87171;
  --danger-light: #7f1d1d;
  --secondary-color: #9ca3af;
  --secondary-light: #374151;
  --controls-bg: #1f2937; /* Dark mode controls background */
  --controls-text: #e5e7eb; /* Dark mode controls text */
  --switch-active: #60a5fa; /* Active switch color in dark mode */
  --switch-inactive: #9ca3af; /* Inactive switch color in dark mode */
  --search-icon: #9ca3af; /* Search icon color in dark mode */
  --search-text: #e5e7eb; /* Search text color in dark mode */
  --search-placeholder: #9ca3af; /* Search placeholder color in dark mode */
  --search-bg: #1f2937; /* Search background in dark mode */
}

/* Apply dark mode to the entire body */
body {
  background-color: var(--body-bg);
  color: var(--body-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Explicitly style the navbar in both modes */
header {
  background-color: var(--header-bg) !important;
  color: var(--header-text) !important;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.dark-mode header {
  background-color: var(--header-bg) !important;
  color: var(--header-text) !important;
}

/* Direct targeting for the header background to override any existing styles */
.bg-white.z-30, 
header.z-30,
header.sticky {
  background-color: var(--header-bg) !important;
}

.dark-mode .bg-white.z-30,
.dark-mode header.z-30,
.dark-mode header.sticky {
  background-color: var(--header-bg) !important;
}

/* Target the testing controls div specifically */
.bg-gray-100,
.bg-controls-bg {
  background-color: var(--controls-bg) !important;
  color: var(--controls-text) !important;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Ensure all cards properly follow the theme */
.bg-white {
  background-color: var(--card-bg) !important;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* Dark mode for all cards, containers, and common elements */
.dark-mode .bg-white {
  background-color: var(--card-bg) !important;
}

.dark-mode .border-gray-100,
.dark-mode .border-gray-200 {
  border-color: var(--card-border);
}

.dark-mode .text-gray-500,
.dark-mode .text-gray-600 {
  color: var(--muted-text);
}

.dark-mode .text-gray-700,
.dark-mode .text-gray-800,
.dark-mode .text-gray-900 {
  color: var(--body-text);
}

.dark-mode .bg-gray-50,
.dark-mode .bg-gray-100 {
  background-color: var(--secondary-light);
}

/* Style search inputs consistently across the application */
input[type="text"], 
input[type="search"] {
  background-color: var(--search-bg);
  color: var(--search-text);
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

input[type="text"]::placeholder, 
input[type="search"]::placeholder {
  color: var(--search-placeholder);
}

/* Style for search icons inside inputs or buttons */
button svg[stroke], 
.search-icon {
  color: var(--search-icon);
}

/* Custom styles for vendor list controls */
.vendor-controls .label,
.testing-controls .label {
  color: var(--controls-text) !important;
  font-weight: 500;
}

/* Switch button styles */
.switch-button {
  background-color: var(--switch-inactive);
  transition: background-color 0.3s ease;
}

.switch-button.active {
  background-color: var(--switch-active);
}

/* Skip to content link */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only.focus:not-sr-only {
  position: absolute;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
  background-color: var(--primary-color);
  color: white;
  border-radius: 0.25rem;
  z-index: 100;
}

/* Core navigation styles */
header {
  position: sticky;
  top: 0;
  z-index: 30;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* RTL Support */
[dir="rtl"] .header-logo {
  margin-right: 0;
  margin-left: 0.75rem;
}

/* High-contrast focus styles */
a:focus, button:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Media query for responsive behavior */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }
}

/* Performance optimizations */
.nav-transition {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
}

/* Apply top margin to main content to prevent it from being hidden under the sticky header */
main {
  margin-top: 0;
}

/* Force Tailwind classes to respect CSS variables by overriding with !important */
.text-gray-800, .text-gray-900 {
  color: var(--body-text) !important;
}

.text-gray-600, .text-gray-700 {
  color: var(--card-text) !important;
}

.text-gray-500 {
  color: var(--muted-text) !important;
}
`;

export const injectCriticalCSS = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = criticalNavCSS;
    document.head.appendChild(style);
    
    // Add class to html element to help style overrides take effect immediately
    document.documentElement.classList.add('theme-enabled');
    
    // Dark mode is now handled by the Header component using localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    }
  }
}; 