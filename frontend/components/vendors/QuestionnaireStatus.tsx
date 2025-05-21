"use client";

import React from 'react';
import { VendorDetail } from '@/hooks/useVendor';
import { Clock, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface QuestionnaireStatusProps {
  vendor: VendorDetail;
}

export function QuestionnaireStatus({ vendor }: QuestionnaireStatusProps) {
  // Calculate the progress based on answers
  const totalQuestions = 10; // This would typically come from your questionnaire schema
  const answeredQuestions = vendor.questionnaireAnswers?.length || 0;
  const progress = Math.round((answeredQuestions / totalQuestions) * 100);
  
  const getStatusInfo = () => {
    switch (vendor.status) {
      case 'Approved':
        return {
          icon: <CheckCircle2 className="h-10 w-10 text-success" />,
          title: 'Approved',
          description: 'This vendor has been approved and is ready for integration.',
          color: 'text-success',
          bgColor: 'bg-success-light dark:bg-success-light/30',
          borderColor: 'border-success',
          descriptionColor: 'text-gray-600 dark:text-gray-200'
        };
      case 'In Review':
        return {
          icon: <Clock className="h-10 w-10 text-warning" />,
          title: 'In Review',
          description: 'This vendor\'s questionnaire is currently being reviewed.',
          color: 'text-warning',
          bgColor: 'bg-warning-light dark:bg-warning-light/30',
          borderColor: 'border-warning',
          descriptionColor: 'text-gray-600 dark:text-gray-200'
        };
      case 'Questionnaire Pending':
        return {
          icon: <HelpCircle className="h-10 w-10 text-secondary" />,
          title: 'Questionnaire Pending',
          description: 'Waiting for the vendor to complete the questionnaire.',
          color: 'text-secondary',
          bgColor: 'bg-secondary-light dark:bg-secondary-light/30',
          borderColor: 'border-secondary',
          descriptionColor: 'text-gray-600 dark:text-gray-200'
        };
      default:
        return {
          icon: <AlertTriangle className="h-10 w-10 text-danger" />,
          title: 'Status Unknown',
          description: 'The status of this vendor is currently unknown.',
          color: 'text-danger',
          bgColor: 'bg-danger-light dark:bg-danger-light/30',
          borderColor: 'border-danger',
          descriptionColor: 'text-gray-900 dark:text-white font-semibold'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  const isUnknownStatus = vendor.status === undefined || vendor.status === null;
  
  return (
    <div className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Questionnaire Status</h2>
      
      <div className={`flex items-start p-4 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
        <div className="mr-4 flex-shrink-0">
          {statusInfo.icon}
        </div>
        <div>
          <h3 className={`font-medium text-lg ${statusInfo.color}`}>{statusInfo.title}</h3>
          <p 
            className={`${statusInfo.descriptionColor} mt-1 ${isUnknownStatus ? 'text-base dark:!text-white dark:!font-semibold' : ''}`} 
            style={isUnknownStatus ? { textShadow: '0 0 1px rgba(255,255,255,0.5)' } : undefined}
          >
            {statusInfo.description}
          </p>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Questionnaire Completion</span>
          <span className="text-sm font-medium dark:text-white">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-indigo-500 dark:bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {answeredQuestions} of {totalQuestions} questions answered
        </div>
      </div>
      
      {answeredQuestions > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3 text-gray-800 dark:text-white">Recent Answers</h3>
          <ul className="space-y-3">
            {vendor.questionnaireAnswers.slice(0, 3).map((qa, index) => (
              <li key={index} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{qa.question}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{qa.answer}</div>
              </li>
            ))}
          </ul>
          {vendor.questionnaireAnswers.length > 3 && (
            <div className="mt-3 text-sm">
              <a href="#" className="text-primary hover:underline">
                View all answers
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 