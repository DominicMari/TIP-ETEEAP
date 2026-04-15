"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import supabase from "@/lib/supabase/client";
import {
  CheckCircle2,
  Clock,
  Search as SearchIcon,
  FileText,
  XCircle,
  ArrowLeft,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MapPin,
  Calendar,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { FileFeedbackSection } from "@/components/FileFeedbackSection";
import { FileFeedbackEntry } from "@/lib/types/fileFeedback";

interface Application {
  application_id: string;
  applicant_name: string | null;
  degree_applied_for: string | null;
  campus: string | null;
  status: string | null;
  admin_remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
  file_feedback: FileFeedbackEntry[] | null;
}

const STEPS = [
  {
    key: "Submitted",
    label: "Submitted",
    description: "Application received.",
    icon: FileText,
  },
  {
    key: "Pending",
    label: "Under Review",
    description: "Admin is reviewing your submission.",
    icon: SearchIcon,
  },
  {
    key: "Competency Process",
    label: "Competency Process",
    description: "Undergoing competency evaluation.",
    icon: TrendingUp,
  },
  {
    key: "Enrolled",
    label: "Enrolled",
    description: "Successfully enrolled in the program.",
    icon: UserCheck,
  },
  {
    key: "Graduated",
    label: "Graduated",
    description: "Congratulations, you have graduated!",
    icon: GraduationCap,
  },
];

function getStepIndex(status: string | null): number {
  switch (status) {
    case "Submitted": return 0;
    case "Pending": return 1;
    case "Competency Process": return 2;
    case "Enrolled": return 3;
    case "Graduated": return 4;
    case "Declined": return 1; // stays at Under Review but marked declined
    default: return 0;
  }
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case "Submitted": return "Submitted";
    case "Pending": return "Under Review";
    case "Competency Process": return "Competency Process";
    case "Enrolled": return "Enrolled";
    case "Graduated": return "Graduated";
    case "Approved": return "Approved";
    case "Declined": return "Declined";
    default: return "Submitted";
  }
}

