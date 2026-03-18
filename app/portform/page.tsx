"use client";
import React, { useState, useRef, useEffect } from "react";
import supabase from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import { Camera, User, GraduationCap, Folder, PenTool, Loader2, ArrowLeft } from "lucide-react";
import SignaturePad, { SignaturePadHandles } from "../portform/signature";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataPrivacyConsent from "./undertaking";
import FileUploader from "./FileUploader";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/components/ui/useModal";

// --- FormField Helper ---
const FormField = ({ icon, children, className }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={`relative mb-4 ${className}`}>
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">{icon}</div>
    {children}
  </div>
);

// ─── All upload keys for submission ───
const allUploadKeys = [
  { key: "eteeapForm", label: "Accomplished ETEEAP Application and Preliminary Assessment Form" },
  { key: "cv", label: "Curriculum Vitae" },
  { key: "psychTest", label: "Psychological Test" },
  { key: "authenticity", label: "Statement of Ownership/Authenticity" },
  { key: "endorsement", label: "Endorsement Letter from the latest employer" },
  { key: "otherDocs", label: "Other Documents Required" },
  { key: "visitation", label: "Workplace Visitation Checklist" },
  { key: "otherEvidence", label: "Other Evidence of capability and knowledge" },
];

// ─── Underline field for cover sheet ───
const CoverField = ({ label, value, width }: { label: string; value?: string | null; width?: string }) => (
  <div className={`flex items-baseline gap-1 ${width || ""}`}>
    <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{label}</span>
    <span className="flex-1 border-b border-gray-400 text-xs text-gray-900 pb-0.5 min-w-[80px]">
      {value || "\u00A0"}
    </span>
  </div>
);

// ─── Credential summary from appform Steps C–I ───
function CredSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CredLink({ label, url }: { label: string; url?: string }) {
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
        📎 {label}
      </a>
    );
  }
  return <p className="text-xs text-gray-700 leading-snug">• {label}</p>;
}

function AppformCredentials({ appData }: { appData: Record<string, any> }) {
  const edu = appData.education_background || {};
  const nonFormal: any[] = appData.non_formal_education || [];
  const certs: any[] = appData.certifications || [];
  const pubs: any[] = appData.publications || [];
  const invs: any[] = appData.inventions || [];
  const work = appData.work_experiences || {};
  const recs: any[] = appData.recognitions || [];
  const profDev = appData.professional_development || {};
  const creative: any[] = appData.creative_works || [];

  // Flatten all entries that have a fileUrl
  const allEntries: { section: string; label: string; url?: string }[] = [];

  const addEntries = (section: string, list: any[], labelFn: (e: any) => string) =>
    list.forEach(e => allEntries.push({ section, label: labelFn(e), url: e.fileUrl }));

  const eduLevels = [
    { key: "tertiary", label: "Tertiary" }, { key: "secondary", label: "Secondary" },
    { key: "elementary", label: "Elementary" }, { key: "technical", label: "Technical" },
  ];
  eduLevels.forEach(({ key, label }) =>
    addEntries(`C. Formal Education (${label})`, edu[key] || [],
      e => `${e.schoolName}${e.degreeProgram ? ` — ${e.degreeProgram}` : ""} (${e.yearGraduated || ""})`));

  addEntries("D. Non-Formal Education", nonFormal, e => `${e.title}${e.sponsor ? ` — ${e.sponsor}` : ""}`);
  addEntries("E. Certifications", certs, e => `${e.title} — ${e.certifyingBodyName || ""}`);
  addEntries("F. Publications", pubs, e => `${e.title} (${e.yearPublished || ""})`);
  addEntries("F. Inventions", invs, e => `${e.title} — ${e.agency || ""}`);
  addEntries("G. Employment", work.employment || [], e => `${e.company} — ${e.designation}`);
  addEntries("G. Consultancy", work.consultancy || [], e => `${e.consultancy} — ${e.companyName || ""}`);
  addEntries("G. Self-Employment", work.selfEmployment || [], e => `${e.company} — ${e.designation}`);
  addEntries("H. Recognitions", recs, e => `${e.title} — ${e.awardingBodyName || ""}`);
  addEntries("I. Memberships", profDev.memberships || [], e => `${e.organization} — ${e.designation}`);
  addEntries("I. Projects", profDev.projects || [], e => `${e.title} — ${e.designation}`);
  addEntries("I. Research", profDev.research || [], e => `${e.title} — ${e.institution}`);
  addEntries("Creative Works", creative, e => `${e.title} — ${e.institutionName || ""}`);

  // Only show entries that have a fileUrl
  const withFiles = allEntries.filter(e => e.url);
  if (withFiles.length === 0) return null;

  // Group by section
  const grouped: Record<string, typeof withFiles> = {};
  withFiles.forEach(e => { if (!grouped[e.section]) grouped[e.section] = []; grouped[e.section].push(e); });

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs mb-1">
      <p className="text-xs font-semibold text-blue-700 mb-2">📋 Uploaded Files from Application (Steps C–I)</p>
      {Object.entries(grouped).map(([section, entries]) => (
        <CredSection key={section} title={section}>
          {entries.map((e, i) => <CredLink key={i} label={e.label} url={e.url} />)}
        </CredSection>
      ))}
    </div>
  );
}

