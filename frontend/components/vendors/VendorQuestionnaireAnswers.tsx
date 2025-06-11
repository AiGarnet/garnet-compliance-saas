"use client";

import React from 'react';
import { VendorDetail } from '@/hooks/useVendor';
import { FileText, MessageSquare, CheckCircle } from 'lucide-react';

interface VendorQuestionnaireAnswersProps {
  vendor: VendorDetail;
}

export function VendorQuestionnaireAnswers({ vendor }: VendorQuestionnaireAnswersProps) {
  const questionnaireAnswers = vendor.questionnaireAnswers || [];

  if (questionnaireAnswers.length === 0) {
    return (
      <div 
        id="questionnaire-answers"
        className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6"
      >
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Questionnaire Answers</h2>
        </div>
        
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No questionnaire answers available for this vendor yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="questionnaire-answers"
      className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Questionnaire Answers</h2>
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <CheckCircle className="h-4 w-4 mr-1" />
          {questionnaireAnswers.length} question{questionnaireAnswers.length !== 1 ? 's' : ''} answered
        </div>
      </div>

      <div className="space-y-6">
        {questionnaireAnswers.map((qa, index) => (
          <div 
            key={index} 
            className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0"
          >
            {/* Question and Answer */}
            <div className="space-y-3">
              {/* Question Number and Question */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-relaxed mb-2">
                    {qa.question}
                  </h3>
                  {/* Answer directly below question */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-l-4 border-primary/20">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {qa.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Total of {questionnaireAnswers.length} questionnaire response{questionnaireAnswers.length !== 1 ? 's' : ''} for this vendor
        </div>
      </div>
    </div>
  );
} 