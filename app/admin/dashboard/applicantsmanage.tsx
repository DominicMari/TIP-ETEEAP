'use client';

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
  Trash2
} from 'lucide-react';

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
}

// --- Constants ---

// Helper to check if a field has valid data (parsing JSON if needed)
const hasData = (data: any): boolean => {
  if (!data) return false;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    // If it's an array, check if it has items
    if (Array.isArray(parsed)) return parsed.length > 0;
    // If it's an object, check if it has keys
    if (typeof parsed === 'object') return Object.keys(parsed).length > 0;
    // If string, check length
    return String(parsed).trim().length > 0;
  } catch (e) {
    return false;
  }
};

// Calculate percentage based on 8 steps
const getCompletionPercentage = (app: Applicant): number => {
  let completedSteps = 0;

  // Step 1: Degree Applied / Priorities (Usually Step 1)
  if (app.degree_applied_for || hasData(app.degree_priorities)) completedSteps++;

  // Step 2: Education Background
  if (hasData(app.education_background)) completedSteps++;

  // Step 3: Work Experience
  if (hasData(app.work_experiences)) completedSteps++;

  // Step 4: Professional Development (Seminars/Trainings)
  if (hasData(app.professional_development)) completedSteps++;

  // Step 5: Certifications or Non-Formal Education
  if (hasData(app.certifications) || hasData(app.non_formal_education)) completedSteps++;

  // Step 6: Recognitions, Publications, or Inventions
  if (hasData(app.recognitions) || hasData(app.publications) || hasData(app.inventions)) completedSteps++;

  // Step 7: Creative Works / Portfolio
  if (hasData(app.creative_works)) completedSteps++;

  // Step 8: Goal Statement or Self-Assessment (Essay parts)
  if (hasData(app.goal_statement) || hasData(app.self_assessment)) completedSteps++;

  return (completedSteps / 8) * 100;
};

const STATUS_OPTIONS = ['All', 'Submitted', 'Pending', 'Approved', 'Declined'];
const STATUS_COLORS: Record<string, string> = {
  Submitted: 'bg-gray-100 text-gray-800 ring-gray-300',
  Pending: 'bg-yellow-100 text-yellow-800 ring-yellow-300',
  Approved: 'bg-green-100 text-green-800 ring-green-300',
  Declined: 'bg-red-100 text-red-800 ring-red-300',
  All: 'bg-blue-100 text-blue-800 ring-blue-300',
};
const STATUS_ICONS: Record<string, ReactNode> = {
  Submitted: <Clock className='w-4 h-4' />,
  Pending: <Loader2 className='w-4 h-4 animate-spin' />,
  Approved: <Check className='w-4 h-4' />,
  Declined: <X className='w-4 h-4' />,
};


