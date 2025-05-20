"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { ClipboardList, Filter, Plus, Search, SlidersHorizontal, X, Upload } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { QuestionnaireList, Questionnaire, QuestionnaireStatus } from "@/components/dashboard/QuestionnaireList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface QuestionAnswer {
  question: string;
  answer: string;
}

const QuestionnairesPage = () => {
  // Sample data for demonstration
  const mockQuestionnaires = [
    { id: "q1", name: "SOC 2 Type II Assessment", status: "In Progress" as QuestionnaireStatus, dueDate: "Aug 15, 2023", progress: 65 },
    { id: "q2", name: "GDPR Compliance Questionnaire", status: "Completed" as QuestionnaireStatus, dueDate: "Jul 28, 2023", progress: 100 },
    { id: "q3", name: "ISO 27001 Readiness Assessment", status: "Not Started" as QuestionnaireStatus, dueDate: "Sep 10, 2023", progress: 0 },
    { id: "q4", name: "HIPAA Security Assessment", status: "In Review" as QuestionnaireStatus, dueDate: "Aug 5, 2023", progress: 85 },
    { id: "q5", name: "Vendor Security Assessment", status: "Draft" as QuestionnaireStatus, dueDate: "Sep 30, 2023", progress: 20 },
  ];
  
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // New state variables for the questionnaire input modal
  const [showQuestionnaireInput, setShowQuestionnaireInput] = useState(false);
  const [questionnaireInput, setQuestionnaireInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add state for file upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate API fetch with delay and potential error
  const fetchQuestionnaires = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Uncomment to simulate error
      // if (Math.random() > 0.7) throw new Error("Failed to fetch questionnaires");
      
      setQuestionnaires(mockQuestionnaires);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching questionnaires:", err);
      setError('Unable to load questionnaires. Please try again.');
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchQuestionnaires();
  }, []);
  
  // Focus the textarea when the modal is shown
  useEffect(() => {
    if (showQuestionnaireInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showQuestionnaireInput]);
  
  const handleNewQuestionnaire = () => {
    setShowQuestionnaireInput(true);
    setQuestionnaireInput('');
    setQuestionAnswers([]);
  };
  
  const handleSubmitQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionnaireInput.trim()) return;
    
    // Parse input into separate questions (non-empty lines)
    const questions = questionnaireInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
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
        },
        body: JSON.stringify({ questions }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate answers');
      }
      
      const data = await response.json();
      
      // Assuming the API returns an array of answers corresponding to each question
      const qaResults = questions.map((question, index) => ({
        question,
        answer: data.answers[index] || 'No answer generated',
      }));
      
      setQuestionAnswers(qaResults);
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      // In a real application, you would display an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeQuestionnaireInput = () => {
    setShowQuestionnaireInput(false);
    setQuestionnaireInput('');
    setQuestionAnswers([]);
  };

  // Handle file upload
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Check file type
      if (file.type !== 'text/plain') {
        throw new Error('Only .txt files are supported at this time');
      }
      
      // Read file content
      const text = await readFileAsText(file);
      
      // Set the text to the textarea
      setQuestionnaireInput(text);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'An error occurred while uploading the file');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

  return (
    <>
      <header 
        role="banner" 
        className="sticky top-0 z-10 flex items-center justify-between bg-white shadow-sm px-6 py-3"
      >
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-8">Vendor Onboarding</h1>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Dashboard
            </a>
            <a href="/questionnaires" className="text-primary font-medium min-h-[44px] flex items-center border-b-2 border-primary">
              Questionnaires
            </a>
            <a href="/vendors" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Vendors
            </a>
            <a href="/trust-portal" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Trust Portal
            </a>
            <a href="/compliance" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Compliance
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <MobileNavigation />
          
          <button 
            className="text-gray-600 hover:text-black flex items-center min-h-[44px] min-w-[44px] px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md" 
            disabled
            aria-label="User profile (not functional)"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="hidden md:inline">Profile</span>
          </button>
          
          <button 
            className="text-gray-600 hover:text-black flex items-center min-h-[44px] min-w-[44px] px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md" 
            disabled
            aria-label="Logout button (not functional)"
          >
            <svg className="h-5 w-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8">
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
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Compliance Questionnaire Input</h2>
                <button 
                  onClick={closeQuestionnaireInput}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-auto flex-grow">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Your Questions</h3>
                  <p className="text-gray-600 text-sm mb-4">Enter one question per line or upload a text file</p>
                  
                  {/* File upload area */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Questions (.txt)
                        <input
                          type="file"
                          className="hidden"
                          accept=".txt"
                          onChange={handleFileUpload}
                          ref={fileInputRef}
                          disabled={isUploading}
                        />
                      </label>
                      
                      {isUploading && (
                        <span className="text-sm text-gray-500 flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing file...
                        </span>
                      )}
                    </div>
                    
                    {uploadError && (
                      <p className="mt-2 text-sm text-red-600">
                        {uploadError}
                      </p>
                    )}
                  </div>
                  
                  <form onSubmit={handleSubmitQuestionnaire}>
                    <textarea
                      ref={textareaRef}
                      className="w-full h-48 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="Enter one question per line"
                      value={questionnaireInput}
                      onChange={(e) => setQuestionnaireInput(e.target.value)}
                      aria-label="Questionnaire input"
                    />
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={!questionnaireInput.trim() || isSubmitting}
                        className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
                
                {/* Response section */}
                {questionAnswers.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">AI Responses</h3>
                    
                    <div className="space-y-4">
                      {questionAnswers.map((qa, index) => (
                        <Card key={index} className="border-gray-200">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">Q: {qa.question}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm">A: {qa.answer}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={closeQuestionnaireInput}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
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
        />
      </main>
    </>
  );
};

export default QuestionnairesPage; 