'use client';
import { createPortal } from 'react-dom';
import { openPrintPreview } from "@/components/admin/printTemplate";
import { useEffect, useState, FC, ReactNode, useMemo, useRef } from 'react';
import supabase from '../../../lib/supabase/client'; // Adjust path if needed
import {
  Loader2,
  Check,
  X,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Trash2,
  Zap,
  TrendingUp
} from 'lucide-react';
import Modal from "@/components/ui/Modal";
import { useModal } from "@/components/ui/useModal";

interface DegreePriority {
  priority: string;
  program: string;
}

interface CreativeWork {
  title?: string;
  link?: string;
  description?: string;
}

interface AssessmentItem {
  [key: string]: string; // Key-value pairs for assessment
}

interface EducationBackgroundEntry {
  school_name?: string;
  degree?: string;
  start_date?: string;
  end_date?: string;
}

interface EducationBackgroundData {
  tertiary?: EducationBackgroundEntry[];
  secondary?: EducationBackgroundEntry[];
  elementary?: EducationBackgroundEntry[];
  technical?: EducationBackgroundEntry[];
}

interface NonFormalEducationItem {
  name?: string;
  description?: string;
}

interface Certification {
  title?: string;
  rating?: string;
  certifyingBody?: string;
  dateCertified?: string;
}

interface Publication {
  title?: string;
  publisher?: string;
  datePublished?: string;
}

interface Invention {
  title?: string;
  inventors?: string;
  patentNumber?: string;
  dateIssued?: string;
}

interface WorkExperienceEntry {
  company_name?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
}

interface WorkExperienceData {
  employment?: WorkExperienceEntry[];
  consultancy?: WorkExperienceEntry[];
  selfEmployment?: WorkExperienceEntry[];
}

interface Recognition {
  title?: string;
  description?: string;
}

interface ProfessionalDevelopmentEntry {
  title?: string;
  description?: string;
}

interface ProfessionalDevelopmentData {
  memberships?: ProfessionalDevelopmentEntry[];
  projects?: ProfessionalDevelopmentEntry[];
  research?: ProfessionalDevelopmentEntry[];
}

// 2. Updated interface to match your 'applications' table
interface Applicant {
  application_id: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  applicant_name: string | null;
  degree_applied_for: string | null;
  campus: string | null;
  application_date: string | null;
  folder_link: string | null;
  photo_url: string | null;
  full_address: string | null;
  mobile_number: string | null;
  email_address: string | null;
  goal_statement: string | null;
  degree_priorities: any | null;
  creative_works: any | null;
  signature_url: string | null;
  lifelong_learning: any | null;
  self_assessment: any | null;
  status: string | null;
  education_background: any | null;
  non_formal_education: any | null;
  certifications: any | null;
  publications: any | null;
  inventions: any | null;
  work_experiences: any | null;
  recognitions: any | null;
  professional_development: any | null;
  age: number | null;
  birth_date: string | null;
  birth_place: string | null;
  gender: string | null;
  nationality: string | null;
  religion: string | null;
  civil_status: string | null;
  language_spoken: string | null;
  is_overseas: boolean | null;
  overseas_details: string | null;
  city_address: string | null;
  permanent_address: string | null;
  emergency_contact_name: string | null;
  emergency_relationship: string | null;
  emergency_address: string | null;
  emergency_contact_number: string | null;
  portfolio: any | null;
  admin_remarks: string | null;
}

// --- Constants ---

const parseField = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'string') return data;

  const trimmed = data.trim();
  if (!trimmed) return '';

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const hasMeaningfulValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, any>).some(hasMeaningfulValue);
  }
  return false;
};

// Treat empty arrays/structured objects as answered to support explicit None/N/A selections.
const isSectionAnswered = (data: any): boolean => {
  const parsed = parseField(data);
  if (parsed === null || parsed === undefined) return false;
  if (Array.isArray(parsed)) return true;
  if (typeof parsed === 'object') return Object.keys(parsed).length > 0;
  if (typeof parsed === 'string') return parsed.trim().length > 0;
  return true;
};

// Calculate percentage based on 8 steps
const getCompletionPercentage = (app: Applicant): number => {
  let completedSteps = 0;
  const workData = parseField(app.work_experiences);

  // Step 1: Degree Applied / Priorities (Usually Step 1)
  if ((app.degree_applied_for || '').trim() || hasMeaningfulValue(parseField(app.degree_priorities))) completedSteps++;

  // Step 2: Education Background
  if (isSectionAnswered(app.education_background)) completedSteps++;

  // Step 3: Work Experience
  if (hasMeaningfulValue(workData)) completedSteps++;

  // Step 4: Professional Development (Seminars/Trainings)
  if (isSectionAnswered(app.professional_development)) completedSteps++;

  // Step 5: Certifications or Non-Formal Education
  if (isSectionAnswered(app.certifications) || isSectionAnswered(app.non_formal_education)) completedSteps++;

  // Step 6: Recognitions, Publications, or Inventions
  if (isSectionAnswered(app.recognitions) || isSectionAnswered(app.publications) || isSectionAnswered(app.inventions)) completedSteps++;

  // Step 7: Creative Works / Portfolio
  if (isSectionAnswered(app.creative_works)) completedSteps++;

  // Step 8: Goal Statement or Self-Assessment (Essay parts)
  if (hasMeaningfulValue(parseField(app.goal_statement)) || hasMeaningfulValue(parseField(app.self_assessment))) completedSteps++;

  return (completedSteps / 8) * 100;
};