// --- Main ApplicantsManage Component ---
export default function ApplicantsManage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // 🔽 --- NEW: State for search and filtering ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
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

  // Memoized filtering logic
  const filteredApplicants = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return applicants.filter(app => {
      const statusMatch = statusFilter === 'All' || (app.status || 'Submitted') === statusFilter;
      const searchMatch = (
        app.applicant_name?.toLowerCase().includes(lowerSearchTerm) ||
        app.email_address?.toLowerCase().includes(lowerSearchTerm) ||
        app.degree_applied_for?.toLowerCase().includes(lowerSearchTerm)
      );
      return statusMatch && searchMatch;
    });
  }, [applicants, searchTerm, statusFilter]);

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
  const handleViewDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplicant(null);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingStatusId(applicationId);
    setError(null);

    const { data: updatedData, error: updateError } = await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('application_id', applicationId)
      .select()
      .single();

    setUpdatingStatusId(null);

    if (updateError) {
      console.error('Error updating status:', updateError.message);
      setError(`Failed to update status for ${applicationId}: ${updateError.message}. Check RLS.`);
    } else if (updatedData) {
      setApplicants(prevApplicants =>
        prevApplicants.map(app =>
          app.application_id === applicationId ? (updatedData as Applicant) : app
        )
      );
    }
  };

  const handleDelete = async (applicationId: string, applicantName: string | null) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the application for '${
        applicantName || 'this applicant'
      }'? This action cannot be undone.`
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
    <div className='space-y-6'>
      <ErrorAlert />
      
      {/* 🔽 --- NEW: Page Header --- */}
      <PageHeader
        title='Applicant Management'
        applicantCount={filteredApplicants.length}
        totalApplicants={applicants.length}
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        statusFilter={statusFilter}
        onStatusChange={(e) => setStatusFilter(e.target.value)}
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
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              getCompletionPercentage(app) >= 100 ? 'bg-green-500' : 
                              getCompletionPercentage(app) >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} 
                            style={{ width: `${getCompletionPercentage(app)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Original Status Dropdown (Kept for functionality) */}
                      <div className='flex items-center gap-2 mt-1'>
                        {(updatingStatusId === app.application_id || deletingId === app.application_id) && <Loader2 className='h-3 w-3 animate-spin text-gray-400'/>}
                        <select
                          value={app.status || 'Submitted'}
                          onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                          disabled={updatingStatusId === app.application_id || deletingId === app.application_id}
                          className={`text-[10px] font-bold uppercase rounded-md px-2 py-0.5 border-none outline-none ring-1 ring-inset cursor-pointer ${
                            STATUS_COLORS[app.status || 'Submitted']
                          }`}
                        >
                          {STATUS_OPTIONS.filter(s => s !== 'All').map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
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

      {/* View Details Modal */}
      {isModalOpen && selectedApplicant && (
        <ViewApplicantModal
          applicant={selectedApplicant}
          onClose={handleCloseModal}
        />
      )}
    </div>
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
}> = ({
  title,
  applicantCount,
  totalApplicants,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
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
          className={`w-full appearance-none pl-4 pr-10 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
            STATUS_COLORS[statusFilter]
          }`}
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
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
const ViewApplicantModal: FC<{ applicant: Applicant; onClose: () => void }> = ({
  applicant,
  onClose,
}) => {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col text-black'>
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

        {/* 🔽 --- NEW: Two-Column Modal Body --- */}
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
              <div 
                className={`mt-2 text-sm font-semibold rounded-full px-3 py-1 inline-flex items-center gap-1.5 ${
                  STATUS_COLORS[applicant.status || 'Submitted']
                }`}
              >
                {STATUS_ICONS[applicant.status || 'Submitted']}
                {applicant.status || 'Submitted'}
              </div>
            </div>

            <InfoCard title='Contact Information'>
              <InfoItem label='Email'>
                <a href={`mailto:${applicant.email_address}`} className='text-blue-600 hover:underline break-all'>
                  {applicant.email_address || 'N/A'}
                </a>
              </InfoItem>
              <InfoItem label='Mobile Number' value={applicant.mobile_number} />
              <InfoItem label='Full Address' value={applicant.full_address} />
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
                      href={applicant.folder_link || '#'} // Use link if present, or '#' as a fallback
                      target='_blank'
                      rel='noopener noreferrer'
                      // --- This is the improved logic ---
                      className={`break-all ${
                        applicant.folder_link
                          ? 'text-blue-600 hover:underline' // Has link: blue and underlined on hover
                          : 'text-black pointer-events-none' // No link: black text and not clickable
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
            <CollapsibleSection title="Self Assessment">
              <AssessmentList data={applicant.self_assessment} />
            </CollapsibleSection>
            <CollapsibleSection title="Lifelong Learning">
              <AssessmentList data={applicant.lifelong_learning} />
            </CollapsibleSection>
            <CollapsibleSection title="Creative Works / Portfolio">
              <CreativeWorks data={applicant.creative_works} />
            </CollapsibleSection>
            <CollapsibleSection title="Applicant Signature">
              <Signature data={applicant.signature_url} />
            </CollapsibleSection>
          </div>
        </div>

        {/* Modal Footer */}
        <div className='p-4 border-t border-gray-200 bg-gray-100 text-right sticky bottom-0 rounded-b-2xl z-10'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 🔽 NEW: Helper Components for Modal ---

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
    {value ? <div className='text-gray-800 break-words'>{value}</div> : null}
    {children}
  </div>
);

// --- 🔽 NEW: Specific Renderers for Readability ---

// Renders Goal Statement
const GoalStatement: FC<{ data: any }> = ({ data }) => {
  let content = data;
  if (!content) return null;
  // Try to parse if it's a stringified JSON (e.g., from old data)
  try { content = JSON.parse(data); } catch (e) {}

  return (
    <div className='prose prose-base max-w-none text-gray-800'>
      {typeof content === 'string' ? (
        <p>{content}</p>
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
  try { items = JSON.parse(data); } catch (e) {}
  
  const entries = Object.entries(items);

  if (typeof items !== 'object' || items === null || entries.length === 0) {
    return null; // Don't render if no data
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
  try { works = JSON.parse(data); } catch (e) {}
  
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
  if (!data) return null;

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
          className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="p-4 bg-white">{children || <p className="italic text-gray-500 text-sm">No data available for this section.</p>}</div>}
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
      // Not valid JSON, treat as no data
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
      <p className="italic text-gray-500 text-sm">No information provided, In addition.</p>
    )
  );

  if (title) {
    return <CollapsibleSection title={title}>{content}</CollapsibleSection>;
  }

  return content;
};

const EducationBackground: FC<{ data: any }> = ({ data }) => {
  let educationData = data;
  if (!educationData) return null;
  if (typeof educationData === 'string') {
    try {
      educationData = JSON.parse(educationData);
    } catch (e) {
      return null; // Or some error message
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
    return null;
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
  if (!workData) return null;
  if (typeof workData === 'string') {
    try {
      workData = JSON.parse(workData);
    } catch (e) {
      return null;
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
    return <p className="italic text-gray-500 text-sm">No information provided, In addition.</p>;
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
  if (!devData) return null;
  if (typeof devData === 'string') {
    try {
      devData = JSON.parse(devData);
    } catch (e) {
      return null;
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
    return <p className="italic text-gray-500 text-sm">No information provided, In addition.</p>;
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
  onView: (applicant: Applicant) => void; // Added onView
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
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
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