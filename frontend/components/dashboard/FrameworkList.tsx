"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, ArrowUpDown, AlertTriangle, Loader2 } from 'lucide-react';
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

// Define the possible framework statuses
export type FrameworkStatus = 'Not Started' | 'In Progress' | 'Near Completion' | 'Completed';

// Enhanced framework interface
export interface Framework {
  id: string;
  name: string;
  progress: number;
  totalControls: number;
  completedControls: number;
  status: FrameworkStatus;
  lastUpdated: string;
}

export interface FrameworkListProps {
  frameworks: Framework[];
  className?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

type SortField = 'name' | 'status' | 'progress' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

export function FrameworkList({ 
  frameworks: initialFrameworks, 
  className,
  isLoading = false,
  error = '',
  onRetry
}: FrameworkListProps) {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // State for filtering
  const [statusFilter, setStatusFilter] = useState<FrameworkStatus | 'All'>('All');
  
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
  
  // Get the status order for sorting
  const getStatusOrder = (status: FrameworkStatus): number => {
    switch (status) {
      case 'Not Started': return 1;
      case 'In Progress': return 2;
      case 'Near Completion': return 3;
      case 'Completed': return 4;
      default: return 0;
    }
  };
  
  // Filter and sort frameworks based on current state
  const filteredAndSortedFrameworks = useMemo(() => {
    if (!initialFrameworks) return [];
    
    // Apply status filter
    let result = [...initialFrameworks];
    
    if (statusFilter !== 'All') {
      result = result.filter(f => f.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply sorting
    return result.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'status') {
        const statusOrderA = getStatusOrder(a.status);
        const statusOrderB = getStatusOrder(b.status);
        return sortDirection === 'asc'
          ? statusOrderA - statusOrderB
          : statusOrderB - statusOrderA;
      } else if (sortField === 'progress') {
        return sortDirection === 'asc'
          ? a.progress - b.progress
          : b.progress - a.progress;
      } else if (sortField === 'lastUpdated') {
        const dateA = new Date(a.lastUpdated);
        const dateB = new Date(b.lastUpdated);
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  }, [initialFrameworks, statusFilter, searchTerm, sortField, sortDirection]);
  
  // Get status badge styling based on status
  const getStatusBadgeStyle = (status: FrameworkStatus) => {
    switch (status) {
      case 'Completed':
        return "bg-success-light text-success";
      case 'Near Completion':
        return "bg-secondary-light text-secondary";
      case 'In Progress':
        return "bg-primary-light text-primary";
      case 'Not Started':
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  // Get progress bar styling based on progress
  const getProgressBarStyle = (progress: number) => {
    if (progress === 100) return "bg-success";
    if (progress > 75) return "bg-secondary";
    if (progress > 30) return "bg-primary";
    if (progress > 0) return "bg-warning";
    return "bg-gray-300";
  };
  
  // Render filter pills
  const renderFilterPills = () => {
    const statuses: (FrameworkStatus | 'All')[] = ['All', 'Not Started', 'In Progress', 'Near Completion', 'Completed'];
    
    return (
      <FilterPills
        options={statuses}
        selectedOption={statusFilter}
        onChange={setStatusFilter}
        className="mb-4"
        label="Filter frameworks by status"
      />
    );
  };

  // Render search bar
  const renderSearchBar = () => {
    return (
      <SearchBar
        id="framework-search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search frameworks by name..."
        className="mb-4"
        label="Search frameworks by name"
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
          <p className="text-gray-500">Loading compliance frameworks...</p>
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
          <p className="text-gray-800 mb-4">{error || 'Unable to load compliance frameworks.'}</p>
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
    if (filteredAndSortedFrameworks.length === 0) {
      // If no frameworks at all
      if (initialFrameworks.length === 0 && !searchTerm && statusFilter === 'All') {
        return (
          <div 
            className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
            aria-live="polite"
          >
            <p className="text-gray-500 text-center mb-2">No compliance frameworks added yet.</p>
            <p className="text-gray-500 text-center">Add your first compliance framework →</p>
          </div>
        );
      }
      
      // If no frameworks after filtering/searching
      return (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
          aria-live="polite"
        >
          <p className="text-gray-500 text-center">No frameworks match your current filters.</p>
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
    
    // Framework list as table for desktop and cards for mobile
    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-2/5"
                  onClick={() => handleSort('name')}
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Framework
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
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/5"
                  onClick={() => handleSort('progress')}
                  aria-sort={sortField === 'progress' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Progress
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/5"
                  onClick={() => handleSort('lastUpdated')}
                  aria-sort={sortField === 'lastUpdated' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Last Updated
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-1/5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedFrameworks.map(framework => (
                <TableRow 
                  key={framework.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{framework.name}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      getStatusBadgeStyle(framework.status)
                    )}>
                      {framework.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={cn(
                          "h-2.5 rounded-full",
                          getProgressBarStyle(framework.progress)
                        )}
                        style={{ width: `${framework.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{framework.progress}%</span>
                      <span>{framework.completedControls}/{framework.totalControls} controls</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {framework.lastUpdated}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-primary hover:text-primary/80 transition-colors">Edit</button>
                      <button className="text-gray-600 hover:text-gray-800 transition-colors">View</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden">
          <ul className="space-y-3">
            {filteredAndSortedFrameworks.map(framework => (
              <li 
                key={framework.id}
                className="flex flex-col p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-800">{framework.name}</h3>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getStatusBadgeStyle(framework.status)
                  )}>
                    {framework.status}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{framework.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={cn(
                        "h-2.5 rounded-full",
                        getProgressBarStyle(framework.progress)
                      )}
                      style={{ width: `${framework.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {framework.completedControls}/{framework.totalControls} controls
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Last Updated:</span> {framework.lastUpdated}
                </div>
                
                <div className="flex justify-end gap-2 mt-auto">
                  <button className="text-primary hover:text-primary/80 transition-colors text-sm">Edit</button>
                  <button className="text-gray-600 hover:text-gray-800 transition-colors text-sm">View</button>
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
      aria-label="Compliance frameworks" 
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Compliance Frameworks</h2>
        <button 
          className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Framework
        </button>
      </div>

      {renderSearchBar()}
      {renderFilterPills()}
      {renderContent()}
    </section>
  );
} 