"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

export default function InitialForm({
  formData, // This is NOW formData.initial, e.g., { name: "...", degree: "..." }
  setFormData, // This is NOW handleInitialChange
  nextStep,
}: {
  formData: any;
  setFormData: Function;
  nextStep: () => void;
}) {
  // 🔽🔽🔽 --- FIX #1: Read from formData.photo --- 🔽🔽🔽
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    formData.photo ? URL.createObjectURL(formData.photo) : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔽🔽🔽 --- FIX #2: Update handleChange --- 🔽🔽🔽
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Call setFormData (which is handleInitialChange) with the new object for the 'initial' slice
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // 🔽🔽🔽 --- FIX #3: Update handlePhotoUpload --- 🔽🔽🔽
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors((prev) => ({
          ...prev,
          photo: "Image size must be less than 2MB.", // Use 'photo'
        }));
        return;
      }

      setPhotoPreview(URL.createObjectURL(file));
      // Update the 'initial' slice with the new file
      setFormData({
        ...formData,
        photo: file, // Use 'photo'
      });
      if (errors.photo) setErrors((prev) => ({ ...prev, photo: "" }));
    }
  };

  // 🔽🔽🔽 --- FIX #4: Update validateAndProceed --- 🔽🔽🔽
  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    
    // Destructure keys from formData (which is formData.initial)
    const { name, degree, campus, folderLink, photo } = formData;

    if (!name?.trim()) newErrors.name = "Name is required.";
    if (!degree) newErrors.degree = "Degree is required.";
    if (!campus) newErrors.campus = "Campus is required.";
    if (!photo) newErrors.photo = "Photo is required."; // Use 'photo'

    if (!folderLink?.trim()) {
      newErrors.folderLink = "Folder link is required.";
    } else {
      try {
        new URL(folderLink); // Simple check for valid URL format
      } catch {
        newErrors.folderLink = "Invalid URL format.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <form
      className="bg-white shadow-lg rounded-2xl w-full max-w-3xl p-6"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className="text-center font-bold text-xl mb-4 text-black">
        APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
      </h2>

      {/* 🔽🔽🔽 --- FIX #5: Update JSX props (name, value, errors) --- 🔽🔽🔽 */}
      <div className="grid grid-cols-3 gap-4 items-start mb-4">
        <div className="col-span-2">
          {/* Name */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
              Name of the Applicant: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name" // Use 'name'
              value={formData.name || ""} // Use 'name'
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 text-black ${
                errors.name ? "border-red-500" : "border-gray-400" // Use 'name'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p> // Use 'name'
            )}
          </div>

          {/* Degree */}
          <div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Degree Applied For: <span className="text-red-500">*</span>
              </label>
              <select
                name="degree" // Use 'degree'
                value={formData.degree || ""} // Use 'degree'
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.degree ? "border-red-500" : "border-gray-400" // Use 'degree'
                }`}
              >
                <option value="">Select degree</option>
                <option value="BSCS">BSCS (Computer Science)</option>
                
                {/* --- Here are the new options --- */}
                <option value="BSIS">BSIS (Information Systems)</option>
                <option value="BSIT">BSIT (Information Technology)</option>
                <option value="BSCpE">BSCpE (Computer Engineering)</option>
                <option value="BSIE">BSIE (Industrial Engineering)</option>

                {/* Using optgroup to match the grouping in your image */}
                <optgroup label="Bachelor of Science in Business Administration">
                  <option value="BSBA-LSCM">BSBA (Logistics and Supply Chain Management)</option>
                  <option value="BSBA-FM">BSBA (Financial Management)</option>
                  <option value="BSBA-HRM">BSBA (Human Resources Management)</option>
                  <option value="BSBA-MM">BSBA (Marketing Management)</option>
                </optgroup>
                {/* --- End of new options --- */}

              </select>
              {errors.degree && (
                <p className="text-red-500 text-sm mt-1">{errors.degree}</p> // Use 'degree'
              )}
            </div>
          </div>
        </div> 

        {/* Photo */}
        <div className="flex flex-col items-center justify-center">
          <label
            htmlFor="photo-upload"
            className={`w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer overflow-hidden ${
              errors.photo ? "ring-2 ring-red-500" : "" // Use 'photo'
            }`}
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="text-white w-8 h-8" />
            )}
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <p className="text-sm mt-2 text-black">Add Photo</p>
          {errors.photo && (
            <p className="text-red-500 text-sm mt-1">{errors.photo}</p> // Use 'photo'
          )}
        </div>
      </div>

      {/* Campus */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-black">
          Campus: <span className="text-red-500">*</span>
        </label>
        <select
          name="campus" // Use 'campus'
          value={formData.campus || ""} // Use 'campus'
          onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-black ${
            errors.campus ? "border-red-500" : "border-gray-400" // Use 'campus'
          }`}
        >
          <option value="">Select campus</option>
          <option value="QC">Quezon City</option>
          <option value="Manila">Manila</option>
        </select>
        {errors.campus && (
          <p className="text-red-500 text-sm mt-1">{errors.campus}</p> // Use 'campus'
        )}
      </div>

      {/* Folder Link */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-black">
          Folder Link (e.g., Google Drive): <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          name="folderLink" // Use 'folderLink'
          value={formData.folderLink || ""} // Use 'folderLink'
          onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-black ${
            errors.folderLink ? "border-red-500" : "border-gray-400" // Use 'folderLink'
          }`}
        />
        {errors.folderLink && (
          <p className="text-red-500 text-sm mt-1">{errors.folderLink}</p> // Use 'folderLink'
        )}
      </div>

      <button
        type="button"
        onClick={validateAndProceed}
        className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-lg hover:bg-yellow-600"
      >
        Proceed →
      </button>
    </form>
  );
}
