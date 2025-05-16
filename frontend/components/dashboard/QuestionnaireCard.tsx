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
      "bg-white p-8 rounded-xl shadow-sm border border-gray-200",
      className
    )}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-base font-medium text-gray-600">Questionnaires In Progress</h2>
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <p className="text-4xl font-semibold text-gray-800 mb-4">{count}</p>
      <p className="text-sm text-gray-500">{dueSoon}</p>
    </div>
  );
} 