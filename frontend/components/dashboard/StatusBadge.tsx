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
        return "bg-success-light text-success";
      case 'In Review':
        return "bg-warning-light text-warning";
      case 'Questionnaire Pending':
        return "bg-secondary-light text-secondary";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <span 
      className={cn(
        "text-xs px-2 py-1 rounded-full inline-flex items-center",
        getStatusStyle(status),
        className
      )}
    >
      {status}
    </span>
  );
} 