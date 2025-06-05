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
  Download
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

interface Questionnaire {
  id: string;
  title: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
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
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to fetch from API
        const response = await fetch(`/api/questionnaires/${params.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setQuestionnaire(data);
          
          // Add welcome message
          setMessages([{
            id: crypto.randomUUID(),
            type: 'assistant',
            content: `Welcome to the ${data.title} chat interface! I can help you review questions, provide additional insights, or assist with completing your questionnaire. How can I help you today?`,
            timestamp: new Date()
          }]);
        } else {
          // Fallback to localStorage data
          const storedQuestionnaires = localStorage.getItem('user_questionnaires');
          
          if (storedQuestionnaires) {
            try {
              const questionnaires = JSON.parse(storedQuestionnaires);
              const foundQuestionnaire = questionnaires.find((q: any) => q.id === params.id);
              
              if (foundQuestionnaire) {
                // Convert localStorage format to our expected format
                const convertedQuestionnaire = convertStoredToQuestionnaireFormat(foundQuestionnaire);
                setQuestionnaire(convertedQuestionnaire);
                
                setMessages([{
                  id: crypto.randomUUID(),
                  type: 'assistant',
                  content: `Welcome to the ${convertedQuestionnaire.title} chat interface! I can help you review questions, provide additional insights, or assist with completing your questionnaire. How can I help you today?`,
                  timestamp: new Date()
                }]);
              } else {
                // Fallback to mock data if questionnaire not found
                const mockQuestionnaire = createMockQuestionnaire(params.id);
                setQuestionnaire(mockQuestionnaire);
                
                setMessages([{
                  id: crypto.randomUUID(),
                  type: 'assistant',
                  content: `Welcome to the ${mockQuestionnaire.title} chat interface! This is a demo version. I can help you review questions and provide assistance. How can I help you today?`,
                  timestamp: new Date()
                }]);
              }
            } catch (parseError) {
              console.error('Error parsing stored questionnaires:', parseError);
              // Fallback to mock data
              const mockQuestionnaire = createMockQuestionnaire(params.id);
              setQuestionnaire(mockQuestionnaire);
              
              setMessages([{
                id: crypto.randomUUID(),
                type: 'assistant',
                content: `Welcome to the ${mockQuestionnaire.title} chat interface! This is a demo version. I can help you review questions and provide assistance. How can I help you today?`,
                timestamp: new Date()
              }]);
            }
          } else {
            // No stored questionnaires, use mock data
            const mockQuestionnaire = createMockQuestionnaire(params.id);
            setQuestionnaire(mockQuestionnaire);
            
            setMessages([{
              id: crypto.randomUUID(),
              type: 'assistant',
              content: `Welcome to the ${mockQuestionnaire.title} chat interface! This is a demo version. I can help you review questions and provide assistance. How can I help you today?`,
              timestamp: new Date()
            }]);
          }
        }
      } catch (err) {
        console.error('Error fetching questionnaire:', err);
        
        // Try localStorage as fallback
        const storedQuestionnaires = localStorage.getItem('user_questionnaires');
        
        if (storedQuestionnaires) {
          try {
            const questionnaires = JSON.parse(storedQuestionnaires);
            const foundQuestionnaire = questionnaires.find((q: any) => q.id === params.id);
            
            if (foundQuestionnaire) {
              const convertedQuestionnaire = convertStoredToQuestionnaireFormat(foundQuestionnaire);
              setQuestionnaire(convertedQuestionnaire);
              
              setMessages([{
                id: crypto.randomUUID(),
                type: 'assistant',
                content: `Welcome to the ${convertedQuestionnaire.title} chat interface! I can help you review questions and provide assistance. How can I help you today?`,
                timestamp: new Date()
              }]);
            } else {
              // Final fallback to mock data
              const mockQuestionnaire = createMockQuestionnaire(params.id);
              setQuestionnaire(mockQuestionnaire);
              
              setMessages([{
                id: crypto.randomUUID(),
                type: 'assistant',
                content: `Welcome to the ${mockQuestionnaire.title} chat interface! This is a demo version. I can help you review questions and provide assistance. How can I help you today?`,
                timestamp: new Date()
              }]);
            }
          } catch (parseError) {
            console.error('Error parsing stored questionnaires in error handler:', parseError);
            // Final fallback to mock data
            const mockQuestionnaire = createMockQuestionnaire(params.id);
            setQuestionnaire(mockQuestionnaire);
            
            setMessages([{
              id: crypto.randomUUID(),
              type: 'assistant',
              content: `Welcome to the ${mockQuestionnaire.title} chat interface! This is a demo version. I can help you review questions and provide assistance. How can I help you today?`,
              timestamp: new Date()
            }]);
          }
        } else {
          // Final fallback to mock data
          const mockQuestionnaire = createMockQuestionnaire(params.id);
          setQuestionnaire(mockQuestionnaire);
          
          setMessages([{
            id: crypto.randomUUID(),
            type: 'assistant',
            content: `Welcome to the ${mockQuestionnaire.title} chat interface! This is a demo version. I can help you review questions and provide assistance. How can I help you today?`,
            timestamp: new Date()
          }]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [params.id]);

  // Convert stored questionnaire format to our expected format
  const convertStoredToQuestionnaireFormat = (storedQuestionnaire: any): Questionnaire => {
    // Convert answers array to questions array
    const questions: Question[] = storedQuestionnaire.answers?.map((answer: any, index: number) => ({
      id: `${storedQuestionnaire.id}_q_${index + 1}`,
      text: answer.question,
      answer: answer.answer || '',
      category: getQuestionCategory(answer.question),
      isRequired: answer.isMandatory || false,
      status: (answer.answer && answer.answer.trim() !== '') ? 'answered' : 'pending'
    })) || [];

    return {
      id: storedQuestionnaire.id,
      title: storedQuestionnaire.name,
      name: storedQuestionnaire.name,
      status: storedQuestionnaire.status || 'Draft',
      progress: storedQuestionnaire.progress || 0,
      dueDate: storedQuestionnaire.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Helper function to categorize questions
  const getQuestionCategory = (questionText: string): string => {
    const lowerQuestion = questionText.toLowerCase();
    
    if (lowerQuestion.includes('security') || lowerQuestion.includes('encrypt') || lowerQuestion.includes('access control')) {
      return 'Security';
    } else if (lowerQuestion.includes('data') || lowerQuestion.includes('privacy') || lowerQuestion.includes('gdpr')) {
      return 'Data Protection';
    } else if (lowerQuestion.includes('compliance') || lowerQuestion.includes('audit') || lowerQuestion.includes('regulation')) {
      return 'Compliance';
    } else if (lowerQuestion.includes('incident') || lowerQuestion.includes('breach') || lowerQuestion.includes('response')) {
      return 'Incident Response';
    } else if (lowerQuestion.includes('training') || lowerQuestion.includes('awareness') || lowerQuestion.includes('education')) {
      return 'Training';
    } else if (lowerQuestion.includes('vendor') || lowerQuestion.includes('third party') || lowerQuestion.includes('supplier')) {
      return 'Vendor Management';
    } else if (lowerQuestion.includes('backup') || lowerQuestion.includes('recovery') || lowerQuestion.includes('continuity')) {
      return 'Business Continuity';
    } else {
      return 'General';
    }
  };

  // Create mock questionnaire data
  const createMockQuestionnaire = (id: string): Questionnaire => {
    const sampleQuestions = [
      {
        id: `${id}_q_1`,
        text: "Does your organization have a written information security policy?",
        answer: "Yes, our organization maintains a comprehensive information security policy that is reviewed annually and approved by senior management.",
        category: "Security Policy",
        isRequired: true,
        status: 'answered' as const
      },
      {
        id: `${id}_q_2`,
        text: "How does your organization handle data breach incidents?",
        answer: "We have a formal incident response plan that includes immediate containment, assessment, notification procedures, and post-incident review.",
        category: "Incident Response",
        isRequired: true,
        status: 'answered' as const
      },
      {
        id: `${id}_q_3`,
        text: "What encryption standards does your organization use for data at rest?",
        answer: "",
        category: "Data Protection",
        isRequired: true,
        status: 'pending' as const
      },
      {
        id: `${id}_q_4`,
        text: "Describe your organization's access control procedures.",
        answer: "We implement role-based access control (RBAC) with regular access reviews and multi-factor authentication for sensitive systems.",
        category: "Access Control",
        isRequired: false,
        status: 'answered' as const
      },
      {
        id: `${id}_q_5`,
        text: "How often does your organization conduct security awareness training?",
        answer: "Security awareness training is conducted quarterly for all employees, with additional specialized training for IT staff.",
        category: "Training",
        isRequired: false,
        status: 'needs_attention' as const
      }
    ];

    return {
      id,
      title: `Security Assessment Questionnaire`,
      name: `Security Assessment #${id.split('_').pop()}`,
      status: 'In Progress',
      progress: 75,
      dueDate: '2024-02-15',
      questions: sampleQuestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setUserMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = generateAIResponse(userMessage, questionnaire);
      setMessages(prev => [...prev, ...responses]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string, questionnaire: Questionnaire | null): ChatMessage[] => {
    const responses: ChatMessage[] = [];
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('question') && lowerInput.includes('help')) {
      const unansweredQuestions = questionnaire?.questions.filter(q => q.status === 'pending') || [];
      if (unansweredQuestions.length > 0) {
        responses.push({
          id: crypto.randomUUID(),
          type: 'assistant',
          content: `I can help you with the ${unansweredQuestions.length} remaining questions. Here's the next question that needs attention:\n\n"${unansweredQuestions[0].text}"\n\nWould you like me to provide guidance on how to answer this question?`,
          timestamp: new Date()
        });
      } else {
        responses.push({
          id: crypto.randomUUID(),
          type: 'assistant',
          content: "Great news! All questions have been answered. Would you like me to review any specific answers or help with finalizing the questionnaire?",
          timestamp: new Date()
        });
      }
    } else if (lowerInput.includes('status') || lowerInput.includes('progress')) {
      const answered = questionnaire?.questions.filter(q => q.status === 'answered').length || 0;
      const total = questionnaire?.questions.length || 0;
      responses.push({
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `Current questionnaire status:\n• Progress: ${questionnaire?.progress}%\n• Answered: ${answered}/${total} questions\n• Due date: ${questionnaire?.dueDate}\n• Status: ${questionnaire?.status}\n\nIs there anything specific you'd like to work on?`,
        timestamp: new Date()
      });
    } else if (lowerInput.includes('review') || lowerInput.includes('check')) {
      responses.push({
        id: crypto.randomUUID(),
        type: 'assistant',
        content: "I can help you review your answers. Would you like me to:\n\n1. Check for incomplete answers\n2. Review answers that need attention\n3. Suggest improvements to existing answers\n4. Export the current responses\n\nWhich would be most helpful?",
        timestamp: new Date()
      });
    } else {
      // Generic helpful response
      responses.push({
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `I understand you're asking about "${userInput}". I can help you with:\n\n• Answering questionnaire questions\n• Reviewing your current progress\n• Providing guidance on compliance requirements\n• Suggesting improvements to your responses\n\nWhat would you like to focus on?`,
        timestamp: new Date()
      });
    }

    return responses;
  };

