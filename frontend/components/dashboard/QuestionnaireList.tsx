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

// Define the possible questionnaire statuses
export type QuestionnaireStatus = 'Not Started' | 'In Progress' | 'In Review' | 'Draft' | 'Completed';

// Enhanced questionnaire interface
export interface Questionnaire {
  id: string;
  name: string;
  status: QuestionnaireStatus;
  dueDate: string;
  progress: number;
}

export interface QuestionnaireListProps {
  questionnaires: Questionnaire[];
  className?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onAddQuestionnaire?: () => void;
  onViewQuestionnaire?: (questionnaire: Questionnaire) => void;
  onEditQuestionnaire?: (questionnaire: Questionnaire) => void;
  onDeleteQuestionnaire?: (questionnaire: Questionnaire) => void;
}

type SortField = 'name' | 'status' | 'dueDate' | 'progress';
type SortDirection = 'asc' | 'desc';

export function QuestionnaireList({ 
  questionnaires: initialQuestionnaires, 
  className,
  isLoading = false,
  error = '',
  onRetry,
  onAddQuestionnaire,
  onViewQuestionnaire,
  onEditQuestionnaire,
  onDeleteQuestionnaire
}: QuestionnaireListProps) {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // State for filtering
  const [statusFilter, setStatusFilter] = useState<QuestionnaireStatus | 'All'>('All');
  
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
  const getStatusOrder = (status: QuestionnaireStatus): number => {
    switch (status) {
      case 'Not Started': return 1;
      case 'Draft': return 2;
      case 'In Progress': return 3;
      case 'In Review': return 4;
      case 'Completed': return 5;
      default: return 0;
    }
  };
  
  // Filter and sort questionnaires based on current state
  const filteredAndSortedQuestionnaires = useMemo(() => {
    if (!initialQuestionnaires) return [];
    
    // Apply status filter
    let result = [...initialQuestionnaires];
    
    if (statusFilter !== 'All') {
      result = result.filter(q => q.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(q => 
        q.name.toLowerCase().includes(lowercaseSearch)
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
      } else if (sortField === 'dueDate') {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else if (sortField === 'progress') {
        return sortDirection === 'asc'
          ? a.progress - b.progress
          : b.progress - a.progress;
      }
      return 0;
    });
  }, [initialQuestionnaires, statusFilter, searchTerm, sortField, sortDirection]);
  
  // Get status badge styling based on status
  const getStatusBadgeStyle = (status: QuestionnaireStatus) => {
    switch (status) {
      case 'Completed':
        return "bg-success-light text-success";
      case 'In Review':
        return "bg-secondary-light text-secondary";
      case 'In Progress':
        return "bg-primary-light text-primary";
      case 'Draft':
        return "bg-warning-light text-warning";
      case 'Not Started':
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  // Get progress bar styling based on progress
  const getProgressBarStyle = (progress: number) => {
    if (progress === 100) return "bg-emerald-500 dark:bg-success";
    if (progress > 75) return "bg-blue-500 dark:bg-secondary";
    if (progress > 30) return "bg-indigo-500 dark:bg-primary";
    if (progress > 0) return "bg-amber-500 dark:bg-warning";
    return "bg-gray-300 dark:bg-gray-600";
  };
  
  // Render filter pills
  const renderFilterPills = () => {
    const statuses: (QuestionnaireStatus | 'All')[] = ['All', 'Not Started', 'Draft', 'In Progress', 'In Review', 'Completed'];
    
    return (
      <FilterPills
        options={statuses}
        selectedOption={statusFilter}
        onChange={setStatusFilter}
        className="mb-4"
        label="Filter questionnaires by status"
      />
    );
  };

  // Render search bar
  const renderSearchBar = () => {
    return (
      <SearchBar
        id="questionnaire-search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search questionnaires by name..."
        className="mb-4"
        label="Search questionnaires by name"
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
          <p className="text-gray-500">Loading questionnaires...</p>
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
          <p className="text-gray-800 mb-4">{error || 'Unable to load questionnaires.'}</p>
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
    if (filteredAndSortedQuestionnaires.length === 0) {
      // If no questionnaires at all
      if (initialQuestionnaires.length === 0 && !searchTerm && statusFilter === 'All') {
        return (
          <div 
            className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
            aria-live="polite"
          >
            <p className="text-gray-500 text-center mb-4">No questionnaires available yet.</p>
            {onAddQuestionnaire && (
              <button 
                onClick={onAddQuestionnaire}
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Questionnaire
              </button>
            )}
          </div>
        );
      }
      
      // If no questionnaires after filtering/searching
      return (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
          aria-live="polite"
        >
          <p className="text-gray-500 text-center">No questionnaires match your current filters.</p>
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
    
    // Questionnaire list as table for desktop and cards for mobile
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
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 transition-colors w-1/5"
                  onClick={() => handleSort('dueDate')}
                  aria-sort={sortField === 'dueDate' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Due Date
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
                <TableHead className="w-1/5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedQuestionnaires.map(questionnaire => (
                <TableRow 
                  key={questionnaire.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{questionnaire.name}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      getStatusBadgeStyle(questionnaire.status)
                    )}>
                      {questionnaire.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {questionnaire.dueDate}
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-300",
                          getProgressBarStyle(questionnaire.progress)
                        )}
                        style={{ width: `${questionnaire.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{questionnaire.progress}%</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="text-primary hover:text-primary/80 transition-colors"
                        onClick={() => onEditQuestionnaire && onEditQuestionnaire(questionnaire)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                        onClick={() => onViewQuestionnaire && onViewQuestionnaire(questionnaire)}
                      >
                        View
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800 transition-colors"
                        onClick={() => onDeleteQuestionnaire && onDeleteQuestionnaire(questionnaire)}
                      >
                        Delete
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
          <ul className="space-y-3">
            {filteredAndSortedQuestionnaires.map(questionnaire => (
              <li 
                key={questionnaire.id}
                className="flex flex-col p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-800">{questionnaire.name}</h3>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getStatusBadgeStyle(questionnaire.status)
                  )}>
                    {questionnaire.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Due:</span> {questionnaire.dueDate}
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{questionnaire.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-300",
                        getProgressBarStyle(questionnaire.progress)
                      )}
                      style={{ width: `${questionnaire.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    className="text-primary hover:text-primary/80 transition-colors text-sm"
                    onClick={() => onEditQuestionnaire && onEditQuestionnaire(questionnaire)}
                  >
                    Edit
                  </button>
                  <button 
                    className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
                    onClick={() => onViewQuestionnaire && onViewQuestionnaire(questionnaire)}
                  >
                    View
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-800 transition-colors text-sm"
                    onClick={() => onDeleteQuestionnaire && onDeleteQuestionnaire(questionnaire)}
                  >
                    Delete
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
    <section 
      aria-label="Questionnaire list" 
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Questionnaires</h2>
      </div>

      {renderSearchBar()}
      {renderFilterPills()}
      {renderContent()}
    </section>
  );
} 