"use client";
import React, { useState, useRef, useEffect } from "react";
import supabase from "@/lib/supabase/client"; // Use shared client
import { useSession } from "next-auth/react";
// ✅ 1. Import ArrowLeft
import { Camera, Link2, User, GraduationCap, Folder, PenTool, Loader2, ArrowLeft } from "lucide-react";
import SignaturePad, { SignaturePadHandles } from "../portform/signature";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import DataPrivacyConsent from './undertaking';
import FileUploader from './FileUploader'; // Import the uploader

// --- FormField Helper Component ---
const FormField = ({ icon, children, className }: { icon: React.ReactNode; children: React.ReactNode, className?: string }) => (
  <div className={`relative mb-4 ${className}`}>
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
      {icon}
    </div>
    {children}
  </div>
);

// Define the lists of files
const portfolioContent = [
  { key: 'personalProfile', label: 'Personal Profile (Transcript, Certificates, etc.)' },
  { key: 'genEd', label: 'Gen Ed, PE and NSTP, Chemistry (if requirement)' },
  { key: 'abet', label: 'ABET Program Criteria' },
  { key: 'cv', label: 'Curriculum Vitae' },
  { key: 'essay', label: 'Comprehensive discussion of why you intend to enroll' },
  { key: 'psychTest', label: 'Psychological Test' },
  { key: 'authenticity', label: 'Statement of Ownership/Authenticity' },
  { key: 'endorsement', label: 'Endorsement Letter from the latest employer' },
];

const otherDocuments = [
  { key: 'psa', label: 'PSA Birth Certificate' },
  { key: 'clearance', label: 'Barangay/NBI Clearance/Passport' },
  { key: 'marriageCert', label: 'Marriage Certificate (for married women)' },
  { key: 'visitation', label: 'Workplace Visitation Checklist' },
  { key: 'otherEvidence', label: 'Other Evidence of capability and knowledge' },
];

const allFileKeys = [...portfolioContent, ...otherDocuments];


