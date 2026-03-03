"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import supabaseBrowserClient from '@/lib/supabase/client';
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchEmailLogs as fetchEmailLogsApi,
  fetchEmailLog,
  sendEmail,
} from '@/lib/emailService';

import dynamic from 'next/dynamic';
import { CheckCircle, XCircle, ChevronLeft, AlertTriangle, Loader2, Mail, Plus, Edit2, Search, RefreshCw, FileText, History, Trash2, Eye, Send, X, Undo2, Clock, ArrowLeft, ArrowRight, Moon, Sun } from 'lucide-react';
import { FC, ReactNode } from "react";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Simplified toolbar — no image insertion, only essential formatting
const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ['link'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
    matchers: [
      // Strip out images from pasted content
      ['img', () => ({ ops: [] })],
    ]
  },
};

// Email validation constants
const EMAIL_VALIDATION = {
  MIN_SUBJECT_LENGTH: 3,
  MAX_SUBJECT_LENGTH: 200,
  MAX_CONTENT_SIZE: 500000, // ~500KB of HTML
  MIN_CONTENT_LENGTH: 10,
};

// Utility functions for email validation
const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateEmailDomain = (email: string): boolean => {
  const commonTLDs = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'co', 'io', 'ai', 'app', 'dev'];
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const tld = domain.split('.').pop() || '';
  return commonTLDs.includes(tld) || tld.length >= 2;
};

const sanitizeHtmlContent = (html: string): string => {
  // Remove script tags and event handlers
  let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  return sanitized;
};

const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]+>/g, '');
};

const getContentLength = (html: string): number => {
  const text = stripHtmlTags(html);
  return text.trim().length;
};

