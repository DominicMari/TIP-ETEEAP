"use client";

import { useState, useRef } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    formData.photo ? URL.createObjectURL(formData.photo) : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: "Image size must be less than 2MB.",
        }));
        return;
      }

      setPhotoPreview(URL.createObjectURL(file));
      setFormData({
        ...formData,
        photo: file,
      });
      if (errors.photo) setErrors((prev) => ({ ...prev, photo: "" }));
    }
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    const { name, degree, campus, folderLink, photo } = formData;

    if (!name?.trim()) newErrors.name = "Name is required.";
    if (!degree) newErrors.degree = "Degree is required.";
    if (!campus) newErrors.campus = "Campus is required.";
    if (!photo) newErrors.photo = "Photo is required.";

    if (!folderLink?.trim()) {
      newErrors.folderLink = "Folder link is required.";
    } else {
      try {
        new URL(folderLink);
      } catch {
        newErrors.folderLink = "Invalid URL format.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    } else {
      setTimeout(() => formRef.current?.reportValidity(), 0);
    }
  };

  return (
    <form
      ref={formRef}
      noValidate
      className="bg-white shadow-lg rounded-2xl w-7xl max-w p-6 ml-70 mr-70"
      onSubmit={(e) => { e.preventDefault(); validateAndProceed(); }}
    >
      <h2 className="text-center font-bold text-xl mb-4 text-black">
        APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
      </h2>

      <div className="grid grid-cols-3 gap-4 items-start mb-4">
        <div className="col-span-2">
          {/* Name */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
              Name of the Applicant: <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 text-black ${
                errors.name ? "border-red-500" : "border-gray-400"
              }`}
            />

          </div>

          {/* Degree */}
          <div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Degree Applied For: <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="degree"
                value={formData.degree || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.degree ? "border-red-500" : "border-gray-400"
                }`}
              >
                <option value="">Select degree</option>
                <option value="BSCS">BSCS (Computer Science)</option>
                <option value="BSIS">BSIS (Information Systems)</option>
                <option value="BSIT">BSIT (Information Technology)</option>
                <option value="BSCpE">BSCpE (Computer Engineering)</option>
                <option value="BSIE">BSIE (Industrial Engineering)</option>
                <optgroup label="Bachelor of Science in Business Administration">
                  <option value="BSBA-LSCM">BSBA (Logistics and Supply Chain Management)</option>
                  <option value="BSBA-FM">BSBA (Financial Management)</option>
                  <option value="BSBA-HRM">BSBA (Human Resources Management)</option>
                  <option value="BSBA-MM">BSBA (Marketing Management)</option>
                </optgroup>
              </select>

            </div>
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
            accept="image/jpeg,image/png"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <p className="text-sm mt-2 text-black">Add Photo <span className="text-red-500">*</span></p>

        </div>
      </div>

      {/* Campus */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-black">
          Campus: <span className="text-red-500">*</span>
        </label>
        <select
          required
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

      </div>

      {/* Folder Link */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-black">
          Folder Link (e.g., Google Drive): <span className="text-red-500">*</span>
        </label>
        <input
          required
          type="url"
          name="folderLink"
          value={formData.folderLink || ""}
          onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-black ${
            errors.folderLink ? "border-red-500" : "border-gray-400"
          }`}
        />

      </div>

      <button
        type="submit"
        className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-lg hover:bg-yellow-600"
      >
        Proceed →
      </button>
    </form>
  );
}