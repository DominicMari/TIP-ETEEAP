// app/admin/dashboard/portfoliosubmissions.tsx

"use client";

import { useEffect, useState, FC, ReactNode, useMemo, useRef } from "react";
import supabase from "../../../lib/supabase/client";
import { 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  Camera,
  Check,
  X,
  Clock,
  Search,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Trash2
} from "lucide-react";

// 1. Interface for PortfolioSubmission
interface PortfolioSubmission {
  id: number;
  created_at: string;
  user_id: string;
  full_name: string;
  degree_program: string;
  portfolio_link: string;
  photo_url: string;
  signature: string;
  status: string;
}

// --- Constants ---
const STATUS_OPTIONS = ["All", "Submitted", "Pending", "Approved", "Declined"];
const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-blue-100 text-blue-800 ring-blue-300",
  Pending: "bg-yellow-100 text-yellow-800 ring-yellow-300",
  Approved: "bg-green-100 text-green-800 ring-green-300",
  Declined: "bg-red-100 text-red-800 ring-red-300",
  All: "bg-gray-100 text-gray-800 ring-gray-300",
};
const STATUS_ICONS: Record<string, ReactNode> = {
  Submitted: <Clock className="w-4 h-4" />,
  Pending: <Loader2 className="w-4 h-4 animate-spin" />,
  Approved: <Check className="w-4 h-4" />,
  Declined: <X className="w-4 h-4" />,
};

