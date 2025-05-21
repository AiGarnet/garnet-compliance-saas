"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, ArrowUpDown, AlertTriangle, Loader2, Download, ExternalLink } from 'lucide-react';
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

// Enhanced report interface
export interface ComplianceReport {
  id: string;
  name: string;
  date: string;
  description: string;
  fileSize: string;
  fileType: string;
  category?: 'Certification' | 'Attestation' | 'Policy' | 'Statement' | 'Other';
}

export interface ComplianceReportListProps {
  reports: ComplianceReport[];
  className?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

type SortField = 'name' | 'date' | 'fileType' | 'fileSize' | 'category';
type SortDirection = 'asc' | 'desc';

// Helper function to convert fileSize string to bytes for sorting
const fileSizeToBytes = (fileSize: string): number => {
  const size = parseFloat(fileSize);
  if (fileSize.includes('KB')) return size * 1024;
  if (fileSize.includes('MB')) return size * 1024 * 1024;
  if (fileSize.includes('GB')) return size * 1024 * 1024 * 1024;
  return size;
};

export function ComplianceReportList({ 
  reports: initialReports, 
  className,
  isLoading = false,
  error = '',
  onRetry
}: ComplianceReportListProps) {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // State for filtering
  const [categoryFilter, setCategoryFilter] = useState<ComplianceReport['category'] | 'All'>('All');
  
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
  
  // Filter and sort reports based on current state
  const filteredAndSortedReports = useMemo(() => {
    if (!initialReports) return [];
    
    // Apply category filter
    let result = [...initialReports];
    
    if (categoryFilter !== 'All') {
      result = result.filter(r => r.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(lowercaseSearch) || 
        r.description.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply sorting
    return result.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else if (sortField === 'fileType') {
        return sortDirection === 'asc'
          ? a.fileType.localeCompare(b.fileType)
          : b.fileType.localeCompare(a.fileType);
      } else if (sortField === 'fileSize') {
        const sizeA = fileSizeToBytes(a.fileSize);
        const sizeB = fileSizeToBytes(b.fileSize);
        return sortDirection === 'asc'
          ? sizeA - sizeB
          : sizeB - sizeA;
      } else if (sortField === 'category') {
        const catA = a.category || 'Other';
        const catB = b.category || 'Other';
        return sortDirection === 'asc'
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      }
      return 0;
    });
  }, [initialReports, categoryFilter, searchTerm, sortField, sortDirection]);
  
  // Render filter pills
  const renderFilterPills = () => {
    const categories: ('All' | 'Certification' | 'Attestation' | 'Policy' | 'Statement' | 'Other')[] = 
      ['All', 'Certification', 'Attestation', 'Policy', 'Statement', 'Other'];
    
    return (
      <FilterPills<'All' | 'Certification' | 'Attestation' | 'Policy' | 'Statement' | 'Other'>
        options={categories}
        selectedOption={categoryFilter || 'All'}
        onChange={(option) => setCategoryFilter(option === 'All' ? 'All' : option)}
        className="mb-4"
        label="Filter reports by category"
      />
    );
  };

  // Render search bar
  const renderSearchBar = () => {
    return (
      <SearchBar
        id="compliance-report-search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search reports by name or description..."
        className="mb-4"
        label="Search compliance reports"
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
          <p className="text-gray-500">Loading compliance reports...</p>
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
          <p className="text-gray-800 mb-4">{error || 'Unable to load compliance reports.'}</p>
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
    if (filteredAndSortedReports.length === 0) {
      // If no reports at all
      if (initialReports.length === 0 && !searchTerm && categoryFilter === 'All') {
        return (
          <div 
            className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
            aria-live="polite"
          >
            <p className="text-gray-500 text-center mb-2">No compliance reports available yet.</p>
            <p className="text-gray-500 text-center">Upload your first compliance report →</p>
          </div>
        );
      }
      
      // If no reports after filtering/searching
      return (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
          aria-live="polite"
        >
          <p className="text-gray-500 text-center">No reports match your current filters.</p>
          <button 
            className="mt-4 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
            }}
          >
            Clear all filters
          </button>
        </div>
      );
    }
    
    // Report list as table for desktop and cards for mobile
    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/4"
                  onClick={() => handleSort('name')}
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/6"
                  onClick={() => handleSort('date')}
                  aria-sort={sortField === 'date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/6"
                  onClick={() => handleSort('category')}
                  aria-sort={sortField === 'category' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-1/4">Description</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/6"
                  onClick={() => handleSort('fileSize')}
                  aria-sort={sortField === 'fileSize' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    File Info
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-1/6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedReports.map(report => (
                <TableRow 
                  key={report.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>{report.category || 'Other'}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">{report.description}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {report.fileSize} • {report.fileType}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-primary hover:text-primary/80 transition-colors flex items-center text-sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden">
          <ul className="space-y-4">
            {filteredAndSortedReports.map(report => (
              <li 
                key={report.id}
                className="bg-white dark:bg-card-bg p-5 rounded-xl shadow-sm border border-gray-200 dark:border-card-border flex flex-col"
              >
                <div className="flex justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">{report.name}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{report.date}</span>
                </div>
                
                {report.category && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full w-fit mb-3">
                    {report.category}
                  </span>
                )}
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">{report.description}</p>
                
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{report.fileSize} • {report.fileType}</span>
                  
                  <div className="flex gap-2">
                    <button className="text-primary hover:text-primary/80 font-medium text-sm flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm flex items-center ml-2">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </button>
                  </div>
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
      aria-label="Compliance reports" 
      className={cn(
        "bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Compliance Reports</h2>
        <button 
          className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Report
        </button>
      </div>

      {renderSearchBar()}
      {renderFilterPills()}
      {renderContent()}
    </section>
  );
} 