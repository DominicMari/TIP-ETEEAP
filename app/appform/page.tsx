"use client";

// 👇 1. IMPORT useEffect
import { useState, useRef, useEffect } from "react";
import { PenTool } from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';
import InitialForm from "./a";
import PersonalInformationForm from "./b";
import PrioritiesGoalsForm from "./c-h";
import CreativeWorksForm from "./i";
import LifelongLearningForm from "./j";
import SelfReportForm from "./selfassessment";


const getTodayDateISO = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
};

function Pagination({ currentStep, totalSteps, stepTitles }: { currentStep: number; totalSteps: number; stepTitles: string[] }) {
  if (currentStep > totalSteps + 1) return null;
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

// CORRECTED FinalReviewStep Component
function FinalReviewStep({ nextStep, prevStep }: { nextStep: () => void, prevStep: () => void }) {
    // 👇 2. DEFINE THE REF AND STATE FOR THE SIGNATURE PAD
    const signaturePadRef = useRef<SignatureCanvas>(null);
    const [signatureError, setSignatureError] = useState<string | null>(null);

    const handleFinalSubmit = () => {
        // Check if the signature pad is empty
        if (signaturePadRef.current?.isEmpty()) {
            setSignatureError("A signature is required to submit the application.");
            return; // Stop the submission
        }
        setSignatureError(null); // Clear any previous error
        nextStep(); // This calls the handleSubmit function from the parent
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
                    <PenTool size={20} className="mr-2 text-yellow-600"/>
                    Applicant's Signature
                </h3>
                {/* 👇 3. USE THE IMPORTED COMPONENT */}
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <SignatureCanvas
                        ref={signaturePadRef}
                        penColor='black'
                        canvasProps={{ className: 'w-full h-40' }}
                    />
                </div>
                {signatureError && <p className="mt-2 text-sm text-red-600">{signatureError}</p>}
            </div>

            <div className="flex justify-between pt-4">
                <button type="button" onClick={prevStep} className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors">
                    ← Back
                </button>
                <button type="button" onClick={handleFinalSubmit} className="bg-green-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                    Submit Application
                </button>
            </div>
        </div>
    )
}


function SuccessScreen() {
    return (
        <div className="bg-white shadow-lg rounded-2xl w-full max-w-3xl p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-black mb-4">Application Submitted!</h1>
            <p className="text-gray-600">Thank you for completing the form. We have received your application and will review it shortly.</p>
        </div>
    );
}

// --- Main Page Component ---
export default function ApplicationFormPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        initial: { name: "", degree: "", campus: "", date: getTodayDateISO(), folderLink: "", photo: null },
        personalInfo: { fullAddress: "", mobile: "", email: "" },
        goals: { degrees: [""], statement: "" },
        creativeWorks: [{ title: "", institution: "", dates: "" }],
        lifelongLearning: { hobbies: "", skills: "", workActivities: "", volunteer: "", travels: "" },
        selfAssessment: { jobLearning: "", teamworkLearning: "", selfLearning: "", workBenefits: "", essay: "" }
    });

    const stepTitles = ["Initial Info", "Personal", "Goals", "Creative Works", "Learning", "Self Assessment", "Submit"];
    const totalSteps = stepTitles.length;

    // 👇 2. HOOK TO LOAD DATA WHEN THE COMPONENT MOUNTS
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('applicationFormData');
            const savedStep = localStorage.getItem('applicationFormStep');

            if (savedData) {
                setFormData(JSON.parse(savedData));
            }
            if (savedStep) {
                // Ensure the user isn't sent back to the success screen
                const step = parseInt(savedStep, 10);
                if (step < totalSteps + 2) {
                    setCurrentStep(step);
                }
            }
        } catch (error) {
            console.error("Failed to load form data from local storage", error);
            // Clear corrupted data
            localStorage.removeItem('applicationFormData');
            localStorage.removeItem('applicationFormStep');
        }
    }, []); // Empty array ensures this runs only once on mount

    // 👇 3. HOOK TO SAVE DATA WHEN IT CHANGES
    useEffect(() => {
        // Don't save data on the success screen (step 8)
        if (currentStep < totalSteps + 2) {
            localStorage.setItem('applicationFormData', JSON.stringify(formData));
            localStorage.setItem('applicationFormStep', currentStep.toString());
        }
    }, [formData, currentStep]); // Re-run this effect whenever formData or currentStep changes

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

    const handleSubmit = () => {
        console.log("FINAL FORM DATA:", formData);
        // 👇 4. CLEAR LOCAL STORAGE ON SUCCESSFUL SUBMISSION
        localStorage.removeItem('applicationFormData');
        localStorage.removeItem('applicationFormStep');
        nextStep(); // Move to success screen
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <InitialForm formData={formData} setFormData={setFormData} nextStep={nextStep} />;
            case 2: return <PersonalInformationForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 3: return <PrioritiesGoalsForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 4: return <CreativeWorksForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 5: return <LifelongLearningForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 6: return <SelfReportForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 7: return <FinalReviewStep nextStep={handleSubmit} prevStep={prevStep} />;
            case 8: return <SuccessScreen />;
            default: return <div>Form complete or invalid step.</div>;
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6 font-sans">
            <Pagination currentStep={currentStep} totalSteps={totalSteps} stepTitles={stepTitles} />
            {renderStep()}
        </div>
    );
}