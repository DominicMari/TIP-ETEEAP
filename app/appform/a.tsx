"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

export default function InitialForm({
  formData,
  setFormData,
  nextStep,
}: {
  formData: any;
  setFormData: Function;
  nextStep: () => void;
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    formData.photoFile ? URL.createObjectURL(formData.photoFile) : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors((prev) => ({
          ...prev,
          photoFile: "Image size must be less than 2MB.",
        }));
        return;
      }

      setPhotoPreview(URL.createObjectURL(file));
      setFormData((prev: any) => ({
        ...prev,
        photoFile: file,
      }));
      if (errors.photoFile) setErrors((prev) => ({ ...prev, photoFile: "" }));
    }
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    
    const { applicantName, degreeAppliedFor, campus, folderLink, photoFile } = formData;

    if (!applicantName?.trim()) newErrors.applicantName = "Name is required.";
    if (!degreeAppliedFor) newErrors.degreeAppliedFor = "Degree is required.";
    if (!campus) newErrors.campus = "Campus is required.";
    if (!photoFile) newErrors.photoFile = "Photo is required.";

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

      <div className="grid grid-cols-3 gap-4 items-start mb-4">
        <div className="col-span-2">
          {/* Name */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
              Name of the Applicant:
            </label>
            <input
              type="text"
              name="applicantName"
              value={formData.applicantName || ""}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 text-black ${
                errors.applicantName ? "border-red-500" : "border-gray-400"
              }`}
            />
            {errors.applicantName && (
              <p className="text-red-500 text-sm mt-1">{errors.applicantName}</p>
            )}
          </div>

          {/* Degree */}
          <div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Degree Applied For:
              </label>
              <select
                name="degreeAppliedFor"
                value={formData.degreeAppliedFor || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.degreeAppliedFor ? "border-red-500" : "border-gray-400"
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
              {errors.degreeAppliedFor && (
                <p className="text-red-500 text-sm mt-1">{errors.degreeAppliedFor}</p>
              )}
            </div>
          </div>
        </div> 

        {/* Photo */}
        <div className="flex flex-col items-center justify-center">
          <label
            htmlFor="photo-upload"
            className={`w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer overflow-hidden ${
              errors.photoFile ? "ring-2 ring-red-500" : ""
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
          {errors.photoFile && (
            <p className="text-red-500 text-sm mt-1">{errors.photoFile}</p>
          )}
        </div>
      </div>

      {/* Campus */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-black">
          Campus:
        </label>
        <select
          name="campus"
          value={formData.campus || ""}
          onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-black ${
            errors.campus ? "border-red-500" : "border-gray-400"
          }`}
        >
          <option value="">Select campus</option>
          <option value="QC">Quezon City</option>
          <option value="Manila">Manila</option>
        </select>
        {errors.campus && (
          <p className="text-red-500 text-sm mt-1">{errors.campus}</p>
        )}
      </div>

      {/* Folder Link */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-black">
          Folder Link (e.g., Google Drive):
        </label>
        <input
          type="url"
          name="folderLink"
          value={formData.folderLink || ""}
          onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-black ${
            errors.folderLink ? "border-red-500" : "border-gray-400"
          }`}
        />
        {errors.folderLink && (
          <p className="text-red-500 text-sm mt-1">{errors.folderLink}</p>
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