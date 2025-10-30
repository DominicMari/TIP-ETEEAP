// B. Priorities ang goals
"use client";

import { Plus, Minus } from "lucide-react";

export default function PrioritiesGoalsForm({
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
  const handleDegreeChange = (index: number, value: string) => {
    const updated = [...formData.goals.degrees];
    updated[index] = value;
    setFormData((prev: any) => ({
      ...prev,
      goals: { ...prev.goals, degrees: updated },
    }));
  };

  const handleAddDegree = () => {
    setFormData((prev: any) => ({
      ...prev,
      goals: { ...prev.goals, degrees: [...prev.goals.degrees, ""] },
    }));
  };

  const handleRemoveDegree = (index: number) => {
    const updated = formData.goals.degrees.filter((_: any, i: number) => i !== index);
    setFormData((prev: any) => ({
      ...prev,
      goals: { ...prev.goals, degrees: updated },
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      goals: { ...prev.goals, [name]: value },
    }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const { degrees, statement } = formData.goals;

    // Validation check
    if (degrees.some((d: string) => !d) || !statement.trim()) {
      alert("Please complete all required fields before proceeding.");
      return;
    }

    nextStep();
  };

  return (
    <form
      onSubmit={handleNext}
      className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col"
    >
      <div className="flex-1 overflow-y-auto max-h-[70vh] p-6">
        <h3 className="font-semibold text-lg mb-4 text-black">
          B. Priorities and Goals
        </h3>

        {/* Degree selection */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold text-black">
            Degree program(s) being applied for:
          </label>
          {formData.goals.degrees.map((degree: string, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-3">
              <select
                required
                value={degree}
                onChange={(e) => handleDegreeChange(index, e.target.value)}
                className="flex-1 border border-gray-400 rounded-lg p-2 text-black"
              >
                <option value="">Select degree</option>
                <option value="BSCS">Bachelor of Science in Computer Science</option>
                <option value="BSIS">Bachelor of Science in Information Systems</option>
                <option value="BSIT">Bachelor of Science in Information Technology</option>
                <option value="BSCpE">Bachelor of Science in Computer Engineering</option>
                <option value="BSIE">Bachelor of Science in Industrial Engineering</option>
                <optgroup label="Bachelor of Science in Business Administration">
                  <option value="Logistics and Supply Chain Management">
                    Logistics and Supply Chain Management
                  </option>
                  <option value="Financial Management">Financial Management</option>
                  <option value="Human Resources Management">Human Resources Management</option>
                  <option value="Marketing Management">Marketing Management</option>
                </optgroup>
              </select>

              {index === 0 ? (
                <button
                  type="button"
                  onClick={handleAddDegree}
                  className="bg-yellow-500 text-white p-2 rounded-lg"
                >
                  <Plus size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRemoveDegree(index)}
                  className="bg-red-500 text-white p-2 rounded-lg"
                >
                  <Minus size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Statement field */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-semibold text-black">
            Statement of your goals:
          </label>
          <textarea
            name="statement"
            rows={4}
            required
            value={formData.goals.statement}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg p-2 text-black"
            placeholder="Write your goals here..."
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between p-6">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg"
        >
          Next →
        </button>
      </div>
    </form>
  );
}