// ─── Main Component ───
export default function ApplicationForm() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    degree: "",
    campus: "Manila",
    photo: null as File | null,
    portfolioFiles: {} as Record<string, File[]>,
  });

  // Application data from Supabase (for cover sheet)
  const [appData, setAppData] = useState<Record<string, any> | null>(null);
  const [appLoading, setAppLoading] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState("");
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const signaturePadRef = useRef<SignaturePadHandles>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const router = useRouter();
  const { modalProps, showAlert } = useModal();

  // Set name from session
  useEffect(() => {
    if (session?.user?.name) setFormData((prev) => ({ ...prev, name: session.user.name! }));
  }, [session]);

  // Fetch Supabase UUID
  useEffect(() => {
    const fetchSupabaseUser = async () => {
      if (session?.user?.email) {
        setUserLoading(true);
        const { data, error } = await supabase.from("users").select("id").eq("email", session.user.email).single();
        if (error) { setSubmitError("Error: Could not find matching user profile."); }
        else if (data) { setSupabaseUserId(data.id); }
        else { setSubmitError("Error: No matching user profile found."); }
        setUserLoading(false);
      } else if (status === "unauthenticated") { setUserLoading(false); }
    };
    fetchSupabaseUser();
  }, [session, status]);

  // Fetch application data for cover sheet
  useEffect(() => {
    if (!session?.user?.email) return;
    const fetchAppData = async () => {
      setAppLoading(true);
      try {
        const res = await fetch(
          `/api/my-application?email=${encodeURIComponent(session.user!.email!)}&t=${Date.now()}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        const data = json.application;
        if (data) {
          // Defensively parse any JSON-string fields
          const parse = (v: any) => {
            if (!v || typeof v !== "string") return v;
            try { return JSON.parse(v); } catch { return v; }
          };
          const parsed = {
            ...data,
            education_background: parse(data.education_background),
            non_formal_education: parse(data.non_formal_education),
            certifications: parse(data.certifications),
            publications: parse(data.publications),
            inventions: parse(data.inventions),
            work_experiences: parse(data.work_experiences),
            recognitions: parse(data.recognitions),
            professional_development: parse(data.professional_development),
            creative_works: parse(data.creative_works),
          };
          setAppData(parsed);
          if (parsed.applicant_name) setFormData((prev) => ({ ...prev, name: parsed.applicant_name }));
          if (parsed.degree_applied_for) setFormData((prev) => ({ ...prev, degree: parsed.degree_applied_for }));
          if (parsed.campus) setFormData((prev) => ({ ...prev, campus: parsed.campus }));
        }
      } catch (err) {
        console.warn("[PortForm] Error fetching application:", err);
      }
      setAppLoading(false);
    };
    fetchAppData();
  }, [session]);

  // Get photo URL from application data
  const appPhotoUrl = appData?.photo_url || null;

  // Pre-filled portfolio files from appform step 7
  const appPortfolioFiles: { title: string; url: string; fileName?: string }[] =
    Array.isArray(appData?.portfolio) ? appData.portfolio : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const portfolioFilesRef = useRef<Record<string, File[]>>({});

  const handleFilesChange = (key: string, files: File[]) => {
    portfolioFilesRef.current = { ...portfolioFilesRef.current, [key]: files };
    setFormData((prev) => ({
      ...prev,
      portfolioFiles: { ...prev.portfolioFiles, [key]: files },
    }));
    if (fileErrors[key]) setFileErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSignatureError("");
    setSubmitError(null);
    setFileErrors({});

    if (!supabaseUserId) { await showAlert("User profile is not loaded.", "Error"); setIsSubmitting(false); return; }
    const signature = signaturePadRef.current?.getSignature();
    if (!signature) { setSignatureError("Please provide your signature."); setIsSubmitting(false); return; }
    if (!formData.photo && !appPhotoUrl) { await showAlert("Please upload a 1x1 photo.", "Photo Required"); setIsSubmitting(false); return; }

    try {
      let photoUrl = appPhotoUrl || "";

      // Upload photo via server-side API (service-role, bypasses RLS)
      if (formData.photo) {
        const photoFd = new FormData();
        photoFd.append("user_id", supabaseUserId);
        photoFd.append("category_key", "photo");
        photoFd.append("category_label", "Photo");
        photoFd.append("file", formData.photo);
        const photoRes = await fetch("/api/portfolio-upload", { method: "POST", body: photoFd });
        if (!photoRes.ok) {
          const e = await photoRes.json();
          throw new Error(`Photo upload failed: ${e.error}`);
        }
        const photoData = await photoRes.json();
        photoUrl = photoData.url;
      }

      // Collect all portfolio files from ref (avoids stale state closure)
      const fileEntries: Array<{ key: string; file: File; label: string }> = [];
      for (const [key, files] of Object.entries(portfolioFilesRef.current)) {
        if (!files || files.length === 0) continue;
        const catLabel = allUploadKeys.find((c) => c.key === key)?.label || key;
        for (const file of files) {
          fileEntries.push({ key, file, label: catLabel });
        }
      }

      console.log("[Portform] files to upload:", fileEntries.length, "keys:", fileEntries.map(f => f.key));

      if (fileEntries.length === 0) {
        console.warn("[Portform] No files selected — submitting with empty portfolio_files");
      }

      // Upload each file via server-side API (service-role, bypasses RLS)
      const portfolioFileUrls = await Promise.all(
        fileEntries.map(async ({ key, file, label }) => {
          const fd = new FormData();
          fd.append("user_id", supabaseUserId);
          fd.append("category_key", key);
          fd.append("category_label", label);
          fd.append("file", file);
          console.log("[Portform] uploading:", file.name, "key:", key);
          const res = await fetch("/api/portfolio-upload", { method: "POST", body: fd });
          const json = await res.json();
          console.log("[Portform] upload result for", file.name, ":", JSON.stringify(json));
          if (!res.ok) {
            throw new Error(`Failed to upload ${file.name}: ${json.error}`);
          }
          return json as { key: string; label: string; fileName: string; url: string };
        })
      );

      const upsertRes = await fetch("/api/portfolio-submission", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: supabaseUserId,
          full_name: formData.name,
          degree_program: formData.degree,
          campus: formData.campus,
          photo_url: photoUrl,
          signature: signature,
          portfolio_files: portfolioFileUrls,
        }),
      });
      const upsertJson = await upsertRes.json();
      console.log("[Portform] PATCH response:", JSON.stringify(upsertJson));
      if (!upsertRes.ok) {
        throw new Error(upsertJson.error || "Failed to save submission");
      }
      setSubmitSuccess(true);
    } catch (error) {
      const errMsg = (error as Error).message;
      setSubmitError(`Submission failed: ${errMsg}`);
      await showAlert(`Submission failed: ${errMsg}`, "Submission Error", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsentAgree = () => setHasConsented(true);
  const handleConsentDisagree = () => router.push("/");

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    } catch { return d; }
  };

  const getFirstPriority = (): string => {
    if (appData?.degree_applied_for) return appData.degree_applied_for;
    if (formData.degree) return formData.degree;
    return "";
  };

  if (!hasConsented) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
        <DataPrivacyConsent onAgree={handleConsentAgree} onDisagree={handleConsentDisagree} />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center flex flex-col items-center">
          <h2 className="text-3xl font-bold text-green-600 mb-4">Submission Successful! 🎉</h2>
          <p className="text-gray-700 mb-8">Thank you for submitting your ETEEAP portfolio. We will review it shortly.</p>
          <Link href="/" className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors">Back to the Home Page</Link>
        </div>
      </div>
    );
  }

  // ─── Main Render ───
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col justify-center items-center font-sans p-4">
      <div className="w-full max-w-6xl mx-auto mb-4">
        <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-black font-semibold transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Home Page
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto lg:grid lg:grid-cols-5 lg:gap-0 bg-white shadow-2xl rounded-2xl overflow-hidden my-8">
        {/* Sidebar */}
        <div className="p-8 bg-gray-800 text-white hidden lg:flex lg:col-span-2 flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2 text-yellow-400">ETEEAP Portfolio</h1>
          <p className="text-lg font-semibold mb-4">Technological Institute of the Philippines</p>
          <p className="text-base mb-6 text-gray-300">Submit your ETEEAP portfolio — a collection of documents demonstrating your knowledge, skills, and prior learning.</p>
          <p className="text-base mb-6 text-gray-300">If you don&apos;t have a document ready, you can skip it. You can update your submission later by contacting an administrator.</p>
          <div className="mt-auto pt-8"><Folder size={80} className="text-yellow-400 opacity-10" /></div>
        </div>

        {/* Form Area */}
        <div className="p-6 lg:p-8 lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="text-center mb-2">
              <h2 className="font-bold text-lg">PORTFOLIO REQUIREMENTS FORM</h2>
              <p className="text-sm italic">For Applicant</p>
            </div>

            {/* Top Header Fields + Photo */}
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                {appLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                    <Loader2 size={12} className="animate-spin" /> Loading application data...
                  </div>
                ) : null}
                <CoverField label="Name of the Applicant:" value={appData?.applicant_name || formData.name} />
                <CoverField label="Degree Applied For:" value={appData?.degree_applied_for || formData.degree} />
                <CoverField label="Campus:" value={appData?.campus || formData.campus} />
                <CoverField label="Date of Application:" value={fmtDate(appData?.created_at)} />
                <CoverField label="Folder Link:" value={appData?.folder_link || ""} />
              </div>
              <div className="flex-shrink-0">
                <div className="w-20 h-20 border-2 border-gray-400 flex items-center justify-center overflow-hidden bg-gray-50">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                  ) : appPhotoUrl ? (
                    <img src={appPhotoUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400 text-center leading-tight">1 x 1<br />Picture</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-700 italic leading-relaxed border-t border-gray-200 pt-3">
              <b className="not-italic">Direction.</b> Please accomplish the following information needed. Do not leave items unanswered. All information declared in this file is under oath as well as submitted. Discovery of false information shall be disqualified from participating in the program.
            </div>

            {/* I. PORTFOLIO COVER SHEET */}
            <div>
              <h3 className="font-bold text-sm mb-3">I. PORTFOLIO COVER SHEET</h3>
              <div className="space-y-2.5 pl-2">
                <CoverField label="Name (Last Name, First Name Middle Name):" value={appData?.applicant_name || formData.name} />
                <CoverField label="City Address:" value={appData?.city_address} />
                <CoverField label="Permanent Address:" value={appData?.permanent_address} />
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <CoverField label="Telephone No.:" value="" width="flex-1 min-w-[150px]" />
                  <CoverField label="Mobile No.:" value={appData?.mobile_number} width="flex-1 min-w-[150px]" />
                  <CoverField label="Email Address:" value={appData?.email_address} width="flex-1 min-w-[180px]" />
                </div>
                <CoverField label="Degree Program intended to enroll:" value={getFirstPriority()} />
              </div>
            </div>

            {appData && (
              <div className="flex items-center gap-3">
                <label htmlFor="photo-upload" className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline">
                  Change photo
                </label>
                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
            )}

            {/* II. PORTFOLIO CONTENT */}
            <div>
              <h3 className="font-bold text-sm mb-1">II. PORTFOLIO CONTENT</h3>
              <p className="text-xs text-gray-600 mb-3">Please scan and submit the following requirements with proper labelings and links</p>

              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 bg-gray-100 border-b border-gray-300">
                  <div className="px-4 py-2 font-bold text-sm text-center border-r border-gray-300">Portfolio Content</div>
                  <div className="px-4 py-2 font-bold text-sm text-center">Portfolio Links</div>
                </div>

                {/* Row 1: Accomplished ETEEAP Form */}
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Accomplished ETEEAP Application and Preliminary Assessment Form</p>
                    <p className="italic text-gray-600">(Notarized)</p>
                    <p className="italic text-gray-600 mt-1">Please submit your credentials as follows:</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      <li>- <b>ProfEd</b> <i>(Trainings, Certificates, Recognitions, Eligibility, Recommendation Letter, Work Experience, Professional Development Activities, etc.)</i></li>
                      <li>- <b>GenEd</b> (requirement)</li>
                      <li>- <b>Math/Physics</b> <i>(Mentorship or Tutorial activities, Project Involvement, Data Analysis, Use of Statistical Tools, etc.)</i></li>
                      <li>- <b>PE and NSTP</b> (Certificate Intramurals, Sportsfest, Wellness)</li>
                      <li>- <b>Chemistry</b></li>
                      <li>- <b>ABET Program Criteria</b></li>
                    </ul>
                  </div>
                  <div className="px-3 py-3 flex flex-col gap-2">
                    {appData && <AppformCredentials appData={appData} />}
                    <FileUploader label="Additional Credentials" multiple onFilesChange={(f) => handleFilesChange("eteeapForm", f)} error={fileErrors["eteeapForm"]} />
                  </div>
                </div>

                {/* Row 2: Curriculum Vitae */}
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Curriculum Vitae</p>
                    <p className="italic text-xs text-gray-600">(a comprehensive discussion of why you intend to enroll at T.I.P. ETEEAP Unit)</p>
                  </div>
                  <div className="px-3 py-3 flex flex-col gap-2">
                    {appPortfolioFiles.filter(f => f.title === "Curriculum Vitae").map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
                        📎 {f.title}
                      </a>
                    ))}
                    <FileUploader label="CV" multiple onFilesChange={(f) => handleFilesChange("cv", f)} error={fileErrors["cv"]} />
                  </div>
                </div>

                {/* Row 3: Psychological Test */}
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Psychological Test</p>
                    <p className="italic text-xs text-gray-600">(to be administered by the Guidance and Counseling Center after Preliminary Assessment)</p>
                  </div>
                  <div className="px-3 py-3 flex items-start">
                    <FileUploader label="Psych Test" multiple onFilesChange={(f) => handleFilesChange("psychTest", f)} error={fileErrors["psychTest"]} />
                  </div>
                </div>

                {/* Row 4: Statement of Ownership/Authenticity */}
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Statement of Ownership/Authenticity</p>
                    <p className="italic text-xs text-gray-600">(provide a letter stating ownership/authenticity of the documents submitted)</p>
                  </div>
                  <div className="px-3 py-3 flex flex-col gap-2">
                    <FileUploader label="Authenticity" multiple onFilesChange={(f) => handleFilesChange("authenticity", f)} error={fileErrors["authenticity"]} />
                  </div>
                </div>

                {/* Row 5: Endorsement Letter */}
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Endorsement Letter from the latest employer</p>
                  </div>
                  <div className="px-3 py-3 flex flex-col gap-2">
                    {appPortfolioFiles.filter(f => f.title === "Endorsement Letter from last/current employer").map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
                        📎 {f.title}
                      </a>
                    ))}
                    <FileUploader label="Endorsement" multiple onFilesChange={(f) => handleFilesChange("endorsement", f)} error={fileErrors["endorsement"]} />
                  </div>
                </div>

                {/* Row 6: Other Documents Required */}
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Other Documents Required</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      <li>- PSA Birth Certificate</li>
                      <li>- Barangay Clearance/NBI Clearance/Passport</li>
                      <li>- Marriage Certificate <i>(for married woman)</i></li>
                    </ul>
                  </div>
                  <div className="px-3 py-3 flex flex-col gap-2">
                    {appPortfolioFiles.filter(f =>
                      f.title === "PSA Birth Certificate" ||
                      f.title === "Brgy. Clearance/Passport/NBI" ||
                      f.title === "Marriage Certificate (for married people)"
                    ).map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
                        📎 {f.title}
                      </a>
                    ))}
                    <FileUploader label="Other Docs" multiple onFilesChange={(f) => handleFilesChange("otherDocs", f)} error={fileErrors["otherDocs"]} />
                  </div>
                </div>

                {/* Row 7: Workplace Visitation Checklist */}
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Workplace Visitation Checklist</p>
                  </div>
                  <div className="px-3 py-3 flex items-start">
                    <FileUploader label="Visitation" multiple onFilesChange={(f) => handleFilesChange("visitation", f)} error={fileErrors["visitation"]} />
                  </div>
                </div>

                {/* Row 8: Other Evidence */}
                <div className="grid grid-cols-2">
                  <div className="px-4 py-3 border-r border-gray-300 text-sm">
                    <p className="font-bold">Other Evidence of capability and knowledge in the field for equivalency and accreditation</p>
                    <p className="italic text-xs text-gray-600">(if any)</p>
                  </div>
                  <div className="px-3 py-3 flex flex-col gap-2">
                    {appPortfolioFiles.filter(f => f.title === "Other evidences").map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
                        📎 {f.title}
                      </a>
                    ))}
                    <FileUploader label="Other Evidence" multiple onFilesChange={(f) => handleFilesChange("otherEvidence", f)} error={fileErrors["otherEvidence"]} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-xs leading-relaxed border border-yellow-300">
              <strong>⚠️ Direction:</strong> Please accomplish all required information. All information declared is under oath. Discovery of false information shall lead to disqualification.
            </div>

            {/* Signature & Submit */}
            <div className="space-y-4">
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-base mb-2 flex items-center text-gray-800">
                  <PenTool size={18} className="mr-2" /> Applicant&apos;s Signature
                </h3>
                <p className="text-sm text-gray-600 mb-3">By signing below, I declare that all information provided is true and correct.</p>
                <SignaturePad ref={signaturePadRef} />
                {signatureError && <p className="mt-2 text-sm text-red-600">{signatureError}</p>}
              </div>
              <button type="submit" disabled={isSubmitting || userLoading || !supabaseUserId} className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? (<><Loader2 className="animate-spin" size={20} /> Submitting...</>) : "Submit Application →"}
              </button>
              {userLoading && <p className="text-xs text-center text-blue-600">Loading user profile...</p>}
              {submitError && <p className="text-sm text-center text-red-600 font-medium">{submitError}</p>}
            </div>
          </form>
        </div>
      </div>
      <Modal {...modalProps} />
    </div>
  );
}
