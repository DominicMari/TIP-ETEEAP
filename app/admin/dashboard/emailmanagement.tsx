"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import supabaseBrowserClient from '@/lib/supabase/client';

import dynamic from 'next/dynamic';
import { CheckCircle, XCircle, ChevronLeft, AlertTriangle, Loader2, Mail, Plus, Edit2, Search, RefreshCw, FileText, History, Trash2 } from 'lucide-react';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// keyframes for the highlight animation
const highlightAnimation = `
  @keyframes flash {
    0% { background-color: rgba(252, 211, 77, 0.5); } /* yellow-300 with 50% opacity */
    100% { background-color: transparent; }
  }
  .animate-flash { animation: flash 2s ease-out; }
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
}

interface User {
  id: string;
  email: string;
}

type TabName = 'send' | 'templates' | 'history';
type MessageState = { type: 'success' | 'error'; text: string } | null;
type TemplateView = 'list' | 'editor';

// --- Helper Components ---

// Confirmation Modal Component
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
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-black">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders a colored status badge with an icon and hover tooltip for errors.
 */
const StatusBadge = ({ status }: { status: 'Sent' | 'Failed' | string }) => {
  const baseClasses = "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit";
  
  const content = {
    Sent: {
      icon: <CheckCircle className="w-4 h-4" />,
      text: "Sent",
      className: "bg-green-100 text-green-800",
    },
    Failed: {
      icon: <XCircle className="w-4 h-4" />,
      text: "Failed",
      className: "bg-red-100 text-red-800",
    },
    Default: {
      icon: null,
      text: status,
      className: "bg-gray-100 text-gray-800",
    },
  };

  const currentStatus = status === 'Sent' || status === 'Failed' ? content[status] : content.Default;

  return (
    <span className={`${baseClasses} ${currentStatus.className}`}>
      {currentStatus.icon}
      {currentStatus.text}
    </span>
  );
};


// --- Main EmailManagement Component ---

const EmailManagement = () => {
  // --- Component State ---
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

  // --- Data Fetching and Effects ---

  const fetchEmailLogs = useCallback(async () => {
    console.log("[EmailManagement] Fetching from '/api/email-history'...");
    try {
      setIsHistoryLoading(true);

      const response = await fetch('/api/email-history');

      if (!response.ok) {
        throw new Error('Failed to fetch email logs');
      }
      const data = await response.json();

      const newLogs = data || [];
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
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsHistoryLoading(true); // Set loading true for all initial fetches
      try {
        const [templatesResponse, usersResponse, emailLogsResponse] = await Promise.all([
          fetch('/api/templates'),
          supabaseBrowserClient.from('users').select('id, email'),
          fetch('/api/email-history'),
        ]);

        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);

        const { data: usersData, error: usersError } = usersResponse;
        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          setUsers(usersData || []);
        }

        const emailLogsData = await emailLogsResponse.json();
        if (emailLogsResponse.ok) {
          setEmailLog(emailLogsData || []);
        } else {
          console.error('Error fetching email logs:', emailLogsData.error || 'Unknown error');
        }
      } catch (error) {
      } finally {
        setIsHistoryLoading(false); // All initial fetches are done
      }
    };
    fetchData();
  }, []); // Remove dependency to run only once on mount

  // --- Core Logic Handlers ---

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const errors = [];
    if (!recipient) errors.push("Recipient is required.");
    if (!subject.trim()) errors.push("Subject is required.");
    if (!customMessage.trim() || customMessage === '<p><br></p>') errors.push("Message content cannot be empty.");

    if (errors.length > 0) {
      setValidationError(errors.join(" "));
      return;
    }

    setIsSending(true);
    setSendFormMessage(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          subject,
          body: customMessage,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSendFormMessage({ type: 'success', text: `Email sent successfully to ${recipient}!` });
        setRecipient('');
        setSubject('');
        setCustomMessage('');
        setSelectedTemplateId('');
        await fetchEmailLogs(); // Refresh history and wait for it to complete
      } else {
        setSendFormMessage({ type: 'error', text: `Error: ${result.error || 'Failed to send email'}` });
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      setSendFormMessage({ type: 'error', text: 'Error: An unexpected error occurred.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveTemplate = async (formData: { name: string, subject: string, content: string }) => {
    const isEditing = !!editingTemplate;
    setTemplateMessage(null);

    let updatedTemplatesLocally: Template[];

    if (isEditing) {
      updatedTemplatesLocally = templates.map(t => 
        t.id === editingTemplate.id ? { ...t, ...formData } : t
      );
    } else {
      const newTemplate: Template = { id: Date.now(), ...formData };
      updatedTemplatesLocally = [...templates, newTemplate];
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplatesLocally),
      });

      const result = await response.json();

      if (response.ok) {
        setTemplates(updatedTemplatesLocally);
        setTemplateMessage({ type: 'success', text: `Template "${formData.name}" ${isEditing ? 'updated' : 'created'} successfully!` });
        setTemplateView('list');
        setEditingTemplate(null);
      } else {
        setTemplateMessage({ type: 'error', text: `Failed to save template: ${result.error || 'Unknown error'}` });
        console.error('Failed to save templates:', result.error);
      }
    } catch (error) {
      setTemplateMessage({ type: 'error', text: 'An unexpected error occurred while saving the template.' });
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
    
        // Clear any existing undo timer
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
        }
    
        try {
          const response = await fetch(`/api/templates?id=${templateId}`, {
            method: 'DELETE',
          });
    
          if (response.ok) {
            // Find the original index before filtering
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
              }, 5000); // Hide undo notification after 5 seconds
            }
          } else {
            const result = await response.json();
            setTemplateMessage({ type: 'error', text: `Failed to delete template: ${result.error || 'Unknown error'}` });
            console.error('Failed to delete template:', result.error);
          }
            } catch (error) {
              setTemplateMessage({ type: 'error', text: 'An unexpected error occurred while deleting the template.' });
              console.error('Failed to delete template:', error);
            }
          };
        
          const handleUndoDelete = async () => {
            if (!lastDeletedTemplate) return;
        
            // Clear the auto-hide timer if undo is clicked
            if (undoTimerRef.current) {
              clearTimeout(undoTimerRef.current);
            }
        
            setTemplateMessage(null);
            setShowUndoNotification(false);
        
            const { template: restoredTemplate, originalIndex } = lastDeletedTemplate;
        
            // Re-insert the template into the local state at its original position
            const newTemplates = [...templates];
            newTemplates.splice(originalIndex, 0, restoredTemplate);
        
            try {
              const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTemplates),
              });
        
              if (response.ok) {
                setTemplates(newTemplates);
                setLastDeletedTemplate(null);
                setTemplateMessage({ type: 'success', text: `Template "${restoredTemplate.name}" restored successfully!` });
              } else {
                const result = await response.json();
                setTemplateMessage({ type: 'error', text: `Failed to undo deletion: ${result.error || 'Unknown error'}` });
                console.error('Failed to undo deletion:', result.error);
              }
            } catch (error) {
              setTemplateMessage({ type: 'error', text: 'An unexpected error occurred while undoing deletion.' });
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
          };  // --- Child Components / Render Functions ---

  const TemplateEditor = () => {
    const [name, setName] = useState(editingTemplate?.name || '');
    const [subject, setSubject] = useState(editingTemplate?.subject || '');
    const [content, setContent] = useState(editingTemplate?.content || '<p>Start writing your template here...</p>');
    const [errors, setErrors] = useState({ name: '', subject: '', content: '' });

    useEffect(() => {
      if (editingTemplate) {
        setName(editingTemplate.name);
        setSubject(editingTemplate.subject);
        setContent(editingTemplate.content);
      } else {
        setName('');
        setSubject('');
        setContent('<p>Start writing your template here...</p>');
      }
    }, [editingTemplate]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors = { name: '', subject: '', content: '' };
      let hasError = false;

      if (!name.trim()) {
        newErrors.name = "Template name is required.";
        hasError = true;
      }
      if (!subject.trim()) {
        newErrors.subject = "Subject is required.";
        hasError = true;
      }
      if (!content.trim() || content === '<p>Start writing your template here...</p>' || content === '<p><br></p>') {
        newErrors.content = "Content cannot be empty.";
        hasError = true;
      }

      setErrors(newErrors);

      if (!hasError) {
        handleSaveTemplate({ name, subject, content });
      }
    };

    return (
      <div className="max-w-3xl">
        <button 
          onClick={() => setTemplateView('list')}
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Templates
        </button>
        <h3 className="text-xl font-semibold mb-4">
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text" id="templateName" value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="templateSubject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text" id="templateSubject" value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
              required
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              className="mt-1 bg-white"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                  ['link', 'image'],
                  ['clean']
                ],
                imageResize: { // This module might not be available in react-quill-new, but it's a common extension
                  modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
                }
              }}
            />
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setTemplateView('list')} className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
            <button type="submit" className="bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2">Save Template</button>
          </div>
        </form>
      </div>
    );
  };

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
      <form onSubmit={handleSendEmail} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
              <select
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
                required
              >
                <option value="" disabled>Select a user</option>
                {users.map(user => <option key={user.id} value={user.email}>{user.email}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text" id="subject" value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
                required
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">Use Template</label>
          <div className="flex gap-2">
            <select
              id="template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
            >
              <option value="" disabled>Select a template</option>
              {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
            >
              Apply
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
          <ReactQuill
            theme="snow"
            value={customMessage}
            onChange={setCustomMessage}
            className="mt-1 bg-white"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
              ],
              imageResize: { // This module might not be available in react-quill-new, but it's a common extension
                modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
              }
            }}
          />
        </div>
        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-red-50 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <p>{validationError}</p>
          </div>
        )}
        {sendFormMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${sendFormMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {sendFormMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <p>{sendFormMessage.text}</p>
          </div>
        )}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={handleClearForm} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300">Clear</button>
          <button type="submit" disabled={isSending} className="w-full max-w-xs flex items-center justify-center bg-yellow-400 text-black py-2.5 px-4 rounded-lg font-semibold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</> : <><Mail className="mr-2 h-5 w-5" /> Send Email</>}
          </button>
        </div>
      </form>
    );
  };

  const renderTemplatesView = () => (
    <div className="space-y-6">
      {templateView === 'list' ? (
        <>
          <div className="flex justify-end">
            <button 
              onClick={() => { setEditingTemplate(null); setTemplateView('editor'); }}
              className="flex items-center gap-2 bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5" />
              Create New Template
            </button>
          </div>
          {templateMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${templateMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {templateMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <p>{templateMessage.text}</p>
            </div>
          )}
          {showUndoNotification && lastDeletedTemplate && (
            <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
              <span>Template "{lastDeletedTemplate.template.name}" deleted.</span>
              <button
                onClick={handleUndoDelete}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm font-medium"
              >
                Undo
              </button>
            </div>
          )}
          {showUndoNotification && lastDeletedTemplate && (
            <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
              <span>Template "{lastDeletedTemplate.template.name}" deleted.</span>
              <button
                onClick={handleUndoDelete}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm font-medium"
              >
                Undo
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map(template => (
              <div key={template.id} className="p-5 border rounded-xl shadow-sm bg-white flex flex-col transition-all duration-300 hover:shadow-lg">
                <div className="flex-grow">
                  <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1"><strong>Subject:</strong> {template.subject}</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">{template.content.replace(/<[^>]+>/g, '')}</p>
                </div>
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => { setEditingTemplate(template); setTemplateView('editor'); }}
                    className="flex items-center gap-1.5 text-sm font-medium text-yellow-600 hover:text-yellow-800"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <TemplateEditor />
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete the template "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );

  const filteredEmailLog = emailLog.filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = historyStatusFilter === 'all' || log.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderHistoryView = () => {
    const indexOfLastEmail = currentPage * emailsPerPage;
    const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
    const currentEmails = filteredEmailLog.slice(indexOfFirstEmail, indexOfLastEmail);

    const totalPages = Math.ceil(filteredEmailLog.length / emailsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by recipient..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <select
            value={historyStatusFilter}
            onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm bg-white text-black"
          >
            <option value="all">All Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
          </select>
          <button
            onClick={() => fetchEmailLogs()}
            disabled={isHistoryLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-wait"
          >
            <RefreshCw className={`w-4 h-4 ${isHistoryLoading ? 'animate-spin' : ''}`} />
            {isHistoryLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="overflow-x-auto">
          {/* Inject the animation styles */}
          <style>{highlightAnimation}</style>
          <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentEmails.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">No logs found.</td>
                  </tr>
                ) : (
                  currentEmails.map((log) => (
                    <tr 
                      key={log.id} 
                      className={`${
                        highlightedLogId === log.id ? 'animate-flash' : ''
                      } transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{log.recipient}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Pagination Controls */}
        {filteredEmailLog.length > emailsPerPage && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  // --- Main Render ---

  const tabs = [
    { name: 'Send Email', id: 'send', icon: Mail },
    { name: 'Templates', id: 'templates', icon: FileText },
    { name: 'History', id: 'history', icon: History },
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.id as TabName)}
              className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                    ? 'border-yellow-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                focus:outline-none
              `}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'send' && renderSendEmailView()}
        {activeTab === 'templates' && renderTemplatesView()}
        {activeTab === 'history' && renderHistoryView()}
      </div>
    </div>
  );
};

export default EmailManagement;
