import React from 'react';
import { FileText } from 'lucide-react';
import { useEvidenceCount } from '@/hooks/useEvidenceCount';

interface EvidenceCountProps {
  vendorId: string;
}

export function EvidenceCount({ vendorId }: EvidenceCountProps) {
  const { count, isLoading, error } = useEvidenceCount(vendorId);

  if (error) {
    return (
      <span className="text-xs text-gray-400 flex items-center">
        <FileText className="h-3 w-3 mr-1" />
        --
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className="text-xs text-gray-400 flex items-center">
        <div className="h-3 w-3 mr-1 bg-gray-200 animate-pulse rounded"></div>
        ...
      </span>
    );
  }

  return (
    <span className={`text-xs flex items-center ${count > 0 ? 'text-primary' : 'text-gray-400'}`}>
      <FileText className="h-3 w-3 mr-1" />
      {count} file{count !== 1 ? 's' : ''}
    </span>
  );
} 