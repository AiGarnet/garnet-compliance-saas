"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  User, 
  Bot, 
  ArrowLeft, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Copy,
  Download,
  Edit,
  Save,
  X,
  Check
} from 'lucide-react';
import Header from '@/components/Header';

interface Question {
  id: string;
  text: string;
  answer?: string;
  category?: string;
  isRequired?: boolean;
  status?: 'answered' | 'pending' | 'needs_attention';
}

interface QuestionAnswer {
  question: string;
  answer: string;
  isMandatory: boolean;
  needsAttention?: boolean;
}

interface Questionnaire {
  id: string;
  title: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string;
  questions?: Question[];
  answers?: QuestionAnswer[];
  createdAt: string;
  updatedAt?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  questionId?: string;
}

export function ChatClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAnswer]);

  // Generate AI answer for the question
  const generateAIAnswer = async (question: string): Promise<string> => {
    try {
      // Try to connect to the backend first
      const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return data.answer || "I couldn't generate a specific answer for this question.";
      } else {
        throw new Error('Backend request failed');
      }
    } catch (error) {
      console.error('Error generating AI answer:', error);
      
      // Fallback to a basic response
      return generateFallbackAnswer(question);
    }
  };

  // Generate a fallback answer when AI is not available
  const generateFallbackAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('security') || lowerQuestion.includes('encrypt')) {
      return "Our organization implements comprehensive security measures including data encryption, access controls, and regular security audits to protect sensitive information.";
    } else if (lowerQuestion.includes('compliance') || lowerQuestion.includes('gdpr')) {
      return "We maintain strict compliance with relevant regulations including GDPR, implementing appropriate data protection measures and procedures.";
    } else if (lowerQuestion.includes('data') && lowerQuestion.includes('process')) {
      return "Our data processing activities are conducted in accordance with established policies, ensuring proper handling, storage, and protection of all data.";
    } else if (lowerQuestion.includes('access') || lowerQuestion.includes('control')) {
      return "We implement role-based access controls with regular reviews to ensure appropriate access levels are maintained across our systems.";
    } else if (lowerQuestion.includes('backup') || lowerQuestion.includes('recovery')) {
      return "Our organization maintains comprehensive backup and disaster recovery procedures to ensure business continuity and data protection.";
    } else {
      return "This question requires careful consideration of our organizational policies and procedures. Please consult with the relevant department for specific details.";
    }
  };

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get questionnaire from localStorage
        const storedQuestionnaires = localStorage.getItem('user_questionnaires');
        
        if (storedQuestionnaires) {
          const questionnaires = JSON.parse(storedQuestionnaires);
          const foundQuestionnaire = questionnaires.find((q: any) => q.id === params.id);
          
          if (foundQuestionnaire) {
            setQuestionnaire(foundQuestionnaire);
            
            // Check if this is a new questionnaire without an answer
            if (foundQuestionnaire.answers && foundQuestionnaire.answers.length > 0) {
              const firstAnswer = foundQuestionnaire.answers[0];
              
              if (!firstAnswer.answer || firstAnswer.answer.trim() === '') {
                // This is a new question, generate AI answer immediately
                setMessages([{
                  id: crypto.randomUUID(),
                  type: 'assistant',
                  content: `I'll generate an AI answer for your question: "${firstAnswer.question}"`,
                  timestamp: new Date()
                }]);
                
                setIsGeneratingAnswer(true);
                
                try {
                  const aiAnswer = await generateAIAnswer(firstAnswer.question);
                  setCurrentAnswer(aiAnswer);
                  
                  // Update the questionnaire with the answer
                  const updatedQuestionnaire = {
                    ...foundQuestionnaire,
                    answers: foundQuestionnaire.answers.map((qa: any, index: number) => 
                      index === 0 ? { ...qa, answer: aiAnswer } : qa
                    ),
                    progress: 100, // Since we only have one question
                    status: 'Completed'
                  };
                  
                  setQuestionnaire(updatedQuestionnaire);
                  
                  // Save back to localStorage
                  const updatedQuestionnaires = questionnaires.map((q: any) => 
                    q.id === params.id ? updatedQuestionnaire : q
                  );
                  localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
                  
                  setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    type: 'assistant',
                    content: `Here's your AI-generated answer:\n\n${aiAnswer}\n\nYou can now edit this answer, retry for a different response, or save it to your questionnaire.`,
                    timestamp: new Date()
                  }]);
                  
                } catch (error) {
                  console.error('Error generating initial answer:', error);
                  setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    type: 'assistant',
                    content: "I encountered an issue generating the answer. Please try clicking 'Retry' to get a new response.",
                    timestamp: new Date()
                  }]);
                } finally {
                  setIsGeneratingAnswer(false);
                }
              } else {
                // Question already has an answer
                setCurrentAnswer(firstAnswer.answer);
                setMessages([{
                  id: crypto.randomUUID(),
                  type: 'assistant',
                  content: `Welcome back! Here's your question and current answer:\n\n**Question:** ${firstAnswer.question}\n\n**Answer:** ${firstAnswer.answer}\n\nYou can edit the answer, retry for a new response, or save any changes.`,
                  timestamp: new Date()
                }]);
              }
            }
          } else {
            setError('Questionnaire not found');
          }
        } else {
          setError('No questionnaires found');
        }
      } catch (err) {
        console.error('Error fetching questionnaire:', err);
        setError('Failed to load questionnaire');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [params.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || isTyping) return;

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsTyping(true);

    // Simple AI responses
    setTimeout(() => {
      const responses = [
        "I understand your question. Let me help you with that.",
        "That's a great question! Based on the context of your questionnaire, here's what I suggest:",
        "I can help you improve this answer. Consider adding more specific details.",
        "For compliance questionnaires, it's important to be thorough and specific in your responses."
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiResponse: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleRetryAnswer = async () => {
    if (!questionnaire?.answers?.[0]) return;

    setIsGeneratingAnswer(true);
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: "Generating a new answer for your question...",
      timestamp: new Date()
    }]);

    try {
      const newAnswer = await generateAIAnswer(questionnaire.answers[0].question);
      setCurrentAnswer(newAnswer);
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `Here's a new AI-generated answer:\n\n${newAnswer}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: "Sorry, I couldn't generate a new answer. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleEditAnswer = () => {
    setEditingAnswer(true);
    setEditedAnswer(currentAnswer);
  };

  const handleSaveEdit = () => {
    setCurrentAnswer(editedAnswer);
    setEditingAnswer(false);
    
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: "Your answer has been updated successfully!",
      timestamp: new Date()
    }]);
  };

  const handleCancelEdit = () => {
    setEditingAnswer(false);
    setEditedAnswer('');
  };

  const handleSaveAnswer = () => {
    if (!questionnaire) return;

    try {
      // Update questionnaire with the current answer
      const updatedQuestionnaire = {
        ...questionnaire,
        answers: questionnaire.answers?.map((qa, index) => 
          index === 0 ? { ...qa, answer: currentAnswer } : qa
        ) || [],
        progress: 100,
        status: 'Completed',
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage
      const storedQuestionnaires = localStorage.getItem('user_questionnaires');
      if (storedQuestionnaires) {
        const questionnaires = JSON.parse(storedQuestionnaires);
        const updatedQuestionnaires = questionnaires.map((q: any) => 
          q.id === params.id ? updatedQuestionnaire : q
        );
        localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
        
        setQuestionnaire(updatedQuestionnaire);
        
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: "Your answer has been saved successfully! You can now return to the questionnaires list to see your completed questionnaire.",
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: "There was an error saving your answer. Please try again.",
        timestamp: new Date()
      }]);
    }
  };

  const handleBackToList = () => {
    router.push('/questionnaires');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: "Answer copied to clipboard!",
        timestamp: new Date()
      }]);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <span className="text-lg text-gray-600">Loading questionnaire...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700">{error || 'Questionnaire not found'}</p>
            <button
              onClick={handleBackToList}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Questionnaires
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questionnaire.answers?.[0]?.question || 'No question found';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center text-primary hover:text-primary/80 mr-4 px-3 py-2 rounded-lg hover:bg-primary/5 transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Questions
            </button>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="mr-3 h-8 w-8 text-primary" />
                AI Question Assistant
              </h1>
              <p className="text-gray-600 mt-1">Get AI-powered answers and refine them to perfection</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Your Question
              </h3>
              
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 mb-6">
                <p className="text-gray-800 leading-relaxed">{currentQuestion}</p>
              </div>

              {/* Current Answer Display */}
              {currentAnswer && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-secondary" />
                    AI Answer
                  </h4>
                  
                  {editingAnswer ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedAnswer}
                        onChange={(e) => setEditedAnswer(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        rows={8}
                        placeholder="Edit your answer..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{currentAnswer}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {currentAnswer && !editingAnswer && (
                  <>
                    <button
                      onClick={handleEditAnswer}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Answer
                    </button>
                    
                    <button
                      onClick={handleRetryAnswer}
                      disabled={isGeneratingAnswer}
                      className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingAnswer ? 'animate-spin' : ''}`} />
                      {isGeneratingAnswer ? 'Generating...' : 'Retry Answer'}
                    </button>
                    
                    <button
                      onClick={handleSaveAnswer}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save & Complete
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(currentAnswer)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Answer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg h-[700px] flex flex-col border border-gray-100">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-2xl">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Bot className="h-6 w-6 mr-3 text-secondary" />
                  AI Assistant Chat
                </h3>
                <p className="text-gray-600 mt-1">Ask questions, get help, or discuss your answer</p>
              </div>

              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin">
                {isGeneratingAnswer && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                      <span className="text-gray-600">Generating AI answer...</span>
                    </div>
                  </div>
                )}
                
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 animate-fade-in ${
                      message.type === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-white' 
                        : 'bg-gradient-to-br from-secondary to-secondary/80 text-white'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className={`rounded-2xl p-4 max-w-[80%] shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-white'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <div className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start gap-3 animate-slide-up">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask a question or request help..."
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!userMessage.trim() || isTyping}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    'How can I improve this answer?',
                    'Is this answer complete?',
                    'What else should I include?',
                    'Help me make it more specific'
                  ].map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onClick={() => setUserMessage(suggestion)}
                      className="text-sm px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 