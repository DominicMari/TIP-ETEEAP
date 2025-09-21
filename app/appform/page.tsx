"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

const getTodayDateISO = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // 'YYYY-MM-DD'
};

export default function ApplicationForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    degree: "",
    campus: "",
    date: getTodayDateISO(), // Auto set to today on initialize
    folderLink: "",
    photo: null as File | null,
  });

  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
      setFormData((prev) => ({ ...prev, photo: file }));
      setErrors((prev) => ({ ...prev, photo: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.degree.trim()) newErrors.degree = "Degree is required.";
    if (!formData.campus.trim()) newErrors.campus = "Campus is required.";
    if (!formData.folderLink.trim()) newErrors.folderLink = "Folder link is required.";
    if (!formData.photo) newErrors.photo = "Photo is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("degree", formData.degree);
      formPayload.append("campus", formData.campus);
      formPayload.append("date", formData.date);
      formPayload.append("folderLink", formData.folderLink);
      if (formData.photo) {
        formPayload.append("photo", formData.photo);
      }

      const res = await fetch("/api/appform", {
        method: "POST",
        body: formPayload,
      });

      if (!res.ok) throw new Error("Failed to submit application");

      alert("Application submitted successfully!");
      router.push("/a");
    } catch (error: any) {
      alert(error.message || "Submission failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl w-full max-w-3xl p-6" noValidate>
        {/* Title */}
        <h2 className="text-center font-bold text-xl mb-4 text-black">APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM</h2>

        {/* First Row: Left (Name + Degree) | Right (Photo) */}
        <div className="grid grid-cols-3 gap-4 items-start mb-4">
          {/* Left side (Name + Degree) */}
          <div className="col-span-2">
            {/* Name */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold text-black">Name of the Applicant:</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-black placeholder-gray-600 ${
                  errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-400 focus:ring-blue-500"
                }`}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Degree */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-black">Degree Applied For:</label>
              <select
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none text-black ${
                  errors.degree ? "border-red-500 focus:ring-red-500" : "border-gray-400 focus:ring-blue-500"
                }`}
              >
                <option value="">Select degree</option>
                <option value="BSCS">BSCS (Computer Science)</option>
                <option value="BSIT">BSIT (Information Technology)</option>
                <option value="BSCpE">BSCpE (Computer Engineering)</option>
                <option value="BSEE">BSEE (Electrical Engineering)</option>
                <option value="BSIE">BSIE (Industrial Engineering)</option>

                <optgroup label="BSBA (Business Administration)">
                  <option value="Logistics">Logistics and Supply Chain Management</option>
                  <option value="Financial Management">Financial Management</option>
                  <option value="HRM">Human Resources Management</option>
                  <option value="MM">Marketing Management</option>
                </optgroup>
              </select>
              {errors.degree && <p className="text-red-600 text-sm mt-1">{errors.degree}</p>}
            </div>
          </div>

          {/* Right side (Photo Upload) */}
          <div className="flex flex-col items-center justify-center">
            <label
              htmlFor="photo-upload"
              className={`w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer hover:bg-yellow-500 transition overflow-hidden ${
                errors.photo ? "ring-2 ring-red-500" : ""
              }`}
            >
              {photo ? (
                <img src={photo} alt="Uploaded" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Camera className="text-white w-8 h-8" />
              )}
            </label>

            <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            {errors.photo && <p className="text-red-600 text-sm mt-1">{errors.photo}</p>}

            <p className="text-sm mt-2 text-black">Add Photo</p>
          </div>
        </div>

        {/* Second Row: Campus + Date */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">Campus:</label>
            <select
              name="campus"
              value={formData.campus}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none text-black ${
                errors.campus ? "border-red-500 focus:ring-red-500" : "border-gray-400 focus:ring-blue-500"
              }`}
            >
              <option value="">Select campus</option>
              <option value="QC">Quezon City</option>
              <option value="Manila">Manila</option>
            </select>
            {errors.campus && <p className="text-red-600 text-sm mt-1">{errors.campus}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">Date of Application:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              readOnly
              className="w-full border rounded-lg px-3 py-2 focus:outline-none text-black bg-gray-100 cursor-not-allowed"
            />
            {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
          </div>
        </div>

        {/* Third Row: Folder Link */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-semibold text-black">Folder Link:</label>
          <input
            type="url"
            name="folderLink"
            placeholder="https://drive.google.com/..."
            value={formData.folderLink}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none placeholder-gray-600 text-black ${
              errors.folderLink ? "border-red-500 focus:ring-red-500" : "border-gray-400 focus:ring-blue-500"
            }`}
          />
          {errors.folderLink && <p className="text-red-600 text-sm mt-1">{errors.folderLink}</p>}
        </div>

        {/* Warning */}
        <div className="bg-yellow-100 text-black p-3 rounded-lg text-sm mb-4 leading-relaxed">
          ⚠️Direction. Please accomplish the following information needed. Do not leave items unanswered. Indicate 'Not applicable' as the case may be. All information declared in this file is under oath as well as submitted. Discovery of false information shall be disqualified from participating in the program.
        </div>

        {/* Submit */}
        <button type="submit" className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-lg hover:bg-yellow-600 transition-colors">
          Proceed →
        </button>
      </form>
    </div>
  );
}
