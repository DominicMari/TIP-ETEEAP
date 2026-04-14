'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Download, File, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface FileItem {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  size?: string;
  uploadedAt?: string;
}

interface FileViewerProps {
  files: FileItem[];
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const getFileType = (url: string, name?: string): 'image' | 'pdf' | 'document' | 'other' => {
  const ext = (name || url).toLowerCase().split('.').pop();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) return 'document';
  return 'other';
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const FileViewer: React.FC<FileViewerProps> = ({
  files,
  isOpen,
  onClose,
  title = 'File Viewer',
}) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewSourceIndex, setPreviewSourceIndex] = useState(0);
  const [resolvedSizes, setResolvedSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (files.length > 0 && !selectedFile) {
        setSelectedFile(files[0]);
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, files, selectedFile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || files.length === 0) return;

    let cancelled = false;

    const parseBytesFromHeaders = (headers: Headers): number | null => {
      const contentLength = headers.get('content-length');
      if (contentLength) {
        const parsed = Number(contentLength);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }

      const contentRange = headers.get('content-range');
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) {
          const parsed = Number(match[1]);
          if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
      }

      return null;
    };

    const resolveFileSize = async (url: string): Promise<string> => {
      try {
        const headResponse = await fetch(url, { method: 'HEAD' });
        const headBytes = parseBytesFromHeaders(headResponse.headers);
        if (headBytes) return formatFileSize(headBytes);
      } catch {
        // Continue with fallback strategies.
      }

      try {
        const rangeResponse = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
        });
        const rangeBytes = parseBytesFromHeaders(rangeResponse.headers);
        if (rangeBytes) return formatFileSize(rangeBytes);
      } catch {
        // Continue with blob fallback.
      }

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return formatFileSize(blob.size);
      } catch {
        return 'Unavailable';
      }
    };

    const hydrateSizes = async () => {
      for (const file of files) {
        if (cancelled) return;
        if (resolvedSizes[file.url]) continue;

        const accurateSize = await resolveFileSize(file.url);
        if (cancelled) return;

        setResolvedSizes((prev) => {
          if (prev[file.url]) return prev;
          return { ...prev, [file.url]: accurateSize };
        });
      }
    };

    hydrateSizes();

    return () => {
      cancelled = true;
    };
  }, [isOpen, files, resolvedSizes]);

  const handleFileSelect = (file: FileItem) => {
    setLoading(true);
    setSelectedFile(file);
    setPreviewSourceIndex(0);
    setTimeout(() => setLoading(false), 300);
  };

  const getPreviewSources = (file: FileItem): { label: string; src: string }[] => {
    const encodedUrl = encodeURIComponent(file.url);

    if (file.type === 'pdf') {
      return [{ label: 'PDF', src: `${file.url}#toolbar=1` }];
    }

    if (file.type === 'document') {
      return [
        { label: 'Google', src: `https://docs.google.com/viewerng/viewer?embedded=true&url=${encodedUrl}` },
      ];
    }

    return [
      { label: 'Google', src: `https://docs.google.com/viewerng/viewer?embedded=true&url=${encodedUrl}` },
    ];
  };

  const downloadFile = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const renderFilePreview = (file: FileItem) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      );
    }

    switch (file.type) {
      case 'image':
        return (
          <div className="relative h-full flex items-center justify-center bg-gray-900">
            <img
              src={file.url}
              alt={file.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        );
      case 'pdf':
        return (
          <iframe
            src={`${file.url}#toolbar=1`}
            className="w-full h-full border-0"
            title={file.name}
          />
        );
      case 'document':
        return (
          <div className="h-full bg-gray-50">
            <iframe
              src={getPreviewSources(file)[previewSourceIndex]?.src}
              className="w-full h-full border-0"
              title={file.name}
            />
          </div>
        );
      default:
        return (
          <div className="h-full bg-gray-50">
            <iframe
              src={getPreviewSources(file)[previewSourceIndex]?.src}
              className="w-full h-full border-0"
              title={file.name}
            />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <span className="text-gray-400 text-sm">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File List */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-gray-300 font-medium text-sm uppercase tracking-wide">Files</h4>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.map((file, index) => {
              const isSelected = selectedFile?.url === file.url;
              return (
                <button
                  key={index}
                  onClick={() => handleFileSelect(file)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${isSelected
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'hover:bg-gray-800 border border-transparent'
                    }`}
                >
                  {file.type === 'image' ? (
                    <ImageIcon size={20} className="text-blue-400 flex-shrink-0" />
                  ) : file.type === 'pdf' ? (
                    <FileText size={20} className="text-red-400 flex-shrink-0" />
                  ) : (
                    <File size={20} className="text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-yellow-400' : 'text-gray-200'}`}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resolvedSizes[file.url] || 'Calculating...'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-800 relative">
          {selectedFile ? (
            <>
              {/* Toolbar */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                {(selectedFile.type === 'document' || selectedFile.type === 'other') && getPreviewSources(selectedFile).length > 1 && (
                  <div className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-lg">
                    {getPreviewSources(selectedFile).map((source, idx) => (
                      <button
                        key={source.label}
                        onClick={() => setPreviewSourceIndex(idx)}
                        className={`px-2 py-1 text-xs rounded ${previewSourceIndex === idx
                            ? 'bg-yellow-500 text-black'
                            : 'text-gray-200 hover:bg-gray-700'
                          }`}
                        title={`Use ${source.label} preview`}
                      >
                        {source.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => downloadFile(selectedFile.url, selectedFile.name)}
                  className="p-2 bg-gray-900/80 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Download"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* File Content */}
              <div className="h-full pt-0">
                {renderFilePreview(selectedFile)}
              </div>

              {/* File Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">{selectedFile.name}</span>
                    <span className="text-gray-400 text-sm">{resolvedSizes[selectedFile.url] || 'Calculating...'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {files.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const currentIndex = files.findIndex(f => f.url === selectedFile.url);
                            const prevIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
                            handleFileSelect(files[prevIndex]);
                          }}
                          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <span className="text-gray-400 text-sm">
                          {files.findIndex(f => f.url === selectedFile.url) + 1} / {files.length}
                        </span>
                        <button
                          onClick={() => {
                            const currentIndex = files.findIndex(f => f.url === selectedFile.url);
                            const nextIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
                            handleFileSelect(files[nextIndex]);
                          }}
                          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a file to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FileViewer;
