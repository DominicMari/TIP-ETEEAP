"use client";
import { useState } from "react";
import { Camera } from "lucide-react";

export default function ApplicationForm() {
  const [formData, setFormData] = useState({
    name: "",
    degree: "",
    campus: "",
    date: "",
    folderLink: "",
    photo: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const [photo, setPhoto] = useState<string | null>(null);
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Form submitted! Check console for details.");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl w-full max-w-3xl p-6"
      >
        {/* Title */}
        <h2 className="text-center font-bold text-xl mb-4 text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>

        {/* First Row: Left (Name + Degree) | Right (Photo) */}
        <div className="grid grid-cols-3 gap-4 items-start mb-4">
          {/* Left side (Name + Degree) */}
          <div className="col-span-2">
            {/* Name */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold text-black">
                Name of the Applicant:
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           text-black placeholder-gray-600"
                required
              />
            </div>

            {/* Degree */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Degree Applied For:
              </label>
              <select
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           text-black"
                required
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
            </div>
          </div>

          {/* Right side (Photo Upload) */}
          <div className="flex flex-col items-center justify-center">
            <label
              htmlFor="photo-upload"
              className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer hover:bg-yellow-500 transition overflow-hidden"
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Uploaded"
                  className="w-full h-full object-cover rounded-full"
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
          </div>
        </div>

        {/* Second Row: Campus + Date */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Campus:
            </label>
            <select
              name="campus"
              value={formData.campus}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         text-black"
              required
            >
              <option value="">Select campus</option>
              <option value="QC">Quezon City</option>
              <option value="Manila">Manila</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Date of Application:
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-lg px-3 py-2 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         text-black"
              required
            />
          </div>
        </div>

        {/* Third Row: Folder Link */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-semibold text-black">
            Folder Link:
          </label>
          <input
            type="url"
            name="folderLink"
            placeholder="https://drive.google.com/..."
            value={formData.folderLink}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded-lg px-3 py-2 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       text-black placeholder-gray-600"
          />
        </div>

        {/* Warning */}
        <div className="bg-yellow-100 text-black p-3 rounded-lg text-sm mb-4 leading-relaxed">
          ⚠️Direction. Please accomplish the following information needed. Do not leave items unanswered. Indicate 'Not applicable' as the case may be. All information declared in this file is under oath as well as submitted. Discovery of false information shall be disqualified from participating in the program.

        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-lg 
                     hover:bg-yellow-600 transition-colors"
        >
          Proceed →
        </button>
      </form>
    </div>
  );
}