import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { VendorList, Vendor, VendorStatus } from '../VendorList';

// Sample test data
const mockVendors: Vendor[] = [
  { id: '1', name: 'Acme Corp', status: 'Questionnaire Pending' as VendorStatus },
  { id: '2', name: 'Globex Ltd', status: 'In Review' as VendorStatus },
  { id: '3', name: 'Stark Industries', status: 'Approved' as VendorStatus },
];

describe('VendorList Accessibility', () => {
  it('should have no accessibility violations in normal state', async () => {
    const { container } = render(<VendorList vendors={mockVendors} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in loading state', async () => {
    const { container } = render(<VendorList vendors={[]} isLoading={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in error state', async () => {
    const { container } = render(
      <VendorList 
        vendors={[]} 
        error="Failed to load vendors" 
        onRetry={() => {}} 
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in empty state', async () => {
    const { container } = render(<VendorList vendors={[]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with filtered results', async () => {
    const { container } = render(<VendorList vendors={mockVendors} />);
    // No need to interact here, just checking the static markup with filters present
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should use proper aria attributes for sorting columns', async () => {
    const { container } = render(<VendorList vendors={mockVendors} />);
    const tableHeads = container.querySelectorAll('th[aria-sort]');
    expect(tableHeads.length).toBeGreaterThan(0);
    // At least one should have aria-sort="none", "ascending", or "descending"
    const hasAriaSort = Array.from(tableHeads).some(th => 
      th.getAttribute('aria-sort') === 'none' || 
      th.getAttribute('aria-sort') === 'ascending' || 
      th.getAttribute('aria-sort') === 'descending'
    );
    expect(hasAriaSort).toBe(true);
  });

  it('should provide accessible status updates', async () => {
    const { container } = render(<VendorList vendors={mockVendors} />);
    const liveRegions = container.querySelectorAll('[aria-live]');
    // Check that we have at least one aria-live region
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  it('should have proper focus management in interactive elements', async () => {
    const { container } = render(<VendorList vendors={mockVendors} />);
    
    // Verify all interactive elements are focusable
    const interactiveElements = container.querySelectorAll('button, [role="button"], a, [tabindex="0"]');
    expect(interactiveElements.length).toBeGreaterThan(0);
    
    // Verify all focusable elements have accessible names
    const allHaveAccessibleNames = Array.from(interactiveElements).every(el => {
      // Check for aria-label, aria-labelledby, or text content
      return el.hasAttribute('aria-label') || 
             el.hasAttribute('aria-labelledby') || 
             (el.textContent?.trim().length ?? 0) > 0;
    });
    expect(allHaveAccessibleNames).toBe(true);
  });
}); 