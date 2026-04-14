// app/admin/dashboard/portfoliosubmissions.tsx

"use client";

import { useEffect, useState, FC, ReactNode, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { createPortal } from 'react-dom';
import supabase from "../../../lib/supabase/client";
import {
  Loader2,
  AlertCircle,
  Camera,
  Check,
  X,
  Clock,
  Search,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Trash2,
  FileText,
  Briefcase,
  Award,
  BookOpen,
  GraduationCap,
  Star,
  Calendar,
  Printer,
  User,
  File,
  Image as ImageIcon,
  ZoomIn,
  Download,
  FolderOpen,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/components/ui/useModal";
import { openPortfolioPrintPreview } from "@/components/admin/printTemplate";
import { ImageViewer } from "@/components/admin/ImageViewer";
import { FileViewer, FileItem } from "@/components/admin/FileViewer";
import FileFeedbackModal from "@/components/admin/FileFeedbackModal";
import { FileFeedbackEntry } from "@/lib/types/fileFeedback";

type TabType = 'overview' | 'personal' | 'credentials' | 'portfolio' | 'signature';

interface TabConfig {
  id: TabType;
  label: string;
  icon: ReactNode;
}

interface PortfolioFile {
  key: string;
  label: string;
  url: string;
}

interface PortfolioSubmission {
  id: number;
  created_at: string;
  user_id: string;
  full_name: string;
  degree_program: string;
  campus: string;
  portfolio_files: PortfolioFile[] | null;
  photo_url: string;
  signature: string;
  status: string;
  file_feedback: FileFeedbackEntry[] | null;
}

const getPortfolioProgress = (submission: PortfolioSubmission): number => {
  let score = 0;
  const totalSteps = 4;
  if (submission.full_name && submission.degree_program && submission.campus) score++;
  if (submission.photo_url && submission.photo_url.trim() !== "") score++;
  if (submission.signature && submission.signature.trim() !== "") score++;
  if (submission.portfolio_files && Array.isArray(submission.portfolio_files) && submission.portfolio_files.length > 0) score++;
  return (score / totalSteps) * 100;
};

const STATUS_OPTIONS = ["All", "Submitted", "Pending", "Competency Process", "Enrolled", "Graduated"];
const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-gray-100 text-gray-800 ring-gray-300",
  Pending: "bg-yellow-100 text-yellow-800 ring-yellow-300",
  "Competency Process": "bg-blue-100 text-blue-800 ring-blue-300",
  Enrolled: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  Graduated: "bg-purple-100 text-purple-800 ring-purple-300",
  All: "bg-blue-100 text-blue-800 ring-blue-300",
};
const STATUS_ICONS: Record<string, ReactNode> = {
  Submitted: <Clock className="w-4 h-4" />,
  Pending: <Loader2 className="w-4 h-4 animate-spin" />,
  "Competency Process": <Check className="w-4 h-4" />,
  Enrolled: <Check className="w-4 h-4" />,
  Graduated: <Check className="w-4 h-4" />,
};

export default function PortfolioSubmissions({
  focusSubmissionId,
  focusRequestKey,
  onFocusRequestHandled,
}: {
  focusSubmissionId?: string | null;
  focusRequestKey?: number;
  onFocusRequestHandled?: (key: number) => void;
}) {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubmission, setSelectedSubmission] = useState<PortfolioSubmission | null>(null);
  const [selectedAppData, setSelectedAppData] = useState<Record<string, any> | null>(null);
  const [loadingAppData, setLoadingAppData] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { modalProps, showConfirm } = useModal();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/portfolio-submission?all=true", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Failed to load submissions"); }
        else { setSubmissions(json.submissions || []); }
      } catch (err: any) {
        setError(err.message || "Unexpected error");
      }
      setLoading(false);
    };
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (!focusSubmissionId || submissions.length === 0) return;
    const requestKey = focusRequestKey ?? 0;
    const targetId = Number(focusSubmissionId);
    if (Number.isNaN(targetId)) { onFocusRequestHandled?.(requestKey); return; }
    const targetSubmission = submissions.find((sub) => sub.id === targetId);
    if (!targetSubmission) { onFocusRequestHandled?.(requestKey); return; }
    setSearchTerm(""); setStatusFilter("All"); setCurrentPage(1);
    setSelectedSubmission(targetSubmission);
    setIsModalOpen(true);
    onFocusRequestHandled?.(requestKey);
  }, [focusSubmissionId, focusRequestKey, submissions, onFocusRequestHandled]);

  const filteredSubmissions = useMemo(() => {
    if (!Array.isArray(submissions)) return [];
    const lowerSearch = searchTerm.toLowerCase();

    const filtered = submissions.filter((sub) => {
      const statusMatch = statusFilter === "All" || sub.status === statusFilter;
      const searchMatch =
        sub.full_name?.toLowerCase().includes(lowerSearch) ||
        sub.degree_program?.toLowerCase().includes(lowerSearch) ||
        sub.campus?.toLowerCase().includes(lowerSearch);
      return statusMatch && searchMatch;
    });

    return filtered.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateSort === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [submissions, searchTerm, statusFilter, dateSort]);

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(start, start + itemsPerPage);
  }, [filteredSubmissions, currentPage]);

  const totalPages = useMemo(() => Math.ceil(filteredSubmissions.length / itemsPerPage), [filteredSubmissions]);

  const handleViewDetails = async (submission: PortfolioSubmission) => {
    setSelectedSubmission(submission);
    setSelectedAppData(null);
    setIsModalOpen(true);

    // Re-fetch the latest submission row via service-role API so portfolio_files is always fresh
    let latestSubmission: PortfolioSubmission = submission;
    try {
      const freshRes = await fetch(`/api/portfolio-submission?id=${submission.id}`, { cache: "no-store" });
      if (freshRes.ok) {
        const freshJson = await freshRes.json();
        if (freshJson.submission) {
          latestSubmission = freshJson.submission as PortfolioSubmission;
          setSelectedSubmission(latestSubmission);
          setSubmissions((prev) => prev.map((s) => (s.id === submission.id ? latestSubmission : s)));
        }
      }
    } catch { /* use original submission */ }

    // Fetch linked application data via service-role API (bypasses RLS)
    setLoadingAppData(true);
    try {
      const res = await fetch(`/api/my-application?user_id=${encodeURIComponent(submission.user_id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.application) setSelectedAppData(json.application);
      }
    } catch { /* no app data */ }
    setLoadingAppData(false);

    // Auto-change "Submitted" → "Pending"
    if (latestSubmission.status === "Submitted") {
      setUpdatingStatusId(submission.id);
      try {
        const res = await fetch('/api/update-status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'portfolio_submissions',
            idColumn: 'id',
            id: submission.id,
            status: 'Pending',
          }),
        });
        const json = await res.json();
        if (res.ok && json.data) {
          const updated = json.data as PortfolioSubmission;
          setSubmissions((prev) => prev.map((s) => (s.id === submission.id ? updated : s)));
          setSelectedSubmission(updated);
        } else {
          console.error('Failed to auto-update portfolio status:', json.error);
        }
      } catch (err) {
        console.error('Error auto-updating portfolio status:', err);
      } finally {
        setUpdatingStatusId(null);
      }
    }
  };

  const handleCloseModal = () => { setIsModalOpen(false); setSelectedSubmission(null); setSelectedAppData(null); };

  const handleStatusChange = async (submissionId: number, newStatus: string) => {
    setUpdatingStatusId(submissionId);
    const { data: updatedData, error: updateError } = await supabase
      .from("portfolio_submissions")
      .update({ status: newStatus })
      .eq("id", submissionId)
      .select()
      .single();
    setUpdatingStatusId(null);
    if (!updateError && updatedData) {
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? (updatedData as PortfolioSubmission) : s)));
      if (selectedSubmission?.id === submissionId) setSelectedSubmission(updatedData as PortfolioSubmission);
    } else if (updateError) {
      setError(`Failed to update status: ${updateError.message}`);
    }
  };

  const handleDelete = async (submissionId: number, submissionName: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete the submission for "${submissionName}"?`,
      "Delete Submission", "danger", "Yes, Delete", "Cancel"
    );
    if (!confirmed) return;
    setDeletingId(submissionId);
    const { error: deleteError } = await supabase.from("portfolio_submissions").delete().eq("id", submissionId);
    setDeletingId(null);
    if (deleteError) { setError(`Failed to delete: ${deleteError.message}`); }
    else { setSubmissions((prev) => prev.filter((s) => s.id !== submissionId)); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="animate-spin mr-3 h-6 w-6 text-gray-500" />
        <p className="text-gray-600">Loading portfolio submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span><span className="font-medium">Error:</span> {error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-700">Portfolio Submissions</span>
          <span className="px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
            {filteredSubmissions.length} / {submissions.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-56">
            <input
              type="text"
              placeholder="Search name, degree, campus..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {/* Date Sort */}
          <div className="relative">
            <select
              value={dateSort}
              onChange={(e) => { setDateSort(e.target.value as "newest" | "oldest"); setCurrentPage(1); }}
              className="appearance-none pl-4 pr-8 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 shadow-sm"
            >
              <option value="newest">Date: Newest First</option>
              <option value="oldest">Date: Oldest First</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className={`appearance-none pl-3 pr-8 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${STATUS_COLORS[statusFilter]}`}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Degree</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campus</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedSubmissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No submissions found{searchTerm && " matching your search."}{statusFilter !== "All" && ` with status "${statusFilter}".`}
                </td>
              </tr>
            ) : (
              paginatedSubmissions.map((sub) => (
                <tr key={sub.id} className="text-black hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {sub.photo_url ? (
                          <img className="h-10 w-10 rounded-full object-cover bg-gray-200" src={sub.photo_url} alt="Photo"
                            onError={(e) => { e.currentTarget.src = "/assets/default-avatar.png"; }} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Camera className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{sub.full_name || "N/A"}</div>
                        <div className="text-xs text-gray-500">ID: {sub.user_id?.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sub.degree_program || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sub.campus || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                    <div className="flex flex-col gap-2">
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-500">Completeness</span>
                          <span className="font-bold text-gray-700">{Math.round(getPortfolioProgress(sub))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${getPortfolioProgress(sub) >= 100 ? "bg-green-500" : getPortfolioProgress(sub) >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                            style={{ width: `${getPortfolioProgress(sub)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {(updatingStatusId === sub.id || deletingId === sub.id) && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                        <button
                          onClick={() => handleViewDetails(sub)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 ring-1 ring-inset cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1 ${STATUS_COLORS[sub.status]}`}
                        >
                          {STATUS_ICONS[sub.status]}{sub.status}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-center">
                    <ActionsMenu submission={sub} onView={handleViewDetails} onDelete={handleDelete}
                      isDeleting={deletingId === sub.id} isUpdating={updatingStatusId === sub.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {isModalOpen && selectedSubmission && (
        <ViewSubmissionModal
          submission={selectedSubmission}
          appData={selectedAppData}
          loadingAppData={loadingAppData}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
          updatingStatusId={updatingStatusId}
          setSelectedSubmission={setSelectedSubmission}
          adminName={session?.user?.name ?? 'Admin'}
        />
      )}
      <Modal {...modalProps} />
    </div>
  );
}

// ─── View Submission Modal ───
const ViewSubmissionModal: FC<{
  submission: PortfolioSubmission;
  appData: Record<string, any> | null;
  loadingAppData: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  updatingStatusId: number | null;
  setSelectedSubmission: React.Dispatch<React.SetStateAction<PortfolioSubmission | null>>;
  adminName: string;
}> = ({ submission, appData, loadingAppData, onClose, onStatusChange, updatingStatusId, setSelectedSubmission, adminName }) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerFiles, setFileViewerFiles] = useState<FileItem[]>([]);
  const [feedbackModal, setFeedbackModal] = useState<{ fileName: string; fileUrl: string } | null>(null);

  const fmtDate = (d?: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }); } catch { return d; }
  };

  const getFileType = (url: string): 'image' | 'pdf' | 'document' | 'other' => {
    const ext = url.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) return 'document';
    return 'other';
  };

  const openImageViewer = (images: string[], index: number) => {
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const openFileViewer = (files: FileItem[]) => {
    setFileViewerFiles(files);
    setFileViewerOpen(true);
  };

  const collectAllImages = (): string[] => {
    const images: string[] = [];
    if (submission.photo_url) images.push(submission.photo_url);
    if (submission.signature) images.push(submission.signature);

    // Collect images from portfolio files
    const pf = submission.portfolio_files || [];
    pf.forEach((f) => {
      if (getFileType(f.url) === 'image') images.push(f.url);
    });

    // Collect images from appData
    if (appData) {
      const edu = appData.education_background || {};
      ['tertiary', 'secondary', 'elementary', 'technical'].forEach((level) => {
        (edu[level] || []).forEach((e: any) => { if (e.fileUrl && getFileType(e.fileUrl) === 'image') images.push(e.fileUrl); });
      });
      (appData.certifications || []).forEach((e: any) => { if (e.fileUrl && getFileType(e.fileUrl) === 'image') images.push(e.fileUrl); });
      (appData.publications || []).forEach((e: any) => { if (e.fileUrl && getFileType(e.fileUrl) === 'image') images.push(e.fileUrl); });
      (appData.inventions || []).forEach((e: any) => { if (e.fileUrl && getFileType(e.fileUrl) === 'image') images.push(e.fileUrl); });
      (appData.recognitions || []).forEach((e: any) => { if (e.fileUrl && getFileType(e.fileUrl) === 'image') images.push(e.fileUrl); });
      (appData.creative_works || []).forEach((e: any) => { if (e.fileUrl && getFileType(e.fileUrl) === 'image') images.push(e.fileUrl); });
    }

    return [...new Set(images)]; // Remove duplicates
  };

  const collectAllFiles = (): FileItem[] => {
    const files: FileItem[] = [];

    // Portfolio files
    const pf = submission.portfolio_files || [];
    pf.forEach((f) => {
      files.push({
        name: f.label || f.key,
        url: f.url,
        type: getFileType(f.url),
      });
    });

    // AppData files
    if (appData) {
      const edu = appData.education_background || {};
      ['tertiary', 'secondary', 'elementary', 'technical'].forEach((level) => {
        (edu[level] || []).forEach((e: any) => {
          if (e.fileUrl) files.push({ name: `${level}: ${e.schoolName}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
        });
      });
      (appData.non_formal_education || []).forEach((e: any) => {
        if (e.fileUrl) files.push({ name: `Non-Formal: ${e.title}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
      });
      (appData.certifications || []).forEach((e: any) => {
        if (e.fileUrl) files.push({ name: `Cert: ${e.title}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
      });
      (appData.publications || []).forEach((e: any) => {
        if (e.fileUrl) files.push({ name: `Pub: ${e.title}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
      });
      (appData.inventions || []).forEach((e: any) => {
        if (e.fileUrl) files.push({ name: `Inv: ${e.title}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
      });
      const work = appData.work_experiences || {};
      ['employment', 'consultancy', 'selfEmployment'].forEach((type) => {
        (work[type] || []).forEach((e: any) => {
          if (e.fileUrl) files.push({ name: `Work: ${e.company || e.consultancy}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
        });
      });
      (appData.recognitions || []).forEach((e: any) => {
        if (e.fileUrl) files.push({ name: `Rec: ${e.title}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
      });
      const pd = appData.professional_development || {};
      ['memberships', 'projects', 'research'].forEach((type) => {
        (pd[type] || []).forEach((e: any) => {
          if (e.fileUrl) files.push({ name: `PD: ${e.title || e.organization}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
        });
      });
      (appData.creative_works || []).forEach((e: any) => {
        if (e.fileUrl) files.push({ name: `Creative: ${e.title}`, url: e.fileUrl, type: getFileType(e.fileUrl) });
      });
    }

    return files;
  };

  const FileLink = ({ label, url }: { label: string; url?: string }) => {
    if (!url) return null;
    const type = getFileType(url);
    const allImages = collectAllImages();
    const allFiles = collectAllFiles();

    return (
      <div className="flex items-center gap-2 group">
        {type === 'image' ? (
          <>
            <button
              onClick={() => openImageViewer(allImages, allImages.indexOf(url))}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
              title="View with magnifier"
            >
              <ImageIcon size={14} />
              <span className="truncate">{label}</span>
              <ZoomIn size={12} className="text-gray-400 group-hover:text-blue-600" />
            </button>
            <button
              onClick={() => openFileViewer([{ name: label, url, type }])}
              className="text-gray-400 hover:text-blue-600"
              title="Open in file viewer"
            >
              <File size={12} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => openFileViewer([{ name: label, url, type }])}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
            >
              {type === 'pdf' ? <FileText size={14} /> : <File size={14} />}
              <span className="truncate">{label}</span>
            </button>
            <button
              onClick={() => openFileViewer([{ name: label, url, type }])}
              className="text-gray-400 hover:text-blue-600"
              title="Open in viewer"
            >
              <File size={12} />
            </button>
          </>
        )}
      </div>
    );
  };

  const Section = ({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) => (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
          {icon} {title}
        </h4>
        {action}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value?: ReactNode }) => (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-[150px] shrink-0">{label}:</span>
      <span className="text-gray-900 break-words">{value || "—"}</span>
    </div>
  );

  const edu = appData?.education_background || {};
  const work = appData?.work_experiences || {};
  const pd = appData?.professional_development || {};

  const credentialSections = appData ? [
    {
      title: "C. Educational Background",
      icon: <GraduationCap size={14} />,
      entries: [
        ...(edu.tertiary || []).map((e: any) => ({ label: `Tertiary: ${e.schoolName}${e.degreeProgram ? ` — ${e.degreeProgram}` : ""} (${e.yearGraduated || ""})`, url: e.fileUrl })),
        ...(edu.secondary || []).map((e: any) => ({ label: `Secondary: ${e.schoolName} (${e.yearGraduated || ""})`, url: e.fileUrl })),
        ...(edu.elementary || []).map((e: any) => ({ label: `Elementary: ${e.schoolName} (${e.yearGraduated || ""})`, url: e.fileUrl })),
        ...(edu.technical || []).map((e: any) => ({ label: `Technical: ${e.schoolName} (${e.yearGraduated || ""})`, url: e.fileUrl })),
        ...(appData.non_formal_education || []).map((e: any) => ({ label: `Non-Formal: ${e.title}${e.sponsor ? ` — ${e.sponsor}` : ""}`, url: e.fileUrl })),
      ].filter((e) => e.url),
    },
    {
      title: "D. Certifications",
      icon: <Award size={14} />,
      entries: (appData.certifications || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `${e.title} — ${e.certifyingBodyName || ""}`, url: e.fileUrl })),
    },
    {
      title: "E. Publications & Inventions",
      icon: <FileText size={14} />,
      entries: [
        ...(appData.publications || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Publication: ${e.title} (${e.yearPublished || ""})`, url: e.fileUrl })),
        ...(appData.inventions || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Invention: ${e.title} — ${e.agency || ""}`, url: e.fileUrl })),
      ],
    },
    {
      title: "F. Work Experience",
      icon: <Briefcase size={14} />,
      entries: [
        ...(work.employment || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Employment: ${e.company} — ${e.designation}`, url: e.fileUrl })),
        ...(work.consultancy || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Consultancy: ${e.consultancy} — ${e.companyName || ""}`, url: e.fileUrl })),
        ...(work.selfEmployment || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Self-Employment: ${e.company} — ${e.designation}`, url: e.fileUrl })),
      ],
    },
    {
      title: "G. Recognitions",
      icon: <Award size={14} />,
      entries: (appData.recognitions || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `${e.title} — ${e.awardingBodyName || ""}`, url: e.fileUrl })),
    },
    {
      title: "H. Professional Development",
      icon: <BookOpen size={14} />,
      entries: [
        ...(pd.memberships || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Membership: ${e.organization} — ${e.designation}`, url: e.fileUrl })),
        ...(pd.projects || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Project: ${e.title} — ${e.designation}`, url: e.fileUrl })),
        ...(pd.research || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `Research: ${e.title} — ${e.institution}`, url: e.fileUrl })),
      ],
    },
    {
      title: "I. Creative Works",
      icon: <Star size={14} />,
      entries: (appData.creative_works || []).filter((e: any) => e.fileUrl).map((e: any) => ({ label: `${e.title} — ${e.institutionName || e.institution || ""}`, url: e.fileUrl })),
    },
  ].filter((s) => s.entries.length > 0) : [];

  const allImages = collectAllImages();
  const allFiles = collectAllFiles();
  const imageCount = allImages.length;
  const fileCount = allFiles.length;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col text-black">

          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">Portfolio Submission Details</h2>
              <div className="flex items-center gap-2">
                {imageCount > 0 && (
                  <button
                    onClick={() => openImageViewer(allImages, 0)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <ImageIcon size={16} />
                    {imageCount} Image{imageCount !== 1 ? 's' : ''}
                  </button>
                )}
                {fileCount > 0 && (
                  <button
                    onClick={() => openFileViewer(allFiles)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <FolderOpen size={16} />
                    {fileCount} File{fileCount !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
              <X size={26} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Photo + Name + Status */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <img
                  className="h-20 w-20 rounded-full object-cover bg-gray-200 shadow shrink-0 cursor-pointer"
                  src={submission.photo_url || "/assets/default-avatar.png"}
                  alt="Photo"
                  onClick={() => submission.photo_url && openImageViewer(allImages, allImages.indexOf(submission.photo_url))}
                  onError={(e) => { e.currentTarget.src = "/assets/default-avatar.png"; }}
                />
                {submission.photo_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => openImageViewer(allImages, allImages.indexOf(submission.photo_url))}>
                    <ZoomIn size={20} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 truncate">{submission.full_name || "N/A"}</h3>
                <p className="text-sm text-gray-500">{submission.degree_program || "N/A"} — {submission.campus || "N/A"}</p>
                <p className="text-xs text-gray-400 mt-0.5">Submitted: {fmtDate(submission.created_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className={`text-xs font-semibold rounded-full px-3 py-1 inline-flex items-center gap-1.5 ${STATUS_COLORS[submission.status] || STATUS_COLORS["Submitted"]}`}>
                  {updatingStatusId === submission.id ? <Loader2 className="h-3 w-3 animate-spin" /> : STATUS_ICONS[submission.status]}
                  {submission.status}
                </div>
              </div>
            </div>

            {/* Personal Info */}
            {loadingAppData ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-2 justify-center">
                <Loader2 className="animate-spin h-4 w-4" /> Loading application data...
              </div>
            ) : appData ? (
              <Section icon={<BookOpen size={15} />} title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  <Row label="Full Name" value={appData.applicant_name} />
                  <Row label="Email" value={appData.email_address} />
                  <Row label="Mobile" value={appData.mobile_number} />
                  <Row label="Birthday" value={fmtDate(appData.birth_date)} />
                  <Row label="Birthplace" value={appData.birth_place} />
                  <Row label="Age" value={appData.age} />
                  <Row label="Gender" value={appData.gender} />
                  <Row label="Civil Status" value={appData.civil_status} />
                  <Row label="Nationality" value={appData.nationality} />
                  <Row label="Religion" value={appData.religion} />
                  <Row label="Language Spoken" value={appData.language_spoken} />
                  <Row label="City Address" value={appData.city_address} />
                  <Row label="Permanent Address" value={appData.permanent_address} />
                  <Row label="Emergency Contact" value={appData.emergency_contact_name} />
                  <Row label="Emergency Relationship" value={appData.emergency_relationship} />
                  <Row label="Emergency Number" value={appData.emergency_contact_number} />
                </div>
              </Section>
            ) : (
              <p className="text-sm text-gray-400 italic text-center">No linked application data found.</p>
            )}

            {/* C–I Credential Files */}
            {!loadingAppData && credentialSections.length > 0 && (
              <Section
                icon={<FileText size={15} />}
                title="Credential Files (C–I)"
                action={
                  <button
                    onClick={() => openFileViewer(allFiles.filter(f => credentialSections.some(s => s.entries.some((e: { url?: string }) => e.url === f.url))))}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                }
              >
                <div className="space-y-4">
                  {credentialSections.map((sec) => (
                    <div key={sec.title}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        {sec.icon} {sec.title}
                      </p>
                      <div className="pl-3 space-y-1 border-l-2 border-gray-200">
                        {sec.entries.map((e: { label: string; url?: string }, i: number) => <FileLink key={i} label={e.label} url={e.url} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {!loadingAppData && appData && credentialSections.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center">No credential files uploaded in the application form.</p>
            )}

            {/* Portfolio Files submitted via portform */}
            {(() => {
              const PORT_GROUPS = [
                { key: "eteeapForm", label: "Accomplished ETEEAP Application Form" },
                { key: "cv", label: "Curriculum Vitae" },
                { key: "psychTest", label: "Psychological Test" },
                { key: "authenticity", label: "Statement of Ownership/Authenticity" },
                { key: "endorsement", label: "Endorsement Letter" },
                { key: "otherDocs", label: "Other Documents Required" },
                { key: "visitation", label: "Workplace Visitation Checklist" },
                { key: "otherEvidence", label: "Other Evidence" },
              ];
              const pf = submission.portfolio_files || [];
              const grouped = PORT_GROUPS.map((g) => ({
                ...g,
                files: pf.filter((f) => f.key === g.key),
              }));
              const hasFiles = grouped.some(g => g.files.length > 0);

              return (
                <Section
                  icon={<Star size={15} />}
                  title="Portfolio Files Submitted"
                  action={hasFiles ? (
                    <button
                      onClick={() => openFileViewer(allFiles.filter(f => pf.some(pf => pf.url === f.url)))}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All
                    </button>
                  ) : undefined}
                >
                  <div className="space-y-3">
                    {grouped.map((g) => (
                      <div key={g.key}>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                          {g.files.length > 0
                            ? <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" />
                            : <span className="w-2 h-2 rounded-full bg-gray-300 inline-block shrink-0" />}
                          {g.label}
                        </p>
                        <div className="pl-4 space-y-1 border-l-2 border-gray-200">
                          {g.files.length > 0 ? (
                            g.files.map((f, i) => (
                              <FileLink key={i} label={f.label || f.key} url={f.url} />
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">Not yet uploaded</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            })()}

            {/* Signature */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">Applicant Signature</p>
              <div className="border rounded-lg p-2 bg-gray-100 max-w-xs mx-auto relative group">
                {submission.signature ? (
                  <>
                    <img
                      src={submission.signature}
                      alt="Signature"
                      className="w-full h-auto object-contain cursor-pointer"
                      onClick={() => openImageViewer(allImages, allImages.indexOf(submission.signature))}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
                      onClick={() => openImageViewer(allImages, allImages.indexOf(submission.signature))}
                    >
                      <ZoomIn size={24} className="text-white" />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center p-4">No signature provided.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl sticky bottom-0 flex justify-between items-center">
            <div className='flex items-center gap-2 text-xs text-gray-500'>
              <span>ID: {submission.id}</span>
              <span>·</span>
              <span>User: {submission.user_id?.substring(0, 12)}…</span>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              {/* Status Selector — Submitted and Pending are system-managed only */}
              {["Competency Process", "Enrolled", "Graduated"].map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(submission.id, s)}
                  disabled={updatingStatusId === submission.id || submission.status === s}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${submission.status === s
                    ? `${STATUS_COLORS[s] || ''} border-transparent shadow-sm`
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                    } disabled:opacity-60 disabled:cursor-default`}
                >
                  {submission.status === s && <Check size={13} />}
                  {s}
                </button>
              ))}
              <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
                Close
              </button>
              <button
                onClick={() => openPortfolioPrintPreview(submission, appData)}
                className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Printer size={15} />
                Print Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        title="Portfolio Images"
        onFeedback={(url, name) => setFeedbackModal({ fileName: name, fileUrl: url })}
      />

      {/* File Viewer */}
      <FileViewer
        files={fileViewerFiles}
        isOpen={fileViewerOpen}
        onClose={() => setFileViewerOpen(false)}
        title="Portfolio Files"
        onFeedback={(url, name) => setFeedbackModal({ fileName: name, fileUrl: url })}
      />

      {/* File Feedback Modal */}
      {feedbackModal && (
        <FileFeedbackModal
          isOpen={true}
          onClose={() => setFeedbackModal(null)}
          fileName={feedbackModal.fileName}
          sourceType="portfolio"
          recordId={String(submission.id)}
          adminName={adminName}
          onSuccess={(entry) => {
            setSelectedSubmission((prev) =>
              prev ? { ...prev, file_feedback: [...(prev.file_feedback || []), entry] } : prev
            );
            setFeedbackModal(null);
          }}
        />
      )}
    </>
    , document.body);
};

// ─── Actions Menu ───
const ActionsMenu: FC<{
  submission: PortfolioSubmission;
  onView: (s: PortfolioSubmission) => void;
  onDelete: (id: number, name: string) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}> = ({ submission, onView, onDelete, isDeleting, isUpdating }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} disabled={isDeleting || isUpdating}
        className="p-2 rounded-full hover:bg-gray-200 transition-colors">
        <MoreHorizontal size={18} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
          <button onClick={() => { onView(submission); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
            <Eye size={16} /> View Details
          </button>
          <button onClick={() => { onDelete(submission.id, submission.full_name); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            <Trash2 size={16} /> Delete Submission
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Pagination ───
const PaginationControls: FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center space-x-2 mt-6">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button key={page} onClick={() => onPageChange(page)}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${currentPage === page ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          {page}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
        Next
      </button>
    </div>
  );
};
