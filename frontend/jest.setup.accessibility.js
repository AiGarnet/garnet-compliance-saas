// Setup file for accessibility testing
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { configure } from '@testing-library/react';

// Add custom matchers for jest-axe
expect.extend(toHaveNoViolations);

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Configure axe options
global.axeConfig = {
  rules: {
    // Ensure contrast ratio meets WCAG AA standards
    'color-contrast': { enabled: true },
    // Check for semantic table markup
    'table-fake-caption': { enabled: true },
    'td-has-header': { enabled: true },
    // Check for proper labeling
    'label': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-toggle-field-name': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    // Screen reader support
    'aria-hidden-focus': { enabled: true },
    'focus-order-semantics': { enabled: true },
  },
}; 