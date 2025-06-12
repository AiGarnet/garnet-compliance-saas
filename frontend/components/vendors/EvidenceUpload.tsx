"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';
import { evidence } from '@/lib/api';

interface EvidenceFile {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  metadata?: any;
}

interface EvidenceUploadProps {
  vendorId: string;
  onUploadComplete?: () => void;
  existingFiles?: EvidenceFile[];
  onFilesUpdate?: (files: EvidenceFile[]) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  id?: string;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function EvidenceUpload({ 
  vendorId, 
  onUploadComplete, 
  existingFiles = [],
  onFilesUpdate 
}: EvidenceUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [files, setFiles] = useState<EvidenceFile[]>(existingFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update files when existingFiles prop changes
  React.useEffect(() => {
    setFiles(existingFiles);
  }, [existingFiles]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, TXT, XLS, XLSX';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit';
    }
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📄';
  };

  const uploadFile = async (file: File) => {
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.file === file && f.progress < 90 
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const result = await evidence.upload(vendorId, file);

      clearInterval(progressInterval);

      // Update uploading file status
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, progress: 100, status: 'success', id: result.evidenceFile.id }
            : f
        )
      );

      // Add to files list
      const newFile: EvidenceFile = {
        id: result.evidenceFile.id,
        filename: result.evidenceFile.filename,
        fileSize: result.evidenceFile.fileSize,
        mimeType: result.evidenceFile.mimeType,
        uploadedAt: result.evidenceFile.uploadedAt,
        metadata: result.evidenceFile.metadata
      };

      setFiles(prev => [...prev, newFile]);
      onFilesUpdate?.([...files, newFile]);

      // Remove from uploading after delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.file !== file));
      }, 2000);

      onUploadComplete?.();

    } catch (error: any) {
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
    }
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(file => {
      const error = validateFile(file);
      if (error) {
        console.error(`File ${file.name}: ${error}`);
        return false;
      }
      return true;
    });

    validFiles.forEach(uploadFile);
  }, [vendorId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleDownload = async (file: EvidenceFile) => {
    try {
      const response = await evidence.download(vendorId, file.id);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    }
  };

  const handleDelete = async (file: EvidenceFile) => {
    if (!confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return;
    }

    try {
      await evidence.delete(vendorId, file.id);
      const updatedFiles = files.filter(f => f.id !== file.id);
      setFiles(updatedFiles);
      onFilesUpdate?.(updatedFiles);
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Evidence Files
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-sm text-gray-500">
          Supported: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, TXT, XLS, XLSX (Max 10MB)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploading...</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {uploadingFile.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(uploadingFile.file.size)}
                  </span>
                </div>
                {uploadingFile.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {uploadingFile.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              {uploadingFile.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadingFile.progress}%` }}
                  />
                </div>
              )}
              
              {uploadingFile.status === 'error' && (
                <p className="text-sm text-red-600 mt-1">
                  {uploadingFile.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Evidence Files ({files.length})</h4>
          <div className="grid gap-3">
            {files.map((file) => (
              <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1 text-gray-400 hover:text-primary transition-colors"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {files.length === 0 && uploadingFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <File className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p>No evidence files uploaded yet</p>
        </div>
      )}
    </div>
  );
} 