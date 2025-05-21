"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Vendor } from './VendorList';

interface VendorDetailModalProps {
  vendor: Vendor;
  onClose: () => void;
}

export function VendorDetailModal({ vendor, onClose }: VendorDetailModalProps) {
  // Handle background click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Handle focus trap
  React.useEffect(() => {
    const modalElement = document.getElementById('vendor-detail-modal');
    if (modalElement) {
      modalElement.focus();
    }

    // Store the element that had focus before opening modal
    const previousActiveElement = document.activeElement as HTMLElement;

    // Restore focus when component unmounts
    return () => {
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    };
  }, []);

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="vendor-modal-title"
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        id="vendor-detail-modal"
        className="bg-white dark:bg-card-bg p-6 rounded-lg max-w-md w-full relative"
        tabIndex={-1}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 id="vendor-modal-title" className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Vendor Info</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Details for {vendor.name} will appear here.</p>
        {vendor.status && (
          <div className="mt-4">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Status: </span>
            <span className={cn(
              "text-xs ml-2 px-2 py-1 rounded-full inline-flex items-center",
              vendor.status === "Approved" && "bg-success-light dark:bg-success-light/30 text-success dark:text-success",
              vendor.status === "In Review" && "bg-warning-light dark:bg-warning-light/30 text-warning dark:text-warning",
              vendor.status === "Questionnaire Pending" && "bg-secondary-light dark:bg-secondary-light/30 text-secondary dark:text-secondary"
            )}>
              {vendor.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 