"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Check, Edit2, Save, Trash2, Copy, MessageSquare, DownloadCloud, ChevronUp, ChevronDown, X, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface QuestionAnswer {
  question: string;
  answer: string;
}

// Client component that uses useSearchParams
function SearchParamsHandler({ setId }: { setId: (id: string | null) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const id = searchParams?.get('id') || null;
    console.log('SearchParamsHandler: ID from URL:', id);
    setId(id);
  }, [searchParams, setId]);
  
  return null;
}

function QuestionnairesAnswersContent() {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(null);
  const [editedAnswer, setEditedAnswer] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Direct URL parsing for when component is loaded directly
  useEffect(() => {
    // This is a fallback for when the component is loaded directly
    if (!id && typeof window !== 'undefined') {
      console.log('Direct URL check activated');
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id');
      
      console.log('Direct URL ID found:', urlId);
      if (urlId) {
        setId(urlId);
      }
    }
  }, [id]);

  // Initialize expanded sections
  useEffect(() => {
    if (questionnaire?.answers?.length > 0) {
      const initialExpandedState: Record<number, boolean> = {};
      // Set first 3 sections as expanded by default
      questionnaire.answers.forEach((_: QuestionAnswer, index: number) => {
        initialExpandedState[index] = index < 3;
      });
      setExpandedSections(initialExpandedState);
    }
  }, [questionnaire]);

  // Toggle section expansion
  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Copy answer to clipboard
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // Export questionnaire as JSON
  const exportQuestionnaire = () => {
    if (!questionnaire) return;
    
    const dataStr = JSON.stringify(questionnaire, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${questionnaire.name.replace(/\s+/g, '_')}_answers.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  useEffect(() => {
    // Load the questionnaire from localStorage
    const loadQuestionnaire = () => {
      try {
        console.log('Loading questionnaire with ID:', id);
        
        if (typeof window !== 'undefined' && id) {
          const storedQuestionnaires = localStorage.getItem('user_questionnaires');
          console.log('Found stored questionnaires:', storedQuestionnaires ? 'yes' : 'no');
          
          if (storedQuestionnaires) {
            try {
              const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
              console.log('Number of questionnaires found:', parsedQuestionnaires.length);
              
              const found = parsedQuestionnaires.find((q: any) => q.id === id);
              console.log('Questionnaire found:', found ? 'yes' : 'no');
              
              if (found) {
                setQuestionnaire(found);
                console.log('Questionnaire set successfully');
              } else {
                console.error('Questionnaire not found with ID:', id);
                // Redirect back to questionnaires list if not found
                router.push('/questionnaires');
              }
            } catch (parseError) {
              console.error('Error parsing stored questionnaires:', parseError);
              setLoading(false);
            }
          } else {
            console.error('No stored questionnaires found');
            router.push('/questionnaires');
          }
        } else if (!id) {
          console.error('No ID provided in URL');
          // No ID provided, redirect to questionnaires list
          router.push('/questionnaires');
        }
      } catch (error) {
        console.error('Error loading questionnaire:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadQuestionnaire();
    }
  }, [id, router]);
  
  // Handle saving edited answer
  const handleSaveAnswer = (index: number) => {
    if (!questionnaire || !questionnaire.answers) return;
    
    // Create a copy of the questionnaire
    const updatedQuestionnaire = {
      ...questionnaire,
      answers: [...questionnaire.answers]
    };
    
    // Update the specific answer
    updatedQuestionnaire.answers[index] = {
      ...updatedQuestionnaire.answers[index],
      answer: editedAnswer
    };
    
    // Save back to localStorage
    if (typeof window !== 'undefined') {
      const storedQuestionnaires = localStorage.getItem('user_questionnaires');
      if (storedQuestionnaires) {
        try {
          const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
          const updatedQuestionnaires = parsedQuestionnaires.map((q: any) => 
            q.id === id ? updatedQuestionnaire : q
          );
          
          localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
          setQuestionnaire(updatedQuestionnaire);
          setEditingAnswerIndex(null);
        } catch (error) {
          console.error('Error saving questionnaire:', error);
        }
      }
    }
  };
  
  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingAnswerIndex(null);
  };
  
  // Handle starting edit
  const handleEditAnswer = (index: number) => {
    setEditingAnswerIndex(index);
    setEditedAnswer(questionnaire.answers[index].answer);
  };
  
  // Handle going back to questionnaires list
  const handleBack = () => {
    router.push('/questionnaires');
  };
  
  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </>
    );
  }
  
  if (!questionnaire) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-4">Questionnaire not found</h2>
            <button
              onClick={handleBack}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questionnaires
            </button>
          </div>
        </main>
      </>
    );
  }
  
  return (
    <>
      <SearchParamsHandler setId={setId} />
      <Header />
      <main className="container mx-auto py-8 px-4">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Questionnaires
          </button>
        </div>
        
        {/* Questionnaire Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{questionnaire.name}</h1>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <span>Due: {questionnaire.dueDate}</span>
              <span className="mx-2">•</span>
              <span>Status: {questionnaire.status}</span>
              <span className="mx-2">•</span>
              <span>Progress: {questionnaire.progress}%</span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              onClick={exportQuestionnaire}
              className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        {/* Summary */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-2xl font-bold text-primary">{questionnaire.answers?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <p className="text-sm text-gray-500">Completed Answers</p>
              <p className="text-2xl font-bold text-green-600">{questionnaire.answers?.filter((qa: any) => qa.answer?.trim().length > 0).length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium text-gray-700">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {/* Q&A Section with ChatGPT-like interface */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {questionnaire.answers?.map((qa: QuestionAnswer, index: number) => (
            <div key={index} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              {/* Question Header */}
              <div 
                className="bg-gray-100 p-4 cursor-pointer hover:bg-gray-200 transition-colors flex justify-between items-center"
                onClick={() => toggleSection(index)}
              >
                <h3 className="font-medium text-gray-800">
                  Question {index + 1}: {qa.question.length > 100 ? qa.question.substring(0, 100) + '...' : qa.question}
                </h3>
                <div className="flex items-center">
                  {expandedSections[index] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
              
              {/* Answer */}
              {expandedSections[index] && (
                <div className="bg-white p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800">Answer:</h3>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => copyToClipboard(qa.answer, index)}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                        aria-label="Copy answer to clipboard"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      
                      {editingAnswerIndex === index ? (
                        <>
                          <button 
                            onClick={() => handleSaveAnswer(index)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            aria-label="Save edited answer"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                            aria-label="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleEditAnswer(index)}
                          className="text-primary hover:text-primary/80 p-1 rounded hover:bg-blue-50"
                          aria-label="Edit answer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {editingAnswerIndex === index ? (
                    <div className="mt-2">
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-md min-h-[200px] focus:ring-2 focus:ring-primary focus:border-primary"
                        value={editedAnswer}
                        onChange={(e) => setEditedAnswer(e.target.value)}
                        aria-label="Edit answer"
                      />
                      <div className="flex justify-end mt-2 space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveAnswer(index)}
                          className="px-3 py-1 text-white bg-primary rounded-md hover:bg-primary/90"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none bg-gray-50 p-4 rounded-md mt-2">
                      {qa.answer ? (
                        <ReactMarkdown>{qa.answer}</ReactMarkdown>
                      ) : (
                        <div className="flex items-center text-gray-500 italic">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          No answer provided yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export default function QuestionnairesAnswersPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </>
    }>
      <>
        <QuestionnairesAnswersContent />
        <script dangerouslySetInnerHTML={{ 
          __html: `
            console.log("Page loaded - checking for questionnaire ID");
            if (!window.location.search.includes('id=')) {
              console.error("No ID found in URL, redirecting to questionnaires page");
              window.location.href = "/questionnaires";
            }
          `
        }} />
      </>
    </Suspense>
  );
} 