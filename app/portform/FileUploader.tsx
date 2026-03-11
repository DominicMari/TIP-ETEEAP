"use client";

import React, { useState } from 'react';
import { UploadCloud, FileText, X, AlertTriangle } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  onFileChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
}

export default function FileUploader({ label, onFileChange, required = false, error }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    const MAX_SIZE = 20 * 1024 * 1024;
    if (selectedFile && selectedFile.size > MAX_SIZE) {
      setSizeError(selectedFile.name);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

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
      {/* File size error modal */}
      {sizeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="text-red-500 w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">File Too Large</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium text-gray-800 break-all">&ldquo;{sizeError}&rdquo;</span>
            </p>
            <p className="text-sm text-gray-500 mb-5">exceeds the <span className="font-semibold text-red-500">20MB</span> file size limit.</p>
            <button
              type="button"
              onClick={() => setSizeError(null)}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
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