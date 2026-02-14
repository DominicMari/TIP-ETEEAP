"use client";

import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";

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
  const [documents, setDocuments] = useState<PortfolioDocument[]>([
    { title: "Curriculum Vitae", file: null, required: true },
    { title: "Endorsement Letter from last employer", file: null, required: true },
    { title: "PSA Birth Certificate", file: null, required: true },
    { title: "Brgy. Clearance/Passport/NBI", file: null, required: true },
    { title: "Marriage Certificate (for married people)", file: null, required: false },
    { title: "Other evidences", file: null, required: false },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (index: number, file: File | null) => {
    const updated = [...documents];
    updated[index].file = file;
    setDocuments(updated);
    // Clear error when file is selected
    if (file) {
      setErrors((prev) => ({ ...prev, [index]: "" }));
    }
  };

  const handleRemoveFile = (index: number) => {
    handleFileChange(index, null);
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    // Check required documents
    documents.forEach((doc, index) => {
      if (doc.required && !doc.file) {
        newErrors[index] = `${doc.title} is required.`;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Save documents to formData (file names/metadata, not actual files)
      const docData = documents.map((doc) => ({
        title: doc.title,
        fileName: doc.file?.name || null,
        fileSize: doc.file?.size || null,
      }));
      setFormData({
        ...formData,
        portfolio: docData,
        portfolioFiles: documents.map((doc) => doc.file),
      });
      nextStep();
    }
  };

  return (
    <form
      className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
        APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
      </h2>

      <div className="bg-blue-100 text-black px-6 py-3 rounded-lg text-sm mb-4 leading-relaxed flex items-center gap-2 mx-auto w-full max-w-2xl text-center shadow">
        <span>📋</span>
        <span>
          Please submit the required documents below. Ensure all files are clear and legible.
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[70vh] px-6 pt-4 pb-6">
        <h3 className="font-semibold text-lg mb-4 text-black">
          G. Portfolio - Document Submission
        </h3>

        <p className="text-sm text-gray-700 mb-6">
          Please upload the following documents to complete your application:
        </p>

        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <label className="block text-sm font-semibold text-black flex items-center gap-2">
                  {doc.title}
                  {doc.required && <span className="text-red-500">*</span>}
                </label>
                {doc.file && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {doc.file ? (
                <div className="bg-white border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <span className="text-green-600 text-lg">✓</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">{doc.file.name}</p>
                    <p className="text-xs text-gray-600">
                      {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file size (max 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          setErrors((prev) => ({
                            ...prev,
                            [index]: "File size must be less than 10MB.",
                          }));
                          return;
                        }
                        handleFileChange(index, file);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload size={24} className="mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                </label>
              )}

              {errors[index] && (
                <p className="text-red-500 text-sm mt-2">{errors[index]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between p-6">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={validateAndProceed}
          className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Next →
        </button>
      </div>
    </form>
  );
}
