"use client";

import { Plus, Minus } from "lucide-react";
import { useState } from "react";

type CreativeWork = {
  title: string;
  institution: string;
  startDate: string; 
  endDate: string;   
};

export default function CreativeWorksForm({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: {
  formData: any; 
  setFormData: (data: CreativeWork[]) => void; 
  nextStep: () => void;
  prevStep: () => void;
}) {
  const works: CreativeWork[] = Array.isArray(formData) ? formData : [];

  const [errors, setErrors] = useState<{ form?: string }>({});

  const validateAndProceed = () => {
    let isValid = true;
    let errorMessage = "Please fill in all required fields for your Creative Work(s).";

    const isFullyFilled = works.every((work) => {
      // 1. Safely check if all fields are filled (handle potential undefined from old data)
      const title = work.title || "";
      const institution = work.institution || "";
      const startDate = work.startDate || "";
      const endDate = work.endDate || "";

      if (
        title.trim() === "" ||
        institution.trim() === "" ||
        startDate === "" ||
        endDate === ""
      ) {
        isValid = false;
        return false;
      }

      // 2. Validate chronological order
      if (new Date(startDate) > new Date(endDate)) {
        isValid = false;
        errorMessage = "End date cannot be earlier than the start date.";
        return false;
      }

      return true;
    });

    if (works.length > 0 && isFullyFilled && isValid) {
      setErrors({});
      nextStep();
    } else {
      setErrors({ form: errorMessage });
    }
  };

  const handleWorkChange = (
    index: number,
    field: keyof CreativeWork,
    value: string
  ) => {
    const updated = [...works];
    updated[index] = { ...updated[index], [field]: value };
    
    if (errors.form) setErrors({});
    
    setFormData(updated);
  };

  const addWork = () => {
    const updated = [
      ...works,
      { title: "", institution: "", startDate: "", endDate: "" },
    ];
    setFormData(updated);
  };

  const removeWork = (index: number) => {
    let updated = works.filter((_, i) => i !== index);
    if (updated.length === 0) {
      updated = [{ title: "", institution: "", startDate: "", endDate: "" }];
    }
    setFormData(updated);
  };

  const displayWorks =
    works.length > 0
      ? works
      : [{ title: "", institution: "", startDate: "", endDate: "" }];

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col">
        <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>

        <div className="bg-yellow-100 text-black px-6 py-3 rounded-lg text-sm mb-4 flex items-center gap-2 mx-auto w-full max-w-2xl text-center shadow">
          <span>⚠️</span>
          <span>
            All information indicated herein shall be certified true copy and
            notarized
          </span>
        </div>

        <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 px-6 pt-4 pb-6">
          <h3 className="font-semibold text-lg mb-2 text-black">
            I. Creative Works and Special Accomplishments
          </h3>
          <p className="italic text-sm text-gray-700 mb-4 leading-relaxed">
            (Please enumerate the various creative works and special
            accomplishments you have done in the past...)
          </p>

          {displayWorks.map((work, idx) => (
            <div
              key={idx}
              className="border border-gray-300 rounded-xl p-4 mb-4 bg-gray-50 shadow-sm"
            >
              {/* Title */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Title and Brief Description: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={work.title || ""} // <-- FIXED: Added || ""
                  onChange={(e) =>
                    handleWorkChange(idx, "title", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Institution */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Name and Address of the Institution/Industry/Agency:{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={work.institution || ""} // <-- FIXED: Added || ""
                  onChange={(e) =>
                    handleWorkChange(idx, "institution", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Dates: From and To */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Inclusive Dates of Attendance: <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="month"
                      value={work.startDate || ""} // <-- FIXED: Added || ""
                      max={new Date().toISOString().slice(0, 7)}
                      onChange={(e) =>
                        handleWorkChange(idx, "startDate", e.target.value)
                      }
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <span className="mt-5 text-gray-500 font-medium">to</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="month"
                      value={work.endDate || ""} // <-- FIXED: Added || ""
                      min={work.startDate || ""} // <-- FIXED: Added || ""
                      onChange={(e) =>
                        handleWorkChange(idx, "endDate", e.target.value)
                      }
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-2">
                {idx === 0 ? (
                  <button
                    type="button"
                    onClick={addWork}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus size={16} /> Add
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeWork(idx)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Minus size={16} /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex flex-col px-6 pb-4">
          {errors.form && (
            <p className="text-red-500 text-sm mb-2 text-center font-medium">
              {errors.form}
            </p>
          )}
          <div className="flex justify-between">
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
        </div>
      </form>
    </div>
  );
}