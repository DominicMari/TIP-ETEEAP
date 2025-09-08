"use client";
import { useState } from "react";

export default function PersonalInformationForm() {
  const [formData, setFormData] = useState({
    name: "",
    cityAddress: "",
    permanentAddress: "",
    birthday: "",
    birthplace: "",
    age: "",
    gender: "",
    nationality: "",
    religion: "",
    civilStatus: "",
    email: "",
    telephone: "",
    mobile: "",
    language: "",
    emergencyContact: "",
    relationship: "",
    emergencyAddress: "",
    emergencyGender: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    console.log("Next clicked, data:", formData);
    // Navigate to page 2
  };

  const handleBack = () => {
    console.log("Back clicked");
    // Navigate back to welcome/previous step
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col">
        {/* Title */}
        <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>

        {/* Scrollable Section */}
        <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 px-6 pt-4 pb-6">
          <h3 className="font-semibold text-lg mb-4 text-black">
            A. Personal Information
          </h3>

          {/* Name */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-black">
              Name of the Applicant:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100"
              />
              <input className="border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
              <input className="border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
          </div>

          {/* City & Permanent Address */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-black">
              City Address:
            </label>
            <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-black">
              Permanent Address:
            </label>
            <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
          </div>

          {/* Birthday & Birthplace */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-black">
                Birthday:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black">
                Birthplace:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-black">
                Age:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black">
                Gender:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
          </div>

          {/* Nationality & Religion */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-black">
                Nationality:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black">
                Religion:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
          </div>

          {/* Civil Status & Email */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-black">
                Civil Status:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black">
                Email Address:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
          </div>

          {/* Telephone & Mobile */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-black">
                Telephone No.:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black">
                Mobile Number:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
          </div>

          {/* Language Spoken */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-black">
              Language Spoken:
            </label>
            <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-black">
                Contact Person in case of emergency:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black">
                Relationship:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
          </div>

          {/* Emergency Address & Gender */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-black">
                Address:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black">
                Gender:
              </label>
              <input className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-gray-100" />
            </div>
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