function getStatusBadgeClass(status: string | null): string {
  switch (status) {
    case "Enrolled":
    case "Graduated": return "bg-green-100 text-green-700";
    case "Declined": return "bg-red-100 text-red-700";
    case "Pending": return "bg-yellow-100 text-yellow-700";
    case "Competency Process": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-700"; // Submitted
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

function ProgressTracker({ application }: { application: Application }) {
  const [expanded, setExpanded] = useState(true);
  const currentStepIdx = getStepIndex(application.status);
  const isDeclined = application.status === "Declined";
  const totalSteps = STEPS.length;
  // Progress line width: 0% at step 0, 100% at last step
  const progressPct = currentStepIdx === 0 ? 0 : (currentStepIdx / (totalSteps - 1)) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {application.applicant_name || "Application"}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                {application.degree_applied_for || "N/A"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {application.campus || "N/A"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full ${getStatusBadgeClass(application.status)}`}>
            {getStatusLabel(application.status)}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">

          {/* Declined banner */}
          {isDeclined && (
            <div className="mt-5 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              <XCircle className="w-4 h-4 shrink-0" />
              Your application was not approved at this stage.
            </div>
          )}

          {/* Progress Steps */}
          <div className="py-8 overflow-x-auto">
            <div className="flex items-start justify-between relative min-w-[480px]">
              {/* Background track */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              {/* Filled progress */}
              <div
                className={`absolute top-6 left-0 h-0.5 z-0 transition-all duration-700 ${isDeclined ? "bg-red-400" : "bg-green-400"}`}
                style={{ width: `${progressPct}%` }}
              />

              {STEPS.map((step, idx) => {
                const isActive = idx === currentStepIdx && !isDeclined;
                const isComplete = idx < currentStepIdx;
                const isDeclinedStep = isDeclined && idx === currentStepIdx;
                const StepIcon = isDeclinedStep ? XCircle : (isComplete || isActive) ? CheckCircle2 : step.icon;

                let circleClasses = "bg-gray-200";
                let iconColor = "text-gray-400";

                if (isDeclinedStep) {
                  circleClasses = "bg-red-500 ring-4 ring-red-100";
                  iconColor = "text-white";
                } else if (isComplete) {
                  circleClasses = "bg-green-500 ring-4 ring-green-100";
                  iconColor = "text-white";
                } else if (isActive) {
                  circleClasses = "bg-yellow-400 ring-4 ring-yellow-100 animate-pulse";
                  iconColor = "text-white";
                }

                return (
                  <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${circleClasses}`}>
                      <StepIcon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <p className={`mt-3 text-xs font-semibold text-center max-w-[90px] leading-tight ${isActive || isComplete
                      ? isDeclinedStep ? "text-red-700" : "text-gray-900"
                      : "text-gray-400"
                      }`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] mt-1 text-center max-w-[90px] leading-tight ${isActive || isComplete ? "text-gray-500" : "text-gray-300"
                      }`}>
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                Submitted:{" "}
                <span className="font-medium text-gray-700">
                  {formatDate(application.created_at)}
                </span>
              </span>
            </div>
            {application.updated_at && application.updated_at !== application.created_at && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>
                  Last Updated:{" "}
                  <span className="font-medium text-gray-700">
                    {formatDate(application.updated_at)}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Admin Remarks */}
          {application.admin_remarks && (
            <div className={`mt-4 p-4 rounded-xl border ${isDeclined ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className={`w-4 h-4 ${isDeclined ? "text-red-500" : "text-blue-500"}`} />
                <span className={`text-sm font-semibold ${isDeclined ? "text-red-700" : "text-blue-700"}`}>
                  Remarks from Admin
                </span>
              </div>
              <p className={`text-sm ${isDeclined ? "text-red-600" : "text-blue-600"}`}>
                {application.admin_remarks}
              </p>
            </div>
          )}

          {/* File Feedback */}
          {application.file_feedback && application.file_feedback.length > 0 && (
            <FileFeedbackSection feedback={application.file_feedback} />
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationTrackerPage() {
  const { data: session, status: authStatus } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchApplications = async (email: string, isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/applicants?email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch applications");
      }

      const { applications } = await response.json();
      setApplications((applications as Application[]) || []);
      setHasFetched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Set up Supabase Realtime subscription with polling fallback
  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.user?.email) return;

    const email = session.user.email;

    // Initial fetch
    fetchApplications(email, true);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let realtimeConnected = false;

    // Attempt Supabase Realtime subscription
    try {
      channel = supabase
        .channel("tracker-applications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
            filter: `email_address=eq.${email}`,
          },
          () => {
            fetchApplications(email);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            realtimeConnected = true;
            // Clear polling if Realtime connected successfully
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            // Realtime unavailable — fall back to polling
            if (!realtimeConnected && !pollingIntervalRef.current) {
              pollingIntervalRef.current = setInterval(() => {
                fetchApplications(email);
              }, 30_000);
            }
          }
        });
    } catch {
      // Realtime setup failed — fall back to polling
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          fetchApplications(email);
        }, 30_000);
      }
    }

    // Start polling as a safety net; cancel it once Realtime confirms SUBSCRIBED
    const safetyPollTimeout = setTimeout(() => {
      if (!realtimeConnected && !pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          fetchApplications(email);
        }, 30_000);
      }
    }, 5_000);

    return () => {
      clearTimeout(safetyPollTimeout);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, session?.user?.email]);

  // Not authenticated
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <SearchIcon className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Application Tracker</h1>
          <p className="text-gray-400 mb-8">
            Sign in with your Google account to view the real-time status of
            your application.
          </p>
          <button
            onClick={() => signIn("google", { prompt: "select_account" })}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <img
              src="/assets/googleicon.png"
              alt="Google"
              className="w-6 h-6"
            />
            Sign in with Google
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mt-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
            <SearchIcon className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Application Tracker</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Tracking applications for{" "}
              <span className="text-yellow-400 font-medium">
                {session?.user?.email}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mb-4" />
            <p className="text-gray-400">Loading your applications...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && hasFetched && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              No Applications Found
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No application found. Please complete and submit your application form.
            </p>
            <Link
              href="/appform"
              className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Start Application
            </Link>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => (
              <ProgressTracker key={app.application_id} application={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
