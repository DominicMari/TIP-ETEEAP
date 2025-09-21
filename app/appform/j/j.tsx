"use client";
import { useState } from "react";

export default function LifelongLearningForm() {
  const [formData, setFormData] = useState({
    hobbies: "",
    skills: "",
    workActivities: "",
    volunteer: "",
    travels: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    console.log("Next clicked, data:", formData);
    // Navigate to page K
  };

  const handleBack = () => {
    console.log("Back clicked");
    // Navigate to page I
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
            Please indicate the various life experiences from which you must have derived some learning experiences
          </span>
        </div>

        {/* Scrollable Section */}
        <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] 
                        scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 px-6 pt-4 pb-6">
          {/* Section Title */}
          <h3 className="font-semibold text-lg mb-4 text-black">
            J. Lifelong Learning Experience
          </h3>

          {/* 1. Hobbies */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold text-black">
              1. Hobbies/Leisure Activities{" "}
              <span className="italic font-normal text-gray-600">
                (Leisure activities that involve rating of skills for competition and other purposes 
                may also indicate your level for ease in evaluation. On the other hand, considered a learning opportunity)
              </span>
            </label>
            <textarea
              name="hobbies"
              rows={3}
              value={formData.hobbies}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

          {/* 2. Special Skills */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold text-black">
              2. Special Skills{" "}
              <span className="italic font-normal text-gray-600">
                (Note down those special skills you think must be related to the field of study you want to pursue.)
              </span>
            </label>
            <textarea
              name="skills"
              rows={3}
              value={formData.skills}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

          {/* 3. Work-Related Activities */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold text-black">
              3. Work-Related Activities{" "}
              <span className="italic font-normal text-gray-600">
                (Some work-related activities are occasions for you to learn something new... 
                Do not include formal training programs already cited. You may include here 
                experiences that can be classified as on-the-job training or apprenticeship.)
              </span>
            </label>
            <textarea
              name="workActivities"
              rows={3}
              value={formData.workActivities}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

          {/* 4. Volunteer Activities */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold text-black">
              4. Volunteer Activities{" "}
              <span className="italic font-normal text-gray-600">
                (List only volunteer activities that demonstrate learning opportunities, 
                and are related to the course you are applying for credit.)
              </span>
            </label>
            <textarea
              name="volunteer"
              rows={3}
              value={formData.volunteer}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
            />
          </div>

          {/* 5. Travels */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold text-black">
              5. Travels: Cite places visited and purpose of travel{" "}
              <span className="italic font-normal text-gray-600">
                (Include a write-up of the nature of travel undertaken, whether for leisure, employment, 
                business, or other purposes. State in clear terms what new learning experience 
                was obtained from these travels.)
              </span>
            </label>
            <textarea
              name="travels"
              rows={3}
              value={formData.travels}
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