"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Check, Edit2, Save, Trash2 } from 'lucide-react';

interface QuestionAnswer {
  question: string;
  answer: string;
}

function QuestionnairesAnswersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(null);
  const [editedAnswer, setEditedAnswer] = useState('');
  
  useEffect(() => {
    // Load the questionnaire from localStorage
    const loadQuestionnaire = () => {
      try {
        if (typeof window !== 'undefined' && id) {
          const storedQuestionnaires = localStorage.getItem('user_questionnaires');
          if (storedQuestionnaires) {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            const found = parsedQuestionnaires.find((q: any) => q.id === id);
            
            if (found) {
              setQuestionnaire(found);
            } else {
              console.error('Questionnaire not found');
              // Redirect back to questionnaires list if not found
              router.push('/questionnaires');
            }
          }
        } else if (!id) {
          // No ID provided, redirect to questionnaires list
          router.push('/questionnaires');
        }
      } catch (error) {
        console.error('Error loading questionnaire:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestionnaire();
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{questionnaire.name}</h1>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span>Due: {questionnaire.dueDate}</span>
            <span className="mx-2">•</span>
            <span>Status: {questionnaire.status}</span>
          </div>
        </div>
        
        {/* Q&A Section with ChatGPT-like interface */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {questionnaire.answers?.map((qa: QuestionAnswer, index: number) => (
            <div key={index} className="rounded-lg overflow-hidden">
              {/* Question */}
              <div className="bg-gray-100 p-4 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-800">Question {index + 1}:</h3>
                </div>
                <p className="mt-2">{qa.question}</p>
              </div>
              
              {/* Answer */}
              <div className="bg-white border border-gray-200 p-4 rounded-b-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">Answer:</h3>
                  
                  <div className="flex space-x-2">
                    {editingAnswerIndex === index ? (
                      <>
                        <button 
                          onClick={() => handleSaveAnswer(index)}
                          className="text-green-600 hover:text-green-800 p-1"
                          aria-label="Save edited answer"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800 p-1"
                          aria-label="Cancel editing"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleEditAnswer(index)}
                        className="text-primary hover:text-primary/80 p-1"
                        aria-label="Edit answer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {editingAnswerIndex === index ? (
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md min-h-[200px]"
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    aria-label="Edit answer"
                  />
                ) : (
                  <div className="prose max-w-none">
                    <ReactMarkdown>{qa.answer}</ReactMarkdown>
                  </div>
                )}
              </div>
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
      <QuestionnairesAnswersContent />
    </Suspense>
  );
} 