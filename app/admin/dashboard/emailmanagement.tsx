"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

import {
  Mail, FileText, History, Loader2, AlertTriangle, CheckCircle,
  X, Eye, Plus, Edit2, Search, RefreshCw, ChevronLeft
} from 'lucide-react';
import supabase from "../../../lib/supabase/client"; 

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// --- Types ---
interface Template {
  id: number;
  name: string;
  subject: string;
  content: string; 
}

interface EmailLog {
  id: number;
  recipient: string;
  template: string;
  status: 'Sent' | 'Failed';
  date: string;
  error?: string;
}

interface LoginEvent {
  id: string; 
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null; 
}

interface UserSummary {
  email: string;
  name: string | null;
  avatar_url: string | null;
  last_login: string | null;
  login_count: number;
}

type TabName = 'send' | 'templates' | 'history';
type MessageState = {
  type: 'success' | 'error';
  text: string;
} | null;

type TemplateView = 'list' | 'editor';

// --- Helper Components ---
const StatusBadge = ({ status }: { status: 'Sent' | 'Failed' | string }) => {
  const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
  if (status === 'Sent') {
    return <span className={`${baseClasses} bg-green-100 text-green-800`}>Sent</span>;
  }
  if (status === 'Failed') {
    return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
  }
  return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
};




interface RichTextEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ initialHtml, onChange }: RichTextEditorProps) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      [{ 'align': [] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['clean']
    ],
  };

  return (
    <ReactQuill
      theme="snow"
      value={initialHtml}
      onChange={onChange}
      modules={modules}
      className="bg-white"
    />
  );
};


// --- Main Component ---

