// Percy setup for visual regression testing
import * as percy from '@percy/cli';
import React from 'react';
import { render } from '@testing-library/react';
import { VendorList } from './components/dashboard/VendorList';

// Sample test data
const mockVendors = [
  { id: '1', name: 'Acme Corp', status: 'Questionnaire Pending' },
  { id: '2', name: 'Globex Ltd', status: 'In Review' },
  { id: '3', name: 'Stark Industries', status: 'Approved' },
];

// Take snapshots of the VendorList component in various states
async function captureSnapshots() {
  console.log('Starting Percy snapshots for VendorList component...');

  // Normal list state
  const normalList = render(<VendorList vendors={mockVendors} />);
  await percy.snapshot({
    name: 'VendorList - Normal State',
    dom: normalList.container,
    widths: [375, 768, 1280],
  });
  
  // Empty state
  const emptyList = render(<VendorList vendors={[]} />);
  await percy.snapshot({
    name: 'VendorList - Empty State',
    dom: emptyList.container,
    widths: [375, 768, 1280],
  });
  
  // Loading state
  const loadingList = render(<VendorList vendors={[]} isLoading={true} />);
  await percy.snapshot({
    name: 'VendorList - Loading State',
    dom: loadingList.container,
    widths: [375, 768, 1280],
  });
  
  // Error state
  const errorList = render(
    <VendorList vendors={[]} error="Failed to load vendors" onRetry={() => {}} />
  );
  await percy.snapshot({
    name: 'VendorList - Error State',
    dom: errorList.container,
    widths: [375, 768, 1280],
  });
  
  console.log('Percy snapshots completed!');
}

// Run the function if this file is executed directly
if (require.main === module) {
  captureSnapshots().catch(console.error);
}

export { captureSnapshots }; 