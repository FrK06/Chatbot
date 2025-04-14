"use client";

// src/app/components/file-uploader.tsx
import React, { useState, useRef } from 'react';
import { Upload, X, File, Check } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
}

export function FileUploader({
  onFileUpload,
  allowedTypes = [],
  maxSizeMB = 10,
  disabled = false
}: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    // Check file type if allowedTypes is specified
    if (allowedTypes.length > 0) {
      const fileType = file.type;
      if (!allowedTypes.some(type => fileType.includes(type))) {
        setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setFile(file);
      setUploading(true);
      
      // Simulate upload process
      setTimeout(() => {
        setUploading(false);
        setUploadComplete(true);
        onFileUpload(file);
      }, 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]; // Take only the first file
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleBrowseClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleReset = () => {
    setFile(null);
    setError('');
    setUploading(false);
    setUploadComplete(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 
          error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 
          uploadComplete ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 
          'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={disabled || uploading}
          accept={allowedTypes.length > 0 ? allowedTypes.map(t => `.${t}`).join(',') : undefined}
        />

        <div className="flex flex-col items-center justify-center p-4">
          {!file ? (
            <>
              <Upload 
                size={36} 
                className="text-gray-400 dark:text-gray-500 mb-2" 
              />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drag & drop a file here, or click to browse
              </p>
              {allowedTypes.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Accepted file types: {allowedTypes.join(', ')}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum file size: {maxSizeMB}MB
              </p>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <File className="text-indigo-500" size={24} />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {!uploading && !uploadComplete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                )}
                
                {uploading && (
                  <div className="flex space-x-1">
                    <div className="loading-dot">●</div>
                    <div className="loading-dot">●</div>
                    <div className="loading-dot">●</div>
                  </div>
                )}
                
                {uploadComplete && (
                  <Check size={18} className="text-green-500" />
                )}
              </div>
              
              {uploading && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-indigo-600 h-1.5 rounded-full animate-shimmer"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}