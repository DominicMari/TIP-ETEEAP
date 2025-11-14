"use client";

import React, { useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  onFileChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
}

export default function FileUploader({ label, onFileChange, required = false, error }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    onFileChange(selectedFile);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from opening file dialog
    setFile(null);
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = ""; // Clear the input value
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`w-full flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
          error
            ? 'border-red-500 bg-red-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 border-dashed hover:bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" // Specify allowed file types
        />
        {file ? (
          <>
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-800 truncate" title={file.name}>
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <UploadCloud className="h-5 w-5" />
            <span className="text-sm">{error || `Click to upload ${label}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}