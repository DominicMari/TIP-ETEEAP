"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function ApplicationForm() {
  // Degrees stored as dynamic array
  const [degrees, setDegrees] = useState<string[]>([""]);

  const [formData, setFormData] = useState({
    goals: "",
    plan: "",
    overseas: "",
    completion: "",
  });

  // Handle multiple degrees
  const handleDegreeChange = (index: number, value: string) => {
    const updated = [...degrees];
    updated[index] = value;
    setDegrees(updated);
  };

  const handleAddDegree = () => {
    setDegrees([...degrees, ""]);
  };

  const handleRemoveDegree = (index: number) => {
    const updated = degrees.filter((_, i) => i !== index);
    setDegrees(updated);
  };

  // Handle other fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    console.log("Next clicked, data:", { degrees, ...formData });
    // Navigate to page 3
  };

  const handleBack = () => {
    console.log("Back clicked");
    // Navigate to page 1
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col">
        {/* Title */}
        <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>

        {/* Scrollable Section with full padding */}
        <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 px-6 pt-4 pb-6">
          {/* Section Title */}
          <h3 className="font-semibold text-lg mb-4 text-black">
            B. Priorities and Goals
          </h3>

          {/* 1. Degree program dynamic input */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-semibold text-black">
              1. Degree program being applied for.
            </label>

            {degrees.map((degree, index) => (
              <div key={index} className="flex items-center gap-2 mb-3">
                {/* Dropdown */}
                <select
                  value={degree}
                  onChange={(e) => handleDegreeChange(index, e.target.value)}
                  className="flex-1 border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100"
                >
                  <option value="">Select degree</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSCpE">BSCpE</option>
                  <option value="BSEE">BSEE</option>
                  <option value="BSME">BSME</option>
                  <option value="BSCHE">BSCHE</option>
                </select>

                {/* Add / Remove buttons */}
                {index === 0 ? (
                  <button
                    type="button"
                    onClick={handleAddDegree}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg"
                  >
                    <Plus size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRemoveDegree(index)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                  >
                    <Minus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
<div
  className="bg-yellow-100 text-black px-6 py-3 rounded-lg text-sm mb-4 leading-relaxed 
             flex items-center gap-2 mx-auto w-full max-w-2xl text-center shadow"
>
  <span>⚠️</span>
  <span>
    (Note: The T.I.P. ETEEAP Unit Head and the Assessors have the right to give
    the final approval on what program the applicant shall enroll.)
  </span>
</div>

          {/* 2. Goals */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
              2. Statement of your goals, objectives, and purposes in applying
              for the degree:
            </label>
            <textarea
              name="goals"
              rows={4}
              value={formData.goals}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

          {/* 3. Learning Plan */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
              3. Indicate how much time you plan to devote to personal learning
              (hours/week) and how you can make improvements in the prescribed
              program. Please specify your resources:
            </label>
            <textarea
              name="plan"
              rows={3}
              value={formData.plan}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

          {/* 4. Overseas */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
              4. For overseas applicants (otherwise, please indicate “Not
              Applicable”), describe how you plan to conduct collaborative
              relationships (e.g., where you plan to come to the Philippines):
            </label>
            <textarea
              name="overseas"
              rows={3}
              value={formData.overseas}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

          {/* 5. Completion */}
<div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
                 5. How soon do you need to complete your education/credential?
            </label>
            <textarea
              name="overseas"
              rows={3}
              value={formData.overseas}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

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