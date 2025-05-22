import React from 'react';
import { cn } from '@/lib/utils';
import { VendorStatus } from './VendorList';
import { translations } from '@/lib/i18n';

interface StatusBadgeProps {
  status: VendorStatus;
  className?: string;
  locale?: string;
}

export function StatusBadge({ status, className, locale = 'en' }: StatusBadgeProps) {
  // Access translations based on locale
  const t = translations[locale as keyof typeof translations]?.statusBadge || translations.en.statusBadge;
  
  // Get the status badge styling based on status
  const getStatusStyle = (status: VendorStatus) => {
    switch (status) {
      case 'Approved':
        // Darker green for better contrast
        return "bg-success-light text-success border border-success";
      case 'In Review':
        // Darker orange/amber for better contrast
        return "bg-warning-light text-warning border border-warning";
      case 'Questionnaire Pending':
        // Darker gray for better contrast
        return "bg-secondary-light text-secondary border border-secondary";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  // ARIA roles and states
  const getAriaAttributes = (status: VendorStatus) => {
    switch (status) {
      case 'Approved':
        return { 'aria-description': t.approved.description };
      case 'In Review':
        return { 'aria-description': t.inReview.description };
      case 'Questionnaire Pending':
        return { 'aria-description': t.questionnairePending.description };
      default:
        return {};
    }
  };
  
  // Get the translated status text
  const getStatusText = (status: VendorStatus): string => {
    switch (status) {
      case 'Approved':
        return t.approved.text;
      case 'In Review':
        return t.inReview.text;
      case 'Questionnaire Pending':
        return t.questionnairePending.text;
      default:
        return status;
    }
  };

  return (
    <span 
      className={cn(
        "text-xs px-2 py-1 rounded-full inline-flex items-center font-medium",
        getStatusStyle(status),
        className
      )}
      role="status"
      {...getAriaAttributes(status)}
      aria-live="polite"
    >
      {getStatusText(status)}
    </span>
  );
} 