"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Check, Edit2, Save, Trash2, Copy, MessageSquare, DownloadCloud, ChevronUp, ChevronDown, X, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { QuestionnairesAnswersClient } from './[id]/client';

interface QuestionAnswer {
  question: string;
  answer: string;
}

// Client component that uses useSearchParams
function SearchParamsHandler({ setId }: { setId: (id: string | null) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const id = searchParams?.get('id') || null;
    console.log('SearchParamsHandler: ID from URL:', id);
    setId(id);
  }, [searchParams, setId]);
  
  return null;
}

function QuestionnairesAnswersPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Invalid Questionnaire</h2>
          <p className="text-gray-600 mb-6">No questionnaire ID provided.</p>
          <a
            href="/questionnaires"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Back to Questionnaires
          </a>
        </div>
      </div>
    );
  }

  return <QuestionnairesAnswersClient id={id} />;
}

export default function QuestionnairesAnswersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <QuestionnairesAnswersPageContent />
    </Suspense>
  );
} 