// --- Main ApplicationForm Component ---
export default function ApplicationForm() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    degree: "",
    campus: "Manila",
    photo: null as File | null,
    portfolioFiles: {} as Record<string, File | null>,
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState('');
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const signaturePadRef = useRef<SignaturePadHandles>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const router = useRouter();

  // Effect to set the full name from the session (unchanged)
  useEffect(() => {
    if (session?.user?.name) {
      setFormData(prev => ({ ...prev, name: session.user.name! }));
    }
  }, [session]);

  // Effect to fetch the Supabase UUID (unchanged)
  useEffect(() => {
    const fetchSupabaseUser = async () => {
      if (session?.user?.email) {
        setUserLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error("[PortForm] Error fetching Supabase user ID:", error.message);
          setSubmitError("Error: Could not find matching user profile.");
        } else if (data) {
          setSupabaseUserId(data.id);
        } else {
          setSubmitError("Error: No matching user profile found.");
        }
        setUserLoading(false);
      } else if (status === 'unauthenticated') {
         setUserLoading(false);
      }
    };
    fetchSupabaseUser();
  }, [session, status]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      portfolioFiles: {
        ...prev.portfolioFiles,
        [key]: file,
      },
    }));
    if (fileErrors[key]) {
      setFileErrors(prev => ({ ...prev, [key]: '' }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSignatureError('');
    setSubmitError(null);
    setFileErrors({}); // Clear old errors

    // --- 1. Basic Validation (unchanged) ---
    if (!supabaseUserId) {
      alert("User profile is not loaded. Please wait or refresh.");
      setIsSubmitting(false);
      return;
    }
    const signature = signaturePadRef.current?.getSignature();
    if (!signature) {
      setSignatureError("Please provide your signature.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.photo) {
      alert("Please upload a 1x1 photo.");
      setIsSubmitting(false);
      return;
    }

    // --- 2. File validation removed ---

    try {
      // --- 3. Upload Files in Parallel ---
      console.log("Uploading files...");
      const uploadPromises = [];
      const fileKeys = Object.keys(formData.portfolioFiles);

      // Add Photo upload
      const photoFile = formData.photo;
      const photoFilePath = `${supabaseUserId}/photo_${Date.now()}_${photoFile.name}`;
      uploadPromises.push(
        supabase.storage.from('portfolio_photos').upload(photoFilePath, photoFile)
      );

      // Add Portfolio file uploads
      for (const key of fileKeys) {
        const file = formData.portfolioFiles[key];
        if (file) { // Only upload if a file exists
          const filePath = `${supabaseUserId}/portfolio/${key}_${Date.now()}_${file.name}`;
          uploadPromises.push(
            supabase.storage.from('portfolio_files').upload(filePath, file)
          );
        }
      }

      const uploadResults = await Promise.all(uploadPromises);

      // --- 4. Check for Upload Errors ---
      const uploadErrors = uploadResults.filter(result => result.error);
      if (uploadErrors.length > 0) {
        console.error("File upload errors:", uploadErrors);
        throw new Error(`Failed to upload ${uploadErrors.length} file(s).`);
      }

      // --- 5. Get Public URLs ---
      const [photoUploadResult] = uploadResults; // Photo is always first
      const portfolioUploads = uploadResults.slice(1); // The rest are portfolio files

      // Get Photo URL
      const { data: photoUrlData } = supabase.storage
        .from('portfolio_photos')
        .getPublicUrl(photoUploadResult.data!.path);
      
      // Get Portfolio File URLs
      const portfolioFileUrls = portfolioUploads.map((result, index) => {
        const { data: urlData } = supabase.storage
          .from('portfolio_files')
          .getPublicUrl(result.data!.path);
        
        const fileKey = fileKeys[index]; 
        const label = allFileKeys.find(f => f.key === fileKey)?.label || fileKey;
        return { label: label, url: urlData.publicUrl, key: fileKey };
      });
      
      // --- 6. Insert into Database ---
      const { error: insertError } = await supabase
        .from('portfolio_submissions')
        .insert({
          user_id: supabaseUserId,
          full_name: formData.name,
          degree_program: formData.degree,
          campus: formData.campus,
          photo_url: photoUrlData.publicUrl,
          signature: signature,
          status: 'Submitted',
          portfolio_files: portfolioFileUrls 
        });

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error("Submission error:", errMsg);
      setSubmitError(`Submission failed: ${errMsg}`);
      alert(`Submission failed: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Consent Handlers (unchanged) ---
  const handleConsentAgree = () => {
    setHasConsented(true);
  };
  const handleConsentDisagree = () => {
    router.push('/'); // Redirects to home
  };

  // --- Render Logic (unchanged) ---
  if (!hasConsented) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
        <DataPrivacyConsent
          onAgree={handleConsentAgree}
          onDisagree={handleConsentDisagree}
        />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center flex flex-col items-center">
          <h2 className="text-3xl font-bold text-green-600 mb-4">
            Submission Successful! 🎉
          </h2>
          <p className="text-gray-700 mb-8">
            Thank you for submitting your ETEEAP application. We will review it shortly.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Back to the Home Page
          </Link>
        </div>
      </div>
    );
  }

  // --- Main Return Block ---
  return (
    // This is the main page wrapper
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col justify-center items-center font-sans p-4">
      
      {/* ✅ 2. ADDED "BACK TO HOME" LINK HERE */}
      <div className="w-full max-w-6xl mx-auto mb-4">
        <Link
          href="/"
          className="flex items-center text-sm text-gray-600 hover:text-black font-semibold transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Home Page
        </Link>
      </div>

      {/* This is the main white card */}
      <div className="w-full max-w-6xl mx-auto lg:grid lg:grid-cols-5 lg:gap-0 bg-white shadow-2xl rounded-2xl overflow-hidden my-8">
        {/* Sidebar (unchanged) */}
        <div className="p-8 bg-gray-800 text-white hidden lg:flex lg:col-span-2 flex-col justify-center">
            <h1 className="text-3xl font-bold mb-2 text-yellow-400">ETEEAP Portfolio</h1>
            <p className="text-lg font-semibold mb-4">Technological Institute of the Philippines</p>
            <p className="text-base mb-6 text-gray-300">
              This form is for submitting your ETEEAP portfolio. Your portfolio is a collection of documents demonstrating your knowledge, skills, and prior learning.
            </p>
            <p className="text-base mb-6 text-gray-300">
              Please upload all relevant documents. **If you don't have a document ready, you can skip it and submit the form.** You can always update your submission later by contacting an administrator.
            </p>
            <div className="text-gray-400 text-sm space-y-2">
                <p>Your portfolio may include:</p>
                <ul className="list-disc list-inside pl-2">
                    <li>Certificates of training</li>
                    <li>Workplace commendations</li>
                    <li>Transcripts or school records</li>
                    <li>Personal projects</li>
                    <li>And more...</li>
                </ul>
            </div>
            <div className="mt-auto pt-8"> <Folder size={80} className="text-yellow-400 opacity-10" /> </div>
        </div>
        
        {/* Form Area */}
        <div className="p-8 lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-center font-bold text-2xl mb-6 text-gray-800">Portfolio Requirement Form</h2>
              
              {/* Profile Section (unchanged) */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <label htmlFor="photo-upload" className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-all ring-4 ring-offset-4 ring-offset-white ring-yellow-500 overflow-hidden">
                    {photoPreview ? ( <img src={photoPreview} alt="Preview" className="w-full h-full object-cover"/> ) : ( <Camera className="text-yellow-600 w-10 h-10" /> )}
                  </label>
                  <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <p className="text-xs mt-2 text-center text-gray-500">Add 1x1 Photo *</p>
                </div>
                <div className="w-full">
                  <FormField icon={<User size={20} />}>
                    <input type="text" name="name" placeholder="Full Name of Applicant" value={formData.name} onChange={handleChange} className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500" required />
                  </FormField>
                  <FormField icon={<GraduationCap size={20} />}>
                    <select name="degree" value={formData.degree} onChange={handleChange} className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors text-gray-900" required>
                      <option value="">Select Degree Program</option>
                      <option value="BSCS">Bachelor of Science in Computer Science</option>
                      <option value="BSIS">Bachelor of Science in Information Systems</option>
                      <option value="BSIT">Bachelor of Science in Information Technology</option>
                      <option value="BSCpE">Bachelor of Science in Computer Engineering</option>
                      <option value="BSIE">Bachelor of Science in Industrial Engineering</option>
                      <optgroup label="Bachelor of Science in Business Administration">
                        <option value="BSBA-LSCM">Logistics and Supply Chain Management</option>
                        <option value="BSBA-FM">Financial Management</option>
                        <option value="BSBA-HRM">Human Resources Management</option>
                        <option value="BSBA-MM">Marketing Management</option>
                      </optgroup>
                    </select>
                  </FormField>
                </div>
              </div>
              
              {/* File Upload Section (unchanged) */}
              <div className="bg-blue-50 text-blue-900 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-base mb-3">Portfolio Documents</h3>
                  <p className="text-sm mb-4">Please upload all relevant documents below. (PDF, DOC, DOCX, JPG, PNG)</p>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">1. Portfolio Content</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                        {portfolioContent.map(item => (
                          <FileUploader
                            key={item.key}
                            label={item.label}
                            error={fileErrors[item.key]}
                            onFileChange={(file) => handleFileChange(item.key, file)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">2. Other Documents Required</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                        {otherDocuments.map(item => (
                          <FileUploader
                            key={item.key}
                            label={item.label}
                            error={fileErrors[item.key]}
                            onFileChange={(file) => handleFileChange(item.key, file)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
              </div>
              
              {/* Direction (unchanged) */}
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-xs leading-relaxed border border-yellow-300">
                <strong>⚠️ Direction:</strong> Please accomplish all required information. All information declared is under oath. Discovery of false information shall lead to disqualification.
              </div>

            {/* Signature & Submit (unchanged) */}
            <div className="space-y-4">
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-base mb-2 flex items-center text-gray-800"> <PenTool size={18} className="mr-2"/> Applicant's Signature </h3>
                <p className="text-sm text-gray-600 mb-3"> By signing below, I declare that all information provided is true and correct. </p>
                <SignaturePad ref={signaturePadRef} />
                {signatureError && <p className="mt-2 text-sm text-red-600">{signatureError}</p>}
              </div>
              <button type="submit" disabled={isSubmitting || userLoading || !supabaseUserId} className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? ( <> <Loader2 className="animate-spin" size={20} /> Submitting... </> ) : ( "Submit Application →" )}
              </button>
              {userLoading && (
                  <p className="text-xs text-center text-blue-600">Loading user profile...</p>
              )}
              {submitError && (
                  <p className="text-sm text-center text-red-600 font-medium">{submitError}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}