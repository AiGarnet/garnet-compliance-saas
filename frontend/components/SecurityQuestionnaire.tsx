import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function SecurityQuestionnaire() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a security question');
      return;
    }

    setLoading(true);
    setError('');
    setMetadata(null);
    
    try {
      // Use the new Flask chatbot microservice endpoint
      const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:5000';
      const response = await fetch(`${chatbotUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data.answer);
      setMetadata(data.metadata);
    } catch (err: any) {
      setError(err.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Security Questionnaire Assistant</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium mb-2">
            Enter security or compliance question:
          </label>
          <textarea
            id="question"
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are the GDPR data subject rights? How do we handle SOC 2 audits? What are our HIPAA compliance requirements?"
          />
        </div>
        
        <button
          type="submit"
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 