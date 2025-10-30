// appform/a.tsx
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      initial: { ...prev.initial, [name]: value },
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size (optional)
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          photo: "Only JPG or PNG images are allowed.",
        }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        setErrors((prev) => ({
          ...prev,
          photo: "Image size must be less than 2MB.",
        }));
        return;
      }

      setPhotoPreview(URL.createObjectURL(file));
      setFormData((prev: any) => ({
        ...prev,
        initial: { ...prev.initial, photo: file },
      }));
      if (errors.photo) setErrors((prev) => ({ ...prev, photo: "" }));
    }
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    const name = formData.initial.name?.trim() || "";
    const degree = formData.initial.degree || "";
    const campus = formData.initial.campus || "";
    const folderLink = formData.initial.folderLink?.trim() || "";
    const photo = formData.initial.photo || null;

    // Name
    if (!name) newErrors.name = "Name is required.";
    else if (name.length < 3)
      newErrors.name = "Name must be at least 3 characters.";

    // Degree
    if (!degree) newErrors.degree = "Degree is required.";

    // Campus
    if (!campus) newErrors.campus = "Campus is required.";

    // Folder link validation
    if (!folderLink) newErrors.folderLink = "Folder link is required.";
    else {
      try {
        const url = new URL(folderLink);
        if (
          !url.hostname.includes("drive.google.com") &&
          !url.hostname.includes("dropbox.com") &&
          !url.hostname.includes("onedrive.live.com")
        ) {
          newErrors.folderLink = "Please provide a valid shared folder link.";
        }
      } catch {
        newErrors.folderLink = "Invalid URL format.";
      }
    }

    // Photo validation
    if (!photo) newErrors.photo = "Photo is required.";

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
              name="name"
              value={formData.initial.name}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 text-black ${
                errors.name ? "border-red-500" : "border-gray-400"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Degree */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Degree Applied For:
            </label>
            <select
              name="degree"
              value={formData.initial.degree}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 text-black ${
                errors.degree ? "border-red-500" : "border-gray-400"
              }`}
            >
              <option value="">Select degree</option>
              <option value="BSCS">BSCS (Computer Science)</option>
              <option value="BSIT">BSIT (Information Technology)</option>
              <option value="BSIS">BSIS (Information Systems)</option>
              <option value="BSCpE">BSCpE (Computer Engineering)</option>
              <option value="BSIE">BSIE (Industrial Engineering)</option>
              <optgroup label="BSBA (Business Administration)">
                <option value="Logistics and Supply Chain Management">
                  Logistics and Supply Chain Management
                </option>
                <option value="Financial Management">Financial Management</option>
                <option value="Human Resources Management">
                  Human Resources Management
                </option>
                <option value="Marketing Management">
                  Marketing Management
                </option>
              </optgroup>
            </select>
            {errors.degree && (
              <p className="text-red-500 text-sm mt-1">{errors.degree}</p>
            )}
          </div>
        </div>

        {/* Photo */}
        <div className="flex flex-col items-center justify-center">
          <label
            htmlFor="photo-upload"
            className={`w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer overflow-hidden ${
              errors.photo ? "ring-2 ring-red-500" : ""
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
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <p className="text-sm mt-2 text-black">Add Photo</p>
          {errors.photo && (
            <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
          )}
        </div>
      </div>

      {/* Campus + Date */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2 text-sm font-semibold text-black">
            Campus:
          </label>
          <select
            name="campus"
            value={formData.initial.campus}
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

        <div>
          <label className="block mb-2 text-sm font-semibold text-black">
            Date of Application:
          </label>
          <input
            type="date"
            name="date"
            value={formData.initial.date}
            readOnly
            className="w-full border rounded-lg px-3 py-2 text-black bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Folder Link */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-black">
          Folder Link (e.g., Google Drive):
        </label>
        <input
          type="url"
          name="folderLink"
          value={formData.initial.folderLink}
          onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-black ${
            errors.folderLink ? "border-red-500" : "border-gray-400"
          }`}
        />
        {errors.folderLink && (
          <p className="text-red-500 text-sm mt-1">{errors.folderLink}</p>
        )}
      </div>

      {/* Proceed */}
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