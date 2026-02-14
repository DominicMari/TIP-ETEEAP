"use client";

import { Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";

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
  formData: any; // This prop is ACTUALLY the creativeWorks array
  setFormData: (data: CreativeWork[]) => void; // This prop is handleCreativeWorksChange
  nextStep: () => void;
  prevStep: () => void;
}) {
  // ✅ FIX: 'formData' prop *is* the array.
  // We ensure it's an array, or default to an empty one.
  const works: CreativeWork[] = Array.isArray(formData) ? formData : [];

  // ✅ FIX: Ensure 'isNone' reflects the state of 'works' when loaded
  const [isNone, setIsNone] = useState(
    works.length === 1 &&
      works[0].title === "" &&
      works[0].institution === "" &&
      works[0].dates === ""
  );

  // Sync 'isNone' if the works array is ever reset from outside
  useEffect(() => {
    const isActuallyNone =
      works.length === 1 &&
      works[0].title === "" &&
      works[0].institution === "" &&
      works[0].dates === "";
    // Only set 'isNone' if the works are empty, otherwise keep user's 'None' toggle
    if (isActuallyNone) {
      setIsNone(true);
    } else if (works.length > 1) {
      setIsNone(false);
    }
  }, [works]);


  // ✅ Validation errors
  const [errors, setErrors] = useState<{ form?: string }>({});

  const validateAndProceed = () => {
    const hasFilledWork = works.some(
      (work) =>
        work.title.trim() !== "" ||
        work.institution.trim() !== "" ||
        work.dates.trim() !== ""
    );

    // If 'isNone' is checked, OR there is filled work, it's valid.
    if (isNone || hasFilledWork) {
      setErrors({});
      // If 'isNone', submit an empty array. Otherwise submit the works.
      nextStep();
    } else {
      // Only show error if 'isNone' is NOT checked AND no work is filled
      setErrors({
        form: "Please fill in at least one Creative Work or click 'None' if not applicable.",
      });
      return;
    }
  };

  // ✅ FIX: 'setFormData' is a function that just takes the new array.
  const handleWorkChange = (
    index: number,
    field: keyof CreativeWork,
    value: string
  ) => {
    const updated = [...works];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(updated); // Just pass the new array
  };

  // ✅ FIX: 'setFormData' just takes the new array.
  const addWork = () => {
    setIsNone(false);
    const updated = [
      ...works,
      { title: "", institution: "", dates: "" },
    ];
    setFormData(updated); // Just pass the new array
  };

  // ✅ FIX: 'setFormData' just takes the new array.
  const removeWork = (index: number) => {
    let updated = works.filter((_, i) => i !== index);
    if (updated.length === 0) {
      // restore one blank form to keep structure
      updated = [{ title: "", institution: "", dates: "" }];
      setIsNone(true); // If all are removed, we are in a 'None' state
    }
    setFormData(updated); // Just pass the new array
  };

  // ✅ FIX: 'setFormData' just takes the new array.
  const toggleNone = () => {
    const newIsNone = !isNone;
    setIsNone(newIsNone);

    if (newIsNone) {
      // If user clicks "None", clear the form.
      setFormData([{ title: "", institution: "", dates: "" }]);
    }
    // If user clicks "Edit" (toggling from true to false), just toggle the state.
    // They can start typing.
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
      {/* This <form> tag doesn't need an onSubmit, 
        as the Next button is type="button" and has its own onClick.
      */}
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
                  value={work.title}
                  onClick={handleAttemptWhileNone}
                  onFocus={handleAttemptWhileNone}
                  onChange={(e) =>
                    handleWorkChange(idx, "title", e.target.value)
                  }
                  disabled={isNone}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
                />
              </div>

              {/* Institution */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Name and Address of the Institution/Industry/Agency: <span className="text-red-500">*</span>
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
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
                />
              </div>

              {/* Dates */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Inclusive Dates of Attendance: <span className="text-red-500">*</span>
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
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
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
            <p className="text-red-500 text-sm mb-2 text-center">
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
