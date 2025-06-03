"use client";

import React, { useState, useEffect, useRef, ChangeEvent, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Filter, Plus, Search, SlidersHorizontal, X, Upload, FileText, FileType, Files, RefreshCw, Trash2, Sparkles, MessageSquare, ClipboardCopy, ArrowLeft } from "lucide-react";
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
  
  // Remove mock data and start with empty array
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [isLoadingVendor, setIsLoadingVendor] = useState<boolean>(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  
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

  // AI Assistant state for questionnaire creation
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [generatedAnswers, setGeneratedAnswers] = useState<QuestionAnswer[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Fetch vendor data when vendorId is provided in URL
  useEffect(() => {
    if (vendorId) {
      fetchVendorData(vendorId);
    }
  }, [vendorId]);

  // Fetch vendor data and any existing questionnaire
  const fetchVendorData = async (id: string) => {
    setIsLoadingVendor(true);
    setError('');
    
    try {
      // Fetch vendor details
      const vendorResponse = await fetch(`/api/vendors/${id}`);
      
      if (!vendorResponse.ok) {
        throw new Error('Failed to fetch vendor data');
      }
      
      const vendorData = await vendorResponse.json();
      setVendorName(vendorData.vendor.name);
      
      // Fetch vendor's questionnaire answers if available
      try {
        const questionnaireResponse = await fetch(`/api/vendors/${id}/questionnaire`);
        
        if (questionnaireResponse.ok) {
          const data = await questionnaireResponse.json();
          
          if (data.answers && data.answers.length > 0) {
            // Load existing answers
            setQuestionAnswers(data.answers.map((answer: any) => ({
              question: answer.question,
              answer: answer.answer || '',
              isMandatory: answer.isMandatory || false,
              needsAttention: answer.needsAttention || false
            })));
            
            setShowQuestionnaireInput(true);
          } else {
            // No answers yet, but show questionnaire input for new vendor
            setShowQuestionnaireInput(true);
          }
        } else {
          // No questionnaire yet, but show questionnaire input for new vendor
          setShowQuestionnaireInput(true);
        }
      } catch (error) {
        console.error('Error fetching questionnaire:', error);
        // Show empty questionnaire form even if there was an error fetching
        setShowQuestionnaireInput(true);
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      setError('Unable to load vendor data. Please return to the dashboard and try again.');
    } finally {
      setIsLoadingVendor(false);
    }
  };

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
      questions: questionnaireInput,
      vendorId: vendorId
    }));
    
  }, [questionnaireInput, questionnaireTitle, vendorId]);

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
          const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
          
          // Process each questionnaire to calculate dynamic status and progress
          userQuestionnaires = parsedQuestionnaires.map((q: any) => {
            // Default values if no answers
            let progress = 0;
            let status: QuestionnaireStatus = "Not Started";
            
            // Calculate progress and status based on answers if available
            if (q.answers && q.answers.length > 0) {
              const totalQuestions = q.answers.length;
              
              // Count questions that have actual answers (not placeholders or failures)
              const answeredQuestions = q.answers.filter((a: any) => {
                const answer = a.answer || '';
                return answer.trim() !== '' && 
                  !answer.includes('AI answer will be generated') &&
                  !answer.includes('Generating...') &&
                  !answer.includes('We couldn\'t generate an answer') &&
                  answer !== 'Processing in batch mode...';
              }).length;
              
              // If a questionnaire has been viewed but not all answers were generated
              // Count it as at least "Draft" status regardless of progress percentage
              if (answeredQuestions > 0) {
                // Calculate progress percentage with a more forgiving algorithm
                // If total questions is more than 10, we consider it successful if
                // at least 80% of questions have answers
                const minimumProgress = Math.max(10, answeredQuestions > 0 ? 10 : 0);
                progress = Math.round((answeredQuestions / totalQuestions) * 100);
                
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
                
                // If at least one question is answered, it's at minimum a draft
                if (answeredQuestions > 0 && status === "Not Started") {
                  status = "Draft";
                  progress = Math.max(progress, minimumProgress);
                }
                
                // Override status if there are mandatory questions that need attention
                const needsAttentionCount = q.answers.filter((a: any) => a.needsAttention).length;
                if (needsAttentionCount > 0 && status === "Completed") {
                  status = "In Review";
                }
              }
            }
            
            // Return questionnaire with calculated values
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
      
      // Only use user-created questionnaires
      setQuestionnaires(userQuestionnaires);
      
      // Save the updated questionnaires back to localStorage
      if (userQuestionnaires.length > 0) {
        localStorage.setItem('user_questionnaires', JSON.stringify(userQuestionnaires));
      }
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
    // Add debug logging
    console.log('New Questionnaire button clicked');
    // Reset all states to ensure a clean start
    setQuestionnaireTitle('');
    setQuestionnaireInput('');
    setQuestionAnswers([]);
    setGeneratedAnswers([]);
    setShowPreview(false);
    setFindReplaceMode(false);
    setShowAIAssistant(false);
    setValidationError(null);
    // Show the questionnaire input modal
    setShowQuestionnaireInput(true);
  };

  // Add a function to check if the backend service is running
  const checkBackendHealth = async (baseUrl: string): Promise<boolean> => {
    try {
      console.log('Checking backend health at:', baseUrl);
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Short timeout to not block the UI
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend health check result:', data);
        return data.status === 'healthy';
      }
      return false;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  };

  // Add fallback answer generation for when API is unavailable
  const generateLocalFallbackAnswer = (question: string): string => {
    // Common patterns in compliance questions
    const patterns = [
      { regex: /encrypt/i, answer: "Yes, our company encrypts all personal data both at rest and in transit. We use industry-standard encryption protocols (AES-256 for data at rest and TLS 1.2+ for data in transit)." },
      { regex: /access control|permission/i, answer: "Yes, our organization implements strict access control and role-based permissions for all sensitive data. We grant access on a need-to-know basis with the principle of least privilege." },
      { regex: /data breach|incident/i, answer: "Yes, our company notifies supervisory authorities and affected individuals within 72 hours of becoming aware of a data breach, as required by GDPR Article 33." },
      { regex: /retention|delete/i, answer: "Our organization has a comprehensive data retention and deletion policy. We keep data only as long as necessary for the purpose it was collected." },
      { regex: /consent/i, answer: "Yes, our organization collects explicit consent before personal data is processed for specific purposes. We store consent records securely and include timestamp, method of collection, and the specific consent given." },
      { regex: /audit/i, answer: "Yes, our organization conducts regular audits to ensure compliance with all applicable regulations and industry standards." },
      { regex: /training|awareness/i, answer: "Our company's security and compliance awareness training is updated quarterly and is mandatory for all employees." },
      { regex: /mfa|multi-factor/i, answer: "Yes, our company supports multi-factor authentication (MFA) for all users. MFA is mandatory for administrative access and strongly recommended for all user accounts." },
      { regex: /test|assess/i, answer: "Yes, our company conducts regular security assessments and penetration testing to identify and address potential vulnerabilities." },
      { regex: /backup/i, answer: "Yes, our organization maintains regular backups of all critical data with appropriate encryption and access controls in place." },
    ];
    
    // Check for pattern matches
    for (const pattern of patterns) {
      if (pattern.regex.test(question)) {
        return pattern.answer;
      }
    }
    
    // Default response for questions that don't match any patterns
    return "Our organization handles this in accordance with our company policies and applicable regulations. We ensure compliance with all relevant laws and industry best practices.";
  };

  // Add a helper function to check if a question is mandatory
  const isMandatoryQuestion = (question: string): boolean => {
    // Check if the question contains "must" or ends with "(Required)"
    return question.toLowerCase().includes("must") || 
           question.endsWith("(Required)") || 
           question.endsWith("(required)") ||
           question.includes("mandatory") ||
           question.includes("Mandatory");
  };

  // Add a function to check if an answer is sufficient
  const isAnswerSufficient = (answer: string): boolean => {
    // Very basic check - could be enhanced for better evaluation
    const trimmedAnswer = answer.trim();
    
    // Check if the answer is empty, the default "We couldn't generate" message, or too short
    return trimmedAnswer.length > 20 && 
           !trimmedAnswer.startsWith("We couldn't generate") &&
           !trimmedAnswer.includes("AI answer will be generated");
  };

  // Update the handleGenerateAnswers function to check health first
  const handleGenerateAnswers = async (): Promise<QuestionAnswer[]> => {
    const questions = questionnaireInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (questions.length === 0) {
      setValidationError("No questions detected – please add questions first.");
      return [];
    }

    // Count mandatory questions
    const mandatoryCount = questions.filter(q => isMandatoryQuestion(q)).length;
    console.log(`Found ${mandatoryCount} mandatory questions out of ${questions.length} total`);

    setIsGeneratingAnswers(true);
    
    // Initialize answers with loading states for each question
    const initialAnswers = questions.map(question => ({ 
      question, 
      answer: 'Generating...', 
      isLoading: true,
      isMandatory: isMandatoryQuestion(question)
    }));
    setGeneratedAnswers(initialAnswers);
    setShowAIAssistant(true);
    
    try {
      // Determine the API endpoint based on environment
      const baseApiEndpoint = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5001'  // Use local Flask service if running locally
        : 'https://garnet-compliance-saas-production.up.railway.app';  // Production endpoint
      
      console.log('Using API endpoint:', baseApiEndpoint);
      
      // Check if the backend is healthy
      const isHealthy = await checkBackendHealth(baseApiEndpoint);
      if (!isHealthy) {
        console.warn('Backend health check failed, using fallback answers');
        throw new Error('Backend service is not available');
      }
      
      // Try batch processing first for efficiency
      const batchEndpoint = `${baseApiEndpoint}/batch-ask`;
      
      try {
        console.log('Attempting batch processing for', questions.length, 'questions');
        
        // Show processing status in UI
        setGeneratedAnswers(prev => 
          prev.map(item => ({ ...item, answer: 'Processing in batch mode...', isLoading: true }))
        );
        
        const batchResponse = await fetch(batchEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questions }),
        });
        
        // Check if the request was successful
        if (batchResponse.ok) {
          const data = await batchResponse.json();
          
          if (data.answers && Array.isArray(data.answers)) {
            console.log('Batch processing successful, received', data.answers.length, 'answers');
            
            // Map the batch responses back to our format
            const answers = data.answers.map((item: any, index: number) => {
              const questionText = item.question || questions[index];
              const answerText = item.answer || "We couldn't generate an answer—please try again.";
              const mandatory = isMandatoryQuestion(questionText);
              const sufficient = isAnswerSufficient(answerText);
              
              return {
                question: questionText,
                answer: answerText,
                isLoading: false,
                isMandatory: mandatory,
                needsAttention: mandatory && !sufficient
              };
            });
            
            setGeneratedAnswers(answers);
            setIsGeneratingAnswers(false);
            return answers;
          }
        } else {
          console.warn('Batch processing failed, status:', batchResponse.status);
          throw new Error('Batch processing failed');
        }
      } catch (batchError) {
        console.error("Error in batch processing:", batchError);
        // Continue with individual processing if batch fails
      }
      
      // If batch processing failed, process questions individually
      console.log('Falling back to individual processing for', questions.length, 'questions');
      
      // Process questions in parallel but update UI as each answer arrives
      const finalAnswers: QuestionAnswer[] = [...initialAnswers];
      const singleEndpoint = `${baseApiEndpoint}/ask`;
      
      await Promise.all(
        questions.map(async (question, index) => {
          try {
            const aiResponse = await fetch(singleEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ question }),
            });
            
            if (!aiResponse.ok) {
              throw new Error(`Failed to get AI response: ${aiResponse.status}`);
            }
            
            const aiData = await aiResponse.json();
            console.log(`Received answer for question ${index + 1}:`, aiData);
            
            const answerText = aiData.answer || "We couldn't generate an answer—please try again.";
            const isMandatory = isMandatoryQuestion(question);
            
            // Get the question and mandatory status
            const questionText = questions[index];
            const defaultAnswer = "We couldn't generate an answer—please try again.";
            
            // Update with error state
            finalAnswers[index] = { 
              question: questionText, 
              answer: defaultAnswer, 
              isLoading: false,
              isMandatory: isMandatory,
              needsAttention: isMandatory && !isAnswerSufficient(defaultAnswer)
            };
            
            // Update UI with current state
            setGeneratedAnswers([...finalAnswers]);
          } catch (error) {
            console.error(`Error getting AI answer for question ${index + 1}:`, error);
            
            // Get the question and mandatory status
            const questionText = questions[index];
            const isMandatory = isMandatoryQuestion(questionText);
            const defaultAnswer = "We couldn't generate an answer—please try again.";
            
            // Update with error state
            finalAnswers[index] = { 
              question: questionText, 
              answer: defaultAnswer, 
              isLoading: false,
              isMandatory: isMandatory,
              needsAttention: isMandatory && !isAnswerSufficient(defaultAnswer)
            };
            
            // Update UI with current state
            setGeneratedAnswers([...finalAnswers]);
          }
        })
      );

      // Final update - all loading states should be false now
      const completedAnswers = finalAnswers.map(qa => ({
        question: qa.question,
        answer: qa.answer,
        isLoading: false,
        isMandatory: qa.isMandatory,
        needsAttention: qa.needsAttention
      }));
      
      setGeneratedAnswers(completedAnswers);
      setIsGeneratingAnswers(false);
      return completedAnswers;
    } catch (error) {
      console.error('Error generating answers:', error);
      
      // Create fallback answers using the local fallback system
      const fallbackAnswers = questions.map(question => {
        const answer = generateLocalFallbackAnswer(question);
        const mandatory = isMandatoryQuestion(question);
        return {
          question,
          answer,
          isLoading: false,
          isMandatory: mandatory,
          needsAttention: mandatory && !isAnswerSufficient(answer)
        };
      });
      
      setGeneratedAnswers(fallbackAnswers);
      setIsGeneratingAnswers(false);
      return fallbackAnswers;
    }
  };

  // Wrapper function for button clicks (doesn't return anything)
  const handleGenerateAnswersClick = async () => {
    console.log('Generate answers button clicked');
    try {
      await handleGenerateAnswers();
      console.log('Answers generated successfully');
    } catch (error) {
      console.error('Error generating answers:', error);
      setValidationError('Failed to generate AI answers. Please try again.');
    }
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
      // Send POST request to the API
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: questionnaireTitle,
          questions: questions
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Clear autosaved draft
      localStorage.removeItem(AUTOSAVE_KEY);
      
      // Close modal
      closeQuestionnaireInput();
      
      // Navigate to the chat page with the returned questionnaireId
      router.push(`/questionnaires/${data.id}/chat`);
      
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
    setGeneratedAnswers([]);
    setShowAIAssistant(false);
    setIsGeneratingAnswers(false);
    setValidationError(null);
    setUploadError(null);
    setIsSubmitting(false);
    setDragActive(false);
    // Reset find/replace state
    setFindText('');
    setReplaceText('');
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
      setGeneratedAnswers([]);
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
    console.log('View questionnaire clicked:', questionnaire.id);
    
    // Use direct navigation for better reliability
    try {
      console.log('Navigating to:', `/questionnaires/${questionnaire.id}/chat`);
      window.location.href = `/questionnaires/${questionnaire.id}/chat`;
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to router push
      router.push(`/questionnaires/${questionnaire.id}/chat`);
    }
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
    // No need for browser confirm dialog since we're using our own UI confirmation
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
  };

  // Add an effect to ensure UI is properly initialized
  useEffect(() => {
    // Check if New Questionnaire button exists and ensure it has a click handler
    const newQuestionnaireButton = document.getElementById('new-questionnaire-button');
    
    if (newQuestionnaireButton) {
      console.log('New Questionnaire button found in DOM');
      
      // Add a direct event listener as a backup
      const clickHandler = () => {
        console.log('Direct click handler fired');
        // Reset all states
        setQuestionnaireTitle('');
        setQuestionnaireInput('');
        setQuestionAnswers([]);
        setGeneratedAnswers([]);
        setShowPreview(false);
        setFindReplaceMode(false);
        setShowAIAssistant(false);
        setValidationError(null);
        // Show the modal
        setShowQuestionnaireInput(true);
      };
      
      // Remove any existing listeners and add our new one
      newQuestionnaireButton.removeEventListener('click', clickHandler);
      newQuestionnaireButton.addEventListener('click', clickHandler);
      
      // Log that we're ready
      console.log('New Questionnaire button is ready');
      
      // Cleanup function
      return () => {
        newQuestionnaireButton.removeEventListener('click', clickHandler);
      };
    } else {
      console.log('New Questionnaire button not found in DOM yet');
    }
  }, [isLoading]); // Only run when loading state changes

  // Return to dashboard
  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  // Save questionnaire progress and return to dashboard
  const handleSaveAndReturn = async () => {
    if (!vendorId) {
      alert('No vendor ID found. Unable to save questionnaire.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format answers for API
      const formattedAnswers = questionAnswers.map(qa => ({
        questionId: btoa(qa.question).substring(0, 12), // Simple ID generation
        question: qa.question,
        answer: qa.answer,
        isMandatory: qa.isMandatory,
        needsAttention: qa.needsAttention || false
      }));
      
      // Save to API
      const response = await fetch(`/api/vendors/${vendorId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: formattedAnswers
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save questionnaire');
      }
      
      // Navigate back to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      alert('Failed to save questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SearchParamsProvider setVendorId={setVendorId} />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main id="main-content" className="container mx-auto py-8 px-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <ClipboardList className="mr-3 h-7 w-7 text-primary" />
                {vendorId ? `Vendor Questionnaire${vendorName ? `: ${vendorName}` : ''}` : 'Questionnaires'}
              </h1>
              <p className="text-gray-600 mt-1">
                {vendorId 
                  ? 'Complete the questionnaire by entering questions and generating AI answers' 
                  : 'Manage and track all your compliance questionnaires'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {vendorId ? (
                <button 
                  className="garnet-button garnet-button-secondary flex items-center"
                  onClick={handleReturnToDashboard}
                  type="button"
                >
                  Return to Dashboard
                </button>
              ) : (
                <button 
                  className="garnet-button garnet-button-gradient flex items-center"
                  onClick={handleNewQuestionnaire}
                  id="new-questionnaire-button"
                  type="button"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Questionnaire
                </button>
              )}
            </div>
          </div>
          
          {showQuestionnaireInput ? (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-auto p-4">
              <div 
                ref={modalRef}
                className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="questionnaire-modal-title"
              >
                <div className="py-3 px-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-primary/5 to-secondary/5">
                  <h2 id="questionnaire-modal-title" className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Create Questionnaire
                    </span>
                    <span className="ml-2">with AI Assistance</span>
                  </h2>
                  <button 
                    onClick={closeQuestionnaireInput}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-auto flex-grow">
                  <form onSubmit={handleSubmitQuestionnaire}>
                    {/* Title input */}
                    <div className="mb-5">
                      <label htmlFor="questionnaire-title" className="block text-sm font-medium text-gray-700 mb-1">
                        Questionnaire Title
                      </label>
                      <input
                        type="text"
                        id="questionnaire-title"
                        className="garnet-input"
                        placeholder="Enter title for this questionnaire"
                        value={questionnaireTitle}
                        onChange={(e) => setQuestionnaireTitle(e.target.value)}
                        required
                        aria-label="Questionnaire title"
                      />
                    </div>

                    {!showPreview && !showAIAssistant && (
                      <>
                        <div className="mb-5">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
                            
                            <div className="flex space-x-2">
                              <button 
                                type="button"
                                onClick={handleGenerateAnswersClick}
                                disabled={isGeneratingAnswers || questionCount === 0}
                                className="btn-gradient px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-all"
                              >
                                <Sparkles className="h-4 w-4 mr-1" />
                                {isGeneratingAnswers ? 'Generating...' : 'Generate AI Answers'}
                              </button>
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
                                className="text-sm text-primary hover:text-primary/80 flex items-center transition-all hover:bg-gray-100 px-2 py-1 rounded"
                                aria-label="Preview questions"
                              >
                                Preview
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4">
                            Type or paste each question on its own line. Click "Generate AI Answers" to get compliance-based responses.
                          </p>
                          
                          {/* Find and replace section */}
                          {findReplaceMode && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label htmlFor="find-text" className="block text-sm font-medium text-gray-700 mb-1">
                                    Find
                                  </label>
                                  <input
                                    type="text"
                                    id="find-text"
                                    className="garnet-input"
                                    value={findText}
                                    onChange={(e) => setFindText(e.target.value)}
                                    placeholder="Text to find"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="replace-text" className="block text-sm font-medium text-gray-700 mb-1">
                                    Replace
                                  </label>
                                  <input
                                    type="text"
                                    id="replace-text"
                                    className="garnet-input"
                                    value={replaceText}
                                    onChange={(e) => setReplaceText(e.target.value)}
                                    placeholder="Replacement text"
                                  />
                                </div>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  className="garnet-button garnet-button-primary text-sm"
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
                            className={`mb-5 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                              dragActive 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="h-12 w-12 text-primary/40 mb-3" />
                              <p className="text-gray-600 mb-2 font-medium">
                                {dragActive ? 'Drop file here' : 'Drag and drop a file here, or click to browse'}
                              </p>
                              <div className="flex items-center justify-center text-xs text-gray-500 mb-4">
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
                              <label className="garnet-button garnet-button-secondary text-sm cursor-pointer">
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
                            <div className="mb-4 text-sm text-gray-600 flex items-center justify-center">
                              <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </div>
                          )}
                          
                          {uploadError && (
                            <p className="mb-4 text-sm text-red-600">
                              {uploadError}
                            </p>
                          )}
                        </div>
                      
                        <div className="relative mb-5">
                          <textarea
                            ref={textareaRef}
                            className="garnet-input min-h-[200px] max-h-[400px] resize-none"
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
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
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
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center mr-3">
                              <Files className="h-4 w-4" />
                            </span>
                            Question Preview
                          </h3>
                          <div className="flex space-x-2">
                            <button 
                              type="button"
                              onClick={handleGenerateAnswersClick}
                              disabled={isGeneratingAnswers || questionCount === 0}
                              className="btn-gradient px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-all"
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              {isGeneratingAnswers ? 'Generating...' : 'Generate AI Answers'}
                            </button>
                            <button
                              type="button"
                              onClick={handleTogglePreview}
                              className="text-sm text-primary hover:text-primary/80 flex items-center transition-all hover:bg-gray-100 px-2 py-1 rounded"
                              aria-label="Preview questions"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-5 max-h-[400px] overflow-y-auto bg-gray-50">
                          {getParsedQuestions().length > 0 ? (
                            <ol className="list-decimal pl-5 space-y-3">
                              {getParsedQuestions().map((question, index) => (
                                <li key={index} className="text-gray-800">
                                  {question}
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-gray-500 text-center py-8">
                              No questions added yet. Go back to edit and add some questions.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Assistant Panel */}
                    {showAIAssistant && generatedAnswers.length > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center mr-3">
                              <MessageSquare className="h-4 w-4" />
                            </span>
                            AI-Generated Answers
                          </h3>
                          <div className="flex items-center space-x-4">
                            {/* Add counter for mandatory questions that need attention */}
                            <div className="text-sm">
                              {(() => {
                                const mandatoryCount = generatedAnswers.filter(qa => qa.isMandatory).length;
                                const needsAttentionCount = generatedAnswers.filter(qa => qa.needsAttention).length;
                                
                                return (
                                  <span className={needsAttentionCount > 0 ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                                    {needsAttentionCount > 0 
                                      ? `${needsAttentionCount} mandatory ${needsAttentionCount === 1 ? 'question' : 'questions'} need attention` 
                                      : mandatoryCount > 0 
                                        ? `All ${mandatoryCount} mandatory ${mandatoryCount === 1 ? 'question has' : 'questions have'} answers` 
                                        : 'No mandatory questions detected'}
                                  </span>
                                );
                              })()}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAIAssistant(false)}
                              className="text-sm text-primary hover:text-primary/80 flex items-center underline transition-all hover:bg-gray-100 px-2 py-1 rounded"
                            >
                              <ArrowLeft className="h-3 w-3 mr-1" /> Back to Edit
                            </button>
                          </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto shadow-sm">
                          {generatedAnswers.map((qa, index) => (
                            <div 
                              key={index} 
                              className={`p-5 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 last:border-0 ${
                                qa.needsAttention ? 'border-l-4 border-l-red-500' : qa.isMandatory ? 'border-l-4 border-l-green-500' : ''
                              }`}
                            >
                              <div className="mb-3 flex justify-between items-start">
                                <div>
                                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Q{index + 1}:</span>
                                  {qa.isMandatory && (
                                    <span className="ml-2 text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                      Required
                                    </span>
                                  )}
                                  <p className={`font-medium mt-1 ${qa.needsAttention ? 'text-red-700' : 'text-gray-800'}`}>
                                    {qa.question}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-bold text-primary uppercase tracking-wider">Answer:</span>
                                {qa.isLoading ? (
                                  <div className="mt-4 flex items-center justify-center py-6 text-sm text-gray-500">
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-3"></div>
                                    <span>Generating answer...</span>
                                  </div>
                                ) : (
                                  <div className={`mt-2 prose prose-sm max-w-none ${qa.needsAttention ? 'text-red-700 bg-red-50 p-3 rounded' : 'text-gray-700'}`}>
                                    {qa.answer.split('\n').map((paragraph, pIndex) => (
                                      <p key={pIndex} className="mb-2">{paragraph}</p>
                                    ))}
                                    
                                    {qa.needsAttention && (
                                      <div className="mt-3 bg-red-100 p-3 rounded-md text-red-800 text-sm">
                                        <p className="font-bold">⚠️ This answer needs attention</p>
                                        <p>This is a mandatory question that requires a more specific or complete answer.</p>
                                      </div>
                                    )}
                                    
                                    <div className="mt-4 flex justify-end">
                                      <button 
                                        className="garnet-button-small bg-gray-100 text-primary hover:bg-gray-200 flex items-center"
                                        onClick={() => {
                                          // Create temp textarea to copy text
                                          const textarea = document.createElement('textarea');
                                          textarea.value = qa.answer;
                                          document.body.appendChild(textarea);
                                          textarea.select();
                                          document.execCommand('copy');
                                          document.body.removeChild(textarea);
                                          
                                          // Show feedback (could use a toast here)
                                          alert('Answer copied to clipboard');
                                        }}
                                      >
                                        <ClipboardCopy className="h-3 w-3 mr-1" />
                                        Copy
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div id="question-counter" className="text-sm text-gray-600">
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
                        {generatedAnswers.length > 0 && (
                          <span className="text-primary ml-2">
                            • {generatedAnswers.length} AI answers generated
                          </span>
                        )}
                      </div>
                      
                      {/* Validation errors */}
                      {validationError && (
                        <p className="text-sm text-red-600">
                          {validationError}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={closeQuestionnaireInput}
                        className="garnet-button garnet-button-secondary"
                      >
                        Cancel
                      </button>
                      
                      {vendorId ? (
                        <button
                          type="button"
                          onClick={handleSaveAndReturn}
                          disabled={!questionnaireInput.trim() || isSubmitting}
                          className="garnet-button garnet-button-gradient"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </div>
                          ) : (
                            'Save and Return'
                          )}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!questionnaireInput.trim() || !questionnaireTitle.trim() || isSubmitting || questionCount > MAX_QUESTIONS}
                          className="garnet-button garnet-button-gradient"
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
                            'Create Questionnaire'
                          )}
                        </button>
                      )}
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
            onViewQuestionnaire={handleViewQuestionnaire}
            onEditQuestionnaire={handleEditQuestionnaire}
            onDeleteQuestionnaire={handleDeleteQuestionnaire}
          />
        </main>
      </div>
    </Suspense>
  );
};

export default QuestionnairesPage;