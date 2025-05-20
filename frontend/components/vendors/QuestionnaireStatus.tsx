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
          bgColor: 'bg-success-light',
          borderColor: 'border-success'
        };
      case 'In Review':
        return {
          icon: <Clock className="h-10 w-10 text-warning" />,
          title: 'In Review',
          description: 'This vendor\'s questionnaire is currently being reviewed.',
          color: 'text-warning',
          bgColor: 'bg-warning-light',
          borderColor: 'border-warning'
        };
      case 'Questionnaire Pending':
        return {
          icon: <HelpCircle className="h-10 w-10 text-secondary" />,
          title: 'Questionnaire Pending',
          description: 'Waiting for the vendor to complete the questionnaire.',
          color: 'text-secondary',
          bgColor: 'bg-secondary-light',
          borderColor: 'border-secondary'
        };
      default:
        return {
          icon: <AlertTriangle className="h-10 w-10 text-danger" />,
          title: 'Status Unknown',
          description: 'The status of this vendor is currently unknown.',
          color: 'text-danger',
          bgColor: 'bg-danger-light',
          borderColor: 'border-danger'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Questionnaire Status</h2>
      
      <div className={`flex items-start p-4 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
        <div className="mr-4 flex-shrink-0">
          {statusInfo.icon}
        </div>
        <div>
          <h3 className={`font-medium text-lg ${statusInfo.color}`}>{statusInfo.title}</h3>
          <p className="text-gray-600 mt-1">{statusInfo.description}</p>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Questionnaire Completion</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {answeredQuestions} of {totalQuestions} questions answered
        </div>
      </div>
      
      {answeredQuestions > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">Recent Answers</h3>
          <ul className="space-y-3">
            {vendor.questionnaireAnswers.slice(0, 3).map((qa, index) => (
              <li key={index} className="border-b border-gray-100 pb-3">
                <div className="text-sm font-medium text-gray-800">{qa.question}</div>
                <div className="text-sm text-gray-600 mt-1">{qa.answer}</div>
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