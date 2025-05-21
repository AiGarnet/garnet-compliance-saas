"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';

interface QuestionnaireCardProps {
  count: number;
  dueSoon: string;
  className?: string;
}

export function QuestionnaireCard({ count, dueSoon, className }: QuestionnaireCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border",
      className
    )}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-base font-medium text-gray-600 dark:text-gray-300">Questionnaires In Progress</h2>
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <p className="text-4xl font-semibold text-gray-800 dark:text-white mb-4">{count}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{dueSoon}</p>
    </div>
  );
} 