"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, AlertTriangle, Plus } from "lucide-react";

interface FileUploaderProps {
  label: string;
  description?: string;
  onFilesChange: (files: File[]) => void;
  required?: boolean;
  error?: string;
  multiple?: boolean;
}

export default function FileUploader({
  label,
  description,
  onFilesChange,
  required = false,
  error,
  multiple = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 20 * 1024 * 1024;

  const addFiles = (selectedFiles: File[]) => {
    const oversized = selectedFiles.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      setSizeError(oversized.name);
      return;
    }

    let updated: File[];
    const existing = new Set(files.map((f) => `${f.name}_${f.size}`));
    const newOnes = selectedFiles.filter((f) => !existing.has(`${f.name}_${f.size}`));
    updated = [...files, ...newOnes];

    setFiles(updated);
    onFilesChange(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    addFiles(selected);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  };

  const hasFiles = files.length > 0;

  return (
    <div className="w-full">
      {/* Size error modal */}
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
            <p className="text-sm text-gray-500 mb-5">
              exceeds the <span className="font-semibold text-red-500">20MB</span> limit.
            </p>
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

      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />

      {/* No files yet — show single upload box */}
      {!hasFiles && (
        <div
          className={`w-full flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
            error ? "border-red-500 bg-red-50" : "border-gray-300 border-dashed hover:bg-gray-50"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500">{error || "Click to upload"}</span>
        </div>
      )}

      {/* Has files — show file list + Add button */}
      {hasFiles && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-2 px-3 py-2 border border-green-300 bg-green-50 rounded-lg"
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-xs text-gray-800 truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(1)}MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="p-0.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Add button — always shown */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold mt-1 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors border border-blue-200"
          >
            <Plus size={14} />
            Add more
          </button>
        </div>
      )}
    </div>
  );
}