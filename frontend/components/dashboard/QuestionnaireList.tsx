"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, ArrowUpDown, AlertTriangle, Loader2, Eye, Edit, Trash, AlertCircle, FileEdit, Check, X, RefreshCw, Sparkles } from 'lucide-react';
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
  answers?: any[];
  vendorId?: string;
  vendorName?: string;
  hasSuggestions?: boolean; // Flag to indicate if questionnaire has AI-generated suggestions
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
  const [suggestionsFilter, setSuggestionsFilter] = useState<'All' | 'With Suggestions' | 'Without Suggestions'>('All');
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for delete confirmation
  const [deletingQuestionnaire, setDeletingQuestionnaire] = useState<Questionnaire | null>(null);
  
  // Handle sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (questionnaire: Questionnaire, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingQuestionnaire(questionnaire);
  };
  
  // Handle delete confirmation cancel
  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingQuestionnaire(null);
  };
  
  // Handle delete confirmation confirm
  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingQuestionnaire && onDeleteQuestionnaire) {
      onDeleteQuestionnaire(deletingQuestionnaire);
      setDeletingQuestionnaire(null);
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
    
    // Apply suggestions filter
    if (suggestionsFilter === 'With Suggestions') {
      result = result.filter(q => q.hasSuggestions === true);
    } else if (suggestionsFilter === 'Without Suggestions') {
      result = result.filter(q => q.hasSuggestions !== true);
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
  }, [initialQuestionnaires, statusFilter, suggestionsFilter, searchTerm, sortField, sortDirection]);
  
  // Get status badge styling based on status
  const getStatusBadgeStyle = (status: QuestionnaireStatus) => {
    switch (status) {
      case 'Completed':
        return "bg-green-100 text-green-800 border border-green-200";
      case 'In Review':
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case 'In Progress':
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case 'Draft':
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case 'Not Started':
        return "bg-gray-100 text-gray-800 border border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };
  
  // Get status icon based on status
  const getStatusIcon = (status: QuestionnaireStatus) => {
    switch (status) {
      case 'Completed':
        return <Check className="h-3 w-3 mr-1" />;
      case 'In Review':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'In Progress':
        return <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow" />;
      case 'Draft':
        return <FileEdit className="h-3 w-3 mr-1" />;
      case 'Not Started':
        return <X className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };
  
  // Get progress bar styling based on progress
  const getProgressBarStyle = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-blue-400";
    if (progress >= 25) return "bg-yellow-500";
    if (progress > 0) return "bg-yellow-400";
    return "bg-gray-300";
  };
  
  // Get progress text color based on progress
  const getProgressTextColor = (progress: number) => {
    if (progress === 100) return "text-green-600";
    if (progress > 75) return "text-blue-600";
    if (progress > 30) return "text-blue-600";
    if (progress > 0) return "text-yellow-600";
    return "text-gray-500";
  };
  
  // Get status tooltip based on status and progress
  const getStatusTooltip = (questionnaire: Questionnaire) => {
    let tooltip = '';
    
    // Add status information
    switch (questionnaire.status) {
      case 'Completed':
        tooltip = 'All questions have been answered';
        break;
      case 'In Review':
        tooltip = 'Most questions have been answered, pending final review';
        break;
      case 'In Progress':
        tooltip = 'Some questions have been answered, more work needed';
        break;
      case 'Draft':
        tooltip = 'Just getting started, few questions answered';
        break;
      case 'Not Started':
        tooltip = 'No questions have been answered yet';
        break;
      default:
        tooltip = 'Unknown status';
    }
    
    // Add progress information if answers are available
    if (questionnaire.answers) {
      const totalQuestions = questionnaire.answers.length;
      
      // Count questions with actual answers (not placeholders or failures)
      const answeredQuestions = questionnaire.answers.filter((a: any) => {
        const answer = a.answer || '';
        return answer.trim() !== '' && 
          !answer.includes('AI answer will be generated') &&
          !answer.includes('Generating...') &&
          !answer.includes('We couldn\'t generate an answer') &&
          answer !== 'Processing in batch mode...';
      }).length;
      
      // Count questions that failed to generate answers
      const failedQuestions = questionnaire.answers.filter((a: any) => {
        const answer = a.answer || '';
        return answer.includes('We couldn\'t generate an answer');
      }).length;
      
      tooltip += ` - ${answeredQuestions}/${totalQuestions} questions answered`;
      
      if (failedQuestions > 0) {
        tooltip += ` (${failedQuestions} failed to generate)`;
      }
      
      tooltip += ` - ${questionnaire.progress}% complete`;
      
      // Add information about mandatory questions if any
      const mandatoryQuestions = questionnaire.answers.filter((a: any) => a.isMandatory).length;
      const mandatoryAnswered = questionnaire.answers.filter((a: any) => 
        a.isMandatory && a.answer && a.answer.trim() !== '' && !a.needsAttention
      ).length;
      
      if (mandatoryQuestions > 0) {
        tooltip += ` - ${mandatoryAnswered}/${mandatoryQuestions} required questions complete`;
      }
    }
    
    return tooltip;
  };
  
  // Helper function to get count of successfully answered questions
  const getAnsweredCount = (questionnaire: Questionnaire): number => {
    if (!questionnaire.answers || questionnaire.answers.length === 0) return 0;
    
    return questionnaire.answers.filter((a: any) => {
      const answer = a.answer || '';
      return answer.trim() !== '' && 
        !answer.includes('AI answer will be generated') &&
        !answer.includes('Generating...') &&
        !answer.includes('We couldn\'t generate an answer') &&
        answer !== 'Processing in batch mode...';
    }).length;
  };
  
  // Helper function to get count of failed generations
  const getFailedCount = (questionnaire: Questionnaire): number => {
    if (!questionnaire.answers || questionnaire.answers.length === 0) return 0;
    
    return questionnaire.answers.filter((a: any) => {
      const answer = a.answer || '';
      return answer.includes('We couldn\'t generate an answer');
    }).length;
  };

  // Helper function to detect if questionnaire has AI suggestions
  const hasAISuggestions = (questionnaire: Questionnaire): boolean => {
    if (questionnaire.hasSuggestions !== undefined) {
      return questionnaire.hasSuggestions;
    }
    
    // Fallback: check if any answers exist and look for AI-generated content
    if (!questionnaire.answers || questionnaire.answers.length === 0) return false;
    
    return questionnaire.answers.some((a: any) => {
      const answer = a.answer || '';
      return answer.trim() !== '' && 
        !answer.includes('AI answer will be generated') &&
        !answer.includes('Generating...');
    });
  };
  
  // Render filter pills
  const renderFilterPills = () => {
    const statuses: (QuestionnaireStatus | 'All')[] = ['All', 'Not Started', 'Draft', 'In Progress', 'In Review', 'Completed'];
    const suggestions: ('All' | 'With Suggestions' | 'Without Suggestions')[] = ['All', 'With Suggestions', 'Without Suggestions'];
    
    return (
      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
          <FilterPills
            options={statuses}
            selectedOption={statusFilter}
            onChange={setStatusFilter}
            label="Filter questionnaires by status"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by AI Suggestions
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </span>
          </label>
          <FilterPills
            options={suggestions}
            selectedOption={suggestionsFilter}
            onChange={setSuggestionsFilter}
            label="Filter questionnaires by AI suggestions"
          />
        </div>
      </div>
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
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in" aria-live="assertive">
          <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <p className="text-gray-800 mb-4">{error || 'Unable to load questionnaires.'}</p>
          {onRetry && (
            <button 
              className="garnet-button garnet-button-primary"
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
            className="border-2 border-dashed border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center animate-fade-in"
            aria-live="polite"
          >
            <p className="text-gray-500 text-center mb-4">No questionnaires available yet.</p>
            <p className="text-gray-500 text-center">Click the "New Questionnaire" button above to get started.</p>
          </div>
        );
      }
      
      // If no questionnaires after filtering/searching
      return (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center animate-fade-in"
          aria-live="polite"
        >
          <p className="text-gray-500 text-center">No questionnaires match your current filters.</p>
          <button 
            className="mt-4 text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setSuggestionsFilter('All');
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
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {questionnaire.name}
                      {hasAISuggestions(questionnaire) && (
                        <span 
                          className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                          title="This questionnaire has AI-generated suggestions"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium flex items-center inline-flex cursor-help",
                        getStatusBadgeStyle(questionnaire.status)
                      )}
                      title={getStatusTooltip(questionnaire)}
                    >
                      {getStatusIcon(questionnaire.status)}
                      {questionnaire.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {questionnaire.dueDate}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            getProgressBarStyle(questionnaire.progress)
                          )}
                          style={{ width: `${questionnaire.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={cn(
                          "text-xs font-medium",
                          getProgressTextColor(questionnaire.progress)
                        )}>
                          {questionnaire.progress}%
                        </span>
                        {questionnaire.answers && (
                          <span className="text-xs text-gray-500">
                            {getAnsweredCount(questionnaire)} / {questionnaire.answers.length}
                            {getFailedCount(questionnaire) > 0 && (
                              <span className="text-red-500 ml-1">
                                ({getFailedCount(questionnaire)} failed)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {deletingQuestionnaire?.id === questionnaire.id ? (
                        <div className="flex items-center bg-red-50 p-1 rounded-md">
                          <span className="text-xs text-red-600 mr-2">Confirm delete?</span>
                          <button 
                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            onClick={handleDeleteConfirm}
                            aria-label="Confirm delete"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 ml-1"
                            onClick={handleDeleteCancel}
                            aria-label="Cancel delete"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center"
                            onClick={() => {
                              if (onViewQuestionnaire) {
                                onViewQuestionnaire(questionnaire);
                              } else {
                                // Direct navigation as fallback
                                window.location.href = `/questionnaires/${questionnaire.id}/chat`;
                              }
                            }}
                            aria-label={`View ${questionnaire.name}`}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="ml-1">View</span>
                          </button>
                          <button 
                            className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors flex items-center"
                            onClick={() => onEditQuestionnaire && onEditQuestionnaire(questionnaire)}
                            aria-label={`Edit ${questionnaire.name}`}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="ml-1">Edit</span>
                          </button>
                          <button 
                            className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center"
                            onClick={(e) => handleDeleteClick(questionnaire, e)}
                            aria-label={`Delete ${questionnaire.name}`}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="ml-1">Delete</span>
                          </button>
                        </>
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
          <ul className="space-y-6">
            {filteredAndSortedQuestionnaires.map(questionnaire => (
              <li 
                key={questionnaire.id}
                className="garnet-card p-5 animate-fade-in"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-800">{questionnaire.name}</h3>
                    {hasAISuggestions(questionnaire) && (
                      <span 
                        className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                        title="This questionnaire has AI-generated suggestions"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </span>
                    )}
                  </div>
                  <span 
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center cursor-help",
                      getStatusBadgeStyle(questionnaire.status)
                    )}
                    title={getStatusTooltip(questionnaire)}
                  >
                    {getStatusIcon(questionnaire.status)}
                    {questionnaire.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Due:</span> {questionnaire.dueDate}
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress:</span>
                    <span className={cn(
                      "font-medium",
                      getProgressTextColor(questionnaire.progress)
                    )}>
                      {questionnaire.progress}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getProgressBarStyle(questionnaire.progress)
                      )}
                      style={{ width: `${questionnaire.progress}%` }}
                    ></div>
                  </div>
                  {questionnaire.answers && (
                    <div className="mt-1 text-right">
                      <span className="text-xs text-gray-500">
                        {getAnsweredCount(questionnaire)} / {questionnaire.answers.length}
                        {getFailedCount(questionnaire) > 0 && (
                          <span className="text-red-500 ml-1">
                            ({getFailedCount(questionnaire)} failed)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 border-t pt-4 border-gray-100">
                  {deletingQuestionnaire?.id === questionnaire.id ? (
                    <div className="flex items-center justify-between bg-red-50 p-3 rounded-md">
                      <span className="text-sm text-red-600">Confirm delete?</span>
                      <div className="flex gap-2">
                        <button 
                          className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                          onClick={handleDeleteConfirm}
                          aria-label="Confirm delete"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                          onClick={handleDeleteCancel}
                          aria-label="Cancel delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
                        onClick={() => {
                          if (onViewQuestionnaire) {
                            onViewQuestionnaire(questionnaire);
                          } else {
                            // Direct navigation as fallback
                            window.location.href = `/questionnaires/${questionnaire.id}/chat`;
                          }
                        }}
                        aria-label={`View ${questionnaire.name}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button 
                        className="flex-1 p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center"
                        onClick={() => onEditQuestionnaire && onEditQuestionnaire(questionnaire)}
                        aria-label={`Edit ${questionnaire.name}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button 
                        className="flex-1 p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center"
                        onClick={(e) => handleDeleteClick(questionnaire, e)}
                        aria-label={`Delete ${questionnaire.name}`}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
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
      aria-label="Questionnaire list" 
      className={cn(
        "bg-white rounded-xl shadow-md p-6 overflow-hidden",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="text-primary mr-2">Your</span> Questionnaires
        </h2>
        
        {onAddQuestionnaire && (
          <button 
            onClick={onAddQuestionnaire}
            className="garnet-button garnet-button-gradient self-start sm:self-auto"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Questionnaire
          </button>
        )}
      </div>

      {renderSearchBar()}
      {renderFilterPills()}
      {renderContent()}
    </section>
  );
} 