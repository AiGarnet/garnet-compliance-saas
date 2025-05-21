"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ComplianceCardProps {
  percentage: number;
  change: string;
  className?: string;
}

export function ComplianceCard({ percentage, change, className }: ComplianceCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border",
      className
    )}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-base font-medium text-gray-600 dark:text-gray-300">Compliance Progress</h2>
        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
      </div>
      <p className="text-4xl font-semibold text-gray-800 dark:text-white mb-4">{percentage}%</p>
      <Progress value={percentage} max={100} className="h-2 mb-2" indicatorClassName="bg-purple-600 dark:bg-purple-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{change}</p>
    </div>
  );
} 