"use client";

import { useState, useRef, useEffect } from "react";
// ✅ 1. IMPORT THE SHARED CLIENT
import supabase from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
// ✅ 2. IMPORT Link and ArrowLeft
import Link from "next/link";
import { PenTool, Loader2, ArrowLeft } from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';
import InitialForm from "./a";
import PersonalInformationForm from "./b";
import PrioritiesGoalsForm from "./c-h";
import BackgroundAchievementsForm from "./d"; //missing page
import CreativeWorksForm from "./i";
import LifelongLearningForm from "./j";
import SelfReportForm from "./selfassessment";
import { useRouter } from 'next/navigation';
import DataPrivacyConsent from './undertaking';

// ❌ 3. REMOVED the local, broken client
// const supabaseUrl = ...
// const supabase = createClient(...)

const getTodayDateISO = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
};

// --- Pagination Component ---
function Pagination({ currentStep, totalSteps, stepTitles }: { currentStep: number; totalSteps: number; stepTitles: string[] }) {
    // ✅ 4. FIX: Hide pagination on the Success screen (step 9)
    if (currentStep > totalSteps) return null; // Was totalSteps + 1

    const steps = stepTitles.map((title, index) => ({ number: index + 1, title }));
    return (
        <div className="w-full max-w-5xl mb-8">
            <div className="flex items-start justify-center">
                {steps.map((step, index) => {
                    const isActive = step.number === currentStep;
                    const isCompleted = step.number < currentStep;
                    return (
                        <div key={step.number} className="flex items-center">
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-300 ${isActive ? "bg-yellow-500 text-white" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {isCompleted ? "✔" : step.number}
                                </div>
                                <p className={`mt-2 text-xs font-semibold w-20 ${isActive ? "text-yellow-600" : "text-gray-500"}`}>{step.title}</p>
                            </div>
                            {index < steps.length - 1 && (<div className={`w-24 border-t-2 transition-colors duration-300 ${isCompleted ? "border-green-500" : "border-gray-200"}`}></div>)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- Success Screen Component ---
// ✅ 5. UPDATED SuccessScreen with new buttons
function SuccessScreen({ onEdit }: { onEdit: () => void }) {
    return (
        <div className="bg-white shadow-lg rounded-2xl w-full max-w-3xl p-12 text-center flex flex-col items-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-black mb-4">Application Submitted!</h1>
            <p className="text-gray-600 mb-8">Thank you for completing the form. We have received your application and will review it shortly.</p>
            
            <div className="flex items-center gap-4 mt-4">
                <button
                    type="button"
                    onClick={onEdit}
                    className="bg-gray-200 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Make a New Application
                </button>
                <Link
                    href="/" // Link to homepage
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
    const { data: session } = useSession(); // Get the user's session
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const signaturePadRef = useRef<SignatureCanvas>(null);
    const [hasConsented, setHasConsented] = useState(false); 
    const router = useRouter();

    const defaultFormData = {
        initial: { name: "", degree: "", campus: "", date: getTodayDateISO(), folderLink: "", photo: null as File | null },
        personalInfo: { fullAddress: "", mobile: "", email: "", birthDate: "", age: null as number | null },
        goals: { degrees: [""], statement: "" },
        education: { tertiary: [], secondary: [], elementary: [], technical: [] },
        nonFormal: [] as any[],
        certifications: [] as any[],
        publications: [] as any[],
        inventions: [] as any[],
        work: { employment: [], consultancy: [], selfEmployment: [] },
        recognitions: [] as any[],
        professional_development: { memberships: [], projects: [], research: [] },
        creativeWorks: [{ title: "", institution: "", dates: "" }],
        lifelongLearning: { hobbies: "", skills: "", workActivities: "", volunteer: "", travels: "" },
        selfAssessment: { jobLearning: "", teamworkLearning: "", selfLearning: "", workBenefits: "", essay: "" }
    };
    
    const [formData, setFormData] = useState(defaultFormData);

    const stepTitles = [
        "Initial Info",
        "Personal",
        "Goals",
        "Background & Achievements", // d.tsx
        "Creative Works",
        "Learning",
        "Self Assessment",
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
                    newState.work = { ...prev.work, ...(newState.work || {}) };
                    newState.lifelongLearning = { ...prev.lifelongLearning, ...(newState.lifelongLearning || {}) };
                    newState.selfAssessment = { ...prev.selfAssessment, ...(newState.selfAssessment || {}) };
                    if (!Array.isArray(newState.nonFormal)) newState.nonFormal = [];
                    if (!Array.isArray(newState.certifications)) newState.certifications = [];
                    if (!Array.isArray(newState.publications)) newState.publications = [];
                    if (!Array.isArray(newState.inventions)) newState.inventions = [];
                    if (!Array.isArray(newState.recognitions)) newState.recognitions = [];
                    if (!Array.isArray(newState.creativeWorks)) newState.creativeWorks = [{ title: "", institution: "", dates: "" }];

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

    // ✅ 7. ADDED: Handler to reset form
    const startNewApplication = () => {
        setFormData(defaultFormData); // Reset state
        setCurrentStep(1); // Go to step 1
        localStorage.removeItem('applicationFormData');
        localStorage.removeItem('applicationFormStep');
        // We keep the consent
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
    const handleBackgroundChange = (updatedData: any) => {
        setFormData(prev => ({
            ...prev,
            ...updatedData
        }));
    };
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
        setIsSubmitting(true);

        if (!session?.user?.email || !session?.user?.id) {
            alert("You must be logged in to submit.");
            setIsSubmitting(false);
            return;
        }

        console.log("Current session user ID (from NextAuth):", session.user.id);
        const signatureDataUrl = signaturePadRef.current?.toDataURL('image/png');
        if (signaturePadRef.current?.isEmpty() || !signatureDataUrl) {
            alert("Signature is empty.");
            setIsSubmitting(false);
            return;
        }
        const photoFile = formData.initial.photo;
        if (!photoFile) {
            alert("1x1 Photo is missing from Step 1.");
            setIsSubmitting(false);
            setCurrentStep(1); // Send user back to step 1
            return;
        }

        try {
            console.log(`Looking up user with email: ${session.user.email}`);
            
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', session.user.email)
                .single();

            if (userError) {
                console.error("Session User:", session.user);
                console.error("User lookup error details:", userError);
                throw new Error(`Database error: ${userError.message}`);
            }

            if (!userData?.id) {
                throw new Error(`Could not find a matching user in the database for email ${session.user.email}. Please ensure your account is properly set up.`);
            }
            const supabaseUserId = userData.id;
            console.log("Found Supabase User UUID:", supabaseUserId);

            // Upload Photo
            const photoFilePath = `${supabaseUserId}/photo_${Date.now()}_${photoFile.name}`;
            console.log("Uploading photo to:", photoFilePath);
            const { data: photoUploadData, error: photoUploadError } = await supabase.storage
                .from('application_files')
                .upload(photoFilePath, photoFile, { upsert: true });
            if (photoUploadError) {
                console.error("Photo upload error details:", photoUploadError);
                throw photoUploadError;
            }
            const { data: photoUrlData } = supabase.storage.from('application_files').getPublicUrl(photoUploadData.path);
            console.log("Photo uploaded to URL:", photoUrlData.publicUrl);

            // Upload Signature
            const response = await fetch(signatureDataUrl);
            const blob = await response.blob();
            const signatureFile = new File([blob], `signature_${Date.now()}.png`, { type: "image/png" });
            const signatureFilePath = `${supabaseUserId}/signature_${signatureFile.name}`;
            console.log("Uploading signature to:", signatureFilePath);

            const { data: sigUploadData, error: sigUploadError } = await supabase.storage
                .from('application_files')
                .upload(signatureFilePath, signatureFile, { upsert: true });
            if (sigUploadError) {
                console.error("Signature upload error details:", sigUploadError);
                throw sigUploadError;
            }
            const { data: sigUrlData } = supabase.storage.from('application_files').getPublicUrl(sigUploadData.path);
            console.log("Signature uploaded to URL:", sigUrlData.publicUrl);

            // Prepare and Insert Data
            console.log("Preparing data for insertion with user_id:", supabaseUserId);
            const insertPayload = {
                user_id: supabaseUserId,
                applicant_name: formData.initial.name,
                degree_applied_for: formData.initial.degree,
                campus: formData.initial.campus,
                application_date: formData.initial.date,
                folder_link: formData.initial.folderLink,
                full_address: formData.personalInfo.fullAddress,
                mobile_number: formData.personalInfo.mobile,
                email_address: formData.personalInfo.email,
                age: formData.personalInfo.age,
                birth_date: formData.personalInfo.birthDate,
                goal_statement: formData.goals.statement,
                degree_priorities: formData.goals.degrees,
                creative_works: formData.creativeWorks,
                lifelong_learning: formData.lifelongLearning,
                self_assessment: formData.selfAssessment,
                photo_url: photoUrlData.publicUrl,
                signature_url: sigUrlData.publicUrl,
                education_background: formData.education,
                non_formal_education: formData.nonFormal,
                certifications: formData.certifications,
                publications: formData.publications,
                inventions: formData.inventions,
                work_experiences: formData.work,
                recognitions: formData.recognitions,
                professional_development: formData.professional_development,
            };
            console.log("Insert Payload:", insertPayload);

            const { error: insertError } = await supabase
                .from('applications')
                .insert(insertPayload);

            if (insertError) {
                console.error("Database insert error details:", insertError);
                throw insertError; // Throw the error to be caught below
            }
            console.log("Data inserted successfully!");

            // Success
            localStorage.removeItem('applicationFormData');
            localStorage.removeItem('applicationFormStep');
            nextStep(); // Move to success screen (step 9)

        } catch (error) {
            console.error("Error during submission process:", (error as Error).message);
            alert(`Submission failed: ${(error as Error).message}`);
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
                return ( <InitialForm formData={formData.initial} setFormData={handleInitialChange} nextStep={nextStep} /> );
            case 2:
                return ( <PersonalInformationForm formData={formData.personalInfo} setFormData={handlePersonalChange} nextStep={nextStep} prevStep={prevStep} /> );
            case 3:
                return ( <PrioritiesGoalsForm formData={formData.goals} setFormData={handleGoalsChange} nextStep={nextStep} prevStep={prevStep} /> );
            case 4:
                return ( <BackgroundAchievementsForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} /> );
            case 5:
                return ( <CreativeWorksForm formData={formData.creativeWorks} setFormData={handleCreativeWorksChange} nextStep={nextStep} prevStep={prevStep} /> );
            case 6:
                return ( <LifelongLearningForm formData={formData.lifelongLearning} setFormData={handleLearningChange} nextStep={nextStep} prevStep={prevStep} /> );
            case 7:
                return ( <SelfReportForm formData={formData.selfAssessment} setFormData={handleSelfAssessmentChange} nextStep={nextStep} prevStep={prevStep} /> );
            case 8:
                return ( <FinalReviewStep nextStep={handleSubmit} prevStep={prevStep} signaturePadRef={signaturePadRef} isSubmitting={isSubmitting} /> );
            // ✅ 9. Pass the new reset handler to the SuccessScreen
            case 9:
                return <SuccessScreen onEdit={startNewApplication} />;
            default:
                return <div>Form complete or invalid step.</div>;
        }
    };

    // --- FINAL RETURN ---
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6 font-sans">
            
            {hasConsented ? (
                // --- If they HAVE consented, show the form ---
                <>
                    {/* ✅ 10. ADDED: Back to Home button (hides on success) */}
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
            
        </div>
    );
}