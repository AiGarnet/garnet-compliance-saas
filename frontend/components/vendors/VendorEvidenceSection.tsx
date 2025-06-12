"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, AlertCircle } from 'lucide-react';
import { EvidenceUpload } from './EvidenceUpload';
import { evidence } from '@/lib/api';

interface EvidenceFile {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  metadata?: any;
}

interface VendorEvidenceSectionProps {
  vendor: {
    id: string;
    vendorId?: number;
  };
}

export function VendorEvidenceSection({ vendor }: VendorEvidenceSectionProps) {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showUploadArea, setShowUploadArea] = useState(false);

  // Get the vendor ID (numeric) for API calls
  const vendorId = vendor.vendorId?.toString() || vendor.id;

  // Fetch evidence files
  const fetchEvidenceFiles = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching evidence files for vendor:', vendorId);
      const response = await evidence.getByVendor(vendorId);
      
      if (response.success) {
        setEvidenceFiles(response.evidenceFiles || []);
      } else {
        setError('Failed to load evidence files');
      }
    } catch (err: any) {
      console.error('Error fetching evidence files:', err);
      setError(err.message || 'Failed to load evidence files');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvidenceFiles();
  }, [vendorId]);

  const handleUploadComplete = () => {
    // Refresh the evidence files list
    fetchEvidenceFiles();
  };

  const handleFilesUpdate = (updatedFiles: EvidenceFile[]) => {
    setEvidenceFiles(updatedFiles);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Evidence Files
              </h3>
              <p className="text-sm text-gray-600">
                Supporting documentation and evidence files
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUploadArea(!showUploadArea)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Evidence</span>
          </button>
        </div>
        
        {evidenceFiles.length > 0 && (
          <div className="mt-4 flex space-x-6 text-sm text-gray-600">
            <span>{evidenceFiles.length} file{evidenceFiles.length !== 1 ? 's' : ''}</span>
            <span>
              {(evidenceFiles.reduce((sum, file) => sum + file.fileSize, 0) / (1024 * 1024)).toFixed(1)} MB total
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error loading evidence files</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={fetchEvidenceFiles}
                className="mt-2 text-red-700 hover:text-red-800 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {showUploadArea && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Upload New Evidence</h4>
              <button
                onClick={() => setShowUploadArea(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <EvidenceUpload
              vendorId={vendorId}
              onUploadComplete={handleUploadComplete}
              existingFiles={evidenceFiles}
              onFilesUpdate={handleFilesUpdate}
            />
          </div>
        )}

        {/* Evidence Files Display */}
        {!showUploadArea && (
          <EvidenceUpload
            vendorId={vendorId}
            onUploadComplete={handleUploadComplete}
            existingFiles={evidenceFiles}
            onFilesUpdate={handleFilesUpdate}
          />
        )}
      </div>
    </div>
  );
} 