"use client";

import { Plus, Minus } from "lucide-react";
import { useState } from "react";

type CreativeWork = {
  title: string;
  institution: string;
  dates: string;
};

export default function CreativeWorksForm({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: {
  formData: any;
  setFormData: Function;
  nextStep: () => void;
  prevStep: () => void;
}) {
  const works: CreativeWork[] = formData.creativeWorks || [];
  const [isNone, setIsNone] = useState(false);

  // ✅ Validation errors
const [errors, setErrors] = useState<{ form?: string }>({});

const validateAndProceed = () => {
  const hasFilledWork = works.some(
    (work) =>
      work.title.trim() !== "" ||
      work.institution.trim() !== "" ||
      work.dates.trim() !== ""
  );

  if (!isNone && !hasFilledWork) {
    setErrors({
      form: "Please fill in at least one Creative Work or click 'None' if not applicable.",
    });
    return;
  }

  setErrors({});
  nextStep();
};


  // Update individual work field
  const handleWorkChange = (
    index: number,
    field: keyof CreativeWork,
    value: string
  ) => {
    const updated = [...works];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, creativeWorks: updated }));
  };

  // Add new creative work (turn off None)
  const addWork = () => {
    setIsNone(false);
    setFormData((prev: any) => ({
      ...prev,
      creativeWorks: [
        ...(prev.creativeWorks || []),
        { title: "", institution: "", dates: "" },
      ],
    }));
  };

  // Remove a creative work
  const removeWork = (index: number) => {
    const updated = works.filter((_, i) => i !== index);
    if (updated.length === 0) {
      // restore one blank form to keep structure
      setFormData((prev: any) => ({
        ...prev,
        creativeWorks: [{ title: "", institution: "", dates: "" }],
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, creativeWorks: updated }));
    }
  };

  // Toggle None/Edit (for first card only)
  const toggleNone = () => {
    setIsNone((prev) => !prev);
    if (!isNone) {
      // clear form when setting to None
      setFormData((prev: any) => ({
        ...prev,
        creativeWorks: [{ title: "", institution: "", dates: "" }],
      }));
    }
  };

  // Alert if user tries typing while on None
  const handleAttemptWhileNone = () => {
    if (isNone) {
      alert("You’ve selected ‘None’. Click ‘Edit’ to fill out this section.");
    }
  };

  // always keep at least one card visible
  const displayWorks =
    works.length > 0 ? works : [{ title: "", institution: "", dates: "" }];

  const multipleCards = displayWorks.length > 1;

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
                  Title and Brief Description:
                </label>
                <input
                  type="text"
                  value={work.title}
                  onClick={handleAttemptWhileNone}
                  onFocus={handleAttemptWhileNone}
                  onChange={(e) =>
                    handleWorkChange(idx, "title", e.target.value)
                  }
                  disabled={isNone}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>

              {/* Institution */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Name and Address of the Institution/Industry/Agency:
                </label>
                <input
                  type="text"
                  value={work.institution}
                  onClick={handleAttemptWhileNone}
                  onFocus={handleAttemptWhileNone}
                  onChange={(e) =>
                    handleWorkChange(idx, "institution", e.target.value)
                  }
                  disabled={isNone}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>

              {/* Dates */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Inclusive Dates of Attendance:
                </label>
                <input
                  type="text"
                  value={work.dates}
                  onClick={handleAttemptWhileNone}
                  onFocus={handleAttemptWhileNone}
                  onChange={(e) =>
                    handleWorkChange(idx, "dates", e.target.value)
                  }
                  disabled={isNone}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-2">
                {idx === 0 ? (
                  <>
                    {/* None only visible when 1 card */}
                    {!multipleCards && (
                      <button
                        type="button"
                        onClick={toggleNone}
                        disabled={multipleCards}
                        className={`${
                          isNone
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-red-400 hover:bg-red-500"
                        } text-white px-3 py-2 rounded-lg flex items-center gap-1`}
                      >
                        {isNone ? "Edit" : "None"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={addWork}
                      disabled={isNone}
                      className={`${
                        isNone
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      } px-3 py-2 rounded-lg flex items-center gap-1`}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </>
                ) : (
                  // Other cards only have remove
                  <button
                    type="button"
                    onClick={() => removeWork(idx)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
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
    <p className="text-red-500 text-sm mb-2 text-center">{errors.form}</p>
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