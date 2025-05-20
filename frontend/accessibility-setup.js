// Accessibility testing setup
import React from 'react';
import ReactDOM from 'react-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { VendorList } from './components/dashboard/VendorList';

// Add custom matchers for jest-axe
expect.extend(toHaveNoViolations);

// Sample test data
const mockVendors = [
  { id: '1', name: 'Acme Corp', status: 'Questionnaire Pending' },
  { id: '2', name: 'Globex Ltd', status: 'In Review' },
  { id: '3', name: 'Stark Industries', status: 'Approved' },
];

/**
 * Runs accessibility audits on a React component using axe-core
 * @param {React.Component} Component - The component to test
 * @param {Object} props - Props to pass to the component
 * @returns {Promise<Object>} - Results of the accessibility audit
 */
async function runAccessibilityAudit(Component, props) {
  // Create a container for the component
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  // Render the component
  ReactDOM.render(<Component {...props} />, container);
  
  // Run axe
  const results = await axe(container);
  
  // Clean up
  ReactDOM.unmountComponentAtNode(container);
  document.body.removeChild(container);
  
  return results;
}

/**
 * Generate a report from axe results
 * @param {Object} results - Results from axe audit
 * @returns {String} - Formatted report
 */
function generateAccessibilityReport(results) {
  if (results.violations.length === 0) {
    return 'No accessibility violations found.';
  }
  
  let report = '⚠️ Accessibility violations found:\n\n';
  
  results.violations.forEach((violation, index) => {
    report += `${index + 1}. ${violation.help} (${violation.impact} impact)\n`;
    report += `   Rule: ${violation.id}\n`;
    report += `   Description: ${violation.description}\n`;
    report += `   WCAG: ${violation.tags.filter(tag => tag.startsWith('wcag')).join(', ')}\n`;
    report += `   Elements affected: ${violation.nodes.length}\n\n`;
    
    violation.nodes.forEach((node, nodeIndex) => {
      report += `   ${nodeIndex + 1}. ${node.html}\n`;
      report += `      Fix: ${node.failureSummary}\n\n`;
    });
    
    report += '\n';
  });
  
  return report;
}

// Run a comprehensive audit across all states of the VendorList component
async function auditVendorListAccessibility() {
  console.log('Running accessibility audit for VendorList component...');
  
  // Normal state
  const normalResults = await runAccessibilityAudit(VendorList, { vendors: mockVendors });
  
  // Loading state
  const loadingResults = await runAccessibilityAudit(VendorList, { vendors: [], isLoading: true });
  
  // Error state
  const errorResults = await runAccessibilityAudit(VendorList, { 
    vendors: [], 
    error: 'Failed to load vendors', 
    onRetry: () => {} 
  });
  
  // Empty state
  const emptyResults = await runAccessibilityAudit(VendorList, { vendors: [] });
  
  // Generate reports
  console.log('NORMAL STATE:');
  console.log(generateAccessibilityReport(normalResults));
  
  console.log('LOADING STATE:');
  console.log(generateAccessibilityReport(loadingResults));
  
  console.log('ERROR STATE:');
  console.log(generateAccessibilityReport(errorResults));
  
  console.log('EMPTY STATE:');
  console.log(generateAccessibilityReport(emptyResults));
}

// Run the audit if this file is executed directly
if (require.main === module) {
  auditVendorListAccessibility().catch(console.error);
}

export { runAccessibilityAudit, generateAccessibilityReport, auditVendorListAccessibility }; 