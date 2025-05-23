"use client";

import React, { useState, useEffect, useRef, ChangeEvent, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Filter, Plus, Search, SlidersHorizontal, X, Upload, FileText, FileType, Files, RefreshCw, Trash2 } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { QuestionnaireList, Questionnaire, QuestionnaireStatus } from "@/components/dashboard/QuestionnaireList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Header from '@/components/Header';
import { debounce } from 'lodash';

interface QuestionAnswer {
  question: string;
  answer: string;
}

const MAX_QUESTIONS = 500;
const MAX_QUESTION_LENGTH = 200;
const AUTOSAVE_KEY = 'questionnaire_draft';

const QuestionnairesPage = () => {
  const router = useRouter();
  // Remove mock data and start with empty array
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // New state variables for the questionnaire input modal
  const [showQuestionnaireInput, setShowQuestionnaireInput] = useState(false);
  const [questionnaireInput, setQuestionnaireInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Add state for file upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New states for enhanced features
  const [questionnaireTitle, setQuestionnaireTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [duplicateLines, setDuplicateLines] = useState<number[]>([]);
  const [longLines, setLongLines] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [findReplaceMode, setFindReplaceMode] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Calculate and update question count and validation when input changes
  useEffect(() => {
    const lines = questionnaireInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    setQuestionCount(lines.length);
    
    // Check for duplicates
    const duplicates: number[] = [];
    const seen = new Set<string>();
    
    lines.forEach((line, index) => {
      if (seen.has(line.toLowerCase())) {
        duplicates.push(index + 1);
      } else {
        seen.add(line.toLowerCase());
      }
    });
    
    setDuplicateLines(duplicates);
    
    // Check for long lines
    const longLinesFound: number[] = [];
    lines.forEach((line, index) => {
      if (line.length > MAX_QUESTION_LENGTH) {
        longLinesFound.push(index + 1);
      }
    });
    
    setLongLines(longLinesFound);
    
    // Validate total count
    if (lines.length > MAX_QUESTIONS) {
      setValidationError(`Exceeded maximum of ${MAX_QUESTIONS} questions. Please reduce the number of questions.`);
    } else if (duplicates.length > 0) {
      setValidationError(`Duplicate questions found on lines: ${duplicates.join(', ')}`);
    } else if (longLinesFound.length > 0) {
      setValidationError(`Questions exceeding ${MAX_QUESTION_LENGTH} characters on lines: ${longLinesFound.join(', ')}`);
    } else {
      setValidationError(null);
    }
    
    // Auto-save draft
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      title: questionnaireTitle,
      questions: questionnaireInput
    }));
    
  }, [questionnaireInput, questionnaireTitle]);

  // Debounced textarea resize
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to calculate scrollHeight accurately
    textarea.style.height = 'auto';
    
    // Set new height, with max-height enforced by CSS
    textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
  }, []);
  
  const debouncedResize = useMemo(() => debounce(resizeTextarea, 100), [resizeTextarea]);
  
  useEffect(() => {
    resizeTextarea();
    return () => {
      debouncedResize.cancel();
    };
  }, [questionnaireInput, debouncedResize, resizeTextarea]);

  // Load autosaved draft
  useEffect(() => {
    if (showQuestionnaireInput) {
      const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
      if (savedDraft) {
        try {
          const { title, questions } = JSON.parse(savedDraft);
          setQuestionnaireTitle(title || '');
          setQuestionnaireInput(questions || '');
        } catch (e) {
          console.error('Error loading saved draft:', e);
        }
      }
    }
  }, [showQuestionnaireInput]);

  // Focus trap for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showQuestionnaireInput || e.key !== 'Tab') return;
      
      const modal = modalRef.current;
      if (!modal) return;
      
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQuestionnaireInput]);

  // Drag and drop handlers
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

  const fetchQuestionnaires = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Only use questionnaires from local storage, no mock data
      const storedQuestionnaires = localStorage.getItem('user_questionnaires');
      let userQuestionnaires: Questionnaire[] = [];
      
      if (storedQuestionnaires) {
        try {
          userQuestionnaires = JSON.parse(storedQuestionnaires);
        } catch (e) {
          console.error('Error parsing stored questionnaires:', e);
        }
      }
      
      // Only use user-created questionnaires
      setQuestionnaires(userQuestionnaires);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
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
  
  // Focus the textarea when the modal is shown
  useEffect(() => {
    if (showQuestionnaireInput) {
      // Focus on title first, then textarea
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }
  }, [showQuestionnaireInput]);
  
  const handleNewQuestionnaire = () => {
    setShowQuestionnaireInput(true);
    setQuestionnaireTitle('');
    setQuestionnaireInput('');
    setQuestionAnswers([]);
    setShowPreview(false);
    setFindReplaceMode(false);
    setUploadError(null);
    setValidationError(null);
  };
  
  const handleSubmitQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionnaireInput.trim()) {
      setValidationError("No questions detected – please add one per line.");
      return;
    }
    
    if (!questionnaireTitle.trim()) {
      setValidationError("Please provide a title for the questionnaire.");
      return;
    }
    
    // Parse input into separate questions (non-empty lines)
    const questions = questionnaireInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (questions.length === 0) {
      setValidationError("No questions detected – please add one per line.");
      return;
    }
    
    if (validationError) {
      return; // Don't submit if there are validation errors
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the appropriate API endpoint based on environment
      const apiEndpoint = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? '/api/ai/questionnaire'
        : '/.netlify/functions/questionnaire';
        
      // Send questions to the API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'csrf-token-placeholder',
        },
        body: JSON.stringify({ 
          title: questionnaireTitle,
          questions 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate answers');
      }
      
      const data = await response.json();
      
      // Now call the security questionnaire endpoint to get AI-generated answers
      const securityEndpoint = '/api/answer';
      
      const aiResponses = await Promise.all(
        questions.map(async (question) => {
          try {
            const aiResponse = await fetch(securityEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ question }),
            });
            
            if (!aiResponse.ok) {
              return { question, answer: 'Unable to generate an answer. Please consult the compliance officer.' };
            }
            
            const aiData = await aiResponse.json();
            return { question, answer: aiData.answer || 'No answer available' };
          } catch (error) {
            console.error('Error getting AI answer:', error);
            return { question, answer: 'Error generating answer. Please consult the compliance officer.' };
          }
        })
      );
      
      // Store the new questionnaire with AI answers
      const newQuestionnaire: Questionnaire & { answers?: QuestionAnswer[] } = {
        id: data.questionnaire?.id || `q${Date.now()}`,  
        name: questionnaireTitle,
        status: "Not Started" as QuestionnaireStatus,
        dueDate: data.questionnaire?.dueDate || new Date().toLocaleDateString(),
        progress: 0,
        answers: aiResponses, // Store the AI-generated answers
      };
      
      // Get existing questionnaires from local storage
      const storedQuestionnaires = localStorage.getItem('user_questionnaires');
      let userQuestionnaires: Array<Questionnaire & { answers?: QuestionAnswer[] }> = [];
      
      if (storedQuestionnaires) {
        try {
          userQuestionnaires = JSON.parse(storedQuestionnaires);
        } catch (e) {
          console.error('Error parsing stored questionnaires:', e);
        }
      }
      
      // Add the new questionnaire
      userQuestionnaires.push(newQuestionnaire);
      
      // Save back to local storage
      localStorage.setItem('user_questionnaires', JSON.stringify(userQuestionnaires));
      
      // Clear autosaved draft
      localStorage.removeItem(AUTOSAVE_KEY);
      
      // Close modal
      closeQuestionnaireInput();
      
      // Refresh the questionnaire list
      fetchQuestionnaires();
      
      // Redirect to the questionnaire answers page - use router.push instead of window.location
      router.push(`/questionnaires/answers/${newQuestionnaire.id}`);
      
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      setValidationError('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeQuestionnaireInput = () => {
    setShowQuestionnaireInput(false);
    setQuestionnaireTitle('');
    setQuestionnaireInput('');
    setQuestionAnswers([]);
    setShowPreview(false);
    setFindReplaceMode(false);
  };

  // Process file regardless of upload method
  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // File size check (10MB limit as example)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File is unusually large (>10MB). Please check the file before uploading.');
      }
      
      // Sanitize filename
      const sanitizedName = file.name.replace(/[^\w\s.-]/g, '');
      
      // Check file type
      const fileExtension = sanitizedName.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'txt') {
        // Read file content
        const text = await readFileAsText(file);
        
        // Set the text to the textarea
        setQuestionnaireInput(text);
        
        // Auto-generate title from filename if not set
        if (!questionnaireTitle) {
          const baseName = sanitizedName.split('.')[0]
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          setQuestionnaireTitle(baseName);
        }
      } else if (fileExtension === 'csv') {
        // Read and parse CSV
        const text = await readFileAsText(file);
        const lines = text.split('\n')
          .map(line => {
            // Extract first column if CSV
            const columns = line.split(',');
            return columns[0]?.trim().replace(/^["']|["']$/g, '') || '';
          })
          .filter(line => line.length > 0)
          .join('\n');
        
        setQuestionnaireInput(lines);
        
        // Auto-generate title from filename
        if (!questionnaireTitle) {
          const baseName = sanitizedName.split('.')[0]
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          setQuestionnaireTitle(baseName);
        }
      } else if (fileExtension === 'md') {
        // Basic Markdown support - extract lines that might be questions
        const text = await readFileAsText(file);
        const lines = text.split('\n')
          .filter(line => {
            // Skip headers, lists markers, etc.
            const trimmed = line.trim();
            return trimmed.length > 0 && 
                  !trimmed.startsWith('#') && 
                  !trimmed.startsWith('-') && 
                  !trimmed.startsWith('*') &&
                  !trimmed.startsWith('```');
          })
          .join('\n');
        
        setQuestionnaireInput(lines);
        
        // Auto-generate title from filename
        if (!questionnaireTitle) {
          const baseName = sanitizedName.split('.')[0]
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          setQuestionnaireTitle(baseName);
        }
      } else {
        throw new Error('Only .txt, .csv, and .md files are supported at this time');
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError(error instanceof Error ? error.message : 'An error occurred while processing the file');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file upload via input
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await processFile(file);
  };
  
  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File read error'));
      };
      
      reader.readAsText(file);
    });
  };

  // Clear textarea
  const handleClearTextarea = () => {
    if (confirm('Are you sure you want to clear all questions?')) {
      setQuestionnaireInput('');
      textareaRef.current?.focus();
    }
  };

  // Toggle preview mode
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Execute find and replace
  const handleFindReplace = () => {
    if (!findText) return;
    
    const newText = questionnaireInput.replace(
      new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
      replaceText
    );
    
    setQuestionnaireInput(newText);
    setFindText('');
    setReplaceText('');
    setFindReplaceMode(false);
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  // Remove empty lines
  const handleRemoveEmptyLines = () => {
    const lines = questionnaireInput.split('\n').filter(line => line.trim() !== '');
    setQuestionnaireInput(lines.join('\n'));
  };

  // Get parsed questions for preview
  const getParsedQuestions = () => {
    return questionnaireInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  // Add handling for viewing a questionnaire
  const handleViewQuestionnaire = (questionnaire: Questionnaire) => {
    router.push(`/questionnaires/answers/${questionnaire.id}`);
  };
  
  // Add handling for editing a questionnaire
  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    // Set the questionnaire input and title
    setQuestionnaireTitle(questionnaire.name);
    
    // If the questionnaire has answers, get the questions from them
    if ((questionnaire as any).answers) {
      const questions = (questionnaire as any).answers.map((qa: any) => qa.question).join('\n');
      setQuestionnaireInput(questions);
    }
    
    // Show the questionnaire input modal
    setShowQuestionnaireInput(true);
  };
  
  // Add handling for deleting a questionnaire
  const handleDeleteQuestionnaire = (questionnaire: Questionnaire) => {
    if (confirm(`Are you sure you want to delete the questionnaire "${questionnaire.name}"?`)) {
      // Get existing questionnaires from local storage
      const storedQuestionnaires = localStorage.getItem('user_questionnaires');
      if (storedQuestionnaires) {
        try {
          const userQuestionnaires = JSON.parse(storedQuestionnaires);
          
          // Filter out the questionnaire to delete
          const updatedQuestionnaires = userQuestionnaires.filter(
            (q: Questionnaire) => q.id !== questionnaire.id
          );
          
          // Save back to local storage
          localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
          
          // Refresh the questionnaire list
          fetchQuestionnaires();
        } catch (e) {
          console.error('Error deleting questionnaire:', e);
        }
      }
    }
  };

  return (
    <>
      <Header />
      
      <main id="main-content" className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <ClipboardList className="mr-3 h-7 w-7 text-primary" />
              Questionnaires
            </h1>
            <p className="text-gray-600 mt-1">Manage and track all your compliance questionnaires</p>
          </div>
          
          <div className="flex items-center">
            <button 
              className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors"
              onClick={handleNewQuestionnaire}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Questionnaire
            </button>
          </div>
        </div>
        
        {showQuestionnaireInput ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-auto p-4">
            <div 
              ref={modalRef}
              className="bg-white dark:bg-card-bg rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="questionnaire-modal-title"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 id="questionnaire-modal-title" className="text-xl font-semibold text-gray-800 dark:text-white">
                  Upload/Enter Questionnaire
                </h2>
                <button 
                  onClick={closeQuestionnaireInput}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-auto flex-grow">
                <form onSubmit={handleSubmitQuestionnaire}>
                  {/* Title input */}
                  <div className="mb-4">
                    <label htmlFor="questionnaire-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Questionnaire Title
                    </label>
                    <input
                      type="text"
                      id="questionnaire-title"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="Enter title for this questionnaire"
                      value={questionnaireTitle}
                      onChange={(e) => setQuestionnaireTitle(e.target.value)}
                      required
                      aria-label="Questionnaire title"
                    />
                  </div>

                  {!showPreview && (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-800 dark:text-white">Questions</h3>
                          
                          <div className="flex space-x-2">
                            <button 
                              type="button"
                              onClick={() => setFindReplaceMode(!findReplaceMode)}
                              className="text-sm text-primary hover:text-primary/80 flex items-center"
                              aria-label="Find and replace"
                            >
                              Find & Replace
                            </button>
                            <button 
                              type="button"
                              onClick={handleRemoveEmptyLines}
                              className="text-sm text-primary hover:text-primary/80 flex items-center"
                              aria-label="Remove empty lines"
                            >
                              Remove Empty Lines
                            </button>
                            <button 
                              type="button"
                              onClick={handleTogglePreview}
                              className="text-sm text-primary hover:text-primary/80 flex items-center"
                              aria-label="Preview questions"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Type or paste each question on its own line (e.g. 'Do you encrypt data at rest?').
                        </p>
                        
                        {/* Find and replace section */}
                        {findReplaceMode && (
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label htmlFor="find-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Find
                                </label>
                                <input
                                  type="text"
                                  id="find-text"
                                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary"
                                  value={findText}
                                  onChange={(e) => setFindText(e.target.value)}
                                  placeholder="Text to find"
                                />
                              </div>
                              <div>
                                <label htmlFor="replace-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Replace
                                </label>
                                <input
                                  type="text"
                                  id="replace-text"
                                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary"
                                  value={replaceText}
                                  onChange={(e) => setReplaceText(e.target.value)}
                                  placeholder="Replacement text"
                                />
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                                onClick={handleFindReplace}
                                disabled={!findText}
                              >
                                Replace All
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* File upload area */}
                        <div 
                          ref={dropZoneRef}
                          className={`mb-4 border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                            dragActive 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {dragActive ? 'Drop file here' : 'Drag and drop a file here, or click to browse'}
                            </p>
                            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                              <div className="flex items-center mr-3">
                                <FileText className="h-4 w-4 mr-1" />
                                <span>.TXT</span>
                              </div>
                              <div className="flex items-center mr-3">
                                <FileType className="h-4 w-4 mr-1" />
                                <span>.CSV</span>
                              </div>
                              <div className="flex items-center">
                                <Files className="h-4 w-4 mr-1" />
                                <span>.MD</span>
                              </div>
                            </div>
                            <label className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                              Browse Files
                              <input
                                type="file"
                                className="hidden"
                                accept=".txt,.csv,.md"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                disabled={isUploading}
                                aria-label="Upload questions file"
                              />
                            </label>
                          </div>
                        </div>
                        
                        {isUploading && (
                          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                            <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </div>
                        )}
                        
                        {uploadError && (
                          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                            {uploadError}
                          </p>
                        )}
                      </div>
                    
                      <div className="relative mb-4">
                        <textarea
                          ref={textareaRef}
                          className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-md resize-none text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[200px] max-h-[400px]"
                          placeholder="Type or paste each question on its own line (e.g. 'Do you encrypt data at rest?')."
                          value={questionnaireInput}
                          onChange={(e) => {
                            setQuestionnaireInput(e.target.value);
                            debouncedResize();
                          }}
                          aria-label="Questionnaire input"
                          aria-describedby="question-counter"
                        />
                        
                        <div className="absolute bottom-3 right-3 flex items-center">
                          <button
                            type="button"
                            onClick={handleClearTextarea}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            aria-label="Clear questions"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Preview Panel */}
                  {showPreview && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Question Preview</h3>
                        <button
                          type="button"
                          onClick={handleTogglePreview}
                          className="text-sm text-primary hover:text-primary/80 flex items-center"
                        >
                          Back to Edit
                        </button>
                      </div>
                      
                      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 max-h-[400px] overflow-y-auto">
                        {getParsedQuestions().length > 0 ? (
                          <ol className="list-decimal pl-5 space-y-2">
                            {getParsedQuestions().map((question, index) => (
                              <li key={index} className="text-gray-800 dark:text-gray-200">
                                {question}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No questions added yet. Go back to edit and add some questions.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div id="question-counter" className="text-sm text-gray-600 dark:text-gray-400">
                      {questionCount > 0 ? (
                        <>You've entered {questionCount} question{questionCount !== 1 ? 's' : ''}</>
                      ) : (
                        <>No questions entered yet</>
                      )}
                      {questionCount > MAX_QUESTIONS && (
                        <span className="text-red-500 ml-1">
                          (exceeds maximum of {MAX_QUESTIONS})
                        </span>
                      )}
                    </div>
                    
                    {/* Validation errors */}
                    {validationError && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {validationError}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeQuestionnaireInput}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!questionnaireInput.trim() || !questionnaireTitle.trim() || isSubmitting || questionCount > MAX_QUESTIONS}
                      className={`py-2 px-6 rounded-md transition-colors ${
                        questionnaireInput.trim() && questionnaireTitle.trim() && !isSubmitting && questionCount <= MAX_QUESTIONS
                          ? 'bg-primary text-white hover:bg-primary/90' 
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                      aria-live="polite"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Questionnaire List Component */}
        <QuestionnaireList 
          questionnaires={questionnaires} 
          isLoading={isLoading}
          error={error}
          onRetry={fetchQuestionnaires}
          onAddQuestionnaire={handleNewQuestionnaire}
          onViewQuestionnaire={handleViewQuestionnaire}
          onEditQuestionnaire={handleEditQuestionnaire}
          onDeleteQuestionnaire={handleDeleteQuestionnaire}
        />
      </main>
    </>
  );
};

export default QuestionnairesPage; 