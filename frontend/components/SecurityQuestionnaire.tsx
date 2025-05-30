import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuestionnaireAnswer, Vendor, VendorStatus } from '@/lib/types/vendor.types';
import { v4 as uuidv4 } from 'uuid';

interface SaveQuestionnaireProps {
  vendorId?: string;
  vendorName?: string;
  answers: QuestionnaireAnswer[];
}

export function SecurityQuestionnaire() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [currentQA, setCurrentQA] = useState<QuestionnaireAnswer[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [savedMessage, setSavedMessage] = useState<string>('');

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || 'https://garnet-compliance-saas-production.up.railway.app';
      console.log("Checking server status at:", chatbotUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for status check
      
      const response = await fetch(`${chatbotUrl}/status`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus('online');
        console.log("Server is online");
      } else {
        setServerStatus('offline');
        console.log("Server responded with error:", response.status);
      }
    } catch (err) {
      console.error("Server status check failed:", err);
      setServerStatus('offline');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a security question');
      return;
    }

    setLoading(true);
    setError('');
    setMetadata(null);
    setSavedMessage('');
    
    // Try the main endpoint first
    const success = await tryMainEndpoint();
    
    // If main endpoint fails, try the fallback
    if (!success && serverStatus === 'offline') {
      await tryFallbackEndpoint();
    }
    
    setLoading(false);
  };
  
  const tryMainEndpoint = async (): Promise<boolean> => {
    try {
      // Use the Railway backend URL with a fallback
      const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || 'https://garnet-compliance-saas-production.up.railway.app';
      console.log("Using chatbot URL:", chatbotUrl);
      
      // Create AbortController to handle timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduce timeout to 15 seconds for faster fallback
      
      const response = await fetch(`${chatbotUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
        mode: 'cors',
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `Server responded with ${response.status}`;
        } catch (e) {
          errorMessage = `Server responded with ${response.status}: ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAnswer(data.answer || 'No answer received');
      setMetadata(data.metadata);
      
      // Add the Q&A to the current session
      const newQA: QuestionnaireAnswer = {
        questionId: uuidv4(),
        question: question,
        answer: data.answer || 'No answer received'
      };
      
      setCurrentQA(prev => [...prev, newQA]);
      return true;
    } catch (err: any) {
      console.error("Error in main chatbot request:", err);
      if (err.name === 'AbortError') {
        setError('Request timed out. The server might be busy or offline.');
      } else if (err.message.includes('404')) {
        setError('The chatbot API endpoint (/ask) was not found. The server may be misconfigured or not fully deployed.');
      } else {
        setError(err.message || 'Failed to get answer from the chatbot server');
      }
      
      return false;
    }
  };
  
  const tryFallbackEndpoint = async (): Promise<boolean> => {
    try {
      console.log("Trying fallback endpoint");
      
      // Use the local fallback endpoint
      const response = await fetch(`/ask-fallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`Fallback server responded with ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data.answer || 'No answer received from fallback');
      setMetadata(data.metadata);
      setError(''); // Clear any previous errors since fallback succeeded
      
      // Add the Q&A to the current session
      const newQA: QuestionnaireAnswer = {
        questionId: uuidv4(),
        question: question,
        answer: data.answer || 'No answer received from fallback'
      };
      
      setCurrentQA(prev => [...prev, newQA]);
      return true;
    } catch (err: any) {
      console.error("Error in fallback request:", err);
      setError(prev => `${prev} Fallback also failed: ${err.message}`);
      return false;
    }
  };

  // Save the current Q&A session to a vendor
  const saveToVendor = () => {
    if (currentQA.length === 0) {
      setError('No questions and answers to save');
      return;
    }

    try {
      // Access the functions exported by the vendors page
      const vendorFunctions = (window as any).vendorQuestionnaireFunctions;
      
      if (!vendorFunctions) {
        setError('Vendor functions not available. Please navigate to the vendors page first.');
        return;
      }

      if (vendorId) {
        // Save to existing vendor
        vendorFunctions.saveQuestionnaireForVendor(vendorId, currentQA);
        setSavedMessage(`Successfully saved ${currentQA.length} questions and answers to vendor ${vendorName || vendorId}`);
      } else if (vendorName) {
        // Create new vendor
        vendorFunctions.createVendorWithQuestionnaire(vendorName, currentQA);
        setSavedMessage(`Successfully created new vendor "${vendorName}" with ${currentQA.length} questions and answers`);
      } else {
        setError('Please enter either a vendor ID or a new vendor name');
        return;
      }
      
      // Clear the form fields but keep the current Q&A session
      setVendorId('');
      setVendorName('');
    } catch (error: any) {
      console.error('Error saving to vendor:', error);
      setError(`Failed to save to vendor: ${error.message}`);
    }
  };

  // Reset the current Q&A session
  const resetSession = () => {
    setCurrentQA([]);
    setQuestion('');
    setAnswer('');
    setMetadata(null);
    setError('');
    setSavedMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Security Questionnaire Assistant</h1>
      
      {serverStatus === 'offline' && (
        <div className="p-4 mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
          <p><strong>Warning:</strong> The chatbot server appears to be offline or inaccessible. Using fallback mode with limited functionality.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8" id="security-questionnaire-form" name="security-questionnaire-form">
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium mb-2">
            Enter security or compliance question:
          </label>
          <textarea
            id="question"
            name="question"
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are the GDPR data subject rights? How do we handle SOC 2 audits? What are our HIPAA compliance requirements?"
          />
        </div>
        
        <button
          type="submit"
          id="submit-question"
          name="submit-question"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Get Answer'}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {savedMessage && (
        <div className="p-4 mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md">
          <p><strong>Success:</strong> {savedMessage}</p>
        </div>
      )}

      {answer && (
        <div className="border border-gray-300 rounded-md p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Answer:</h2>
          <div className="prose max-w-none">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
          
          {metadata && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Response Details:</h3>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>Sources: {metadata.relevant_sources}</span>
                <span>Tokens: {metadata.tokens_used}</span>
                <span>Model: {metadata.model}</span>
                {metadata.status && <span>Status: {metadata.status}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Q&A Session Summary */}
      {currentQA.length > 0 && (
        <div className="mt-8 border border-gray-300 rounded-md p-6 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Current Session ({currentQA.length} Questions)</h2>
            <button 
              onClick={resetSession}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Session
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Save these questions and answers to a vendor:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="existingVendorId" className="block text-sm font-medium mb-1">
                  Existing Vendor ID:
                </label>
                <input
                  type="text"
                  id="existingVendorId"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  placeholder="Enter vendor ID"
                />
              </div>
              
              <div className="flex-1">
                <label htmlFor="newVendorName" className="block text-sm font-medium mb-1">
                  New Vendor Name:
                </label>
                <input
                  type="text"
                  id="newVendorName"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Or create new vendor"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={saveToVendor}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save to Vendor
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {currentQA.map((qa, index) => (
              <div key={qa.questionId} className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-800">Q{index + 1}: {qa.question}</h3>
                <div className="mt-2 text-gray-600 text-sm">
                  <ReactMarkdown>{qa.answer}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 