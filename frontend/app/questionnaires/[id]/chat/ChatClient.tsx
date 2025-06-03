"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, RefreshCw, User, Bot } from 'lucide-react';
import Header from '@/components/Header';

interface Question {
  id: string;
  text: string;
  answer?: string;
}

export function ChatClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string>('');

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      setLoading(true);
      try {
        // Try to fetch questionnaire data from API
        try {
          const response = await fetch(`/api/questionnaires/${params.id}`);
          
          if (response.ok) {
            const data = await response.json();
            
            setTitle(data.title || 'Questionnaire');
            
            // Transform questions into the format we need
            const formattedQuestions = Array.isArray(data.questions) 
              ? data.questions.map((q: any) => ({
                  id: q.id || crypto.randomUUID(),
                  text: q.text || q.question || q,
                  answer: q.answer || ''
                }))
              : [];
              
            setQuestions(formattedQuestions);
            setLoading(false);
            return; // Successfully loaded data from API
          }
        } catch (apiError) {
          console.log('API fetch failed, using fallback data:', apiError);
          // Continue to fallback data if API fetch fails
        }
        
        // Fallback: Try to load from localStorage for static export scenarios
        if (typeof window !== 'undefined') {
          const storedQuestionnaires = localStorage.getItem('user_questionnaires');
          if (storedQuestionnaires) {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            const questionnaire = parsedQuestionnaires.find((q: any) => q.id === params.id);
            
            if (questionnaire) {
              setTitle(questionnaire.name || 'Questionnaire');
              
              // Use answers from localStorage as questions for the chat
              const formattedQuestions = Array.isArray(questionnaire.answers) 
                ? questionnaire.answers.map((a: any) => ({
                    id: crypto.randomUUID(),
                    text: a.question || 'Question',
                    answer: a.answer || ''
                  }))
                : [];
                
              setQuestions(formattedQuestions);
              setLoading(false);
              return; // Successfully loaded from localStorage
            }
          }
        }
        
        // If we get here, generate fallback data based on ID
        // This ensures the page works in static export even without API or localStorage
        const fallbackTitle = `Questionnaire ${params.id.replace('q_', '#')}`;
        setTitle(fallbackTitle);
        
        // Generate some deterministic dummy questions based on the ID
        const questionSeed = params.id.split('_').pop() || '1';
        const questionCount = (parseInt(questionSeed, 10) % 5) + 3; // 3-7 questions
        
        const dummyQuestions = [
          { id: crypto.randomUUID(), text: 'How does your organization handle data security?', answer: 'Our organization follows industry best practices for data security, including encryption and access controls.' },
          { id: crypto.randomUUID(), text: 'What compliance frameworks do you adhere to?', answer: 'We adhere to SOC 2, GDPR, and ISO 27001 frameworks to ensure comprehensive compliance.' },
          { id: crypto.randomUUID(), text: 'How often do you perform security audits?', answer: 'We perform internal security audits quarterly and engage third-party auditors annually.' },
          { id: crypto.randomUUID(), text: 'What is your incident response procedure?', answer: 'Our incident response team follows a documented procedure that includes containment, eradication, and recovery phases.' },
          { id: crypto.randomUUID(), text: 'How do you handle third-party risk?', answer: 'We have a thorough vendor assessment process that evaluates security practices before engagement.' },
          { id: crypto.randomUUID(), text: 'What data retention policies do you have in place?', answer: 'Our data retention policies comply with regulatory requirements while minimizing unnecessary data storage.' },
          { id: crypto.randomUUID(), text: 'How do you secure your cloud infrastructure?', answer: 'We implement defense-in-depth strategies including network segmentation, encryption, and continuous monitoring.' },
        ].slice(0, questionCount);
        
        setQuestions(dummyQuestions);
      } catch (err) {
        console.error('Error loading questionnaire data:', err);
        setError('Failed to load questionnaire. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchQuestionnaire();
    }
  }, [params.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim()) return;
    
    // Add user message to questions array
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: userMessage,
    };
    
    setQuestions([...questions, newQuestion]);
    setUserMessage('');
    
    // You could implement AI response generation here
    // For now, we'll just simulate a response
    setTimeout(() => {
      const aiResponse: Question = {
        id: crypto.randomUUID(),
        text: `I'm analyzing your question: "${userMessage}"`,
        answer: 'This is a placeholder response. In a real implementation, this would be generated by an AI.'
      };
      
      setQuestions(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleBackToList = () => {
    router.push('/questionnaires');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={handleBackToList}
              className="mt-4 garnet-button garnet-button-secondary"
            >
              Back to Questionnaires
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <MessageSquare className="mr-3 h-7 w-7 text-primary" />
              {title}
            </h1>
            <p className="text-gray-600 mt-1">
              Chat with your questionnaire and get AI-powered assistance
            </p>
          </div>
          
          <button 
            className="garnet-button garnet-button-secondary flex items-center"
            onClick={handleBackToList}
          >
            Back to Questionnaires
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-md flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
          {/* Chat messages */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet. Start the conversation by sending a message below.</p>
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <p className="text-gray-800">{question.text}</p>
                    </div>
                  </div>
                  
                  {question.answer && (
                    <div className="flex items-start gap-3 ml-auto flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-secondary/10 rounded-lg p-3 max-w-[80%]">
                        <p className="text-gray-800">{question.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Input area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                className="garnet-input flex-grow"
                placeholder="Type your message here..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
              />
              <button 
                type="submit"
                className="garnet-button garnet-button-gradient"
                disabled={!userMessage.trim()}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 