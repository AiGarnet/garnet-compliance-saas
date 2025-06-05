"use client";

import React, { useState, useEffect, useRef, ChangeEvent, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Filter, Plus, Search, SlidersHorizontal, X, Upload, FileText, FileType, Files, RefreshCw, Trash2, Sparkles, MessageSquare, ClipboardCopy, ArrowLeft, ArrowRight, PlusCircle } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { QuestionnaireList, Questionnaire, QuestionnaireStatus } from "@/components/dashboard/QuestionnaireList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Header from '@/components/Header';
import { debounce } from 'lodash';

// Create a client component for search params
import SearchParamsProvider from '@/components/SearchParamsProvider';

interface QuestionAnswer {
  question: string;
  answer: string;
  isLoading?: boolean;
  isMandatory: boolean;
  needsAttention?: boolean;
}

const MAX_QUESTIONS = 500;
const MAX_QUESTION_LENGTH = 200;
const AUTOSAVE_KEY = 'questionnaire_draft';

const QuestionnairesPage = () => {
  const router = useRouter();
  
  // State management
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateQuestionnaire, setShowCreateQuestionnaire] = useState(false);
  const [questionnaireTitle, setQuestionnaireTitle] = useState('');
  const [questionnaireInput, setQuestionnaireInput] = useState('');
  const [isCreatingQuestionnaire, setIsCreatingQuestionnaire] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const questionsInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateQuestionnaire) {
        setShowCreateQuestionnaire(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCreateQuestionnaire]);

  // Focus on input when modal opens
  useEffect(() => {
    if (showCreateQuestionnaire && questionsInputRef.current) {
      setTimeout(() => {
        questionsInputRef.current?.focus();
      }, 100);
    }
  }, [showCreateQuestionnaire]);

  // Fetch questionnaires from localStorage and generate sample data
  const fetchQuestionnaires = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Get user questionnaires from localStorage
      let userQuestionnaires: Questionnaire[] = [];
      
      if (typeof window !== 'undefined') {
        const storedQuestionnaires = localStorage.getItem('user_questionnaires');
        
        if (storedQuestionnaires) {
          try {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            userQuestionnaires = parsedQuestionnaires.map((q: any) => {
              let progress = 0;
              let status: QuestionnaireStatus = "Not Started";
              
              if (q.answers && Array.isArray(q.answers)) {
                const totalQuestions = q.answers.length;
                const answeredQuestions = q.answers.filter((a: any) => a.answer && a.answer.trim() !== '').length;
                
                // Calculate progress percentage
                progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
                
                // Determine status based on progress
                if (progress === 0) {
                  status = "Not Started";
                } else if (progress === 100) {
                  status = "Completed";
                } else if (progress >= 75) {
                  status = "In Review";
                } else if (progress >= 25) {
                  status = "In Progress";
                } else {
                  status = "Draft";
                }
                
                // Override status if there are mandatory questions that need attention
                const needsAttentionCount = q.answers.filter((a: any) => a.needsAttention).length;
                if (needsAttentionCount > 0 && status === "Completed") {
                  status = "In Review";
                }
              }
              
              return {
                ...q,
                progress,
                status
              };
            });
          } catch (e) {
            console.error('Error parsing stored questionnaires:', e);
          }
        }
      }
      
      setQuestionnaires(userQuestionnaires);
    } catch (err) {
      console.error('Error fetching questionnaires:', err);
      setError('Failed to load questionnaires. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // Process file upload
  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File is too large (max 10MB)');
      }
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let text = '';
      
      if (fileExtension === 'txt' || fileExtension === 'md') {
        text = await readFileAsText(file);
      } else if (fileExtension === 'pdf') {
        // For PDF, we'll need a PDF parsing library, for now show error
        throw new Error('PDF parsing not yet implemented. Please use .txt or .md files for now.');
      } else {
        throw new Error('Unsupported file type. Please use .txt, .md files.');
      }
      
      // Extract questions from text (each line is a question)
      const questions = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length <= MAX_QUESTION_LENGTH);
      
      if (questions.length > 0) {
        setQuestionnaireInput(questions.join('\n'));
        if (!questionnaireTitle) {
          const baseName = file.name.split('.')[0]
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          setQuestionnaireTitle(baseName);
        }
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError(error instanceof Error ? error.message : 'Error processing file');
    } finally {
      setIsUploading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Handle creating a new questionnaire
  const handleCreateQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionnaireTitle.trim() || !questionnaireInput.trim()) {
      setError('Please provide both a title and questions.');
      return;
    }
    
    setIsCreatingQuestionnaire(true);
    
    try {
      // Parse questions from textarea (each line is a question)
      const questions = questionnaireInput.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (questions.length === 0) {
        throw new Error('Please add at least one question.');
      }
      
      if (questions.length > MAX_QUESTIONS) {
        throw new Error(`Too many questions. Maximum is ${MAX_QUESTIONS}.`);
      }
      
      // Generate a unique ID for the questionnaire
      const questionnaireId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create questionnaire object
      const questionnaire = {
        id: questionnaireId,
        name: questionnaireTitle.trim(),
        status: 'In Progress' as QuestionnaireStatus,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        answers: questions.map(question => ({
          question: question,
          answer: '',
          isMandatory: true,
          needsAttention: false
        })),
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const existingQuestionnaires = JSON.parse(localStorage.getItem('user_questionnaires') || '[]');
      existingQuestionnaires.push(questionnaire);
      localStorage.setItem('user_questionnaires', JSON.stringify(existingQuestionnaires));
      
      // Close modal and reset form
      setShowCreateQuestionnaire(false);
      setQuestionnaireTitle('');
      setQuestionnaireInput('');
      setUploadError(null);
      
      // Refresh questionnaires list
      fetchQuestionnaires();
      
      // Redirect to chat interface for the first question
      router.push(`/questionnaires/${questionnaireId}/chat`);
      
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      setError(error instanceof Error ? error.message : 'Failed to create questionnaire. Please try again.');
    } finally {
      setIsCreatingQuestionnaire(false);
    }
  };

  // Handle viewing a questionnaire
  const handleViewQuestionnaire = (questionnaire: Questionnaire) => {
    router.push(`/questionnaires/${questionnaire.id}/chat`);
  };
  
  // Handle editing a questionnaire
  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    // Navigate to chat interface for editing
    router.push(`/questionnaires/${questionnaire.id}/chat`);
  };
  
  // Handle deleting a questionnaire
  const handleDeleteQuestionnaire = (questionnaire: Questionnaire) => {
    try {
      const existingQuestionnaires = JSON.parse(localStorage.getItem('user_questionnaires') || '[]');
      const updatedQuestionnaires = existingQuestionnaires.filter((q: any) => q.id !== questionnaire.id);
      localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
      
      // Refresh the list
      fetchQuestionnaires();
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      setError('Failed to delete questionnaire. Please try again.');
    }
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        
        <main className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ClipboardList className="mr-3 h-8 w-8 text-primary" />
                  Questionnaires
                </h1>
                <p className="text-gray-600 mt-1">Manage and track your questionnaires</p>
              </div>
            </div>
          </div>

          {/* Create Questionnaire Modal */}
          {showCreateQuestionnaire && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div 
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-questionnaire-title"
              >
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 id="create-questionnaire-title" className="text-2xl font-bold text-gray-800 flex items-center">
                        <ClipboardList className="h-6 w-6 mr-3 text-primary" />
                        Create Questionnaire
                      </h2>
                      <p className="text-gray-600 mt-1">Add a title and questions to create your questionnaire</p>
                    </div>
                    <button 
                      onClick={() => setShowCreateQuestionnaire(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleCreateQuestionnaire} className="p-6 flex-grow overflow-auto">
                  {/* Title Input */}
                  <div className="mb-6">
                    <label htmlFor="questionnaire-title" className="block text-sm font-semibold text-gray-700 mb-3">
                      Questionnaire Title *
                    </label>
                    <input
                      type="text"
                      id="questionnaire-title"
                      value={questionnaireTitle}
                      onChange={(e) => setQuestionnaireTitle(e.target.value)}
                      placeholder="Enter a descriptive title for your questionnaire..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 placeholder-gray-500"
                      required
                      disabled={isCreatingQuestionnaire}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Upload Questions (Optional)
                    </label>
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        dragActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">
                        {dragActive ? 'Drop file here' : 'Drag and drop a file here, or click to browse'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supported formats: .txt, .md (PDF coming soon)
                      </p>
                      <label className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                        <FileText className="h-4 w-4 mr-2" />
                        Browse Files
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.md"
                          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                    
                    {isUploading && (
                      <div className="mt-3 flex items-center text-sm text-gray-600">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Processing file...
                      </div>
                    )}
                    
                    {uploadError && (
                      <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* Questions Input */}
                  <div className="mb-6">
                    <label htmlFor="questionnaire-questions" className="block text-sm font-semibold text-gray-700 mb-3">
                      Questions *
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800 flex items-start">
                        <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          Enter each question on a new line. Press <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Enter</kbd> to create a new question.
                          You can add up to {MAX_QUESTIONS} questions.
                        </span>
                      </p>
                    </div>
                    <textarea
                      ref={questionsInputRef}
                      id="questionnaire-questions"
                      value={questionnaireInput}
                      onChange={(e) => setQuestionnaireInput(e.target.value)}
                      placeholder="Enter your questions here (one per line):&#10;&#10;What is your data retention policy?&#10;How do you handle security incidents?&#10;Do you have backup procedures in place?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-gray-800 placeholder-gray-500"
                      rows={8}
                      required
                      disabled={isCreatingQuestionnaire}
                    />
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>
                        {questionnaireInput.split('\n').filter(line => line.trim()).length} questions
                      </span>
                      <span>
                        {questionnaireInput.length} characters
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateQuestionnaire(false)}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      disabled={isCreatingQuestionnaire}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!questionnaireTitle.trim() || !questionnaireInput.trim() || isCreatingQuestionnaire}
                      className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 flex items-center"
                    >
                      {isCreatingQuestionnaire ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Questionnaire
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Questionnaire List Component */}
          <QuestionnaireList 
            questionnaires={questionnaires} 
            isLoading={isLoading}
            error={error}
            onRetry={fetchQuestionnaires}
            onViewQuestionnaire={handleViewQuestionnaire}
            onEditQuestionnaire={handleEditQuestionnaire}
            onDeleteQuestionnaire={handleDeleteQuestionnaire}
            onAddQuestionnaire={() => setShowCreateQuestionnaire(true)}
          />
        </main>
      </div>
    </Suspense>
  );
};

// Wrap with SearchParamsProvider for compatibility
const QuestionnairesPageWrapper = () => {
  const handleSetVendorId = (id: string | null) => {
    // Handle vendor ID if needed in the future
    console.log('Vendor ID:', id);
  };
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SearchParamsProvider setVendorId={handleSetVendorId} />
      <QuestionnairesPage />
    </Suspense>
  );
};

export default QuestionnairesPageWrapper;