const customStyles = `
  @keyframes flash {
    0% { background-color: rgba(234, 179, 8, 0.15); }
    100% { background-color: transparent; }
  }
  .animate-flash { animation: flash 2s ease-out; }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up { animation: slideUp 0.3s ease-out; }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in { animation: fadeIn 0.2s ease-out; }

  .ql-toolbar.ql-snow {
    border-top-left-radius: 0.75rem;
    border-top-right-radius: 0.75rem;
    border-color: #e5e7eb !important;
    background: #f9fafb;
    padding: 8px 12px !important;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    align-items: center;
  }
  .ql-toolbar.ql-snow .ql-formats {
    margin-right: 8px !important;
    display: inline-flex;
    align-items: center;
    gap: 1px;
    padding-right: 8px;
    border-right: 1px solid #e5e7eb;
  }
  .ql-toolbar.ql-snow .ql-formats:last-child {
    border-right: none;
    padding-right: 0;
    margin-right: 0 !important;
  }
  .ql-toolbar.ql-snow button {
    width: 32px !important;
    height: 32px !important;
    padding: 4px !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    border-radius: 8px !important;
    transition: all 0.15s ease;
    border: none !important;
  }
  .ql-toolbar.ql-snow button:hover {
    background: #e5e7eb !important;
  }
  .ql-toolbar.ql-snow button.ql-active {
    background: #fef3c7 !important;
    color: #b45309 !important;
  }
  .ql-toolbar.ql-snow button.ql-active .ql-stroke {
    stroke: #b45309 !important;
  }
  .ql-toolbar.ql-snow button.ql-active .ql-fill {
    fill: #b45309 !important;
  }
  .ql-toolbar.ql-snow button:hover .ql-stroke {
    stroke: #374151 !important;
  }
  .ql-toolbar.ql-snow button:hover .ql-fill {
    fill: #374151 !important;
  }
  .ql-toolbar.ql-snow .ql-picker {
    height: 32px !important;
    border-radius: 8px !important;
    transition: all 0.15s ease;
  }
  .ql-toolbar.ql-snow .ql-picker-label {
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    padding: 2px 8px !important;
    display: flex;
    align-items: center;
    height: 32px !important;
    font-size: 0.8125rem;
    color: #374151;
    transition: all 0.15s ease;
    background: white;
  }
  .ql-toolbar.ql-snow .ql-picker-label:hover {
    background: #f3f4f6;
    border-color: #d1d5db !important;
  }
  .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
    border-color: #f59e0b !important;
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
  }
  .ql-toolbar.ql-snow .ql-picker-options {
    border: 1px solid #e5e7eb !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important;
    padding: 4px !important;
    margin-top: 4px !important;
    background: white;
    overflow: hidden;
  }
  .ql-toolbar.ql-snow .ql-picker-item {
    border-radius: 8px !important;
    padding: 6px 12px !important;
    transition: all 0.1s ease;
  }
  .ql-toolbar.ql-snow .ql-picker-item:hover {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
  .ql-toolbar.ql-snow .ql-picker-item.ql-selected {
    background: #fef3c7 !important;
    color: #92400e !important;
  }

  /* Snow tooltip (link input) — modern styling, preserving Quill positioning */
  .ql-snow .ql-tooltip {
    background: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 14px !important;
    box-shadow: 0 20px 40px -8px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.06) !important;
    padding: 14px 18px !important;
    color: #374151 !important;
    z-index: 9999 !important;
    white-space: nowrap;
  }
  .ql-snow .ql-tooltip::before {
    font-size: 0.8125rem !important;
    color: #6b7280 !important;
    font-weight: 600 !important;
    margin-right: 8px !important;
  }
  .ql-snow .ql-tooltip input[type=text] {
    border: 1.5px solid #e5e7eb !important;
    border-radius: 10px !important;
    padding: 8px 14px !important;
    font-size: 0.8125rem !important;
    color: #111827 !important;
    background: #f9fafb !important;
    outline: none !important;
    width: 240px !important;
    height: auto !important;
    margin: 0 !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .ql-snow .ql-tooltip input[type=text]:focus {
    border-color: #f59e0b !important;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
    background: white !important;
  }

  /* Preview link in view mode */
  .ql-snow .ql-tooltip a.ql-preview {
    color: #2563eb !important;
    text-decoration: none !important;
    font-size: 0.8125rem !important;
    max-width: 200px !important;
    display: inline-block !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    vertical-align: middle !important;
  }

  /* Edit / Save button */
  .ql-snow .ql-tooltip a.ql-action {
    margin-left: 10px !important;
  }
  .ql-snow .ql-tooltip a.ql-action::after {
    content: 'Edit' !important;
    border-right: none !important;
    margin-left: 0 !important;
    padding: 7px 16px !important;
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    font-size: 0.8125rem !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    display: inline-block !important;
    line-height: 1.2 !important;
    text-decoration: none !important;
    vertical-align: middle !important;
  }
  .ql-snow .ql-tooltip a.ql-action:hover::after {
    background: #e5e7eb !important;
  }
  /* When editing, button says Save with amber style */
  .ql-snow .ql-tooltip.ql-editing a.ql-action::after {
    content: 'Save' !important;
    background: #f59e0b !important;
    color: #111827 !important;
  }
  .ql-snow .ql-tooltip.ql-editing a.ql-action:hover::after {
    background: #d97706 !important;
  }

  /* Remove button */
  .ql-snow .ql-tooltip a.ql-remove {
    margin-left: 6px !important;
  }
  .ql-snow .ql-tooltip a.ql-remove::before {
    content: 'Remove' !important;
    padding: 7px 16px !important;
    background: #fee2e2 !important;
    color: #b91c1c !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    font-size: 0.8125rem !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    display: inline-block !important;
    line-height: 1.2 !important;
    text-decoration: none !important;
    vertical-align: middle !important;
  }
  .ql-snow .ql-tooltip a.ql-remove:hover::before {
    background: #fecaca !important;
  }

  .ql-container.ql-snow {
    border-bottom-left-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
    border-color: #e5e7eb !important;
    font-size: 0.875rem;
    height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .ql-editor {
    flex: 1;
    color: #111827;
    padding: 16px 20px;
    line-height: 1.7;
    overflow-y: visible;
  }
  .ql-editor.ql-blank::before {
    color: #9ca3af;
    font-style: normal;
    padding-left: 4px;
  }
  
  /* Prevent images from displaying in editor */
  .ql-editor img {
    display: none !important;
  }
  
  /* Hide image button if it accidentally appears */
  .ql-toolbar .ql-image {
    display: none !important;
  }
`;

