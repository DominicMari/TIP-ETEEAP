"use client";

import { useState } from "react";
import { Plus, Minus, Lightbulb, Sparkles } from "lucide-react";
import { getRecommendedDegree } from "@/utils/recommendationEngine"; // Ensure this matches your file path

export default function PrioritiesGoalsForm({
  formData, // This prop IS the 'goals' object: { degrees: [...], statement: "..." }
  setFormData, // This prop IS the 'handleGoalsChange' function
  nextStep,
  prevStep,
}: {
  formData: any;
  setFormData: Function;
  nextStep: () => void;
  prevStep: () => void;
}) {
  
  // 🔽🔽🔽 --- NEW: RECOMMENDATION LOGIC --- 🔽🔽🔽
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleGetRecommendation = () => {
    // 1. Get the text from the statement field
    const textToAnalyze = formData.statement || "";

    // 2. Simple validation to ensure they typed something
    if (textToAnalyze.length < 10) {
      alert("Please write a short statement of your goals in the box below first, then click this button again!");
      return;
    }

    // 3. Run the algorithm (Using the statement as the 'skills' input)
    // We pass "Student" as job title, and the statement text as both skills and duties to maximize keyword hits
    const results = getRecommendedDegree("Student", textToAnalyze, textToAnalyze);
    
    setRecommendations(results);
    setShowRecommendations(true);
  };
  // 🔼🔼🔼 --- END OF RECOMMENDATION LOGIC --- 🔼🔼🔼


  // 🔽🔽🔽 --- SECTION 1: FIXED HANDLERS (UNCHANGED) --- 🔽🔽🔽
  const handleDegreeChange = (index: number, value: string) => {
    const currentDegrees = Array.isArray(formData.degrees) ? formData.degrees : [];
    const updated = [...currentDegrees];
    updated[index] = value;
    setFormData({ ...formData, degrees: updated });
  };

  const handleAddDegree = () => {
    const currentDegrees = Array.isArray(formData.degrees) ? formData.degrees : [];
    setFormData({ ...formData, degrees: [...currentDegrees, ""] });
  };

  const handleRemoveDegree = (index: number) => {
    const currentDegrees = Array.isArray(formData.degrees) ? formData.degrees : [];
    const updated = currentDegrees.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, degrees: updated });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const { degrees, statement } = formData;
    if (!Array.isArray(degrees) || degrees.some((d: string) => !d) || !statement?.trim()) {
      alert("Please complete all required fields before proceeding.");
      return;
    }
    nextStep();
  };
  // 🔼🔼🔼 --- END OF FIXED HANDLERS --- 🔼🔼🔼


  return (
    <form
      onSubmit={handleNext}
      className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col"
    >
      <div className="flex-1 overflow-y-auto max-h-[70vh] p-6">
        <h3 className="font-semibold text-lg mb-4 text-black">
          B. Priorities and Goals
        </h3>

        {/* 🔽🔽🔽 --- NEW: RECOMMENDATION UI SECTION --- 🔽🔽🔽 */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                        <Sparkles className="text-yellow-500" size={20} />
                        Unsure which degree to pick?
                    </h4>
                    <p className="text-sm text-blue-700 mt-1 max-w-md">
                        First, write your goal statement below. Then click here to let our system suggest the best degree for you.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleGetRecommendation}
                    className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                    <Lightbulb size={16} />
                    Analyze My Goals
                </button>
            </div>

            {/* Results Area */}
            {showRecommendations && (
                <div className="mt-5 pt-4 border-t border-blue-200 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Based on your goals, we recommend:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {recommendations.map((rec, index) => (
                            <div 
                                key={rec.id} 
                                className={`p-3 rounded-lg border flex justify-between items-center transition-all ${
                                    index === 0 
                                    ? 'bg-white border-blue-400 ring-2 ring-blue-100 shadow-sm' 
                                    : 'bg-white/60 border-gray-200'
                                }`}
                            >
                                <div>
                                    {index === 0 && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mb-1 inline-block">BEST MATCH</span>}
                                    <div className="text-sm font-bold text-gray-800 leading-tight">{rec.name}</div>
                                </div>
                                <div className="text-right pl-2">
                                    <span className="block text-lg font-bold text-blue-600">{rec.score}</span>
                                    <span className="text-[10px] text-gray-500">matches</span>
                                </div>
                            </div>
                        ))}
                        {recommendations.length === 0 && (
                            <p className="text-sm text-gray-500 italic col-span-2">
                                No specific keywords found. Try adding words like "computer", "business", or "teaching" to your statement below!
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
        {/* 🔼🔼🔼 --- END OF RECOMMENDATION UI SECTION --- 🔼🔼🔼 */}


        {/* Statement field - MOVED UP for better UX (Optional, but recommended) */}
        {/* I kept it in your original order below, but the logic works best if they type here first! */}

        {/* Degree selection */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold text-black">
            Degree program(s) being applied for:
          </label>
          
          {Array.isArray(formData.degrees) && formData.degrees.map((degree: string, index: number) => (
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
                  <option value="BSBA-LSCM">Logistics and Supply Chain Management</option>
                  <option value="BSBA-FM">Financial Management</option>
                  <option value="BSBA-HRM">Human Resources Management</option>
                  <option value="BSBA-MM">Marketing Management</option>
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
            value={formData.statement || ""}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg p-2 text-black"
            placeholder="E.g., I want to build software applications... or I want to manage a business..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Tip: Be specific about your interests so our recommendation engine can help you!
          </p>
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