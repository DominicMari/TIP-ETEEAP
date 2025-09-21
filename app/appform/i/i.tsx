"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type CreativeWork = {
  title: string;
  institution: string;
  dates: string;
};

export default function CreativeWorksForm() {
  const [works, setWorks] = useState<CreativeWork[]>([
    { title: "", institution: "", dates: "" },
  ]);

  const handleWorkChange = (
    index: number,
    field: keyof CreativeWork,
    value: string
  ) => {
    const updated = [...works];
    updated[index] = { ...updated[index], [field]: value };
    setWorks(updated);
  };

  const addWork = () => {
    setWorks([...works, { title: "", institution: "", dates: "" }]);
  };

  const removeWork = (index: number) => {
    const updated = works.filter((_, i) => i !== index);
    setWorks(updated);
  };

  const handleNext = () => {
    console.log("Next clicked, data:", works);
    // Navigate to page J
  };

  const handleBack = () => {
    console.log("Back clicked");
    // Navigate to page H
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col">
        {/* Title */}
        <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>

        {/* Note Banner */}
        <div className="bg-yellow-100 text-black px-6 py-3 rounded-lg text-sm mb-4 leading-relaxed 
                        flex items-center gap-2 mx-auto w-full max-w-2xl text-center shadow">
          <span>⚠️</span>
          <span>
            All information indicated herein shall be certified true copy and notarized
          </span>
        </div>

        {/* Scrollable Section */}
        <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] 
                        scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 px-6 pt-4 pb-6">
          {/* Section Title */}
          <h3 className="font-semibold text-lg mb-2 text-black">
            I. Creative Works and Special Accomplishments
          </h3>

          {/* Instruction */}
          <p className="italic text-sm text-gray-700 mb-4 leading-relaxed">
            (Please enumerate the various creative works and special accomplishments you have
            done in the past. Examples of these are literary fiction and non-fiction writings,
            musical work, products of visual performing arts, exceptional accomplishments in
            sports, social, cultural, and leisure activities, etc. which can lead one to conclude
            the level of expertise you have obtained in certain fields of interest. Include also
            participation in competitions and prizes obtained.)
          </p>

          {/* Dynamic Forms */}
          {works.map((work, idx) => (
            <div
              key={idx}
              className="border border-gray-300 rounded-xl p-4 mb-4 bg-gray-50 shadow-sm"
            >
              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Title and Brief Description:
                </label>
                <input
                  type="text"
                  value={work.title}
                  onChange={(e) => handleWorkChange(idx, "title", e.target.value)}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Name and Address of the Institution/Industry/Agency:
                </label>
                <input
                  type="text"
                  value={work.institution}
                  onChange={(e) =>
                    handleWorkChange(idx, "institution", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-semibold text-black mb-1">
                  Inclusive Dates of Attendance:
                </label>
                <input
                  type="text"
                  value={work.dates}
                  onChange={(e) => handleWorkChange(idx, "dates", e.target.value)}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>

              {/* Buttons aligned bottom-right */}
              <div className="flex justify-end gap-2 mt-2">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => removeWork(idx)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                  >
                    <Minus size={16} /> Remove
                  </button>
                )}
                {idx === works.length - 1 && (
                  <button
                    type="button"
                    onClick={addWork}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                  >
                    <Plus size={16} /> Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-2 px-6 pb-4">
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  );
}