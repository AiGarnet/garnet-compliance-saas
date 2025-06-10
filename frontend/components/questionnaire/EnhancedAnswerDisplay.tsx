"use client";

import React, { useState, useCallback } from 'react';
import { Edit2, RefreshCw, Save, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface QuestionAnswer {
  question: string;
  answer: string;
  isLoading?: boolean;
  hasError?: boolean;
  isGenerated?: boolean;
}

interface EnhancedAnswerDisplayProps {
  questionAnswers: QuestionAnswer[];
  onAnswerEdit: (index: number, newAnswer: string) => void;
  onRegenerateAnswer: (index: number) => Promise<void>;
  isGenerating?: boolean;
  className?: string;
}

export function EnhancedAnswerDisplay({
  questionAnswers,
  onAnswerEdit,
  onRegenerateAnswer,
  isGenerating = false,
  className = ''
}: EnhancedAnswerDisplayProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedAnswer, setEditedAnswer] = useState('');
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const handleEditStart = useCallback((index: number, currentAnswer: string) => {
    setEditingIndex(index);
    setEditedAnswer(currentAnswer);
  }, []);

  const handleEditSave = useCallback(() => {
    if (editingIndex !== null) {
      onAnswerEdit(editingIndex, editedAnswer);
      setEditingIndex(null);
      setEditedAnswer('');
    }
  }, [editingIndex, editedAnswer, onAnswerEdit]);

  const handleEditCancel = useCallback(() => {
    setEditingIndex(null);
    setEditedAnswer('');
  }, []);

  const handleRegenerate = useCallback(async (index: number) => {
    setRegeneratingIndex(index);
    try {
      await onRegenerateAnswer(index);
    } finally {
      setRegeneratingIndex(null);
    }
  }, [onRegenerateAnswer]);

  const formatAnswer = (answer: string) => {
    // Split by paragraphs and format
    return answer.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-3 last:mb-0 leading-relaxed">
        {paragraph.trim()}
      </p>
    ));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {questionAnswers.map((qa, index) => (
        <article 
          key={index} 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
          role="article"
          aria-labelledby={`question-${index}`}
          aria-describedby={`answer-${index}`}
        >
          {/* Question Section */}
          <section className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-sm font-semibold mr-3">
                    {index + 1}
                  </span>
                  <h3 
                    id={`question-${index}`}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  >
                    Question {index + 1}
                  </h3>
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                  {qa.question}
                </p>
              </div>
            </div>
          </section>

          {/* Answer Section */}
          <section className="p-6" aria-labelledby={`answer-label-${index}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h4 
                  id={`answer-label-${index}`}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                >
                  {qa.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                      Generating Answer...
                    </>
                  ) : qa.hasError ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Answer (Error)
                    </>
                  ) : qa.isGenerated ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Suggested Answer
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2 text-gray-500" />
                      Answer
                    </>
                  )}
                </h4>
              </div>

              {/* Action Buttons */}
              {!qa.isLoading && (
                <div className="flex items-center space-x-2">
                  {editingIndex === index ? (
                    <>
                      <button
                        onClick={handleEditSave}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                        aria-label="Save edited answer"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        aria-label="Cancel editing"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditStart(index, qa.answer)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        aria-label={`Edit answer for question ${index + 1}`}
                        disabled={isGenerating}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRegenerate(index)}
                        disabled={regeneratingIndex === index || isGenerating}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Regenerate answer for question ${index + 1}`}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${regeneratingIndex === index ? 'animate-spin' : ''}`} />
                        {regeneratingIndex === index ? 'Regenerating...' : 'Regenerate'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Answer Content */}
            <div 
              id={`answer-${index}`}
              className="mt-3"
              role="region"
              aria-label={`Answer to question ${index + 1}`}
            >
              {qa.isLoading ? (
                <div className="flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Generating intelligent response...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              ) : editingIndex === index ? (
                <div className="space-y-3">
                  <textarea
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="w-full min-h-[120px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    placeholder="Edit your answer here..."
                    aria-label={`Edit answer for question ${index + 1}`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Tip: Be specific and include relevant compliance frameworks or standards
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                  {qa.hasError ? (
                    <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-red-800 dark:text-red-200 font-medium">
                          We couldn't generate an answer—please try again.
                        </p>
                        <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                          You can edit this manually or try regenerating the answer.
                        </p>
                      </div>
                    </div>
                  ) : qa.answer ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-primary">
                      {formatAnswer(qa.answer)}
                      {qa.isGenerated && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            ✨ This answer was generated by AI. You can edit or regenerate it as needed.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                      <p className="text-yellow-800 dark:text-yellow-200">
                        No answer provided yet. Click "Edit" to add your response or "Regenerate" to generate an AI answer.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </article>
      ))}
    </div>
  );
} 