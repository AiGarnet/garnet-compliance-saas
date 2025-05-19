"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, ArrowUpDown, AlertTriangle, Loader2 } from 'lucide-react';

// Components
import { VendorDetailModal } from './VendorDetailModal';
import { StatusBadge } from './StatusBadge';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterPills } from '@/components/ui/FilterPills';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';

// Utilities
import { 
  sortVendors, 
  filterVendorsByStatus, 
  searchVendorsByName,
  SortField,
  SortDirection,
} from './utils';

// Define the possible vendor statuses
export type VendorStatus = 'Questionnaire Pending' | 'In Review' | 'Approved';

// Enhanced vendor interface with required status
export interface Vendor {
  id: string;
  name: string;
  status: VendorStatus;
}

export interface VendorListProps {
  vendors: Vendor[];
  className?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function VendorList({ 
  vendors: initialVendors, 
  className,
  isLoading = false,
  error = '',
  onRetry
}: VendorListProps) {
  // State for modal
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // State for filtering
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'All'>('All');
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter and sort vendors based on current state
  const filteredAndSortedVendors = useMemo(() => {
    if (!initialVendors) return [];
    
    // Apply filters in sequence: status filter -> search -> sort
    const statusFiltered = filterVendorsByStatus(initialVendors, statusFilter);
    const searchFiltered = searchVendorsByName(statusFiltered, searchTerm);
    return sortVendors(searchFiltered, sortField, sortDirection);
    
  }, [initialVendors, statusFilter, searchTerm, sortField, sortDirection]);
  
  const openVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const closeModal = () => {
    setSelectedVendor(null);
  };

  // Render filter pills
  const renderFilterPills = () => {
    const statuses: (VendorStatus | 'All')[] = ['All', 'Questionnaire Pending', 'In Review', 'Approved'];
    
    return (
      <FilterPills
        options={statuses}
        selectedOption={statusFilter}
        onChange={setStatusFilter}
        className="mb-4"
        label="Filter vendors by status"
      />
    );
  };

  // Render search bar
  const renderSearchBar = () => {
    return (
      <SearchBar
        id="vendor-search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search vendors by name..."
        className="mb-4"
        label="Search vendors by name"
      />
    );
  };

  // Render different states
  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16" aria-live="polite">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500">Loading vendors...</p>
        </div>
      );
    }
    
    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center" aria-live="assertive">
          <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <p className="text-gray-800 mb-4">{error || 'Unable to load vendors.'}</p>
          {onRetry && (
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
        </div>
      );
    }
    
    // Empty state
    if (filteredAndSortedVendors.length === 0) {
      // If no vendors at all
      if (initialVendors.length === 0 && !searchTerm && statusFilter === 'All') {
        return (
          <div 
            className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
            aria-live="polite"
          >
            <p className="text-gray-500 text-center mb-2">No vendors in onboarding yet.</p>
            <p className="text-gray-500 text-center">Invite your first vendor →</p>
          </div>
        );
      }
      
      // If no vendors after filtering/searching
      return (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
          aria-live="polite"
        >
          <p className="text-gray-500 text-center">No vendors match your current filters.</p>
          <button 
            className="mt-4 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
            }}
          >
            Clear all filters
          </button>
        </div>
      );
    }
    
    // Vendor list as table for desktop and cards for mobile
    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-3/5"
                  onClick={() => handleSort('name')}
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/5"
                  onClick={() => handleSort('status')}
                  aria-sort={sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-1/5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedVendors.map(vendor => (
                <TableRow 
                  key={vendor.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openVendorDetails(vendor)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openVendorDetails(vendor);
                    }
                  }}
                >
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={vendor.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <button 
                      className="text-sm text-purple-600 hover:text-purple-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        openVendorDetails(vendor);
                      }}
                    >
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden">
          <ul className="space-y-3">
            {filteredAndSortedVendors.map(vendor => (
              <li 
                key={vendor.id}
                className="flex flex-col p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                onClick={() => openVendorDetails(vendor)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-gray-800 font-medium">{vendor.name}</span>
                  <StatusBadge status={vendor.status} />
                </div>
                <div className="flex justify-end mt-4">
                  <button 
                    className="text-sm text-purple-600 hover:text-purple-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      openVendorDetails(vendor);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  };

  return (
    <>
      <section 
        aria-label="Vendor list" 
        className={cn(
          "bg-white p-8 rounded-xl shadow-sm border border-gray-200",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Vendors</h2>
        </div>

        {renderSearchBar()}
        {renderFilterPills()}
        {renderContent()}
      </section>

      {/* Render the vendor detail modal when a vendor is selected */}
      {selectedVendor && (
        <VendorDetailModal 
          vendor={selectedVendor} 
          onClose={closeModal} 
        />
      )}
    </>
  );
} 