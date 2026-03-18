"use client";

import { useState, useRef, useEffect } from "react";
import supabase from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PenTool, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';
import InitialForm from "./a";
import PersonalInformationForm from "./b";
import PrioritiesGoalsForm from "./c-h";
import BackgroundAchievementsForm from "./d";
import LifelongLearningForm from "./i";
import SelfReportForm from "./j";
import PortfolioForm from "./portfolio";
import { useRouter } from 'next/navigation';
import DataPrivacyConsent from './undertaking';
import Modal from "@/components/ui/Modal";
import { useModal } from "@/components/ui/useModal";


const getTodayDateISO = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
};

// --- Pagination Component ---
function Pagination({ currentStep, totalSteps, stepTitles }: { currentStep: number; totalSteps: number; stepTitles: string[] }) {
    if (currentStep > totalSteps) return null;

    const steps = stepTitles.map((title, index) => ({ number: index + 1, title }));
    return (
        <div className="w-full max-w-5xl mb-8 px-2">
            <div className="overflow-x-auto pb-2">
                <div className="flex items-start justify-start sm:justify-center min-w-max mx-auto">
                    {steps.map((step, index) => {
                        const isActive = step.number === currentStep;
                        const isCompleted = step.number < currentStep;
                        return (
                            <div key={step.number} className="flex items-start">
                                <div className="flex flex-col items-center text-center w-14">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${isActive ? "bg-yellow-500 text-white" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                                        {isCompleted ? "✔" : step.number}
                                    </div>
                                    <p className={`mt-1 text-[9px] font-semibold w-14 leading-tight ${isActive ? "text-yellow-600" : "text-gray-500"}`}>{step.title}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-5 border-t-2 self-start mt-4 transition-colors duration-300 ${isCompleted ? "border-green-500" : "border-gray-200"}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// --- Success Screen Component ---
function SuccessScreen({ onEdit, onGoToPortfolio, isDeleting }: { onEdit: () => void; onGoToPortfolio: () => void; isDeleting: boolean }) {
    return (
        <div className="bg-white shadow-lg rounded-2xl w-full max-w-3xl p-12 text-center flex flex-col items-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-black mb-4">Application Submitted!</h1>
            <p className="text-gray-600 mb-8">Thank you for completing the form. We have received your application and will review it shortly.</p>

            <div className="flex items-center gap-4 mt-4 flex-wrap justify-center">
                <button
                    type="button"
                    onClick={onEdit}
                    disabled={isDeleting}
                    className="bg-gray-200 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isDeleting && <Loader2 size={16} className="animate-spin" />}
                    Make a New Application
                </button>
                <button
                    type="button"
                    onClick={onGoToPortfolio}
                    className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Go to Portfolio Form
                </button>
                <Link
                    href="/tracker"
                    className="bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    Track Application
                </Link>
                <Link
                    href="/"
                    className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                    Back to Homepage
                </Link>
            </div>
        </div>
    );
}

// --- Final Review Step Component ---
function FinalReviewStep({ nextStep, prevStep, signaturePadRef, isSubmitting }: {
    nextStep: () => void,
    prevStep: () => void,
    signaturePadRef: React.RefObject<SignatureCanvas | null>,
    isSubmitting: boolean
}) {
    const [signatureError, setSignatureError] = useState<string | null>(null);

    const handleFinalSubmit = () => {
        if (signaturePadRef.current?.isEmpty()) {
            setSignatureError("A signature is required to submit the application.");
            return;
        }
        setSignatureError(null);
        nextStep(); // This calls the main handleSubmit function
    };

    return (
        <div className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col p-8 space-y-6">
            <div className="text-center">
                <h3 className="font-semibold text-2xl mb-2 text-black">Final Step: Review and Submit</h3>
                <p className="text-gray-600">
                    By signing below, I declare that all information provided is true and correct.
                </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-lg mb-2 flex items-center text-gray-800">
                    <PenTool size={20} className="mr-2 text-yellow-600" />
                    Applicant's Signature
                </h3>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <SignatureCanvas
                        ref={signaturePadRef} // Use the ref passed from the parent
                        penColor='black'
                        canvasProps={{ className: 'w-full h-40' }}
                    />
                </div>
                {signatureError && <p className="mt-2 text-sm text-red-600">{signatureError}</p>}
                <button
                    type="button"
                    onClick={() => signaturePadRef.current?.clear()}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                    Clear Signature
                </button>
            </div>

            <div className="flex justify-between pt-4">
                <button type="button" onClick={prevStep} disabled={isSubmitting} className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50">
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="bg-green-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                >
                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
            </div>
        </div>
    )
}

// --- Main Page Component ---
export default function ApplicationFormPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const signaturePadRef = useRef<SignatureCanvas>(null);
    const [hasConsented, setHasConsented] = useState(false);
    const [hasExistingApplication, setHasExistingApplication] = useState(false);
    const [checkingExisting, setCheckingExisting] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const router = useRouter();
    const { modalProps, showAlert, showConfirm } = useModal();

    // Check if user already submitted an application
    useEffect(() => {
        if (sessionStatus === 'loading') return;

        // Not logged in — redirect to home, no need to check DB
        if (sessionStatus === 'unauthenticated') {
            router.replace('/');
            return;
        }

        const checkExisting = async () => {
            try {
                const res = await fetch(`/api/applicants?email=${encodeURIComponent(session!.user!.email!)}`);
                if (res.ok) {
                    const { applications } = await res.json();
                    if (applications?.length > 0) {
                        setHasExistingApplication(true);
                    }
                }
            } catch {
                // fail open — let them proceed, submit will catch it
            } finally {
                setCheckingExisting(false);
            }
        };
        checkExisting();
    }, [session, sessionStatus, router]);

    const defaultFormData = {
        initial: { name: "", degree: "", campus: "", date: getTodayDateISO(), folderLink: "", photo: null as File | null },
        personalInfo: {
            name: "",
            fullAddress: "",
            mobile: "",
            email: session?.user?.email || "",
            birthday: "",
            birthplace: "",
            age: null as number | null,
            gender: "",
            nationality: "",
            religion: "",
            civilStatus: "",
            language: "",
            isOverseas: false,
            overseasDetails: "",
            cityAddress: "",
            permanentAddress: "",
            emergencyContactName: "",
            emergencyRelationship: "",
            emergencyAddress: "",
            emergencyContactNumber: "",
        },
        goals: { degrees: [""], statement: "", plan: "", overseas: "", completion: "" },
        education: { tertiary: [], secondary: [], elementary: [], technical: [] },
        non_formal_education: [] as any[],
        certifications: [] as any[],
        publications: [] as any[],
        inventions: [] as any[],
        work_experience: { employment: [], consultancy: [], selfEmployment: [] },
        recognitions: [] as any[],
        professional_development: { memberships: [], projects: [], research: [] },
        creativeWorks: [{ title: "", institution: "", dates: "" }],
        lifelongLearning: { hobbies: "", skills: "", workActivities: "", volunteer: "", travels: "" },
        selfAssessment: { jobLearning: "", teamworkLearning: "", selfLearning: "", workBenefits: "", essay: "" },
        portfolio: [] as any[],
        portfolioFiles: [] as any[],
        portfolio_metadata: [] as any[]
    };

    const [formData, setFormData] = useState(defaultFormData);

    // Auto-fill email once session is available
    useEffect(() => {
        if (session?.user?.email) {
            setFormData(prev => ({
                ...prev,
                personalInfo: {
                    ...prev.personalInfo,
                    email: prev.personalInfo.email || session.user!.email!,
                },
            }));
        }
    }, [session]);

    const stepTitles = [
        "Initial Info",
        "Personal",
        "Goals",
        "Background & Achievements", // d.tsx
        "Learning",
        "Self Assessment",
        "Portfolio",
        "Submit",
    ];

    const totalSteps = stepTitles.length; // 8 steps

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('applicationFormData');
            const savedStep = localStorage.getItem('applicationFormStep');
            // ✅ 6. ADDED: Check for saved consent
            const savedConsent = localStorage.getItem('dataPrivacyConsent');

            // Restore consent first
            if (savedConsent === 'true') {
                setHasConsented(true);
            }

            if (savedData) {
                const parsedData = JSON.parse(savedData);

                setFormData(prev => {
                    const newState = JSON.parse(JSON.stringify(prev));
                    (Object.keys(prev) as Array<keyof typeof prev>).forEach(key => {
                        if (parsedData[key] !== undefined) {
                            if (typeof newState[key] === 'object' && !Array.isArray(newState[key]) && newState[key] !== null) {
                                newState[key] = { ...prev[key], ...(parsedData[key] || {}) };
                            } else {
                                newState[key] = parsedData[key];
                            }
                        }
                    });

                    // --- Post-Merge Sanity Checks ---
                    newState.initial = { ...prev.initial, ...(newState.initial || {}) };
                    newState.initial.photo = prev.initial.photo;
                    newState.goals = { ...prev.goals, ...(newState.goals || {}) };
                    if (!Array.isArray(newState.goals.degrees)) newState.goals.degrees = [""];
                    newState.personalInfo = { ...prev.personalInfo, ...(newState.personalInfo || {}) };
                    newState.education = { ...prev.education, ...(newState.education || {}) };
                    newState.work_experience = { ...prev.work_experience, ...(newState.work_experience || {}) };
                    newState.lifelongLearning = { ...prev.lifelongLearning, ...(newState.lifelongLearning || {}) };
                    if (!Array.isArray(newState.portfolio)) newState.portfolio = [];
                    if (!Array.isArray(newState.non_formal_education)) newState.non_formal_education = [];
                    if (!Array.isArray(newState.certifications)) newState.certifications = [];
                    if (!Array.isArray(newState.publications)) newState.publications = [];
                    if (!Array.isArray(newState.inventions)) newState.inventions = [];
                    if (!Array.isArray(newState.recognitions)) newState.recognitions = [];
                    if (!Array.isArray(newState.creativeWorks) && !Array.isArray(newState.creative_works)) newState.creativeWorks = [{ title: "", institution: "", dates: "" }];

                    return newState;
                });
            }
            if (savedStep) {
                const step = parseInt(savedStep, 10);
                if (step < totalSteps + 2) { // 9 + 1 = 10
                    setCurrentStep(step);
                }
            }
        } catch (error) {
            console.error("Failed to load form data from local storage", error);
            localStorage.removeItem('applicationFormData');
            localStorage.removeItem('applicationFormStep');
            localStorage.removeItem('dataPrivacyConsent'); // Clear consent on error too
        }
    }, []); // Run only once on mount

    // Save data to localStorage when it changes
    useEffect(() => {
        // Only save data if user has consented
        if (hasConsented && currentStep < totalSteps + 2) { // 8 + 2 = 10
            const dataToSave = JSON.parse(JSON.stringify(formData));
            if (dataToSave.initial && dataToSave.initial.photo) {
                delete dataToSave.initial.photo;
            }
            localStorage.setItem('applicationFormData', JSON.stringify(dataToSave));
            localStorage.setItem('applicationFormStep', currentStep.toString());
        }
    }, [formData, currentStep, hasConsented, totalSteps]);

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

    // Handler to reset form — confirms, deletes existing app, then resets
    const [isDeletingApp, setIsDeletingApp] = useState(false);

    const startNewApplication = async () => {
        const confirmed = await showConfirm(
            "The current application will be deleted.",
            "Make a New Application?",
            "danger",
            "Yes, Delete & Continue",
            "Cancel"
        );
        if (!confirmed) return;

        setIsDeletingApp(true);
        try {
            if (session?.user?.email) {
                const res = await fetch('/api/delete-application', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: session.user.email }),
                });
                if (!res.ok) {
                    const { error } = await res.json();
                    console.error('Failed to delete application:', error);
                }
            }
        } catch (err) {
            console.error('Failed to delete existing application:', err);
        } finally {
            setIsDeletingApp(false);
        }

        setFormData(defaultFormData);
        setCurrentStep(1);
        setHasExistingApplication(false);
        setIsEditMode(false);
        localStorage.removeItem('applicationFormData');
        localStorage.removeItem('applicationFormStep');
    };

    const [isLoadingEdit, setIsLoadingEdit] = useState(false);

    const startEditApplication = async () => {
        if (!session?.user?.email) return;
        setIsLoadingEdit(true);
        try {
            const res = await fetch(`/api/my-application?email=${encodeURIComponent(session.user.email)}`);
            const json = await res.json();
            const d = json.application;
            if (!d) { await showAlert("Could not load application data.", "Error"); return; }

            // Parse goal_statement JSON
            let goalStatement = { statement: "", plan: "", completion: "" };
            try { goalStatement = JSON.parse(d.goal_statement || "{}"); } catch { }

            // Parse lifelong_learning — extract _selfAssessment
            const ll = d.lifelong_learning || {};
            const { _selfAssessment, ...lifelongLearning } = ll;

            setFormData(prev => ({
                ...prev,
                initial: {
                    name: d.applicant_name || "",
                    degree: d.degree_applied_for || "",
                    campus: d.campus || "",
                    date: d.application_date || getTodayDateISO(),
                    folderLink: d.folder_link || "",
                    photo: null,
                },
                personalInfo: {
                    ...prev.personalInfo,
                    fullAddress: d.full_address || "",
                    mobile: d.mobile_number || "",
                    email: d.email_address || "",
                    birthday: d.birth_date || "",
                    birthplace: d.birth_place || "",
                    age: d.age || null,
                    gender: d.gender || "",
                    nationality: d.nationality || "",
                    religion: d.religion || "",
                    civilStatus: d.civil_status || "",
                    language: d.language_spoken || "",
                    isOverseas: d.is_overseas || false,
                    overseasDetails: d.overseas_details || "",
                    cityAddress: d.city_address || "",
                    permanentAddress: d.permanent_address || "",
                    emergencyContactName: d.emergency_contact_name || "",
                    emergencyRelationship: d.emergency_relationship || "",
                    emergencyAddress: d.emergency_address || "",
                    emergencyContactNumber: d.emergency_contact_number || "",
                },
                goals: {
                    degrees: d.degree_priorities || [""],
                    statement: goalStatement.statement || "",
                    plan: goalStatement.plan || "",
                    overseas: d.overseas_details || "",
                    completion: goalStatement.completion || "",
                },
                education: d.education_background || { tertiary: [], secondary: [], elementary: [], technical: [] },
                non_formal_education: d.non_formal_education || [],
                certifications: d.certifications || [],
                publications: d.publications || [],
                inventions: d.inventions || [],
                work_experience: d.work_experiences || { employment: [], consultancy: [], selfEmployment: [] },
                recognitions: d.recognitions || [],
                professional_development: d.professional_development || { memberships: [], projects: [], research: [] },
                creative_works: d.creative_works || [],
                lifelongLearning: {
                    hobbies: lifelongLearning.hobbies || "",
                    skills: lifelongLearning.skills || "",
                    workActivities: lifelongLearning.workActivities || "",
                    volunteer: lifelongLearning.volunteer || "",
                    travels: lifelongLearning.travels || "",
                },
                selfAssessment: _selfAssessment || { jobLearning: "", teamworkLearning: "", selfLearning: "", workBenefits: "", essay: "" },
            }));

            setIsEditMode(true);
            setHasExistingApplication(false);
            setCurrentStep(1);
            setHasConsented(true);
        } catch (err) {
            await showAlert("Failed to load application for editing.", "Error");
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const createFormUpdater = (key: keyof typeof formData) => {
        return (data: any) => {
            setFormData((prev) => ({
                ...prev,
                [key]: data,
            }));
        };
    };

    const handleInitialChange = createFormUpdater('initial');
    const handlePersonalChange = createFormUpdater('personalInfo');
    const handleGoalsChange = createFormUpdater('goals');
    const handleCreativeWorksChange = createFormUpdater('creativeWorks');
    const handleLearningChange = createFormUpdater('lifelongLearning');
    const handleSelfAssessmentChange = createFormUpdater('selfAssessment');

    // Consent handlers
    const handleConsentAgree = () => {
        setHasConsented(true);
        // ✅ 8. ADDED: Save consent to localStorage
        localStorage.setItem('dataPrivacyConsent', 'true');
    };

    const handleConsentDisagree = () => {
        router.push('/');
    };

    // The handleSubmit function
    const handleSubmit = async () => {
        // Capture signature BEFORE setIsSubmitting unmounts the canvas
        const signatureDataUrl = signaturePadRef.current?.toDataURL('image/png');
        if (!signatureDataUrl) {
            await showAlert('Signature is missing. Please draw your signature.', 'Signature Required');
            return;
        }
        setIsSubmitting(true);

        if (!session?.user?.email) {
            await showAlert("You must be logged in to submit.", "Not Logged In");
            setIsSubmitting(false);
            return;
        }

        try {
            // 0. Pre-submit duplicate check
            const dupCheck = await fetch(`/api/applicants?email=${encodeURIComponent(session.user.email)}`);
            if (dupCheck.ok) {
                const { applications: existing } = await dupCheck.json();
                if (existing?.length > 0) {
                    setHasExistingApplication(true);
                    setIsSubmitting(false);
                    return;
                }
            }

            // 1. User Lookup
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', session.user.email)
                .single();

            if (userError || !userData?.id) throw new Error("User not found in database.");
            const supabaseUserId = userData.id;

            // 2. Upload 1x1 Photo
            const photoFile = formData.initial.photo;
            if (!photoFile) throw new Error("1x1 Photo is missing from Step 1.");

            const photoPath = `${supabaseUserId}/photo_${Date.now()}_${photoFile.name}`;
            const { error: photoUploadError } = await supabase.storage.from('application_files').upload(photoPath, photoFile);
            if (photoUploadError) throw new Error(`Photo upload failed: ${photoUploadError.message}`);
            const { data: photoUrl } = supabase.storage.from('application_files').getPublicUrl(photoPath);

            // 3. Upload Signature
            const sigBlob = await (await fetch(signatureDataUrl)).blob();
            const sigPath = `${supabaseUserId}/signature_${Date.now()}.png`;
            const { error: sigUploadError } = await supabase.storage.from('application_files').upload(sigPath, sigBlob);
            if (sigUploadError) throw new Error(`Signature upload failed: ${sigUploadError.message}`);
            const { data: sigUrl } = supabase.storage.from('application_files').getPublicUrl(sigPath);

            // 4. Upload credential files from sections C–I
            // Collect all entries with a fileObject, upload, replace with fileUrl
            const uploadCredentialFiles = async (entries: any[], section: string) => {
                const updated = await Promise.all(entries.map(async (entry) => {
                    if (!entry.fileObject) return entry;
                    const filePath = `${supabaseUserId}/credentials/${section}_${Date.now()}_${entry.fileObject.name}`;
                    const { error } = await supabase.storage.from('application_files').upload(filePath, entry.fileObject);
                    if (error) { console.warn(`Credential file upload failed (${section}):`, error.message); return entry; }
                    const { data: urlData } = supabase.storage.from('application_files').getPublicUrl(filePath);
                    const { fileObject: _removed, ...rest } = entry;
                    return { ...rest, fileUrl: urlData.publicUrl };
                }));
                return updated;
            };

            const uploadCredentialWorkFiles = async (workExp: any) => ({
                employment: await uploadCredentialFiles(workExp.employment || [], 'employment'),
                consultancy: await uploadCredentialFiles(workExp.consultancy || [], 'consultancy'),
                selfEmployment: await uploadCredentialFiles(workExp.selfEmployment || [], 'selfEmployment'),
            });

            const uploadCredentialEduFiles = async (edu: any) => ({
                tertiary: await uploadCredentialFiles(edu.tertiary || [], 'edu_tertiary'),
                secondary: await uploadCredentialFiles(edu.secondary || [], 'edu_secondary'),
                elementary: await uploadCredentialFiles(edu.elementary || [], 'edu_elementary'),
                technical: await uploadCredentialFiles(edu.technical || [], 'edu_technical'),
            });

            const uploadCredentialPDFiles = async (pd: any) => ({
                memberships: await uploadCredentialFiles(pd.memberships || [], 'pd_memberships'),
                projects: await uploadCredentialFiles(pd.projects || [], 'pd_projects'),
                research: await uploadCredentialFiles(pd.research || [], 'pd_research'),
            });

            const [
                uploadedEducation,
                uploadedNonFormal,
                uploadedCerts,
                uploadedPubs,
                uploadedInvs,
                uploadedWork,
                uploadedRecs,
                uploadedPD,
                uploadedCreative,
            ] = await Promise.all([
                uploadCredentialEduFiles(formData.education),
                uploadCredentialFiles(formData.non_formal_education || [], 'non_formal'),
                uploadCredentialFiles(formData.certifications || [], 'certifications'),
                uploadCredentialFiles(formData.publications || [], 'publications'),
                uploadCredentialFiles(formData.inventions || [], 'inventions'),
                uploadCredentialWorkFiles(formData.work_experience),
                uploadCredentialFiles(formData.recognitions || [], 'recognitions'),
                uploadCredentialPDFiles(formData.professional_development || {}),
                uploadCredentialFiles((formData as any).creative_works || formData.creativeWorks || [], 'creative_works'),
            ]);

            // 5. NEW: Upload Portfolio Documents
            const uploadedPortfolioMetadata = [];

            if (formData.portfolioFiles && formData.portfolioFiles.length > 0) {
                for (let i = 0; i < formData.portfolioFiles.length; i++) {
                    const file = formData.portfolioFiles[i];

                    // This was likely the line causing the "does not exist" error
                    const meta = formData.portfolio_metadata?.[i] || { title: `File ${i + 1}` };

                    if (file) {
                        const filePath = `${supabaseUserId}/portfolio/${Date.now()}_${file.name}`;
                        const { error: uploadErr } = await supabase.storage
                            .from('portfolio_files')
                            .upload(filePath, file);

                        if (uploadErr) {
                            console.error(`Error uploading:`, uploadErr);
                            continue; // Skip this file if it fails
                        }

                        const { data: publicUrl } = supabase.storage
                            .from('portfolio_files')
                            .getPublicUrl(filePath);

                        uploadedPortfolioMetadata.push({
                            title: meta.title, // Use the title from metadata
                            url: publicUrl.publicUrl,
                            storagePath: filePath,
                            fileSize: file.size,
                            fileType: file.type
                        });
                    }
                }
            }

            // 5. Insert Final Payload
            const insertPayload = {
                user_id: supabaseUserId,
                education_background: uploadedEducation,
                applicant_name: formData.initial.name,
                degree_applied_for: formData.initial.degree,
                degree_priorities: formData.goals.degrees,
                campus: formData.initial.campus,
                application_date: formData.initial.date,
                folder_link: formData.initial.folderLink,
                full_address: formData.personalInfo.fullAddress,
                mobile_number: formData.personalInfo.mobile,
                email_address: session?.user?.email || formData.personalInfo.email,
                age: formData.personalInfo.age,
                birth_date: formData.personalInfo.birthday,
                birth_place: formData.personalInfo.birthplace,
                gender: formData.personalInfo.gender,
                nationality: formData.personalInfo.nationality,
                religion: formData.personalInfo.religion,
                civil_status: formData.personalInfo.civilStatus,
                language_spoken: formData.personalInfo.language,
                is_overseas: formData.personalInfo.isOverseas || false,
                overseas_details: formData.personalInfo.isOverseas ? formData.goals.overseas : formData.personalInfo.overseasDetails,
                city_address: formData.personalInfo.cityAddress,
                permanent_address: formData.personalInfo.permanentAddress,
                emergency_contact_name: formData.personalInfo.emergencyContactName,
                emergency_relationship: formData.personalInfo.emergencyRelationship,
                emergency_address: formData.personalInfo.emergencyAddress,
                emergency_contact_number: formData.personalInfo.emergencyContactNumber,
                goal_statement: JSON.stringify({
                    statement: formData.goals.statement,
                    plan: formData.goals.plan,
                    completion: formData.goals.completion,
                }),
                non_formal_education: uploadedNonFormal,
                certifications: uploadedCerts,
                publications: uploadedPubs,
                inventions: uploadedInvs,
                work_experiences: uploadedWork,
                recognitions: uploadedRecs,
                lifelong_learning: {
                    ...formData.lifelongLearning,
                    _selfAssessment: formData.selfAssessment,
                },
                creative_works: uploadedCreative,
                professional_development: uploadedPD,
                photo_url: photoUrl.publicUrl,
                signature_url: sigUrl.publicUrl,
                portfolio: uploadedPortfolioMetadata,
            }

            if (isEditMode) {
                const res = await fetch('/api/my-application', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: session!.user!.email!, payload: insertPayload }),
                });
                if (!res.ok) { const { error } = await res.json(); throw new Error(error || "Update failed"); }
            } else {
                const { error: insertError } = await supabase.from('applications').insert(insertPayload);
                if (insertError) throw insertError;
            }

            // Clear local storage and move to success
            localStorage.removeItem('applicationFormData');
            localStorage.removeItem('applicationFormStep');
            nextStep();

        } catch (error: any) {
            await showAlert(`Submission failed: ${error.message}`, 'Submission Error', 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    const renderStep = () => {
        if (isSubmitting) {
            return (
                <div className="bg-white shadow-lg rounded-2xl w-full max-w-3xl p-12 text-center">
                    <Loader2 className="animate-spin text-yellow-500 w-12 h-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-black">Submitting Application...</h1>
                    <p className="text-gray-600">Please wait, this may take a moment...</p>
                </div>
            );
        }

        switch (currentStep) {
            case 1:
                return (<InitialForm formData={formData.initial} setFormData={handleInitialChange} nextStep={nextStep} />);
            case 2:
                return (<PersonalInformationForm formData={formData.personalInfo} setFormData={handlePersonalChange} nextStep={nextStep} prevStep={prevStep} />);
            case 3:
            case 3:
                return (<PrioritiesGoalsForm formData={formData.goals} setFormData={handleGoalsChange} nextStep={nextStep} prevStep={prevStep} isOverseas={formData.personalInfo.isOverseas} />);
            case 4:
                return (<BackgroundAchievementsForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />);
            case 5:
                return (<LifelongLearningForm formData={formData.lifelongLearning} setFormData={handleLearningChange} nextStep={nextStep} prevStep={prevStep} />);
            case 6:
                return (<SelfReportForm formData={formData.selfAssessment} setFormData={handleSelfAssessmentChange} nextStep={nextStep} prevStep={prevStep} />);
            case 7:
                return (
                    <PortfolioForm
                        formData={formData}
                        setFormData={(newData: any) => setFormData(prev => ({ ...prev, ...newData }))}
                        nextStep={nextStep}
                        prevStep={prevStep}
                    />
                );
            case 8:
                return (<FinalReviewStep nextStep={handleSubmit} prevStep={prevStep} signaturePadRef={signaturePadRef} isSubmitting={isSubmitting} />);
            // ✅ 9. Pass the new reset handler to the SuccessScreen
            case 9:
                return <SuccessScreen onEdit={startNewApplication} onGoToPortfolio={() => router.push('/portform')} isDeleting={isDeletingApp} />;
            default:
                return <div>Form complete or invalid step.</div>;
        }
    };

    // --- FINAL RETURN ---
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6 font-sans">
            {hasExistingApplication ? (
                <div className="bg-white p-10 rounded-2xl shadow-2xl text-center flex flex-col items-center max-w-md">
                    <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full mb-4">
                        <AlertCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Application Already Submitted</h2>
                    <p className="text-gray-600 mb-6">
                        You have already submitted an application. Only one application per account is allowed.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link href="/tracker" className="px-6 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                            Track Application
                        </Link>
                        <Link href="/" className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors">
                            Back to Home
                        </Link>
                        <button
                            type="button"
                            onClick={startEditApplication}
                            disabled={isLoadingEdit}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoadingEdit && <Loader2 size={16} className="animate-spin" />}
                            Edit Application
                        </button>
                        <Link href="/portform" className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                            Go to Portfolio Form
                        </Link>
                        <button
                            type="button"
                            onClick={startNewApplication}
                            disabled={isDeletingApp}
                            className="px-6 py-3 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isDeletingApp && <Loader2 size={16} className="animate-spin" />}
                            Make a New Application
                        </button>
                    </div>
                </div>
            ) : checkingExisting ? (
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Checking application status...</span>
                </div>
            ) : hasConsented ? (
                // --- If they HAVE consented, show the form ---
                <>
                    {currentStep <= totalSteps && ( // 8 <= 8
                        <div className="w-full max-w-5xl mb-4">
                            <Link
                                href="/"
                                className="flex items-center text-sm text-gray-600 hover:text-black font-semibold transition-colors"
                            >
                                <ArrowLeft size={16} className="mr-1" />
                                Back to Home Page
                            </Link>
                        </div>
                    )}

                    <Pagination currentStep={currentStep} totalSteps={totalSteps} stepTitles={stepTitles} />
                    {renderStep()}
                </>
            ) : (
                // --- If they have NOT consented, show the modal ---
                <DataPrivacyConsent
                    onAgree={handleConsentAgree}
                    onDisagree={handleConsentDisagree}
                />
            )}

            <Modal {...modalProps} />
        </div>
    );
}
