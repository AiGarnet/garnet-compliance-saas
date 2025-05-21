"use client";

import React from 'react';
import { ArrowLeft, Edit, Download, FileDown } from 'lucide-react';
import Link from 'next/link';
import { VendorDetail } from '@/hooks/useVendor';
import { Tooltip } from '@/components/ui/Tooltip';

interface VendorDetailHeaderProps {
  vendor: VendorDetail;
}

export function VendorDetailHeader({ vendor }: VendorDetailHeaderProps) {
  return (
    <div className="bg-white dark:bg-card-bg border-b border-gray-200 dark:border-card-border shadow-sm py-6 px-4 md:px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start md:items-center">
            <Link 
              href="/vendors" 
              className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
              aria-label="Back to vendor list"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="sr-only">Back to vendor list</span>
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.name}</h1>
              <div className="mt-1 flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                  vendor.status === 'Approved' ? 'bg-success-light text-success border-success' :
                  vendor.status === 'In Review' ? 'bg-warning-light text-warning border-warning' :
                  vendor.status === 'Questionnaire Pending' ? 'bg-secondary-light text-secondary border-secondary' :
                  'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}>
                  {vendor.status}
                </span>
                
                {vendor.industry && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{vendor.industry}</span>
                )}
                {vendor.riskLevel && (
                  <span className={`text-sm px-2 py-1 rounded-full 
                    ${vendor.riskLevel === 'Low' ? 'bg-success-light text-success' : 
                      vendor.riskLevel === 'Medium' ? 'bg-warning-light text-warning' : 
                      'bg-danger-light text-danger'}`}
                  >
                    {vendor.riskLevel} Risk
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Tooltip content="Coming Soon">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-60 cursor-not-allowed"
                disabled
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </Tooltip>
            
            <Tooltip content="Coming Soon">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-60 cursor-not-allowed"
                disabled
              >
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </button>
            </Tooltip>
            
            <Tooltip content="Coming Soon">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-60 cursor-not-allowed"
                disabled
              >
                <FileDown className="h-4 w-4" />
                <span>Export Answers</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
} 