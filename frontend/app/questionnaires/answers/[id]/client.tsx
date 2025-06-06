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
  
  // Function to generate AI answer for a question
  const generateAIAnswer = async (question: string): Promise<string> => {
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
        throw new Error('Failed to generate answer');
      }
      
      const data = await response.json();
      return data.answer || "We couldn't generate an answer—please try again.";
    } catch (error) {
      console.error('Error generating AI answer:', error);
      return "We couldn't generate an answer—please try again.";
    }
  };

  useEffect(() => {
    // Load the questionnaire from localStorage
    const loadQuestionnaire = async () => {
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
              
              // Check if this is a new questionnaire (all answers are empty)
              const hasEmptyAnswers = found.answers && found.answers.some((qa: QuestionAnswer) => 
                !qa.answer || qa.answer.trim() === ''
              );
              
              if (hasEmptyAnswers) {
                // This is a new questionnaire, auto-generate answers
                console.log('Detected new questionnaire, auto-generating AI answers...');
                
                // Set questionnaire first with loading states
                const questionnaireWithLoading = {
                  ...found,
                  answers: found.answers.map((qa: QuestionAnswer) => ({
                    ...qa,
                    answer: qa.answer || 'Generating AI answer...',
                    isLoading: !qa.answer || qa.answer.trim() === ''
                  }))
                };
                setQuestionnaire(questionnaireWithLoading);
                
                // Generate answers for empty questions
                const updatedAnswers = await Promise.all(
                  found.answers.map(async (qa: QuestionAnswer, index: number) => {
                    if (!qa.answer || qa.answer.trim() === '') {
                      try {
                        const aiAnswer = await generateAIAnswer(qa.question);
                        return { ...qa, answer: aiAnswer, isLoading: false };
                      } catch (error) {
                        console.error(`Error generating answer for question ${index + 1}:`, error);
                        return { 
                          ...qa, 
                          answer: "We couldn't generate an answer—please try again.", 
                          isLoading: false 
                        };
                      }
                    }
                    return qa;
                  })
                );
                
                                 // Calculate progress
                 const answeredQuestions = updatedAnswers.filter(qa => qa.answer && qa.answer.trim() !== '' && qa.answer !== "Generating AI answer...").length;
                 const totalQuestions = updatedAnswers.length;
                 const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
                 
                 // Determine status
                 let status = 'Not Started';
                 if (progress === 100) {
                   status = 'Completed';
                 } else if (progress >= 75) {
                   status = 'In Review';
                 } else if (progress >= 25) {
                   status = 'In Progress';
                 } else if (progress > 0) {
                   status = 'Draft';
                 }

                 // Update questionnaire with generated answers
                 const updatedQuestionnaire = {
                   ...found,
                   answers: updatedAnswers,
                   status: status as any,
                   progress: progress
                 };
                
                // Save back to localStorage
                const finalQuestionnaires = parsedQuestionnaires.map((q: any) => 
                  q.id === id ? updatedQuestionnaire : q
                );
                localStorage.setItem('user_questionnaires', JSON.stringify(finalQuestionnaires));
                
                setQuestionnaire(updatedQuestionnaire);
              } else {
                setQuestionnaire(found);
              }
              
              // Initialize the answer cache with current answers
              const initialCache: Record<string, string> = {};
              if (found.answers) {
                found.answers.forEach((qa: QuestionAnswer, index: number) => {
                  initialCache[`${found.id}-${index}`] = qa.answer;
                });
              }
              setAnswerCache(initialCache);
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
  const handleSaveAnswer = async (index: number) => {
    if (!questionnaire || !questionnaire.answers) return;
    
    try {
      // Call backend API first
      const response = await fetch(`https://garnet-compliance-saas-production.up.railway.app/api/questionnaires/${id}/questions/${index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: editedAnswer
        }),
      });

      let updatedQuestionnaire;
      
      if (response.ok) {
        // Backend update successful
        updatedQuestionnaire = await response.json();
        
        // Convert backend format to frontend format if needed
        if (updatedQuestionnaire.answers) {
          updatedQuestionnaire.answers = updatedQuestionnaire.answers.map((qa: any) => ({
            question: qa.question,
            answer: qa.answer,
            isMandatory: qa.isMandatory,
            needsAttention: qa.needsAttention || false,
            isLoading: false
          }));
        }
      } else {
        // Backend failed, update locally
        console.warn('Backend update failed, updating locally');
        updatedQuestionnaire = {
          ...questionnaire,
          answers: [...questionnaire.answers]
        };
        
        // Update the specific answer
        updatedQuestionnaire.answers[index] = {
          ...updatedQuestionnaire.answers[index],
          answer: editedAnswer
        };
      }
      
      // Update answer cache
      setAnswerCache({
        ...answerCache,
        [`${questionnaire.id}-${index}`]: editedAnswer
      });
      
      // Save to localStorage for offline access
      if (typeof window !== 'undefined') {
        const storedQuestionnaires = localStorage.getItem('user_questionnaires');
        if (storedQuestionnaires) {
          try {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            const updatedQuestionnaires = parsedQuestionnaires.map((q: any) => 
              q.id === id ? {
                ...q,
                answers: q.answers.map((qa: any, idx: number) => 
                  idx === index ? { ...qa, answer: editedAnswer } : qa
                ),
                progress: updatedQuestionnaire.progress,
                status: updatedQuestionnaire.status
              } : q
            );
            
            localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
            setQuestionnaire(updatedQuestionnaire);
            setEditingAnswerIndex(null);
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
        }
      }
      
    } catch (error) {
      console.error('Error saving answer:', error);
      
      // Fallback to localStorage only
      try {
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
        
        // Save to localStorage as fallback
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
      } catch (fallbackError) {
        console.error('Fallback save failed:', fallbackError);
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {questionnaire.name}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-full px-6 py-3 inline-flex">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Due: {questionnaire.dueDate}
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${
                questionnaire.status === 'Completed' ? 'bg-green-500' :
                questionnaire.status === 'In Progress' ? 'bg-blue-500' :
                questionnaire.status === 'In Review' ? 'bg-orange-500' :
                questionnaire.status === 'Draft' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}></span>
              Status: {questionnaire.status}
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
              Progress: {questionnaire.progress}%
            </span>
          </div>
        </div>
        
        {/* Welcome Message for new questionnaire */}
        {questionnaire.answers?.some((qa: QuestionAnswer) => qa.isLoading) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Welcome to Garnet AI Assistant</h3>
              </div>
              <p className="text-gray-600">
                I'm generating intelligent responses for your questionnaire questions. This may take a moment...
              </p>
            </div>
          </div>
        )}

        {/* Q&A Section with Enhanced ChatGPT-like interface */}
        <div className="space-y-6 max-w-4xl mx-auto animate-slide-up" role="list" aria-label="Questions and answers">
          {questionnaire.answers?.map((qa: QuestionAnswer, index: number) => (
            <div key={index} className="space-y-4" role="listitem">
              {/* Question Bubble (User style) */}
              <div className="flex justify-end">
                <div className="max-w-3xl bg-primary text-white rounded-2xl rounded-tr-md px-6 py-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center mr-2 text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm opacity-90">Question</span>
                  </div>
                  <p className="text-white leading-relaxed">{qa.question}</p>
                </div>
              </div>
              
              {/* Answer Bubble (Assistant style) */}
              <div className="flex justify-start">
                <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl rounded-tl-md px-6 py-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Garnet AI Assistant</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      {editingAnswerIndex === index ? (
                        <>
                          <button 
                            onClick={() => handleSaveAnswer(index)}
                            className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center"
                            aria-label="Save edited answer"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
                            aria-label="Cancel editing"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEditAnswer(index)}
                            className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                            aria-label="Edit answer"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleRegenerateAnswer(index)}
                            className="px-3 py-1.5 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors flex items-center"
                            aria-label="Regenerate answer"
                            disabled={regeneratingAnswers[index] || qa.isLoading}
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${(regeneratingAnswers[index] || qa.isLoading) ? 'animate-spin' : ''}`} />
                            Regenerate
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingAnswerIndex === index ? (
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[200px] resize-none"
                      value={editedAnswer}
                      onChange={(e) => setEditedAnswer(e.target.value)}
                      aria-label="Edit answer"
                      placeholder="Edit your answer here..."
                    />
                  ) : qa.isLoading ? (
                    <div className="flex items-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-3"></div>
                      <div>
                        <p className="text-gray-600 font-medium">Generating intelligent response...</p>
                        <p className="text-sm text-gray-400 mt-1">This may take a few moments</p>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                      <ReactMarkdown 
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-600">{children}</em>
                        }}
                      >
                        {qa.answer}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {questionnaire.answers?.length > 0 && !questionnaire.answers.some((qa: QuestionAnswer) => qa.isLoading) && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Questionnaire Complete!</h3>
              <p className="text-gray-600 mb-4">
                All questions have been answered with AI-generated responses. You can edit any answer or regenerate new responses as needed.
              </p>
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center mx-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Questionnaires
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
} 