"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Shield,
  Target,
  TrendingUp,
  Award,
  Lightbulb,
  BookOpen,
  Zap,
  ChevronRight,
  Star,
  Timer,
  BarChart3,
  Clipboard
} from 'lucide-react';
import Header from '@/components/Header';

interface QuestionAnswer {
  question: string;
  answer: string;
  isLoading?: boolean;
  isMandatory: boolean;
  needsAttention?: boolean;
  category?: string;
}

interface Questionnaire {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string;
  answers: QuestionAnswer[];
  createdAt: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  questionIndex?: number;
  isEditing?: boolean;
  category?: string;
  suggestions?: string[];
}

const QUESTION_CATEGORIES = {
  'Security Policy': { icon: Shield, color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
  'Data Protection': { icon: Shield, color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-700' },
  'Access Control': { icon: Target, color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-700' },
  'Compliance': { icon: Award, color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
  'Business Continuity': { icon: TrendingUp, color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700' },
  'Training': { icon: BookOpen, color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  'Default': { icon: FileText, color: 'bg-gray-500', lightColor: 'bg-gray-50', textColor: 'text-gray-700' }
};

const SMART_SUGGESTIONS = {
  'security': [
    "We implement industry-standard security measures including...",
    "Our security framework follows ISO 27001 guidelines...",
    "We conduct regular security audits and assessments...",
    "Our incident response plan includes immediate containment..."
  ],
  'data': [
    "We ensure data protection through encryption at rest and in transit...",
    "Our data retention policy complies with GDPR requirements...",
    "We implement data minimization principles...",
    "Access to personal data is restricted based on need-to-know..."
  ],
  'access': [
    "We implement role-based access control (RBAC)...",
    "Multi-factor authentication is required for all administrative access...",
    "We conduct quarterly access reviews...",
    "Privileged accounts are monitored continuously..."
  ],
  'compliance': [
    "We maintain compliance with SOC 2 Type II, GDPR, and ISO 27001...",
    "Our compliance program includes regular internal audits...",
    "We have a dedicated compliance officer who oversees...",
    "Documentation is maintained for all compliance activities..."
  ],
  'backup': [
    "We maintain automated daily backups with offsite storage...",
    "Our RTO is 4 hours and RPO is 1 hour for critical systems...",
    "Backup testing is performed quarterly...",
    "We have documented disaster recovery procedures..."
  ]
};

export function ChatClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editedQuestionText, setEditedQuestionText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to detect question category
  const detectQuestionCategory = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('security') || q.includes('encrypt') || q.includes('incident')) return 'Security Policy';
    if (q.includes('data') || q.includes('privacy') || q.includes('gdpr')) return 'Data Protection';
    if (q.includes('access') || q.includes('authentication') || q.includes('authorization')) return 'Access Control';
    if (q.includes('compliance') || q.includes('audit') || q.includes('regulation')) return 'Compliance';
    if (q.includes('backup') || q.includes('recovery') || q.includes('disaster')) return 'Business Continuity';
    if (q.includes('training') || q.includes('awareness') || q.includes('education')) return 'Training';
    return 'Default';
  };

  // Function to get smart suggestions based on question content
  const getSmartSuggestions = (question: string): string[] => {
    const q = question.toLowerCase();
    if (q.includes('security') || q.includes('encrypt')) return SMART_SUGGESTIONS.security;
    if (q.includes('data') || q.includes('privacy')) return SMART_SUGGESTIONS.data;
    if (q.includes('access') || q.includes('authentication')) return SMART_SUGGESTIONS.access;
    if (q.includes('compliance') || q.includes('audit')) return SMART_SUGGESTIONS.compliance;
    if (q.includes('backup') || q.includes('recovery')) return SMART_SUGGESTIONS.backup;
    return [];
  };

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

  // Load questionnaire and create initial chat messages
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        // First, try to load from backend API
        console.log('🔍 Loading questionnaire from backend API:', params.id);
        
        try {
          const backendResponse = await fetch(`/api/questionnaires/${params.id}`);
          
          if (backendResponse.ok) {
            const backendQuestionnaire = await backendResponse.json();
            console.log('✅ Loaded from backend:', backendQuestionnaire);
            
            // Transform backend format to frontend format
            const transformedQuestionnaire = {
              id: backendQuestionnaire.id,
              name: backendQuestionnaire.title,
              status: backendQuestionnaire.status,
              progress: backendQuestionnaire.progress,
              dueDate: new Date().toLocaleDateString(),
              createdAt: backendQuestionnaire.createdAt,
              answers: backendQuestionnaire.questions?.map((q: any) => ({
                question: q.questionText,
                answer: q.answer || '',
                isLoading: false,
                isMandatory: q.isRequired,
                needsAttention: !q.answer,
                category: detectQuestionCategory(q.questionText)
              })) || []
            };
            
            setQuestionnaire(transformedQuestionnaire);
            setupChatMessages(transformedQuestionnaire);
            setLoading(false);
            return;
          }
        } catch (backendError) {
          console.warn('⚠️ Backend API failed, falling back to localStorage:', backendError);
        }
        
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          console.log('🔍 Loading questionnaire from localStorage:', params.id);
          
          const storedQuestionnaires = localStorage.getItem('user_questionnaires');
          if (storedQuestionnaires) {
            const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
            const found = parsedQuestionnaires.find((q: any) => q.id === params.id);
            
            if (found) {
              console.log('✅ Loaded from localStorage:', found);
              setQuestionnaire(found);
              setupChatMessages(found);
              setLoading(false);
              return;
            }
          }
        }
        
        // If not found anywhere
        console.error('❌ Questionnaire not found:', params.id);
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error loading questionnaire:', error);
        setLoading(false);
      }
    };

    const setupChatMessages = (questionnaire: any) => {
      // Create initial chat messages from questions
      const initialMessages: Message[] = [];
      
      // Welcome message with progress overview
      const answeredCount = questionnaire.answers?.filter((qa: QuestionAnswer) => qa.answer && qa.answer.trim() !== '').length || 0;
      const totalCount = questionnaire.answers?.length || 0;
      
      initialMessages.push({
        id: 'welcome',
        type: 'system',
        content: `Welcome to your compliance questionnaire! 📋\n\n**${questionnaire.name}**\n\nProgress: ${answeredCount}/${totalCount} questions completed (${questionnaire.progress}%)\nDue: ${new Date(questionnaire.dueDate).toLocaleDateString()}\n\nI'm here to help you complete your compliance requirements efficiently. You can edit questions, get AI-generated answers, and use smart suggestions below.`,
        timestamp: new Date(),
        suggestions: [
          'Generate AI answers for all questions',
          'Show me compliance best practices',
          'Help me understand what\'s required',
          'Review my completed answers'
        ]
      });

      // Add each question as a user message with answer as assistant message
      questionnaire.answers?.forEach((qa: QuestionAnswer, index: number) => {
        const category = detectQuestionCategory(qa.question);
        const suggestions = getSmartSuggestions(qa.question);
        
        // Question bubble (user style)
        initialMessages.push({
          id: `question-${index}`,
          type: 'user',
          content: qa.question,
          timestamp: new Date(Date.now() + index * 1000),
          questionIndex: index,
          category,
          suggestions: suggestions.slice(0, 3)
        });

        // Answer bubble (assistant style) - only if answer exists
        if (qa.answer && qa.answer.trim() !== '') {
          initialMessages.push({
            id: `answer-${index}`,
            type: 'assistant',
            content: qa.answer,
            timestamp: new Date(Date.now() + index * 1000 + 500),
            questionIndex: index,
            category
          });
        } else {
          // Show placeholder for unanswered questions
          initialMessages.push({
            id: `placeholder-${index}`,
            type: 'assistant',
            content: `⏳ **Answer needed for this ${category} question**\n\nClick "Generate AI Answer" below or use the smart suggestions to get started.`,
            timestamp: new Date(Date.now() + index * 1000 + 500),
            questionIndex: index,
            category,
            suggestions: suggestions.slice(0, 2)
          });
        }
      });

      setMessages(initialMessages);
    };

    if (params.id) {
      loadQuestionnaire();
    }
  }, [params.id, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEditQuestion = (questionIndex: number) => {
    setEditingQuestion(questionIndex);
    setEditedQuestionText(questionnaire?.answers[questionIndex]?.question || '');
  };

  const handleSaveQuestion = async () => {
    if (editingQuestion === null || !questionnaire) return;

    try {
      // Call backend API first
      const response = await fetch(`/api/questionnaires/${params.id}/questions/${editingQuestion}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: editedQuestionText
        }),
      });

      let updatedQuestionnaire;
      
      if (response.ok) {
        // Backend update successful
        updatedQuestionnaire = await response.json();
      } else {
        // Backend failed, update locally
        console.warn('Backend update failed, updating locally');
        updatedQuestionnaire = {
          ...questionnaire,
          answers: questionnaire.answers.map((qa, index) => 
            index === editingQuestion 
              ? { ...qa, question: editedQuestionText }
              : qa
          )
        };
      }

      // Update localStorage (for offline access)
      const storedQuestionnaires = localStorage.getItem('user_questionnaires');
      if (storedQuestionnaires) {
        const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
        const updatedQuestionnaires = parsedQuestionnaires.map((q: any) => 
          q.id === params.id ? {
            ...q,
            answers: q.answers.map((qa: any, index: number) => 
              index === editingQuestion 
                ? { ...qa, question: editedQuestionText }
                : qa
            )
          } : q
        );
        localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
      }

      // Update messages
      setMessages(prev => prev.map(msg => 
        msg.questionIndex === editingQuestion && msg.type === 'user'
          ? { ...msg, content: editedQuestionText, category: detectQuestionCategory(editedQuestionText) }
          : msg
      ));

      setQuestionnaire(updatedQuestionnaire);
      setEditingQuestion(null);

      // Add confirmation message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `✅ **Question updated successfully!**\n\nThe new question is: "${editedQuestionText}"\n\nWould you like me to generate a new AI answer for this updated question?`,
        timestamp: new Date(),
        suggestions: ['Generate AI answer', 'I\'ll write my own answer', 'Show examples']
      }]);

    } catch (error) {
      console.error('Error saving question:', error);
      
      // Fallback to localStorage only
      try {
        const updatedQuestionnaire = {
          ...questionnaire,
          answers: questionnaire.answers.map((qa, index) => 
            index === editingQuestion 
              ? { ...qa, question: editedQuestionText }
              : qa
          )
        };

        // Update localStorage
        const storedQuestionnaires = localStorage.getItem('user_questionnaires');
        if (storedQuestionnaires) {
          const parsedQuestionnaires = JSON.parse(storedQuestionnaires);
          const updatedQuestionnaires = parsedQuestionnaires.map((q: any) => 
            q.id === params.id ? {
              ...q,
              answers: q.answers.map((qa: any, index: number) => 
                index === editingQuestion 
                  ? { ...qa, question: editedQuestionText }
                  : qa
              )
            } : q
          );
          localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
        }

        // Update messages
        setMessages(prev => prev.map(msg => 
          msg.questionIndex === editingQuestion && msg.type === 'user'
            ? { ...msg, content: editedQuestionText }
            : msg
        ));

        setQuestionnaire(updatedQuestionnaire);
        setEditingQuestion(null);

        // Add confirmation message
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: `✅ **Question updated successfully!** (saved locally)\n\nThe new question is: "${editedQuestionText}"`,
          timestamp: new Date()
        }]);
      } catch (fallbackError) {
        console.error('Fallback save failed:', fallbackError);
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: '❌ **Error saving question**\n\nSorry, there was an error saving your question. Please try again.',
          timestamp: new Date()
        }]);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedQuestionText('');
  };

  const handleGenerateAnswer = async (questionIndex: number) => {
    if (!questionnaire) return;
    
    const question = questionnaire.answers[questionIndex].question;
    
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: `🤖 **Generating AI answer for your ${detectQuestionCategory(question)} question...**\n\nThis may take a few moments while I analyze best practices and generate a comprehensive response.`,
      timestamp: new Date()
    }]);

    try {
      const answer = await generateAIAnswer(question);
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `✨ **AI-Generated Answer:**\n\n${answer}\n\n*You can edit this answer or regenerate a new one if needed.*`,
        timestamp: new Date(),
        questionIndex,
        suggestions: ['Edit this answer', 'Regenerate answer', 'Accept and continue']
      }]);
      
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `❌ **Error generating answer**\n\nI couldn't generate an answer for this question. Please try again or write your own response.`,
        timestamp: new Date(),
        suggestions: ['Try again', 'I\'ll write my own', 'Show examples']
      }]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    // Add user message
    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsTyping(true);

    // Simulate AI response with context-aware help
    setTimeout(() => {
      let aiResponse = '';
      let suggestions: string[] = [];
      
      const msg = userMessage.toLowerCase();
      
      if (msg.includes('help') || msg.includes('how')) {
        aiResponse = `🎯 **I'm here to help!**\n\nI can assist you with:\n• Generating AI answers for compliance questions\n• Providing industry best practices\n• Suggesting improvements to your responses\n• Explaining compliance requirements\n\nWhat specific help do you need?`;
        suggestions = ['Generate all answers', 'Review my responses', 'Explain requirements', 'Show examples'];
      } else if (msg.includes('progress') || msg.includes('status')) {
        const answered = questionnaire?.answers.filter(qa => qa.answer && qa.answer.trim() !== '').length || 0;
        const total = questionnaire?.answers.length || 0;
        aiResponse = `📊 **Current Progress:**\n\n✅ Completed: ${answered}/${total} questions\n📈 Progress: ${questionnaire?.progress}%\n📅 Due: ${questionnaire?.dueDate}\n🎯 Status: ${questionnaire?.status}\n\n${answered === total ? '🎉 Congratulations! You\'ve completed all questions!' : `💪 Keep going! ${total - answered} questions remaining.`}`;
        suggestions = answered === total ? ['Download report', 'Review answers'] : ['Generate remaining answers', 'Continue with next question'];
      } else if (msg.includes('best practice') || msg.includes('example')) {
        aiResponse = `💡 **Compliance Best Practices:**\n\n🔒 **Security:** Always mention specific frameworks (ISO 27001, SOC 2)\n📋 **Documentation:** Reference policies and procedures\n🔍 **Evidence:** Include audit trails and monitoring\n📊 **Metrics:** Provide specific timelines and SLAs\n\n*Would you like examples for a specific question type?*`;
        suggestions = ['Show security examples', 'Data protection examples', 'Access control examples'];
      } else {
        aiResponse = `🤖 **I understand!**\n\n"${userMessage}"\n\nI'm processing your request. How can I help you with your compliance questionnaire?`;
        suggestions = ['Generate AI answer', 'Show best practices', 'Review progress', 'Get help'];
      }
      
      const aiResponseMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        suggestions
      };
      
      setMessages(prev => [...prev, aiResponseMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string, questionIndex?: number) => {
    if (suggestion.includes('Generate AI answer') && typeof questionIndex === 'number') {
      handleGenerateAnswer(questionIndex);
    } else {
      setUserMessage(suggestion);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: '📋 **Copied to clipboard!**\n\nThe content has been copied and is ready to paste.',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getCategoryInfo = (category: string) => {
    return QUESTION_CATEGORIES[category as keyof typeof QUESTION_CATEGORIES] || QUESTION_CATEGORIES.Default;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Compliance Questionnaire</h3>
              <p className="text-gray-600">Please wait while we load your questionnaire...</p>
              <div className="mt-4 text-sm text-gray-500">
                ID: {params.id}
              </div>
            </div>
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
            <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4">Questionnaire Not Found</h2>
            <div className="text-center max-w-md">
              <p className="text-gray-600 mb-4">
                We couldn't find a questionnaire with ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{params.id}</code>
              </p>
              <p className="text-gray-600 mb-6">
                This could happen if the questionnaire was recently created or if the link is incorrect.
                You'll be redirected to the questionnaires list shortly.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/questionnaires')}
                className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View All Questionnaires
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const answeredCount = questionnaire.answers.filter(qa => qa.answer && qa.answer.trim() !== '').length;
  const totalCount = questionnaire.answers.length;
  const progressPercentage = (answeredCount / totalCount) * 100;

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/questionnaires')}
            className="flex items-center text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Questionnaires
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Progress Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Progress</h3>
                    <p className="text-sm text-gray-600">{answeredCount}/{totalCount} complete</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium text-gray-800">{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      questionnaire.status === 'Completed' ? 'text-green-600' : 
                      questionnaire.status === 'In Progress' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {questionnaire.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due:</span>
                    <span className="font-medium text-gray-800">
                      {new Date(questionnaire.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                    <Sparkles className="h-4 w-4 inline mr-2 text-purple-500" />
                    Generate All Answers
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                    <Download className="h-4 w-4 inline mr-2 text-blue-500" />
                    Export Progress
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                    <Clipboard className="h-4 w-4 inline mr-2 text-green-500" />
                    Copy All Answers
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {Object.entries(QUESTION_CATEGORIES).slice(0, -1).map(([category, info]) => {
                    const CategoryIcon = info.icon;
                    const count = questionnaire.answers.filter(qa => detectQuestionCategory(qa.question) === category).length;
                    if (count === 0) return null;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeCategory === category ? info.lightColor : 'hover:bg-gray-50'
                        }`}
                      >
                        <CategoryIcon className={`h-4 w-4 inline mr-2 ${info.textColor}`} />
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            {/* Chat Header */}
            <div className="bg-white rounded-t-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <MessageSquare className="h-7 w-7 mr-3 text-primary" />
                    {questionnaire.name}
                  </h1>
                  <p className="text-gray-600 mt-1">Compliance Assistant - AI-Powered Question Completion</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    <Timer className="h-4 w-4 inline mr-1" />
                    Due {new Date(questionnaire.dueDate).toLocaleDateString()}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {Math.round(progressPercentage)}% Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Container */}
            <div className="bg-white shadow-lg border-x border-gray-200 overflow-hidden">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
                {messages
                  .filter(msg => !activeCategory || msg.category === activeCategory || msg.type === 'system')
                  .map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl ${
                      message.type === 'user' ? 'ml-12' : message.type === 'system' ? 'mx-4' : 'mr-12'
                    }`}>
                      {/* Message Bubble */}
                      <div className={`px-6 py-4 rounded-2xl shadow-sm border ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-white border-primary/20'
                          : message.type === 'system'
                          ? 'bg-gradient-to-br from-indigo-50 to-purple-50 text-gray-800 border-indigo-200'
                          : 'bg-white text-gray-800 border-gray-200'
                      }`}>
                        {/* Category Badge */}
                        {message.category && message.category !== 'Default' && (
                          <div className="mb-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              getCategoryInfo(message.category).lightColor
                            } ${getCategoryInfo(message.category).textColor}`}>
                              {React.createElement(getCategoryInfo(message.category).icon, { className: 'h-3 w-3 mr-1' })}
                              {message.category}
                            </span>
                          </div>
                        )}

                        {/* Edit Mode for Questions */}
                        {message.type === 'user' && editingQuestion === message.questionIndex ? (
                          <div className="space-y-3">
                            <textarea
                              value={editedQuestionText}
                              onChange={(e) => setEditedQuestionText(e.target.value)}
                              className="w-full p-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                              rows={3}
                              placeholder="Edit your question..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveQuestion}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save Changes
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Message Content */}
                            <div className="prose max-w-none">
                              {message.content.split('\n').map((line, index) => (
                                <p key={index} className={`mb-2 last:mb-0 ${
                                  message.type === 'user' ? 'text-white' : 'text-gray-800'
                                } ${line.startsWith('**') && line.endsWith('**') ? 'font-semibold' : ''}`}>
                                  {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                                </p>
                              ))}
                            </div>

                            {/* Message Footer */}
                            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${
                              message.type === 'user' ? 'border-white/20' : 'border-gray-200'
                            }`}>
                              <div className={`text-xs ${
                                message.type === 'user' ? 'text-white/80' : 'text-gray-500'
                              }`}>
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                {message.type === 'user' && typeof message.questionIndex === 'number' && (
                                  <button
                                    onClick={() => handleEditQuestion(message.questionIndex!)}
                                    className={`flex items-center text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 ${
                                      message.type === 'user' ? 'text-white/90' : 'text-gray-600'
                                    }`}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </button>
                                )}
                                
                                {message.type === 'assistant' && typeof message.questionIndex === 'number' && (
                                  <button
                                    onClick={() => handleGenerateAnswer(message.questionIndex!)}
                                    className="flex items-center text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Generate AI Answer
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => copyToClipboard(message.content)}
                                  className={`flex items-center text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 ${
                                    message.type === 'user' ? 'text-white/90' : 'text-gray-600'
                                  }`}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Smart Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && showSuggestions && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion, message.questionIndex)}
                              className="text-xs px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                            >
                              <Lightbulb className="h-3 w-3 inline mr-1" />
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mr-12">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-sm text-gray-600 ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <form onSubmit={handleSendMessage} className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask about compliance requirements, request help, or give instructions..."
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
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
                
                {/* Quick Suggestions */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Show my progress',
                      'Generate missing answers',
                      'Explain compliance requirements',
                      'Review completed responses'
                    ].map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => setUserMessage(suggestion)}
                        className="text-sm px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showSuggestions ? 'Hide' : 'Show'} suggestions
                  </button>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-b-xl shadow-lg p-4 border border-gray-200 border-t-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    {answeredCount} completed
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-orange-500 mr-1" />
                    {totalCount - answeredCount} remaining
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    AI-powered assistance
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  💡 Tip: Use smart suggestions to speed up completion
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 