  const handleQuestionClick = (question: Question, index: number) => {
    setSelectedQuestionIndex(index);
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: `Let's work on this question:\n\n"${question.text}"\n\n${question.answer ? 'Current answer: ' + question.answer : 'This question hasn\'t been answered yet.'}\n\nWould you like me to help improve this answer or provide guidance?`,
      timestamp: new Date(),
      questionId: question.id
    };
    setMessages(prev => [...prev, message]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleBackToList = () => {
    router.push('/questionnaires');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'needs_attention':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
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
              className="mt-4 garnet-button garnet-button-secondary"
            >
              Back to Questionnaires
            </button>
          </div>
        </main>
      </div>
    );
  }

  const answeredCount = questionnaire.questions.filter(q => q.status === 'answered').length;
  const totalCount = questionnaire.questions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center mb-2">
              <button
                onClick={handleBackToList}
                className="flex items-center text-primary hover:text-primary/80 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <MessageSquare className="mr-3 h-7 w-7 text-primary" />
                {questionnaire.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                {answeredCount}/{totalCount} answered
              </span>
              <span>Due: {questionnaire.dueDate}</span>
              <span className="flex items-center">
                Progress: {questionnaire.progress}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(JSON.stringify(questionnaire, null, 2))}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Copy className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 h-[600px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Questions ({answeredCount}/{totalCount})
              </h3>
              
              <div className="flex-grow overflow-y-auto space-y-2 scrollbar-thin">
                {questionnaire.questions.map((question, index) => (
                  <div
                    key={question.id}
                    onClick={() => handleQuestionClick(question, index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm animate-fade-in ${
                      selectedQuestionIndex === index
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Q{index + 1}</span>
                      {getStatusIcon(question.status || 'pending')}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {question.text}
                    </p>
                    {question.category && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {question.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-xl">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-secondary" />
                  AI Assistant
                </h3>
                <p className="text-sm text-gray-600">Ask questions or get help with your questionnaire</p>
              </div>

              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 chat-messages scrollbar-thin">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 message-enter ${
                      message.type === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-white' 
                        : 'bg-gradient-to-br from-secondary to-secondary/80 text-white'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 max-w-[80%] shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-white'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 border border-gray-200 shadow-sm">
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
              <div className="p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-xl">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask a question or request help..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus-ring"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!userMessage.trim() || isTyping}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all shadow-sm hover:shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Help with questions', 'Check progress', 'Review answers', 'Export responses'].map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onClick={() => setUserMessage(suggestion)}
                      className="text-xs px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm animate-fade-in"
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