// 3. Main component
export default function PortfolioSubmissions() {
  const [submissions, setSubmissions] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State for UI interactions ---
  const [selectedSubmission, setSelectedSubmission] = useState<PortfolioSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // --- State for search and filtering ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Data Fetching ---
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("portfolio_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching portfolio submissions:", error.message);
        setError(error.message);
      } else {
        setSubmissions(data || []);
      }
      setLoading(false);
    };

    fetchSubmissions();
  }, []);

  // Memoized filtering logic
  const filteredSubmissions = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return submissions.filter(sub => {
      const statusMatch = statusFilter === "All" || sub.status === statusFilter;
      const searchMatch = (
        sub.full_name?.toLowerCase().includes(lowerSearchTerm) ||
        sub.degree_program?.toLowerCase().includes(lowerSearchTerm)
      );
      return statusMatch && searchMatch;
    });
  }, [submissions, searchTerm, statusFilter]);

  // Memoized pagination logic
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSubmissions.slice(startIndex, endIndex);
  }, [filteredSubmissions, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredSubmissions.length / itemsPerPage);
  }, [filteredSubmissions]);


  // --- Event Handlers ---
  const handleViewDetails = (submission: PortfolioSubmission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleStatusChange = async (submissionId: number, newStatus: string) => {
    setUpdatingStatusId(submissionId);
    setError(null);

    const { data: updatedData, error: updateError } = await supabase
      .from("portfolio_submissions")
      .update({ status: newStatus })
      .eq("id", submissionId)
      .select()
      .single();

    setUpdatingStatusId(null);

    if (updateError) {
      console.error("Error updating status:", updateError.message);
      setError(`Failed to update status: ${updateError.message}.`);
    } else if (updatedData) {
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? (updatedData as PortfolioSubmission) : sub
        )
      );
    }
  };

  const handleDelete = async (submissionId: number, submissionName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the submission for "${submissionName}"?`
    );
    if (!confirmed) return;

    setDeletingId(submissionId);
    setError(null);

    const { error: deleteError } = await supabase
      .from("portfolio_submissions")
      .delete()
      .eq("id", submissionId);

    setDeletingId(null);

    if (deleteError) {
      console.error("Error deleting submission:", deleteError.message);
      setError(`Failed to delete submission: ${deleteError.message}.`);
    } else {
      setSubmissions(prev =>
        prev.filter(sub => sub.id !== submissionId)
      );
    }
  };


  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="animate-spin mr-3 h-6 w-6 text-gray-500" />
        <p className="text-gray-600">Loading portfolio submissions...</p>
      </div>
    );
  }

  const ErrorAlert = () => error ? (
     <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center gap-2">
       <AlertCircle className="w-5 h-5 flex-shrink-0" />
       <span><span className="font-medium">Error:</span> {error}</span>
     </div>
  ) : null;

  return (
    <div className="space-y-6">
      <ErrorAlert />
      
      <PageHeader
        title="Portfolio Submissions"
        submissionCount={filteredSubmissions.length}
        totalSubmissions={submissions.length}
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        statusFilter={statusFilter}
        onStatusChange={(e) => setStatusFilter(e.target.value)}
      />

      {/* --- Main Table --- */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Degree</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedSubmissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No submissions found
                  {searchTerm && " matching your search."}
                  {statusFilter !== "All" && ` with status "${statusFilter}".`}
                </td>
              </tr>
            ) : (
              paginatedSubmissions.map((sub) => (
                <tr key={sub.id} className="text-black hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {sub.photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover bg-gray-200"
                            src={sub.photo_url}
                            alt="Applicant Photo"
                            onError={(e) => { e.currentTarget.src = "/assets/default-avatar.png"; }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Camera className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{sub.full_name || "N/A"}</div>
                        <div className="text-xs text-gray-500">ID: {sub.user_id?.substring(0, 8) || "N/A"}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sub.degree_program || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {(updatingStatusId === sub.id || deletingId === sub.id) && <Loader2 className="h-4 w-4 animate-spin text-gray-400"/>}
                      <select
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                        disabled={updatingStatusId === sub.id || deletingId === sub.id}
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 border-none outline-none ring-1 ring-inset focus:ring-2 focus:ring-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed ${
                          STATUS_COLORS[sub.status]
                        }`}
                      >
                        {STATUS_OPTIONS.filter(s => s !== "All").map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-center">
                    <ActionsMenu
                      submission={sub}
                      onView={handleViewDetails}
                      onDelete={handleDelete}
                      isDeleting={deletingId === sub.id}
                      isUpdating={updatingStatusId === sub.id}
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
      {isModalOpen && selectedSubmission && (
        <ViewSubmissionModal
          submission={selectedSubmission}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

// --- Page Header Component ---
const PageHeader: FC<{
  title: string;
  submissionCount: number;
  totalSubmissions: number;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  statusFilter: string;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({
  title,
  submissionCount,
  totalSubmissions,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}) => (
  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="flex items-center gap-3">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <span className="px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
        {submissionCount} / {totalSubmissions}
      </span>
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
      <div className="relative w-full md:w-64">
        <input
          type="text"
          placeholder="Search name, degree..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
      <div className="relative w-full md:w-auto">
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
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
      </div>
    </div>
  </div>
);


// --- View Details Modal Component ---
const ViewSubmissionModal: FC<{ submission: PortfolioSubmission; onClose: () => void }> = ({
  submission,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-black">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            Portfolio Submission Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={28} />
          </button>
        </div>

        {/* Single Column Modal Body */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          <div className="flex flex-col items-center text-center mb-6">
            <img
              className="h-32 w-32 rounded-full object-cover bg-gray-200 flex-shrink-0 shadow-md mb-4"
              src={submission.photo_url || "/assets/default-avatar.png"}
              alt="Applicant Photo"
              onError={(e) => { e.currentTarget.src = "/assets/default-avatar.png"; }}
            />
            <h3 className="text-2xl font-bold text-gray-900">
              {submission.full_name || "N/A"}
            </h3>
            <p className="text-lg text-gray-600">
              {submission.degree_program || "N/A"}
            </p>
            <div 
              className={`mt-2 text-sm font-semibold rounded-full px-3 py-1 inline-flex items-center gap-1.5 ${
                STATUS_COLORS[submission.status]
              }`}
            >
              {STATUS_ICONS[submission.status]}
              {submission.status}
            </div>
          </div>

          <InfoCard title="Submission Info">
            <InfoItem 
              label="Date Submitted" 
              value={submission.created_at ? new Date(submission.created_at).toLocaleString() : "N/A"} 
            />
            <InfoItem label="Portfolio Link">
              <a
                href={submission.portfolio_link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`break-all flex items-center gap-1 ${
                  submission.portfolio_link
                    ? "text-blue-600 hover:underline"
                    : "text-black pointer-events-none"
                }`}
              >
                {submission.portfolio_link ? "View Portfolio" : "N/A"}
                {submission.portfolio_link && <ExternalLink size={14} />}
              </a>
            </InfoItem>
          </InfoCard>

          <InfoCard title="Internal Data">
            <InfoItem label="Submission ID" value={submission.id} />
            <InfoItem label="User ID" value={submission.user_id} />
          </InfoCard>

          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Applicant Signature</h3>
            <div className="border rounded-lg p-2 bg-gray-100 max-w-md mx-auto">
              {submission.signature ? (
                <img
                  src={submission.signature}
                  alt="Applicant Signature"
                  className="w-full h-auto object-contain"
                />
              ) : (
                <p className="italic text-gray-500 text-sm text-center p-4">
                  No signature provided.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-100 text-right sticky bottom-0 rounded-b-2xl z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Helper Components for Modal ---
const InfoCard: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoItem: FC<{ label: string; value?: ReactNode; children?: ReactNode }> = ({ 
  label, 
  value, 
  children, 
}) => (
  <div className="text-sm">
    <p className="font-medium text-gray-500 mb-0.5">{label}</p>
    {value ? <div className="text-gray-800 break-words">{value}</div> : null}
    {children}
  </div>
);


// --- Actions Menu Component ---
const ActionsMenu: FC<{
  submission: PortfolioSubmission;
  onView: (submission: PortfolioSubmission) => void;
  onDelete: (submissionId: number, submissionName: string) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}> = ({ submission, onView, onDelete, isDeleting, isUpdating }) => {
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
              onView(submission);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Eye size={16} />
            View Details
          </button>
          <button
            onClick={() => {
              onDelete(submission.id, submission.full_name);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete Submission
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