const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState<TabName>('send');
  
  // --- Global State ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [emailLog, setEmailLog] = useState<EmailLog[]>([]);
  const [previewingTemplate, setPreviewingTemplate] = useState<Template | null>(null);
  const [applicants, setApplicants] = useState<UserSummary[]>([]);

  // --- "Send" Tab State ---
  const [recipient, setRecipient] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(1);
  const [subject, setSubject] = useState('');
  const [customMessage, setCustomMessage] = useState(''); // This holds HTML
  const [isSending, setIsSending] = useState(false);
  const [sendFormMessage, setSendFormMessage] = useState<MessageState>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- "Templates" Tab State ---
  const [templateView, setTemplateView] = useState<TemplateView>('list');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // --- "History" Tab State ---
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'Sent' | 'Failed'>('all');

  // --- Effects ---

  useEffect(() => {
    const fetchLoginEvents = async () => {
      console.log("Fetching login events...");
      const { data, error } = await supabase
        .from("user_login_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching login events:", error.message);
      } else {
        console.log("Fetched login events:", data);
        const summaryMap = new Map<string, UserSummary>();
        data.forEach(log => {
          if (!log.email) {
              return;
          };

          if (summaryMap.has(log.email)) {
            const existing = summaryMap.get(log.email)!;
            existing.login_count += 1;
          } else {
            summaryMap.set(log.email, {
              email: log.email,
              name: log.name,
              avatar_url: log.avatar_url,
              last_login: log.created_at,
              login_count: 1,
            });
          }
        });
        setApplicants(Array.from(summaryMap.values()));
      }
    };

    // MOCK DATA: Note that 'content' is now HTML
    const emailTemplatesFromApi = [
      { id: 1, name: 'Application Confirmation', subject: 'Your Application has been Received', content: '<p>Dear Applicant,</p><p>Thank you for submitting your application. We have received it successfully.</p><p>Best regards,<br/>The Admissions Team</p>' },
      { id: 2, name: 'Missing Documents Reminder', subject: 'Action Required: Please Submit Additional Documents', content: '<p>Dear Applicant,</p><p>We require additional documents to proceed with your application. Please log in to the portal to see the requirements.</p><p>Best regards,<br/>The Admissions Team</p>' },
      { id: 3, name: 'Application Approved', subject: 'Congratulations! Your Application has been Approved', content: '<p>Dear Applicant,</p><p>Congratulations! Your application has been approved. We will contact you shortly with the next steps.</p><p>Best regards,<br/>The Admissions Team</p>' },
    ];

    setTemplates(emailTemplatesFromApi);
    fetchLoginEvents();
  }, []);

  // Subject and message when template changes
  useEffect(() => {
    const newTemplate = templates.find(t => t.id === selectedTemplateId);
    if (newTemplate) {
      setSubject(newTemplate.subject);
      // Load HTML content directly. No more newline conversion.
      setCustomMessage(newTemplate.content);
    }
  }, [selectedTemplateId, templates]);

  // --- Logic ---
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null); // Clear previous errors

    // --- Validation ---
    const errors = [];
    if (!recipient) {
        errors.push("Recipient is required.");
    }
    if (!subject.trim()) {
        errors.push("Subject is required.");
    }
    if (!customMessage.trim() || customMessage === '<p><br></p>') { // Check for empty editor
        errors.push("Message content cannot be empty.");
    }

    if (errors.length > 0) {
        setValidationError(errors.join(" "));
        return;
    }
    // --- End Validation ---

    setIsSending(true);
    setSendFormMessage(null);

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      setSendFormMessage({ type: 'error', text: 'Selected template not found.' });
      setIsSending(false);
      return;
    }

    const finalBody = customMessage; // 'customMessage' is already HTML

    try {
      console.log('Sending email:', {
        recipient,
        subject,
        body: finalBody,
      });

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: recipient,
          subject: subject,
          templateId: selectedTemplateId,
          body: finalBody // Send the full HTML body
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSendFormMessage({ type: 'success', text: `Email sent successfully to ${recipient}!` });
        setRecipient('');
        // Clear editor by resetting to the default template's HTML content
        const defaultTemplate = templates[0];
        setSelectedTemplateId(defaultTemplate.id);
        setSubject(defaultTemplate.subject);
        setCustomMessage(defaultTemplate.content); // Use HTML content
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

  // template save logic 
  const handleSaveTemplate = (formData: { name: string, subject: string, content: string }) => {
    if (editingTemplate) {
      const updatedTemplate = { ...editingTemplate, ...formData };
      setTemplates(templates.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
    } else {
      // Create new template
      const newTemplate: Template = {
        id: Date.now(), // simple mock ID
        ...formData
      };
      setTemplates([...templates, newTemplate]);
    }
    setTemplateView('list');
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  // --- Sub-Components ---
  const TemplatePreviewModal = () => (
    <div 
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={() => setPreviewingTemplate(null)}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent click from closing modal
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Preview: {previewingTemplate?.name}</h3>
          <button 
            onClick={() => setPreviewingTemplate(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
          <p className="text-lg font-semibold text-black mb-4 p-3 bg-gray-50 rounded-md">
            {previewingTemplate?.subject}
          </p>
          
          <label className="block text-sm font-medium text-gray-600 mb-1">Content</label>
          <div 
            className="text-black p-3 border rounded-md"
            dangerouslySetInnerHTML={{ __html: previewingTemplate?.content || '' }}
          />
        </div>
        <div className="p-4 bg-gray-50 border-t rounded-b-lg text-right">
          <button
            onClick={() => setPreviewingTemplate(null)}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

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
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text" id="templateName" value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="templateSubject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text" id="templateSubject" value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
              required
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <RichTextEditor
              key={editingTemplate?.id || 'new-template'}
              initialHtml={content}
              onChange={setContent}
            />
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setTemplateView('list')}
              className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    );
  };

  // --- Tab Content Components ---

  const renderSendEmailView = () => {
    const handleClearForm = () => {
        setRecipient('');
        const defaultTemplate = templates[0];
        if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
            setSubject(defaultTemplate.subject);
            setCustomMessage(defaultTemplate.content);
        } else {
            setSubject('');
            setCustomMessage('');
        }
        setSendFormMessage(null);
        setValidationError(null);
    };

    return (
        <form onSubmit={handleSendEmail} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                            Recipient Email
                        </label>
                        <select
                            id="recipient"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-900"
                            required
                        >
                            <option value="" disabled>Select a recipient</option>
                            {applicants.map(applicant => (
                                <option key={applicant.email} value={applicant.email}>{applicant.email}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Template
                        </label>
                        <div className="flex gap-2">
                            <select
                                id="template"
                                value={selectedTemplateId}
                                onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm bg-white text-black"
                            >
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>{template.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setPreviewingTemplate(templates.find(t => t.id === selectedTemplateId) || null)}
                                className="mt-1 flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
                            >
                                <Eye className="w-4 h-4" /> Preview
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                            Subject
                        </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                <RichTextEditor
                    key={selectedTemplateId}
                    initialHtml={customMessage}
                    onChange={setCustomMessage}
                />
                <p className="mt-2 text-xs text-gray-500">
                    The template content is pre-loaded. You can edit it directly.
                </p>
            </div>

            {validationError && (
                <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-red-50 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <p>{validationError}</p>
                </div>
            )}

            {sendFormMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${ 
                    sendFormMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                }`}> 
                    {sendFormMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p>{sendFormMessage.text}</p>
                </div>
            )}

            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={handleClearForm}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
                >
                    Clear
                </button>
                <button 
                    type="submit" disabled={isSending}
                    className="w-full max-w-xs flex items-center justify-center bg-yellow-400 text-black py-2.5 px-4 rounded-lg font-semibold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                    ) : (
                        <><Mail className="mr-2 h-5 w-5" /> Send Email</>
                    )}
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
              onClick={() => {
                setEditingTemplate(null);
                setTemplateView('editor');
              }}
              className="flex items-center gap-2 bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5" />
              Create New Template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map(template => (
              <div key={template.id} className="p-5 border rounded-xl shadow-sm bg-white flex flex-col transition-all duration-300 hover:shadow-lg">
                <div className="flex-grow">
                  <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1"><strong>Subject:</strong> {template.subject}</p>
                  <p 
                    className="text-sm text-gray-500 mt-2 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: template.content.replace(/<[^>]+>/g, '') }}
                  />
                </div>
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setEditingTemplate(template);
                      setTemplateView('editor');
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-yellow-600 hover:text-yellow-800"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={() => setPreviewingTemplate(template)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <TemplateEditor />
      )}
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-4">
      {/* Filter Controls */}
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
          onClick={() => console.log('Refreshing email log...')} // TODO: Add refresh logic
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emailLog.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                emailLog.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{log.recipient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.template}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(log.date).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- Tab Navigation ---

  const tabs = [
    { name: 'Send Email', id: 'send', icon: Mail },
    { name: 'Templates', id: 'templates', icon: FileText },
    { name: 'History', id: 'history', icon: History },
  ];

  return (
    <div className="container mx-auto">
      {/* Global Preview Modal */}
      {previewingTemplate && <TemplatePreviewModal />}
      
      {/* Tab Navigation Bar */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.id as TabName)}
              className={`flex items-center gap-2 whitespace-nowrow py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${ 
                  activeTab === tab.id
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

      {/* Tab Content */}
      <div>
        {activeTab === 'send' && renderSendEmailView()}
        {activeTab === 'templates' && renderTemplatesView()}
        {activeTab === 'history' && renderHistoryView()}
      </div>
    </div>
  );
};

export default EmailManagement;