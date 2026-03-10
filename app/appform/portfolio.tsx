"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, FileText, Image as ImageIcon } from "lucide-react";

interface PortfolioDocument {
  title: string;
  file: File | null;
  required: boolean;
}

export default function PortfolioForm({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}) {
  // Initialize internal state
  const [documents, setDocuments] = useState<PortfolioDocument[]>([
    { title: "Curriculum Vitae", file: null, required: true },
    { title: "Endorsement Letter from last/current employer", file: null, required: true },
    { title: "PSA Birth Certificate", file: null, required: true },
    { title: "Brgy. Clearance/Passport/NBI", file: null, required: true },
    { title: "Marriage Certificate (for married people)", file: null, required: false },
    { title: "Other evidences", file: null, required: false },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // EFFECT: If user previously uploaded files and clicked "Back", 
  // restore those files from the global formData state.
  useEffect(() => {
    if (formData.portfolioFiles && formData.portfolioFiles.length > 0) {
      const restoredDocs = documents.map((doc, index) => ({
        ...doc,
        file: formData.portfolioFiles[index] || null,
      }));
      setDocuments(restoredDocs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (index: number, file: File | null) => {
    const updated = [...documents];
    updated[index].file = file;
    setDocuments(updated);
    
    // Clear error for this specific slot when a file is added
    if (file) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[index];
        return newErrs;
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    handleFileChange(index, null);
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    // 1. Validate Required Fields
    documents.forEach((doc, index) => {
      if (doc.required && !doc.file) {
        newErrors[index] = `${doc.title} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 2. Prepare metadata for the JSONB column in database
    const docMetadata = documents.map((doc) => ({
      title: doc.title,
      fileName: doc.file?.name || null,
      fileSize: doc.file ? `${(doc.file.size / 1024 / 1024).toFixed(2)} MB` : null,
      fileType: doc.file?.type || null,
    }));

    // 3. Update parent state
    setFormData({
      ...formData,
      portfolio_metadata: docMetadata, // Clean data for DB
      portfolioFiles: documents.map((doc) => doc.file), // Actual binary files for Storage upload
    });

    nextStep();
  };

  return (
    <form
      className="bg-white shadow-lg rounded-2xl w-7xl max-w flex flex-col"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="p-6 border-b text-center">
        <h2 className="font-bold text-xl text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>
      </div>

      <div className="bg-blue-50 text-blue-800 px-6 py-3 text-sm flex items-center gap-3 mx-6 mt-4 rounded-xl border border-blue-100">
        <span className="text-lg">📋</span>
        <p>
          Please submit the required documents below. Supported formats: <b>PDF, PNG, JPG</b> (Max 10MB each).
        </p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[65vh] px-8 py-4">
        <h3 className="font-bold text-lg mb-2 text-black">
          G. Portfolio - Document Submission
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Upload clear scanned copies or high-quality photos of your documents.
        </p>

        <div className="space-y-5">
          {documents.map((doc, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">
                  {doc.title} {doc.required && <span className="text-red-500">*</span>}
                </label>
                {doc.file && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>

              {doc.file ? (
                // SUCCESS STATE: File Uploaded
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  {doc.file?.type?.includes("image") ? (
                      <ImageIcon className="text-green-600" size={20} />
                    ) : (
                      <FileText className="text-green-600" size={20} />
                    )}
                  <div className="flex-1 truncate">
                    <p className="text-sm font-semibold text-green-900 truncate">{doc.file.name}</p>
                    <p className="text-xs text-green-700">
                      {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="bg-green-600 text-white rounded-full p-1">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : (
                // IDLE STATE: Dropzone
                <label className={`
                  group relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer text-center
                  ${errors[index] ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}
                `}>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          setErrors((prev) => ({ ...prev, [index]: "File size must be less than 10MB." }));
                          return;
                        }
                        handleFileChange(index, file);
                      }
                    }}
                  />
                  <Upload className={`mx-auto mb-2 transition-colors ${errors[index] ? 'text-red-400' : 'text-gray-400 group-hover:text-blue-500'}`} size={24} />
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                </label>
              )}

              {errors[index] && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors[index]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between p-6 border-t bg-gray-50 rounded-b-2xl">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={validateAndProceed}
          className="px-8 py-2 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-all shadow-md active:scale-95"
        >
          Next Step →
        </button>
      </div>
    </form>
  );
}