"use client";

export default function LifelongLearningForm({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: {
  formData: any; // This prop is *actually* the lifelongLearning object
  setFormData: (data: any) => void; // This prop is handleLearningChange
  nextStep: () => void;
  prevStep: () => void;
}) {
  // ✅ FIX: The 'setFormData' prop is handleLearningChange, 
  // which expects the new lifelongLearning object.
  // 'formData' *is* the lifelongLearning object.
  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  // ✅ FIX: Add a default object to prevent errors if formData is undefined on load
  const data = formData || {
    hobbies: "",
    skills: "",
    workActivities: "",
    volunteer: "",
    travels: "",
  };

  return (
    <form
      onSubmit={handleNext}
      className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col"
    >
      <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
        APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
      </h2>

      <div className="bg-yellow-100 text-black px-6 py-3 rounded-lg text-sm mb-4 leading-relaxed flex items-center gap-2 mx-auto w-full max-w-2xl text-center shadow">
        <span>⚠️</span>
        <span>
          Please indicate the various life experiences from which you must have
          derived some learning experiences.
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 px-6 pt-4 pb-6">
        <h3 className="font-semibold text-lg mb-4 text-black">
          J. Lifelong Learning Experience
        </h3>

        {/* 1. Hobbies/Leisure Activities */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-semibold text-black">
            1. Hobbies/Leisure Activities <span className="text-red-500">*</span>
            <span className="italic font-normal text-gray-600">
              {" "}
              (Leisure activities that involve rating of skills...)
            </span>
          </label>
          <textarea
            name="hobbies"
            rows={3}
            required
            // ✅ FIX: Read from data.hobbies
            value={data.hobbies}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
          />
        </div>

        {/* 2. Special Skills */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-semibold text-black">
            2. Special Skills <span className="text-red-500">*</span>
            <span className="italic font-normal text-gray-600">
              {" "}
              (Note down those special skills...)
            </span>
          </label>
          <textarea
            name="skills"
            rows={3}
            required
            // ✅ FIX: Read from data.skills
            value={data.skills}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
          />
        </div>

        {/* 3. Work-Related Activities */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-semibold text-black">
            3. Work-Related Activities <span className="text-red-500">*</span>
            <span className="italic font-normal text-gray-600">
              {" "}
              (Some work-related activities are occasions for you to learn
              something new...)
            </span>
          </label>
          <textarea
            name="workActivities"
            rows={3}
            required
            // ✅ FIX: Read from data.workActivities
            value={data.workActivities}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
          />
        </div>

        {/* 4. Volunteer Activities */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-semibold text-black">
            4. Volunteer Activities <span className="text-red-500">*</span>
            <span className="italic font-normal text-gray-600">
              {" "}
              (List only volunteer activities that demonstrate learning
              opportunities...)
            </span>
          </label>
          <textarea
            name="volunteer"
            rows={3}
            required
            // ✅ FIX: Read from data.volunteer
            value={data.volunteer}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
          />
        </div>

        {/* 5. Travels */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-semibold text-black">
            5. Travels: Cite places visited and purpose of travel <span className="text-red-500">*</span>
            <span className="italic font-normal text-gray-600">
              {" "}
              (Include a write-up of the nature of travel undertaken...)
            </span>
          </label>
          <textarea
            name="travels"
            rows={3}
            required
            // ✅ FIX: Read from data.travels
            value={data.travels}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-2 px-6 pb-4">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Next →
        </button>
      </div>
    </form>
  );
}
