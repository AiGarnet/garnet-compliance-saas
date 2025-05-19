import { Vendor, VendorStatus } from './VendorList';

export type SortDirection = 'asc' | 'desc';
export type SortField = 'name' | 'status';

// Get the order value for sorting statuses
export function getStatusOrder(status: VendorStatus): number {
  switch (status) {
    case 'Questionnaire Pending': return 1;
    case 'In Review': return 2;
    case 'Approved': return 3;
    default: return 0;
  }
}

// Sort vendors based on field and direction
export function sortVendors(
  vendors: Vendor[], 
  field: SortField, 
  direction: SortDirection
): Vendor[] {
  return [...vendors].sort((a, b) => {
    if (field === 'name') {
      return direction === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      // Sort by status based on logical flow
      const statusOrderA = getStatusOrder(a.status);
      const statusOrderB = getStatusOrder(b.status);
      return direction === 'asc'
        ? statusOrderA - statusOrderB
        : statusOrderB - statusOrderA;
    }
  });
}

// Filter vendors based on status
export function filterVendorsByStatus(
  vendors: Vendor[], 
  statusFilter: VendorStatus | 'All'
): Vendor[] {
  if (statusFilter === 'All') {
    return vendors;
  }
  return vendors.filter(vendor => vendor.status === statusFilter);
}

// Search vendors by name (case-insensitive)
export function searchVendorsByName(
  vendors: Vendor[], 
  searchTerm: string
): Vendor[] {
  if (!searchTerm.trim()) {
    return vendors;
  }
  
  const lowercaseSearch = searchTerm.toLowerCase();
  return vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(lowercaseSearch)
  );
} 