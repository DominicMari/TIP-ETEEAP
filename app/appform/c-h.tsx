"use client";

import { useState, useRef } from "react";
import { Plus, Minus, Lightbulb, Sparkles, AlertCircle } from "lucide-react";
import { getRecommendedDegree, getInputGuidance } from "@/utils/recommendationEngine";

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
  
  // recommendation logic
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [guidance, setGuidance] = useState<{ message: string; suggestions: string[] } | null>(null);
  const [statementError, setStatementError] = useState(false);
  const [formError, setFormError] = useState("");
  const statementRef = useRef<HTMLTextAreaElement>(null);

  const handleGetRecommendation = () => {
    const textToAnalyze = formData.statement || "";
    if (textToAnalyze.trim().length < 10) {
      setStatementError(true);
      statementRef.current?.focus();
      const check = getInputGuidance(textToAnalyze);
      setGuidance({ message: check.message, suggestions: check.suggestions });
      setRecommendations([]);
      setShowRecommendations(true);
      return;
    }
    setStatementError(false);
    const check = getInputGuidance(textToAnalyze);
    setGuidance(!check.isReady ? { message: check.message, suggestions: check.suggestions } : null);
    const results = getRecommendedDegree("Student", textToAnalyze, textToAnalyze);
    setRecommendations(results);
    setShowRecommendations(true);
  };
  // recommendation logic end


  // Handlers section
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
    if (name === "statement") {
      setStatementError(false);
      setFormError("");
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const { degrees, statement } = formData;
    if (!Array.isArray(degrees) || degrees.some((d: string) => !d) || !statement?.trim()) {
      setFormError("Please complete all required fields before proceeding.");
      if (!statement?.trim()) setStatementError(true);
      return;
    }
    setFormError("");
    nextStep();
  };
  // end of handlers


  return (
    <form
      onSubmit={handleNext}
      className="bg-white shadow-lg rounded-2xl w-7xl max-w flex flex-col"
    >
      <div className="flex-1 overflow-y-auto max-h-[70vh] p-6">
        <h3 className="font-semibold text-lg mb-4 text-black">
          B. Priorities and Goals
        </h3>

        {/* Inline form error banner */}
        {formError && (
          <div className="flex items-center gap-2 mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {formError}
          </div>
        )}

        {/* Degree selection */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold text-black">
           1. Degree program(s) being applied for: <span className="text-red-500">*</span>
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
           2. Statement of your goals: <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={statementRef}
            name="statement"
            rows={4}
            value={formData.statement || ""}
            onChange={handleChange}
            className={`w-full border rounded-lg p-2 text-black transition-colors ${
              statementError ? "border-red-500 bg-red-50" : "border-gray-400"
            }`}
            placeholder="E.g., I want to build software applications... or I want to manage a business..."
          />
          {statementError && (
            <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
              <AlertCircle size={12} /> Please write your goal statement first.
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Tip: Be specific about your interests so our recommendation engine can help you!
          </p>
        </div>

        {/* Recommendation */}
        <div className="mb-8 bg-gradient-to-r from-orange-50 to-yellow-50 border border-yellow-200 rounded-xl p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h4 className="font-bold text-yellow-900 flex items-center gap-2">
                        <Sparkles className="text-yellow-500" size={20} />
                        Unsure which degree to pick?
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1 max-w-md">
                        First, write your goal statement above. Then click here to let our system suggest the best degree for you.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleGetRecommendation}
                    className="whitespace-nowrap px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                    <Lightbulb size={16} />
                    Analyze My Goals
                </button>
            </div>

            {/* Results Area */}
            {showRecommendations && (
                <div className="mt-5 pt-4 border-t border-amber-200 animate-in fade-in slide-in-from-top-2">
                    {guidance ? (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-amber-800">
                                {guidance.message}
                            </p>
                            <ul className="space-y-2">
                                {guidance.suggestions.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                                        <span className="text-amber-500 mt-0.5">💡</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Based on your goals, we recommend:
                            </p>
                            <div className="grid gap-3 sm:grid-cols-1">
                                {recommendations.map((rec, index) => (
                                    <div 
                                        key={rec.id} 
                                        className={`p-4 rounded-lg border transition-all ${
                                            index === 0 
                                            ? 'bg-white border-yellow-400 ring-2 ring-yellow-100 shadow-sm' 
                                            : 'bg-white/60 border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                {index === 0 && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mb-1 inline-block">BEST MATCH</span>}
                                                <div className="text-sm font-bold text-gray-800 leading-tight">{rec.name}</div>
                                            </div>
                                            <span className={`text-xs font-bold whitespace-nowrap ml-2 px-2 py-0.5 rounded-full ${
                                              rec.matchLabel === 'Strong Match' ? 'bg-green-100 text-green-700' :
                                              rec.matchLabel === 'Good Match'   ? 'bg-yellow-100 text-yellow-700' :
                                                                                  'bg-gray-100 text-gray-500'
                                            }`}>
                                              {rec.matchLabel ?? 'Possible Match'}
                                            </span>
                                        </div>
                                        {rec.reasons && rec.reasons.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {rec.reasons.map((reason: string, ri: number) => (
                                                    <li key={ri} className="text-xs text-gray-600 flex items-start gap-1.5">
                                                        <span className="text-yellow-400 mt-0.5">•</span>
                                                        <span>{reason}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                                {recommendations.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">
                                        We couldn&apos;t find a strong match. Try being more specific about your work experience, skills, or career goals.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* 3. Learning plan */}
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
              4. For overseas applicants (otherwise, please indicate "Not
              Applicable"), describe how you plan to conduct collaborative
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
              name="completion"
              rows={3}
              value={formData.completion}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
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