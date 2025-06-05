"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Check, Edit2, RefreshCw, Save, Trash2 } from 'lucide-react';

interface QuestionAnswer {
  question: string;
  answer: string;
  isLoading?: boolean;
  isRegenerating?: boolean;
}

export function QuestionnairesAnswersClient({ id }: { id: string }) {
  const router = useRouter();
  
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(null);
  const [editedAnswer, setEditedAnswer] = useState('');
  // Add new state for tracking regeneration and loading states
  const [regeneratingAnswers, setRegeneratingAnswers] = useState<Record<number, boolean>>({});
  const [answerCache, setAnswerCache] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Load the questionnaire from localStorage
    const loadQuestionnaire = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedQuestionnaires = localStorage.getItem('user_questionnaires');
          if (storedQuestionnaires) {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            const found = parsedQuestionnaires.find((q: any) => q.id === id);
            
            if (found) {
              // Check for and remove duplicate questions
              if (found.answers && found.answers.length > 0) {
                // Create a Map to track unique questions (case insensitive)
                const uniqueQuestions = new Map();
                
                // Filter out duplicate questions, keeping only the first occurrence
                const uniqueAnswers = found.answers.filter((qa: QuestionAnswer) => {
                  const normalizedQuestion = qa.question.trim().toLowerCase();
                  if (!uniqueQuestions.has(normalizedQuestion)) {
                    uniqueQuestions.set(normalizedQuestion, true);
                    return true;
                  }
                  return false;
                });
                
                // If we found and removed duplicates, update the questionnaire
                if (uniqueAnswers.length < found.answers.length) {
                  console.log(`Removed ${found.answers.length - uniqueAnswers.length} duplicate questions`);
                  
                  // Update the questionnaire with de-duplicated answers
                  found.answers = uniqueAnswers;
                  
                  // Update in local storage
                  const updatedQuestionnaires = parsedQuestionnaires.map((q: any) => 
                    q.id === id ? found : q
                  );
                  
                  localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
                }
              }
              
              // Initialize the answer cache with current answers
              const initialCache: Record<string, string> = {};
              if (found.answers) {
                found.answers.forEach((qa: QuestionAnswer, index: number) => {
                  initialCache[`${found.id}-${index}`] = qa.answer;
                });
              }
              setAnswerCache(initialCache);
              setQuestionnaire(found);
            } else {
              console.error('Questionnaire not found');
              // Redirect back to questionnaires list if not found
              router.push('/questionnaires');
            }
          }
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
    
    // Update answer cache
    setAnswerCache({
      ...answerCache,
      [`${questionnaire.id}-${index}`]: editedAnswer
    });
    
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
  
  // Handle regenerating an answer
  const handleRegenerateAnswer = async (index: number) => {
    if (!questionnaire || !questionnaire.answers) return;
    
    const question = questionnaire.answers[index].question;
    
    // Set regenerating state for this answer
    setRegeneratingAnswers(prev => ({ ...prev, [index]: true }));
    
    // Update UI to show loading state
    const updatedQuestionnaire = {
      ...questionnaire,
      answers: [...questionnaire.answers]
    };
    
    updatedQuestionnaire.answers[index] = {
      ...updatedQuestionnaire.answers[index],
      answer: "Generating new answer...",
      isLoading: true
    };
    
    setQuestionnaire(updatedQuestionnaire);
    
    try {
      const apiEndpoint = 'https://garnet-compliance-saas-production.up.railway.app/ask';
        
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate answer');
      }
      
      const data = await response.json();
      const newAnswer = data.answer || "We couldn't generate an answer—please try again.";
      
      // Create a copy of the questionnaire
      const finalQuestionnaire = {
        ...questionnaire,
        answers: [...questionnaire.answers]
      };
      
      // Update the specific answer
      finalQuestionnaire.answers[index] = {
        ...finalQuestionnaire.answers[index],
        answer: newAnswer,
        isLoading: false
      };
      
      // Update the cache
      setAnswerCache({
        ...answerCache,
        [`${questionnaire.id}-${index}`]: newAnswer
      });
      
      // Save back to localStorage
      if (typeof window !== 'undefined') {
        const storedQuestionnaires = localStorage.getItem('user_questionnaires');
        if (storedQuestionnaires) {
          try {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            const updatedQuestionnaires = parsedQuestionnaires.map((q: any) => 
              q.id === id ? finalQuestionnaire : q
            );
            
            localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
            setQuestionnaire(finalQuestionnaire);
          } catch (error) {
            console.error('Error saving questionnaire:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error regenerating answer:', error);
      
      // Update with error state
      const errorQuestionnaire = {
        ...questionnaire,
        answers: [...questionnaire.answers]
      };
      
      errorQuestionnaire.answers[index] = {
        ...errorQuestionnaire.answers[index],
        answer: "We couldn't generate an answer—please try again.",
        isLoading: false
      };
      
      setQuestionnaire(errorQuestionnaire);
      
      // Save error state to localStorage
      if (typeof window !== 'undefined') {
        const storedQuestionnaires = localStorage.getItem('user_questionnaires');
        if (storedQuestionnaires) {
          try {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            const updatedQuestionnaires = parsedQuestionnaires.map((q: any) => 
              q.id === id ? errorQuestionnaire : q
            );
            
            localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
          } catch (error) {
            console.error('Error saving questionnaire:', error);
          }
        }
      }
    } finally {
      setRegeneratingAnswers(prev => ({ ...prev, [index]: false }));
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
      <Header />
      <main className="container mx-auto py-8 px-4 questionnaire-container">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Questionnaires
          </button>
        </div>
        
        {/* Questionnaire Header */}
        <div className="questionnaire-header">
          <h1 className="questionnaire-title flex items-center">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {questionnaire.name}
            </span>
          </h1>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span>Due: {questionnaire.dueDate}</span>
            <span className="mx-2">•</span>
            <span>Status: <span className="badge badge-primary ml-1">{questionnaire.status}</span></span>
          </div>
        </div>
        
        {/* Q&A Section with ChatGPT-like interface */}
        <div className="space-y-8 max-w-4xl mx-auto animate-slide-up" role="list" aria-label="Questions and answers">
          {questionnaire.answers?.map((qa: QuestionAnswer, index: number) => (
            <section key={index} className="questionnaire-card shadow-sm overflow-hidden" role="listitem">
              {/* Question */}
              <div className="bg-gray-50 p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800 text-lg flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center mr-3 font-bold">
                      {index + 1}
                    </span>
                    Question:
                  </h3>
                </div>
                <p className="mt-3 text-gray-700">{qa.question}</p>
              </div>
              
              {/* Answer */}
              <article className="bg-white border-t border-gray-200 p-6 rounded-b-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-primary text-lg flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                      <Check className="h-4 w-4" />
                    </span>
                    Answer:
                  </h3>
                  
                  <div className="flex space-x-2">
                    {editingAnswerIndex === index ? (
                      <>
                        <button 
                          onClick={() => handleSaveAnswer(index)}
                          className="garnet-button-small bg-success-light text-success-dark hover:bg-success/20"
                          aria-label="Save edited answer"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="garnet-button-small bg-gray-100 text-gray-600 hover:bg-gray-200"
                          aria-label="Cancel editing"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEditAnswer(index)}
                          className="garnet-button-small bg-primary-light text-primary-dark hover:bg-primary/20"
                          aria-label="Edit answer"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleRegenerateAnswer(index)}
                          className="garnet-button-small bg-secondary-light text-secondary-dark hover:bg-secondary/20"
                          aria-label="Regenerate answer"
                          disabled={regeneratingAnswers[index] || qa.isLoading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${(regeneratingAnswers[index] || qa.isLoading) ? 'animate-spin' : ''}`} />
                          Regenerate
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {editingAnswerIndex === index ? (
                  <textarea
                    className="garnet-input min-h-[200px]"
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    aria-label="Edit answer"
                  />
                ) : qa.isLoading ? (
                  <div className="flex items-center justify-center py-16 bg-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-500">Generating new answer...</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none pt-2">
                    <ReactMarkdown>{qa.answer}</ReactMarkdown>
                  </div>
                )}
              </article>
            </section>
          ))}
        </div>
      </main>
    </>
  );
} 