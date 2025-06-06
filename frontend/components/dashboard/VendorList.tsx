"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, ArrowUpDown, AlertTriangle, Loader2, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { translations } from '@/lib/i18n';

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

import { Vendor, VendorStatus } from '@/types/vendor';

export interface VendorListProps {
  vendors: Vendor[];
  className?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  locale?: string;
  onViewQuestionnaire?: (vendorId: string) => void;
}

export function VendorList({ 
  vendors: initialVendors, 
  className,
  isLoading = false,
  error = '',
  onRetry,
  locale = 'en',
  onViewQuestionnaire
}: VendorListProps) {
  // Access translations based on locale
  const t = translations[locale as keyof typeof translations]?.vendorList || translations.en.vendorList;
  
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

  // Map status values to i18n keys
  const getStatusI18nKey = (status: VendorStatus | 'All'): string => {
    switch(status) {
      case 'All': return t.status.all;
      case VendorStatus.QUESTIONNAIRE_PENDING: return t.status.questionnairePending;
      case VendorStatus.IN_REVIEW: return t.status.inReview;
      case VendorStatus.APPROVED: return t.status.approved;
      default: return status;
    }
  }

  // Status filter handler to convert string to correct type
  const handleStatusFilterChange = (option: string) => {
    setStatusFilter(option as VendorStatus | 'All');
  };

  // Get the appropriate action button text based on vendor status
  const getQuestionnaireActionText = (status: VendorStatus): string => {
    switch(status) {
      case VendorStatus.QUESTIONNAIRE_PENDING:
        return 'Start Questionnaire';
      case VendorStatus.IN_REVIEW:
        return 'Continue Questionnaire';
      case VendorStatus.APPROVED:
        return 'View Questionnaire';
      default:
        return 'Start Questionnaire';
    }
  };

  // Render filter pills
  const renderFilterPills = () => {
    const statuses: (VendorStatus | 'All')[] = ['All', VendorStatus.QUESTIONNAIRE_PENDING, VendorStatus.IN_REVIEW, VendorStatus.APPROVED];
    const translatedStatuses = statuses.map(status => ({
      value: status,
      label: getStatusI18nKey(status)
    }));
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.filter.label}</label>
        <FilterPills
          options={translatedStatuses}
          selectedOption={statusFilter}
          onChange={handleStatusFilterChange}
          className="flex flex-wrap gap-2"
          label={t.filter.label}
        />
      </div>
    );
  };

  // Render search bar
  const renderSearchBar = () => {
    return (
      <div className="bg-white rounded-lg mb-6 border border-gray-200 shadow-sm">
        <SearchBar
          id="vendor-search"
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t.search.placeholder}
          className="w-full"
          label={t.search.label}
        />
      </div>
    );
  };

  // Render different states
  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 border border-gray-100 rounded-lg bg-white" aria-live="polite">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
          </div>
          <p className="text-gray-600 font-medium">{t.loading}</p>
        </div>
      );
    }
    
    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-danger/10 rounded-lg bg-danger/5" aria-live="assertive">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-6" aria-hidden="true">
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>
          <p className="text-gray-800 font-medium mb-6">{t.error}</p>
          {onRetry && (
            <button 
              className="px-6 py-3 bg-white text-danger border border-danger/30 shadow-sm rounded-md hover:bg-danger/5 focus:outline-none focus:ring-2 focus:ring-danger/30 transition-colors font-medium"
              onClick={onRetry}
              aria-label={t.retry}
            >
              {t.retry}
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
            className="border-2 border-dashed border-gray-200 rounded-lg p-20 flex flex-col items-center justify-center bg-gray-50"
            aria-live="polite"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 17.3438 16.8736 16.717 16.6438 16.1429M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M7 20V18C7 17.3438 7.12642 16.717 7.35625 16.1429M7.35625 16.1429C8.0935 14.301 9.89482 13 12 13C14.1052 13 15.9065 14.301 16.6438 16.1429M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7ZM5 9C5 10.1046 4.10457 11 3 11C1.89543 11 1 10.1046 1 9C1 7.89543 1.89543 7 3 7C4.10457 7 5 7.89543 5 9ZM23 9C23 10.1046 22.1046 11 21 11C19.8954 11 19 10.1046 19 9C19 7.89543 19.8954 7 21 7C22.1046 7 23 7.89543 23 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">{t.emptyState.noVendors}</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">{t.emptyState.invite}</p>
            <Link 
              href="/vendors/new" 
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors font-medium inline-flex items-center"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Your First Vendor
            </Link>
          </div>
        );
      }
      
      // If no vendors after filtering/searching
      return (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-lg p-16 flex flex-col items-center justify-center bg-gray-50"
          aria-live="polite"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 21H14M10 21H6.2C5.0799 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V6.2C3 5.0799 3 4.51984 3.21799 4.09202C3.40973 3.71569 3.71569 3.40973 4.09202 3.21799C4.51984 3 5.0799 3 6.2 3H17.8C18.9201 3 19.4802 3 19.908 3.21799C20.2843 3.40973 20.5903 3.71569 20.782 4.09202C21 4.51984 21 5.0799 21 6.2V17.8C21 18.9201 21 19.4802 20.782 19.908C20.5903 20.2843 20.2843 20.5903 19.908 20.782C19.4802 21 18.9201 21 17.8 21H14M10 21V16M14 21V16M14 16H15.5C15.9644 16 16.1966 16 16.391 15.9455C16.5634 15.8976 16.7256 15.8225 16.8714 15.7236C17.0373 15.6102 17.1667 15.4515 17.4254 15.1339L22 9.5L17 5L11.5 9.8C11.1869 10.0575 11.0303 10.1863 10.9196 10.3433C10.8202 10.4827 10.7431 10.6375 10.6909 10.8023C10.6312 10.9897 10.6257 11.1851 10.6146 11.576L10.5 16M10.5 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">{t.emptyState.noMatches}</h3>
          <p className="text-gray-500 text-center max-w-md mb-4">Try adjusting your filters to find what you're looking for.</p>
          <button 
            className="px-5 py-2.5 bg-white text-primary border border-primary/30 shadow-sm rounded-md hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors font-medium"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
            }}
          >
            {t.emptyState.clearFilters}
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
          <Table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <caption className="sr-only">List of vendors and their current status</caption>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-200">
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors w-2/5 py-4"
                  onClick={() => handleSort('name')}
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  scope="col"
                >
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700">{t.table.name}</span>
                    <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'name' ? 'text-primary' : 'text-gray-400'}`} aria-hidden="true" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors w-1/5 py-4"
                  onClick={() => handleSort('status')}
                  aria-sort={sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  scope="col"
                >
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700">{t.table.status}</span>
                    <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'status' ? 'text-primary' : 'text-gray-400'}`} aria-hidden="true" />
                  </div>
                </TableHead>
                <TableHead className="w-2/5 text-right py-4" scope="col">
                  <span className="font-semibold text-gray-700">{t.table.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedVendors.map((vendor, index) => (
                <TableRow 
                  key={vendor.id}
                  id={`vendor-row-${index}`}
                  className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  tabIndex={0}
                  onKeyDown={(e) => handleTableKeyDown(e, vendor, index)}
                  aria-label={`${vendor.name}, Status: ${getStatusI18nKey(vendor.status as VendorStatus)}`}
                >
                  <TableCell className="font-medium py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                      <span>{vendor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <StatusBadge status={vendor.status} />
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end items-center gap-3">
                      <Link 
                        href={`/vendors/${vendor.id}`}
                        className="text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 py-2 px-4 rounded-md w-[120px] text-center border border-gray-300 shadow-sm hover:shadow transition-all inline-flex items-center justify-center h-[40px]"
                        aria-label={`${t.table.viewDetails} ${vendor.name}`}
                      >
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        {t.table.viewDetails}
                      </Link>
                      {onViewQuestionnaire && (
                        <button
                          onClick={() => onViewQuestionnaire(vendor.id)}
                          className={`text-sm font-medium text-white py-2 px-4 rounded-md w-[180px] text-center shadow-sm hover:shadow transition-all inline-flex items-center justify-center h-[40px] ${
                            vendor.status === 'Questionnaire Pending' 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600' 
                              : vendor.status === 'In Review' 
                                ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600' 
                                : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                          }`}
                          aria-label={`${getQuestionnaireActionText(vendor.status as VendorStatus)} for ${vendor.name}`}
                        >
                          {vendor.status === 'Questionnaire Pending' && (
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {vendor.status === 'In Review' && (
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {vendor.status === 'Approved' && (
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {getQuestionnaireActionText(vendor.status as VendorStatus)}
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden">
          <ul className="space-y-4" aria-label="Vendor list">
            {filteredAndSortedVendors.map((vendor, index) => (
              <li 
                key={vendor.id}
                id={`vendor-card-${index}`}
                className="flex flex-col p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm bg-white"
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
                aria-label={`${vendor.name}, Status: ${getStatusI18nKey(vendor.status as VendorStatus)}`}
              >
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-gray-800 font-semibold text-lg">{vendor.name}</span>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 py-2 px-4 rounded-md text-center border border-gray-300 shadow-sm hover:shadow transition-all flex items-center justify-center h-[40px] flex-1"
                    aria-label={`${t.table.viewDetails} ${vendor.name}`}
                  >
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    {t.table.viewDetails}
                  </Link>
                  {onViewQuestionnaire && (
                    <button
                      onClick={() => onViewQuestionnaire(vendor.id)}
                      className={`text-sm font-medium text-white py-2 px-4 rounded-md text-center shadow-sm hover:shadow transition-all flex items-center justify-center h-[40px] flex-1 ${
                        vendor.status === 'Questionnaire Pending' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600' 
                          : vendor.status === 'In Review' 
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600' 
                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                      }`}
                      aria-label={`${getQuestionnaireActionText(vendor.status as VendorStatus)} for ${vendor.name}`}
                    >
                      {vendor.status === 'Questionnaire Pending' && (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {vendor.status === 'In Review' && (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {vendor.status === 'Approved' && (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {getQuestionnaireActionText(vendor.status as VendorStatus)}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  };

  return (
    <section 
      aria-label="Vendor list" 
      className={cn(
        "bg-white rounded-xl shadow-md p-6 overflow-hidden border border-gray-100",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mr-3 shadow-sm">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 17.3438 16.8736 16.717 16.6438 16.1429M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M7 20V18C7 17.3438 7.12642 16.717 7.35625 16.1429M7.35625 16.1429C8.0935 14.301 9.89482 13 12 13C14.1052 13 15.9065 14.301 16.6438 16.1429M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7ZM5 9C5 10.1046 4.10457 11 3 11C1.89543 11 1 10.1046 1 9C1 7.89543 1.89543 7 3 7C4.10457 7 5 7.89543 5 9ZM23 9C23 10.1046 22.1046 11 21 11C19.8954 11 19 10.1046 19 9C19 7.89543 19.8954 7 21 7C22.1046 7 23 7.89543 23 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-700">Your Vendors</span>
        </h2>
        <Link 
          href="/vendors/new" 
          className="bg-white hover:bg-gray-50 text-gray-800 font-medium py-2 px-4 rounded-md shadow-sm border border-gray-300 inline-flex items-center transition-all hover:shadow"
        >
          <PlusCircle className="w-4 h-4 mr-2 text-primary" />
          Add New Vendor
        </Link>
      </div>

      {renderSearchBar()}
      {renderFilterPills()}
      {renderContent()}
      
      {/* Hidden status for screen readers */}
      <div className="sr-only" aria-live="polite" ref={statusUpdateRef}></div>
    </section>
  );
} 