import React from 'react';
import { cn } from '@/lib/utils';
import { VendorStatus } from './VendorList';

interface StatusBadgeProps {
  status: VendorStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
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
        return { 'aria-description': 'Vendor is approved' };
      case 'In Review':
        return { 'aria-description': 'Vendor is currently under review' };
      case 'Questionnaire Pending':
        return { 'aria-description': 'Vendor has a pending questionnaire' };
      default:
        return {};
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
      {status}
    </span>
  );
} 