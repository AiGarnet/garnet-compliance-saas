"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, ArrowUpDown, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Components
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
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // State for filtering
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'All'>('All');
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // Ref for status updates for screen readers
  const statusUpdateRef = useRef<HTMLDivElement>(null);
  
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
  
  // Announce changes to screen readers
  useEffect(() => {
    if (statusUpdateRef.current) {
      const message = `Showing ${filteredAndSortedVendors.length} vendors`;
      statusUpdateRef.current.textContent = message;
    }
  }, [filteredAndSortedVendors.length]);

  // Handle keyboard navigation in table
  const handleTableKeyDown = (e: React.KeyboardEvent, vendor: Vendor, index: number) => {
    const rows = filteredAndSortedVendors.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (index < rows - 1) {
          document.getElementById(`vendor-row-${index + 1}`)?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          document.getElementById(`vendor-row-${index - 1}`)?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        document.getElementById('vendor-row-0')?.focus();
        break;
      case 'End':
        e.preventDefault();
        document.getElementById(`vendor-row-${rows - 1}`)?.focus();
        break;
    }
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
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" aria-hidden="true" />
          <p className="text-gray-500">Loading vendors...</p>
        </div>
      );
    }
    
    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center" aria-live="assertive">
          <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center mb-4" aria-hidden="true">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <p className="text-gray-800 mb-4">Unable to load vendors. Retry?</p>
          {onRetry && (
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={onRetry}
              aria-label="Retry loading vendors"
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
        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" ref={statusUpdateRef}></div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <caption className="sr-only">List of vendors and their current status</caption>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-3/5"
                  onClick={() => handleSort('name')}
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  scope="col"
                >
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/5"
                  onClick={() => handleSort('status')}
                  aria-sort={sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  scope="col"
                >
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                  </div>
                </TableHead>
                <TableHead className="w-1/5 text-right" scope="col">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedVendors.map((vendor, index) => (
                <TableRow 
                  key={vendor.id}
                  id={`vendor-row-${index}`}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(e) => handleTableKeyDown(e, vendor, index)}
                  aria-label={`${vendor.name}, Status: ${vendor.status}`}
                >
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={vendor.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link 
                      href={`/vendors/${vendor.id}`}
                      className="text-sm text-purple-600 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-primary/30 py-1 px-2 rounded"
                      aria-label={`View details for ${vendor.name}`}
                    >
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden">
          <ul className="space-y-3" aria-label="Vendor list">
            {filteredAndSortedVendors.map((vendor, index) => (
              <li 
                key={vendor.id}
                id={`vendor-card-${index}`}
                className="flex flex-col p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && index < filteredAndSortedVendors.length - 1) {
                    e.preventDefault();
                    document.getElementById(`vendor-card-${index + 1}`)?.focus();
                  } else if (e.key === 'ArrowUp' && index > 0) {
                    e.preventDefault();
                    document.getElementById(`vendor-card-${index - 1}`)?.focus();
                  }
                }}
                aria-label={`${vendor.name}, Status: ${vendor.status}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-gray-800 font-medium">{vendor.name}</span>
                  <StatusBadge status={vendor.status} />
                </div>
                <div className="flex justify-end mt-4">
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="text-sm text-purple-600 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-primary/30 py-1 px-2 rounded"
                    aria-label={`View details for ${vendor.name}`}
                  >
                    View Details
                  </Link>
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
          <h2 className="text-xl font-semibold text-gray-800" id="vendor-list-heading">Vendors</h2>
        </div>

        {renderSearchBar()}
        {renderFilterPills()}
        {renderContent()}
      </section>
    </>
  );
} 