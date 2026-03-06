"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Link from "next/link";
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
} from "lucide-react";

interface Application {
  application_id: string;
  applicant_name: string | null;
  degree_applied_for: string | null;
  campus: string | null;
  status: string | null;
  admin_remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const STEPS = [
  {
    key: "Submitted",
    label: "Submitted",
    description: "Your application has been received and is in our system.",
    icon: FileText,
  },
  {
    key: "Pending",
    label: "Under Review",
    description: "An admin is currently reviewing your submission.",
    icon: SearchIcon,
  },
  {
    key: "Decision",
    label: "Decision",
    description: "A final decision has been made on your application.",
    icon: CheckCircle2,
  },
];

function getStepIndex(status: string | null): number {
  const s = status || "Submitted";
  if (s === "Submitted") return 0;
  if (s === "Pending") return 1;
  if (s === "Approved" || s === "Declined") return 2;
  return 0;
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
  const isApproved = application.status === "Approved";
  const isDeclined = application.status === "Declined";
  const isFinal = isApproved || isDeclined;

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
          <span
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full ${
              isApproved
                ? "bg-green-100 text-green-700"
                : isDeclined
                ? "bg-red-100 text-red-700"
                : application.status === "Pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isApproved
              ? "Approved"
              : isDeclined
              ? "Declined"
              : application.status === "Pending"
              ? "Under Review"
              : "Submitted"}
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
          {/* Progress Steps */}
          <div className="py-8">
            <div className="flex items-start justify-between relative">
              {/* Connector Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div
                className={`absolute top-6 left-0 h-0.5 z-0 transition-all duration-700 ${
                  isDeclined ? "bg-red-400" : "bg-green-400"
                }`}
                style={{
                  width:
                    currentStepIdx === 0
                      ? "0%"
                      : currentStepIdx === 1
                      ? "50%"
                      : "100%",
                }}
              />

              {STEPS.map((step, idx) => {
                const isActive = idx === currentStepIdx;
                const isComplete = idx < currentStepIdx;
                const isFinalStep = idx === 2;
                const stepIsDeclined = isFinalStep && isDeclined;

                let circleClasses = "";
                let iconColor = "";

                if (stepIsDeclined) {
                  circleClasses = "bg-red-500 ring-4 ring-red-100";
                  iconColor = "text-white";
                } else if (isComplete) {
                  circleClasses = "bg-green-500 ring-4 ring-green-100";
                  iconColor = "text-white";
                } else if (isActive && !isFinalStep) {
                  circleClasses =
                    "bg-yellow-400 ring-4 ring-yellow-100 animate-pulse";
                  iconColor = "text-white";
                } else if (isActive && isFinalStep && isApproved) {
                  circleClasses = "bg-green-500 ring-4 ring-green-100";
                  iconColor = "text-white";
                } else {
                  circleClasses = "bg-gray-200";
                  iconColor = "text-gray-400";
                }

                const StepIcon =
                  isFinalStep && isDeclined
                    ? XCircle
                    : isFinalStep && isApproved
                    ? CheckCircle2
                    : step.icon;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center z-10 flex-1"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${circleClasses}`}
                    >
                      {isComplete && !isFinalStep ? (
                        <CheckCircle2 className={`w-6 h-6 ${iconColor}`} />
                      ) : (
                        <StepIcon className={`w-6 h-6 ${iconColor}`} />
                      )}
                    </div>
                    <p
                      className={`mt-3 text-sm font-semibold ${
                        isActive || isComplete
                          ? stepIsDeclined
                            ? "text-red-700"
                            : "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {isFinalStep
                        ? isApproved
                          ? "Approved"
                          : isDeclined
                          ? "Declined"
                          : "Decision"
                        : step.label}
                    </p>
                    <p
                      className={`text-xs mt-1 text-center max-w-[140px] ${
                        isActive || isComplete
                          ? "text-gray-500"
                          : "text-gray-300"
                      }`}
                    >
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
            {application.updated_at &&
              application.updated_at !== application.created_at && (
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
            <div
              className={`mt-4 p-4 rounded-xl border ${
                isDeclined
                  ? "bg-red-50 border-red-200"
                  : isApproved
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare
                  className={`w-4 h-4 ${
                    isDeclined
                      ? "text-red-500"
                      : isApproved
                      ? "text-green-500"
                      : "text-blue-500"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    isDeclined
                      ? "text-red-700"
                      : isApproved
                      ? "text-green-700"
                      : "text-blue-700"
                  }`}
                >
                  Remarks from Admin
                </span>
              </div>
              <p
                className={`text-sm ${
                  isDeclined
                    ? "text-red-600"
                    : isApproved
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {application.admin_remarks}
              </p>
            </div>
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

  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.email && !hasFetched) {
      fetchApplications(session.user.email);
    }
  }, [authStatus, session, hasFetched]);

  const fetchApplications = async (email: string) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

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

        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              No Applications Found
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We couldn&apos;t find any applications associated with your
              account. Start by submitting an application.
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