// --- TypeScript Interfaces and Types ---
interface Template {
  id: number;
  name: string;
  subject: string;
  content: string;
}

interface EmailLog {
  id: number;
  recipient: string;
  subject: string;
  status: 'Sent' | 'Failed';
  created_at: string;
  error_details: string | null;
  body: string | null;
}

interface User {
  id: string;
  email: string;
}

type TabName = 'send' | 'templates' | 'history';
type MessageState = { type: 'success' | 'error'; text: string } | null;
type TemplateView = 'list' | 'editor';

// --- Helper Components ---

// Modern Confirmation Modal with backdrop blur
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Confirm', cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-black animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6 ml-[52px]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Status badge with modern pill styling and ring accent */
const StatusBadge = ({ status }: { status: 'Sent' | 'Failed' | string }) => {
  if (status === 'Sent') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle className="w-3.5 h-3.5" />
        Sent
      </span>
    );
  }
  if (status === 'Failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200">
        <XCircle className="w-3.5 h-3.5" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 ring-1 ring-gray-200">
      {status}
    </span>
  );
};

/** Reusable alert banner with dismiss */
const AlertBanner = ({ message, onDismiss }: { message: MessageState; onDismiss?: () => void }) => {
  if (!message) return null;
  const isSuccess = message.type === 'success';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-slide-up ${
      isSuccess
        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
        : 'bg-red-50 text-red-800 ring-1 ring-red-200'
    }`}>
      {isSuccess ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />}
      <p className="flex-1">{message.text}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};


// --- Main EmailManagement Component ---

const EmailManagement = () => {
  // --- Component State ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('send');
  
  // Global State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [emailLog, setEmailLog] = useState<EmailLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // "Send" Tab State
  const [recipient, setRecipient] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendFormMessage, setSendFormMessage] = useState<MessageState>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // "Templates" Tab State
  const [templateView, setTemplateView] = useState<TemplateView>('list');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateMessage, setTemplateMessage] = useState<MessageState>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: number; name: string } | null>(null);
  const [lastDeletedTemplate, setLastDeletedTemplate] = useState<{ template: Template; originalIndex: number } | null>(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // "History" Tab State
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'Sent' | 'Failed'>('all');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [highlightedLogId, setHighlightedLogId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const emailsPerPage = 10;
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isLogDetailModalOpen, setIsLogDetailModalOpen] = useState(false);
  const [isFetchingBody, setIsFetchingBody] = useState(false);

  // --- Data Fetching ---

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('emailManagementDarkMode') === 'true';
    setIsDarkMode(savedDarkMode);
  }, []);

  // Update localStorage and apply theme to document
  useEffect(() => {
    localStorage.setItem('emailManagementDarkMode', isDarkMode.toString());
    const element = document.documentElement;
    if (isDarkMode) {
      element.setAttribute('data-theme', 'dark');
    } else {
      element.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const fetchEmailLogs = useCallback(async (page = 1) => {
    try {
      setIsHistoryLoading(true);
      const offset = (page - 1) * emailsPerPage;
      const { data, count } = await fetchEmailLogsApi({
        limit: emailsPerPage,
        offset,
        recipient: historySearch || undefined,
        status: historyStatusFilter === 'all' ? undefined : historyStatusFilter,
        sort: 'created_at',
        direction: 'desc',
      });

      const newLogs = data || [];
      setTotalLogs(count || 0);
      setEmailLog(prevLogs => {
        if (newLogs.length > 0 && prevLogs.length > 0 && newLogs[0].id !== prevLogs[0].id) {
          setHighlightedLogId(newLogs[0].id);
        }
        return newLogs;
      });
    } catch (error) {
      console.error('Error in fetchEmailLogs:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [emailsPerPage, historySearch, historyStatusFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setIsHistoryLoading(true);
      try {
        const [templatesResponse, usersResponse] = await Promise.all([
          fetchTemplates({ limit: 100 }),
          supabaseBrowserClient.from('users').select('id, email'),
        ]);

        setTemplates(templatesResponse.data || []);

        const { data: usersData, error: usersError } = usersResponse;
        if (usersError) console.error('Error fetching users:', usersError);
        else setUsers(usersData || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchEmailLogs(currentPage);
  }, [fetchEmailLogs, currentPage, historySearch, historyStatusFilter]);

  // --- Core Logic Handlers ---

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const errors = [];
    
    // Recipient validation
    if (!recipient) {
      errors.push("Recipient is required.");
    } else if (!validateEmailFormat(recipient)) {
      errors.push("Invalid email format.");
    } else if (!validateEmailDomain(recipient)) {
      errors.push("Email domain appears invalid.");
    }
    
    // Subject validation
    if (!subject.trim()) {
      errors.push("Subject is required.");
    } else if (subject.trim().length < EMAIL_VALIDATION.MIN_SUBJECT_LENGTH) {
      errors.push(`Subject must be at least ${EMAIL_VALIDATION.MIN_SUBJECT_LENGTH} characters.`);
    } else if (subject.length > EMAIL_VALIDATION.MAX_SUBJECT_LENGTH) {
      errors.push(`Subject cannot exceed ${EMAIL_VALIDATION.MAX_SUBJECT_LENGTH} characters.`);
    }
    
    // Content validation
    if (!customMessage.trim() || customMessage === '<p><br></p>') {
      errors.push("Message content cannot be empty.");
    } else {
      const contentLength = getContentLength(customMessage);
      if (contentLength < EMAIL_VALIDATION.MIN_CONTENT_LENGTH) {
        errors.push(`Message must be at least ${EMAIL_VALIDATION.MIN_CONTENT_LENGTH} characters.`);
      }
      if (customMessage.length > EMAIL_VALIDATION.MAX_CONTENT_SIZE) {
        errors.push(`Message content is too large (max ${EMAIL_VALIDATION.MAX_CONTENT_SIZE / 1000}KB).`);
      }
    }

    if (errors.length > 0) {
      setValidationError(errors.join(" "));
      return;
    }
    
    // Sanitize content before sending
    const sanitizedContent = sanitizeHtmlContent(customMessage);

    setIsSending(true);
    setSendFormMessage(null);

    try {
      await sendEmail({
        recipient: recipient.trim().toLowerCase(),
        subject: subject.trim(),
        body: sanitizedContent,
      });

      setSendFormMessage({ type: 'success', text: `Email sent successfully to ${recipient}!` });
      setRecipient('');
      setSubject('');
      setCustomMessage('');
      setSelectedTemplateId('');
      await fetchEmailLogs();
    } catch (error: any) {
      console.error('Failed to send email:', error);
      setSendFormMessage({ type: 'error', text: `Error: ${error?.message || 'Failed to send email'}` });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveTemplate = async (formData: { name: string, subject: string, content: string }) => {
    const isEditing = !!editingTemplate;
    setTemplateMessage(null);

    try {
      if (isEditing && editingTemplate) {
        const updated = await updateTemplate(editingTemplate.id, formData);
        setTemplates(prev => prev.map(t => (t.id === editingTemplate.id ? updated : t)));
      } else {
        const created = await createTemplate(formData);
        setTemplates(prev => [...prev, created]);
      }

      setTemplateMessage({ type: 'success', text: `Template "${formData.name}" ${isEditing ? 'updated' : 'created'} successfully!` });
      setTemplateView('list');
      setEditingTemplate(null);
    } catch (error: any) {
      setTemplateMessage({ type: 'error', text: `Failed to save template: ${error?.message || 'Unknown error'}` });
      console.error('Failed to save templates:', error);
    }
  };

  const handleDeleteTemplate = (templateId: number, templateName: string) => {
    setTemplateToDelete({ id: templateId, name: templateName });
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    const { id: templateId, name: templateName } = templateToDelete;
    setTemplateMessage(null);
    setIsConfirmModalOpen(false);
    setTemplateToDelete(null);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    try {
      await deleteTemplate(templateId);

      const originalIndex = templates.findIndex(t => t.id === templateId);
      const deletedTemplateData = templates.find(t => t.id === templateId);

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setTemplateMessage({ type: 'success', text: `Template "${templateName}" deleted successfully!` });

      if (deletedTemplateData && originalIndex !== -1) {
        setLastDeletedTemplate({ template: deletedTemplateData, originalIndex });
        setShowUndoNotification(true);
        undoTimerRef.current = setTimeout(() => {
          setShowUndoNotification(false);
          setLastDeletedTemplate(null);
        }, 5000);
      }
    } catch (error: any) {
      setTemplateMessage({ type: 'error', text: `Failed to delete template: ${error?.message || 'Unknown error'}` });
      console.error('Failed to delete template:', error);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedTemplate) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    setTemplateMessage(null);
    setShowUndoNotification(false);

    const { template: restoredTemplate, originalIndex } = lastDeletedTemplate;
    try {
      const recreated = await createTemplate({
        name: restoredTemplate.name,
        subject: restoredTemplate.subject,
        content: restoredTemplate.content,
      });

      const newTemplates = [...templates];
      newTemplates.splice(originalIndex, 0, recreated);

      setTemplates(newTemplates);
      setLastDeletedTemplate(null);
      setTemplateMessage({ type: 'success', text: `Template "${restoredTemplate.name}" restored successfully!` });
    } catch (error: any) {
      setTemplateMessage({ type: 'error', text: `Failed to undo deletion: ${error?.message || 'Unknown error'}` });
      console.error('Failed to undo deletion:', error);
    }
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === parseInt(selectedTemplateId));
    if (template) {
      setSubject(template.subject);
      setCustomMessage(template.content);
    }
  };

  const handleViewLogDetails = async (log: EmailLog) => {
    setSelectedLog(log);
    setIsLogDetailModalOpen(true);

    if (!log.body) {
      setIsFetchingBody(true);
      try {
        const data = await fetchEmailLog(log.id);
        setSelectedLog(prevLog => prevLog ? { ...prevLog, body: data.body } : null);
      } catch (error) {
        console.error("Error fetching email body:", error);
        setSelectedLog(prevLog => prevLog ? { ...prevLog, body: '<p>Failed to load email content.</p>' } : null);
      } finally {
        setIsFetchingBody(false);
      }
    }
  };
  
  // --- Child Components / Render Functions ---

  const TemplateEditor = () => {
    const [name, setName] = useState(editingTemplate?.name || '');
    const [editorSubject, setEditorSubject] = useState(editingTemplate?.subject || '');
    const [content, setContent] = useState(editingTemplate?.content || '');
    const [errors, setErrors] = useState({ name: '', subject: '', content: '' });

    useEffect(() => {
      if (editingTemplate) {
        setName(editingTemplate.name);
        setEditorSubject(editingTemplate.subject);
        setContent(editingTemplate.content);
      } else {
        setName('');
        setEditorSubject('');
        setContent('');
      }
    }, [editingTemplate]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors = { name: '', subject: '', content: '' };
      let hasError = false;

      // Template name validation
      if (!name.trim()) { 
        newErrors.name = "Template name is required."; 
        hasError = true; 
      } else if (name.trim().length < 2) {
        newErrors.name = "Template name must be at least 2 characters.";
        hasError = true;
      } else if (name.length > 100) {
        newErrors.name = "Template name cannot exceed 100 characters.";
        hasError = true;
      }
      
      // Subject validation
      if (!editorSubject.trim()) { 
        newErrors.subject = "Subject is required."; 
        hasError = true; 
      } else if (editorSubject.trim().length < EMAIL_VALIDATION.MIN_SUBJECT_LENGTH) {
        newErrors.subject = `Subject must be at least ${EMAIL_VALIDATION.MIN_SUBJECT_LENGTH} characters.`;
        hasError = true;
      } else if (editorSubject.length > EMAIL_VALIDATION.MAX_SUBJECT_LENGTH) {
        newErrors.subject = `Subject cannot exceed ${EMAIL_VALIDATION.MAX_SUBJECT_LENGTH} characters.`;
        hasError = true;
      }
      
      // Content validation
      if (!content.trim() || content === '<p><br></p>') { 
        newErrors.content = "Content cannot be empty."; 
        hasError = true; 
      } else {
        const contentLength = getContentLength(content);
        if (contentLength < EMAIL_VALIDATION.MIN_CONTENT_LENGTH) {
          newErrors.content = `Content must be at least ${EMAIL_VALIDATION.MIN_CONTENT_LENGTH} characters.`;
          hasError = true;
        }
        if (content.length > EMAIL_VALIDATION.MAX_CONTENT_SIZE) {
          newErrors.content = `Content is too large (max ${EMAIL_VALIDATION.MAX_CONTENT_SIZE / 1000}KB).`;
          hasError = true;
        }
      }

      setErrors(newErrors);
      if (!hasError) {
        // Sanitize content before saving
        const sanitizedContent = sanitizeHtmlContent(content);
        handleSaveTemplate({ name: name.trim(), subject: editorSubject.trim(), content: sanitizedContent });
      }
    };

    return (
      <div className="max-w-3xl mx-auto animate-slide-up">
        <button
          onClick={() => setTemplateView('list')}
          className="group flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
          Back to Templates
        </button>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
              {editingTemplate ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingTemplate ? 'Modify the template details below' : 'Fill in the details to create a reusable template'}
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="templateName" className="block text-sm font-semibold text-gray-700 mb-1.5">Template Name</label>
              <input
                type="text" id="templateName" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Welcome Email, Status Update..."
                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-sm text-gray-900 bg-gray-50/50 placeholder:text-gray-400 transition-all"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="templateSubject" className="block text-sm font-semibold text-gray-700 mb-1.5">Subject Line</label>
              <input
                type="text" id="templateSubject" value={editorSubject}
                onChange={(e) => setEditorSubject(e.target.value)}
                placeholder="Email subject line..."
                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-sm text-gray-900 bg-gray-50/50 placeholder:text-gray-400 transition-all"
              />
              {!errors.subject && (
                <p className={`text-xs mt-1 ${
                  editorSubject.length > EMAIL_VALIDATION.MAX_SUBJECT_LENGTH 
                    ? 'text-red-500' 
                    : editorSubject.length > EMAIL_VALIDATION.MAX_SUBJECT_LENGTH * 0.9 
                    ? 'text-amber-600' 
                    : 'text-gray-400'
                }`}>
                  {editorSubject.length} / {EMAIL_VALIDATION.MAX_SUBJECT_LENGTH} characters
                </p>
              )}
              {errors.subject && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.subject}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Content</label>
                <span className="text-xs text-gray-400">Images not allowed</span>
              </div>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                placeholder="Write your template content..."
                modules={QUILL_MODULES}
              />
              {!errors.content && (
                <p className={`text-xs mt-1.5 ${
                  content.length > EMAIL_VALIDATION.MAX_CONTENT_SIZE
                    ? 'text-red-500'
                    : content.length > EMAIL_VALIDATION.MAX_CONTENT_SIZE * 0.9
                    ? 'text-amber-600'
                    : 'text-gray-400'
                }`}>
                  {getContentLength(content)} characters ({(content.length / 1000).toFixed(1)}KB / {EMAIL_VALIDATION.MAX_CONTENT_SIZE / 1000}KB)
                </p>
              )}
              {errors.content && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.content}</p>}
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Live Preview</p>
              <div className="border rounded-xl bg-gray-50 p-4 shadow-inner">
                <h4 className="text-base font-semibold text-gray-900 mb-3">{editorSubject || 'Email subject'}</h4>
                <div
                  className="prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: content || '<p>Your content will appear here.</p>' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setTemplateView('list')} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-black bg-gradient-to-r from-yellow-400 to-amber-400 rounded-xl hover:from-yellow-500 hover:to-amber-500 transition-all shadow-sm shadow-yellow-200">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ===== SEND EMAIL TAB =====
  const renderSendEmailView = () => {
    const handleClearForm = () => {
      setRecipient('');
      setSubject('');
      setCustomMessage('');
      setSendFormMessage(null);
      setValidationError(null);
      setSelectedTemplateId('');
    };

    return (
      <form onSubmit={handleSendEmail} className="animate-slide-up">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Compose Email</h3>
                <p className="text-sm text-gray-500">Send a personalized email to a user</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Recipient & Subject row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="recipient" className="block text-sm font-semibold text-gray-700 mb-1.5">Recipient</label>
                <select
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-sm text-gray-900 bg-gray-50/50 transition-all"
                  required
                >
                  <option value="" disabled>Select a user...</option>
                  {users.map(user => <option key={user.id} value={user.email}>{user.email}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text" id="subject" value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-sm text-gray-900 bg-gray-50/50 placeholder:text-gray-400 transition-all"
                  required
                />
                <p className={`text-xs mt-1 ${
                  subject.length > EMAIL_VALIDATION.MAX_SUBJECT_LENGTH 
                    ? 'text-red-500' 
                    : subject.length > EMAIL_VALIDATION.MAX_SUBJECT_LENGTH * 0.9 
                    ? 'text-amber-600' 
                    : 'text-gray-400'
                }`}>
                  {subject.length} / {EMAIL_VALIDATION.MAX_SUBJECT_LENGTH} characters
                </p>
              </div>
            </div>

            {/* Template selector */}
            <div>
              <label htmlFor="template" className="block text-sm font-semibold text-gray-700 mb-1.5">Quick Template</label>
              <div className="flex gap-2">
                <select
                  id="template"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-sm text-gray-900 bg-gray-50/50 transition-all"
                >
                  <option value="" disabled>Select a template to apply...</option>
                  {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplateId}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Message Content</label>
                <span className="text-xs text-gray-400">Images not allowed</span>
              </div>
              <ReactQuill
                theme="snow"
                value={customMessage}
                onChange={setCustomMessage}
                placeholder="Write your email message here..."
                modules={QUILL_MODULES}
              />
              <p className={`text-xs mt-1.5 ${
                customMessage.length > EMAIL_VALIDATION.MAX_CONTENT_SIZE
                  ? 'text-red-500'
                  : customMessage.length > EMAIL_VALIDATION.MAX_CONTENT_SIZE * 0.9
                  ? 'text-amber-600'
                  : 'text-gray-400'
              }`}>
                {getContentLength(customMessage)} characters ({(customMessage.length / 1000).toFixed(1)}KB / {EMAIL_VALIDATION.MAX_CONTENT_SIZE / 1000}KB)
              </p>
            </div>

            {/* Alerts */}
            {validationError && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-700 ring-1 ring-red-200 animate-slide-up">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p>{validationError}</p>
              </div>
            )}
            <AlertBanner message={sendFormMessage} onDismiss={() => setSendFormMessage(null)} />
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClearForm}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-black bg-gradient-to-r from-yellow-400 to-amber-400 rounded-xl hover:from-yellow-500 hover:to-amber-500 transition-all shadow-sm shadow-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Email</>
              )}
            </button>
          </div>
        </div>
      </form>
    );
  };

  // ===== TEMPLATES TAB =====
  const renderTemplatesView = () => (
    <div className="space-y-6 animate-slide-up">
      {templateView === 'list' ? (
        <>
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Email Templates</h3>
              <p className="text-sm text-gray-500 mt-0.5">{templates.length} template{templates.length !== 1 ? 's' : ''} available</p>
            </div>
            <button
              onClick={() => { setEditingTemplate(null); setTemplateView('editor'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-gradient-to-r from-yellow-400 to-amber-400 rounded-xl hover:from-yellow-500 hover:to-amber-500 transition-all shadow-sm shadow-yellow-200"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>

          <AlertBanner message={templateMessage} onDismiss={() => setTemplateMessage(null)} />

          {/* Undo Toast */}
          {showUndoNotification && lastDeletedTemplate && (
            <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-slide-up">
              <Trash2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">Template &ldquo;{lastDeletedTemplate.template.name}&rdquo; deleted.</span>
              <button
                onClick={handleUndoDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </button>
            </div>
          )}

          {/* Template Cards Grid */}
          {templates.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-1">No templates yet</h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Create your first email template to speed up your workflow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div key={template.id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col transition-all duration-200 hover:shadow-md hover:border-gray-300">
                  <div className="flex-grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 leading-tight">{template.name}</h3>
                      <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Subject: <span className="text-gray-700">{template.subject}</span></p>
                    <div
                      className="text-xs text-gray-700 line-clamp-3 leading-relaxed prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: template.content }}
                    />
                  </div>
                  <div className="flex gap-1 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => { setEditingTemplate(template); setTemplateView('editor'); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <TemplateEditor />
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${templateToDelete?.name}"? You can undo this within 5 seconds.`}
        confirmText="Delete"
      />
    </div>
  );

  // ===== HISTORY TAB =====
  const renderHistoryView = () => {
    const indexOfLastEmail = currentPage * emailsPerPage;
    const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
    const currentEmails = emailLog;
    const totalPages = Math.max(1, Math.ceil(totalLogs / emailsPerPage));
    const paginate = (pageNumber: number) => {
      setCurrentPage(pageNumber);
      fetchEmailLogs(pageNumber);
    };

    return (
      <div className="space-y-5 animate-slide-up">
        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by recipient..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-sm text-gray-900 bg-gray-50/50 placeholder:text-gray-400 transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex gap-2">
              {(['all', 'Sent', 'Failed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setHistoryStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    historyStatusFilter === status
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchEmailLogs(currentPage)}
              disabled={isHistoryLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isHistoryLoading ? 'animate-spin' : ''}`} />
              {isHistoryLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Email Log Table */}
        <style>{customStyles}</style>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">Recipient</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">Subject</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">Date</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentEmails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No email logs found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                currentEmails.map((log) => (
                  <tr
                    key={log.id}
                    className={`${highlightedLogId === log.id ? 'animate-flash' : ''} hover:bg-gray-50/50 transition-colors`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{log.recipient}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[250px] truncate">{log.subject}</td>
                    <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewLogDetails(log)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalLogs > emailsPerPage && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{indexOfFirstEmail + 1}</span> to <span className="font-medium text-gray-700">{Math.min(indexOfLastEmail, totalLogs)}</span> of <span className="font-medium text-gray-700">{totalLogs}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2)
                ).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== LOG DETAIL MODAL =====
  const LogDetailModal = () => {
    if (!isLogDetailModalOpen || !selectedLog) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl text-black animate-slide-up overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Email Details</h3>
            </div>
            <button
              onClick={() => setIsLogDetailModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Recipient</p>
                <p className="text-sm font-semibold text-gray-900 break-all">{selectedLog.recipient}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Status</p>
                <div className="mt-0.5"><StatusBadge status={selectedLog.status} /></div>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Subject</p>
                <p className="text-sm font-semibold text-gray-900">{selectedLog.subject}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Date Sent</p>
                <p className="text-sm font-semibold text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
            </div>

            {selectedLog.status === 'Failed' && selectedLog.error_details && (
              <div className="bg-red-50 rounded-xl px-4 py-3 ring-1 ring-red-200">
                <p className="text-xs font-medium text-red-600 mb-0.5">Error Details</p>
                <p className="text-sm text-red-800">{selectedLog.error_details}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Content</p>
              {isFetchingBody ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Loading content...</span>
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none border border-gray-200 p-4 rounded-xl bg-gray-50/50 max-h-72 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedLog.body || '<p class="text-gray-400">No content available.</p>' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  const tabs = [
    { name: 'Send Email', id: 'send' as TabName, icon: Send },
    { name: 'Templates', id: 'templates' as TabName, icon: FileText },
    { name: 'History', id: 'history' as TabName, icon: History },
  ];

  return (
    <div className="w-full transition-colors duration-500 ease-out">
      <style>{customStyles}</style>

      {/* Modern Pill Tabs */}
      <div className="mb-8">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 gap-1 transition-colors duration-300">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-yellow-500' : ''}`} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'send' && renderSendEmailView()}
        {activeTab === 'templates' && renderTemplatesView()}
        {activeTab === 'history' && renderHistoryView()}
      </div>
      <LogDetailModal />

      {/* Dark Mode Toggle Button - Bottom Right */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 dark:from-yellow-400 dark:to-amber-400 text-white dark:text-gray-900 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:scale-110 active:scale-95"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default EmailManagement;