// Get suggested remarks templates
const getRemarksTemplate = (status: string): string => {
  const templates: Record<string, string> = {
    Submitted: 'Thank you for starting your application. Please complete all required sections to proceed with the review process.',
    Pending: 'Your application is currently under review. Our team will carefully assess your qualifications and experience. You will be notified once a decision has been made.',
    'Competency Process': 'Your application review is complete and you are now proceeding to the Competency Process. Please wait for further instructions from the admissions team.',
    Enrolled: 'Congratulations! You are now marked as Enrolled. Please check your email for your enrollment instructions and schedule.',
    Graduated: 'Congratulations! Your status is now marked as Graduated. We are proud of your achievement.'
  };
  return templates[status] || '';
};

// Send status notification email
const sendStatusEmail = async (
  applicantEmail: string | null,
  applicantName: string | null,
  status: string,
  remarks: string | null
): Promise<void> => {
  if (!applicantEmail) {
    console.warn('No email address available for applicant');
    return;
  }

  const emailTemplates: Record<string, { subject: string; body: string }> = {
    Submitted: {
      subject: 'Application Received - TIP ETEEAP',
      body: `Dear ${applicantName || 'Applicant'},\n\nThank you for submitting your application to the TIP ETEEAP program. We have received your application and it is now in our system.\n\nPlease continue to complete any remaining sections of your application. Our team will begin reviewing your submission shortly.\n\nBest regards,\nTIP ETEEAP Team`
    },
    Pending: {
      subject: 'Application Under Review - TIP ETEEAP',
      body: `Dear ${applicantName || 'Applicant'},\n\nYour application is now under review. Our assessment team is carefully evaluating your qualifications, experience, and fit for the program.\n\nYou will be notified of the decision as soon as the review process is complete.\n\nThank you for your patience.\n\nBest regards,\nTIP ETEEAP Team`
    },
    'Competency Process': {
      subject: 'Proceed to Competency Process - TIP ETEEAP',
      body: `Dear ${applicantName || 'Applicant'},\n\nYour application review has been completed and you are now endorsed to proceed to the Competency Process.\n\nPlease wait for the next instructions from the TIP ETEEAP team regarding schedules and requirements.\n\nBest regards,\nTIP ETEEAP Team`
    },
    Enrolled: {
      subject: 'Enrollment Status Update - TIP ETEEAP',
      body: `Dear ${applicantName || 'Applicant'},\n\nCongratulations! Your status has been updated to Enrolled.\n\nPlease review your email and follow the enrollment instructions sent by the TIP ETEEAP team.\n\nBest regards,\nTIP ETEEAP Team`
    },
    Graduated: {
      subject: 'Graduation Status Update - TIP ETEEAP',
      body: `Dear ${applicantName || 'Applicant'},\n\nCongratulations! Your status has been updated to Graduated.\n\nWe commend your accomplishment and wish you continued success.\n\nBest regards,\nTIP ETEEAP Team`
    }
  };

  const emailTemplate = emailTemplates[status];
  if (!emailTemplate) {
    console.warn(`No email template found for status: ${status}`);
    return;
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: applicantEmail,
        subject: emailTemplate.subject,
        body: remarks ? `${emailTemplate.body}\n\n---\nAdmin Comments:\n${remarks}` : emailTemplate.body
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send email:', error.error);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const STATUS_OPTIONS = ['All', 'Submitted', 'Pending', 'Competency Process', 'Enrolled', 'Graduated'];
const STATUS_COLORS: Record<string, string> = {
  Submitted: 'bg-gray-100 text-gray-800 ring-gray-300',
  Pending: 'bg-yellow-100 text-yellow-800 ring-yellow-300',
  'Competency Process': 'bg-blue-100 text-blue-800 ring-blue-300',
  Enrolled: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  Graduated: 'bg-purple-100 text-purple-800 ring-purple-300',
  All: 'bg-blue-100 text-blue-800 ring-blue-300',
};
const STATUS_ICONS: Record<string, ReactNode> = {
  Submitted: <Clock className='w-4 h-4' />,
  Pending: <Loader2 className='w-4 h-4 animate-spin' />,
  'Competency Process': <TrendingUp className='w-4 h-4' />,
  Enrolled: <Check className='w-4 h-4' />,
  Graduated: <Check className='w-4 h-4' />,
};


// --- Main ApplicantsManage Component ---
export default function ApplicantsManage({
  focusApplicationId,
  focusRequestKey,
  onFocusRequestHandled,
}: {
  focusApplicationId?: string | null;
  focusRequestKey?: number;
  onFocusRequestHandled?: (key: number) => void;
}) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [remarksModal, setRemarksModal] = useState<{ applicationId: string; newStatus: string; currentRemarks: string } | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const { modalProps, showConfirm } = useModal();

  // 🔽 --- NEW: State for search and filtering ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Data Fetching ---
  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching applications:', fetchError.message);
        setError(`Failed to fetch applications: ${fetchError.message}. Check RLS policies.`);
        setApplicants([]);
      } else {
        setApplicants((data as Applicant[] | null) || []);
      }
      setLoading(false);
    };

    fetchApplicants();
  }, []);

  useEffect(() => {
    if (!focusApplicationId || applicants.length === 0) return;
    const requestKey = focusRequestKey ?? 0;

    const targetApplicant = applicants.find(
      (app) => app.application_id === focusApplicationId
    );

    if (!targetApplicant) {
      onFocusRequestHandled?.(requestKey);
      return;
    }

    // Reset filters so the destination record context remains consistent.
    setSearchTerm("");
    setStatusFilter("All");
    setCurrentPage(1);
    setSelectedApplicant(targetApplicant);
    setIsModalOpen(true);
    onFocusRequestHandled?.(requestKey);
  }, [focusApplicationId, focusRequestKey, applicants, onFocusRequestHandled]);

  // Memoized filtering logic
  const filteredApplicants = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    const filtered = applicants.filter(app => {
      const statusMatch = statusFilter === 'All' || (app.status || 'Submitted') === statusFilter;
      const searchMatch = (
        app.applicant_name?.toLowerCase().includes(lowerSearchTerm) ||
        app.email_address?.toLowerCase().includes(lowerSearchTerm) ||
        app.degree_applied_for?.toLowerCase().includes(lowerSearchTerm)
      );
      return statusMatch && searchMatch;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [applicants, searchTerm, statusFilter, dateSort]);

  // Memoized pagination logic
  const paginatedApplicants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplicants.slice(startIndex, endIndex);
  }, [filteredApplicants, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredApplicants.length / itemsPerPage);
  }, [filteredApplicants]);

  // --- Event Handlers ---
  const handleViewDetails = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);

    // Auto-change "Submitted" to "Pending" when admin opens to review
    if (applicant.status === 'Submitted') {
      const newStatus = 'Pending';
      const template = getRemarksTemplate(newStatus);
      setUpdatingStatusId(applicant.application_id);

      const { data: updatedData, error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus, admin_remarks: template, updated_at: new Date().toISOString() })
        .eq('application_id', applicant.application_id)
        .select()
        .single();

      setUpdatingStatusId(null);

      if (!updateError && updatedData) {
        const updated = updatedData as Applicant;
        setApplicants(prev => prev.map(a => a.application_id === applicant.application_id ? updated : a));
        setSelectedApplicant(updated);
        await sendStatusEmail(updated.email_address, updated.applicant_name, newStatus, template);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplicant(null);
    setRemarksModal(null);
    setRemarksText('');
  };

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    const currentApp = applicants.find(a => a.application_id === applicationId);
    const template = getRemarksTemplate(newStatus);
    setRemarksText(currentApp?.admin_remarks || template);
    setRemarksModal({ applicationId, newStatus, currentRemarks: currentApp?.admin_remarks || '' });
  };

  const handleStatusChangeConfirm = async () => {
    if (!remarksModal) return;
    const { applicationId, newStatus } = remarksModal;
    setUpdatingStatusId(applicationId);
    setError(null);

    const { data: updatedData, error: updateError } = await supabase
      .from('applications')
      .update({ status: newStatus, admin_remarks: remarksText.trim() || null, updated_at: new Date().toISOString() })
      .eq('application_id', applicationId)
      .select()
      .single();

    setUpdatingStatusId(null);
    setRemarksModal(null);
    setRemarksText('');

    if (updateError) {
      console.error('Error updating status:', updateError.message);
      setError(`Failed to update status for ${applicationId}: ${updateError.message}. Check RLS.`);
    } else if (updatedData) {
      setApplicants(prevApplicants =>
        prevApplicants.map(app =>
          app.application_id === applicationId ? (updatedData as Applicant) : app
        )
      );
      // Also update selectedApplicant if viewing the same one
      if (selectedApplicant?.application_id === applicationId) {
        setSelectedApplicant(updatedData as Applicant);
      }

      // Sync status to portfolio_submissions for the same user
      const userId = (updatedData as Applicant).user_id;
      if (userId) {
        await supabase
          .from('portfolio_submissions')
          .update({ status: newStatus })
          .eq('user_id', userId);
      }

      // Send status notification email
      await sendStatusEmail(
        (updatedData as Applicant).email_address,
        (updatedData as Applicant).applicant_name,
        newStatus,
        remarksText.trim() || null
      );
    }
  };

  const handleDelete = async (applicationId: string, applicantName: string | null) => {
    const confirmed = await showConfirm(
      `Are you sure you want to permanently delete the application for '${applicantName || 'this applicant'}'? This action cannot be undone.`,
      "Delete Application",
      "danger",
      "Yes, Delete",
      "Cancel"
    );

    if (!confirmed) return;

    setDeletingId(applicationId);
    setError(null);

    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('application_id', applicationId);

    setDeletingId(null);

    if (deleteError) {
      console.error('Error deleting application:', deleteError.message);
      setError(`Failed to delete application: ${deleteError.message}. Check RLS.`);
    } else {
      setApplicants(prevApplicants =>
        prevApplicants.filter(app => app.application_id !== applicationId)
      );
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className='flex items-center justify-center p-10'>
        <Loader2 className='animate-spin mr-3 h-6 w-6 text-gray-500' />
        <p className='text-gray-600'>Loading applications...</p>
      </div>
    );
  }

  const ErrorAlert = () => error ? (
    <div className='p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center gap-2'>
      <AlertCircle className='w-5 h-5 flex-shrink-0' />
      <span><span className='font-medium'>Error:</span> {error}</span>
    </div>
  ) : null;

  return (
    <>
      <div className='relative min-h-screen'>

        {/* 1. ADD print:hidden TO YOUR MAIN UI WRAPPER */}
        <div className='space-y-6 print:hidden'>
          <ErrorAlert />

          <PageHeader
            title='Applicant Management'
            applicantCount={filteredApplicants.length}
            totalApplicants={applicants.length}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            statusFilter={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            dateSort={dateSort}
            onDateSortChange={(v) => { setDateSort(v); setCurrentPage(1); }}
          />

          {/* --- Main Table --- */}
          <div className='overflow-x-auto border border-gray-200 rounded-lg shadow-sm'>
            <table className='min-w-full bg-white divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Applicant</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Degree Applied For</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Campus</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Date Submitted</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='p-6 text-center text-gray-500'>
                      No applications found
                      {searchTerm && ' matching your search.'}
                      {statusFilter !== 'All' && ` with status '${statusFilter}'.`}
                    </td>
                  </tr>
                ) : (
                  paginatedApplicants.map((app) => (
                    <tr key={app.application_id} className='text-black hover:bg-gray-50 transition-colors duration-150'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='flex-shrink-0 h-10 w-10'>
                            <img
                              className='h-10 w-10 rounded-full object-cover bg-gray-200'
                              src={app.photo_url || '/assets/default-avatar.png'}
                              alt='Applicant Photo'
                              onError={(e) => { e.currentTarget.src = '/assets/default-avatar.png'; }}
                            />
                          </div>
                          <div className='ml-4'>
                            <div className='text-sm font-medium text-gray-900'>{app.applicant_name || 'N/A'}</div>
                            <div className='text-xs text-gray-500'>{app.email_address || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{app.degree_applied_for || 'N/A'}</td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{app.campus || 'N/A'}</td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                        {formatDate(app.application_date || app.created_at)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap min-w-[200px]'>
                        {/* Progress Bar Container */}
                        <div className="flex flex-col gap-2">

                          {/* Percentage Text & Bar */}
                          <div className="w-full">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-500">Progress</span>
                              <span className="font-bold text-gray-700">
                                {Math.round(getCompletionPercentage(app))}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${getCompletionPercentage(app) >= 100 ? 'bg-green-500' :
                                  getCompletionPercentage(app) >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`}
                                style={{ width: `${getCompletionPercentage(app)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Status Badge - Click to view details */}
                          <div className='flex items-center gap-2 mt-1'>
                            {(updatingStatusId === app.application_id || deletingId === app.application_id) && <Loader2 className='h-3 w-3 animate-spin text-gray-400' />}
                            <button
                              onClick={() => handleViewDetails(app)}
                              className={`text-[10px] font-bold uppercase rounded-md px-2 py-0.5 ring-1 ring-inset cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1 ${STATUS_COLORS[app.status || 'Submitted']
                                }`}
                            >
                              {STATUS_ICONS[app.status || 'Submitted']}
                              {app.status || 'Submitted'}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-center'>
                        <ActionsMenu
                          applicant={app}
                          onView={handleViewDetails}
                          onDelete={handleDelete}
                          isDeleting={deletingId === app.application_id}
                          isUpdating={updatingStatusId === app.application_id}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* View Details Modal */}
        {isModalOpen && selectedApplicant && (
          <ViewApplicantModal
            applicant={selectedApplicant}
            onClose={handleCloseModal}
            onStatusChange={handleStatusChange}
            updatingStatusId={updatingStatusId}
          />
        )}

        {/* Remarks Modal */}
        {remarksModal && (
          <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-black'>
              <h3 className='text-lg font-bold text-gray-900 mb-1'>
                Update Status to <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-semibold ${STATUS_COLORS[remarksModal.newStatus]}`}>{remarksModal.newStatus}</span>
              </h3>
              <p className='text-sm text-gray-500 mb-4'>Add optional remarks for the applicant. These will be visible on their application tracker.</p>
              <textarea
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                placeholder='e.g., Your application has been reviewed and approved. Please check your email for next steps...'
                rows={5}
                className='w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none'
              />
              {!remarksModal.currentRemarks && (
                <button
                  onClick={() => setRemarksText(getRemarksTemplate(remarksModal.newStatus))}
                  className='text-xs text-blue-600 hover:text-blue-800 font-medium mb-3 flex items-center gap-1'
                >
                  <Zap size={12} />
                  Use suggested template
                </button>
              )}
              <div className='flex justify-end gap-3 mt-4'>
                <button
                  onClick={() => { setRemarksModal(null); setRemarksText(''); }}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChangeConfirm}
                  disabled={updatingStatusId === remarksModal.applicationId}
                  className='px-4 py-2 text-sm font-semibold text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center gap-2'
                >
                  {updatingStatusId === remarksModal.applicationId && <Loader2 className='w-4 h-4 animate-spin' />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Modal {...modalProps} />
    </>
  );
}

// 🔽 --- NEW: Page Header Component ---
const PageHeader: FC<{
  title: string;
  applicantCount: number;
  totalApplicants: number;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  statusFilter: string;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  dateSort: 'asc' | 'desc';
  onDateSortChange: (v: 'asc' | 'desc') => void;
}> = ({
  title,
  applicantCount,
  totalApplicants,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateSort,
  onDateSortChange,
}) => (
    <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
      <div className='flex items-center gap-3'>
        <h1 className='text-3xl font-bold text-gray-900'>{title}</h1>
        <span className='px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full'>
          {applicantCount} / {totalApplicants}
        </span>
      </div>
      <div className='flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto'>
        {/* Search Bar */}
        <div className='relative w-full md:w-64'>
          <input
            type='text'
            placeholder='Search name, email...'
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black"
          />
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
        </div>
        {/* Status Filter */}
        <div className='relative w-full md:w-auto'>
          <select
            value={statusFilter}
            onChange={onStatusChange}
            className={`w-full appearance-none pl-4 pr-10 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${STATUS_COLORS[statusFilter]}`}
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none' />
        </div>
        {/* Date Sort */}
        <div className='relative w-full md:w-auto'>
          <select
            value={dateSort}
            onChange={(e) => onDateSortChange(e.target.value as 'asc' | 'desc')}
            className='w-full appearance-none pl-4 pr-10 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-700'
          >
            <option value='desc'>Date: Newest First</option>
            <option value='asc'>Date: Oldest First</option>
          </select>
          <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none' />
        </div>
      </div>
    </div>
  );


const formatDate = (dateString: string | null | undefined, includeTime = false): string => {
  if (!dateString) {
    return 'N/A';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (e) {
    return dateString;
  }
};

// 🔽 --- IMPROVED: View Details Modal ---
const ViewApplicantModal: FC<{
  applicant: Applicant;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: string) => void;
  updatingStatusId: string | null;
}> = ({
  applicant,
  onClose,
  onStatusChange,
  updatingStatusId,
}) => {
    const handlePrint = () => {
      openPrintPreview(applicant);
    };

    return createPortal(
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm'>
        <div className='bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col text-black'>
          {/* Modal Header */}
          <div className='flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10'>
            <h2 className='text-2xl font-bold text-gray-800'>
              Applicant Details
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-700'
              aria-label='Close modal'
            >
              <X size={28} />
            </button>
          </div>

          {/* Two-Column Modal Body */}
          <div className='flex-1 flex overflow-hidden'>

            {/* Left Column (Info) */}
            <div className='w-1/3 max-w-sm border-r border-gray-200 p-6 overflow-y-auto space-y-6 bg-gray-50'>
              {/* Applicant Bio */}
              <div className='flex flex-col items-center text-center'>
                <img
                  className='h-32 w-32 rounded-full object-cover bg-gray-200 flex-shrink-0 shadow-md mb-4'
                  src={applicant.photo_url || '/assets/default-avatar.png'}
                  alt='Applicant Photo'
                  onError={(e) => { e.currentTarget.src = '/assets/default-avatar.png'; }}
                />
                <h3 className='text-2xl font-bold text-gray-900'>
                  {applicant.applicant_name || 'N/A'}
                </h3>
                <p className='text-lg text-gray-600'>
                  {applicant.degree_applied_for || 'N/A'}
                </p>
                <p className='text-sm text-gray-500'>{applicant.campus} Campus</p>
                {/* Current Status Badge */}
                <div
                  className={`mt-2 text-sm font-semibold rounded-full px-3 py-1 inline-flex items-center gap-1.5 ${STATUS_COLORS[applicant.status || 'Submitted']
                    }`}
                >
                  {updatingStatusId === applicant.application_id
                    ? <Loader2 className='h-4 w-4 animate-spin' />
                    : STATUS_ICONS[applicant.status || 'Submitted']
                  }
                  {applicant.status || 'Submitted'}
                </div>

                {/* Status Selector */}
                <div className="mt-4 flex flex-wrap gap-2 w-full">
                  {["Submitted", "Pending", "Competency Process", "Enrolled", "Graduated"].map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatusChange(applicant.application_id, s)}
                      disabled={updatingStatusId === applicant.application_id || applicant.status === s}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${applicant.status === s
                        ? `${STATUS_COLORS[s]} border-transparent shadow-sm`
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        } disabled:opacity-60 disabled:cursor-default`}
                    >
                      {applicant.status === s && <Check size={13} />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <InfoCard title='Applicant Information'>
                <InfoItem label='Birthday' value={formatDate(applicant.birth_date)} />
                <InfoItem label='Birthplace' value={applicant.birth_place} />
                <InfoItem label='Age' value={applicant.age != null ? String(applicant.age) : 'N/A'} />
                <InfoItem label='Gender' value={applicant.gender} />
                <InfoItem label='Civil Status' value={applicant.civil_status} />
                <InfoItem label='Nationality' value={applicant.nationality} />
                <InfoItem label='Religion' value={applicant.religion} />
                <InfoItem label='Language Spoken' value={applicant.language_spoken} />
              </InfoCard>

              <InfoCard title='Emergency Contact'>
                <InfoItem label='Contact Name' value={applicant.emergency_contact_name} />
                <InfoItem label='Address' value={applicant.emergency_address} />
                <InfoItem label='Relationship' value={applicant.emergency_relationship} />
                <InfoItem label='Contact Number' value={applicant.emergency_contact_number} />
              </InfoCard>

              <InfoCard title='Contact Information'>
                <InfoItem label='Email'>
                  <a href={`mailto:${applicant.email_address}`} className='text-blue-600 hover:underline break-all'>
                    {applicant.email_address || 'N/A'}
                  </a>
                </InfoItem>
                <InfoItem label='Mobile Number' value={applicant.mobile_number} />
                <InfoItem label='City Address' value={applicant.city_address} />
                <InfoItem label='Permanent Address' value={applicant.permanent_address} />
              </InfoCard>

              <InfoCard title='Application Info'>
                <InfoItem
                  label='Date Submitted'
                  value={formatDate(applicant.application_date || applicant.created_at, true)}
                />
                <InfoItem
                  label='Last Updated'
                  value={formatDate(applicant.updated_at, true)}
                />
                <InfoItem label='Portfolio/Folder Link'>
                  <a
                    href={applicant.folder_link || '#'}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={`break-all ${applicant.folder_link
                      ? 'text-blue-600 hover:underline'
                      : 'text-black pointer-events-none'
                      }`}
                  >
                    {applicant.folder_link || 'N/A'}
                  </a>
                </InfoItem>
              </InfoCard>

              <InfoCard title='Internal Data'>
                <InfoItem label='Application ID' value={applicant.application_id} />
                <InfoItem label='User ID' value={applicant.user_id} />
              </InfoCard>

              {applicant.admin_remarks && (
                <InfoCard title='Admin Remarks'>
                  <p className='text-sm text-gray-700 whitespace-pre-wrap'>{applicant.admin_remarks}</p>
                </InfoCard>
              )}
            </div>

            {/* Right Column (Content) */}
            <div className='flex-1 p-8 overflow-y-auto'>
              <CollapsibleSection title="Goal Statement" isOpenDefault={true}>
                <GoalStatement data={applicant.goal_statement} />
              </CollapsibleSection>
              <CollapsibleSection title="Education Background">
                <EducationBackground data={applicant.education_background} />
              </CollapsibleSection>
              <CollapsibleSection title="Work Experiences">
                <WorkExperiences data={applicant.work_experiences} />
              </CollapsibleSection>
              <CollapsibleSection title="Professional Development">
                <ProfessionalDevelopment data={applicant.professional_development} />
              </CollapsibleSection>
              <GenericList data={applicant.non_formal_education} title="Non-Formal Education" />
              <CollapsibleSection title="Certifications"><Certifications data={applicant.certifications} /></CollapsibleSection>
              <GenericList data={applicant.publications} title="Publications" />
              <GenericList data={applicant.inventions} title="Inventions" />
              <GenericList data={applicant.recognitions} title="Recognitions" />
              <CollapsibleSection title="Lifelong Learning">
                <AssessmentList data={applicant.lifelong_learning} />
              </CollapsibleSection>
              <CollapsibleSection title="Creative Works">
                <CreativeWorks data={applicant.creative_works} />
              </CollapsibleSection>
              <CollapsibleSection title="Applicant Signature">
                <Signature data={applicant.signature_url} />
              </CollapsibleSection>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-lg font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
              Print
            </button>
          </div>

        </div>
      </div>
      , document.body);
  };

// ---  NEW: Helper Components for Modal ---

// Simple Card for left sidebar
const InfoCard: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div className='bg-white rounded-xl shadow-md border border-gray-200 p-5'>
    <h4 className='text-sm font-bold text-gray-500 uppercase tracking-wider mb-4'>
      {title}
    </h4>
    <div className='space-y-4'>{children}</div>
  </div>
);

// Simple Key-Value item for left sidebar
const InfoItem: FC<{ label: string; value?: ReactNode; children?: ReactNode }> = ({
  label,
  value,
  children,
}) => (
  <div className='text-sm'>
    <p className='font-medium text-gray-500 mb-0.5'>{label}</p>
    {value !== undefined && value !== null && value !== '' ? (
      <div className='text-gray-800 break-words'>{value}</div>
    ) : !children ? (
      <div className='text-gray-800 break-words'>N/A</div>
    ) : null}
    {children}
  </div>
);

// ---  NEW: Specific Renderers for Readability ---

// Renders Goal Statement
const GoalStatement: FC<{ data: any }> = ({ data }) => {
  let content = data;
  if (!content) {
    return <p className='italic text-gray-500 text-sm'>No information provided.</p>;
  }
  // Try to parse if it's a stringified JSON (e.g., from old data)
  try { content = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { }

  return (
    <div className='prose prose-base max-w-none text-gray-800'>
      {typeof content === 'string' ? (
        <p>{content}</p>
      ) : typeof content === 'object' && content !== null ? (
        <p>{String((content as Record<string, unknown>).goal || (content as Record<string, unknown>).statement || (content as Record<string, unknown>).text || 'N/A')}</p>
      ) : (
        <p className='italic text-gray-500'>Could not parse goal statement.</p>
      )}
    </div>
  );
};



// Renders Assessment/Learning (Assumes an object of key/value pairs)
const AssessmentList: FC<{ data: any }> = ({ data }) => {
  let items = data;
  if (!items) return null;
  try { items = JSON.parse(data); } catch (e) { }

  const entries = Object.entries(items);

  if (typeof items !== 'object' || items === null || entries.length === 0) {
    return <p className='italic text-gray-500 text-sm'>No information provided.</p>;
  }

  // Helper to format keys like 'jobLearning' into 'Job Learning'
  const formatKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
  };

  return (
    <dl className='space-y-3'>
      {entries.map(([key, value]) => (
        <div key={key} className='p-4 bg-white border border-gray-200 rounded-lg shadow-sm'>
          <dt className='text-sm font-semibold text-gray-600 capitalize'>{formatKey(key)}</dt>
          <dd className='text-base text-gray-800 mt-1'>{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
};


// Renders Creative Works (Assumes an array of objects)
const CreativeWorks: FC<{ data: any }> = ({ data }) => {
  let works = data;
  if (!works) return null;
  try { works = JSON.parse(data); } catch (e) { }

  if (!Array.isArray(works) || works.length === 0) {
    return null;
  }

  return (
    <div className='space-y-3'>
      {works.map((work, index) => (
        <div key={index} className='p-4 bg-white border border-gray-200 rounded-lg shadow-sm'>
          <p className='text-base font-bold text-gray-800'>
            {work.title || `Work #${index + 1}`}
          </p>
          {work.link && <p className='text-sm text-blue-600'>{work.link}</p>}
          <p className='text-sm text-gray-700 mt-1'>{work.description}</p>
        </div>
      ))}
    </div>
  );
};

// Renders Signature
const Signature: FC<{ data: string | null }> = ({ data }) => {
  if (!data) {
    return <p className='italic text-gray-500 text-sm'>No information provided.</p>;
  }

  return (
    <div className='border rounded-lg p-2 bg-gray-100 max-w-md'>
      <img
        src={data}
        alt='Applicant Signature'
        className='w-full h-auto object-contain'
      />
    </div>
  );
};

const Certifications: FC<{ data: any }> = ({ data }) => {
  let parsedData: any[] | null = null;

  if (Array.isArray(data)) {
    parsedData = data;
  } else if (typeof data === 'string') {
    try {
      const result = JSON.parse(data);
      if (Array.isArray(result)) {
        parsedData = result;
      }
    } catch (e) {
      // Not valid JSON
    }
  }

  if (!parsedData || parsedData.length === 0) {
    return <p className="italic text-gray-500 text-sm">No information provided.</p>;
  }

  return (
    <div className="space-y-4">
      {parsedData.map((cert, index) => (
        <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-base font-bold text-gray-800">{cert.title}</p>
          {cert.rating && <p className="text-sm text-gray-700">Rating: {cert.rating}</p>}
          <p className="text-sm text-gray-500 italic mt-1">
            Certified by {cert.certifyingBody} on {formatDate(cert.dateCertified)}
          </p>
        </div>
      ))}
    </div>
  );
};

const CollapsibleSection: FC<{ title: string; children: ReactNode; isOpenDefault?: boolean }> = ({ title, children, isOpenDefault = false }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  if (!title) return null;

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 text-lg font-semibold text-gray-800"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
            }`}
        />
      </button>
      {isOpen && <div className="p-4 bg-white">{children || <p className="italic text-gray-500 text-sm">No information provided.</p>}</div>}
    </div>
  );
};

const GenericList: FC<{ data: any[] | string; title?: string }> = ({ data, title }) => {
  let parsedData: any[] | null = null;

  if (Array.isArray(data)) {
    parsedData = data;
  } else if (typeof data === 'string') {
    try {
      const result = JSON.parse(data);
      if (Array.isArray(result)) {
        parsedData = result;
      }
    } catch (e) {
      // If plain text, render as a single row instead of hiding it.
      if (data.trim()) {
        parsedData = [data.trim()];
      }
    }
  }

  const hasData = parsedData && parsedData.length > 0;

  const content = (
    hasData ? (
      <div className="space-y-3">
        {parsedData?.map((item, index) => (
          <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            {typeof item === 'object' && item !== null ? (
              Object.entries(item).map(([key, value]) => (
                <p key={key} className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-600">{key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:</span> {/date/i.test(key) ? formatDate(value as string) : value != null ? String(value) : 'N/A'}
                </p>
              ))
            ) : (
              <p className="text-sm text-gray-700">{String(item)}</p>
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="italic text-gray-500 text-sm">No information provided.</p>
    )
  );

  if (title) {
    return <CollapsibleSection title={title}>{content}</CollapsibleSection>;
  }

  return content;
};

const EducationBackground: FC<{ data: any }> = ({ data }) => {
  let educationData = data;
  if (!educationData) return <p className="italic text-gray-500 text-sm">No information provided.</p>;
  if (typeof educationData === 'string') {
    try {
      educationData = JSON.parse(educationData);
    } catch (e) {
      return <p className="italic text-gray-500 text-sm">No information provided.</p>;
    }
  }

  const { tertiary, secondary, elementary, technical } = educationData || {};

  const sections = [
    { title: 'Tertiary', data: tertiary },
    { title: 'Secondary', data: secondary },
    { title: 'Elementary', data: elementary },
    { title: 'Technical', data: technical },
  ];

  const hasContent = sections.some(sec => Array.isArray(sec.data) && sec.data.length > 0);

  if (!hasContent) {
    return <p className="italic text-gray-500 text-sm">No information provided.</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map(section => (
        (Array.isArray(section.data) && section.data.length > 0) && (
          <div key={section.title}>
            <h4 className="font-semibold text-gray-700 mb-2">{section.title}</h4>
            <GenericList data={section.data} />
          </div>
        )
      ))}
    </div>
  );
};

const WorkExperiences: FC<{ data: any }> = ({ data }) => {
  let workData = data;
  if (!workData) return <p className="italic text-gray-500 text-sm">No information provided.</p>;
  if (typeof workData === 'string') {
    try {
      workData = JSON.parse(workData);
    } catch (e) {
      return <p className="italic text-gray-500 text-sm">No information provided.</p>;
    }
  }

  const { employment, consultancy, selfEmployment } = workData || {};

  const sections = [
    { title: 'Employment', data: employment },
    { title: 'Consultancy', data: consultancy },
    { title: 'Self-Employment', data: selfEmployment },
  ];

  const hasContent = sections.some(sec => Array.isArray(sec.data) && sec.data.length > 0);

  if (!hasContent) {
    return <p className="italic text-gray-500 text-sm">No information provided.</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map(section => (
        (Array.isArray(section.data) && section.data.length > 0) && (
          <div key={section.title}>
            <h4 className="font-semibold text-gray-700 mb-2">{section.title}</h4>
            <GenericList data={section.data} />
          </div>
        )
      ))}
    </div>
  );
};

const ProfessionalDevelopment: FC<{ data: any }> = ({ data }) => {
  let devData = data;
  if (!devData) return <p className="italic text-gray-500 text-sm">No information provided.</p>;
  if (typeof devData === 'string') {
    try {
      devData = JSON.parse(devData);
    } catch (e) {
      return <p className="italic text-gray-500 text-sm">No information provided.</p>;
    }
  }

  const { memberships, projects, research } = devData || {};

  const sections = [
    { title: 'Memberships', data: memberships },
    { title: 'Projects', data: projects },
    { title: 'Research', data: research },
  ];

  const hasContent = sections.some(sec => Array.isArray(sec.data) && sec.data.length > 0);

  if (!hasContent) {
    return <p className="italic text-gray-500 text-sm">No information provided.</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map(section => (
        (Array.isArray(section.data) && section.data.length > 0) && (
          <div key={section.title}>
            <h4 className="font-semibold text-gray-700 mb-2">{section.title}</h4>
            <GenericList data={section.data} />
          </div>
        )
      ))}
    </div>
  );
};

const ActionsMenu: FC<{
  applicant: Applicant;
  onView: (applicant: Applicant) => void;
  onDelete: (applicationId: string, applicantName: string | null) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}> = ({ applicant, onView, onDelete, isDeleting, isUpdating }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 data-[state=open]:bg-gray-200 transition-colors"
        data-state={isOpen ? "open" : "closed"}
        disabled={isDeleting || isUpdating}
      >
        <MoreHorizontal size={18} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">

          <button
            onClick={() => {
              onView(applicant);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Eye size={16} />
            View Details
          </button>

          <div className="border-t border-gray-100 my-1"></div>

          <button
            onClick={() => {
              onDelete(applicant.application_id, applicant.applicant_name);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete Application
          </button>

        </div>
      )}

    </div>
  );
};

const PaginationControls: FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center space-x-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${currentPage === page ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};